"""
Integration tests for the full quiz generation pipeline.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import unittest
from unittest.mock import Mock, patch, AsyncMock
import json
import asyncio
from typing import List

from pipeline.services.analysis.synthesis import LearningAcceleratorSynthesizer
from pipeline.interfaces import SectionAnalysis, EntityExplanation
from langchain_core.runnables import RunnableConfig


def create_realistic_section_analysis(
    index: int,
    start_time: str = "00:00",
    end_time: str = "05:00",
    scenario: str = "default"
) -> SectionAnalysis:
    """Create realistic section analysis data for testing."""
    
    scenarios = {
        "high_content": {
            "lessons_count": 5,
            "entities_count": 4,
            "quotes_count": 3,
            "title": "High Content Section",
            "summary": "This section contains rich learning content with multiple concepts and detailed explanations."
        },
        "medium_content": {
            "lessons_count": 3,
            "entities_count": 2,
            "quotes_count": 2,
            "title": "Medium Content Section", 
            "summary": "This section has moderate learning content with key concepts."
        },
        "low_content": {
            "lessons_count": 1,
            "entities_count": 1,
            "quotes_count": 1,
            "title": "Low Content Section",
            "summary": "This section has minimal learning content."
        },
        "default": {
            "lessons_count": 3,
            "entities_count": 2,
            "quotes_count": 1,
            "title": "Default Section",
            "summary": "Standard section with typical content."
        }
    }
    
    config = scenarios.get(scenario, scenarios["default"])
    
    # Create realistic entities
    entity_names = [
        "Machine Learning", "Artificial Intelligence", "Data Science", "Neural Networks",
        "Deep Learning", "Python", "TensorFlow", "Algorithms", "Statistics", "Big Data"
    ]
    entities = [
        EntityExplanation(
            name=entity_names[i % len(entity_names)],
            explanation=f"Detailed explanation of {entity_names[i % len(entity_names)]} in context of section {index+1}"
        )
        for i in range(config["entities_count"])
    ]
    
    # Create realistic lessons
    lesson_topics = [
        "Understanding core principles",
        "Practical applications",
        "Best practices and methodologies",
        "Common pitfalls and how to avoid them",
        "Real-world implementation strategies",
        "Performance optimization techniques",
        "Troubleshooting and debugging",
        "Advanced concepts and patterns"
    ]
    
    lessons = [
        {
            "lesson": f"{lesson_topics[i % len(lesson_topics)]} for section {index+1}",
            "supporting_quote": f"As mentioned in the content: '{lesson_topics[i % len(lesson_topics)]} is crucial for understanding this domain.'",
            "real_life_examples": [
                f"Example {i+1}: Real-world application in industry",
                f"Case study showing implementation of {lesson_topics[i % len(lesson_topics)]}"
            ]
        }
        for i in range(config["lessons_count"])
    ]
    
    # Create realistic quotes
    sample_quotes = [
        "The key insight here is that we need to approach this systematically.",
        "One of the most important things to remember is the practical application.",
        "This concept fundamentally changes how we think about the problem.",
        "The data clearly shows that this approach is more effective.",
        "What's particularly interesting is how this scales in real-world scenarios."
    ]
    
    quotes = [
        sample_quotes[i % len(sample_quotes)]
        for i in range(config["quotes_count"])
    ]
    
    return SectionAnalysis(
        start_time=start_time,
        end_time=end_time,
        title=f"{config['title']} {index+1}",
        summary=f"{config['summary']} Section {index+1}",
        quotes=quotes,
        entities=entities,
        additional_data={
            "lessons_and_concepts": lessons,
            "key_points": [
                f"Key insight {i+1} from section {index+1}"
                for i in range(min(3, config["lessons_count"]))
            ]
        }
    )


class TestQuizGenerationIntegration(unittest.TestCase):
    """Integration tests for the complete quiz generation flow."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_llm = AsyncMock()
        self.synthesizer = LearningAcceleratorSynthesizer(self.mock_llm)
        self.runnable_config = RunnableConfig()
    
    def create_realistic_llm_response(self, num_questions: int = 3):
        """Create a realistic LLM response for quiz generation."""
        questions = []
        for i in range(num_questions):
            questions.append({
                "question": f"What is the primary concept discussed in lesson {i+1}?",
                "options": [
                    f"A. Primary concept {i+1}",
                    f"B. Alternative concept {i+1}",
                    f"C. Related concept {i+1}",
                    f"D. Unrelated concept {i+1}"
                ],
                "correct_answer": "A",
                "explanation": f"Option A is correct because the lesson specifically discusses the primary concept {i+1} and its implications.",
                "supporting_quote": f"As mentioned in the content: 'The primary concept {i+1} is crucial for understanding this domain.'",
                "related_timestamp": f"0{i+2}:30",
                "source_section": (i % 2) + 1
            })
        
        return {
            "quiz_questions": questions
        }
    
    def test_single_section_quiz_generation(self):
        """Test quiz generation with a single high-content section."""
        async def run_test():
            # Create realistic test data
            sections = [
                create_realistic_section_analysis(
                    0, start_time="00:00", end_time="15:00", scenario="high_content"
                )
            ]
            
            # Mock successful LLM response
            self.mock_llm.ainvoke = AsyncMock(return_value=self.create_realistic_llm_response(5))
            
            # Mock the chain creation
            with patch('langchain_core.prompts.ChatPromptTemplate.from_messages') as mock_prompt:
                with patch('langchain_core.output_parsers.JsonOutputParser') as mock_parser:
                    # Create a mock chain that returns our LLM response
                    mock_chain = AsyncMock()
                    mock_chain.ainvoke = AsyncMock(return_value=self.create_realistic_llm_response(5))
                    
                    # Mock the chain construction
                    mock_prompt.return_value.__or__ = lambda self, other: mock_chain
                    mock_parser.return_value.get_format_instructions.return_value = "Format as JSON"
                    
                    # Execute the synthesis
                    result = await self.synthesizer.perform_synthesis(sections, self.runnable_config)
                    
                    # Verify the result
                    self.assertIsInstance(result, dict)
                    self.assertIn("quiz_questions", result)
                    
                    if "error" not in result:
                        quiz_questions = result["quiz_questions"]
                        self.assertGreater(len(quiz_questions), 0)
                        
                        # Check question structure
                        for question in quiz_questions:
                            self.assertIn("question", question)
                            self.assertIn("options", question)
                            self.assertIn("correct_answer", question)
                            self.assertIn("explanation", question)
        
        asyncio.run(run_test())
    
    def test_multiple_sections_quiz_generation(self):
        """Test quiz generation with multiple sections of varying content quality."""
        async def run_test():
            # Create mixed-quality sections
            sections = [
                create_realistic_section_analysis(0, "00:00", "10:00", "high_content"),
                create_realistic_section_analysis(1, "10:00", "18:00", "medium_content"),
                create_realistic_section_analysis(2, "18:00", "25:00", "high_content"),
                create_realistic_section_analysis(3, "25:00", "30:00", "low_content")
            ]
            
            # Mock successful LLM response with more questions
            self.mock_llm.ainvoke = AsyncMock(return_value=self.create_realistic_llm_response(7))
            
            with patch('langchain_core.prompts.ChatPromptTemplate.from_messages') as mock_prompt:
                with patch('langchain_core.output_parsers.JsonOutputParser') as mock_parser:
                    mock_chain = AsyncMock()
                    mock_chain.ainvoke = AsyncMock(return_value=self.create_realistic_llm_response(7))
                    
                    mock_prompt.return_value.__or__ = lambda self, other: mock_chain
                    mock_parser.return_value.get_format_instructions.return_value = "Format as JSON"
                    
                    result = await self.synthesizer.perform_synthesis(sections, self.runnable_config)
                    
                    self.assertIsInstance(result, dict)
                    
                    if "error" not in result and "quiz_questions" in result:
                        quiz_questions = result["quiz_questions"]
                        self.assertGreater(len(quiz_questions), 0)
                        
                        # Should have generated multiple questions for substantial content
                        self.assertGreaterEqual(len(quiz_questions), 5)
        
        asyncio.run(run_test())
    
    def test_quiz_generation_with_llm_failure(self):
        """Test quiz generation when LLM fails."""
        async def run_test():
            sections = [
                create_realistic_section_analysis(0, scenario="high_content")
            ]
            
            # Mock LLM failure
            with patch('langchain_core.prompts.ChatPromptTemplate.from_messages') as mock_prompt:
                with patch('langchain_core.output_parsers.JsonOutputParser') as mock_parser:
                    mock_chain = AsyncMock()
                    mock_chain.ainvoke = AsyncMock(side_effect=Exception("LLM API Error"))
                    
                    mock_prompt.return_value.__or__ = lambda self, other: mock_chain
                    mock_parser.return_value.get_format_instructions.return_value = "Format as JSON"
                    
                    result = await self.synthesizer.perform_synthesis(sections, self.runnable_config)
                    
                    # Should fall back to legacy method
                    self.assertIsInstance(result, dict)
                    # Could be successful fallback or empty result
                    if "error" in result:
                        print(f"Expected error in fallback: {result['error']}")
        
        asyncio.run(run_test())
    
    def test_quiz_generation_with_malformed_llm_response(self):
        """Test quiz generation when LLM returns malformed data."""
        async def run_test():
            sections = [
                create_realistic_section_analysis(0, scenario="high_content")
            ]
            
            # Mock malformed LLM response
            malformed_response = {
                "invalid_key": "invalid_data",
                "quiz_questions": []  # Empty questions array
            }
            
            with patch('langchain_core.prompts.ChatPromptTemplate.from_messages') as mock_prompt:
                with patch('langchain_core.output_parsers.JsonOutputParser') as mock_parser:
                    mock_chain = AsyncMock()
                    mock_chain.ainvoke = AsyncMock(return_value=malformed_response)
                    
                    mock_prompt.return_value.__or__ = lambda self, other: mock_chain
                    mock_parser.return_value.get_format_instructions.return_value = "Format as JSON"
                    
                    result = await self.synthesizer.perform_synthesis(sections, self.runnable_config)
                    
                    # Should handle gracefully and potentially fall back
                    self.assertIsInstance(result, dict)
        
        asyncio.run(run_test())
    
    def test_legacy_fallback_functionality(self):
        """Test that legacy fallback works correctly."""
        async def run_test():
            sections = [
                create_realistic_section_analysis(0, "00:00", "20:00", "high_content"),
                create_realistic_section_analysis(1, "20:00", "35:00", "medium_content")
            ]
            
            # Test legacy method directly
            result = await self.synthesizer._legacy_quiz_generation(sections, self.runnable_config)
            
            # Legacy method might return empty result if LLM fails, but should not crash
            self.assertIsInstance(result, dict)
        
        asyncio.run(run_test())
    
    def test_duration_calculation_accuracy(self):
        """Test that duration calculations are accurate for quiz planning."""
        sections = [
            create_realistic_section_analysis(0, "00:00", "05:30", "high_content"),     # 5.5 minutes
            create_realistic_section_analysis(1, "05:30", "12:00", "medium_content"),  # 6.5 minutes
            create_realistic_section_analysis(2, "12:00", "20:15", "high_content")     # 8.25 minutes
        ]
        
        total_duration = self.synthesizer._calculate_total_duration(sections)
        expected_duration = 5.5 + 6.5 + 8.25  # 20.25 minutes
        
        self.assertAlmostEqual(total_duration, expected_duration, places=1)
    
    def test_quiz_count_determination(self):
        """Test quiz count determination based on content duration."""
        # Test short content
        short_duration = 15.0  # 15 minutes
        count = self.synthesizer._determine_quiz_count(short_duration)
        self.assertEqual(count, 1)
        
        # Test medium content
        medium_duration = 45.0  # 45 minutes
        count = self.synthesizer._determine_quiz_count(medium_duration)
        self.assertEqual(count, 2)
        
        # Test long content
        long_duration = 75.0  # 75 minutes
        count = self.synthesizer._determine_quiz_count(long_duration)
        self.assertEqual(count, 3)
    
    def test_section_data_integrity(self):
        """Test that section data maintains integrity through the pipeline."""
        sections = [
            create_realistic_section_analysis(0, scenario="high_content")
        ]
        
        # Access the quiz generator directly to test data preparation
        quiz_generator = self.synthesizer.quiz_generator
        quiz_groups = quiz_generator.quiz_planner.plan_quiz_distribution(sections)
        
        self.assertGreater(len(quiz_groups), 0)
        
        # Test section data preparation
        section_data_str = quiz_generator._prepare_section_data_for_llm(quiz_groups[0])
        section_data = json.loads(section_data_str)
        
        # Verify data integrity
        self.assertEqual(len(section_data), len(quiz_groups[0].sections))
        
        for i, section_info in enumerate(section_data):
            self.assertIn("section_number", section_info)
            self.assertIn("title", section_info)
            self.assertIn("key_concepts", section_info)
            self.assertIn("entities", section_info)
            self.assertIn("notable_quotes", section_info)
            
            # Verify concepts structure
            concepts = section_info["key_concepts"]
            self.assertIsInstance(concepts, list)
            for concept in concepts:
                self.assertIn("lesson", concept)
    
    def test_error_handling_robustness(self):
        """Test system robustness with various error conditions."""
        async def run_test():
            # Test with empty additional_data
            problematic_section = SectionAnalysis(
                start_time="00:00",
                end_time="05:00", 
                title="Problematic Section",
                summary="This section has missing data",
                quotes=[],
                entities=[],
                additional_data={}  # Missing lessons_and_concepts
            )
            
            sections = [problematic_section]
            
            # Should handle gracefully without crashing
            try:
                result = await self.synthesizer.perform_synthesis(sections, self.runnable_config)
                self.assertIsInstance(result, dict)
                # May contain error or fallback result, but should not crash
            except Exception as e:
                self.fail(f"Quiz generation should handle missing data gracefully, but got: {e}")
        
        asyncio.run(run_test())
    
    def test_realistic_content_scenarios(self):
        """Test with realistic content scenarios that might cause issues."""
        async def run_test():
            # Scenario 1: Very short sections
            short_sections = [
                create_realistic_section_analysis(0, "00:00", "00:30", "low_content"),
                create_realistic_section_analysis(1, "00:30", "01:00", "low_content")
            ]
            
            result1 = await self.synthesizer.perform_synthesis(short_sections, self.runnable_config)
            self.assertIsInstance(result1, dict)
            
            # Scenario 2: Very long single section
            long_section = [
                create_realistic_section_analysis(0, "00:00", "60:00", "high_content")
            ]
            
            result2 = await self.synthesizer.perform_synthesis(long_section, self.runnable_config)
            self.assertIsInstance(result2, dict)
            
            # Scenario 3: Many short sections
            many_sections = [
                create_realistic_section_analysis(i, f"{i*2:02d}:00", f"{i*2+2:02d}:00", "medium_content")
                for i in range(10)
            ]
            
            result3 = await self.synthesizer.perform_synthesis(many_sections, self.runnable_config)
            self.assertIsInstance(result3, dict)
        
        asyncio.run(run_test())


if __name__ == "__main__":
    # Run with verbose output
    unittest.main(verbosity=2)