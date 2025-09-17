"""
Section-aware quiz generation service.
"""

import json
from typing import List, Dict, Any, Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import RunnableConfig
from rich import print

from ...interfaces import SectionAnalysis
from .quiz_planner import QuizGroup, QuizPlanner


class SectionAwareQuizGenerator:
    """Generates multiple quizzes based on section groupings with proper attribution."""

    def __init__(self, llm_client):
        self.llm = llm_client
        self.quiz_planner = QuizPlanner()

    def normalize_text(self, text: str) -> str:
        """
        Normalize text for matching by removing extra whitespace and normalizing characters.

        Args:
            text: The text to normalize

        Returns:
            Normalized text
        """
        # Remove extra whitespace and normalize
        normalized = " ".join(text.split()).strip().lower()
        # Replace special characters that might cause issues
        normalized = normalized.replace("\u009d", "'")  # Replace replacement characters
        return normalized

    async def generate_quizzes(
        self,
        section_analyses: List[SectionAnalysis],
        runnable_config: RunnableConfig,
        original_transcript: str = None,
    ) -> Dict[str, Any]:
        """
        Generate multiple quizzes based on intelligent section grouping.

        Args:
            section_analyses: List of analyzed sections
            runnable_config: LangChain runnable configuration
            original_transcript: Original transcript with timestamps (optional)

        Returns:
            Dict containing multiple quizzes with metadata
        """
        # Save input parameters to MD file for analysis
        self._save_input_parameters_to_md(
            section_analyses, runnable_config, original_transcript
        )

        if not section_analyses:
            return {"error": "No sections provided for quiz generation"}

        print(
            f"[cyan]Generating section-aware quizzes for {len(section_analyses)} sections...[/cyan]"
        )

        # Step 1: Plan quiz distribution
        quiz_groups = self.quiz_planner.plan_quiz_distribution(section_analyses)

        if not quiz_groups:
            return {"error": "Could not create quiz groups from sections"}

        # Step 2: Generate questions for each quiz group
        generated_quizzes = []

        for quiz_group in quiz_groups:
            # Generate multiple choice quiz
            quiz_data = await self._generate_quiz_for_group(
                quiz_group, runnable_config, original_transcript
            )
            if quiz_data and quiz_data.get("quiz_questions"):
                generated_quizzes.append(quiz_data)

        # Generate open-ended questions for all content at once (3-8 total)
        open_ended_questions = await self._generate_all_open_ended_questions(
            section_analyses, runnable_config, original_transcript
        )

        # Step 3: Create final response structure
        if not generated_quizzes:
            return {"error": "Failed to generate any valid quizzes"}

        return self._create_multi_quiz_response(
            generated_quizzes, open_ended_questions, section_analyses
        )

    async def _generate_quiz_for_group(
        self,
        quiz_group: QuizGroup,
        runnable_config: RunnableConfig,
        original_transcript: str = None,
    ) -> Dict[str, Any]:
        """Generate quiz questions for a specific group of sections."""
        print(
            f"[blue]Generating Quiz {quiz_group.quiz_number} for {quiz_group.section_range}...[/blue]"
        )

        # Prepare section data for LLM including transcript content
        section_data = self._prepare_section_data_for_llm(
            quiz_group, original_transcript
        )

        parser = JsonOutputParser()

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    f"""You are an expert quiz generator specializing in creating comprehensive multiple choice questions for knowledge testing. You have been provided with {len(quiz_group.sections)} section(s) from a learning session.

Your task is to generate {quiz_group.estimated_questions} high-quality multiple choice questions that test understanding of the most important concepts across these sections.

CRITICAL REQUIREMENTS:
1. Generate EXACTLY {quiz_group.estimated_questions} questions (no more, no less)
2. Each question MUST have a supporting quote from the original transcript content
3. Supporting quotes MUST be EXACT word-for-word copies from the "original_transcript_content" field - NOT from summaries, entities, or key concepts
4. Use the summary, key concepts, and entities to understand what to ask about, but ONLY quote from "original_transcript_content"
5. Focus on the most valuable insights and practical concepts
6. Questions should be challenging but fair, with plausible wrong answers
7. Distribute questions across the sections when possible

IMPORTANT: For supporting quotes, you MUST:
- Look at the "original_transcript_content" array for each section
- Copy text EXACTLY as it appears in the transcript
- DO NOT use text from summaries, key_concepts, entities, or notable_quotes for supporting quotes
- These transcript quotes are what will be used for timestamp matching

Your output must be a JSON object with the following structure:

- 'quiz_questions': An array of exactly {quiz_group.estimated_questions} multiple choice questions. Each question must have:
  - 'question': A clear, specific question about a key concept or lesson
  - 'options': An array of exactly 4 answer choices (A, B, C, D options)
  - 'correct_answer': The letter of the correct answer (A, B, C, or D)
  - 'explanation': A brief explanation of why this answer is correct
  - 'supporting_quote': An EXACT word-for-word quote copied directly from the "original_transcript_content" field
  - 'related_timestamp': Leave as empty string - this will be filled automatically
  - 'source_section': The section number where this concept originated (1-{len(quiz_group.sections)})

{{format_instructions}}""",
                ),
                (
                    "human",
                    """Based on the following section content, generate quiz questions that test understanding of the key concepts and lessons.

Each section contains:
- Summary, key concepts, entities: Use these to understand WHAT to ask about
- original_transcript_content: Use this for supporting quotes (EXACT text only)

REMEMBER: Supporting quotes must come from "original_transcript_content" arrays, not from summaries or other fields.

--- SECTION CONTENT (JSON) ---
{section_data}
--- END SECTION CONTENT ---""",
                ),
            ]
        )

        chain = prompt | self.llm | parser

        try:
            quiz_result = await chain.ainvoke(
                {
                    "section_data": section_data,
                    "format_instructions": parser.get_format_instructions(),
                },
                config=runnable_config,
            )

            # Validate and enhance the quiz result
            validated_quiz = self._validate_and_enhance_quiz(
                quiz_result, quiz_group, original_transcript
            )

            print(
                f"[green]Generated {len(validated_quiz.get('quiz_questions', []))} questions for Quiz {quiz_group.quiz_number}[/green]"
            )
            return validated_quiz

        except Exception as e:
            print(
                f"[bold red]Error generating quiz for group {quiz_group.quiz_number}: {e}[/bold red]"
            )
            return {}

    async def _extract_core_insights(
        self, transcript: str, runnable_config: RunnableConfig
    ) -> List[Dict[str, str]]:
        """
        Extract 3-5 transformative insights from the transcript.

        Args:
            transcript: Full transcript text
            runnable_config: LangChain configuration

        Returns:
            List of insight dictionaries with principle, evidence, and importance
        """

        parser = JsonOutputParser()

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """You are an expert at identifying transformative insights in educational content.

Your task: Identify exactly 3-5 CORE INSIGHTS from this content.

An insight is NOT:
- A fact (e.g., "The company raised $1M")
- A piece of information (e.g., "They use React")
- A summary point (e.g., "The speaker discussed marketing")

An insight IS:
- A principle that changes how you think (e.g., "Transparency can be more defensible than secrecy")
- A pattern that applies broadly (e.g., "Community velocity outpaces employee velocity")
- A counterintuitive truth (e.g., "Giving away your product can prevent competition")

For each insight, provide:
1. 'principle': The transformative insight itself (1-2 clear sentences)
2. 'evidence': A direct quote from the transcript that demonstrates this principle
3. 'why_it_matters': Why understanding this changes someone's thinking (1 sentence)

Output format: JSON array with 3-5 insight objects

{format_instructions}""",
                ),
                (
                    "human",
                    """Analyze this transcript and extract the 3-5 most important insights that would transform how someone thinks about this topic:

--- TRANSCRIPT ---
{transcript}
--- END TRANSCRIPT ---

Remember: Focus on transformative principles, not facts or information.""",
                ),
            ]
        )

        chain = prompt | self.llm | parser

        try:
            insights = await chain.ainvoke(
                {
                    "transcript": transcript,
                    "format_instructions": parser.get_format_instructions(),
                },
                config=runnable_config,
            )

            print(f"[green]✓ Extracted {len(insights)} core insights[/green]")

            # Log insights for debugging
            for i, insight in enumerate(insights, 1):
                print(f"[blue]  Insight {i}: {insight['principle'][:50]}...[/blue]")

            return insights

        except Exception as e:
            print(f"[red]✗ Failed to extract insights: {e}[/red]")
            print("[yellow]  Falling back to standard question generation[/yellow]")
            return []

    async def _generate_all_open_ended_questions(
        self,
        section_analyses: List[SectionAnalysis],
        runnable_config: RunnableConfig,
        original_transcript: str = None,
    ) -> List[Dict]:
        """
        Generate insight-based open-ended questions with transparent evaluation criteria.
        """

        print(f"[blue]Generating transparent insight-based questions...[/blue]")

        # Step 1: Use original transcript if provided, otherwise reconstruct from sections
        if original_transcript:
            # Use the provided original transcript
            if isinstance(original_transcript, list):
                # If it's structured, extract text
                full_transcript = "\n".join(
                    [
                        item.get("text", "")
                        for item in original_transcript
                        if isinstance(item, dict)
                    ]
                )
            else:
                # If it's a string, use it directly
                full_transcript = original_transcript
        else:
            # Fallback: reconstruct from section summaries
            transcript_parts = []
            for section in section_analyses:
                content = getattr(section, "content", None) or section.summary
                transcript_parts.append(content)
            full_transcript = "\n\n".join(transcript_parts)

        # Step 2: Extract core insights
        insights = await self._extract_core_insights(full_transcript, runnable_config)

        if not insights:
            print("[yellow]No insights extracted, returning empty list[/yellow]")
            return []

        # Step 3: Calculate number of questions
        total_duration = self._calculate_total_duration(section_analyses)
        num_questions = self._calculate_open_ended_count(
            total_duration, section_analyses
        )

        print(
            f"[cyan]Generating {num_questions} transparent questions from {len(insights)} insights[/cyan]"
        )

        # Step 5: Generate questions with full transparency
        parser = JsonOutputParser()

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    f"""You are creating educational questions that test understanding while being clear and accessible.

You have:
1. {len(insights)} core insights from the content
2. The full transcript for context

Your task: Generate EXACTLY {num_questions} questions that are transparent about expectations while using natural, conversational language.

CRITICAL LANGUAGE REQUIREMENTS:
✅ Use simple, everyday language that a smart high school student would understand
✅ Avoid academic jargon like "schema", "cognitive", "framework", "dual process"
✅ If you must use a technical term, immediately explain it in parentheses
✅ Write like you're having a conversation, not giving an exam

GOOD EXAMPLE:
"The video explained that connecting new information to what you already know is key to learning. 
Why is making these connections more valuable than just memorizing facts?
In your answer, explain:
- What happens when you connect new ideas to existing knowledge
- Why isolated facts are harder to remember
- A personal example where this worked (or didn't work) for you"

BAD EXAMPLE (too academic):
"Based on the principle that learning is fundamentally about understanding how new information connects to existing knowledge schemas..."

QUESTION STRUCTURE:
1. Reference the video/content naturally: "The video explained that..." or "According to the discussion..."
2. Ask a clear, specific question in plain language
3. List what to address using bullet points or numbers
4. When possible, ask for personal examples or real-world applications

For each question, provide:
- 'question_text': The complete question in conversational language
- 'insight_principle': The core insight (keep this simple too)
- 'evaluation_criteria': 2-3 specific points written in everyday language

Output format: JSON object with 'questions' array containing exactly {num_questions} question objects

{{format_instructions}}""",
                ),
                (
                    "human",
                    """Using these insights and transcript, generate {num_questions} clear, accessible questions:

--- CORE INSIGHTS ---
{insights_json}
--- END INSIGHTS ---

--- FULL TRANSCRIPT ---
{transcript}
--- END TRANSCRIPT ---

Remember: 
- Write in conversational, friendly language
- Avoid academic jargon
- Make expectations crystal clear
- Focus on practical understanding, not theoretical knowledge""",
                ),
            ]
        )

        chain = prompt | self.llm | parser

        try:
            result = await chain.ainvoke(
                {
                    "insights_json": json.dumps(insights, indent=2),
                    "transcript": full_transcript,
                    "num_questions": num_questions,
                    "format_instructions": parser.get_format_instructions(),
                },
                config=runnable_config,
            )

            questions = result.get("questions", [])

            # Format questions with simplified structure
            formatted_questions = []
            for i, q in enumerate(questions):
                print(f"[blue]Processing question {i+1}...[/blue]")

                formatted_questions.append(
                    {
                        "question": q.get("question_text", ""),
                        "metadata": {
                            "insight_principle": q.get("insight_principle", ""),
                            "evaluation_criteria": q.get("evaluation_criteria", []),
                        },
                    }
                )

                print(f"  [green]✓ Question {i+1} processed[/green]")

            print(
                f"[green]✓ Generated {len(formatted_questions)} transparent questions[/green]"
            )
            return formatted_questions

        except Exception as e:
            print(f"[red]✗ Failed to generate transparent questions: {e}[/red]")
            return []

    def _calculate_open_ended_count(
        self, total_duration_minutes: float, section_analyses: List[SectionAnalysis]
    ) -> int:
        """Calculate the number of open-ended questions based on duration and content."""
        # Base calculation on duration
        if total_duration_minutes <= 20:  # Short content (≤20 min)
            base_count = 3
        elif total_duration_minutes <= 60:  # Medium content (20-60 min)
            base_count = 5
        elif total_duration_minutes <= 120:  # Long content (1-2 hours)
            base_count = 6
        else:  # Very long content (>2 hours)
            base_count = 7

        # Adjust based on content richness
        total_concepts = sum(
            len(section.additional_data.get("lessons_and_concepts", []))
            for section in section_analyses
        )

        # If very concept-rich, add 1 more question (max 8)
        if total_concepts > 15:
            base_count = min(8, base_count + 1)

        # Ensure we stay within bounds (3-8)
        return max(3, min(8, base_count))

    def _prepare_all_section_data_for_llm(
        self, section_analyses: List[SectionAnalysis]
    ) -> str:
        """Prepare all section data in optimal format for LLM processing."""
        section_data = []

        for i, section in enumerate(section_analyses):
            # Extract lessons and concepts with proper structure
            lessons = section.additional_data.get("lessons_and_concepts", [])

            # Ensure lessons are in proper format
            structured_lessons = []
            for lesson in lessons:
                if isinstance(lesson, dict):
                    structured_lessons.append(lesson)
                elif isinstance(lesson, str):
                    # Convert string lesson to structured format
                    structured_lessons.append(
                        {
                            "lesson": lesson,
                            "supporting_quote": "Quote not available",
                            "real_life_examples": [],
                        }
                    )

            section_info = {
                "section_number": i + 1,
                "time_range": f"{section.start_time} - {section.end_time}",
                "title": section.title,
                "summary": section.summary,
                "key_concepts": structured_lessons,
                "notable_quotes": section.quotes,
                "entities": [
                    {"name": e.name, "explanation": e.explanation}
                    for e in section.entities
                ],
                "key_points": section.additional_data.get("key_points", []),
            }
            section_data.append(section_info)

        return json.dumps(section_data, indent=2)

    def _prepare_section_data_for_llm(
        self, quiz_group: QuizGroup, original_transcript: str = None
    ) -> str:
        """Prepare section data in optimal format for LLM processing."""
        section_data = []

        # Since timestamp extraction was removed, use empty content
        section_transcript_content = {}

        for i, section in enumerate(quiz_group.sections):
            # Extract lessons and concepts with proper structure
            lessons = section.additional_data.get("lessons_and_concepts", [])

            # Ensure lessons are in proper format
            structured_lessons = []
            for lesson in lessons:
                if isinstance(lesson, dict):
                    structured_lessons.append(lesson)
                elif isinstance(lesson, str):
                    # Convert string lesson to structured format
                    structured_lessons.append(
                        {
                            "lesson": lesson,
                            "supporting_quote": "Quote not available",
                            "real_life_examples": [],
                        }
                    )

            section_info = {
                "section_number": i + 1,
                "global_section_index": quiz_group.section_indices[i] + 1,
                "time_range": f"{section.start_time} - {section.end_time}",
                "title": section.title,
                "summary": section.summary,
                "key_concepts": structured_lessons,
                "notable_quotes": section.quotes,
                "entities": [
                    {"name": e.name, "explanation": e.explanation}
                    for e in section.entities
                ],
                "key_points": section.additional_data.get("key_points", []),
                "original_transcript_content": section_transcript_content.get(i, []),
            }
            section_data.append(section_info)

        return json.dumps(section_data, indent=2)

    def _validate_and_enhance_quiz(
        self,
        quiz_result: Dict[str, Any],
        quiz_group: QuizGroup,
        original_transcript: str = None,
    ) -> Dict[str, Any]:
        """Validate and enhance the generated quiz with additional metadata."""
        questions = quiz_result.get("quiz_questions", [])

        # Quote validation removed as part of timestamp cleanup

        # Enhance each question with additional metadata
        enhanced_questions = []
        for i, question in enumerate(questions):
            enhanced_question = {
                **question,
                "question_id": f"q{quiz_group.quiz_number}_{i+1}",
                "difficulty": "medium",  # Could be made dynamic
                "quiz_number": quiz_group.quiz_number,
                "section_range": quiz_group.section_range,
            }

            # Ensure required fields are present
            if not enhanced_question.get("supporting_quote"):
                enhanced_question["supporting_quote"] = (
                    "Supporting material from the content"
                )

            if not enhanced_question.get("related_timestamp"):
                enhanced_question["related_timestamp"] = quiz_group.sections[
                    0
                ].start_time

            enhanced_questions.append(enhanced_question)

        return {
            "quiz_questions": enhanced_questions,
            "quiz_metadata": {
                "quiz_number": quiz_group.quiz_number,
                "section_range": quiz_group.section_range,
                "total_questions": len(enhanced_questions),
                "estimated_time_minutes": len(enhanced_questions)
                * 2,  # 2 minutes per question
                "difficulty_distribution": self._calculate_difficulty_distribution(
                    enhanced_questions
                ),
                "source_sections": quiz_group.section_indices,
                "concepts_covered": quiz_group.total_concepts,
            },
        }

    def _calculate_difficulty_distribution(
        self, questions: List[Dict]
    ) -> Dict[str, int]:
        """Calculate difficulty distribution for questions."""
        # Simple distribution - could be enhanced with actual difficulty analysis
        total = len(questions)
        return {
            "easy": max(1, total // 4),
            "medium": max(1, total // 2),
            "hard": max(0, total - (total // 4) - (total // 2)),
        }

    def _create_multi_quiz_response(
        self,
        generated_quizzes: List[Dict[str, Any]],
        open_ended_questions: List[Dict],
        section_analyses: List[SectionAnalysis],
    ) -> Dict[str, Any]:
        """Create the final multi-quiz response structure."""
        all_questions = []
        quiz_metadata = []

        for quiz_data in generated_quizzes:
            all_questions.extend(quiz_data.get("quiz_questions", []))
            quiz_metadata.append(quiz_data.get("quiz_metadata", {}))

        total_duration = self._calculate_total_duration(section_analyses)

        return {
            "quiz_questions": all_questions,  # For backward compatibility
            "open_ended_questions": open_ended_questions,  # New open-ended questions
            "quizzes": generated_quizzes,  # New multi-quiz structure
            "quiz_metadata": {
                "total_quizzes": len(generated_quizzes),
                "total_questions": len(all_questions),
                "total_open_ended_questions": len(open_ended_questions),
                "total_sections": len(section_analyses),
                "estimated_time_minutes": len(all_questions) * 2
                + len(open_ended_questions) * 3,  # 2 min MCQ, 3 min open-ended
                "content_duration_minutes": total_duration,
                "quiz_distribution": quiz_metadata,
                "generation_approach": "section_aware_multi_quiz",
            },
        }

    def _calculate_total_duration(
        self, section_analyses: List[SectionAnalysis]
    ) -> float:
        """Calculate total duration of all sections."""
        total_seconds = 0

        for section in section_analyses:
            try:
                start_parts = section.start_time.split(":")
                end_parts = section.end_time.split(":")

                if len(start_parts) == 2:  # MM:SS format
                    start_seconds = int(start_parts[0]) * 60 + int(start_parts[1])
                elif len(start_parts) == 3:  # HH:MM:SS format
                    start_seconds = (
                        int(start_parts[0]) * 3600
                        + int(start_parts[1]) * 60
                        + int(start_parts[2])
                    )
                else:
                    continue

                if len(end_parts) == 2:  # MM:SS format
                    end_seconds = int(end_parts[0]) * 60 + int(end_parts[1])
                elif len(end_parts) == 3:  # HH:MM:SS format
                    end_seconds = (
                        int(end_parts[0]) * 3600
                        + int(end_parts[1]) * 60
                        + int(end_parts[2])
                    )
                else:
                    continue

                section_duration = max(0, end_seconds - start_seconds)
                total_seconds += section_duration

            except (ValueError, IndexError):
                continue

        return total_seconds / 60.0

    def _save_input_parameters_to_md(
        self,
        section_analyses: List[SectionAnalysis],
        runnable_config: RunnableConfig,
        original_transcript: str = None,
    ) -> None:
        """
        Save the input parameters to a markdown file for analysis.

        Args:
            section_analyses: List of analyzed sections
            runnable_config: LangChain runnable configuration
            original_transcript: Original transcript with timestamps (optional)
        """
        import datetime
        import os

        # Create timestamp for filename
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"quiz_generation_input_{timestamp}.md"

        # Create the markdown content
        md_content = f"""# Quiz Generation Input Parameters

Generated at: {datetime.datetime.now().isoformat()}

## Section Analyses ({len(section_analyses)} sections)

"""

        # Add section analyses details
        for i, section in enumerate(section_analyses):
            md_content += f"""### Section {i+1}
- **Title**: {section.title}
- **Start Time**: {section.start_time}
- **End Time**: {section.end_time}
- **Summary**: {section.summary}

#### Entities
"""
            for entity in section.entities:
                md_content += f"- **{entity.name}**: {entity.explanation}\n"

            md_content += f"""
#### Quotes
"""
            for quote in section.quotes:
                md_content += f"- {quote}\n"

            md_content += f"""
#### Additional Data
```json
{json.dumps(section.additional_data, indent=2)}
```

"""

        # Add runnable config
        md_content += f"""## Runnable Config

```json
{json.dumps(dict(runnable_config) if runnable_config else {}, indent=2, default=str)}
```

## Original Transcript

**Type**: {type(original_transcript).__name__}
**Length**: {len(str(original_transcript)) if original_transcript else 0} characters

"""

        if original_transcript:
            if isinstance(original_transcript, list):
                md_content += f"""**Structure**: List with {len(original_transcript)} items

### First 3 items (if available):
```json
{json.dumps(original_transcript[:3], indent=2)}
```
"""
            else:
                md_content += f"""**Content (first 1000 characters)**:
```
{str(original_transcript)[:1000]}
```
"""

        # Save to file
        try:
            with open(filename, "w", encoding="utf-8") as f:
                f.write(md_content)
            print(f"[green]✓ Saved input parameters to {filename}[/green]")
        except Exception as e:
            print(f"[red]✗ Failed to save input parameters: {e}[/red]")
