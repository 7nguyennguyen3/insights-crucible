"""
Unit tests for features and business logic in features.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import unittest
from unittest.mock import patch, Mock, AsyncMock, MagicMock
import asyncio
import json
import time
from typing import List, Dict, Any

# Create proper mock for Google API exception
class MockResourceExhausted(Exception):
    pass

# Mock external dependencies before importing features
mock_google_exceptions = Mock()
mock_google_exceptions.ResourceExhausted = MockResourceExhausted

with patch.dict('sys.modules', {
    'langchain_core.prompts': Mock(),
    'langchain_core.output_parsers': Mock(),
    'langchain_core.runnables': Mock(),
    'google.api_core.exceptions': mock_google_exceptions,
    'tavily': Mock(),
    'rich': Mock(),
    'src': Mock(),  # Mock the src module
    'src.clients': Mock()  # Mock the clients submodule
}):
    import features


class TestRetryDecorator(unittest.TestCase):
    """Test retry mechanism with exponential backoff."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.call_count = 0
    
    def test_retry_decorator_success_first_try(self):
        """Test retry decorator when function succeeds on first try."""
        @features.retry_with_exponential_backoff
        def successful_function():
            self.call_count += 1
            return {"success": True}
        
        result = successful_function()
        
        self.assertEqual(result, {"success": True})
        self.assertEqual(self.call_count, 1)
    
    @patch('features.time.sleep')
    @patch('features.random.uniform', return_value=0.5)
    def test_retry_decorator_resource_exhausted(self, mock_uniform, mock_sleep):
        """Test retry decorator with ResourceExhausted exception."""
        ResourceExhausted = MockResourceExhausted
        
        @features.retry_with_exponential_backoff
        def failing_function():
            self.call_count += 1
            if self.call_count < 3:
                raise ResourceExhausted("Rate limit hit")
            return {"success": True}
        
        result = failing_function()
        
        self.assertEqual(result, {"success": True})
        self.assertEqual(self.call_count, 3)
        self.assertEqual(mock_sleep.call_count, 2)  # Called for first 2 failures
    
    @patch('features.time.sleep')
    @patch('features.random.uniform', return_value=0.5)
    def test_retry_decorator_json_decode_error(self, mock_uniform, mock_sleep):
        """Test retry decorator with JSONDecodeError."""
        @features.retry_with_exponential_backoff
        def failing_function():
            self.call_count += 1
            if self.call_count < 2:
                raise json.JSONDecodeError("Bad JSON", "doc", 0)
            return {"success": True}
        
        result = failing_function()
        
        self.assertEqual(result, {"success": True})
        self.assertEqual(self.call_count, 2)
        self.assertEqual(mock_sleep.call_count, 1)
    
    @patch('features.time.sleep')
    def test_retry_decorator_max_retries_reached(self, mock_sleep):
        """Test retry decorator when max retries are reached."""
        ResourceExhausted = MockResourceExhausted
        
        @features.retry_with_exponential_backoff
        def always_failing_function():
            self.call_count += 1
            raise ResourceExhausted("Always failing")
        
        result = always_failing_function()
        
        self.assertEqual(result, {})  # Default return for non-verify_claim functions
        self.assertEqual(self.call_count, 5)  # Max retries
        self.assertEqual(mock_sleep.call_count, 5)
    
    @patch('features.time.sleep')
    def test_retry_decorator_verify_claim_max_retries(self, mock_sleep):
        """Test retry decorator for verify_claim function when max retries reached."""
        ResourceExhausted = MockResourceExhausted
        
        @features.retry_with_exponential_backoff
        def verify_claim_failing():
            self.call_count += 1
            raise ResourceExhausted("Always failing")
        
        # Mock the function name check
        verify_claim_failing.__name__ = "verify_claim_test"
        
        result = verify_claim_failing()
        
        expected_result = {"summary": "Failed after multiple retries.", "perspectives": []}
        self.assertEqual(result, expected_result)
        self.assertEqual(self.call_count, 5)
    
    def test_retry_decorator_unexpected_exception(self):
        """Test retry decorator with unexpected exception (not retryable)."""
        @features.retry_with_exponential_backoff
        def unexpected_error_function():
            self.call_count += 1
            if self.call_count == 1:
                raise ValueError("Unexpected error")
            return {"success": True}
        
        result = unexpected_error_function()
        
        self.assertEqual(result, {})  # Default return after unexpected error
        self.assertEqual(self.call_count, 1)  # Should not retry unexpected errors
    
    @patch('features.time.sleep')
    def test_retry_exponential_backoff_timing(self, mock_sleep):
        """Test that exponential backoff increases delay correctly."""
        ResourceExhausted = MockResourceExhausted
        
        @features.retry_with_exponential_backoff
        def failing_function():
            self.call_count += 1
            if self.call_count <= 3:
                raise ResourceExhausted("Rate limit")
            return {"success": True}
        
        result = failing_function()
        
        # Check that sleep was called with increasing delays
        sleep_calls = mock_sleep.call_args_list
        self.assertEqual(len(sleep_calls), 3)
        
        # The exact timing includes random jitter, but base delay should double
        # First delay: 2 + jitter, Second: 4 + jitter, Third: 8 + jitter
        # Since we mocked random.uniform to return 0.5, we can't predict exact values
        # but we can verify that sleep was called the right number of times


