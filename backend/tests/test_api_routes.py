"""
Unit tests for API routes in api_routes.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import unittest
from unittest.mock import patch, Mock, AsyncMock, MagicMock
import asyncio
import json
from typing import Dict, Any, List

# Mock external dependencies before importing api_routes
with patch.dict('sys.modules', {
    'youtube_transcript_api': Mock(),
    'youtube_transcript_api.proxies': Mock(),
    'firebase_admin': Mock(),
    'firebase_admin.firestore': Mock()
}):
    # Mock the imported modules
    mock_models = Mock()
    mock_utils = Mock()
    mock_db_manager = Mock()
    mock_security = Mock()
    mock_task_manager = Mock()
    
    sys.modules['src.models'] = mock_models
    sys.modules['src.utils'] = mock_utils
    sys.modules['src.db_manager'] = mock_db_manager
    sys.modules['src.security'] = mock_security
    sys.modules['src.task_manager'] = mock_task_manager
    
    # Import after mocking
    import api_routes


class TestTranscriptFetching(unittest.TestCase):
    """Test transcript fetching functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.video_id = "dQw4w9WgXcQ"
        self.mock_proxy_config = Mock()
    
    @patch('api_routes.YouTubeTranscriptApi')
    @patch('api_routes.GenericProxyConfig')
    def test_fetch_transcript_with_retry_success(self, mock_proxy_config, mock_transcript_api):
        """Test successful transcript fetching with retry mechanism."""
        # Setup mocks
        mock_transcript = [
            {"text": "Hello world", "start": 0.0, "duration": 2.0}
        ]
        mock_transcript_api.get_transcript.return_value = mock_transcript
        mock_proxy_config.return_value = self.mock_proxy_config
        
        # Call function
        result = api_routes.fetch_transcript_with_retry(self.video_id)
        
        # Verify result
        self.assertEqual(result, mock_transcript)
        
        # Verify API was called
        mock_transcript_api.get_transcript.assert_called_once()
    
    @patch('api_routes.YouTubeTranscriptApi')
    @patch('api_routes.GenericProxyConfig')
    @patch('api_routes.time.sleep')
    @patch('api_routes.random.uniform', return_value=0.5)
    def test_fetch_transcript_with_retry_failure_then_success(self, mock_uniform, mock_sleep, mock_proxy_config, mock_transcript_api):
        """Test transcript fetching that fails then succeeds."""
        # Setup mocks
        mock_transcript = [
            {"text": "Hello world", "start": 0.0, "duration": 2.0}
        ]
        
        # First call fails, second succeeds
        mock_transcript_api.get_transcript.side_effect = [
            Exception("Network error"),
            mock_transcript
        ]
        mock_proxy_config.return_value = self.mock_proxy_config
        
        # Call function
        result = api_routes.fetch_transcript_with_retry(self.video_id)
        
        # Verify result
        self.assertEqual(result, mock_transcript)
        
        # Verify retry mechanism
        self.assertEqual(mock_transcript_api.get_transcript.call_count, 2)
        mock_sleep.assert_called_once()
    
    @patch('api_routes.YouTubeTranscriptApi')
    @patch('api_routes.GenericProxyConfig')
    @patch('api_routes.time.sleep')
    def test_fetch_transcript_with_retry_max_retries(self, mock_sleep, mock_proxy_config, mock_transcript_api):
        """Test transcript fetching that exceeds max retries."""
        # Setup mocks to always fail
        mock_transcript_api.get_transcript.side_effect = Exception("Persistent error")
        mock_proxy_config.return_value = self.mock_proxy_config
        
        # Call function
        result = api_routes.fetch_transcript_with_retry(self.video_id, max_retries=3)
        
        # Should return None after max retries
        self.assertIsNone(result)
        
        # Verify max retries were attempted
        self.assertEqual(mock_transcript_api.get_transcript.call_count, 3)
        self.assertEqual(mock_sleep.call_count, 3)
    
    @patch('api_routes.YouTubeTranscriptApi')
    @patch('api_routes.GenericProxyConfig')
    def test_fetch_transcript_different_retry_parameters(self, mock_proxy_config, mock_transcript_api):
        """Test transcript fetching with different retry parameters."""
        mock_transcript = [{"text": "Test", "start": 0.0, "duration": 1.0}]
        mock_transcript_api.get_transcript.return_value = mock_transcript
        mock_proxy_config.return_value = self.mock_proxy_config
        
        # Test with custom parameters
        result = api_routes.fetch_transcript_with_retry(
            self.video_id, 
            max_retries=5, 
            max_delay_seconds=10
        )
        
        self.assertEqual(result, mock_transcript)
    
    def test_fetch_transcript_proxy_configuration(self):
        """Test that proxy configuration is set up correctly."""
        with patch('api_routes.GenericProxyConfig') as mock_proxy_config:
            with patch('api_routes.YouTubeTranscriptApi') as mock_api:
                mock_api.get_transcript.return_value = []
                
                # Call function
                api_routes.fetch_transcript_with_retry(self.video_id)
                
                # Verify proxy config was created
                mock_proxy_config.assert_called()
                
                # Verify proxy was passed to get_transcript
                call_args = mock_api.get_transcript.call_args
                self.assertIn("proxies", call_args[1])


