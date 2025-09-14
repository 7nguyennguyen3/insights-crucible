"""
Section-aware quiz generation service.
"""

import json
import re
from typing import List, Dict, Any, Tuple, Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import RunnableConfig
from rich import print

from ...interfaces import SectionAnalysis
from .quiz_planner import QuizGroup, QuizPlanner
from ....find_quote_timestamps import parse_transcript


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
        normalized = ' '.join(text.split()).strip().lower()
        # Replace special characters that might cause issues
        normalized = normalized.replace('\u009d', "'")  # Replace replacement characters
        return normalized

    def find_quote_timestamp(self, quote: str, timestamped_lines: List[Tuple[str, str]]) -> Optional[str]:
        """
        Find the timestamp for a given quote by matching it with the transcript.
        
        Args:
            quote: The quote to find
            timestamped_lines: List of (timestamp, text) tuples from the transcript
            
        Returns:
            The timestamp if found, None otherwise
        """
        # Normalize the quote for matching
        clean_quote = self.normalize_text(quote)
        
        # Try exact matching first
        for timestamp, text in timestamped_lines:
            clean_text = self.normalize_text(text)
            
            # Check if the quote is in this text
            if clean_quote in clean_text:
                return timestamp
        
        # Try partial matching with word overlap
        quote_words = set(clean_quote.split())
        if not quote_words:
            return None
            
        best_match = None
        best_timestamp = None
        best_overlap = 0
        
        for timestamp, text in timestamped_lines:
            clean_text = self.normalize_text(text)
            text_words = set(clean_text.split())
            
            if text_words:
                # Calculate word overlap
                overlap = len(quote_words.intersection(text_words)) / len(quote_words)
                # Also consider how much of the text matches the quote
                text_overlap = len(quote_words.intersection(text_words)) / len(text_words)
                
                # Use a combination of both overlaps
                combined_overlap = (overlap + text_overlap) / 2
                
                if combined_overlap > 0.5 and combined_overlap > best_overlap:
                    best_overlap = combined_overlap
                    best_timestamp = timestamp
                    best_match = clean_text
        
        # Return best fuzzy match if found
        if best_timestamp:
            return best_timestamp
        
        return None
    
    def _add_timestamps_to_quiz(self, quiz_data: Dict[str, Any], timestamped_lines: List[Tuple[str, str]]) -> Dict[str, Any]:
        """
        Add timestamps to quiz questions by matching supporting quotes with the transcript.
        
        Args:
            quiz_data: The quiz data containing questions
            timestamped_lines: List of (timestamp, text) tuples from the transcript
            
        Returns:
            Updated quiz data with timestamps
        """
        questions = quiz_data.get("quiz_questions", [])
        updated_questions = []
        
        for question in questions:
            updated_question = question.copy()
            supporting_quote = question.get("supporting_quote")
            
            if supporting_quote:
                timestamp = self.find_quote_timestamp(supporting_quote, timestamped_lines)
                if timestamp:
                    updated_question["related_timestamp"] = timestamp
                else:
                    # Fallback to the section's start time if no match found
                    updated_question["related_timestamp"] = question.get("related_timestamp", "00:00")
            
            updated_questions.append(updated_question)
        
        quiz_data["quiz_questions"] = updated_questions
        return quiz_data
    
    
    async def generate_quizzes(
        self,
        section_analyses: List[SectionAnalysis],
        runnable_config: RunnableConfig,
        original_transcript: str = None
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
        if not section_analyses:
            return {"error": "No sections provided for quiz generation"}
        
        print(f"[cyan]Generating section-aware quizzes for {len(section_analyses)} sections...[/cyan]")
        
        # Parse transcript for timestamp matching if provided
        timestamped_lines = None
        if original_transcript:
            try:
                timestamped_lines = parse_transcript(original_transcript)
                print(f"[blue]Parsed {len(timestamped_lines)} timestamped lines from transcript[/blue]")
            except Exception as e:
                print(f"[yellow]Warning: Could not parse transcript for timestamp matching: {e}[/yellow]")
        
        # Step 1: Plan quiz distribution
        quiz_groups = self.quiz_planner.plan_quiz_distribution(section_analyses)
        
        if not quiz_groups:
            return {"error": "Could not create quiz groups from sections"}
        
        # Step 2: Generate questions for each quiz group
        generated_quizzes = []
        open_ended_questions = []
        
        for quiz_group in quiz_groups:
            # Generate multiple choice quiz
            quiz_data = await self._generate_quiz_for_group(quiz_group, runnable_config)
            if quiz_data and quiz_data.get("quiz_questions"):
                # Add timestamps to quiz questions if transcript is available
                if timestamped_lines:
                    quiz_data = self._add_timestamps_to_quiz(quiz_data, timestamped_lines)
                generated_quizzes.append(quiz_data)
            
            # Generate open-ended questions
            open_ended_data = await self._generate_open_ended_questions(quiz_group, runnable_config)
            if open_ended_data and open_ended_data.get("open_ended_questions"):
                open_ended_questions.extend(open_ended_data["open_ended_questions"])
        
        # Step 3: Create final response structure
        if not generated_quizzes:
            return {"error": "Failed to generate any valid quizzes"}
        
        return self._create_multi_quiz_response(generated_quizzes, open_ended_questions, section_analyses)
    
    async def _generate_quiz_for_group(
        self,
        quiz_group: QuizGroup,
        runnable_config: RunnableConfig
    ) -> Dict[str, Any]:
        """Generate quiz questions for a specific group of sections."""
        print(f"[blue]Generating Quiz {quiz_group.quiz_number} for {quiz_group.section_range}...[/blue]")
        
        # Prepare section data for LLM
        section_data = self._prepare_section_data_for_llm(quiz_group)
        
        parser = JsonOutputParser()
        
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                f"""You are an expert quiz generator specializing in creating comprehensive multiple choice questions for knowledge testing. You have been provided with {len(quiz_group.sections)} section(s) from a learning session.

Your task is to generate {quiz_group.estimated_questions} high-quality multiple choice questions that test understanding of the most important concepts across these sections.

CRITICAL REQUIREMENTS:
1. Generate EXACTLY {quiz_group.estimated_questions} questions (no more, no less)
2. Each question MUST have a supporting quote from the provided sections
3. Focus on the most valuable insights and practical concepts
4. Questions should be challenging but fair, with plausible wrong answers
5. Distribute questions across the sections when possible

Your output must be a JSON object with the following structure:

- 'quiz_questions': An array of exactly {quiz_group.estimated_questions} multiple choice questions. Each question must have:
  - 'question': A clear, specific question about a key concept or lesson
  - 'options': An array of exactly 4 answer choices (A, B, C, D options)
  - 'correct_answer': The letter of the correct answer (A, B, C, or D)
  - 'explanation': A brief explanation of why this answer is correct
  - 'supporting_quote': A direct quote from the content that supports this question/answer
  - 'related_timestamp': The timestamp where this concept was discussed
  - 'source_section': The section number where this concept originated (1-{len(quiz_group.sections)})

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
            quiz_result = await chain.ainvoke({
                "section_data": section_data,
                "format_instructions": parser.get_format_instructions(),
            }, config=runnable_config)
            
            # Validate and enhance the quiz result
            validated_quiz = self._validate_and_enhance_quiz(quiz_result, quiz_group)
            
            print(f"[green]Generated {len(validated_quiz.get('quiz_questions', []))} questions for Quiz {quiz_group.quiz_number}[/green]")
            return validated_quiz
            
        except Exception as e:
            print(f"[bold red]Error generating quiz for group {quiz_group.quiz_number}: {e}[/bold red]")
            return {}
    
    async def _generate_open_ended_questions(
        self,
        quiz_group: QuizGroup,
        runnable_config: RunnableConfig
    ) -> Dict[str, Any]:
        """Generate simple open-ended questions for deeper learning assessment."""
        print(f"[blue]Generating Open-Ended Questions for {quiz_group.section_range}...[/blue]")
        
        # Prepare section data for LLM
        section_data = self._prepare_section_data_for_llm(quiz_group)
        
        parser = JsonOutputParser()
        
        # Generate 2-4 open-ended questions based on content richness
        num_open_ended = min(4, max(2, quiz_group.total_concepts // 3))
        
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                f"""You are an expert learning experience designer specializing in personal reflection and practical application. Create {num_open_ended} open-ended questions that MUST encourage deep personal reflection and self-connection to the content.

CRITICAL: Every question must require personal reflection, self-examination, or practical application. Use these question types based on content:

**For Knowledge-Based Content:**
- "How would you explain [key concept] to a friend in simple terms?"
- "What personal experiences have you had that relate to [concept]?"
- "How does [concept] change your perspective on [related topic]?"

**For Technical/Practical Content:**
- "How would you implement [technique/method] in your daily life or work?"
- "What challenges might you face when applying [concept], and how would you overcome them?"
- "How could you adapt [approach] to fit your specific situation or goals?"

**General Personal Reflection:**
- "What assumptions of yours does this challenge or confirm?"
- "How does this connect to your personal values or beliefs?"
- "What would you do differently after learning this?"

Your output must be a JSON object with:
- 'open_ended_questions': An array of exactly {num_open_ended} questions, each with only:
  - 'question': A personal reflection question that requires introspection, explanation, or practical application

Focus on the most transformative insights from the content that can create personal growth or practical change.

{{format_instructions}}""",
            ),
            (
                "human",
                """Based on the following section content, generate open-ended questions that require personal reflection, self-examination, and practical application of the key concepts.

Focus on questions that help learners connect the content to their own experiences, values, and future actions.

--- SECTION CONTENT (JSON) ---
{section_data}
--- END SECTION CONTENT ---""",
            ),
        ])
        
        chain = prompt | self.llm | parser
        
        try:
            result = await chain.ainvoke({
                "section_data": section_data,
                "format_instructions": parser.get_format_instructions(),
            }, config=runnable_config)
            
            open_ended_questions = result.get("open_ended_questions", [])
            
            print(f"[green]Generated {len(open_ended_questions)} open-ended questions for Quiz {quiz_group.quiz_number}[/green]")
            return {"open_ended_questions": open_ended_questions}
            
        except Exception as e:
            print(f"[bold red]Error generating open-ended questions for group {quiz_group.quiz_number}: {e}[/bold red]")
            return {}
    
    def _prepare_section_data_for_llm(self, quiz_group: QuizGroup) -> str:
        """Prepare section data in optimal format for LLM processing."""
        section_data = []
        
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
                    structured_lessons.append({
                        "lesson": lesson,
                        "supporting_quote": "Quote not available",
                        "real_life_examples": []
                    })
            
            section_info = {
                "section_number": i + 1,
                "global_section_index": quiz_group.section_indices[i] + 1,
                "time_range": f"{section.start_time} - {section.end_time}",
                "title": section.title,
                "summary": section.summary,
                "key_concepts": structured_lessons,
                "notable_quotes": section.quotes,
                "entities": [{"name": e.name, "explanation": e.explanation} for e in section.entities],
                "key_points": section.additional_data.get("key_points", [])
            }
            section_data.append(section_info)
        
        return json.dumps(section_data, indent=2)
    
    def _validate_and_enhance_quiz(
        self,
        quiz_result: Dict[str, Any],
        quiz_group: QuizGroup
    ) -> Dict[str, Any]:
        """Validate and enhance the generated quiz with additional metadata."""
        questions = quiz_result.get("quiz_questions", [])
        
        # Enhance each question with additional metadata
        enhanced_questions = []
        for i, question in enumerate(questions):
            enhanced_question = {
                **question,
                "question_id": f"q{quiz_group.quiz_number}_{i+1}",
                "difficulty": "medium",  # Could be made dynamic
                "quiz_number": quiz_group.quiz_number,
                "section_range": quiz_group.section_range
            }
            
            # Ensure required fields are present
            if not enhanced_question.get("supporting_quote"):
                enhanced_question["supporting_quote"] = "Supporting material from the content"
            
            if not enhanced_question.get("related_timestamp"):
                enhanced_question["related_timestamp"] = quiz_group.sections[0].start_time
                
            enhanced_questions.append(enhanced_question)
        
        return {
            "quiz_questions": enhanced_questions,
            "quiz_metadata": {
                "quiz_number": quiz_group.quiz_number,
                "section_range": quiz_group.section_range,
                "total_questions": len(enhanced_questions),
                "estimated_time_minutes": len(enhanced_questions) * 2,  # 2 minutes per question
                "difficulty_distribution": self._calculate_difficulty_distribution(enhanced_questions),
                "source_sections": quiz_group.section_indices,
                "concepts_covered": quiz_group.total_concepts
            }
        }
    
    def _calculate_difficulty_distribution(self, questions: List[Dict]) -> Dict[str, int]:
        """Calculate difficulty distribution for questions."""
        # Simple distribution - could be enhanced with actual difficulty analysis
        total = len(questions)
        return {
            "easy": max(1, total // 4),
            "medium": max(1, total // 2),
            "hard": max(0, total - (total // 4) - (total // 2))
        }
    
    def _create_multi_quiz_response(
        self,
        generated_quizzes: List[Dict[str, Any]],
        open_ended_questions: List[Dict],
        section_analyses: List[SectionAnalysis]
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
                "estimated_time_minutes": len(all_questions) * 2 + len(open_ended_questions) * 3,  # 2 min MCQ, 3 min open-ended
                "content_duration_minutes": total_duration,
                "quiz_distribution": quiz_metadata,
                "generation_approach": "section_aware_multi_quiz"
            }
        }
    
    def _calculate_total_duration(self, section_analyses: List[SectionAnalysis]) -> float:
        """Calculate total duration of all sections."""
        total_seconds = 0
        
        for section in section_analyses:
            try:
                start_parts = section.start_time.split(":")
                end_parts = section.end_time.split(":")
                
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
                continue
        
        return total_seconds / 60.0