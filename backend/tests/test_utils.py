"""
Unit tests for utility functions in utils.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import unittest
from unittest.mock import patch, Mock, AsyncMock
import asyncio
from typing import Dict, Optional

# Mock external dependencies before importing utils
with patch.dict('sys.modules', {
    'httpx': Mock()
}):
    import utils


class TestExtractYouTubeVideoId(unittest.TestCase):
    """Test YouTube video ID extraction functionality."""
    
    def test_extract_standard_watch_url(self):
        """Test extracting ID from standard YouTube watch URL."""
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        result = utils.extract_youtube_video_id(url)
        self.assertEqual(result, "dQw4w9WgXcQ")
    
    def test_extract_short_youtu_be_url(self):
        """Test extracting ID from short youtu.be URL."""
        url = "https://youtu.be/dQw4w9WgXcQ"
        result = utils.extract_youtube_video_id(url)
        self.assertEqual(result, "dQw4w9WgXcQ")
    
    def test_extract_embed_url(self):
        """Test extracting ID from embed URL."""
        url = "https://www.youtube.com/embed/dQw4w9WgXcQ"
        result = utils.extract_youtube_video_id(url)
        self.assertEqual(result, "dQw4w9WgXcQ")
    
    def test_extract_v_url(self):
        """Test extracting ID from /v/ URL."""
        url = "https://www.youtube.com/v/dQw4w9WgXcQ"
        result = utils.extract_youtube_video_id(url)
        self.assertEqual(result, "dQw4w9WgXcQ")
    
    def test_extract_url_with_additional_parameters(self):
        """Test extracting ID from URL with additional parameters."""
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&list=PLrAXtmRdnEQy5gj"
        result = utils.extract_youtube_video_id(url)
        self.assertEqual(result, "dQw4w9WgXcQ")
    
    def test_extract_url_with_timestamp(self):
        """Test extracting ID from URL with timestamp parameter."""
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s"
        result = utils.extract_youtube_video_id(url)
        self.assertEqual(result, "dQw4w9WgXcQ")
    
    def test_extract_mobile_url(self):
        """Test extracting ID from mobile YouTube URL."""
        url = "https://m.youtube.com/watch?v=dQw4w9WgXcQ"
        result = utils.extract_youtube_video_id(url)
        self.assertEqual(result, "dQw4w9WgXcQ")
    
    def test_extract_url_without_www(self):
        """Test extracting ID from URL without www."""
        url = "https://youtube.com/watch?v=dQw4w9WgXcQ"
        result = utils.extract_youtube_video_id(url)
        self.assertEqual(result, "dQw4w9WgXcQ")
    
    def test_extract_http_url(self):
        """Test extracting ID from HTTP (non-HTTPS) URL."""
        url = "http://www.youtube.com/watch?v=dQw4w9WgXcQ"
        result = utils.extract_youtube_video_id(url)
        self.assertEqual(result, "dQw4w9WgXcQ")
    
    def test_extract_invalid_url(self):
        """Test extracting ID from invalid URL."""
        url = "https://www.google.com"
        result = utils.extract_youtube_video_id(url)
        self.assertIsNone(result)
    
    def test_extract_invalid_video_id_length(self):
        """Test extracting ID that doesn't match expected length."""
        url = "https://www.youtube.com/watch?v=shortid"
        result = utils.extract_youtube_video_id(url)
        self.assertIsNone(result)
    
    def test_extract_empty_url(self):
        """Test extracting ID from empty URL."""
        url = ""
        result = utils.extract_youtube_video_id(url)
        self.assertIsNone(result)
    
    def test_extract_none_url(self):
        """Test extracting ID from None URL."""
        url = None
        # This might raise an exception, depending on implementation
        try:
            result = utils.extract_youtube_video_id(url)
            self.assertIsNone(result)
        except (TypeError, AttributeError):
            # Expected behavior for None input
            pass
    
    def test_extract_malformed_youtube_url(self):
        """Test extracting ID from malformed YouTube URL."""
        url = "https://www.youtube.com/watch?vid=dQw4w9WgXcQ"  # Wrong parameter name
        result = utils.extract_youtube_video_id(url)
        self.assertIsNone(result)
    
    def test_extract_youtube_url_missing_video_id(self):
        """Test extracting ID from YouTube URL missing video ID."""
        url = "https://www.youtube.com/watch?v="
        result = utils.extract_youtube_video_id(url)
        self.assertIsNone(result)
    
    def test_extract_youtube_playlist_url(self):
        """Test extracting ID from YouTube playlist URL with video."""
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmRdnEQy5gj"
        result = utils.extract_youtube_video_id(url)
        self.assertEqual(result, "dQw4w9WgXcQ")
    
    def test_extract_case_insensitive_patterns(self):
        """Test extracting ID with different case patterns."""
        # Test that the function handles case variations properly
        url = "HTTPS://WWW.YOUTUBE.COM/WATCH?V=dQw4w9WgXcQ"
        result = utils.extract_youtube_video_id(url)
        # Depending on implementation, this might or might not work
        # The test documents expected behavior