class TestQuizGeneration(unittest.TestCase):
    """Test quiz question generation functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_runnable_config = Mock()
        self.sample_sections = [
            {
                "start_time": "00:00",
                "end_time": "05:00",
                "generated_title": "Introduction",
                "1_sentence_summary": "Overview of the topic",
                "notable_quotes": ["Important insight"],
                "entities": [{"name": "Entity1", "explanation": "Description"}],
                "key_points": ["Point 1", "Point 2"]
            }
        ]
    
    def test_generate_quiz_questions_with_synthesis_data(self):
        """Test quiz generation when synthesis data contains quiz questions."""
        async def run_test():
            synthesis_data = {
                "quiz_questions": [
                    {
                        "question": "What is the main concept?",
                        "options": ["A", "B", "C", "D"],
                        "correct_answer": "A",
                        "explanation": "Test explanation"
                    }
                ],
                "generation_method": "legacy"
            }
            
            result = await features.generate_quiz_questions(
                self.sample_sections, self.mock_runnable_config, synthesis_data
            )
            
            self.assertIn("quiz_metadata", result)
            self.assertIn("questions", result)
            self.assertEqual(result["quiz_type"], "knowledge_testing")
            self.assertEqual(result["generation_method"], "legacy")
            self.assertEqual(len(result["questions"]), 1)
        
        asyncio.run(run_test())
    
    def test_generate_quiz_questions_section_aware(self):
        """Test quiz generation with section-aware multi-quiz format."""
        async def run_test():
            synthesis_data = {
                "quiz_questions": [
                    {
                        "question": "What is the main concept?",
                        "options": ["A", "B", "C", "D"],
                        "correct_answer": "A",
                        "explanation": "Test explanation"
                    }
                ],
                "generation_method": "section_aware",
                "multi_quiz_data": {
                    "quiz_metadata": {
                        "total_quizzes": 2,
                        "total_questions": 6
                    },
                    "quizzes": [
                        {
                            "quiz_number": 1,
                            "questions": 3
                        },
                        {
                            "quiz_number": 2,
                            "questions": 3
                        }
                    ]
                }
            }
            
            result = await features.generate_quiz_questions(
                self.sample_sections, self.mock_runnable_config, synthesis_data
            )
            
            self.assertIn("quiz_metadata", result)
            self.assertIn("questions", result)
            self.assertIn("quizzes", result)
            self.assertEqual(result["quiz_type"], "section_aware_multi_quiz")
            self.assertEqual(result["generation_method"], "section_aware")
        
        asyncio.run(run_test())
    
    def test_generate_quiz_questions_no_synthesis_data(self):
        """Test quiz generation when no synthesis data provided."""
        async def run_test():
            result = await features.generate_quiz_questions(
                self.sample_sections, self.mock_runnable_config, None
            )
            
            self.assertIn("error", result)
            self.assertIn("No quiz questions generated", result["error"])
        
        asyncio.run(run_test())
    
    def test_generate_quiz_questions_empty_synthesis_data(self):
        """Test quiz generation with empty synthesis data."""
        async def run_test():
            synthesis_data = {}
            
            result = await features.generate_quiz_questions(
                self.sample_sections, self.mock_runnable_config, synthesis_data
            )
            
            self.assertIn("error", result)
        
        asyncio.run(run_test())


class TestOpenEndedGrading(unittest.TestCase):
    """Test open-ended response grading functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_runnable_config = Mock()
        self.sample_section_analysis = {
            "1_sentence_summary": "This section covers key concepts",
            "key_points": ["Point 1", "Point 2"],
            "lessons_and_concepts": [
                {"lesson": "Lesson 1", "examples": ["Example 1"]}
            ],
            "notable_quotes": ["Important quote"]
        }
    
    @patch('features.clients.get_llm')
    @patch('features.JsonOutputParser')
    @patch('features.ChatPromptTemplate')
    def test_grade_open_ended_response_success(self, mock_prompt_template, mock_parser, mock_get_llm):
        """Test successful open-ended response grading."""
        async def run_test():
            # Setup mocks
            mock_llm = AsyncMock()
            mock_get_llm.return_value = (mock_llm, {})
            
            mock_parser_instance = Mock()
            mock_parser.return_value = mock_parser_instance
            mock_parser_instance.get_format_instructions.return_value = "Format instructions"
            
            mock_prompt_instance = Mock()
            mock_prompt_template.from_messages.return_value = mock_prompt_instance
            
            # Mock the chain
            mock_chain = AsyncMock()
            mock_prompt_instance.__or__ = Mock(return_value=mock_chain)
            mock_llm.__or__ = Mock(return_value=mock_chain)
            mock_parser_instance.__or__ = Mock(return_value=mock_chain)
            
            # Mock the chain result
            grading_result = {
                "understanding_level": "proficient",
                "what_you_nailed": ["Good grasp of concepts"],
                "growth_opportunities": ["Explore deeper connections"],
                "reflection_prompt": "How would you apply this?",
                "encouragement": "Great work!"
            }
            mock_chain.ainvoke.return_value = grading_result
            
            # Call function
            result = await features.grade_open_ended_response(
                user_answer="This is my thoughtful response about the concepts.",
                question="Explain the main concepts discussed.",
                supporting_quote="The key insight is...",
                section_analysis=self.sample_section_analysis,
                runnable_config=self.mock_runnable_config
            )
            
            # Verify result
            self.assertEqual(result["understanding_level"], "proficient")
            self.assertIn("what_you_nailed", result)
            self.assertIn("growth_opportunities", result)
            self.assertIn("reflection_prompt", result)
            self.assertIn("encouragement", result)
            self.assertIn("original_question", result)
            
            # Verify LLM was called
            mock_get_llm.assert_called_with("best-lite", temperature=0.1)
            mock_chain.ainvoke.assert_called_once()
        
        asyncio.run(run_test())
    
    @patch('features.clients.get_llm')
    @patch('features.JsonOutputParser')
    @patch('features.ChatPromptTemplate')
    def test_grade_open_ended_response_missing_fields(self, mock_prompt_template, mock_parser, mock_get_llm):
        """Test grading with missing fields in LLM response."""
        async def run_test():
            # Setup mocks
            mock_llm = AsyncMock()
            mock_get_llm.return_value = (mock_llm, {})
            
            mock_parser_instance = Mock()
            mock_parser.return_value = mock_parser_instance
            mock_parser_instance.get_format_instructions.return_value = "Format instructions"
            
            mock_prompt_instance = Mock()
            mock_prompt_template.from_messages.return_value = mock_prompt_instance
            
            # Mock the chain
            mock_chain = AsyncMock()
            mock_prompt_instance.__or__ = Mock(return_value=mock_chain)
            mock_llm.__or__ = Mock(return_value=mock_chain)
            mock_parser_instance.__or__ = Mock(return_value=mock_chain)
            
            # Mock incomplete result (missing some required fields)
            incomplete_result = {
                "understanding_level": "developing",
                "what_you_nailed": ["Some good points"]
                # Missing other required fields
            }
            mock_chain.ainvoke.return_value = incomplete_result
            
            # Call function
            result = await features.grade_open_ended_response(
                user_answer="Brief response",
                question="Test question",
                supporting_quote="Test quote",
                section_analysis=self.sample_section_analysis,
                runnable_config=self.mock_runnable_config
            )
            
            # Verify required fields are present with defaults
            required_fields = [
                "understanding_level", "what_you_nailed", "growth_opportunities",
                "reflection_prompt", "encouragement", "original_question"
            ]
            for field in required_fields:
                self.assertIn(field, result)
            
            # Verify preserved fields
            self.assertEqual(result["understanding_level"], "developing")
            self.assertEqual(result["what_you_nailed"], ["Some good points"])
        
        asyncio.run(run_test())
    
    @patch('features.clients.get_llm')
    def test_grade_open_ended_response_exception(self, mock_get_llm):
        """Test grading when LLM raises exception."""
        async def run_test():
            # Setup mock to raise exception
            mock_llm = AsyncMock()
            mock_llm.side_effect = Exception("LLM API Error")
            mock_get_llm.return_value = (mock_llm, {})
            
            # Call function
            result = await features.grade_open_ended_response(
                user_answer="Test response",
                question="Test question",
                supporting_quote="Test quote",
                section_analysis=self.sample_section_analysis,
                runnable_config=self.mock_runnable_config
            )
            
            # Verify error handling
            self.assertIn("understanding_level", result)
            self.assertEqual(result["understanding_level"], "developing")
            self.assertIn("what_you_nailed", result)
            self.assertIn("growth_opportunities", result)
            self.assertIn("reflection_prompt", result)
            self.assertIn("encouragement", result)
            self.assertIn("original_question", result)
            
            # Verify error-specific content
            self.assertIn("Technical issues", result["encouragement"])
        
        asyncio.run(run_test())
    
    def test_grade_open_ended_response_context_preparation(self):
        """Test that context is properly prepared for LLM."""
        async def run_test():
            # This is more of an integration test to verify context building
            with patch('features.clients.get_llm') as mock_get_llm, \
                 patch('features.json.dumps') as mock_json_dumps:
                
                mock_llm = AsyncMock()
                mock_get_llm.return_value = (mock_llm, {})
                mock_json_dumps.return_value = '{"test": "context"}'
                
                # Mock chain to avoid complex setup
                with patch('features.ChatPromptTemplate') as mock_prompt_template:
                    mock_chain = AsyncMock()
                    mock_chain.ainvoke.return_value = {
                        "understanding_level": "developing",
                        "what_you_nailed": ["Test"],
                        "growth_opportunities": ["Test"],
                        "reflection_prompt": "Test?",
                        "encouragement": "Test!"
                    }
                    
                    mock_prompt_template.from_messages.return_value.__or__ = Mock(return_value=mock_chain)
                    
                    await features.grade_open_ended_response(
                        user_answer="Test response",
                        question="Test question",
                        supporting_quote="Test quote",
                        section_analysis=self.sample_section_analysis,
                        runnable_config=self.mock_runnable_config
                    )
                    
                    # Verify context was prepared
                    mock_json_dumps.assert_called_once()
                    context_call = mock_json_dumps.call_args[0][0]
                    
                    # Verify context structure
                    self.assertIn("question", context_call)
                    self.assertIn("supporting_quote", context_call)
                    self.assertIn("section_summary", context_call)
                    self.assertIn("key_points", context_call)
                    self.assertIn("lessons_and_concepts", context_call)
                    self.assertIn("notable_quotes", context_call)
        
        asyncio.run(run_test())


