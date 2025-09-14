"""
Unit tests for QuizPlanner component.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import unittest
from unittest.mock import Mock, patch
from typing import List

from pipeline.services.analysis.quiz_planner import QuizPlanner, QuizGroup
from pipeline.interfaces import SectionAnalysis, EntityExplanation


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
    # Create mock entities
    entities = [
        EntityExplanation(name=f"Entity{i}", explanation=f"Explanation{i}")
        for i in range(entities_count)
    ]
    
    # Create mock lessons
    lessons = [
        {
            "lesson": f"Lesson {i+1}",
            "supporting_quote": f"Quote {i+1}",
            "real_life_examples": [f"Example {i+1}"]
        }
        for i in range(lessons_count)
    ]
    
    # Create mock quotes
    quotes = [f"Quote {i+1}" for i in range(quotes_count)]
    
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


class TestQuizPlanner(unittest.TestCase):
    """Test cases for QuizPlanner."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.quiz_planner = QuizPlanner()
    
    def test_empty_sections(self):
        """Test planning with empty sections list."""
        result = self.quiz_planner.plan_quiz_distribution([])
        self.assertEqual(len(result), 0)
    
    def test_single_section_with_good_content(self):
        """Test planning with a single section that has good content."""
        sections = [create_mock_section(0, lessons_count=4, entities_count=3)]
        
        result = self.quiz_planner.plan_quiz_distribution(sections)
        
        self.assertEqual(len(result), 1)
        quiz_group = result[0]
        self.assertEqual(quiz_group.quiz_number, 1)
        self.assertEqual(len(quiz_group.sections), 1)
        self.assertGreaterEqual(quiz_group.estimated_questions, self.quiz_planner.MIN_QUESTIONS_PER_QUIZ)
        self.assertEqual(quiz_group.section_range, "Section 1")
    
    def test_multiple_sections_small_content(self):
        """Test planning with multiple sections but small content."""
        sections = [
            create_mock_section(0, lessons_count=2, entities_count=1),
            create_mock_section(1, lessons_count=2, entities_count=1),
            create_mock_section(2, lessons_count=1, entities_count=1)
        ]
        
        result = self.quiz_planner.plan_quiz_distribution(sections)
        
        # Should create 1 quiz for small content
        self.assertEqual(len(result), 1)
        self.assertEqual(len(result[0].sections), 3)
        self.assertEqual(result[0].section_range, "Sections 1-3")
    
    def test_multiple_sections_medium_content(self):
        """Test planning with multiple sections and medium content."""
        sections = [
            create_mock_section(0, lessons_count=3, entities_count=2, quotes_count=2),
            create_mock_section(1, lessons_count=4, entities_count=3, quotes_count=2),
            create_mock_section(2, lessons_count=3, entities_count=2, quotes_count=1),
            create_mock_section(3, lessons_count=2, entities_count=2, quotes_count=1)
        ]
        
        result = self.quiz_planner.plan_quiz_distribution(sections)
        
        # Should create 2 quizzes for medium content with good substance
        self.assertEqual(len(result), 2)
        
        # Check that sections are distributed
        total_sections_in_groups = sum(len(group.sections) for group in result)
        self.assertEqual(total_sections_in_groups, len(sections))
        
        # Check quiz numbering
        self.assertEqual(result[0].quiz_number, 1)
        self.assertEqual(result[1].quiz_number, 2)
    
    def test_large_content_many_sections(self):
        """Test planning with many sections and large content."""
        sections = [
            create_mock_section(i, lessons_count=4, entities_count=3, quotes_count=2)
            for i in range(8)
        ]
        
        result = self.quiz_planner.plan_quiz_distribution(sections)
        
        # Should create multiple quizzes for large content
        self.assertGreaterEqual(len(result), 2)
        self.assertLessEqual(len(result), self.quiz_planner.MAX_QUIZZES)
        
        # Check that all sections are included
        total_sections_in_groups = sum(len(group.sections) for group in result)
        self.assertEqual(total_sections_in_groups, len(sections))
    
    def test_content_analysis_metrics(self):
        """Test the content analysis functionality."""
        sections = [
            create_mock_section(0, lessons_count=5, entities_count=3, quotes_count=2),
            create_mock_section(1, lessons_count=1, entities_count=1, quotes_count=0),
            create_mock_section(2, lessons_count=3, entities_count=2, quotes_count=1)
        ]
        
        metrics = self.quiz_planner._analyze_section_content(sections)
        
        self.assertEqual(len(metrics), 3)
        
        # Check first section (high quality content)
        self.assertEqual(metrics[0]["concept_count"], 5)
        self.assertEqual(metrics[0]["entity_count"], 3)
        self.assertEqual(metrics[0]["quote_count"], 2)
        self.assertTrue(metrics[0]["has_substantial_content"])
        
        # Check second section (low quality content)
        self.assertEqual(metrics[1]["concept_count"], 1)
        self.assertFalse(metrics[1]["has_substantial_content"])
        
        # Check third section (medium quality content)
        self.assertEqual(metrics[2]["concept_count"], 3)
        self.assertTrue(metrics[2]["has_substantial_content"])
    
    def test_quiz_group_properties(self):
        """Test QuizGroup properties and methods."""
        sections = [
            create_mock_section(0, start_time="00:00", end_time="05:00"),
            create_mock_section(1, start_time="05:00", end_time="10:00")
        ]
        
        quiz_group = QuizGroup(
            sections=sections,
            quiz_number=1,
            estimated_questions=6,
            total_concepts=8,
            section_indices=[0, 1]
        )
        
        self.assertEqual(quiz_group.section_range, "Sections 1-2")
        self.assertEqual(quiz_group.total_duration_minutes, 10.0)
    
    def test_quiz_group_single_section(self):
        """Test QuizGroup with single section."""
        sections = [create_mock_section(0)]
        
        quiz_group = QuizGroup(
            sections=sections,
            quiz_number=1,
            estimated_questions=5,
            total_concepts=3,
            section_indices=[0]
        )
        
        self.assertEqual(quiz_group.section_range, "Section 1")
    
    def test_time_parsing_edge_cases(self):
        """Test time parsing with various formats."""
        # Test HH:MM:SS format
        sections = [
            create_mock_section(0, start_time="01:30:00", end_time="01:35:30")
        ]
        
        quiz_group = QuizGroup(
            sections=sections,
            quiz_number=1,
            estimated_questions=5,
            total_concepts=3,
            section_indices=[0]
        )
        
        # Should be 5.5 minutes (5 minutes 30 seconds)
        self.assertAlmostEqual(quiz_group.total_duration_minutes, 5.5, places=1)
    
    def test_invalid_time_format_handling(self):
        """Test handling of invalid time formats."""
        sections = [
            create_mock_section(0, start_time="invalid", end_time="also_invalid")
        ]
        
        quiz_group = QuizGroup(
            sections=sections,
            quiz_number=1,
            estimated_questions=5,
            total_concepts=3,
            section_indices=[0]
        )
        
        # Should handle gracefully and return 0
        self.assertEqual(quiz_group.total_duration_minutes, 0.0)
    
    def test_group_validation_and_merging(self):
        """Test group validation and merging of insufficient content groups."""
        # Create sections where some have very low content
        sections = [
            create_mock_section(0, lessons_count=1, entities_count=1, quotes_count=0),  # Low content
            create_mock_section(1, lessons_count=4, entities_count=3, quotes_count=2),  # Good content
            create_mock_section(2, lessons_count=1, entities_count=0, quotes_count=0),  # Very low content
            create_mock_section(3, lessons_count=3, entities_count=2, quotes_count=1)   # Good content
        ]
        
        result = self.quiz_planner.plan_quiz_distribution(sections)
        
        # The planner should handle low-content sections appropriately
        # Either by merging them or ensuring minimum question counts
        for group in result:
            self.assertGreaterEqual(group.estimated_questions, self.quiz_planner.MIN_QUESTIONS_PER_QUIZ)
    
    def test_question_count_limits(self):
        """Test that question counts respect min/max limits."""
        # High content sections
        sections = [
            create_mock_section(i, lessons_count=10, entities_count=5, quotes_count=3)
            for i in range(5)
        ]
        
        result = self.quiz_planner.plan_quiz_distribution(sections)
        
        for group in result:
            self.assertGreaterEqual(group.estimated_questions, self.quiz_planner.MIN_QUESTIONS_PER_QUIZ)
            self.assertLessEqual(group.estimated_questions, self.quiz_planner.MAX_QUESTIONS_PER_QUIZ)


if __name__ == "__main__":
    # Run with verbose output
    unittest.main(verbosity=2)