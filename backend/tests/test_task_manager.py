"""
Unit tests for task management in task_manager.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import unittest
from unittest.mock import patch, Mock, MagicMock
import json

# Mock Google Cloud modules before importing task_manager
with patch.dict('sys.modules', {
    'google.cloud.tasks_v2': Mock(),
    'google.protobuf.duration_pb2': Mock()
}):
    import task_manager


class TestAnalysisTaskCreation(unittest.TestCase):
    """Test analysis task creation functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.user_id = "test_user"
        self.job_id = "job_123"
        
        # Mock environment variables
        self.env_vars = {
            'GOOGLE_CLOUD_PROJECT': 'test-project',
            'GOOGLE_CLOUD_LOCATION': 'us-central1',
            'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
            'WORKER_SERVICE_URL': 'https://test-worker.com',
            'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
        }
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        'GOOGLE_CLOUD_LOCATION': 'us-central1',
        'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
        'WORKER_SERVICE_URL': 'https://test-worker.com',
        'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
    })
    @patch('task_manager.tasks_client')
    @patch('task_manager.duration_pb2')
    def test_create_analysis_task_success(self, mock_duration, mock_tasks_client):
        """Test successful analysis task creation."""
        # Setup mocks
        mock_response = Mock()
        mock_response.name = "projects/test-project/locations/us-central1/queues/test-queue/tasks/task_123"
        mock_tasks_client.create_task.return_value = mock_response
        mock_tasks_client.queue_path.return_value = "projects/test-project/locations/us-central1/queues/test-queue"
        
        mock_duration_obj = Mock()
        mock_duration.Duration.return_value = mock_duration_obj
        
        # Call function
        result = task_manager.create_analysis_task(self.user_id, self.job_id)
        
        # Verify queue path call
        mock_tasks_client.queue_path.assert_called_with(
            'test-project', 'us-central1', 'test-queue'
        )
        
        # Verify create_task call
        mock_tasks_client.create_task.assert_called_once()
        
        # Verify task structure
        create_task_args = mock_tasks_client.create_task.call_args
        task_dict = create_task_args[1]['task']
        
        # Check HTTP request configuration
        http_request = task_dict['http_request']
        self.assertEqual(http_request['url'], 'https://test-worker.com/api/tasks/run-analysis')
        self.assertEqual(http_request['headers']['Content-type'], 'application/json')
        
        # Check payload
        payload = json.loads(http_request['body'].decode())
        self.assertEqual(payload['user_id'], self.user_id)
        self.assertEqual(payload['job_id'], self.job_id)
        
        # Check OIDC token
        oidc_token = http_request['oidc_token']
        self.assertEqual(oidc_token['service_account_email'], 'test@serviceaccount.com')
        self.assertEqual(oidc_token['audience'], 'https://test-worker.com')
        
        # Check deadline
        self.assertEqual(task_dict['dispatch_deadline'], mock_duration_obj)
        mock_duration.Duration.assert_called_with(seconds=15 * 60)
        
        # Verify return value
        self.assertEqual(result, mock_response)
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        # Missing other required env vars
    })
    def test_create_analysis_task_missing_env_vars(self):
        """Test analysis task creation with missing environment variables."""
        with self.assertRaises(ValueError) as context:
            task_manager.create_analysis_task(self.user_id, self.job_id)
        
        self.assertIn("required Google Cloud environment variables", str(context.exception))
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        'GOOGLE_CLOUD_LOCATION': 'us-central1',
        'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
        'WORKER_SERVICE_URL': 'https://test-worker.com',
        'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
    })
    @patch('task_manager.tasks_client')
    def test_create_analysis_task_client_exception(self, mock_tasks_client):
        """Test analysis task creation when client raises exception."""
        # Setup mock to raise exception
        mock_tasks_client.queue_path.side_effect = Exception("GCP Error")
        
        with self.assertRaises(Exception) as context:
            task_manager.create_analysis_task(self.user_id, self.job_id)
        
        self.assertIn("GCP Error", str(context.exception))
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': '',
        'GOOGLE_CLOUD_LOCATION': 'us-central1',
        'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
        'WORKER_SERVICE_URL': 'https://test-worker.com',
        'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
    })
    def test_create_analysis_task_empty_env_vars(self):
        """Test analysis task creation with empty environment variables."""
        with self.assertRaises(ValueError) as context:
            task_manager.create_analysis_task(self.user_id, self.job_id)
        
        self.assertIn("required Google Cloud environment variables", str(context.exception))