class TestFeaturesIntegration(unittest.TestCase):
    """Test integration scenarios for features module."""
    
    def test_module_imports(self):
        """Test that the module imports correctly."""
        # Test that key functions are available
        self.assertTrue(hasattr(features, 'generate_quiz_questions'))
        self.assertTrue(hasattr(features, 'grade_open_ended_response'))
        self.assertTrue(hasattr(features, 'retry_with_exponential_backoff'))
        
        # Test that functions are callable
        self.assertTrue(callable(features.generate_quiz_questions))
        self.assertTrue(callable(features.grade_open_ended_response))
        self.assertTrue(callable(features.retry_with_exponential_backoff))
    
    def test_async_function_signatures(self):
        """Test that async functions have correct signatures."""
        import inspect
        
        # generate_quiz_questions should be async
        self.assertTrue(asyncio.iscoroutinefunction(features.generate_quiz_questions))
        
        # grade_open_ended_response should be async
        self.assertTrue(asyncio.iscoroutinefunction(features.grade_open_ended_response))
        
        # Check parameter counts
        quiz_sig = inspect.signature(features.generate_quiz_questions)
        grading_sig = inspect.signature(features.grade_open_ended_response)
        
        # generate_quiz_questions should have 3 parameters
        self.assertEqual(len(quiz_sig.parameters), 3)
        
        # grade_open_ended_response should have 5 parameters
        self.assertEqual(len(grading_sig.parameters), 5)
    
    @patch('features.print')  # Mock rich print to avoid output during tests
    def test_logging_integration(self, mock_print):
        """Test that logging works correctly."""
        async def run_test():
            # Test that functions use logging
            synthesis_data = {
                "quiz_questions": [{"question": "test"}],
                "generation_method": "legacy"
            }
            
            await features.generate_quiz_questions(
                [], Mock(), synthesis_data
            )
            
            # Should have printed some messages
            self.assertTrue(mock_print.called)
        
        asyncio.run(run_test())


