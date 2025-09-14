"""
Unit tests for content analysis in pipeline/services/analysis/content_analyzer.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import unittest
from unittest.mock import patch, Mock, AsyncMock
import asyncio
from typing import List, Dict, Any

# Mock external dependencies before importing
with patch.dict('sys.modules', {
    'langchain_core.prompts': Mock(),
    'langchain_core.output_parsers': Mock(),
    'langchain.output_parsers': Mock(),
    'langchain_core.runnables': Mock(),
    'rich': Mock()
}):
    # Mock the interfaces and config modules
    with patch.dict('sys.modules', {
        '...interfaces': Mock(),
        '...config': Mock(),
        '...utils': Mock()
    }):
        # Create mock modules for the imports
        mock_interfaces = Mock()
        mock_interfaces.ContentAnalyzer = Mock()
        mock_interfaces.AnalysisResult = Mock()
        
        mock_config = Mock()
        mock_config.get_persona_config = Mock()
        
        mock_utils = Mock()
        mock_utils.clean_line_for_analysis = Mock(side_effect=lambda x: x.strip())
        
        sys.modules['pipeline.interfaces'] = mock_interfaces
        sys.modules['pipeline.config'] = mock_config
        sys.modules['pipeline.utils'] = mock_utils
        
        from pipeline.services.analysis.content_analyzer import PersonaBasedAnalyzer


class TestPersonaBasedAnalyzer(unittest.TestCase):
    """Test PersonaBasedAnalyzer functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_llm = AsyncMock()
        self.mock_persona_config = {
            "prompt_system": "You are an expert analyzer. {format_instructions}",
            "output_keys": {
                "title": "generated_title",
                "summary": "1_sentence_summary", 
                "quotes": "notable_quotes",
                "entities": "entities",
                "claims": "key_claims"
            }
        }
        
        # Mock get_persona_config to return our test config
        with patch('pipeline.config.get_persona_config', return_value=self.mock_persona_config):
            self.analyzer = PersonaBasedAnalyzer(self.mock_llm, "deep_dive")
        
        self.runnable_config = Mock()
    
    def test_initialization(self):
        """Test analyzer initialization."""
        self.assertEqual(self.analyzer.llm, self.mock_llm)
        self.assertEqual(self.analyzer.persona, "deep_dive")
        self.assertEqual(self.analyzer.persona_config, self.mock_persona_config)
    
    def test_initialization_with_different_persona(self):
        """Test analyzer initialization with different persona."""
        learning_config = {
            "prompt_system": "You are a learning expert. {format_instructions}",
            "output_keys": {
                "title": "module_title",
                "summary": "learning_summary",
                "quotes": "key_quotes",
                "entities": "concepts"
            }
        }
        
        with patch('pipeline.config.get_persona_config', return_value=learning_config):
            learning_analyzer = PersonaBasedAnalyzer(self.mock_llm, "deep_dive")

        self.assertEqual(learning_analyzer.persona, "deep_dive")
        self.assertEqual(learning_analyzer.persona_config, learning_config)
    
    @patch('pipeline.services.analysis.content_analyzer.JsonOutputParser')
    @patch('pipeline.services.analysis.content_analyzer.OutputFixingParser')
    @patch('pipeline.services.analysis.content_analyzer.ChatPromptTemplate')
    def test_analyze_content_success(self, mock_prompt_template, mock_output_fixing_parser, mock_json_parser):
        """Test successful content analysis."""
        async def run_test():
            # Setup mocks
            mock_parser = Mock()
            mock_json_parser.return_value = mock_parser
            mock_parser.get_format_instructions.return_value = "Format instructions"
            
            mock_fixing_parser = Mock()
            mock_output_fixing_parser.from_llm.return_value = mock_fixing_parser
            
            mock_prompt = Mock()
            mock_prompt_template.from_messages.return_value = mock_prompt
            
            # Mock the chain
            mock_chain = AsyncMock()
            mock_prompt.__or__ = Mock(return_value=mock_chain)
            
            # Mock LLM result
            llm_result = {
                "generated_title": "Test Section",
                "1_sentence_summary": "This is a test summary.",
                "notable_quotes": ["Quote 1", "Quote 2"],
                "entities": [
                    {"name": "Entity1", "explanation": "Explanation1"},
                    {"name": "Entity2", "explanation": "Explanation2"}
                ],
                "key_claims": ["Claim 1"],
                "additional_field": "Extra data"
            }
            mock_chain.ainvoke.return_value = llm_result
            
            # Call function
            content = "This is test content with timestamps 00:30 to analyze."
            result = await self.analyzer.analyze_content(content, self.runnable_config)
            
            # Verify chain was called
            mock_chain.ainvoke.assert_called_once()
            call_args = mock_chain.ainvoke.call_args[0][0]
            self.assertIn("content", call_args)
            
            # Verify content was cleaned
            self.assertEqual(call_args["content"], "This is test content with timestamps to analyze.")
            
            # Verify result mapping
            self.assertEqual(result.title, "Test Section")
            self.assertEqual(result.summary, "This is a test summary.")
            self.assertEqual(result.quotes, ["Quote 1", "Quote 2"])
            self.assertEqual(len(result.entities), 2)
            self.assertEqual(result.claims, ["Claim 1"])
            self.assertIn("additional_field", result.additional_data)
        
        asyncio.run(run_test())
    
    @patch('pipeline.services.analysis.content_analyzer.JsonOutputParser')
    @patch('pipeline.services.analysis.content_analyzer.OutputFixingParser')
    @patch('pipeline.services.analysis.content_analyzer.ChatPromptTemplate')
    def test_analyze_content_deep_dive_persona(self, mock_prompt_template, mock_output_fixing_parser, mock_json_parser):
        """Test content analysis with deep_dive persona."""
        async def run_test():
            # Setup deep_dive analyzer
            deep_dive_config = {
                "prompt_system": "You are a deep dive expert. {format_instructions}",
                "output_keys": {
                    "title": "section_title",
                    "summary": "deep_summary", 
                    "quotes": "lessons_and_concepts",  # Special case for deep_dive
                    "entities": "key_entities"
                }
            }
            
            with patch('pipeline.config.get_persona_config', return_value=deep_dive_config):
                deep_dive_analyzer = PersonaBasedAnalyzer(self.mock_llm, "deep_dive")
            
            # Setup mocks
            mock_parser = Mock()
            mock_json_parser.return_value = mock_parser
            mock_parser.get_format_instructions.return_value = "Format instructions"
            
            mock_fixing_parser = Mock()
            mock_output_fixing_parser.from_llm.return_value = mock_fixing_parser
            
            mock_prompt = Mock()
            mock_prompt_template.from_messages.return_value = mock_prompt
            
            # Mock the chain
            mock_chain = AsyncMock()
            mock_prompt.__or__ = Mock(return_value=mock_chain)
            
            # Mock LLM result with lessons_and_concepts as objects
            llm_result = {
                "section_title": "Deep Dive Section",
                "deep_summary": "Deep analysis summary.",
                "lessons_and_concepts": [
                    {
                        "lesson": "Lesson 1",
                        "supporting_quote": "Quote 1",
                        "examples": ["Example 1"]
                    },
                    {
                        "lesson": "Lesson 2", 
                        "supporting_quote": "Quote 2",
                        "examples": ["Example 2"]
                    }
                ],
                "key_entities": [{"name": "Entity1", "explanation": "Explanation1"}]
            }
            mock_chain.ainvoke.return_value = llm_result
            
            # Call function
            result = await deep_dive_analyzer.analyze_content("Test content", self.runnable_config)
            
            # Verify deep_dive specific processing
            self.assertEqual(result.title, "Deep Dive Section")
            self.assertEqual(result.summary, "Deep analysis summary.")
            
            # Should extract supporting_quote from lesson objects for quotes
            expected_quotes = ["Quote 1", "Quote 2"]
            self.assertEqual(result.quotes, expected_quotes)
            
            # Should preserve full lessons_and_concepts in additional_data
            self.assertIn("lessons_and_concepts", result.additional_data)
            lessons = result.additional_data["lessons_and_concepts"]
            self.assertEqual(len(lessons), 2)
            self.assertEqual(lessons[0]["lesson"], "Lesson 1")
        
        asyncio.run(run_test())
    
    @patch('pipeline.services.analysis.content_analyzer.JsonOutputParser')
    @patch('pipeline.services.analysis.content_analyzer.OutputFixingParser')
    @patch('pipeline.services.analysis.content_analyzer.ChatPromptTemplate')
    def test_analyze_content_invalid_data_types(self, mock_prompt_template, mock_output_fixing_parser, mock_json_parser):
        """Test content analysis with invalid data types in LLM response."""
        async def run_test():
            # Setup mocks
            mock_parser = Mock()
            mock_json_parser.return_value = mock_parser
            mock_parser.get_format_instructions.return_value = "Format instructions"
            
            mock_fixing_parser = Mock()
            mock_output_fixing_parser.from_llm.return_value = mock_fixing_parser
            
            mock_prompt = Mock()
            mock_prompt_template.from_messages.return_value = mock_prompt
            
            # Mock the chain
            mock_chain = AsyncMock()
            mock_prompt.__or__ = Mock(return_value=mock_chain)
            
            # Mock LLM result with invalid data types
            llm_result = {
                "generated_title": "Test Section",
                "1_sentence_summary": "Test summary.",
                "notable_quotes": "Single quote string instead of list",  # Invalid type
                "entities": "Invalid entities string",  # Invalid type
                "key_claims": None  # Invalid type
            }
            mock_chain.ainvoke.return_value = llm_result
            
            # Call function
            result = await self.analyzer.analyze_content("Test content", self.runnable_config)
            
            # Verify invalid types are handled gracefully
            self.assertEqual(result.quotes, [])  # Should default to empty list
            self.assertEqual(result.entities, [])  # Should default to empty list
            self.assertEqual(result.claims, [])  # Should default to empty list
        
        asyncio.run(run_test())
    
    @patch('pipeline.services.analysis.content_analyzer.JsonOutputParser')
    @patch('pipeline.services.analysis.content_analyzer.OutputFixingParser')
    @patch('pipeline.services.analysis.content_analyzer.ChatPromptTemplate')
    def test_filter_entities_success(self, mock_prompt_template, mock_output_fixing_parser, mock_json_parser):
        """Test successful entity filtering."""
        async def run_test():
            # Setup mocks
            mock_parser = Mock()
            mock_json_parser.return_value = mock_parser
            mock_parser.get_format_instructions.return_value = "Format instructions"
            
            mock_fixing_parser = Mock()
            mock_output_fixing_parser.from_llm.return_value = mock_fixing_parser
            
            mock_prompt = Mock()
            mock_prompt_template.from_messages.return_value = mock_prompt
            
            # Mock the chain
            mock_chain = AsyncMock()
            mock_prompt.__or__ = Mock(return_value=mock_chain)
            
            # Mock LLM result
            filter_result = {
                "entities": ["Entity1", "Entity2", "Entity3"]
            }
            mock_chain.ainvoke.return_value = filter_result
            
            # Call function
            entities = ["Entity1", "Entity2", "Entity3", "Entity4", "Entity5"]
            content = "Test content for entity filtering"
            
            result = await self.analyzer.filter_entities(entities, content, self.runnable_config)
            
            # Verify result
            self.assertEqual(result, ["Entity1", "Entity2", "Entity3"])
            
            # Verify chain was called with correct parameters
            mock_chain.ainvoke.assert_called_once()
            call_args = mock_chain.ainvoke.call_args[0][0]
            self.assertIn("content", call_args)
            self.assertIn("entity_list", call_args)
        
        asyncio.run(run_test())
    
    @patch('pipeline.services.analysis.content_analyzer.JsonOutputParser')
    @patch('pipeline.services.analysis.content_analyzer.OutputFixingParser')
    @patch('pipeline.services.analysis.content_analyzer.ChatPromptTemplate')
    def test_filter_entities_dictionary_response(self, mock_prompt_template, mock_output_fixing_parser, mock_json_parser):
        """Test entity filtering when LLM returns dictionaries."""
        async def run_test():
            # Setup mocks
            mock_parser = Mock()
            mock_json_parser.return_value = mock_parser
            
            mock_fixing_parser = Mock()
            mock_output_fixing_parser.from_llm.return_value = mock_fixing_parser
            
            mock_prompt = Mock()
            mock_prompt_template.from_messages.return_value = mock_prompt
            
            # Mock the chain
            mock_chain = AsyncMock()
            mock_prompt.__or__ = Mock(return_value=mock_chain)
            
            # Mock LLM result with dictionaries
            filter_result = {
                "entities": [
                    {"entity": "Entity1", "importance": "high"},
                    {"name": "Entity2", "relevance": "medium"},
                    {"entity": "Entity3", "importance": "high"}
                ]
            }
            mock_chain.ainvoke.return_value = filter_result
            
            # Call function
            entities = ["Entity1", "Entity2", "Entity3", "Entity4"]
            result = await self.analyzer.filter_entities(entities, "Test content", self.runnable_config)
            
            # Verify normalization of dictionary responses
            expected = ["Entity1", "Entity2", "Entity3"]
            self.assertEqual(result, expected)
        
        asyncio.run(run_test())
    
    @patch('pipeline.services.analysis.content_analyzer.JsonOutputParser')
    @patch('pipeline.services.analysis.content_analyzer.OutputFixingParser')
    @patch('pipeline.services.analysis.content_analyzer.ChatPromptTemplate')
    def test_filter_entities_exception(self, mock_prompt_template, mock_output_fixing_parser, mock_json_parser):
        """Test entity filtering when exception occurs."""
        async def run_test():
            # Setup mocks to raise exception
            mock_chain = AsyncMock()
            mock_chain.ainvoke.side_effect = Exception("LLM Error")
            
            mock_prompt = Mock()
            mock_prompt_template.from_messages.return_value = mock_prompt
            mock_prompt.__or__ = Mock(return_value=mock_chain)
            
            # Call function
            entities = ["Entity1", "Entity2"]
            result = await self.analyzer.filter_entities(entities, "Test content", self.runnable_config)
            
            # Should return empty list on exception
            self.assertEqual(result, [])
        
        asyncio.run(run_test())
    
    def test_filter_entities_empty_list(self):
        """Test entity filtering with empty entity list."""
        async def run_test():
            result = await self.analyzer.filter_entities([], "Test content", self.runnable_config)
            self.assertEqual(result, [])
        
        asyncio.run(run_test())
    
    @patch('pipeline.services.analysis.content_analyzer.JsonOutputParser')
    @patch('pipeline.services.analysis.content_analyzer.ChatPromptTemplate')
    def test_filter_claims_success(self, mock_prompt_template, mock_json_parser):
        """Test successful claim filtering."""
        async def run_test():
            # Setup mocks
            mock_parser = Mock()
            mock_json_parser.return_value = mock_parser
            
            mock_prompt = Mock()
            mock_prompt_template.from_messages.return_value = mock_prompt
            
            # Mock the chain
            mock_chain = AsyncMock()
            mock_prompt.__or__ = Mock(return_value=mock_chain)
            
            # Mock LLM result
            filter_result = {
                "best_claim": "This is the most valuable claim for analysis."
            }
            mock_chain.ainvoke.return_value = filter_result
            
            # Call function
            claims = ["Claim 1", "Claim 2", "This is the most valuable claim for analysis."]
            content = "Test content for claim filtering"
            
            result = await self.analyzer.filter_claims(claims, content, self.runnable_config)
            
            # Verify result
            self.assertEqual(result, "This is the most valuable claim for analysis.")
            
            # Verify chain was called
            mock_chain.ainvoke.assert_called_once()
        
        asyncio.run(run_test())
    
    def test_filter_claims_deep_dive_persona_legacy(self):
        """Test claim filtering for deep_dive persona (consultant legacy test)."""
        async def run_test():
            # Setup deep_dive analyzer
            deep_dive_config = {
                "prompt_system": "You are a deep dive analyst. {format_instructions}",
                "output_keys": {
                    "title": "title",
                    "summary": "summary",
                    "quotes": "quotes",
                    "entities": "entities"
                }
            }
            
            with patch('pipeline.config.get_persona_config', return_value=deep_dive_config):
                deep_dive_analyzer = PersonaBasedAnalyzer(self.mock_llm, "deep_dive")
            
            claims = ["First claim", "Second claim"]
            result = await deep_dive_analyzer.filter_claims(claims, "Test content", self.runnable_config)
            
            # Should return first claim for deep_dive persona
            self.assertEqual(result, "First claim")
        
        asyncio.run(run_test())
    
    def test_filter_claims_empty_list(self):
        """Test claim filtering with empty claims list."""
        async def run_test():
            result = await self.analyzer.filter_claims([], "Test content", self.runnable_config)
            self.assertEqual(result, "")
        
        asyncio.run(run_test())
    
    @patch('pipeline.services.analysis.content_analyzer.JsonOutputParser')
    @patch('pipeline.services.analysis.content_analyzer.ChatPromptTemplate')
    def test_filter_claims_promotional_content_rejection(self, mock_prompt_template, mock_json_parser):
        """Test that promotional content is rejected in claim filtering."""
        async def run_test():
            # Setup mocks
            mock_parser = Mock()
            mock_json_parser.return_value = mock_parser
            
            mock_prompt = Mock()
            mock_prompt_template.from_messages.return_value = mock_prompt
            
            # Mock the chain
            mock_chain = AsyncMock()
            mock_prompt.__or__ = Mock(return_value=mock_chain)
            
            # Mock LLM result with promotional content
            filter_result = {
                "best_claim": "You can get 35% off at http://example.com/deal"
            }
            mock_chain.ainvoke.return_value = filter_result
            
            # Call function
            claims = ["Valid claim", "You can get 35% off at http://example.com/deal"]
            result = await self.analyzer.filter_claims(claims, "Test content", self.runnable_config)
            
            # Should reject promotional content
            self.assertEqual(result, "")
        
        asyncio.run(run_test())
    
    @patch('pipeline.services.analysis.content_analyzer.JsonOutputParser')
    @patch('pipeline.services.analysis.content_analyzer.ChatPromptTemplate')
    def test_filter_claims_exception(self, mock_prompt_template, mock_json_parser):
        """Test claim filtering when exception occurs."""
        async def run_test():
            # Setup mocks to raise exception
            mock_chain = AsyncMock()
            mock_chain.ainvoke.side_effect = Exception("LLM Error")
            
            mock_prompt = Mock()
            mock_prompt_template.from_messages.return_value = mock_prompt
            mock_prompt.__or__ = Mock(return_value=mock_chain)
            
            # Call function
            claims = ["Claim 1", "Claim 2"]
            result = await self.analyzer.filter_claims(claims, "Test content", self.runnable_config)
            
            # Should return empty string on exception
            self.assertEqual(result, "")
        
        asyncio.run(run_test())