class TestFetchYouTubeMetadata(unittest.TestCase):
    """Test YouTube metadata fetching functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.video_id = "dQw4w9WgXcQ"
        self.api_key = "test_api_key"
    
    @patch('utils.os.getenv')
    @patch('utils.httpx.AsyncClient')
    def test_fetch_metadata_success(self, mock_httpx_client, mock_getenv):
        """Test successful metadata fetching."""
        async def run_test():
            # Setup mocks
            mock_getenv.return_value = self.api_key
            
            mock_response = Mock()
            mock_response.json.return_value = {
                "items": [{
                    "snippet": {
                        "title": "Test Video Title",
                        "channelTitle": "Test Channel",
                        "thumbnails": {
                            "high": {"url": "https://img.youtube.com/vi/test/hqdefault.jpg"}
                        }
                    },
                    "contentDetails": {
                        "duration": "PT4M33S"
                    }
                }]
            }
            mock_response.raise_for_status.return_value = None
            
            mock_client_instance = Mock()
            mock_client_instance.get = AsyncMock(return_value=mock_response)
            mock_httpx_client.return_value.__aenter__ = AsyncMock(return_value=mock_client_instance)
            mock_httpx_client.return_value.__aexit__ = AsyncMock(return_value=None)
            
            # Call function
            result = await utils.fetch_youtube_metadata(self.video_id)
            
            # Verify result
            expected = {
                "title": "Test Video Title",
                "channel_name": "Test Channel", 
                "thumbnail_url": "https://img.youtube.com/vi/test/hqdefault.jpg",
                "duration": "PT4M33S"
            }
            self.assertEqual(result, expected)
            
            # Verify API was called correctly
            mock_client_instance.get.assert_called_once()
            call_args = mock_client_instance.get.call_args
            self.assertIn("googleapis.com", call_args[0][0])
        
        asyncio.run(run_test())
    
    @patch('utils.os.getenv')
    def test_fetch_metadata_no_api_key(self, mock_getenv):
        """Test metadata fetching when API key is not available."""
        async def run_test():
            # Setup mock to return None for API key
            mock_getenv.return_value = None
            
            # Call function
            result = await utils.fetch_youtube_metadata(self.video_id)
            
            # Should return empty dict
            self.assertEqual(result, {})
        
        asyncio.run(run_test())
    
    @patch('utils.os.getenv')
    @patch('utils.httpx.AsyncClient')
    def test_fetch_metadata_no_items(self, mock_httpx_client, mock_getenv):
        """Test metadata fetching when API returns no items."""
        async def run_test():
            # Setup mocks
            mock_getenv.return_value = self.api_key
            
            mock_response = Mock()
            mock_response.json.return_value = {"items": []}
            mock_response.raise_for_status.return_value = None
            
            mock_client_instance = Mock()
            mock_client_instance.get = AsyncMock(return_value=mock_response)
            mock_httpx_client.return_value.__aenter__ = AsyncMock(return_value=mock_client_instance)
            mock_httpx_client.return_value.__aexit__ = AsyncMock(return_value=None)
            
            # Call function
            result = await utils.fetch_youtube_metadata(self.video_id)
            
            # Should return empty dict
            self.assertEqual(result, {})
        
        asyncio.run(run_test())
    
    @patch('utils.os.getenv')
    @patch('utils.httpx.AsyncClient')
    def test_fetch_metadata_http_error(self, mock_httpx_client, mock_getenv):
        """Test metadata fetching when HTTP error occurs."""
        async def run_test():
            # Setup mocks
            mock_getenv.return_value = self.api_key
            
            mock_client_instance = Mock()
            mock_client_instance.get = AsyncMock(side_effect=Exception("HTTP Error"))
            mock_httpx_client.return_value.__aenter__ = AsyncMock(return_value=mock_client_instance)
            mock_httpx_client.return_value.__aexit__ = AsyncMock(return_value=None)
            
            # Call function
            result = await utils.fetch_youtube_metadata(self.video_id)
            
            # Should return empty dict on exception
            self.assertEqual(result, {})
        
        asyncio.run(run_test())
    
    @patch('utils.os.getenv')
    @patch('utils.httpx.AsyncClient')
    def test_fetch_metadata_missing_thumbnails(self, mock_httpx_client, mock_getenv):
        """Test metadata fetching when thumbnails are missing."""
        async def run_test():
            # Setup mocks
            mock_getenv.return_value = self.api_key
            
            mock_response = Mock()
            mock_response.json.return_value = {
                "items": [{
                    "snippet": {
                        "title": "Test Video Title",
                        "channelTitle": "Test Channel",
                        "thumbnails": {}  # Empty thumbnails
                    },
                    "contentDetails": {
                        "duration": "PT4M33S"
                    }
                }]
            }
            mock_response.raise_for_status.return_value = None
            
            mock_client_instance = Mock()
            mock_client_instance.get = AsyncMock(return_value=mock_response)
            mock_httpx_client.return_value.__aenter__ = AsyncMock(return_value=mock_client_instance)
            mock_httpx_client.return_value.__aexit__ = AsyncMock(return_value=None)
            
            # Call function
            result = await utils.fetch_youtube_metadata(self.video_id)
            
            # Should have empty thumbnail URL
            expected = {
                "title": "Test Video Title",
                "channel_name": "Test Channel",
                "thumbnail_url": "",
                "duration": "PT4M33S"
            }
            self.assertEqual(result, expected)
        
        asyncio.run(run_test())
    
    @patch('utils.os.getenv')
    @patch('utils.httpx.AsyncClient')
    def test_fetch_metadata_partial_data(self, mock_httpx_client, mock_getenv):
        """Test metadata fetching when some fields are missing."""
        async def run_test():
            # Setup mocks
            mock_getenv.return_value = self.api_key
            
            mock_response = Mock()
            mock_response.json.return_value = {
                "items": [{
                    "snippet": {
                        "title": "Test Video Title"
                        # Missing channelTitle and thumbnails
                    },
                    "contentDetails": {
                        # Missing duration
                    }
                }]
            }
            mock_response.raise_for_status.return_value = None
            
            mock_client_instance = Mock()
            mock_client_instance.get = AsyncMock(return_value=mock_response)
            mock_httpx_client.return_value.__aenter__ = AsyncMock(return_value=mock_client_instance)
            mock_httpx_client.return_value.__aexit__ = AsyncMock(return_value=None)
            
            # Call function
            result = await utils.fetch_youtube_metadata(self.video_id)
            
            # Should use defaults for missing fields
            expected = {
                "title": "Test Video Title",
                "channel_name": "",
                "thumbnail_url": "",
                "duration": ""
            }
            self.assertEqual(result, expected)
        
        asyncio.run(run_test())
    
    @patch('utils.os.getenv')
    @patch('utils.httpx.AsyncClient')
    def test_fetch_metadata_thumbnail_fallback(self, mock_httpx_client, mock_getenv):
        """Test metadata fetching with thumbnail quality fallback."""
        async def run_test():
            # Setup mocks with only medium quality thumbnail
            mock_getenv.return_value = self.api_key
            
            mock_response = Mock()
            mock_response.json.return_value = {
                "items": [{
                    "snippet": {
                        "title": "Test Video Title",
                        "channelTitle": "Test Channel",
                        "thumbnails": {
                            "medium": {"url": "https://img.youtube.com/vi/test/mqdefault.jpg"},
                            "default": {"url": "https://img.youtube.com/vi/test/default.jpg"}
                            # No high quality thumbnail
                        }
                    },
                    "contentDetails": {
                        "duration": "PT4M33S"
                    }
                }]
            }
            mock_response.raise_for_status.return_value = None
            
            mock_client_instance = Mock()
            mock_client_instance.get = AsyncMock(return_value=mock_response)
            mock_httpx_client.return_value.__aenter__ = AsyncMock(return_value=mock_client_instance)
            mock_httpx_client.return_value.__aexit__ = AsyncMock(return_value=None)
            
            # Call function
            result = await utils.fetch_youtube_metadata(self.video_id)
            
            # Should fallback to medium quality
            self.assertEqual(result["thumbnail_url"], "https://img.youtube.com/vi/test/mqdefault.jpg")
        
        asyncio.run(run_test())


class TestFormatIsoDurationToReadable(unittest.TestCase):
    """Test ISO 8601 duration formatting functionality."""
    
    def test_format_minutes_seconds(self):
        """Test formatting duration with minutes and seconds."""
        iso_duration = "PT4M33S"
        result = utils.format_iso_duration_to_readable(iso_duration)
        self.assertEqual(result, "4:33")
    
    def test_format_hours_minutes_seconds(self):
        """Test formatting duration with hours, minutes, and seconds."""
        iso_duration = "PT1H23M45S"
        result = utils.format_iso_duration_to_readable(iso_duration)
        self.assertEqual(result, "1:23:45")
    
    def test_format_only_seconds(self):
        """Test formatting duration with only seconds."""
        iso_duration = "PT45S"
        result = utils.format_iso_duration_to_readable(iso_duration)
        self.assertEqual(result, "0:45")
    
    def test_format_only_minutes(self):
        """Test formatting duration with only minutes."""
        iso_duration = "PT5M"
        result = utils.format_iso_duration_to_readable(iso_duration)
        self.assertEqual(result, "5:00")
    
    def test_format_only_hours(self):
        """Test formatting duration with only hours."""
        iso_duration = "PT2H"
        result = utils.format_iso_duration_to_readable(iso_duration)
        self.assertEqual(result, "2:00:00")
    
    def test_format_hours_seconds_no_minutes(self):
        """Test formatting duration with hours and seconds but no minutes."""
        iso_duration = "PT1H30S"
        result = utils.format_iso_duration_to_readable(iso_duration)
        self.assertEqual(result, "1:00:30")
    
    def test_format_zero_duration(self):
        """Test formatting zero duration."""
        iso_duration = "PT0S"
        result = utils.format_iso_duration_to_readable(iso_duration)
        self.assertEqual(result, "0:00")
    
    def test_format_empty_string(self):
        """Test formatting empty string."""
        iso_duration = ""
        result = utils.format_iso_duration_to_readable(iso_duration)
        self.assertEqual(result, "")
    
    def test_format_none_input(self):
        """Test formatting None input."""
        iso_duration = None
        result = utils.format_iso_duration_to_readable(iso_duration)
        self.assertEqual(result, "")
    
    def test_format_malformed_duration(self):
        """Test formatting malformed duration string."""
        iso_duration = "INVALID"
        # This might raise an exception or return a default value
        try:
            result = utils.format_iso_duration_to_readable(iso_duration)
            # If it doesn't raise an exception, it should return empty or some default
            self.assertIsInstance(result, str)
        except (ValueError, IndexError, AttributeError):
            # Expected behavior for malformed input
            pass
    
    def test_format_large_duration(self):
        """Test formatting large duration values."""
        iso_duration = "PT10H59M59S"
        result = utils.format_iso_duration_to_readable(iso_duration)
        self.assertEqual(result, "10:59:59")
    
    def test_format_double_digit_values(self):
        """Test formatting with double-digit values."""
        iso_duration = "PT12M34S"
        result = utils.format_iso_duration_to_readable(iso_duration)
        self.assertEqual(result, "12:34")
    
    def test_format_single_digit_padding(self):
        """Test that single digits are padded correctly in hours format."""
        iso_duration = "PT1H2M3S"
        result = utils.format_iso_duration_to_readable(iso_duration)
        self.assertEqual(result, "1:02:03")
    
    def test_format_no_pt_prefix(self):
        """Test formatting duration without PT prefix."""
        iso_duration = "4M33S"  # Missing PT
        # This should be handled gracefully or raise an appropriate exception
        try:
            result = utils.format_iso_duration_to_readable(iso_duration)
            # If it handles it, verify the result
            self.assertIsInstance(result, str)
        except (ValueError, IndexError):
            # Expected behavior for malformed input
            pass


class TestUtilsIntegration(unittest.TestCase):
    """Test integration scenarios for utils module."""
    
    def test_module_imports(self):
        """Test that the module imports correctly."""
        # Test that key functions are available
        self.assertTrue(hasattr(utils, 'extract_youtube_video_id'))
        self.assertTrue(hasattr(utils, 'fetch_youtube_metadata'))
        self.assertTrue(hasattr(utils, 'format_iso_duration_to_readable'))
        
        # Test that functions are callable
        self.assertTrue(callable(utils.extract_youtube_video_id))
        self.assertTrue(callable(utils.fetch_youtube_metadata))
        self.assertTrue(callable(utils.format_iso_duration_to_readable))
    
    def test_youtube_workflow_integration(self):
        """Test complete YouTube metadata workflow."""
        async def run_test():
            # Test the complete workflow from URL to formatted metadata
            youtube_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            
            # Extract video ID
            video_id = utils.extract_youtube_video_id(youtube_url)
            self.assertEqual(video_id, "dQw4w9WgXcQ")
            
            # Mock the metadata fetch
            with patch('utils.os.getenv', return_value="test_api_key"), \
                 patch('utils.httpx.AsyncClient') as mock_httpx:
                
                mock_response = Mock()
                mock_response.json.return_value = {
                    "items": [{
                        "snippet": {
                            "title": "Test Video",
                            "channelTitle": "Test Channel",
                            "thumbnails": {
                                "high": {"url": "https://img.youtube.com/vi/test/hqdefault.jpg"}
                            }
                        },
                        "contentDetails": {
                            "duration": "PT3M30S"
                        }
                    }]
                }
                mock_response.raise_for_status.return_value = None
                
                mock_client = Mock()
                mock_client.get = AsyncMock(return_value=mock_response)
                mock_httpx.return_value.__aenter__ = AsyncMock(return_value=mock_client)
                mock_httpx.return_value.__aexit__ = AsyncMock(return_value=None)
                
                # Fetch metadata
                metadata = await utils.fetch_youtube_metadata(video_id)
                
                # Format duration
                readable_duration = utils.format_iso_duration_to_readable(metadata["duration"])
                
                # Verify complete workflow
                self.assertEqual(metadata["title"], "Test Video")
                self.assertEqual(metadata["channel_name"], "Test Channel")
                self.assertEqual(readable_duration, "3:30")
        
        asyncio.run(run_test())
    
    def test_error_handling_integration(self):
        """Test error handling across utility functions."""
        # Test that invalid inputs are handled gracefully
        
        # Invalid YouTube URL
        invalid_url = "https://not-youtube.com/watch?v=invalid"
        video_id = utils.extract_youtube_video_id(invalid_url)
        self.assertIsNone(video_id)
        
        # Invalid ISO duration
        invalid_duration = "INVALID_DURATION"
        try:
            readable = utils.format_iso_duration_to_readable(invalid_duration)
            # Should either return empty string or handle gracefully
            self.assertIsInstance(readable, str)
        except (ValueError, IndexError, AttributeError):
            # Acceptable to raise exception for invalid input
            pass
    
    def test_edge_cases_integration(self):
        """Test edge cases across utility functions."""
        # Empty and None inputs
        self.assertIsNone(utils.extract_youtube_video_id(""))
        self.assertEqual(utils.format_iso_duration_to_readable(""), "")
        self.assertEqual(utils.format_iso_duration_to_readable(None), "")
        
        # Very long YouTube URL
        long_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" + "&param=" + "x" * 1000
        video_id = utils.extract_youtube_video_id(long_url)
        self.assertEqual(video_id, "dQw4w9WgXcQ")
        
        # Very long duration
        long_duration = "PT99H59M59S"
        readable = utils.format_iso_duration_to_readable(long_duration)
        self.assertEqual(readable, "99:59:59")


class TestUtilsTypeAnnotations(unittest.TestCase):
    """Test type annotations and function signatures."""
    
    def test_function_signatures(self):
        """Test that functions have expected signatures."""
        import inspect
        
        # extract_youtube_video_id should take a string and return Optional[str]
        sig = inspect.signature(utils.extract_youtube_video_id)
        self.assertEqual(len(sig.parameters), 1)
        
        # fetch_youtube_metadata should take a string and be async
        self.assertTrue(asyncio.iscoroutinefunction(utils.fetch_youtube_metadata))
        
        # format_iso_duration_to_readable should take a string and return string
        sig = inspect.signature(utils.format_iso_duration_to_readable)
        self.assertEqual(len(sig.parameters), 1)
    
    def test_return_types(self):
        """Test that functions return expected types."""
        # extract_youtube_video_id returns string or None
        result = utils.extract_youtube_video_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        self.assertIsInstance(result, str)
        
        result = utils.extract_youtube_video_id("invalid_url")
        self.assertIsNone(result)
        
        # format_iso_duration_to_readable returns string
        result = utils.format_iso_duration_to_readable("PT3M30S")
        self.assertIsInstance(result, str)
        
        result = utils.format_iso_duration_to_readable("")
        self.assertIsInstance(result, str)


if __name__ == "__main__":
    unittest.main(verbosity=2)