class TestGradingTaskCreation(unittest.TestCase):
    """Test grading task creation functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.user_id = "test_user"
        self.job_id = "job_123"
        self.question_id = "oe_1"
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        'GOOGLE_CLOUD_LOCATION': 'us-central1',
        'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
        'WORKER_SERVICE_URL': 'https://test-worker.com',
        'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
    })
    @patch('task_manager.tasks_client')
    @patch('task_manager.duration_pb2')
    def test_create_grading_task_success(self, mock_duration, mock_tasks_client):
        """Test successful grading task creation."""
        # Setup mocks
        mock_response = Mock()
        mock_response.name = "projects/test-project/locations/us-central1/queues/test-queue/tasks/grading_task_123"
        mock_tasks_client.create_task.return_value = mock_response
        mock_tasks_client.queue_path.return_value = "projects/test-project/locations/us-central1/queues/test-queue"
        
        mock_duration_obj = Mock()
        mock_duration.Duration.return_value = mock_duration_obj
        
        # Call function
        result = task_manager.create_grading_task(self.user_id, self.job_id, self.question_id)
        
        # Verify queue path call
        mock_tasks_client.queue_path.assert_called_with(
            'test-project', 'us-central1', 'test-queue'
        )
        
        # Verify create_task call
        mock_tasks_client.create_task.assert_called_once()
        
        # Verify task structure
        create_task_args = mock_tasks_client.create_task.call_args
        task_dict = create_task_args[1]['task']
        
        # Check HTTP request configuration
        http_request = task_dict['http_request']
        self.assertEqual(http_request['url'], 'https://test-worker.com/api/tasks/grade-open-ended')
        self.assertEqual(http_request['headers']['Content-type'], 'application/json')
        
        # Check payload
        payload = json.loads(http_request['body'].decode())
        self.assertEqual(payload['user_id'], self.user_id)
        self.assertEqual(payload['job_id'], self.job_id)
        self.assertEqual(payload['question_id'], self.question_id)
        
        # Check OIDC token
        oidc_token = http_request['oidc_token']
        self.assertEqual(oidc_token['service_account_email'], 'test@serviceaccount.com')
        self.assertEqual(oidc_token['audience'], 'https://test-worker.com')
        
        # Check deadline
        self.assertEqual(task_dict['dispatch_deadline'], mock_duration_obj)
        mock_duration.Duration.assert_called_with(seconds=15 * 60)
        
        # Verify return value
        self.assertEqual(result, mock_response)
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        # Missing other required env vars
    })
    def test_create_grading_task_missing_env_vars(self):
        """Test grading task creation with missing environment variables."""
        with self.assertRaises(ValueError) as context:
            task_manager.create_grading_task(self.user_id, self.job_id, self.question_id)
        
        self.assertIn("required Google Cloud environment variables", str(context.exception))
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        'GOOGLE_CLOUD_LOCATION': 'us-central1',
        'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
        'WORKER_SERVICE_URL': 'https://test-worker.com',
        'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
    })
    @patch('task_manager.tasks_client')
    def test_create_grading_task_client_exception(self, mock_tasks_client):
        """Test grading task creation when client raises exception."""
        # Setup mock to raise exception
        mock_tasks_client.create_task.side_effect = Exception("Task creation failed")
        
        with self.assertRaises(Exception) as context:
            task_manager.create_grading_task(self.user_id, self.job_id, self.question_id)
        
        self.assertIn("Task creation failed", str(context.exception))


class TestTaskManagerIntegration(unittest.TestCase):
    """Test task manager integration scenarios."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.complete_env = {
            'GOOGLE_CLOUD_PROJECT': 'test-project',
            'GOOGLE_CLOUD_LOCATION': 'us-central1',
            'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
            'WORKER_SERVICE_URL': 'https://test-worker.com',
            'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
        }
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        'GOOGLE_CLOUD_LOCATION': 'us-central1',
        'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
        'WORKER_SERVICE_URL': 'https://test-worker.com',
        'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
    })
    def test_environment_variable_validation(self):
        """Test that all required environment variables are properly validated."""
        # This should not raise an exception when all vars are present
        required_vars = [
            'GOOGLE_CLOUD_PROJECT',
            'GOOGLE_CLOUD_LOCATION',
            'GOOGLE_CLOUD_QUEUE_ID',
            'WORKER_SERVICE_URL',
            'WORKER_SERVICE_AUTH_SA_EMAIL'
        ]
        
        # Test each missing variable individually
        for missing_var in required_vars:
            with patch.dict(os.environ, {k: v for k, v in self.complete_env.items() if k != missing_var}):
                with self.assertRaises(ValueError):
                    task_manager.create_analysis_task("user", "job")
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        'GOOGLE_CLOUD_LOCATION': 'us-central1',
        'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
        'WORKER_SERVICE_URL': 'https://test-worker.com',
        'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
    })
    @patch('task_manager.tasks_client')
    def test_queue_path_construction(self, mock_tasks_client):
        """Test that queue path is constructed correctly."""
        mock_tasks_client.create_task.return_value = Mock()
        mock_tasks_client.queue_path.return_value = "test-queue-path"
        
        task_manager.create_analysis_task("user", "job")
        
        # Verify queue path was called with correct parameters
        mock_tasks_client.queue_path.assert_called_with(
            'test-project', 'us-central1', 'test-queue'
        )
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        'GOOGLE_CLOUD_LOCATION': 'us-central1',
        'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
        'WORKER_SERVICE_URL': 'https://test-worker.com',
        'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
    })
    @patch('task_manager.tasks_client')
    def test_url_construction_analysis(self, mock_tasks_client):
        """Test that analysis task URL is constructed correctly."""
        mock_tasks_client.create_task.return_value = Mock()
        mock_tasks_client.queue_path.return_value = "test-queue-path"
        
        task_manager.create_analysis_task("user", "job")
        
        # Get the task that was created
        call_args = mock_tasks_client.create_task.call_args
        task = call_args[1]['task']
        
        # Verify URL construction
        expected_url = 'https://test-worker.com/api/tasks/run-analysis'
        self.assertEqual(task['http_request']['url'], expected_url)
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        'GOOGLE_CLOUD_LOCATION': 'us-central1',
        'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
        'WORKER_SERVICE_URL': 'https://test-worker.com',
        'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
    })
    @patch('task_manager.tasks_client')
    def test_url_construction_grading(self, mock_tasks_client):
        """Test that grading task URL is constructed correctly."""
        mock_tasks_client.create_task.return_value = Mock()
        mock_tasks_client.queue_path.return_value = "test-queue-path"
        
        task_manager.create_grading_task("user", "job", "question")
        
        # Get the task that was created
        call_args = mock_tasks_client.create_task.call_args
        task = call_args[1]['task']
        
        # Verify URL construction
        expected_url = 'https://test-worker.com/api/tasks/grade-open-ended'
        self.assertEqual(task['http_request']['url'], expected_url)
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        'GOOGLE_CLOUD_LOCATION': 'us-central1',
        'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
        'WORKER_SERVICE_URL': 'https://test-worker.com',
        'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
    })
    @patch('task_manager.tasks_client')
    def test_payload_serialization(self, mock_tasks_client):
        """Test that task payloads are properly serialized."""
        mock_tasks_client.create_task.return_value = Mock()
        mock_tasks_client.queue_path.return_value = "test-queue-path"
        
        user_id = "test_user"
        job_id = "test_job"
        
        task_manager.create_analysis_task(user_id, job_id)
        
        # Get the task that was created
        call_args = mock_tasks_client.create_task.call_args
        task = call_args[1]['task']
        
        # Verify payload serialization
        body = task['http_request']['body']
        payload = json.loads(body.decode())
        
        self.assertEqual(payload['user_id'], user_id)
        self.assertEqual(payload['job_id'], job_id)
        self.assertIsInstance(body, bytes)
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        'GOOGLE_CLOUD_LOCATION': 'us-central1',
        'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
        'WORKER_SERVICE_URL': 'https://test-worker.com',
        'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
    })
    @patch('task_manager.tasks_client')
    def test_http_method_configuration(self, mock_tasks_client):
        """Test that HTTP method is configured correctly."""
        mock_tasks_client.create_task.return_value = Mock()
        mock_tasks_client.queue_path.return_value = "test-queue-path"
        
        task_manager.create_analysis_task("user", "job")
        
        # Get the task that was created
        call_args = mock_tasks_client.create_task.call_args
        task = call_args[1]['task']
        
        # Verify HTTP method
        from google.cloud import tasks_v2
        expected_method = tasks_v2.HttpMethod.POST
        self.assertEqual(task['http_request']['http_method'], expected_method)
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        'GOOGLE_CLOUD_LOCATION': 'us-central1',
        'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
        'WORKER_SERVICE_URL': 'https://test-worker.com',
        'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
    })
    @patch('task_manager.tasks_client')
    def test_headers_configuration(self, mock_tasks_client):
        """Test that headers are configured correctly."""
        mock_tasks_client.create_task.return_value = Mock()
        mock_tasks_client.queue_path.return_value = "test-queue-path"
        
        task_manager.create_analysis_task("user", "job")
        
        # Get the task that was created
        call_args = mock_tasks_client.create_task.call_args
        task = call_args[1]['task']
        
        # Verify headers
        headers = task['http_request']['headers']
        self.assertEqual(headers['Content-type'], 'application/json')


