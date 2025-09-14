"""
Unit tests for security module in security.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import unittest
from unittest.mock import patch, Mock, AsyncMock
import asyncio
from fastapi import HTTPException, Request
from fastapi.security import APIKeyHeader

from security import (
    verify_api_key,
    verify_gcp_task_request,
    API_KEY_HEADER,
    INTERNAL_API_KEY,
    WORKER_SERVICE_URL,
    GCP_SERVICE_ACCOUNT_EMAIL
)


class TestAPIKeyVerification(unittest.TestCase):
    """Test API key verification functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.valid_api_key = "test_valid_key"
        self.invalid_api_key = "test_invalid_key"
    
    @patch('security.INTERNAL_API_KEY', 'test_valid_key')
    def test_verify_api_key_valid(self):
        """Test API key verification with valid key."""
        async def run_test():
            # Should not raise an exception
            result = await verify_api_key(self.valid_api_key)
            # Function returns None on success
            self.assertIsNone(result)
        
        asyncio.run(run_test())
    
    @patch('security.INTERNAL_API_KEY', 'test_valid_key')
    def test_verify_api_key_invalid(self):
        """Test API key verification with invalid key."""
        async def run_test():
            with self.assertRaises(HTTPException) as context:
                await verify_api_key(self.invalid_api_key)
            
            exception = context.exception
            self.assertEqual(exception.status_code, 403)
            self.assertIn("Invalid or missing API key", exception.detail)
        
        asyncio.run(run_test())
    
    @patch('security.INTERNAL_API_KEY', 'test_valid_key')
    def test_verify_api_key_none(self):
        """Test API key verification with None key."""
        async def run_test():
            with self.assertRaises(HTTPException) as context:
                await verify_api_key(None)
            
            exception = context.exception
            self.assertEqual(exception.status_code, 403)
            self.assertIn("Invalid or missing API key", exception.detail)
        
        asyncio.run(run_test())
    
    @patch('security.INTERNAL_API_KEY', 'test_valid_key')
    def test_verify_api_key_empty_string(self):
        """Test API key verification with empty string."""
        async def run_test():
            with self.assertRaises(HTTPException) as context:
                await verify_api_key("")
            
            exception = context.exception
            self.assertEqual(exception.status_code, 403)
            self.assertIn("Invalid or missing API key", exception.detail)
        
        asyncio.run(run_test())
    
    def test_api_key_header_configuration(self):
        """Test API key header configuration."""
        self.assertIsInstance(API_KEY_HEADER, APIKeyHeader)
        # The header name should be configured correctly
        self.assertEqual(API_KEY_HEADER.model.alias, "X-Internal-API-Key")


