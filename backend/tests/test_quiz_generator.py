"""
Unit tests for SectionAwareQuizGenerator component.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import unittest
from unittest.mock import Mock, patch, AsyncMock
import json
import asyncio
from typing import List

from pipeline.services.analysis.quiz_generator import SectionAwareQuizGenerator
from pipeline.services.analysis.quiz_planner import QuizGroup
from pipeline.interfaces import SectionAnalysis, EntityExplanation
from langchain_core.runnables import RunnableConfig


def create_mock_section(
    index: int,
    start_time: str = "00:00",
    end_time: str = "05:00",
    title: str = "Test Section",
    summary: str = "Test summary",
    lessons_count: int = 3,
    entities_count: int = 2,
    quotes_count: int = 1
) -> SectionAnalysis:
    """Create a mock SectionAnalysis for testing."""
    entities = [
        EntityExplanation(name=f"Entity{i}", explanation=f"Explanation{i}")
        for i in range(entities_count)
    ]
    
    lessons = [
        {
            "lesson": f"Lesson {i+1} for section {index+1}",
            "supporting_quote": f"Supporting quote {i+1}",
            "real_life_examples": [f"Example {i+1}"]
        }
        for i in range(lessons_count)
    ]
    
    quotes = [f"Quote {i+1} from section {index+1}" for i in range(quotes_count)]
    
    return SectionAnalysis(
        start_time=start_time,
        end_time=end_time,
        title=f"{title} {index+1}",
        summary=f"{summary} {index+1}",
        quotes=quotes,
        entities=entities,
        additional_data={
            "lessons_and_concepts": lessons,
            "key_points": [f"Key point {i+1}" for i in range(2)]
        }
    )


def create_mock_quiz_group(sections: List[SectionAnalysis], quiz_number: int = 1) -> QuizGroup:
    """Create a mock QuizGroup for testing."""
    return QuizGroup(
        sections=sections,
        quiz_number=quiz_number,
        estimated_questions=6,
        total_concepts=len(sections) * 3,
        section_indices=list(range(len(sections)))
    )


class TestSectionAwareQuizGenerator(unittest.TestCase):
    """Test cases for SectionAwareQuizGenerator."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_llm = AsyncMock()
        self.quiz_generator = SectionAwareQuizGenerator(self.mock_llm)
        self.runnable_config = RunnableConfig()
    
    def test_init(self):
        """Test initialization of SectionAwareQuizGenerator."""
        self.assertIsNotNone(self.quiz_generator.llm)
        self.assertIsNotNone(self.quiz_generator.quiz_planner)
    
    def test_empty_sections_error(self):
        """Test that empty sections return error."""
        async def run_test():
            result = await self.quiz_generator.generate_quizzes([], self.runnable_config)
            self.assertIn("error", result)
            self.assertEqual(result["error"], "No sections provided for quiz generation")
        
        asyncio.run(run_test())
    
    def test_prepare_section_data_for_llm(self):
        """Test section data preparation for LLM."""
        sections = [
            create_mock_section(0, start_time="00:00", end_time="05:00", lessons_count=2),
            create_mock_section(1, start_time="05:00", end_time="10:00", lessons_count=3)
        ]
        quiz_group = create_mock_quiz_group(sections)
        
        section_data_str = self.quiz_generator._prepare_section_data_for_llm(quiz_group)
        section_data = json.loads(section_data_str)
        
        # Verify structure
        self.assertEqual(len(section_data), 2)
        
        # Check first section
        first_section = section_data[0]
        self.assertEqual(first_section["section_number"], 1)
        self.assertEqual(first_section["global_section_index"], 1)
        self.assertEqual(first_section["time_range"], "00:00 - 05:00")
        self.assertEqual(first_section["title"], "Test Section 1")
        self.assertEqual(len(first_section["key_concepts"]), 2)
        
        # Check second section
        second_section = section_data[1]
        self.assertEqual(second_section["section_number"], 2)
        self.assertEqual(len(second_section["key_concepts"]), 3)
    
    def test_prepare_section_data_string_lessons(self):
        """Test section data preparation when lessons are strings instead of dicts."""
        # Create section with string lessons (edge case)
        section = SectionAnalysis(
            start_time="00:00",
            end_time="05:00",
            title="Test Section",
            summary="Test summary",
            quotes=["Test quote"],
            entities=[EntityExplanation(name="Entity1", explanation="Explanation1")],
            additional_data={
                "lessons_and_concepts": ["String lesson 1", "String lesson 2"],
                "key_points": ["Key point 1"]
            }
        )
        
        quiz_group = create_mock_quiz_group([section])
        section_data_str = self.quiz_generator._prepare_section_data_for_llm(quiz_group)
        section_data = json.loads(section_data_str)
        
        # Verify that string lessons are converted to proper structure
        concepts = section_data[0]["key_concepts"]
        self.assertEqual(len(concepts), 2)
        self.assertEqual(concepts[0]["lesson"], "String lesson 1")
        self.assertEqual(concepts[0]["supporting_quote"], "Quote not available")
    
    def test_validate_and_enhance_quiz(self):
        """Test quiz validation and enhancement."""
        sections = [create_mock_section(0)]
        quiz_group = create_mock_quiz_group(sections)
        
        # Mock quiz result from LLM
        mock_quiz_result = {
            "quiz_questions": [
                {
                    "question": "What is the main concept?",
                    "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
                    "correct_answer": "A",
                    "explanation": "This is the correct answer because...",
                    "supporting_quote": "Original quote",
                    "related_timestamp": "00:30"
                }
            ]
        }
        
        enhanced_quiz = self.quiz_generator._validate_and_enhance_quiz(mock_quiz_result, quiz_group)
        
        # Check enhanced structure
        self.assertIn("quiz_questions", enhanced_quiz)
        self.assertIn("quiz_metadata", enhanced_quiz)
        
        enhanced_question = enhanced_quiz["quiz_questions"][0]
        self.assertIn("question_id", enhanced_question)
        self.assertEqual(enhanced_question["quiz_number"], 1)
        self.assertEqual(enhanced_question["section_range"], "Section 1")
        
        # Check metadata
        metadata = enhanced_quiz["quiz_metadata"]
        self.assertEqual(metadata["quiz_number"], 1)
        self.assertEqual(metadata["total_questions"], 1)
        self.assertIn("difficulty_distribution", metadata)
    
    def test_validate_and_enhance_quiz_missing_fields(self):
        """Test quiz validation when required fields are missing."""
        sections = [create_mock_section(0)]
        quiz_group = create_mock_quiz_group(sections)
        
        # Mock quiz result with missing fields
        mock_quiz_result = {
            "quiz_questions": [
                {
                    "question": "What is the main concept?",
                    "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
                    "correct_answer": "A",
                    "explanation": "This is the correct answer because..."
                    # Missing supporting_quote and related_timestamp
                }
            ]
        }
        
        enhanced_quiz = self.quiz_generator._validate_and_enhance_quiz(mock_quiz_result, quiz_group)
        
        enhanced_question = enhanced_quiz["quiz_questions"][0]
        # Should add default values for missing fields
        self.assertIn("supporting_quote", enhanced_question)
        self.assertIn("related_timestamp", enhanced_question)
    
    def test_calculate_difficulty_distribution(self):
        """Test difficulty distribution calculation."""
        questions = [{"question": f"Q{i}"} for i in range(6)]
        
        distribution = self.quiz_generator._calculate_difficulty_distribution(questions)
        
        # Check that distribution adds up correctly
        total = distribution["easy"] + distribution["medium"] + distribution["hard"]
        self.assertGreaterEqual(total, len(questions))
        self.assertIn("easy", distribution)
        self.assertIn("medium", distribution)
        self.assertIn("hard", distribution)
    
    def test_calculate_total_duration(self):
        """Test total duration calculation."""
        sections = [
            create_mock_section(0, start_time="00:00", end_time="05:00"),
            create_mock_section(1, start_time="05:00", end_time="12:30")
        ]
        
        duration = self.quiz_generator._calculate_total_duration(sections)
        
        # First section: 5 minutes, Second section: 7.5 minutes, Total: 12.5 minutes
        self.assertAlmostEqual(duration, 12.5, places=1)
    
    def test_calculate_total_duration_hms_format(self):
        """Test total duration calculation with HH:MM:SS format."""
        sections = [
            create_mock_section(0, start_time="01:00:00", end_time="01:05:30"),
            create_mock_section(1, start_time="01:05:30", end_time="01:15:00")
        ]
        
        duration = self.quiz_generator._calculate_total_duration(sections)
        
        # First section: 5.5 minutes, Second section: 9.5 minutes, Total: 15 minutes
        self.assertAlmostEqual(duration, 15.0, places=1)
    
    def test_create_multi_quiz_response(self):
        """Test creation of multi-quiz response structure."""
        sections = [create_mock_section(0), create_mock_section(1)]
        
        # Mock generated quizzes
        generated_quizzes = [
            {
                "quiz_questions": [
                    {"question": "Q1", "quiz_number": 1},
                    {"question": "Q2", "quiz_number": 1}
                ],
                "quiz_metadata": {"quiz_number": 1, "total_questions": 2}
            },
            {
                "quiz_questions": [
                    {"question": "Q3", "quiz_number": 2}
                ],
                "quiz_metadata": {"quiz_number": 2, "total_questions": 1}
            }
        ]
        
        # Mock open-ended questions for the test
        open_ended_questions = [
            {
                "question": "How would you explain this concept in simple terms?",
                "generic_answer": "This concept means understanding how ideas connect to make learning stick better."
            },
            {
                "question": "How would you apply this in real life?",
                "generic_answer": "You can use this by connecting new information to things you already know when studying or learning."
            }
        ]

        response = self.quiz_generator._create_multi_quiz_response(generated_quizzes, open_ended_questions, sections)
        
        # Check structure
        self.assertIn("quiz_questions", response)
        self.assertIn("quizzes", response)
        self.assertIn("quiz_metadata", response)
        
        # Check aggregated questions
        self.assertEqual(len(response["quiz_questions"]), 3)
        
        # Check metadata
        metadata = response["quiz_metadata"]
        self.assertEqual(metadata["total_quizzes"], 2)
        self.assertEqual(metadata["total_questions"], 3)
        self.assertEqual(metadata["total_open_ended_questions"], 2)
        self.assertEqual(metadata["total_sections"], 2)
        self.assertEqual(metadata["generation_approach"], "section_aware_multi_quiz")

        # Check open-ended questions are included
        self.assertIn("open_ended_questions", response)
        self.assertEqual(len(response["open_ended_questions"]), 2)
    
    @patch('pipeline.services.analysis.quiz_generator.SectionAwareQuizGenerator._generate_all_open_ended_questions')
    @patch('pipeline.services.analysis.quiz_generator.SectionAwareQuizGenerator._generate_quiz_for_group')
    def test_generate_quizzes_success(self, mock_generate_quiz, mock_generate_open_ended):
        """Test successful quiz generation flow."""
        async def run_test():
            # Setup
            sections = [create_mock_section(0), create_mock_section(1)]

            # Mock successful quiz generation
            mock_generate_quiz.return_value = {
                "quiz_questions": [
                    {"question": "Q1", "quiz_number": 1}
                ],
                "quiz_metadata": {"quiz_number": 1, "total_questions": 1}
            }

            # Mock successful open-ended question generation
            mock_generate_open_ended.return_value = [
                {
                    "question": "How would you explain this concept in simple terms?",
                    "generic_answer": "This concept means understanding how ideas connect to make learning stick better."
                },
                {
                    "question": "How would you apply this in real life?",
                    "generic_answer": "You can use this by connecting new information to things you already know when studying or learning."
                },
                {
                    "question": "What personal experiences relate to this?",
                    "generic_answer": "Think about times when you remembered something better because it reminded you of something else you already knew."
                }
            ]

            result = await self.quiz_generator.generate_quizzes(sections, self.runnable_config)

            # Verify success
            self.assertNotIn("error", result)
            self.assertIn("quiz_questions", result)
            self.assertIn("open_ended_questions", result)
            self.assertEqual(len(result["open_ended_questions"]), 3)
            mock_generate_quiz.assert_called()
            mock_generate_open_ended.assert_called_once()

        asyncio.run(run_test())
    
    @patch('pipeline.services.analysis.quiz_generator.SectionAwareQuizGenerator._generate_quiz_for_group')
    def test_generate_quizzes_no_valid_quizzes(self, mock_generate_quiz):
        """Test quiz generation when no valid quizzes are generated."""
        async def run_test():
            # Setup
            sections = [create_mock_section(0)]
            
            # Mock failed quiz generation (empty result)
            mock_generate_quiz.return_value = {}
            
            result = await self.quiz_generator.generate_quizzes(sections, self.runnable_config)
            
            # Should return error
            self.assertIn("error", result)
            self.assertEqual(result["error"], "Failed to generate any valid quizzes")
        
        asyncio.run(run_test())
    
    def test_quiz_group_properties_edge_cases(self):
        """Test QuizGroup properties with edge cases."""
        from pipeline.services.analysis.quiz_planner import QuizGroup
        
        # Test empty sections
        empty_group = QuizGroup(
            sections=[],
            quiz_number=1,
            estimated_questions=5,
            total_concepts=0,
            section_indices=[]
        )
        
        self.assertEqual(empty_group.total_duration_minutes, 0.0)
        self.assertEqual(empty_group.section_range, "Sections 1-0")  # Edge case handling

    def test_calculate_open_ended_count_duration_based(self):
        """Test that open-ended question count scales with duration."""
        # Test short content (≤20 min) -> 3 questions
        short_sections = [
            create_mock_section(0, start_time="00:00", end_time="10:00", lessons_count=2),
            create_mock_section(1, start_time="10:00", end_time="15:00", lessons_count=1)
        ]
        count = self.quiz_generator._calculate_open_ended_count(15.0, short_sections)
        self.assertEqual(count, 3)

        # Test medium content (20-60 min) -> 5 questions
        medium_sections = [
            create_mock_section(0, start_time="00:00", end_time="30:00", lessons_count=5),
            create_mock_section(1, start_time="30:00", end_time="45:00", lessons_count=3)
        ]
        count = self.quiz_generator._calculate_open_ended_count(45.0, medium_sections)
        self.assertEqual(count, 5)

        # Test long content (1-2 hours) -> 6 questions
        long_sections = [create_mock_section(0, start_time="00:00", end_time="1:30:00", lessons_count=8)]
        count = self.quiz_generator._calculate_open_ended_count(90.0, long_sections)
        self.assertEqual(count, 6)

        # Test very long content (>2 hours) -> 7 questions
        very_long_sections = [create_mock_section(0, start_time="00:00", end_time="3:00:00", lessons_count=10)]
        count = self.quiz_generator._calculate_open_ended_count(180.0, very_long_sections)
        self.assertEqual(count, 7)

        # Test concept-rich content (adds +1, max 8)
        concept_rich_sections = [
            create_mock_section(0, start_time="00:00", end_time="2:00:00", lessons_count=16)  # >15 concepts
        ]
        count = self.quiz_generator._calculate_open_ended_count(120.0, concept_rich_sections)
        self.assertEqual(count, 7)  # 6 (base) + 1 (concept-rich) = 7

    def test_prepare_all_section_data_for_llm(self):
        """Test preparation of all section data for LLM processing."""
        sections = [
            create_mock_section(0, lessons_count=2),
            create_mock_section(1, lessons_count=3)
        ]

        section_data_str = self.quiz_generator._prepare_all_section_data_for_llm(sections)
        section_data = json.loads(section_data_str)

        # Verify structure
        self.assertEqual(len(section_data), 2)

        # Check section structure
        first_section = section_data[0]
        self.assertEqual(first_section["section_number"], 1)
        self.assertIn("time_range", first_section)
        self.assertIn("key_concepts", first_section)
        self.assertEqual(len(first_section["key_concepts"]), 2)
    
    async def async_llm_mock_success(self, *args, **kwargs):
        """Mock successful LLM response."""
        return {
            "quiz_questions": [
                {
                    "question": "What is the main concept discussed?",
                    "options": ["A. Concept 1", "B. Concept 2", "C. Concept 3", "D. Concept 4"],
                    "correct_answer": "A",
                    "explanation": "This is correct because...",
                    "supporting_quote": "The key insight is...",
                    "related_timestamp": "00:30",
                    "source_section": 1
                }
            ]
        }
    
    async def async_llm_mock_failure(self, *args, **kwargs):
        """Mock LLM failure."""
        raise Exception("LLM API Error")
    
    def test_generate_quiz_for_group_success(self):
        """Test successful quiz generation for a single group."""
        async def run_test():
            # Setup
            sections = [create_mock_section(0)]
            quiz_group = create_mock_quiz_group(sections)
            
            # Mock successful LLM chain
            with patch.object(self.quiz_generator, 'llm') as mock_llm:
                mock_chain = AsyncMock()
                mock_chain.ainvoke.return_value = await self.async_llm_mock_success()
                
                with patch('langchain_core.prompts.ChatPromptTemplate.from_messages') as mock_prompt:
                    with patch('langchain_core.output_parsers.JsonOutputParser') as mock_parser:
                        mock_prompt.return_value.__or__ = lambda self, other: mock_chain
                        
                        result = await self.quiz_generator._generate_quiz_for_group(
                            quiz_group, self.runnable_config
                        )
                        
                        # Verify success
                        self.assertIn("quiz_questions", result)
                        self.assertEqual(len(result["quiz_questions"]), 1)
                        
                        # Check enhanced fields
                        question = result["quiz_questions"][0]
                        self.assertIn("question_id", question)
                        self.assertIn("difficulty", question)
        
        asyncio.run(run_test())
    
    def test_generate_quiz_for_group_failure(self):
        """Test quiz generation failure for a single group."""
        async def run_test():
            # Setup
            sections = [create_mock_section(0)]
            quiz_group = create_mock_quiz_group(sections)
            
            # Mock LLM chain failure
            with patch.object(self.quiz_generator, 'llm') as mock_llm:
                mock_chain = AsyncMock()
                mock_chain.ainvoke.side_effect = Exception("LLM Error")
                
                with patch('langchain_core.prompts.ChatPromptTemplate.from_messages') as mock_prompt:
                    with patch('langchain_core.output_parsers.JsonOutputParser') as mock_parser:
                        mock_prompt.return_value.__or__ = lambda self, other: mock_chain
                        
                        result = await self.quiz_generator._generate_quiz_for_group(
                            quiz_group, self.runnable_config
                        )
                        
                        # Should return empty dict on failure
                        self.assertEqual(result, {})
        
        asyncio.run(run_test())


if __name__ == "__main__":
    # Run with verbose output
    unittest.main(verbosity=2)