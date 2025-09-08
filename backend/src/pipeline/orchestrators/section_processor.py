"""
Section processing orchestrator.
"""

import asyncio
from typing import Dict, List, Optional
from langchain_core.runnables import RunnableConfig
from rich import print

from ..interfaces import (
    TranscriptSection,
    SectionAnalysis,
    ContentAnalyzer,
    EntityExplanation,
)
from ..services.enrichment import EntityEnricher
from ..utils import format_seconds_to_timestamp
from ..config import get_persona_config


class SectionProcessingResult:
    """Result of processing a single section."""

    def __init__(
        self,
        status: str,
        full_analysis: Optional[SectionAnalysis] = None,
        cost_metrics: Optional[Dict[str, int]] = None,
        index: int = -1,
    ):
        self.status = status
        self.full_analysis = full_analysis
        self.cost_metrics = cost_metrics or {}
        self.index = index


class SectionProcessor:
    """Orchestrates the analysis of individual transcript sections."""

    def __init__(
        self,
        content_analyzer: ContentAnalyzer,
        entity_enricher: EntityEnricher,
        db_manager,
        persona: str = "general",
    ):
        self.analyzer = content_analyzer
        self.enricher = entity_enricher
        self.db_manager = db_manager
        self.persona = persona
        self.persona_config = get_persona_config(persona)

    async def process_section(
        self,
        section: TranscriptSection,
        section_index: int,
        user_id: str,
        job_id: str,
        runnable_config: RunnableConfig,
    ) -> SectionProcessingResult:
        """
        Process a single transcript section with full analysis and enrichment.
        """
        log_prefix = f"  - [Section {section_index + 1}]"

        # Format time strings
        start_time_str = format_seconds_to_timestamp(section.start_time)
        end_time_str = format_seconds_to_timestamp(section.end_time)

        progress_msg = f"{log_prefix} Analysis initiated. (Time: {start_time_str} - {end_time_str})"
        print(f"      [cyan]L {progress_msg}[/cyan]")
        self.db_manager.log_progress(
            user_id, job_id, f"Section {section_index + 1} analysis initiated."
        )

        # Check if results already exist
        section_doc_id = f"section_{section_index:03d}"
        if self.db_manager.does_section_result_exist(user_id, job_id, section_doc_id):
            log_msg = f"{log_prefix} Result already exists. Skipping."
            print(f"      [green]L {log_msg}[/green]")
            existing_data = self.db_manager.get_section_result(
                user_id, job_id, section_doc_id
            )

            # Convert existing data to SectionAnalysis if needed
            section_analysis = self._convert_to_section_analysis(
                existing_data, start_time_str, end_time_str
            )

            return SectionProcessingResult(
                status="skipped", full_analysis=section_analysis, cost_metrics={}
            )

        # Prepare content for analysis
        content_for_llm = "\n".join(
            [
                f"{utterance.speaker_id}: {utterance.text}"
                for utterance in section.utterances
            ]
        )

        total_cost_metrics = {"tavily_searches": 0}

        try:
            # Step 1: Perform content analysis
            analysis_result = await self.analyzer.analyze_content(
                content_for_llm, runnable_config
            )

            if not analysis_result:
                log_msg = f"{log_prefix} No analysis result returned from content analyzer"
                print(f"      [red]L {log_msg}[/red]")
                self.db_manager.log_progress(user_id, job_id, log_msg)
                return SectionProcessingResult(
                    status="skipped_no_data", index=section_index, cost_metrics={}
                )

            # Step 2: Process claims based on persona
            claim_for_section = ""
            if analysis_result.claims:
                if self.persona == "consultant":
                    # For consultants, take the first open question
                    claim_for_section = analysis_result.claims[0]
                else:
                    # For general persona, filter to find the best claim
                    claim_for_section = await self.analyzer.filter_claims(
                        analysis_result.claims, content_for_llm, runnable_config
                    )

            # Step 3: Enrich entities
            enrichment_result = await self.enricher.enrich_entities(
                analysis_result.entities,
                content_for_llm,
                section_index,
            )

            # Combine cost metrics
            entity_costs = enrichment_result.get("cost_metrics", {})
            for key, value in entity_costs.items():
                total_cost_metrics[key] = total_cost_metrics.get(key, 0) + value

            # Step 4: Convert to final format
            explanations_map = enrichment_result.get("explanations", {})
            entity_explanations = self.enricher.convert_to_entity_explanations(
                analysis_result.entities, explanations_map
            )

            # Create final section analysis
            section_analysis = SectionAnalysis(
                start_time=start_time_str,
                end_time=end_time_str,
                title=analysis_result.title,
                summary=analysis_result.summary,
                quotes=analysis_result.quotes,
                entities=entity_explanations,
                contextual_briefing={},  # Will be filled later if needed
                additional_data=analysis_result.additional_data,
            )

            # Step 5: Save results
            section_result_dict = self._convert_to_dict(section_analysis)
            self.db_manager.save_section_result(
                user_id, job_id, section_index, section_result_dict
            )
            self.db_manager.log_progress(
                user_id,
                job_id,
                f"✓ Section {section_index + 1}: Analysis complete and saved.",
            )

            return SectionProcessingResult(
                status="processed",
                full_analysis=section_analysis,
                cost_metrics=total_cost_metrics,
            )

        except Exception as e:
            log_msg = f"{log_prefix} Error during analysis: {e}"
            print(f"      [bold red]L {log_msg}[/bold red]")
            self.db_manager.log_progress(user_id, job_id, log_msg)
            
            # Log the full exception for debugging
            import traceback
            traceback_msg = f"{log_prefix} Full traceback: {traceback.format_exc()}"
            print(f"      [red]{traceback_msg}[/red]")
            self.db_manager.log_progress(user_id, job_id, traceback_msg)

            return SectionProcessingResult(
                status="failed",
                cost_metrics=total_cost_metrics,
                index=section_index,
            )

    async def process_sections_parallel(
        self,
        sections: List[TranscriptSection],
        user_id: str,
        job_id: str,
        runnable_config: RunnableConfig,
        max_concurrent: int = 5,
    ) -> List[SectionProcessingResult]:
        """
        Process multiple sections in parallel with concurrency control.
        """
        semaphore = asyncio.Semaphore(max_concurrent)

        async def process_with_semaphore(section: TranscriptSection, index: int):
            async with semaphore:
                return await self.process_section(
                    section, index, user_id, job_id, runnable_config
                )

        tasks = [
            process_with_semaphore(section, i) for i, section in enumerate(sections)
        ]

        return await asyncio.gather(*tasks)

    def _convert_to_section_analysis(
        self, data: Dict, start_time: str, end_time: str
    ) -> SectionAnalysis:
        """Convert dictionary data to SectionAnalysis object."""
        entities_list = data.get("entities", [])
        entity_explanations = []

        for entity_data in entities_list:
            if isinstance(entity_data, dict):
                entity_explanations.append(
                    EntityExplanation(
                        name=entity_data.get("name", ""),
                        explanation=entity_data.get("explanation", ""),
                    )
                )
            elif isinstance(entity_data, str):
                # Handle legacy format
                entity_explanations.append(
                    EntityExplanation(
                        name=entity_data, explanation="No explanation available."
                    )
                )

        return SectionAnalysis(
            start_time=start_time,
            end_time=end_time,
            title=data.get("generated_title", data.get("section_title", "")),
            summary=data.get("1_sentence_summary", data.get("executive_summary", data.get("section_summary", ""))),
            quotes=data.get("notable_quotes", data.get("critical_quotes", [])),
            entities=entity_explanations,
            contextual_briefing=data.get("contextual_briefing", {}),
            additional_data={
                k: v
                for k, v in data.items()
                if k
                not in [
                    "start_time",
                    "end_time",
                    "generated_title",
                    "section_title",
                    "1_sentence_summary",
                    "executive_summary",
                    "notable_quotes",
                    "critical_quotes",
                    "entities",
                    "contextual_briefing",
                ]
            },
        )

    def _convert_to_dict(self, analysis: SectionAnalysis) -> Dict:
        """Convert SectionAnalysis to dictionary for database storage."""
        base_dict = {
            "start_time": analysis.start_time,
            "end_time": analysis.end_time,
            "generated_title": analysis.title,
            "1_sentence_summary": analysis.summary,
            "notable_quotes": analysis.quotes,
            "entities": [
                {"name": e.name, "explanation": e.explanation}
                for e in analysis.entities
            ],
        }

        # Add additional data, but handle learning accelerator persona specially
        if self.persona == "learning_accelerator":
            # For learning accelerator, explicitly include lessons_and_concepts
            base_dict["lessons_and_concepts"] = analysis.additional_data.get("lessons_and_concepts", [])
            base_dict["key_points"] = analysis.additional_data.get("key_points", [])
            base_dict["section_summary"] = analysis.additional_data.get("section_summary", "")
            
            # Include other additional data except contextual_briefing (deprecated)
            for key, value in analysis.additional_data.items():
                if key not in ["lessons_and_concepts", "key_points", "section_summary", "contextual_briefing"]:
                    base_dict[key] = value
        else:
            # For other personas, include contextual_briefing and all additional data
            base_dict["contextual_briefing"] = analysis.contextual_briefing
            base_dict.update(analysis.additional_data)

        return base_dict