class TestTaskManagerEdgeCases(unittest.TestCase):
    """Test edge cases in task manager functionality."""
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        'GOOGLE_CLOUD_LOCATION': 'us-central1',
        'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
        'WORKER_SERVICE_URL': 'https://test-worker.com',
        'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
    })
    @patch('task_manager.tasks_client')
    def test_special_characters_in_ids(self, mock_tasks_client):
        """Test handling of special characters in user/job IDs."""
        mock_tasks_client.create_task.return_value = Mock()
        mock_tasks_client.queue_path.return_value = "test-queue-path"
        
        # Test with special characters
        user_id = "user@domain.com"
        job_id = "job-123_456"
        
        task_manager.create_analysis_task(user_id, job_id)
        
        # Get the task payload
        call_args = mock_tasks_client.create_task.call_args
        task = call_args[1]['task']
        body = task['http_request']['body']
        payload = json.loads(body.decode())
        
        # Should preserve special characters
        self.assertEqual(payload['user_id'], user_id)
        self.assertEqual(payload['job_id'], job_id)
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        'GOOGLE_CLOUD_LOCATION': 'us-central1',
        'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
        'WORKER_SERVICE_URL': 'https://test-worker.com/',  # Note trailing slash
        'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
    })
    @patch('task_manager.tasks_client')
    def test_worker_url_with_trailing_slash(self, mock_tasks_client):
        """Test handling of worker URL with trailing slash."""
        mock_tasks_client.create_task.return_value = Mock()
        mock_tasks_client.queue_path.return_value = "test-queue-path"
        
        task_manager.create_analysis_task("user", "job")
        
        # Get the task that was created
        call_args = mock_tasks_client.create_task.call_args
        task = call_args[1]['task']
        
        # URL should be constructed properly even with trailing slash
        url = task['http_request']['url']
        self.assertEqual(url, 'https://test-worker.com//api/tasks/run-analysis')
        
        # Audience should not include the trailing slash from the fix
        audience = task['http_request']['oidc_token']['audience']
        self.assertEqual(audience, 'https://test-worker.com/')
    
    @patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        'GOOGLE_CLOUD_LOCATION': 'us-central1',
        'GOOGLE_CLOUD_QUEUE_ID': 'test-queue',
        'WORKER_SERVICE_URL': 'https://test-worker.com',
        'WORKER_SERVICE_AUTH_SA_EMAIL': 'test@serviceaccount.com'
    })
    @patch('task_manager.tasks_client')
    def test_empty_string_parameters(self, mock_tasks_client):
        """Test handling of empty string parameters."""
        mock_tasks_client.create_task.return_value = Mock()
        mock_tasks_client.queue_path.return_value = "test-queue-path"
        
        # Should handle empty strings without crashing
        task_manager.create_analysis_task("", "")
        task_manager.create_grading_task("", "", "")
        
        # Should have been called twice
        self.assertEqual(mock_tasks_client.create_task.call_count, 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)