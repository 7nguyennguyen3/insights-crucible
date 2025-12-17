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



class PodcasterSynthesizer(MetaAnalyzer):
    """Meta-analyzer for podcaster persona - generates show notes for podcast production."""

    def __init__(self, llm_client):
        self.llm = llm_client

    async def perform_synthesis(
        self,
        section_analyses: List[SectionAnalysis],
        runnable_config: RunnableConfig,
        original_transcript: str = None
    ) -> Dict[str, Any]:
        """
        Generate production-ready show notes and launch assets from podcast sections.
        """
        print(
            Panel(
                "[bold blue]Podcaster Launch Assets Generation[/bold blue]\n"
                "   - Extracting key points and notable quotes...\n"
                "   - Generating episode description and chapters...\n"
                "   - Creating title variations and social content...",
                title="[bold]Pass 2: Launch Assets Generation[/bold]",
                border_style="blue",
                expand=False,
            )
        )

        try:
            print(f"[blue]Starting launch assets generation with {len(section_analyses)} sections[/blue]")

            # Convert section analyses to structured JSON for show notes generation
            section_data = []
            all_key_points = []
            all_notable_quotes = []

            for i, analysis in enumerate(section_analyses):
                # Extract key_points from additional_data (set by section analysis)
                key_points = analysis.additional_data.get("key_points", [])

                # Extract notable quotes - they're in the quotes field based on persona config
                notable_quotes = []
                for quote_obj in analysis.quotes:
                    if isinstance(quote_obj, dict):
                        # Preserve precise timestamp if it was extracted during section processing
                        # Otherwise fall back to section start time
                        timestamp = quote_obj.get("timestamp", analysis.start_time)
                        notable_quotes.append({
                            "quote": quote_obj.get("quote", ""),
                            "context": quote_obj.get("context", ""),
                            "timestamp": timestamp
                        })

                section_info = {
                    "section_number": i + 1,
                    "title": analysis.title,
                    "timestamp": analysis.start_time,
                    "summary": analysis.summary,
                    "key_points": key_points,
                    "notable_quotes": notable_quotes
                }
                section_data.append(section_info)

                # Collect all key points and quotes
                all_key_points.extend(key_points)
                all_notable_quotes.extend(notable_quotes)

            # Generate all assets concurrently for better performance
            from asyncio import gather

            print("[blue]Generating all launch assets in parallel...[/blue]")

            # Run all generation tasks concurrently
            results = await gather(
                self._generate_title_variations(section_data, runnable_config),
                self._generate_episode_description(section_data, runnable_config),
                self._generate_linkedin_post(section_data, runnable_config),
                self._generate_twitter_thread(section_data, runnable_config),
                self._generate_youtube_description(section_data, runnable_config),
                return_exceptions=True
            )

            # Unpack results
            title_variations = results[0] if not isinstance(results[0], Exception) else {}
            episode_description = results[1] if not isinstance(results[1], Exception) else ""
            linkedin_post = results[2] if not isinstance(results[2], Exception) else ""
            twitter_thread = results[3] if not isinstance(results[3], Exception) else []
            youtube_description = results[4] if not isinstance(results[4], Exception) else ""

            # Compile chapter markers
            chapters = [
                {
                    "timestamp": section["timestamp"],
                    "title": section["title"],
                    "summary": section["summary"]
                }
                for section in section_data
            ]

            # Select best notable quotes (limit to top 5-8)
            best_quotes = self._select_best_quotes(all_notable_quotes, limit=8)

            show_notes = {
                "title_variations": title_variations,
                "episode_description": episode_description,
                "key_points": all_key_points[:10],  # Top 10 key points
                "notable_quotes": best_quotes,
                "chapters": chapters,
                "social_content": {
                    "linkedin_post": linkedin_post,
                    "twitter_thread": twitter_thread,
                    "youtube_description": youtube_description
                },
                "total_sections": len(section_analyses)
            }

            print(f"[green]Launch assets generation complete. Generated {len(title_variations)} title variations, description, {len(show_notes['key_points'])} key points, {len(best_quotes)} quotes, {len(chapters)} chapters, and social content.[/green]")

            return show_notes

        except Exception as e:
            print(f"[bold red]Error during launch assets generation: {str(e)}[/bold red]")
            import traceback
            print(f"[red]Traceback: {traceback.format_exc()}[/red]")
            return {
                "error": f"Launch assets generation failed: {str(e)}",
                "title_variations": {},
                "episode_description": "",
                "key_points": [],
                "notable_quotes": [],
                "chapters": [],
                "social_content": {}
            }

    async def generate_argument_structure(
        self,
        section_analyses: List[SectionAnalysis],
        runnable_config: RunnableConfig
    ) -> Dict[str, Any]:
        """Not used for podcaster persona."""
        return {}

    async def _generate_episode_description(
        self,
        section_data: List[Dict],
        runnable_config: RunnableConfig
    ) -> str:
        """Generate SEO-optimized episode description from section summaries."""

        # Compile section summaries for context
        section_summaries = json.dumps([
            {
                "title": section["title"],
                "summary": section["summary"],
                "key_points": section.get("key_points", [])[:2]  # Top 2 per section
            }
            for section in section_data[:8]  # Limit to first 8 sections
        ], indent=2)

        parser = JsonOutputParser()

        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """You are an expert podcast show notes writer. Your task is to create a compelling episode description that helps listeners discover the content and understand what they'll learn.

Your output must be a JSON object with the following key:

- 'description': A 2-3 paragraph SEO-optimized episode description (120-200 words).
  - First paragraph: Hook the listener with the most compelling insight or topic
  - Second paragraph: Overview of 3-5 main topics covered
  - Optional third paragraph: Who this episode is for or what listeners will gain

Guidelines:
- Write in second person ("you'll discover", "you'll learn")
- Be specific about topics, not vague
- Use keywords naturally for SEO
- Make it scannable (can use bullet points in paragraph 2)
- Focus on value and discovery

{format_instructions}""",
            ),
            (
                "human",
                """Based on the following podcast sections, create an episode description.

--- SECTION SUMMARIES ---
{section_summaries}
--- END SECTION SUMMARIES ---""",
            ),
        ])

        chain = prompt | self.llm | parser

        try:
            result = await chain.ainvoke({
                "section_summaries": section_summaries,
                "format_instructions": parser.get_format_instructions(),
            }, config=runnable_config)

            return result.get("description", "")

        except Exception as e:
            print(f"[yellow]Warning: Could not generate episode description: {e}[/yellow]")
            # Fallback: concatenate first 3 section summaries
            fallback = " ".join([
                section["summary"]
                for section in section_data[:3]
            ])
            return fallback

    def _select_best_quotes(self, all_quotes: List[Dict], limit: int = 8) -> List[Dict]:
        """Select the most compelling quotes, removing duplicates and prioritizing variety."""

        if not all_quotes:
            return []

        # Remove duplicates based on quote text
        seen_quotes = set()
        unique_quotes = []

        for quote_obj in all_quotes:
            quote_text = quote_obj.get("quote", "").strip()
            if quote_text and quote_text not in seen_quotes:
                seen_quotes.add(quote_text)
                unique_quotes.append(quote_obj)

        # Prioritize longer, more substantial quotes (30+ words tend to be more complete thoughts)
        scored_quotes = []
        for quote_obj in unique_quotes:
            quote_text = quote_obj.get("quote", "")
            word_count = len(quote_text.split())

            # Score based on word count (prefer 30-100 word range)
            if 30 <= word_count <= 100:
                score = 10
            elif 20 <= word_count < 30:
                score = 7
            elif 10 <= word_count < 20:
                score = 4
            else:
                score = 2

            scored_quotes.append((score, quote_obj))

        # Sort by score (descending) and take top N
        scored_quotes.sort(key=lambda x: x[0], reverse=True)
        best_quotes = [quote for score, quote in scored_quotes[:limit]]

        return best_quotes

    async def _generate_title_variations(
        self,
        section_data: List[Dict],
        runnable_config: RunnableConfig
    ) -> Dict[str, str]:
        """Generate 4 distinct title variations with different marketing angles."""

        # Compile section summaries for context
        episode_overview = json.dumps([
            {
                "title": section["title"],
                "summary": section["summary"],
                "key_points": section.get("key_points", [])[:2]
            }
            for section in section_data[:8]
        ], indent=2)

        parser = JsonOutputParser()

        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """You are an expert podcast marketing strategist. Your task is to create 4 distinct episode titles with different marketing angles.

Your output must be a JSON object with the following keys:

- 'curiosity_gap': A title that creates intrigue by hinting at a surprising insight without revealing it.
  Example: "Why Your 'Comfort Zone' is Actually Dangerous"

- 'benefit_driven': A title that clearly states the practical benefit or outcome.
  Example: "How to Use Mortality to Stop Fearing Judgment"

- 'contrarian': A title that challenges conventional wisdom or common beliefs.
  Example: "Stop Pursuing Happiness: Why You Should Chase Regret Instead"

- 'direct': A straightforward title that clearly lists what's covered.
  Example: "Mastering Decisions, Anxiety Cost, and The 3-Generation Rule"

Guidelines:
- Each title should be 6-12 words
- Capitalize Important Words
- Be specific, not generic
- Make them shareable and click-worthy
- Match the actual content (don't oversell)

{format_instructions}""",
            ),
            (
                "human",
                """Based on the following podcast episode content, create 4 title variations.

--- EPISODE CONTENT ---
{episode_overview}
--- END EPISODE CONTENT ---""",
            ),
        ])

        chain = prompt | self.llm | parser

        try:
            result = await chain.ainvoke({
                "episode_overview": episode_overview,
                "format_instructions": parser.get_format_instructions(),
            }, config=runnable_config)

            print(f"[green]Generated {len(result)} title variations[/green]")
            return result

        except Exception as e:
            print(f"[yellow]Warning: Could not generate title variations: {e}[/yellow]")
            # Fallback: simple titles based on first section
            first_section = section_data[0] if section_data else {}
            fallback_title = first_section.get("title", "Episode")

            return {
                "curiosity_gap": f"Why {fallback_title} Matters More Than You Think",
                "benefit_driven": f"How to Master {fallback_title}",
                "contrarian": f"Stop Believing These Myths About {fallback_title}",
                "direct": fallback_title
            }

    async def _generate_linkedin_post(
        self,
        section_data: List[Dict],
        runnable_config: RunnableConfig
    ) -> str:
        """Generate a LinkedIn-native post that extracts one story/insight."""

        # Compile section summaries and key points
        episode_content = json.dumps([
            {
                "title": section["title"],
                "summary": section["summary"],
                "key_points": section.get("key_points", [])
            }
            for section in section_data
        ], indent=2)

        parser = JsonOutputParser()

        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """You are an expert LinkedIn content strategist. Your task is to create a LinkedIn-native post that tells ONE compelling story or shares ONE powerful insight from a podcast episode.

Your output must be a JSON object with the following key:

- 'post': A LinkedIn post (200-300 words) following the "bro-etry" storytelling format.

Structure:
1. HOOK (1-2 lines): Start with a punchy, relatable observation or question
2. STORY/CONTEXT (2-3 short paragraphs): Tell the story or explain the insight with concrete details
3. THE LESSON (1-2 paragraphs): What this means and why it matters
4. CTA (1 line): Soft call-to-action like "What's your take?" or "Link to full episode in comments"

LinkedIn Style Guidelines:
- Use short paragraphs (1-3 sentences each)
- Add line breaks between paragraphs for readability
- Use casual, conversational tone
- Avoid corporate jargon
- Be authentic and human
- DON'T use hashtags or emojis
- Make it feel like a genuine insight share, not a promotion

{format_instructions}""",
            ),
            (
                "human",
                """Based on the following podcast episode content, create a LinkedIn post.

--- EPISODE CONTENT ---
{episode_content}
--- END EPISODE CONTENT ---""",
            ),
        ])

        chain = prompt | self.llm | parser

        try:
            result = await chain.ainvoke({
                "episode_content": episode_content,
                "format_instructions": parser.get_format_instructions(),
            }, config=runnable_config)

            print("[green]Generated LinkedIn post[/green]")
            return result.get("post", "")

        except Exception as e:
            print(f"[yellow]Warning: Could not generate LinkedIn post: {e}[/yellow]")
            return ""

    async def _generate_twitter_thread(
        self,
        section_data: List[Dict],
        runnable_config: RunnableConfig
    ) -> List[str]:
        """Generate a Twitter/X thread that breaks down one complex concept."""

        # Compile section summaries and key points
        episode_content = json.dumps([
            {
                "title": section["title"],
                "summary": section["summary"],
                "key_points": section.get("key_points", [])
            }
            for section in section_data
        ], indent=2)

        parser = JsonOutputParser()

        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """You are an expert Twitter/X content strategist. Your task is to create an educational thread that breaks down ONE complex concept from a podcast episode.

Your output must be a JSON object with the following key:

- 'tweets': A list of 5-7 tweet texts (each under 280 characters).

Thread Structure:
1. Tweet 1 (HOOK): Counter-intuitive fact or surprising statement that makes people want to read more
2. Tweets 2-5 (THE BREAKDOWN): Break down the concept into digestible pieces
   - Each tweet should make ONE clear point
   - Use numbered format (2/7, 3/7, etc.) or not - your choice
   - Be educational, not promotional
3. Tweet 6-7 (THE CTA): Tie it together and invite them to listen to the full episode

Twitter Style Guidelines:
- Each tweet must be under 280 characters
- Use short, punchy sentences
- One idea per tweet
- Can use line breaks within tweets
- Conversational but informative tone
- Use numbers/stats when available
- Make each tweet valuable on its own

{format_instructions}""",
            ),
            (
                "human",
                """Based on the following podcast episode content, create a Twitter thread.

--- EPISODE CONTENT ---
{episode_content}
--- END EPISODE CONTENT ---""",
            ),
        ])

        chain = prompt | self.llm | parser

        try:
            result = await chain.ainvoke({
                "episode_content": episode_content,
                "format_instructions": parser.get_format_instructions(),
            }, config=runnable_config)

            tweets = result.get("tweets", [])
            print(f"[green]Generated Twitter thread with {len(tweets)} tweets[/green]")
            return tweets

        except Exception as e:
            print(f"[yellow]Warning: Could not generate Twitter thread: {e}[/yellow]")
            return []

    async def _generate_youtube_description(
        self,
        section_data: List[Dict],
        runnable_config: RunnableConfig
    ) -> str:
        """Generate a YouTube description with SEO optimization and timestamp chapters."""

        # Compile all chapter information
        chapters_info = [
            {
                "timestamp": section["timestamp"],
                "title": section["title"],
                "summary": section["summary"]
            }
            for section in section_data
        ]

        parser = JsonOutputParser()

        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """You are an expert YouTube SEO specialist. Your task is to create a YouTube video description that maximizes discoverability and viewer engagement.

Your output must be a JSON object with the following key:

- 'description': A YouTube description (150-250 words) with the following structure:

1. INTRO (2-3 sentences): Compelling hook that explains what viewers will learn/discover
2. OVERVIEW (2-4 bullet points): Key topics covered - use emojis for each bullet
3. TIMESTAMPS: Add a "CHAPTERS:" section with all timestamps listed
4. ABOUT (1-2 sentences): Brief context about the content or creator
5. CTA: Standard YouTube CTAs (subscribe, like, comment)

SEO Guidelines:
- Front-load important keywords in first 2 sentences
- Use natural keyword variations throughout
- Include relevant search terms
- Make it scannable with emojis and formatting
- Timestamps must use YouTube format (0:00, 1:23, 12:45)

{format_instructions}""",
            ),
            (
                "human",
                """Based on the following podcast chapter information, create a YouTube description.

--- CHAPTERS ---
{chapters_info}
--- END CHAPTERS ---""",
            ),
        ])

        chain = prompt | self.llm | parser

        try:
            result = await chain.ainvoke({
                "chapters_info": json.dumps(chapters_info, indent=2),
                "format_instructions": parser.get_format_instructions(),
            }, config=runnable_config)

            print("[green]Generated YouTube description[/green]")
            return result.get("description", "")

        except Exception as e:
            print(f"[yellow]Warning: Could not generate YouTube description: {e}[/yellow]")
            # Fallback: basic description with chapters
            chapters_text = "\n".join([
                f"{ch['timestamp']} - {ch['title']}"
                for ch in chapters_info
            ])
            return f"CHAPTERS:\n{chapters_text}"


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