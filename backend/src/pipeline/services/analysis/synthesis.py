"""
Meta-synthesis analysis service.
"""

import json
from typing import List, Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import RunnableConfig
from rich import print
from rich.panel import Panel

from ...interfaces import MetaAnalyzer, SectionAnalysis


class ConsultantSynthesizer(MetaAnalyzer):
    """Meta-analyzer for consultant persona - performs deep strategic synthesis."""
    
    def __init__(self, llm_client):
        self.llm = llm_client
    
    async def perform_synthesis(
        self,
        section_analyses: List[SectionAnalysis],
        runnable_config: RunnableConfig
    ) -> Dict[str, Any]:
        """
        Performs a meta-analysis to synthesize high-level strategic insights
        that span across the entire document.
        """
        print(
            Panel(
                "[bold magenta]🧠 Meta-Synthesis Initiated[/bold magenta]\n"
                "   - Analyzing connections across all document sections...",
                title="[bold]Pass 2: Synthesis[/bold]",
                border_style="magenta",
                expand=False,
            )
        )
        
        # Convert section analyses to JSON for LLM processing
        consolidated_context = json.dumps([
            {
                "start_time": analysis.start_time,
                "end_time": analysis.end_time,
                "title": analysis.title,
                "summary": analysis.summary,
                "quotes": analysis.quotes,
                "entities": [{"name": e.name, "explanation": e.explanation} for e in analysis.entities],
                "additional_data": analysis.additional_data,
            }
            for analysis in section_analyses
        ], indent=2)
        
        parser = JsonOutputParser()
        
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """You are a Partner-level strategic analyst at a top-tier consulting firm. You have been provided with a structured JSON object containing a detailed, section-by-section analysis of a client interview or document. Your task is to perform a meta-analysis to synthesize high-level strategic insights that span across the entire document. Do not simply summarize the sections; your job is to find the hidden connections between them.

Your output must be a JSON object with the following keys:
- 'overarching_themes': A list of 2-4 of the most critical, high-level strategic themes that are present throughout the document.
- 'narrative_arc': A brief paragraph describing the core story of the document. Identify the central conflict (the primary business problem), the cascading effects of this problem, the key turning point or insight, and the ultimate strategic choice or opportunity presented.
- 'key_contradictions': A list of objects, where each object highlights a significant contradiction or tension found between different sections of the document. Each object should have 'point_a', 'point_b', and 'analysis' keys.
- 'unifying_insights': A list of 2-3 novel insights that can only be understood by looking at the document as a whole, not from any single section.
{format_instructions}""",
            ),
            (
                "human",
                """Based on the following consolidated section-by-section analysis, please perform your meta-analysis and provide the synthesized insights.

--- CONSOLIDATED ANALYSIS (JSON) ---
{consolidated_analysis}
--- END CONSOLIDATED ANALYSIS ---""",
            ),
        ])
        
        chain = prompt | self.llm | parser
        
        try:
            synthesis_results = await chain.ainvoke({
                "consolidated_analysis": consolidated_context,
                "format_instructions": parser.get_format_instructions(),
            }, config=runnable_config)
            
            print("[green]✓ Meta-Synthesis complete. High-level insights generated.[/green]")
            return synthesis_results
            
        except Exception as e:
            print(f"[bold red]Error during meta-synthesis: {e}. Returning empty synthesis.[/bold red]")
            return {}
    
    async def generate_argument_structure(
        self,
        section_analyses: List[SectionAnalysis], 
        runnable_config: RunnableConfig
    ) -> Dict[str, Any]:
        """Not used for consultant persona."""
        return {}


class GeneralSynthesizer(MetaAnalyzer):
    """Meta-analyzer for general persona - uses map-reduce for argument structure."""
    
    def __init__(self, llm_client):
        self.llm = llm_client
    
    async def perform_synthesis(
        self,
        section_analyses: List[SectionAnalysis],
        runnable_config: RunnableConfig
    ) -> Dict[str, Any]:
        """Not used for general persona."""
        return {}
    
    async def generate_argument_structure(
        self,
        section_analyses: List[SectionAnalysis], 
        runnable_config: RunnableConfig
    ) -> Dict[str, Any]:
        """
        Generate argument structure using map-reduce approach.
        """
        print(
            Panel(
                "[bold cyan]🧠 Initiating Map-Reduce for Argument Structure[/bold cyan]\n"
                "  1. (Map) Summarize section chunks in parallel.\n"
                "  2. (Reduce) Synthesize summaries into final argument.",
                title="[bold]Pass 2: Map-Reduce[/bold]",
                border_style="cyan",
                expand=False,
            )
        )
        
        # Step 1: Map - Create intermediate summaries in chunks
        chunk_size = 5
        analysis_chunks = [
            section_analyses[i:i + chunk_size]
            for i in range(0, len(section_analyses), chunk_size)
        ]
        
        print(f"[cyan]Pass 2: Grouped {len(section_analyses)} analyses into {len(analysis_chunks)} chunks.[/cyan]")
        
        # Generate intermediate summaries
        from asyncio import gather
        summary_tasks = [
            self._generate_intermediate_summary(chunk, runnable_config)
            for chunk in analysis_chunks
        ]
        intermediate_summaries = await gather(*summary_tasks)
        
        # Filter out failed summaries
        valid_summaries = [s for s in intermediate_summaries if s]
        
        print(f"  [green]✓ Phase 1 (Map) Complete: Generated {len(valid_summaries)} intermediate summaries.[/green]")
        
        # Step 2: Reduce - Generate final argument structure
        if not valid_summaries:
            print("[bold red]Argument analysis skipped: No valid intermediate summaries.[/bold red]")
            return {}
        
        return await self._generate_final_argument_structure(valid_summaries, runnable_config)


