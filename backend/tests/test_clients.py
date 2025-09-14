"""
Unit tests for client management in clients.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import unittest
from unittest.mock import patch, Mock, MagicMock
from typing import Dict, Any, Tuple, Optional

# Mock external dependencies before importing clients
with patch.dict('sys.modules', {
    'langchain_google_genai': Mock(),
    'tavily': Mock(),
    'httpx': Mock(),
    'google.cloud.storage': Mock()
}):
    import clients


class TestLLMClientManagement(unittest.TestCase):
    """Test LLM client management functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Reset global client variables
        clients.llm_best = None
        clients.llm_best_lite = None
        clients.llm_main = None
        clients.tavily_client = None
        clients.gcs_client = None
        clients.httpx_client = None
    
    def test_get_llm_best_success(self):
        """Test getting 'best' LLM client successfully."""
        # Setup mock LLM client
        mock_llm = Mock()
        clients.llm_best = mock_llm
        
        # Call function
        llm, options = clients.get_llm("best")
        
        # Verify results
        self.assertEqual(llm, mock_llm)
        self.assertEqual(options, {})
        self.assertIsInstance(options, dict)
    
    def test_get_llm_best_lite_success(self):
        """Test getting 'best-lite' LLM client successfully."""
        # Setup mock LLM client
        mock_llm = Mock()
        clients.llm_best_lite = mock_llm
        
        # Call function
        llm, options = clients.get_llm("best-lite")
        
        # Verify results
        self.assertEqual(llm, mock_llm)
        self.assertEqual(options, {})
    
    def test_get_llm_main_success(self):
        """Test getting 'main' LLM client successfully."""
        # Setup mock LLM client
        mock_llm = Mock()
        clients.llm_main = mock_llm
        
        # Call function
        llm, options = clients.get_llm("main")
        
        # Verify results
        self.assertEqual(llm, mock_llm)
        self.assertEqual(options, {})
    
    def test_get_llm_with_temperature(self):
        """Test getting LLM client with temperature option."""
        # Setup mock LLM client
        mock_llm = Mock()
        clients.llm_best = mock_llm
        
        # Call function with temperature
        temperature = 0.7
        llm, options = clients.get_llm("best", temperature=temperature)
        
        # Verify results
        self.assertEqual(llm, mock_llm)
        self.assertEqual(options, {"temperature": temperature})
        self.assertIn("temperature", options)
        self.assertEqual(options["temperature"], 0.7)
    
    def test_get_llm_with_zero_temperature(self):
        """Test getting LLM client with zero temperature."""
        # Setup mock LLM client
        mock_llm = Mock()
        clients.llm_best = mock_llm
        
        # Call function with zero temperature
        llm, options = clients.get_llm("best", temperature=0.0)
        
        # Verify results
        self.assertEqual(llm, mock_llm)
        self.assertEqual(options, {"temperature": 0.0})
    
    def test_get_llm_with_none_temperature(self):
        """Test getting LLM client with None temperature."""
        # Setup mock LLM client
        mock_llm = Mock()
        clients.llm_best = mock_llm
        
        # Call function with None temperature
        llm, options = clients.get_llm("best", temperature=None)
        
        # Verify results
        self.assertEqual(llm, mock_llm)
        self.assertEqual(options, {})
        self.assertNotIn("temperature", options)
    
    def test_get_llm_client_not_found(self):
        """Test getting LLM client when model name not found."""
        # Don't set up any clients
        
        with self.assertRaises(ValueError) as context:
            clients.get_llm("best")
        
        exception_message = str(context.exception)
        self.assertIn("LLM client 'best' not found or not initialized", exception_message)
    
    def test_get_llm_invalid_model_name(self):
        """Test getting LLM client with invalid model name."""
        with self.assertRaises(ValueError) as context:
            clients.get_llm("invalid_model")
        
        exception_message = str(context.exception)
        self.assertIn("LLM client 'invalid_model' not found or not initialized", exception_message)
    
    def test_get_llm_client_none(self):
        """Test getting LLM client when client is None."""
        # Explicitly set client to None
        clients.llm_best = None
        
        with self.assertRaises(ValueError) as context:
            clients.get_llm("best")
        
        exception_message = str(context.exception)
        self.assertIn("not found or not initialized", exception_message)
    
    def test_get_llm_return_types(self):
        """Test that get_llm returns correct types."""
        # Setup mock LLM client
        mock_llm = Mock()
        clients.llm_best = mock_llm
        
        # Call function
        llm, options = clients.get_llm("best")
        
        # Verify return types
        self.assertIsNotNone(llm)
        self.assertIsInstance(options, dict)
        
        # Verify tuple return
        result = clients.get_llm("best")
        self.assertIsInstance(result, tuple)
        self.assertEqual(len(result), 2)
    
    def test_get_llm_all_valid_models(self):
        """Test getting all valid model types."""
        # Setup all mock clients
        mock_best = Mock()
        mock_best_lite = Mock()
        mock_main = Mock()
        
        clients.llm_best = mock_best
        clients.llm_best_lite = mock_best_lite
        clients.llm_main = mock_main
        
        # Test each model
        llm_best, _ = clients.get_llm("best")
        llm_best_lite, _ = clients.get_llm("best-lite")
        llm_main, _ = clients.get_llm("main")
        
        # Verify each returns the correct client
        self.assertEqual(llm_best, mock_best)
        self.assertEqual(llm_best_lite, mock_best_lite)
        self.assertEqual(llm_main, mock_main)
    
    def test_get_llm_temperature_options_isolation(self):
        """Test that temperature options don't interfere between calls."""
        # Setup mock LLM client
        mock_llm = Mock()
        clients.llm_best = mock_llm
        
        # Call function with different temperatures
        llm1, options1 = clients.get_llm("best", temperature=0.5)
        llm2, options2 = clients.get_llm("best", temperature=0.9)
        llm3, options3 = clients.get_llm("best")  # No temperature
        
        # Verify options are isolated
        self.assertEqual(options1["temperature"], 0.5)
        self.assertEqual(options2["temperature"], 0.9)
        self.assertEqual(options3, {})
        
        # Verify same client returned
        self.assertEqual(llm1, mock_llm)
        self.assertEqual(llm2, mock_llm)
        self.assertEqual(llm3, mock_llm)
    
    def test_get_llm_with_float_temperature(self):
        """Test getting LLM client with various float temperatures."""
        # Setup mock LLM client
        mock_llm = Mock()
        clients.llm_best = mock_llm
        
        # Test various temperature values
        test_temperatures = [0.0, 0.1, 0.5, 0.7, 1.0, 1.5, 2.0]
        
        for temp in test_temperatures:
            llm, options = clients.get_llm("best", temperature=temp)
            self.assertEqual(llm, mock_llm)
            self.assertEqual(options["temperature"], temp)
    
    def test_get_llm_client_map_consistency(self):
        """Test that client map is consistent with expected model names."""
        # This test verifies the internal client_map structure
        # We can't directly access it, but we can test the expected model names
        
        # Setup all clients
        clients.llm_best = Mock()
        clients.llm_best_lite = Mock()
        clients.llm_main = Mock()
        
        # These should all work without raising exceptions
        clients.get_llm("best")
        clients.get_llm("best-lite")
        clients.get_llm("main")
        
        # These should raise ValueError
        with self.assertRaises(ValueError):
            clients.get_llm("default")  # Not in the map
        
        with self.assertRaises(ValueError):
            clients.get_llm("lite")  # Not in the map


