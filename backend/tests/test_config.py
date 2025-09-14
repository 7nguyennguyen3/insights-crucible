"""
Unit tests for configuration management in config.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path

from config import Settings, AppConfig, settings, app_config


class TestSettings(unittest.TestCase):
    """Test Settings configuration class."""
    
    def setUp(self):
        """Set up test environment."""
        self.test_env_vars = {
            'INTERNAL_API_KEY': 'test_internal_key',
            'ASSEMBLYAI_API_KEY': 'test_assembly_key',
            'WORKER_SERVICE_URL': 'https://test-worker.com',
            'GCP_SERVICE_ACCOUNT_EMAIL': 'test@serviceaccount.com',
            'GOOGLE_CLOUD_LOCATION': 'us-central1',
            'GCP_STORAGE_BUCKET_NAME': 'test-bucket',
            'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
            'TAVILY_API_KEY': 'test_tavily_key'
        }
    
    def test_settings_default_values(self):
        """Test default values for settings."""
        test_settings = Settings()
        self.assertIsNone(test_settings.INTERNAL_API_KEY)
        self.assertIsNone(test_settings.ASSEMBLYAI_API_KEY)
        self.assertIsNone(test_settings.WORKER_SERVICE_URL)
        self.assertIsNone(test_settings.GCP_SERVICE_ACCOUNT_EMAIL)
        self.assertIsNone(test_settings.GOOGLE_CLOUD_LOCATION)
        self.assertIsNone(test_settings.GCP_STORAGE_BUCKET_NAME)
        self.assertIsNone(test_settings.GOOGLE_CLOUD_QUEUE_ID)
        self.assertIsNone(test_settings.TAVILY_API_KEY)
    
    @patch.dict(os.environ, {
        'INTERNAL_API_KEY': 'test_internal_key',
        'ASSEMBLYAI_API_KEY': 'test_assembly_key',
        'WORKER_SERVICE_URL': 'https://test-worker.com',
        'GCP_SERVICE_ACCOUNT_EMAIL': 'test@serviceaccount.com',
        'GOOGLE_CLOUD_LOCATION': 'us-central1',
        'GCP_STORAGE_BUCKET_NAME': 'test-bucket',
        'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
        'TAVILY_API_KEY': 'test_tavily_key'
    })
    def test_settings_from_environment(self):
        """Test settings loading from environment variables."""
        test_settings = Settings()
        self.assertEqual(test_settings.INTERNAL_API_KEY, 'test_internal_key')
        self.assertEqual(test_settings.ASSEMBLYAI_API_KEY, 'test_assembly_key')
        self.assertEqual(test_settings.WORKER_SERVICE_URL, 'https://test-worker.com')
        self.assertEqual(test_settings.GCP_SERVICE_ACCOUNT_EMAIL, 'test@serviceaccount.com')
        self.assertEqual(test_settings.GOOGLE_CLOUD_LOCATION, 'us-central1')
        self.assertEqual(test_settings.GCP_STORAGE_BUCKET_NAME, 'test-bucket')
        self.assertEqual(test_settings.GOOGLE_CLOUD_QUEUE_ID, 'test-queue')
        self.assertEqual(test_settings.TAVILY_API_KEY, 'test_tavily_key')
    
    def test_settings_env_file_path(self):
        """Test that env file path is correctly set."""
        test_settings = Settings()
        # Check that the config references the correct .env file location
        self.assertTrue(hasattr(test_settings.__class__.Config, 'env_file'))
        # The env_file should be a Path object pointing to backend/.env
        env_file = test_settings.__class__.Config.env_file
        self.assertIsInstance(env_file, Path)
        self.assertTrue(str(env_file).endswith('.env'))
    
    def test_settings_extra_ignore(self):
        """Test that extra fields are ignored."""
        # This tests the pydantic configuration
        self.assertEqual(Settings.Config.extra, "ignore")
    
    def test_settings_encoding(self):
        """Test env file encoding configuration."""
        self.assertEqual(Settings.Config.env_file_encoding, "utf-8")


class TestAppConfig(unittest.TestCase):
    """Test AppConfig class."""
    
    def test_llm_models_configuration(self):
        """Test LLM models dictionary."""
        expected_models = {
            "best": "gemini-2.5-flash",
            "best-lite": "gemini-2.5-flash-lite-preview-06-17",
            "main": "gemini-2.0-flash-001",
            "main-lite": "gemini-2.0-flash-lite",
            "default": "gemini-1.5-flash",
        }
        
        config = AppConfig()
        self.assertEqual(config.LLM_MODELS, expected_models)
        
        # Test individual model access
        self.assertEqual(config.LLM_MODELS["best"], "gemini-2.5-flash")
        self.assertEqual(config.LLM_MODELS["best-lite"], "gemini-2.5-flash-lite-preview-06-17")
        self.assertEqual(config.LLM_MODELS["main"], "gemini-2.0-flash-001")
        self.assertEqual(config.LLM_MODELS["main-lite"], "gemini-2.0-flash-lite")
        self.assertEqual(config.LLM_MODELS["default"], "gemini-1.5-flash")
    
    def test_sectioning_parameters(self):
        """Test sectioning parameters."""
        config = AppConfig()
        
        # Test sectioning params
        expected_sectioning = {"lines_per_chunk": 60, "overlap_lines": 10}
        self.assertEqual(config.SECTIONING_PARAMS, expected_sectioning)
        self.assertEqual(config.SECTIONING_PARAMS["lines_per_chunk"], 60)
        self.assertEqual(config.SECTIONING_PARAMS["overlap_lines"], 10)
        
        # Test semantic boundary params
        expected_boundary = {"max_words": 12, "min_capitalization_ratio": 0.7}
        self.assertEqual(config.SEMANTIC_BOUNDARY_PARAMS, expected_boundary)
        self.assertEqual(config.SEMANTIC_BOUNDARY_PARAMS["max_words"], 12)
        self.assertEqual(config.SEMANTIC_BOUNDARY_PARAMS["min_capitalization_ratio"], 0.7)
    
    def test_model_name_validation(self):
        """Test that all model names are strings."""
        config = AppConfig()
        for model_key, model_name in config.LLM_MODELS.items():
            self.assertIsInstance(model_key, str)
            self.assertIsInstance(model_name, str)
            self.assertTrue(len(model_name) > 0)
    
    def test_parameter_types(self):
        """Test that parameters have correct types."""
        config = AppConfig()
        
        # Sectioning params should be integers
        self.assertIsInstance(config.SECTIONING_PARAMS["lines_per_chunk"], int)
        self.assertIsInstance(config.SECTIONING_PARAMS["overlap_lines"], int)
        
        # Boundary params should have correct types
        self.assertIsInstance(config.SEMANTIC_BOUNDARY_PARAMS["max_words"], int)
        self.assertIsInstance(config.SEMANTIC_BOUNDARY_PARAMS["min_capitalization_ratio"], float)
    
    def test_parameter_ranges(self):
        """Test that parameters are within reasonable ranges."""
        config = AppConfig()
        
        # Lines per chunk should be positive and reasonable
        self.assertGreater(config.SECTIONING_PARAMS["lines_per_chunk"], 0)
        self.assertLess(config.SECTIONING_PARAMS["lines_per_chunk"], 1000)
        
        # Overlap lines should be positive but less than lines per chunk
        self.assertGreater(config.SECTIONING_PARAMS["overlap_lines"], 0)
        self.assertLess(config.SECTIONING_PARAMS["overlap_lines"], 
                       config.SECTIONING_PARAMS["lines_per_chunk"])
        
        # Max words should be positive
        self.assertGreater(config.SEMANTIC_BOUNDARY_PARAMS["max_words"], 0)
        
        # Capitalization ratio should be between 0 and 1
        self.assertGreaterEqual(config.SEMANTIC_BOUNDARY_PARAMS["min_capitalization_ratio"], 0)
        self.assertLessEqual(config.SEMANTIC_BOUNDARY_PARAMS["min_capitalization_ratio"], 1)


class TestGlobalSettings(unittest.TestCase):
    """Test global settings and app_config instances."""
    
    def test_global_settings_instance(self):
        """Test that global settings instance exists."""
        from config import settings
        self.assertIsInstance(settings, Settings)
    
    def test_global_app_config_instance(self):
        """Test that global app_config instance exists."""
        from config import app_config
        self.assertIsInstance(app_config, AppConfig)
    
    def test_app_root_dir_constant(self):
        """Test APP_ROOT_DIR constant."""
        from config import APP_ROOT_DIR
        self.assertIsInstance(APP_ROOT_DIR, Path)
        # Should point to the backend directory
        self.assertTrue(str(APP_ROOT_DIR).endswith('backend'))
    
    def test_settings_consistency(self):
        """Test that imported settings are consistent."""
        # Import settings multiple ways to ensure consistency
        from config import settings as settings1
        from config import Settings
        settings2 = Settings()
        
        # Both should be Settings instances
        self.assertIsInstance(settings1, Settings)
        self.assertIsInstance(settings2, Settings)
    
    def test_app_config_consistency(self):
        """Test that imported app_config is consistent."""
        from config import app_config as config1
        from config import AppConfig
        config2 = AppConfig()
        
        # Both should be AppConfig instances
        self.assertIsInstance(config1, AppConfig)
        self.assertIsInstance(config2, AppConfig)
        
        # Should have same LLM models
        self.assertEqual(config1.LLM_MODELS, config2.LLM_MODELS)


class TestConfigIntegration(unittest.TestCase):
    """Test configuration integration scenarios."""
    
    @patch.dict(os.environ, {
        'INTERNAL_API_KEY': 'prod_key',
        'ASSEMBLYAI_API_KEY': 'assembly_prod_key'
    })
    def test_production_like_configuration(self):
        """Test configuration in production-like environment."""
        test_settings = Settings()
        self.assertEqual(test_settings.INTERNAL_API_KEY, 'prod_key')
        self.assertEqual(test_settings.ASSEMBLYAI_API_KEY, 'assembly_prod_key')
        # Other keys should remain None since not set
        self.assertIsNone(test_settings.WORKER_SERVICE_URL)
    
    def test_missing_environment_variables(self):
        """Test behavior when environment variables are missing."""
        # Create new Settings instance without any env vars
        test_settings = Settings()
        
        # All should be None (default values)
        self.assertIsNone(test_settings.INTERNAL_API_KEY)
        self.assertIsNone(test_settings.ASSEMBLYAI_API_KEY)
        self.assertIsNone(test_settings.WORKER_SERVICE_URL)
        self.assertIsNone(test_settings.GCP_SERVICE_ACCOUNT_EMAIL)
        self.assertIsNone(test_settings.GOOGLE_CLOUD_LOCATION)
        self.assertIsNone(test_settings.GCP_STORAGE_BUCKET_NAME)
        self.assertIsNone(test_settings.GOOGLE_CLOUD_QUEUE_ID)
        self.assertIsNone(test_settings.TAVILY_API_KEY)
    
    def test_model_selection_patterns(self):
        """Test common model selection patterns."""
        config = AppConfig()
        
        # Test that we can access models by common patterns
        models = config.LLM_MODELS
        
        # Should have a "best" model for high-quality tasks
        self.assertIn("best", models)
        self.assertIn("gemini", models["best"])
        
        # Should have a "default" model for general use
        self.assertIn("default", models)
        
        # Should have lite variants for faster processing
        self.assertIn("best-lite", models)
        self.assertIn("main-lite", models)
        
        # Model names should follow expected patterns
        for model_name in models.values():
            self.assertTrue(model_name.startswith("gemini"))


if __name__ == "__main__":
    unittest.main(verbosity=2)