class LearningAcceleratorSynthesizer(MetaAnalyzer):
    """Meta-analyzer for learning_accelerator persona - generates simple quiz questions for knowledge testing."""
    
    def __init__(self, llm_client):
        self.llm = llm_client
    
    async def perform_synthesis(
        self,
        section_analyses: List[SectionAnalysis],
        runnable_config: RunnableConfig
    ) -> Dict[str, Any]:
        """
        Generate simple quiz questions based on all sections for knowledge testing.
        """
        print(
            Panel(
                "[bold green]📝 Learning Quiz Generation[/bold green]\n"
                "   - Analyzing key concepts across all sections...\n"
                "   - Generating quiz questions for knowledge testing...",
                title="[bold]Pass 2: Quiz Generation[/bold]",
                border_style="green",
                expand=False,
            )
        )
        
        # Calculate total content duration for quiz question count
        total_duration = self._calculate_total_duration(section_analyses)
        quiz_question_count = self._determine_quiz_count(total_duration)
        
        # Debug: Check what data we have in section analyses
        print(f"[blue]Debug - Processing {len(section_analyses)} sections for quiz generation[/blue]")
        for i, analysis in enumerate(section_analyses):
            print(f"[blue]Debug - Section {i+1} additional_data keys: {list(analysis.additional_data.keys())}[/blue]")
            lessons = analysis.additional_data.get("lessons_and_concepts", [])
            print(f"[blue]Debug - Section {i+1} lessons_and_concepts: {len(lessons) if isinstance(lessons, list) else 'not a list'}[/blue]")
        
        # Convert section analyses to structured JSON for quiz generation
        section_data = json.dumps([
            {
                "section_number": i + 1,
                "time_range": f"{analysis.start_time} - {analysis.end_time}",
                "summary": analysis.summary,
                "key_concepts": analysis.additional_data.get("lessons_and_concepts", []),  # Use the proper lessons and concepts structure
                "notable_quotes": analysis.quotes,
                "entities": [e.name for e in analysis.entities],
            }
            for i, analysis in enumerate(section_analyses)
        ], indent=2)
        
        print(f"[blue]Debug - Section data for LLM: {section_data[:500]}...[/blue]")
        
        parser = JsonOutputParser()
        
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                f"""You are an expert quiz generator specializing in creating multiple choice questions for knowledge testing. You have been provided with structured content from a learning session. Your task is to generate quiz questions that test understanding of the most important concepts.

Your output must be a JSON object with the following keys:

- 'quiz_questions': Generate exactly {quiz_question_count} multiple choice questions based on the most important concepts across all sections. Each question should have:
  - 'question': A clear, specific question about a key concept or lesson
  - 'options': An array of exactly 4 answer choices (A, B, C, D options)
  - 'correct_answer': The letter of the correct answer (A, B, C, or D)
  - 'explanation': A brief explanation of why this answer is correct
  - 'supporting_quote': A direct quote from the content that supports this question/answer
  - 'related_timestamp': The timestamp where this concept was discussed

Focus on testing comprehension of the most valuable insights and practical concepts. Questions should be challenging but fair, with plausible wrong answers.

{{format_instructions}}""",
            ),
            (
                "human",
                """Based on the following section content, generate quiz questions that test understanding of the key concepts and lessons.

--- SECTION CONTENT (JSON) ---
{section_data}
--- END SECTION CONTENT ---""",
            ),
        ])
        
        chain = prompt | self.llm | parser
        
        try:
            synthesis_results = await chain.ainvoke({
                "section_data": section_data,
                "format_instructions": parser.get_format_instructions(),
            }, config=runnable_config)
            
            print(f"[green]✓ Quiz generation complete. Generated {quiz_question_count} questions based on {total_duration:.1f} min content.[/green]")
            return synthesis_results
            
        except Exception as e:
            print(f"[bold red]Error during quiz generation: {e}. Returning empty synthesis.[/bold red]")
            return {}
    
    async def generate_argument_structure(
        self,
        section_analyses: List[SectionAnalysis], 
        runnable_config: RunnableConfig
    ) -> Dict[str, Any]:
        """Not used for learning_accelerator persona."""
        return {}
    
    def _calculate_total_duration(self, section_analyses: List[SectionAnalysis]) -> float:
        """Calculate total duration in minutes from section analyses."""
        total_seconds = 0
        
        for analysis in section_analyses:
            try:
                # Parse timestamps in format "MM:SS" or "HH:MM:SS"
                start_parts = analysis.start_time.split(":")
                end_parts = analysis.end_time.split(":")
                
                if len(start_parts) == 2:  # MM:SS format
                    start_seconds = int(start_parts[0]) * 60 + int(start_parts[1])
                elif len(start_parts) == 3:  # HH:MM:SS format
                    start_seconds = int(start_parts[0]) * 3600 + int(start_parts[1]) * 60 + int(start_parts[2])
                else:
                    continue
                    
                if len(end_parts) == 2:  # MM:SS format
                    end_seconds = int(end_parts[0]) * 60 + int(end_parts[1])
                elif len(end_parts) == 3:  # HH:MM:SS format  
                    end_seconds = int(end_parts[0]) * 3600 + int(end_parts[1]) * 60 + int(end_parts[2])
                else:
                    continue
                    
                section_duration = max(0, end_seconds - start_seconds)
                total_seconds += section_duration
                
            except (ValueError, IndexError):
                # Skip sections with invalid timestamp formats
                continue
        
        return total_seconds / 60.0  # Convert to minutes
    
    def _determine_quiz_count(self, duration_minutes: float) -> int:
        """Determine number of quiz questions based on content duration."""
        if duration_minutes < 30:
            return 1
        elif duration_minutes < 60:
            return 2
        else:
            return 3
    
    async def _generate_intermediate_summary(
        self, 
        analysis_chunk: List[SectionAnalysis], 
        runnable_config: RunnableConfig
    ) -> Dict[str, Any]:
        """Generate intermediate summary for a chunk of section analyses."""
        print(f"  - [magenta]Generating intermediate summary for chunk of {len(analysis_chunk)} sections...[/magenta]")
        
        # Convert chunk to JSON
        consolidated_chunk = json.dumps([
            {
                "title": analysis.title,
                "summary": analysis.summary,
                "quotes": analysis.quotes,
                "additional_data": analysis.additional_data,
            }
            for analysis in analysis_chunk
        ], indent=2)
        
        parser = JsonOutputParser()
        
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """You are an expert analyst. You will be given a JSON object containing the analysis of a few consecutive sections from a larger document. 
Your task is to synthesize these sections into a single, concise summary object.

Based ONLY on the provided JSON context, you must extract the following:
- 'main_thesis': A single sentence stating the central argument of THIS CHUNK.
- 'supporting_arguments': A list of the key points used to build the case within THIS CHUNK.
- 'counterarguments_mentioned': A list of opposing viewpoints mentioned within THIS CHUNK.

Your output must be a single, valid JSON object.
{format_instructions}""",
            ),
            (
                "human",
                """Please analyze the following consolidated analysis chunk and extract the required information.

--- ANALYSIS CHUNK (JSON) ---
{chunk_context}
--- END ANALYSIS CHUNK ---""",
            ),
        ])
        
        chain = prompt | self.llm | parser
        
        try:
            return await chain.ainvoke({
                "chunk_context": consolidated_chunk,
                "format_instructions": parser.get_format_instructions(),
            }, config=runnable_config)
        except Exception as e:
            print(f"[bold red]Error generating intermediate summary: {e}[/bold red]")
            return {}
    
    async def _generate_final_argument_structure(
        self,
        intermediate_summaries: List[Dict[str, Any]],
        runnable_config: RunnableConfig
    ) -> Dict[str, Any]:
        """Generate final argument structure from intermediate summaries."""
        consolidated_context = json.dumps(intermediate_summaries, indent=2)
        
        parser = JsonOutputParser()
        
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """You are an expert in rhetoric and logical analysis. You have been given a structured JSON containing intermediate summaries of a document. Your task is to deconstruct the core argument of the original document based on this analysis. Identify the primary thesis, supporting points, and any counterarguments.

Your output must be a JSON object with the following keys:
- 'main_thesis': A single, clear sentence stating the central argument or primary message of the entire text.
- 'supporting_arguments': A list of 3-5 strings, where each string is a key point or piece of evidence the author uses to build their case.
- 'counterarguments_mentioned': A list of strings for any opposing viewpoints or counterarguments the author discusses in the text. If none are mentioned, return an empty list.
{format_instructions}""",
            ),
            (
                "human",
                """Please analyze the following intermediate summaries and extract the original document's argument structure.

--- INTERMEDIATE SUMMARIES (JSON) ---
{structured_analysis}
--- END SUMMARIES ---""",
            ),
        ])
        
        chain = prompt | self.llm | parser
        
        try:
            result = await chain.ainvoke({
                "structured_analysis": consolidated_context,
                "format_instructions": parser.get_format_instructions(),
            }, config=runnable_config)
            
            print("[green]✓ Argument structure analysis complete.[/green]")
            return result
            
        except Exception as e:
            print(f"[bold red]Error during argument structure generation: {e}[/bold red]")
            return {}