class TestPersonaBasedAnalyzerLogging(unittest.TestCase):
    """Test logging functionality in PersonaBasedAnalyzer."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_llm = AsyncMock()
        self.mock_persona_config = {
            "prompt_system": "Test prompt. {format_instructions}",
            "output_keys": {
                "title": "generated_title",
                "summary": "1_sentence_summary", 
                "quotes": "notable_quotes",
                "entities": "entities"
            }
        }
        
        with patch('pipeline.config.get_persona_config', return_value=self.mock_persona_config):
            self.analyzer = PersonaBasedAnalyzer(self.mock_llm, "deep_dive")
    
    @patch('pipeline.services.analysis.content_analyzer.print')
    @patch('pipeline.services.analysis.content_analyzer.JsonOutputParser')
    @patch('pipeline.services.analysis.content_analyzer.OutputFixingParser')
    @patch('pipeline.services.analysis.content_analyzer.ChatPromptTemplate')
    def test_debug_logging_for_deep_dive(self, mock_prompt_template, mock_output_fixing_parser, mock_json_parser, mock_print):
        """Test debug logging for deep_dive persona."""
        async def run_test():
            # Setup mocks
            mock_parser = Mock()
            mock_json_parser.return_value = mock_parser
            mock_parser.get_format_instructions.return_value = "Format instructions"
            
            mock_fixing_parser = Mock()
            mock_output_fixing_parser.from_llm.return_value = mock_fixing_parser
            
            mock_prompt = Mock()
            mock_prompt_template.from_messages.return_value = mock_prompt
            
            # Mock the chain
            mock_chain = AsyncMock()
            mock_prompt.__or__ = Mock(return_value=mock_chain)
            
            # Mock LLM result with lessons_and_concepts
            llm_result = {
                "generated_title": "Test",
                "1_sentence_summary": "Summary",
                "notable_quotes": ["Quote"],
                "entities": [],
                "lessons_and_concepts": [
                    {"lesson": "Lesson 1"},
                    {"lesson": "Lesson 2"}
                ]
            }
            mock_chain.ainvoke.return_value = llm_result
            
            # Call function
            await self.analyzer.analyze_content("Test content", Mock())
            
            # Verify debug logging was called
            debug_calls = [call for call in mock_print.call_args_list 
                          if "Debug - Learning accelerator" in str(call)]
            self.assertGreater(len(debug_calls), 0)
        
        asyncio.run(run_test())


if __name__ == "__main__":
    unittest.main(verbosity=2)