class TestClientModuleStructure(unittest.TestCase):
    """Test the overall structure of the clients module."""
    
    def test_global_variables_exist(self):
        """Test that all expected global variables exist."""
        # Test that global client variables are defined
        self.assertTrue(hasattr(clients, 'llm_best'))
        self.assertTrue(hasattr(clients, 'llm_best_lite'))
        self.assertTrue(hasattr(clients, 'llm_main'))
        self.assertTrue(hasattr(clients, 'tavily_client'))
        self.assertTrue(hasattr(clients, 'gcs_client'))
        self.assertTrue(hasattr(clients, 'httpx_client'))
    
    def test_global_variables_initial_state(self):
        """Test that global variables start as None."""
        # Reset to initial state
        clients.llm_best = None
        clients.llm_best_lite = None
        clients.llm_main = None
        clients.tavily_client = None
        clients.gcs_client = None
        clients.httpx_client = None
        
        # All should be None initially
        self.assertIsNone(clients.llm_best)
        self.assertIsNone(clients.llm_best_lite)
        self.assertIsNone(clients.llm_main)
        self.assertIsNone(clients.tavily_client)
        self.assertIsNone(clients.gcs_client)
        self.assertIsNone(clients.httpx_client)
    
    def test_get_llm_function_exists(self):
        """Test that get_llm function exists and is callable."""
        self.assertTrue(hasattr(clients, 'get_llm'))
        self.assertTrue(callable(clients.get_llm))
    
    def test_imports_structure(self):
        """Test that the module has the expected import structure."""
        # Test that the module can be imported without errors
        # This is implicit since we're already importing it, but we can test attributes
        
        # The module should have the get_llm function
        self.assertTrue(hasattr(clients, 'get_llm'))
        
        # The module should have type annotations imported
        self.assertTrue(hasattr(clients, 'Dict'))
        self.assertTrue(hasattr(clients, 'Any'))
        self.assertTrue(hasattr(clients, 'Tuple'))
        self.assertTrue(hasattr(clients, 'Optional'))
    
    def test_function_signature(self):
        """Test that get_llm function has the expected signature."""
        import inspect
        
        sig = inspect.signature(clients.get_llm)
        params = sig.parameters
        
        # Should have 'model_name' and 'temperature' parameters
        self.assertIn('model_name', params)
        self.assertIn('temperature', params)
        
        # Check parameter types
        model_name_param = params['model_name']
        temperature_param = params['temperature']
        
        # model_name should be required
        self.assertEqual(model_name_param.default, inspect.Parameter.empty)
        
        # temperature should be optional with None default
        self.assertEqual(temperature_param.default, None)


