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
        runnable_config: RunnableConfig,
        original_transcript: str = None
    ) -> Dict[str, Any]:
        """
        Performs a meta-analysis to synthesize high-level strategic insights
        that span across the entire document.
        """
        print(
            Panel(
                "[bold magenta]Meta-Synthesis Initiated[/bold magenta]\n"
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
            
            print("[green]Meta-Synthesis complete. High-level insights generated.[/green]")
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
        runnable_config: RunnableConfig,
        original_transcript: str = None
    ) -> Dict[str, Any]:
        """
        Generate argument structure using map-reduce approach.
        """
        print(
            Panel(
                "[bold cyan]Initiating Map-Reduce for Argument Structure[/bold cyan]\n"
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
        
        print(f"  [green]Phase 1 (Map) Complete: Generated {len(valid_summaries)} intermediate summaries.[/green]")
        
        # Step 2: Reduce - Generate final argument structure
        if not valid_summaries:
            print("[bold red]Argument analysis skipped: No valid intermediate summaries.[/bold red]")
            return {}
        
        return await self._generate_final_argument_structure(valid_summaries, runnable_config)



class DeepDiveSynthesizer(MetaAnalyzer):
    """Meta-analyzer for deep_dive persona - generates quizzes for simplified analysis."""
    
    def __init__(self, llm_client):
        self.llm = llm_client
        # Import here to avoid circular imports
        from .quiz_generator import SectionAwareQuizGenerator
        self.quiz_generator = SectionAwareQuizGenerator(llm_client)
    
    async def perform_synthesis(
        self,
        section_analyses: List[SectionAnalysis],
        runnable_config: RunnableConfig,
        original_transcript: str = None
    ) -> Dict[str, Any]:
        """
        Generate quizzes for deep dive analysis focused on essential learning.
        """
        print(
            Panel(
                "[bold green]Deep Dive Quiz Generation[/bold green]\n"
                "   - Generating focused multiple choice and open-ended questions...\n"
                "   - Based on simplified lessons and concepts...",
                title="[bold]Pass 2: Deep Dive Quiz Generation[/bold]",
                border_style="green",
                expand=False,
            )
        )
        
        try:
            print(f"[blue]DEBUG: Starting deep dive quiz generation with {len(section_analyses)} sections[/blue]")
            
            # Use the quiz generator to create both multiple choice and open-ended questions
            # Pass the original transcript for timestamp matching
            quiz_results = await self.quiz_generator.generate_quizzes(
                section_analyses, 
                runnable_config,
                original_transcript
            )
            
            print(f"[blue]DEBUG: Deep dive quiz generator returned: {type(quiz_results)} with keys: {list(quiz_results.keys()) if isinstance(quiz_results, dict) else 'Not a dict'}[/blue]")
            
            if quiz_results.get("error"):
                print(f"[bold red]Deep dive quiz generation error: {quiz_results['error']}[/bold red]")
                print("[yellow]Falling back to legacy method for deep dive[/yellow]")
                return await self._legacy_deep_dive_quiz_generation(section_analyses, runnable_config, original_transcript)
            
            # Extract quiz questions for backward compatibility
            quiz_questions = quiz_results.get("quiz_questions", [])
            open_ended_questions = quiz_results.get("open_ended_questions", [])
            
            print(f"[green]Deep dive quiz generation complete. Generated {len(quiz_questions)} multiple choice and {len(open_ended_questions)} open-ended questions.[/green]")
            
            # Return in format expected by the current pipeline
            return {
                "quiz_questions": quiz_questions,
                "open_ended_questions": open_ended_questions,
                "multi_quiz_data": quiz_results,  # Store full multi-quiz data
                "generation_method": "deep_dive_focused"
            }
            
        except Exception as e:
            print(f"[bold red]Error during deep dive quiz generation: {str(e)}. Falling back to legacy method.[/bold red]")
            import traceback
            print(f"[red]Traceback: {traceback.format_exc()}[/red]")
            # Fallback to legacy method if new approach fails
            return await self._legacy_deep_dive_quiz_generation(section_analyses, runnable_config, original_transcript)
    
    async def generate_argument_structure(
        self,
        section_analyses: List[SectionAnalysis], 
        runnable_config: RunnableConfig
    ) -> Dict[str, Any]:
        """Not used for deep_dive persona."""
        return {}
    
    async def _legacy_deep_dive_quiz_generation(
        self,
        section_analyses: List[SectionAnalysis],
        runnable_config: RunnableConfig,
        original_transcript: str = None
    ) -> Dict[str, Any]:
        """Legacy quiz generation method as fallback for deep dive."""
        print("[yellow]Using legacy deep dive quiz generation method...[/yellow]")
        
        # Calculate total content duration for quiz question count
        total_duration = self._calculate_total_duration(section_analyses)
        quiz_question_count = self._determine_quiz_count(total_duration)
        
        # Convert section analyses to structured JSON for quiz generation, focusing on lessons
        section_data = json.dumps([
            {
                "section_number": i + 1,
                "time_range": f"{analysis.start_time} - {analysis.end_time}",
                "summary": analysis.summary,
                "actionable_takeaways": analysis.additional_data.get("actionable_takeaways", []),
                "key_quotes": analysis.quotes[:2],  # Limit quotes for simplicity
            }
            for i, analysis in enumerate(section_analyses)
        ], indent=2)
        
        parser = JsonOutputParser()
        
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                f"""You are an expert quiz generator specializing in creating focused knowledge assessments. You have been provided with simplified content focused on actionable takeaways. Your task is to generate quiz questions that test understanding of the most important takeaways.

Your output must be a JSON object with the following keys:

- 'quiz_questions': Generate exactly {quiz_question_count} multiple choice questions based on the key actionable takeaways across all sections. Each question should have:
  - 'question': A clear, specific question about a key takeaway or concept
  - 'options': An array of exactly 4 answer choices (A, B, C, D options)
  - 'correct_answer': The letter of the correct answer (A, B, C, or D)
  - 'explanation': A brief explanation of why this answer is correct
  - 'supporting_quote': A direct quote from the content that supports this question/answer
  - 'related_timestamp': The timestamp where this concept was discussed

- 'open_ended_questions': Generate 1-2 open-ended questions for deeper reflection:
  - 'question': A thought-provoking question that requires synthesis of multiple concepts

Focus on testing comprehension of the most valuable actionable takeaways and practical concepts. Questions should be clear and directly related to the takeaways provided.

{{format_instructions}}""",
            ),
            (
                "human",
                """Based on the following section content focused on actionable takeaways, generate quiz questions.

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
            
            print(f"[green]Legacy deep dive quiz generation complete. Generated {quiz_question_count} questions based on {total_duration:.1f} min content.[/green]")
            return synthesis_results
            
        except Exception as e:
            print(f"[bold red]Error during legacy deep dive quiz generation: {e}. Returning empty synthesis.[/bold red]")
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