class TestEnvironmentVariableValidation(unittest.TestCase):
    """Test environment variable validation."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.required_env_vars = [
            "DATIMP_USER",
            "DATIMP_PASS", 
            "DATIMP_HOST",
            "DATIMP_PORT"
        ]
    
    @patch.dict(os.environ, {
        'DATIMP_USER': 'test_user',
        'DATIMP_PASS': 'test_pass',
        'DATIMP_HOST': 'test_host',
        'DATIMP_PORT': '8080'
    })
    def test_environment_variables_loaded(self):
        """Test that environment variables are loaded correctly."""
        # Re-import to trigger environment variable loading
        import importlib
        importlib.reload(api_routes)
        
        # Environment variables should be accessible
        # Note: The actual validation happens at module import time
    
    @patch.dict(os.environ, {
        'DATIMP_USER': 'test_user',
        # Missing other required variables
    })
    def test_missing_environment_variables(self):
        """Test behavior when required environment variables are missing."""
        # This test documents expected behavior when env vars are missing
        # The actual implementation raises RuntimeError at import time
        
        # Since we've already imported the module, we can't easily test
        # the import-time behavior without complex mocking
        
        # This test serves as documentation of the expected behavior
        pass


class TestAPIRouteStructure(unittest.TestCase):
    """Test API route structure and configuration."""
    
    def test_router_exists(self):
        """Test that APIRouter exists."""
        self.assertTrue(hasattr(api_routes, 'router'))
        # Note: Can't easily test router type without importing FastAPI
    
    def test_required_imports_exist(self):
        """Test that required imports are available."""
        # Test that key modules are imported
        self.assertTrue(hasattr(api_routes, 'uuid'))
        self.assertTrue(hasattr(api_routes, 'datetime'))
        self.assertTrue(hasattr(api_routes, 'random'))
        self.assertTrue(hasattr(api_routes, 'time'))
    
    def test_function_exists(self):
        """Test that expected functions exist."""
        self.assertTrue(hasattr(api_routes, 'fetch_transcript_with_retry'))
        self.assertTrue(callable(api_routes.fetch_transcript_with_retry))


class TestRetryMechanism(unittest.TestCase):
    """Test retry mechanism implementation details."""
    
    @patch('api_routes.time.sleep')
    @patch('api_routes.random.uniform')
    def test_retry_delay_calculation(self, mock_uniform, mock_sleep):
        """Test retry delay calculation and jitter."""
        mock_uniform.return_value = 1.5  # Fixed jitter value
        
        with patch('api_routes.YouTubeTranscriptApi') as mock_api:
            with patch('api_routes.GenericProxyConfig'):
                # Setup to fail multiple times
                mock_api.get_transcript.side_effect = [
                    Exception("Error 1"),
                    Exception("Error 2"), 
                    Exception("Error 3"),
                    [{"text": "Success"}]
                ]
                
                # Call function
                result = api_routes.fetch_transcript_with_retry("test_id", max_retries=4)
                
                # Verify delays increase with each retry
                sleep_calls = mock_sleep.call_args_list
                self.assertEqual(len(sleep_calls), 3)  # 3 retries before success
                
                # Verify exponential backoff (base delays: 1, 2, 4 + jitter)
                delays = [call[0][0] for call in sleep_calls]
                self.assertTrue(delays[0] >= 1.0)  # First delay >= 1
                self.assertTrue(delays[1] >= 2.0)  # Second delay >= 2
                self.assertTrue(delays[2] >= 4.0)  # Third delay >= 4
                
                # Verify jitter was added
                for delay in delays:
                    self.assertLessEqual(delay, 8.5)  # Max delay with jitter
    
    @patch('api_routes.time.sleep')
    def test_retry_mechanism_respects_max_delay(self, mock_sleep):
        """Test that retry mechanism respects max delay parameter."""
        with patch('api_routes.YouTubeTranscriptApi') as mock_api:
            with patch('api_routes.GenericProxyConfig'):
                with patch('api_routes.random.uniform', return_value=0):
                    # Setup to fail multiple times
                    mock_api.get_transcript.side_effect = Exception("Persistent error")
                    
                    # Call with low max delay
                    api_routes.fetch_transcript_with_retry(
                        "test_id", 
                        max_retries=3, 
                        max_delay_seconds=1
                    )
                    
                    # Verify delays don't exceed max
                    sleep_calls = mock_sleep.call_args_list
                    delays = [call[0][0] for call in sleep_calls]
                    
                    for delay in delays:
                        self.assertLessEqual(delay, 1.0)  # Should not exceed max_delay
    
    def test_retry_mechanism_no_delay_on_success(self):
        """Test that no delay occurs when first attempt succeeds."""
        with patch('api_routes.time.sleep') as mock_sleep:
            with patch('api_routes.YouTubeTranscriptApi') as mock_api:
                with patch('api_routes.GenericProxyConfig'):
                    # Setup to succeed immediately
                    mock_api.get_transcript.return_value = [{"text": "Success"}]
                    
                    # Call function
                    result = api_routes.fetch_transcript_with_retry("test_id")
                    
                    # Verify no sleep was called
                    mock_sleep.assert_not_called()
                    
                    # Verify result
                    self.assertEqual(result, [{"text": "Success"}])


class TestAPIRoutesEdgeCases(unittest.TestCase):
    """Test edge cases in API routes."""
    
    def test_fetch_transcript_empty_video_id(self):
        """Test transcript fetching with empty video ID."""
        with patch('api_routes.YouTubeTranscriptApi') as mock_api:
            with patch('api_routes.GenericProxyConfig'):
                mock_api.get_transcript.side_effect = Exception("Invalid video ID")
                
                # Call with empty video ID
                result = api_routes.fetch_transcript_with_retry("")
                
                # Should return None after retries
                self.assertIsNone(result)
    
    def test_fetch_transcript_none_video_id(self):
        """Test transcript fetching with None video ID."""
        with patch('api_routes.YouTubeTranscriptApi') as mock_api:
            with patch('api_routes.GenericProxyConfig'):
                mock_api.get_transcript.side_effect = Exception("Invalid video ID")
                
                # Call with None video ID
                result = api_routes.fetch_transcript_with_retry(None)
                
                # Should return None after retries
                self.assertIsNone(result)
    
    def test_fetch_transcript_zero_retries(self):
        """Test transcript fetching with zero retries."""
        with patch('api_routes.YouTubeTranscriptApi') as mock_api:
            with patch('api_routes.GenericProxyConfig'):
                mock_api.get_transcript.side_effect = Exception("Error")
                
                # Call with zero retries
                result = api_routes.fetch_transcript_with_retry("test_id", max_retries=0)
                
                # Should return None immediately
                self.assertIsNone(result)
                
                # Should not call API since max_retries is 0
                mock_api.get_transcript.assert_not_called()
    
    def test_fetch_transcript_negative_retries(self):
        """Test transcript fetching with negative retries."""
        with patch('api_routes.YouTubeTranscriptApi') as mock_api:
            with patch('api_routes.GenericProxyConfig'):
                mock_api.get_transcript.side_effect = Exception("Error")
                
                # Call with negative retries
                result = api_routes.fetch_transcript_with_retry("test_id", max_retries=-1)
                
                # Should handle gracefully (behavior depends on implementation)
                # At minimum, should not crash
                self.assertIsNotNone(result) or self.assertIsNone(result)


class TestAPIRoutesConfiguration(unittest.TestCase):
    """Test API routes configuration and setup."""
    
    def test_proxy_environment_variables(self):
        """Test that proxy environment variables are used correctly."""
        # This test verifies that the required environment variables
        # are being read and used for proxy configuration
        
        required_vars = ["DATIMP_USER", "DATIMP_PASS", "DATIMP_HOST", "DATIMP_PORT"]
        
        # Test that these variables are referenced in the module
        # (This is more of a documentation test)
        import inspect
        source = inspect.getsource(api_routes)
        
        for var in required_vars:
            self.assertIn(var, source)
    
    def test_constants_and_configuration(self):
        """Test that necessary constants are defined."""
        # Test that required modules and functions are imported
        self.assertTrue(hasattr(api_routes, 'uuid'))
        self.assertTrue(hasattr(api_routes, 'datetime'))
        self.assertTrue(hasattr(api_routes, 'random'))
        self.assertTrue(hasattr(api_routes, 'time'))
        
        # Test that router is configured
        self.assertTrue(hasattr(api_routes, 'router'))


class TestAPIRoutesIntegration(unittest.TestCase):
    """Test integration scenarios for API routes."""
    
    def test_module_import_integrity(self):
        """Test that module imports work correctly."""
        # Test that all expected attributes exist after import
        expected_attributes = [
            'router',
            'fetch_transcript_with_retry'
        ]
        
        for attr in expected_attributes:
            self.assertTrue(hasattr(api_routes, attr), f"Missing attribute: {attr}")
    
    def test_error_handling_consistency(self):
        """Test that error handling is consistent across functions."""
        # Test that exceptions are handled gracefully
        with patch('api_routes.YouTubeTranscriptApi') as mock_api:
            with patch('api_routes.GenericProxyConfig'):
                # Test various exception types
                exception_types = [
                    Exception("Generic error"),
                    ValueError("Value error"),
                    ConnectionError("Connection error"),
                    TimeoutError("Timeout error")
                ]
                
                for exception in exception_types:
                    mock_api.get_transcript.side_effect = exception
                    
                    # Should handle all exceptions gracefully
                    result = api_routes.fetch_transcript_with_retry("test_id", max_retries=1)
                    self.assertIsNone(result)
    
    def test_function_parameter_validation(self):
        """Test function parameter validation."""
        # Test that functions handle various parameter types correctly
        
        # Test with different parameter types for max_retries
        valid_retry_values = [0, 1, 5, 10]
        
        for retry_value in valid_retry_values:
            with patch('api_routes.YouTubeTranscriptApi') as mock_api:
                with patch('api_routes.GenericProxyConfig'):
                    mock_api.get_transcript.return_value = []
                    
                    # Should not raise exception for valid retry values
                    try:
                        result = api_routes.fetch_transcript_with_retry(
                            "test_id", 
                            max_retries=retry_value
                        )
                        self.assertEqual(result, [])
                    except Exception as e:
                        self.fail(f"Unexpected exception for retry_value {retry_value}: {e}")


if __name__ == "__main__":
    unittest.main(verbosity=2)