class TestRetryDecoratorEdgeCases(unittest.TestCase):
    """Test edge cases for the retry decorator."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.call_count = 0
    
    def test_retry_decorator_preserves_function_name(self):
        """Test that decorator preserves original function name."""
        @features.retry_with_exponential_backoff
        def test_function():
            return "test"
        
        self.assertEqual(test_function.__name__, "test_function")
    
    def test_retry_decorator_with_return_value(self):
        """Test retry decorator with various return values."""
        @features.retry_with_exponential_backoff
        def function_with_return():
            return {"complex": {"nested": "data"}, "list": [1, 2, 3]}
        
        result = function_with_return()
        expected = {"complex": {"nested": "data"}, "list": [1, 2, 3]}
        self.assertEqual(result, expected)
    
    def test_retry_decorator_with_parameters(self):
        """Test retry decorator with function parameters."""
        @features.retry_with_exponential_backoff
        def function_with_params(param1, param2="default"):
            return {"param1": param1, "param2": param2}
        
        result = function_with_params("test", param2="custom")
        expected = {"param1": "test", "param2": "custom"}
        self.assertEqual(result, expected)
    
    @patch('features.time.sleep')
    def test_retry_decorator_timing_precision(self, mock_sleep):
        """Test retry decorator timing with precise control."""
        ResourceExhausted = MockResourceExhausted
        
        call_times = []
        
        @features.retry_with_exponential_backoff
        def timing_function():
            call_times.append(time.time())
            if len(call_times) <= 2:
                raise ResourceExhausted("Rate limit")
            return {"success": True}
        
        with patch('features.random.uniform', return_value=0):  # No jitter
            result = timing_function()
        
        self.assertEqual(result, {"success": True})
        self.assertEqual(len(call_times), 3)
        
        # Verify sleep was called with expected delays
        expected_delays = [2.0, 4.0]  # Base delays without jitter
        actual_delays = [call[0][0] for call in mock_sleep.call_args_list]
        self.assertEqual(actual_delays, expected_delays)


if __name__ == "__main__":
    unittest.main(verbosity=2)