class TestClientModuleEdgeCases(unittest.TestCase):
    """Test edge cases and error conditions."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Reset global client variables
        clients.llm_best = None
        clients.llm_best_lite = None
        clients.llm_main = None
    
    def test_get_llm_empty_string_model_name(self):
        """Test get_llm with empty string model name."""
        with self.assertRaises(ValueError):
            clients.get_llm("")
    
    def test_get_llm_whitespace_model_name(self):
        """Test get_llm with whitespace model name."""
        with self.assertRaises(ValueError):
            clients.get_llm("   ")
    
    def test_get_llm_case_sensitivity(self):
        """Test that model names are case sensitive."""
        # Setup a client
        clients.llm_best = Mock()
        
        # Should work with exact case
        clients.get_llm("best")
        
        # Should fail with different case
        with self.assertRaises(ValueError):
            clients.get_llm("BEST")
        
        with self.assertRaises(ValueError):
            clients.get_llm("Best")
    
    def test_get_llm_negative_temperature(self):
        """Test get_llm with negative temperature."""
        # Setup mock client
        clients.llm_best = Mock()
        
        # Should accept negative temperature (may be valid for some models)
        llm, options = clients.get_llm("best", temperature=-0.1)
        self.assertEqual(options["temperature"], -0.1)
    
    def test_get_llm_very_high_temperature(self):
        """Test get_llm with very high temperature."""
        # Setup mock client
        clients.llm_best = Mock()
        
        # Should accept high temperature
        llm, options = clients.get_llm("best", temperature=100.0)
        self.assertEqual(options["temperature"], 100.0)
    
    def test_get_llm_string_temperature(self):
        """Test get_llm with string temperature."""
        # Setup mock client
        clients.llm_best = Mock()
        
        # Should accept string temperature (Python doesn't enforce type at runtime)
        llm, options = clients.get_llm("best", temperature="0.5")
        self.assertEqual(options["temperature"], "0.5")
    
    def test_get_llm_multiple_calls_same_client(self):
        """Test multiple calls to get_llm return the same client instance."""
        # Setup mock client
        mock_client = Mock()
        clients.llm_best = mock_client
        
        # Call multiple times
        llm1, _ = clients.get_llm("best")
        llm2, _ = clients.get_llm("best")
        llm3, _ = clients.get_llm("best", temperature=0.5)
        
        # Should all return the same client instance
        self.assertIs(llm1, mock_client)
        self.assertIs(llm2, mock_client)
        self.assertIs(llm3, mock_client)
        self.assertIs(llm1, llm2)
        self.assertIs(llm2, llm3)
    
    def test_client_replacement(self):
        """Test that clients can be replaced at runtime."""
        # Setup initial client
        initial_client = Mock()
        clients.llm_best = initial_client
        
        llm1, _ = clients.get_llm("best")
        self.assertIs(llm1, initial_client)
        
        # Replace client
        new_client = Mock()
        clients.llm_best = new_client
        
        llm2, _ = clients.get_llm("best")
        self.assertIs(llm2, new_client)
        self.assertIsNot(llm2, initial_client)


if __name__ == "__main__":
    unittest.main(verbosity=2)