class TestGCPTaskVerification(unittest.TestCase):
    """Test GCP task request verification functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_request = Mock(spec=Request)
        self.valid_token = "valid.jwt.token"
        self.invalid_token = "invalid.jwt.token"
        self.test_service_account = "test@serviceaccount.com"
        self.test_audience = "https://test-worker.com"
    
    def test_verify_gcp_task_missing_auth_header(self):
        """Test GCP task verification with missing Authorization header."""
        async def run_test():
            self.mock_request.headers = {}
            
            with self.assertRaises(HTTPException) as context:
                await verify_gcp_task_request(self.mock_request)
            
            exception = context.exception
            self.assertEqual(exception.status_code, 403)
            self.assertIn("Missing Authorization header", exception.detail)
        
        asyncio.run(run_test())
    
    def test_verify_gcp_task_invalid_auth_header_format(self):
        """Test GCP task verification with invalid Authorization header format."""
        async def run_test():
            # Missing "Bearer " prefix
            self.mock_request.headers = {"Authorization": "InvalidFormat token"}
            
            with self.assertRaises(HTTPException) as context:
                await verify_gcp_task_request(self.mock_request)
            
            exception = context.exception
            self.assertEqual(exception.status_code, 403)
            self.assertIn("Missing Authorization header", exception.detail)
        
        asyncio.run(run_test())
    
    @patch('security.id_token.verify_oauth2_token')
    @patch('security.WORKER_SERVICE_URL', 'https://test-worker.com')
    @patch('security.GCP_SERVICE_ACCOUNT_EMAIL', 'test@serviceaccount.com')
    def test_verify_gcp_task_valid_token(self, mock_verify_token):
        """Test GCP task verification with valid token."""
        async def run_test():
            # Mock successful token verification
            mock_verify_token.return_value = {
                "iss": "https://accounts.google.com",
                "email": "test@serviceaccount.com"
            }
            
            self.mock_request.headers = {"Authorization": f"Bearer {self.valid_token}"}
            
            # Should not raise an exception
            result = await verify_gcp_task_request(self.mock_request)
            self.assertIsNone(result)
            
            # Verify token was called with correct parameters
            mock_verify_token.assert_called_once()
            call_args = mock_verify_token.call_args
            self.assertEqual(call_args[0][0], self.valid_token)  # token
            self.assertEqual(call_args[1]["audience"], "https://test-worker.com")  # audience
        
        asyncio.run(run_test())
    
    @patch('security.id_token.verify_oauth2_token')
    @patch('security.WORKER_SERVICE_URL', 'https://test-worker.com')
    def test_verify_gcp_task_invalid_issuer(self, mock_verify_token):
        """Test GCP task verification with invalid issuer."""
        async def run_test():
            # Mock token with invalid issuer
            mock_verify_token.return_value = {
                "iss": "https://malicious.com",
                "email": "test@serviceaccount.com"
            }
            
            self.mock_request.headers = {"Authorization": f"Bearer {self.valid_token}"}
            
            with self.assertRaises(HTTPException) as context:
                await verify_gcp_task_request(self.mock_request)
            
            exception = context.exception
            self.assertEqual(exception.status_code, 403)
            self.assertIn("Invalid token issuer", exception.detail)
        
        asyncio.run(run_test())
    
    @patch('security.id_token.verify_oauth2_token')
    @patch('security.WORKER_SERVICE_URL', 'https://test-worker.com')
    @patch('security.GCP_SERVICE_ACCOUNT_EMAIL', 'expected@serviceaccount.com')
    def test_verify_gcp_task_invalid_service_account(self, mock_verify_token):
        """Test GCP task verification with invalid service account."""
        async def run_test():
            # Mock token with wrong service account
            mock_verify_token.return_value = {
                "iss": "https://accounts.google.com",
                "email": "wrong@serviceaccount.com"
            }
            
            self.mock_request.headers = {"Authorization": f"Bearer {self.valid_token}"}
            
            with self.assertRaises(HTTPException) as context:
                await verify_gcp_task_request(self.mock_request)
            
            exception = context.exception
            self.assertEqual(exception.status_code, 403)
            self.assertIn("Invalid token service account email", exception.detail)
        
        asyncio.run(run_test())
    
    @patch('security.id_token.verify_oauth2_token')
    @patch('security.WORKER_SERVICE_URL', 'https://test-worker.com')
    def test_verify_gcp_task_token_verification_exception(self, mock_verify_token):
        """Test GCP task verification when token verification raises exception."""
        async def run_test():
            # Mock token verification failure
            mock_verify_token.side_effect = Exception("Token verification failed")
            
            self.mock_request.headers = {"Authorization": f"Bearer {self.invalid_token}"}
            
            with self.assertRaises(HTTPException) as context:
                await verify_gcp_task_request(self.mock_request)
            
            exception = context.exception
            self.assertEqual(exception.status_code, 403)
            self.assertIn("Invalid OIDC token", exception.detail)
        
        asyncio.run(run_test())
    
    @patch('security.id_token.verify_oauth2_token')
    @patch('security.WORKER_SERVICE_URL', 'https://test-worker.com')
    @patch('security.GCP_SERVICE_ACCOUNT_EMAIL', 'test@serviceaccount.com')
    def test_verify_gcp_task_missing_email_in_token(self, mock_verify_token):
        """Test GCP task verification when email is missing from token."""
        async def run_test():
            # Mock token without email field
            mock_verify_token.return_value = {
                "iss": "https://accounts.google.com"
                # Missing "email" field
            }
            
            self.mock_request.headers = {"Authorization": f"Bearer {self.valid_token}"}
            
            with self.assertRaises(HTTPException) as context:
                await verify_gcp_task_request(self.mock_request)
            
            exception = context.exception
            self.assertEqual(exception.status_code, 403)
            self.assertIn("Invalid token service account email", exception.detail)
        
        asyncio.run(run_test())
    
    @patch('security.id_token.verify_oauth2_token')
    @patch('security.WORKER_SERVICE_URL', 'https://test-worker.com')
    @patch('security.GCP_SERVICE_ACCOUNT_EMAIL', 'test@serviceaccount.com')
    def test_verify_gcp_task_successful_flow(self, mock_verify_token):
        """Test complete successful GCP task verification flow."""
        async def run_test():
            # Mock successful token verification with all required fields
            mock_verify_token.return_value = {
                "iss": "https://accounts.google.com",
                "email": "test@serviceaccount.com",
                "aud": "https://test-worker.com",
                "exp": 1234567890,
                "iat": 1234567800
            }
            
            self.mock_request.headers = {"Authorization": f"Bearer {self.valid_token}"}
            
            # Should complete successfully without raising exceptions
            result = await verify_gcp_task_request(self.mock_request)
            self.assertIsNone(result)
            
            # Verify all the checks passed
            mock_verify_token.assert_called_once()
        
        asyncio.run(run_test())


class TestSecurityConfigurationIntegration(unittest.TestCase):
    """Test security configuration integration."""
    
    @patch('security.settings')
    def test_security_imports_from_settings(self, mock_settings):
        """Test that security module imports from settings correctly."""
        # Mock settings values
        mock_settings.INTERNAL_API_KEY = "test_internal_key"
        mock_settings.WORKER_SERVICE_URL = "https://test-worker.com"
        mock_settings.GCP_SERVICE_ACCOUNT_EMAIL = "test@serviceaccount.com"
        
        # Re-import to get the mocked values
        import importlib
        import security
        importlib.reload(security)
        
        # The constants should be loaded from settings
        self.assertEqual(security.INTERNAL_API_KEY, "test_internal_key")
        self.assertEqual(security.WORKER_SERVICE_URL, "https://test-worker.com")
        self.assertEqual(security.GCP_SERVICE_ACCOUNT_EMAIL, "test@serviceaccount.com")
    
    def test_security_constants_exist(self):
        """Test that required security constants are defined."""
        # These should be imported and accessible
        self.assertTrue(hasattr(security, 'INTERNAL_API_KEY'))
        self.assertTrue(hasattr(security, 'WORKER_SERVICE_URL'))
        self.assertTrue(hasattr(security, 'GCP_SERVICE_ACCOUNT_EMAIL'))
        self.assertTrue(hasattr(security, 'API_KEY_HEADER'))
    
    def test_security_functions_exist(self):
        """Test that required security functions are defined."""
        self.assertTrue(hasattr(security, 'verify_api_key'))
        self.assertTrue(hasattr(security, 'verify_gcp_task_request'))
        
        # Functions should be callable
        self.assertTrue(callable(security.verify_api_key))
        self.assertTrue(callable(security.verify_gcp_task_request))


class TestSecurityEdgeCases(unittest.TestCase):
    """Test edge cases in security functionality."""
    
    def test_bearer_token_with_extra_spaces(self):
        """Test handling of Bearer token with extra spaces."""
        async def run_test():
            mock_request = Mock(spec=Request)
            # Token with extra spaces
            mock_request.headers = {"Authorization": "Bearer   token_with_spaces   "}
            
            with patch('security.id_token.verify_oauth2_token') as mock_verify:
                mock_verify.side_effect = Exception("Invalid token")
                
                with self.assertRaises(HTTPException):
                    await verify_gcp_task_request(mock_request)
                
                # Should still attempt to verify the token (stripped)
                mock_verify.assert_called_once()
        
        asyncio.run(run_test())
    
    def test_multiple_bearer_tokens(self):
        """Test handling of multiple Bearer tokens in header."""
        async def run_test():
            mock_request = Mock(spec=Request)
            # Multiple Bearer tokens (malformed)
            mock_request.headers = {"Authorization": "Bearer token1 Bearer token2"}
            
            with patch('security.id_token.verify_oauth2_token') as mock_verify:
                mock_verify.side_effect = Exception("Invalid token")
                
                with self.assertRaises(HTTPException):
                    await verify_gcp_task_request(mock_request)
                
                # Should attempt verification with everything after first "Bearer "
                mock_verify.assert_called_once()
        
        asyncio.run(run_test())
    
    @patch('security.INTERNAL_API_KEY', None)
    def test_verify_api_key_with_none_configured_key(self):
        """Test API key verification when configured key is None."""
        async def run_test():
            # Even with None as configured key, should reject any provided key
            with self.assertRaises(HTTPException):
                await verify_api_key("any_key")
        
        asyncio.run(run_test())


if __name__ == "__main__":
    unittest.main(verbosity=2)