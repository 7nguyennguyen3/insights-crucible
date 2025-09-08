"""
Main analysis pipeline orchestrator.
"""

import time
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from langchain_core.runnables import RunnableConfig
from rich import print
from rich.panel import Panel

from ..interfaces import (
    TranscriptNormalizer,
    TranscriptSegmenter,
    AudioProcessor,
    MetaAnalyzer,
    TitleGenerator,
    TranscriptUtterance,
    SectionAnalysis,
)
from ..services.enrichment import ClaimProcessor, ContextualBriefingGenerator
from ..config import get_persona_config, is_valid_persona
from .section_processor import SectionProcessor


@dataclass
class AnalysisRequest:
    """Request for pipeline analysis."""

    user_id: str
    job_id: str
    persona: str
    transcript_id: Optional[str] = None
    storage_path: Optional[str] = None
    raw_transcript: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    model_choice: str = "universal"

    def __post_init__(self):
        if self.config is None:
            self.config = {}


@dataclass
class AnalysisResult:
    """Result of pipeline analysis."""

    job_id: str
    status: str
    final_title: str
    sections_processed: int
    cost_metrics: Dict[str, Any]
    timing_metrics: Dict[str, float]
    synthesis_results: Dict[str, Any]
    error_message: Optional[str] = None


class AnalysisPipeline:
    """Main orchestrator for the analysis pipeline."""

    def __init__(
        self,
        transcript_normalizer: TranscriptNormalizer,
        youtube_normalizer: TranscriptNormalizer,
        segmenter: TranscriptSegmenter,
        audio_processor: AudioProcessor,
        section_processor: SectionProcessor,
        meta_analyzer: MetaAnalyzer,
        title_generator: TitleGenerator,
        claim_processor: ClaimProcessor,
        briefing_generator: ContextualBriefingGenerator,
        db_manager,
        token_tracker,
    ):
        self.transcript_normalizer = transcript_normalizer
        self.youtube_normalizer = youtube_normalizer
        self.segmenter = segmenter
        self.audio_processor = audio_processor
        self.section_processor = section_processor
        self.meta_analyzer = meta_analyzer
        self.title_generator = title_generator
        self.claim_processor = claim_processor
        self.briefing_generator = briefing_generator
        self.db_manager = db_manager
        self.token_tracker = token_tracker

    async def run_analysis(self, request: AnalysisRequest) -> AnalysisResult:
        """
        Execute the complete analysis pipeline.
        """
        total_start_time = time.monotonic()
        timing_metrics = {}
        final_cost_metrics = {"tavily_searches": 0, "assemblyai_audio_seconds": 0}

        # Validate persona
        if not is_valid_persona(request.persona):
            raise ValueError(f"Invalid persona: {request.persona}")

        persona_config = get_persona_config(request.persona)

        print(
            Panel(
                f"[bold cyan]🚀 Analysis Pipeline Started[/bold cyan]\n"
                f"[white]Job ID: {request.job_id}[/white]\n"
                f"[bold]Persona:[/bold] [yellow]{request.persona}[/yellow]",
                border_style="cyan",
                expand=False,
            )
        )

        self.db_manager.log_progress(
            request.user_id,
            request.job_id,
            f"Analysis initiated with '{request.persona}' persona...",
        )

        try:
            # Step 1: Verify job status and setup
            job_doc = self.db_manager.get_job_status(request.user_id, request.job_id)
            if not job_doc:
                raise ValueError(
                    f"Job {request.job_id} not found for user {request.user_id}"
                )

            if job_doc.get("status") != "QUEUED":
                print(
                    f"[bold yellow]Job has status '{job_doc.get('status')}'. Skipping.[/bold yellow]"
                )
                return AnalysisResult(
                    job_id=request.job_id,
                    status="skipped",
                    final_title="",
                    sections_processed=0,
                    cost_metrics=final_cost_metrics,
                    timing_metrics=timing_metrics,
                    synthesis_results={},
                )

            self.db_manager.update_job_status(
                request.user_id,
                request.job_id,
                "PROCESSING",
                "Step 2/7: Preparing transcript...",
            )

            # Step 2: Input acquisition and normalization
            canonical_transcript = await self._process_input(
                request, final_cost_metrics, timing_metrics, total_start_time
            )

            if not canonical_transcript:
                raise ValueError("Failed to produce a usable transcript")

            # Step 3: Segmentation
            sections = await self._segment_transcript(
                canonical_transcript, request, timing_metrics
            )

            # Step 4: Section analysis
            runnable_config = RunnableConfig(callbacks=[self.token_tracker])
            section_results = await self._analyze_sections(
                sections, request, runnable_config, final_cost_metrics
            )

            all_section_analyses = [
                result.full_analysis
                for result in section_results
                if result.full_analysis
            ]

            # Step 5: Meta-analysis
            pass_2_data = await self._perform_meta_analysis(
                all_section_analyses, request, runnable_config, timing_metrics
            )

            # Step 7: Generate final title
            final_title = await self.title_generator.generate_title(
                pass_2_data, runnable_config
            )
            self.db_manager.update_job_title(
                request.user_id, request.job_id, final_title
            )

            # Step 8: Generate content assets
            await self._generate_content_assets(
                all_section_analyses,
                pass_2_data,
                request,
                runnable_config,
                timing_metrics,
            )

            # Step 9: Finalize metrics and complete job
            await self._finalize_job(
                request,
                final_cost_metrics,
                timing_metrics,
                len(sections),
                total_start_time,
            )

            return AnalysisResult(
                job_id=request.job_id,
                status="completed",
                final_title=final_title,
                sections_processed=len(sections),
                cost_metrics=final_cost_metrics,
                timing_metrics=timing_metrics,
                synthesis_results=pass_2_data,
            )

        except Exception as e:
            return await self._handle_pipeline_error(
                e, request, final_cost_metrics, timing_metrics
            )

    async def _process_input(
        self,
        request: AnalysisRequest,
        cost_metrics: Dict[str, int],
        timing_metrics: Dict[str, float],
        start_time: float,
    ) -> List[TranscriptUtterance]:
        """Process input and normalize to canonical format."""

        if request.transcript_id:
            # YouTube transcript processing
            print(f"INFO: Processing YouTube transcript (ID: {request.transcript_id})")
            self.db_manager.log_progress(
                request.user_id, request.job_id, "Fetching cached YouTube transcript..."
            )

            cached_data = self.db_manager.get_cached_transcript(request.transcript_id)
            if not cached_data:
                raise ValueError(
                    f"Cached transcript for ID {request.transcript_id} not found"
                )

            raw_youtube_transcript = cached_data.get("structured_transcript")

            if isinstance(raw_youtube_transcript, list):
                return await self.youtube_normalizer.normalize(raw_youtube_transcript)
            elif isinstance(raw_youtube_transcript, str):
                return await self.transcript_normalizer.normalize(
                    raw_youtube_transcript
                )
            else:
                raise ValueError("Invalid cached transcript format")

        elif request.storage_path:
            # Audio file processing
            self.db_manager.update_job_status(
                request.user_id,
                request.job_id,
                "PROCESSING",
                "Step 2/7: Transcribing audio file...",
            )

            transcription_result = await self.audio_processor.transcribe(
                request.storage_path, request.model_choice
            )

            if transcription_result:
                audio_duration = transcription_result.get("audio_duration", 0)
                if audio_duration:
                    cost_metrics["assemblyai_audio_seconds"] = audio_duration

            # Convert AssemblyAI format to canonical
            utterances = transcription_result.get("utterances", [])
            canonical_transcript = []

            for utt in utterances:
                canonical_transcript.append(
                    TranscriptUtterance(
                        speaker_id=f"Speaker {utt.get('speaker', 'A')}",
                        start_seconds=utt.get("start", 0) // 1000,
                        end_seconds=utt.get("end", 0) // 1000,
                        text=utt.get("text", ""),
                    )
                )

            timing_metrics["transcription_s"] = time.monotonic() - start_time
            return canonical_transcript

        else:
            # Text input processing
            self.db_manager.update_job_status(
                request.user_id,
                request.job_id,
                "PROCESSING",
                "Step 2/7: Processing text input...",
            )

            if not request.raw_transcript:
                raise ValueError("No input provided")

            # Un-escape newlines and normalize
            corrected_text = request.raw_transcript.replace("\\\\n", "\\n")
            return await self.transcript_normalizer.normalize(corrected_text)

    async def _segment_transcript(
        self,
        transcript: List[TranscriptUtterance],
        request: AnalysisRequest,
        timing_metrics: Dict[str, float],
    ):
        """Segment the normalized transcript."""
        start_time = time.monotonic()

        self.db_manager.log_progress(
            request.user_id, request.job_id, "Step 4/7: Segmenting transcript..."
        )

        # Determine segmentation strategy
        sections = self.segmenter.segment(transcript)

        timing_metrics["segmentation_s"] = time.monotonic() - start_time
        self.db_manager.log_progress(
            request.user_id,
            request.job_id,
            f"✓ Transcript segmented into {len(sections)} sections.",
        )

        return sections

    async def _analyze_sections(
        self,
        sections,
        request: AnalysisRequest,
        runnable_config: RunnableConfig,
        cost_metrics: Dict[str, int],
    ):
        """Analyze all sections in parallel."""
        log_msg = f"Step 5/7: Analyzing {len(sections)} sections in parallel..."
        print(f"[magenta]\\n{log_msg}[/magenta]")
        self.db_manager.update_job_status(
            request.user_id, request.job_id, "PROCESSING", log_msg
        )

        start_time = time.monotonic()

        section_results = await self.section_processor.process_sections_parallel(
            sections, request.user_id, request.job_id, runnable_config
        )

        # Aggregate cost metrics
        for result in section_results:
            if result.cost_metrics:
                for key, value in result.cost_metrics.items():
                    cost_metrics[key] = cost_metrics.get(key, 0) + value

        return section_results

    async def _perform_meta_analysis(
        self,
        all_sections: List[SectionAnalysis],
        request: AnalysisRequest,
        runnable_config: RunnableConfig,
        timing_metrics: Dict[str, float],
    ) -> Dict[str, Any]:
        """Perform meta-analysis based on persona."""
        if not all_sections:
            return {}

        start_time = time.monotonic()

        if request.persona == "consultant":
            try:
                synthesis_results = await self.meta_analyzer.perform_synthesis(
                    all_sections, runnable_config
                )
                
                if not synthesis_results:
                    print("[bold yellow]Warning: Empty synthesis results for consultant persona[/bold yellow]")
                    self.db_manager.log_progress(
                        request.user_id, request.job_id, 
                        "Warning: Empty synthesis results from meta-analyzer"
                    )

                self.db_manager.db.collection(
                    f"saas_users/{request.user_id}/jobs"
                ).document(request.job_id).update({"synthesis_results": synthesis_results})
                
                print(f"[green]✓ Saved consultant synthesis results with {len(synthesis_results)} keys[/green]")
                timing_metrics["synthesis_pass_s"] = time.monotonic() - start_time
                return synthesis_results
            except Exception as e:
                print(f"[bold red]Error in consultant synthesis: {e}[/bold red]")
                self.db_manager.log_progress(
                    request.user_id, request.job_id, 
                    f"Error in consultant synthesis: {e}"
                )
                return {}

        elif request.persona == "learning_accelerator":
            try:
                learning_synthesis = await self.meta_analyzer.perform_synthesis(
                    all_sections, runnable_config
                )
                
                if not learning_synthesis:
                    print("[bold yellow]Warning: Empty synthesis results for learning_accelerator persona[/bold yellow]")
                    self.db_manager.log_progress(
                        request.user_id, request.job_id, 
                        "Warning: Empty synthesis results from learning accelerator"
                    )

                # Save as generated_quiz_questions to match frontend expectations
                quiz_data = {
                    "quiz_metadata": {
                        "total_questions": len(learning_synthesis.get("quiz_questions", [])),
                        "estimated_time_minutes": len(learning_synthesis.get("quiz_questions", [])) * 2,  # 2 minutes per question
                        "difficulty_distribution": {"easy": 1, "medium": 2, "hard": 0},
                        "source": "learning_accelerator_analysis"
                    },
                    "questions": learning_synthesis.get("quiz_questions", []),
                    "quiz_type": "learning_comprehension"
                }

                self.db_manager.db.collection(
                    f"saas_users/{request.user_id}/jobs"
                ).document(request.job_id).update(
                    {"generated_quiz_questions": quiz_data}
                )
                
                print(f"[green]✓ Saved learning accelerator quiz with {len(quiz_data['questions'])} questions[/green]")
                timing_metrics["learning_synthesis_s"] = time.monotonic() - start_time
                return learning_synthesis
            except Exception as e:
                print(f"[bold red]Error in learning accelerator synthesis: {e}[/bold red]")
                self.db_manager.log_progress(
                    request.user_id, request.job_id, 
                    f"Error in learning accelerator synthesis: {e}"
                )
                return {}

        elif request.persona == "general":
            try:
                argument_results = await self.meta_analyzer.generate_argument_structure(
                    all_sections, runnable_config
                )
                
                if not argument_results:
                    print("[bold yellow]Warning: Empty argument structure results for general persona[/bold yellow]")
                    self.db_manager.log_progress(
                        request.user_id, request.job_id, 
                        "Warning: Empty argument structure results"
                    )

                self.db_manager.db.collection(
                    f"saas_users/{request.user_id}/jobs"
                ).document(request.job_id).update({"argument_structure": argument_results})
                
                print(f"[green]✓ Saved general persona argument structure with {len(argument_results)} keys[/green]")
                timing_metrics["argument_analysis_s"] = time.monotonic() - start_time
                return argument_results
            except Exception as e:
                print(f"[bold red]Error in general persona argument analysis: {e}[/bold red]")
                self.db_manager.log_progress(
                    request.user_id, request.job_id, 
                    f"Error in general persona argument analysis: {e}"
                )
                return {}

        return {}

    async def _generate_global_briefing(
        self,
        all_sections: List[SectionAnalysis],
        pass_2_data: Dict[str, Any],
        request: AnalysisRequest,
        runnable_config: RunnableConfig,
        cost_metrics: Dict[str, int],
        timing_metrics: Dict[str, float],
    ):
        """Generate global contextual briefing."""
        log_msg = "Step 5b: Generating Global Contextual Briefing..."
        print(f"[magenta]\\n{log_msg}[/magenta]")
        self.db_manager.log_progress(request.user_id, request.job_id, log_msg)

        start_time = time.monotonic()

        # Global briefing generation would go here if needed

        # Generate the briefing
        # Note: This would need to be implemented in the briefing generator
        # For now, keeping compatibility with existing implementation

        timing_metrics["global_briefing_s"] = time.monotonic() - start_time

    async def _generate_content_assets(
        self,
        all_sections: List[SectionAnalysis],
        synthesis_data: Dict[str, Any],
        request: AnalysisRequest,
        runnable_config: RunnableConfig,
        timing_metrics: Dict[str, float],
    ):
        """Generate final content assets."""
        log_msg = "Step 6/7: Generating final content assets..."
        print(f"[magenta]\\n{log_msg}[/magenta]")
        self.db_manager.update_job_status(
            request.user_id, request.job_id, "PROCESSING", log_msg
        )

        start_time = time.monotonic()
        persona_config = get_persona_config(request.persona)

        # Generate assets based on persona configuration
        if request.persona == "learning_accelerator":
            # Generate simplified learning content (quiz questions from synthesis)
            from src.features import generate_quiz_questions

            if "quiz_questions" in persona_config[
                "final_assets"
            ] and request.config.get("run_quiz_generation", True):
                quiz_questions = await generate_quiz_questions(
                    [self._convert_section_for_learning(s) for s in all_sections],
                    runnable_config,
                    synthesis_data,
                )
                self.db_manager.db.collection(
                    f"saas_users/{request.user_id}/jobs"
                ).document(request.job_id).update(
                    {"generated_quiz_questions": quiz_questions}
                )

        timing_metrics["content_generation_s"] = time.monotonic() - start_time

    async def _finalize_job(
        self,
        request: AnalysisRequest,
        cost_metrics: Dict[str, int],
        timing_metrics: Dict[str, float],
        sections_count: int,
        start_time: float,
    ):
        """Finalize job with metrics and status updates."""
        log_msg = "Step 7/7: Finalizing results and logging analytics..."
        print(f"[magenta]\\n{log_msg}[/magenta]")
        self.db_manager.update_job_status(
            request.user_id, request.job_id, "PROCESSING", log_msg
        )

        finalization_start = time.monotonic()
        timing_metrics["finalization_s"] = time.monotonic() - finalization_start
        timing_metrics["total_job_s"] = time.monotonic() - start_time

        # Calculate costs and create usage record
        final_llm_metrics = self.token_tracker.get_metrics()
        from ..config.constants import (
            LLM_INPUT_TOKEN_COST,
            LLM_OUTPUT_TOKEN_COST,
            TAVILY_SEARCH_COST,
            ASSEMBLYAI_PER_SECOND_COST,
        )

        internal_cost_usd = (
            (final_llm_metrics.get("llm_input_tokens", 0) * LLM_INPUT_TOKEN_COST)
            + (final_llm_metrics.get("llm_output_tokens", 0) * LLM_OUTPUT_TOKEN_COST)
            + (cost_metrics.get("tavily_searches", 0) * TAVILY_SEARCH_COST)
            + (
                cost_metrics.get("assemblyai_audio_seconds", 0)
                * ASSEMBLYAI_PER_SECOND_COST
            )
        )

        usage_record = {
            "userId": request.user_id,
            "jobId": request.job_id,
            "type": "audio" if request.storage_path else "text",
            "persona": request.persona,
            "internalCostUSD": round(internal_cost_usd, 6),
            "totalCompletionSeconds": round(timing_metrics["total_job_s"], 2),
            "timingBreakdownSeconds": {
                key.replace("_s", ""): round(value, 2)
                for key, value in timing_metrics.items()
                if key != "total_job_s"
            },
            "breakdown": {
                **final_llm_metrics,
                **cost_metrics,
            },
        }

        self.db_manager.create_usage_record(
            request.user_id, request.job_id, usage_record
        )

        # Update final status
        self.db_manager.update_job_status(
            request.user_id,
            request.job_id,
            "COMPLETED",
            f"Analysis of {sections_count} sections complete.",
        )
        self.db_manager.log_progress(
            request.user_id, request.job_id, "✅ Analysis Complete."
        )

        # Print performance metrics
        self._print_metrics(
            timing_metrics,
            final_llm_metrics,
            cost_metrics,
            internal_cost_usd,
            request.persona,
        )

    async def _handle_pipeline_error(
        self,
        error: Exception,
        request: AnalysisRequest,
        cost_metrics: Dict[str, int],
        timing_metrics: Dict[str, float],
    ) -> AnalysisResult:
        """Handle pipeline errors with proper cleanup."""
        error_message = f"Analysis failed: {str(error)}"
        print(
            Panel(
                f"[bold red]❌ ERROR for Job ID: {request.job_id}[/bold red]\\n{error_message}",
                border_style="red",
            )
        )

        self.db_manager.update_job_status(
            request.user_id, request.job_id, "FAILED", error_message
        )
        self.db_manager.log_progress(
            request.user_id, request.job_id, f"❌ Analysis Failed: {error_message}"
        )

        # Issue refund
        print(f"[yellow]Issuing refund for job {request.job_id}...[/yellow]")
        self.db_manager.refund_analysis_credit(request.user_id)

        # Cleanup storage if needed
        if request.storage_path:
            print("[cyan]Cleaning up source file...[/cyan]")
            self.db_manager.delete_gcs_file(request.storage_path)

        return AnalysisResult(
            job_id=request.job_id,
            status="failed",
            final_title="",
            sections_processed=0,
            cost_metrics=cost_metrics,
            timing_metrics=timing_metrics,
            synthesis_results={},
            error_message=error_message,
        )

    def _convert_section_for_legacy(self, section: SectionAnalysis) -> Dict:
        """Convert SectionAnalysis to legacy format for existing features."""
        return {
            "start_time": section.start_time,
            "end_time": section.end_time,
            "generated_title": section.title,
            "1_sentence_summary": section.summary,
            "notable_quotes": section.quotes,
            "entities": [
                {"name": e.name, "explanation": e.explanation} for e in section.entities
            ],
            **section.additional_data,
        }

    def _convert_section_for_learning(self, section: SectionAnalysis) -> Dict:
        """Convert SectionAnalysis to learning format for learning accelerator features."""
        return {
            "start_time": section.start_time,
            "end_time": section.end_time,
            "module_title": section.title,
            "learning_objectives": section.additional_data.get(
                "learning_objectives", [str(section.summary)]
            ),
            "core_concepts": [e.name for e in section.entities],
            "difficulty_level": section.additional_data.get(
                "difficulty_level", "intermediate"
            ),
            "prerequisite_knowledge": section.additional_data.get(
                "prerequisite_knowledge", []
            ),
            "key_insights": [],
            "real_world_applications": section.additional_data.get(
                "real_world_applications", []
            ),
            "memorable_examples": [str(quote) for quote in section.quotes],
            "potential_misconceptions": section.additional_data.get(
                "potential_misconceptions", []
            ),
            "connection_points": section.additional_data.get("connection_points", []),
            "reflection_questions": section.additional_data.get(
                "reflection_questions", []
            ),
            "mastery_indicators": section.additional_data.get("mastery_indicators", []),
            **section.additional_data,
        }

    def _print_metrics(
        self,
        timing_metrics: Dict[str, float],
        llm_metrics: Dict[str, int],
        cost_metrics: Dict[str, int],
        internal_cost: float,
        persona: str = None,
        synthesis_data: Dict[str, Any] = None,
    ):
        """Print performance and cost metrics."""
        # Print timing metrics
        timing_lines = [
            f"  - {key.replace('_s', '').replace('_', ' ').capitalize():<30}: {value:.2f}s"
            for key, value in timing_metrics.items()
            if key != "total_job_s"
        ] + [
            "-" * 40,
            f"  - {'Total job time':<30}: {timing_metrics.get('total_job_s', 0):.2f}s",
        ]

        print(
            Panel(
                "\n".join(timing_lines),
                title="[bold yellow]⏱️ Performance Metrics[/bold yellow]",
                border_style="yellow",
                expand=False,
            )
        )

        # Print cost metrics
        cost_lines = [
            f"  - {'LLM Input Tokens':<30}: {llm_metrics.get('llm_input_tokens', 0):,}",
            f"  - {'LLM Output Tokens':<30}: {llm_metrics.get('llm_output_tokens', 0):,}",
            f"  - {'Total LLM Requests':<30}: {llm_metrics.get('llm_calls', 0)}",
            f"  - {'Tavily Searches':<30}: {cost_metrics.get('tavily_searches', 0)}",
            f"  - {'AssemblyAI Audio':<30}: {cost_metrics.get('assemblyai_audio_seconds', 0):.2f}s",
            "-" * 40,
            f"  - {'Estimated Internal Cost':<30}: ${internal_cost:.6f}",
        ]

        print(
            Panel(
                "\n".join(cost_lines),
                title="[bold green]💰 Cost & Usage Metrics[/bold green]",
                border_style="green",
                expand=False,
            )
        )

        # Log learning accelerator synthesis results for debugging
        if persona == "learning_accelerator" and synthesis_data:
            self._log_learning_accelerator_results(synthesis_data)

        print(
            Panel(
                f"[bold green]✅ Analysis Pipeline Complete[/bold green]",
                border_style="green",
            )
        )

    def _log_learning_accelerator_results(self, synthesis_data: Dict[str, Any]):
        """Log learning accelerator synthesis results for debugging."""
        print(
            Panel(
                "[bold blue]🔍 Learning Accelerator Analysis Results[/bold blue]\n"
                "   Debug output for analysis review...",
                title="[bold]Learning Accelerator Debug[/bold]",
                border_style="blue",
                expand=False,
            )
        )

        # Log overall theme
        if "overall_learning_theme" in synthesis_data:
            print(
                f"[cyan]📚 Overall Theme:[/cyan] {synthesis_data['overall_learning_theme']}"
            )

        # Log consolidated lessons
        if "consolidated_lessons" in synthesis_data:
            print(
                f"\n[cyan]📖 Consolidated Lessons ({len(synthesis_data['consolidated_lessons'])}):[/cyan]"
            )
            for i, lesson in enumerate(synthesis_data["consolidated_lessons"], 1):
                lesson_text = lesson.get("lesson", "N/A")
                sections = lesson.get("supporting_sections", [])
                print(f"  {i}. {lesson_text}")
                if sections:
                    print(f"     → Sections: {', '.join(map(str, sections))}")

        # Log concept connections
        if "concept_connections" in synthesis_data:
            print(
                f"\n[cyan]🔗 Concept Connections ({len(synthesis_data['concept_connections'])}):[/cyan]"
            )
            for i, conn in enumerate(synthesis_data["concept_connections"], 1):
                concept1 = conn.get("concept_1", "N/A")
                concept2 = conn.get("concept_2", "N/A")
                relationship = conn.get("relationship", "N/A")
                print(f"  {i}. {concept1} → {relationship} → {concept2}")

        # Log practical insights
        if "practical_insights" in synthesis_data:
            print(
                f"\n[cyan]💡 Practical Insights ({len(synthesis_data['practical_insights'])}):[/cyan]"
            )
            for i, insight in enumerate(synthesis_data["practical_insights"], 1):
                insight_text = insight if isinstance(insight, str) else str(insight)
                print(f"  {i}. {insight_text}")

        # Log quiz questions
        if "quiz_questions" in synthesis_data:
            questions = synthesis_data["quiz_questions"]
            print(f"\n[cyan]❓ Quiz Questions ({len(questions)}):[/cyan]")
            for i, q in enumerate(questions, 1):
                question_text = q.get("question", "N/A")
                correct_answer = q.get("correct_answer", "N/A")
                timestamp = q.get("related_timestamp", "N/A")
                print(f"  {i}. {question_text}")
                print(f"     → Answer: {correct_answer} | Timestamp: {timestamp}")

        # Log lesson progression
        if "lesson_progression" in synthesis_data:
            print(
                f"\n[cyan]📈 Lesson Progression:[/cyan] {synthesis_data['lesson_progression']}"
            )

        print(
            f"\n[dim]Total synthesis data keys: {', '.join(synthesis_data.keys())}[/dim]"
        )
        print("─" * 80)
