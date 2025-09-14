"""
Unit tests for database management in db_manager.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import unittest
from unittest.mock import patch, Mock, MagicMock, call
import datetime
from typing import Dict, List, Any, Optional

# Mock firebase_admin and related modules before importing db_manager
with patch.dict('sys.modules', {
    'firebase_admin': Mock(),
    'firebase_admin.credentials': Mock(),
    'firebase_admin.firestore': Mock(),
    'google.cloud.storage': Mock(),
    'google.api_core.exceptions': Mock()
}):
    import db_manager


class TestDatabaseInitialization(unittest.TestCase):
    """Test database initialization functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Reset the global db variable
        db_manager.db = None
    
    @patch('db_manager.firebase_admin')
    @patch('db_manager.credentials')
    @patch('db_manager.firestore')
    @patch('db_manager.settings')
    def test_initialize_db_first_time(self, mock_settings, mock_firestore, mock_credentials, mock_firebase_admin):
        """Test initializing database for the first time."""
        # Setup mocks
        mock_firebase_admin._apps = []  # No existing apps
        mock_settings.GCP_STORAGE_BUCKET_NAME = "test-bucket"
        mock_credentials.ApplicationDefault.return_value = Mock()
        mock_firestore.client.return_value = Mock()
        
        # Call initialization
        db_manager.initialize_db()
        
        # Verify initialization steps
        mock_credentials.ApplicationDefault.assert_called_once()
        mock_firebase_admin.initialize_app.assert_called_once()
        mock_firestore.client.assert_called_once()
        self.assertIsNotNone(db_manager.db)
    
    @patch('db_manager.firebase_admin')
    @patch('db_manager.firestore')
    def test_initialize_db_already_initialized(self, mock_firestore, mock_firebase_admin):
        """Test initializing database when already initialized."""
        # Setup mocks - app already exists
        mock_firebase_admin._apps = [Mock()]  # Existing app
        mock_firestore.client.return_value = Mock()
        db_manager.db = None  # But db client is None
        
        # Call initialization
        db_manager.initialize_db()
        
        # Should not call initialize_app again, but should create client
        mock_firebase_admin.initialize_app.assert_not_called()
        mock_firestore.client.assert_called_once()
        self.assertIsNotNone(db_manager.db)
    
    @patch('db_manager.firebase_admin')
    @patch('db_manager.firestore')
    def test_initialize_db_already_initialized_with_client(self, mock_firestore, mock_firebase_admin):
        """Test initializing database when already fully initialized."""
        # Setup mocks - app and client already exist
        mock_firebase_admin._apps = [Mock()]  # Existing app
        db_manager.db = Mock()  # Existing client
        
        # Call initialization
        db_manager.initialize_db()
        
        # Should not call anything
        mock_firebase_admin.initialize_app.assert_not_called()
        mock_firestore.client.assert_not_called()
    
    @patch('db_manager.firebase_admin')
    @patch('db_manager.credentials')
    def test_initialize_db_exception(self, mock_credentials, mock_firebase_admin):
        """Test initialization with exception."""
        # Setup mocks to raise exception
        mock_firebase_admin._apps = []
        mock_credentials.ApplicationDefault.side_effect = Exception("Auth failed")
        
        # Call initialization
        db_manager.initialize_db()
        
        # Should handle exception gracefully
        self.assertIsNone(db_manager.db)


class TestJobManagement(unittest.TestCase):
    """Test job management functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_db = Mock()
        db_manager.db = self.mock_db
        
        # Mock collection and document references
        self.mock_collection = Mock()
        self.mock_document = Mock()
        self.mock_db.collection.return_value = self.mock_collection
        self.mock_collection.document.return_value = self.mock_document
    
    def test_create_job_success(self):
        """Test successful job creation."""
        # Setup
        user_id = "test_user"
        request_data = {"transcript": "test transcript"}
        self.mock_document.id = "job_123"
        
        # Call function
        job_id = db_manager.create_job(user_id, request_data)
        
        # Verify calls
        self.mock_db.collection.assert_called_with(f"saas_users/{user_id}/jobs")
        self.mock_collection.document.assert_called_once()
        self.mock_document.set.assert_called_once()
        
        # Check set call arguments
        set_call_args = self.mock_document.set.call_args[0][0]
        self.assertEqual(set_call_args["status"], "QUEUED")
        self.assertEqual(set_call_args["request_data"], request_data)
        self.assertIn("Analysis from", set_call_args["job_title"])
        self.assertIsNone(set_call_args["folderId"])
        
        # Check return value
        self.assertEqual(job_id, "job_123")
    
    def test_create_job_no_db(self):
        """Test job creation when database is not initialized."""
        db_manager.db = None
        
        with self.assertRaises(ConnectionError) as context:
            db_manager.create_job("user", {})
        
        self.assertIn("Database client not initialized", str(context.exception))
    
    def test_update_job_title(self):
        """Test job title update."""
        user_id = "test_user"
        job_id = "job_123"
        new_title = "Updated Analysis Title"
        
        # Call function
        db_manager.update_job_title(user_id, job_id, new_title)
        
        # Verify calls
        self.mock_db.collection.assert_called_with(f"saas_users/{user_id}/jobs")
        self.mock_collection.document.assert_called_with(job_id)
        self.mock_document.update.assert_called_with({"job_title": new_title})
    
    def test_update_job_with_metadata(self):
        """Test job update with metadata."""
        user_id = "test_user"
        job_id = "job_123"
        new_title = "Test Analysis"
        metadata = {
            "youtube_title": "Test Video",
            "youtube_channel_name": "Test Channel",
            "youtube_thumbnail_url": "https://img.youtube.com/vi/123/default.jpg",
            "youtube_duration": "10:30",
        }
        
        # Call function
        db_manager.update_job_with_metadata(user_id, job_id, new_title, metadata)
        
        # Verify update call
        expected_update = {
            "job_title": new_title,
        }
        self.mock_document.update.assert_called_with(expected_update)
    
    def test_delete_job(self):
        """Test job deletion."""
        user_id = "test_user"
        job_id = "job_123"
        
        # Call function
        db_manager.delete_job(user_id, job_id)
        
        # Verify calls
        self.mock_db.collection.assert_called_with(f"saas_users/{user_id}/jobs")
        self.mock_collection.document.assert_called_with(job_id)
        self.mock_document.delete.assert_called_once()
    
    def test_update_job_status_basic(self):
        """Test basic job status update."""
        user_id = "test_user"
        job_id = "job_123"
        status = "PROCESSING"
        progress = "Step 2/7: Processing..."
        
        # Call function
        db_manager.update_job_status(user_id, job_id, status, progress)
        
        # Verify update call
        update_call_args = self.mock_document.update.call_args[0][0]
        self.assertEqual(update_call_args["status"], status)
        self.assertEqual(update_call_args["progress"], progress)
        self.assertIn("updatedAt", update_call_args)
    
    def test_update_job_status_with_transcript(self):
        """Test job status update with transcript."""
        user_id = "test_user"
        job_id = "job_123"
        status = "PROCESSING"
        transcript = "This is the transcript"
        structured_transcript = [{"speaker": "A", "text": "Hello"}]
        
        # Call function
        db_manager.update_job_status(
            user_id, job_id, status, 
            transcript=transcript,
            structured_transcript=structured_transcript
        )
        
        # Verify update call
        update_call_args = self.mock_document.update.call_args[0][0]
        self.assertEqual(update_call_args["status"], status)
        self.assertEqual(update_call_args["transcript"], transcript)
        self.assertEqual(update_call_args["structured_transcript"], structured_transcript)
    
    def test_get_job_status_exists(self):
        """Test getting job status when job exists."""
        user_id = "test_user"
        job_id = "job_123"
        
        # Setup mock document
        mock_doc = Mock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"status": "COMPLETED", "job_title": "Test"}
        self.mock_document.get.return_value = mock_doc
        
        # Call function
        result = db_manager.get_job_status(user_id, job_id)
        
        # Verify result
        self.assertEqual(result, {"status": "COMPLETED", "job_title": "Test"})
        self.mock_document.get.assert_called_once()
    
    def test_get_job_status_not_exists(self):
        """Test getting job status when job doesn't exist."""
        user_id = "test_user"
        job_id = "job_123"
        
        # Setup mock document
        mock_doc = Mock()
        mock_doc.exists = False
        self.mock_document.get.return_value = mock_doc
        
        # Call function
        result = db_manager.get_job_status(user_id, job_id)
        
        # Verify result
        self.assertIsNone(result)


class TestSectionResults(unittest.TestCase):
    """Test section results management."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_db = Mock()
        db_manager.db = self.mock_db
        
        # Mock collection and document references
        self.mock_collection = Mock()
        self.mock_document = Mock()
        self.mock_subcollection = Mock()
        self.mock_subdocument = Mock()
        
        self.mock_db.collection.return_value = self.mock_collection
        self.mock_collection.document.return_value = self.mock_document
        self.mock_document.collection.return_value = self.mock_subcollection
        self.mock_subcollection.document.return_value = self.mock_subdocument
    
    def test_save_section_result(self):
        """Test saving section result."""
        user_id = "test_user"
        job_id = "job_123"
        section_index = 5
        section_data = {
            "title": "Section Title",
            "summary": "Section summary",
            "start_time": "05:00",
            "end_time": "10:00"
        }
        
        # Call function
        db_manager.save_section_result(user_id, job_id, section_index, section_data)
        
        # Verify calls
        self.mock_db.collection.assert_called_with(f"saas_users/{user_id}/jobs")
        self.mock_collection.document.assert_called_with(job_id)
        self.mock_document.collection.assert_called_with("results")
        self.mock_subcollection.document.assert_called_with("section_005")
        self.mock_subdocument.set.assert_called_with(section_data)
    
    def test_get_job_results_from_subcollection(self):
        """Test getting job results from subcollection."""
        user_id = "test_user"
        job_id = "job_123"
        
        # Setup mock results
        mock_docs = [Mock(), Mock()]
        mock_docs[0].to_dict.return_value = {"section": 1, "title": "Section 1"}
        mock_docs[1].to_dict.return_value = {"section": 2, "title": "Section 2"}
        
        self.mock_subcollection.order_by.return_value.stream.return_value = mock_docs
        
        # Call function
        results = db_manager.get_job_results_from_subcollection(user_id, job_id)
        
        # Verify calls
        self.mock_subcollection.order_by.assert_called_with("start_time")
        
        # Verify results
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0], {"section": 1, "title": "Section 1"})
        self.assertEqual(results[1], {"section": 2, "title": "Section 2"})
    
    def test_get_section_result_exists(self):
        """Test getting specific section result when it exists."""
        user_id = "test_user"
        job_id = "job_123"
        section_doc_id = "section_001"
        
        # Setup mock document
        mock_doc = Mock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"title": "Section 1", "summary": "Summary"}
        self.mock_subdocument.get.return_value = mock_doc
        
        # Call function
        result = db_manager.get_section_result(user_id, job_id, section_doc_id)
        
        # Verify result
        self.assertEqual(result, {"title": "Section 1", "summary": "Summary"})
    
    def test_get_section_result_not_exists(self):
        """Test getting specific section result when it doesn't exist."""
        user_id = "test_user"
        job_id = "job_123"
        section_doc_id = "section_001"
        
        # Setup mock document
        mock_doc = Mock()
        mock_doc.exists = False
        self.mock_subdocument.get.return_value = mock_doc
        
        # Call function
        result = db_manager.get_section_result(user_id, job_id, section_doc_id)
        
        # Verify result
        self.assertIsNone(result)
    
    def test_does_section_result_exist_true(self):
        """Test checking if section result exists (true case)."""
        user_id = "test_user"
        job_id = "job_123"
        section_doc_id = "section_001"
        
        # Setup mock
        mock_doc = Mock()
        mock_doc.get.return_value.exists = True
        self.mock_db.collection.return_value.document.return_value = mock_doc
        
        # Call function
        result = db_manager.does_section_result_exist(user_id, job_id, section_doc_id)
        
        # Verify result
        self.assertTrue(result)
    
    def test_does_section_result_exist_false(self):
        """Test checking if section result exists (false case)."""
        user_id = "test_user"
        job_id = "job_123"
        section_doc_id = "section_001"
        
        # Setup mock
        mock_doc = Mock()
        mock_doc.get.return_value.exists = False
        self.mock_db.collection.return_value.document.return_value = mock_doc
        
        # Call function
        result = db_manager.does_section_result_exist(user_id, job_id, section_doc_id)
        
        # Verify result
        self.assertFalse(result)


class TestOpenEndedQuestions(unittest.TestCase):
    """Test open-ended question management."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_db = Mock()
        db_manager.db = self.mock_db
        
        # Mock collection and document references
        self.mock_collection = Mock()
        self.mock_document = Mock()
        self.mock_subcollection = Mock()
        self.mock_subdocument = Mock()
        
        self.mock_db.collection.return_value = self.mock_collection
        self.mock_collection.document.return_value = self.mock_document
        self.mock_document.collection.return_value = self.mock_subcollection
        self.mock_subcollection.document.return_value = self.mock_subdocument
    
    def test_create_open_ended_submission(self):
        """Test creating open-ended submission."""
        user_id = "test_user"
        job_id = "job_123"
        question_id = "oe_1"
        user_answer = "This is my thoughtful response."
        
        # Call function
        result = db_manager.create_open_ended_submission(user_id, job_id, question_id, user_answer)
        
        # Verify calls
        expected_path = f"saas_users/{user_id}/jobs/{job_id}/open_ended_questions"
        self.mock_db.collection.assert_called_with(expected_path)
        self.mock_collection.document.assert_called_with(question_id)
        
        # Verify set call
        set_call_args = self.mock_document.set.call_args[0][0]
        self.assertEqual(set_call_args["user_id"], user_id)
        self.assertEqual(set_call_args["job_id"], job_id)
        self.assertEqual(set_call_args["question_id"], question_id)
        self.assertEqual(set_call_args["user_answer"], user_answer)
        self.assertEqual(set_call_args["grading_status"], "PENDING")
        self.assertIsNone(set_call_args["grading_result"])
        
        # Verify return value
        self.assertEqual(result, question_id)
    
    def test_update_open_ended_grading_completed(self):
        """Test updating open-ended grading to completed status."""
        user_id = "test_user"
        job_id = "job_123"
        question_id = "oe_1"
        status = "COMPLETED"
        result = {"score": 0.8, "feedback": "Good work"}
        
        # Call function
        db_manager.update_open_ended_grading(user_id, job_id, question_id, status, result)
        
        # Verify update call
        update_call_args = self.mock_document.update.call_args[0][0]
        self.assertEqual(update_call_args["grading_status"], status)
        self.assertEqual(update_call_args["grading_result"], result)
        self.assertIn("graded_at", update_call_args)
        self.assertIn("updated_at", update_call_args)
    
    def test_update_open_ended_grading_pending(self):
        """Test updating open-ended grading to pending status."""
        user_id = "test_user"
        job_id = "job_123"
        question_id = "oe_1"
        status = "PROCESSING"
        
        # Call function
        db_manager.update_open_ended_grading(user_id, job_id, question_id, status)
        
        # Verify update call
        update_call_args = self.mock_document.update.call_args[0][0]
        self.assertEqual(update_call_args["grading_status"], status)
        self.assertNotIn("grading_result", update_call_args)
        self.assertNotIn("graded_at", update_call_args)
        self.assertIn("updated_at", update_call_args)
    
    def test_get_open_ended_question_status(self):
        """Test getting open-ended question status."""
        user_id = "test_user"
        job_id = "job_123"
        question_id = "oe_1"
        
        # Setup mock document
        mock_doc = Mock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {
            "grading_status": "COMPLETED",
            "grading_result": {"score": 0.9}
        }
        self.mock_document.get.return_value = mock_doc
        
        # Call function
        result = db_manager.get_open_ended_question_status(user_id, job_id, question_id)
        
        # Verify result
        self.assertEqual(result["grading_status"], "COMPLETED")
        self.assertEqual(result["grading_result"]["score"], 0.9)
    
    def test_get_latest_grading_results(self):
        """Test getting latest grading results."""
        user_id = "test_user"
        job_id = "job_123"
        
        # Setup mock query results
        mock_docs = [Mock(), Mock()]
        mock_docs[0].to_dict.return_value = {
            "question_id": "oe_1",
            "user_answer": "Answer 1",
            "grading_status": "COMPLETED",
            "grading_result": {"score": 0.8}
        }
        mock_docs[1].to_dict.return_value = {
            "question_id": "oe_2",
            "user_answer": "Answer 2",
            "grading_status": "PENDING",
            "grading_result": None
        }
        
        self.mock_subcollection.order_by.return_value.get.return_value = mock_docs
        
        # Call function
        results = db_manager.get_latest_grading_results(user_id, job_id)
        
        # Verify results
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["question_id"], "oe_1")
        self.assertEqual(results[0]["grading_status"], "COMPLETED")
        self.assertEqual(results[1]["question_id"], "oe_2")
        self.assertEqual(results[1]["grading_status"], "PENDING")


class TestUtilityFunctions(unittest.TestCase):
    """Test utility functions."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_db = Mock()
        db_manager.db = self.mock_db
    
    def test_create_notification(self):
        """Test creating notification."""
        user_id = "test_user"
        job_id = "job_123"
        title = "Test Analysis"
        
        # Setup mocks
        mock_collection = Mock()
        mock_document = Mock()
        self.mock_db.collection.return_value = mock_collection
        mock_collection.document.return_value = mock_document
        
        # Call function
        db_manager.create_notification(user_id, job_id, title)
        
        # Verify calls
        self.mock_db.collection.assert_called_with(f"saas_users/{user_id}/notifications")
        
        # Verify set call
        set_call_args = mock_document.set.call_args[0][0]
        self.assertIn("Your analysis for 'Test Analysis' is complete", set_call_args["message"])
        self.assertEqual(set_call_args["link"], f"/results/{job_id}")
        self.assertFalse(set_call_args["isRead"])
    
    def test_create_usage_record(self):
        """Test creating usage record."""
        user_id = "test_user"
        job_id = "job_123"
        usage_data = {
            "internalCostUSD": 0.05,
            "totalCompletionSeconds": 120.5
        }
        
        # Setup mocks
        mock_collection = Mock()
        self.mock_db.collection.return_value = mock_collection
        
        # Call function
        db_manager.create_usage_record(user_id, job_id, usage_data)
        
        # Verify calls
        self.mock_db.collection.assert_called_with("usage_records")
        mock_collection.add.assert_called_once()
        
        # Verify added data
        add_call_args = mock_collection.add.call_args[0][0]
        self.assertEqual(add_call_args["userId"], user_id)
        self.assertEqual(add_call_args["jobId"], job_id)
        self.assertEqual(add_call_args["internalCostUSD"], 0.05)
        self.assertEqual(add_call_args["totalCompletionSeconds"], 120.5)
        self.assertIn("createdAt", add_call_args)
    
    def test_log_progress(self):
        """Test logging progress."""
        user_id = "test_user"
        job_id = "job_123"
        message = "Processing step 1..."
        
        # Setup mocks
        mock_collection = Mock()
        self.mock_db.collection.return_value = mock_collection
        
        # Call function
        db_manager.log_progress(user_id, job_id, message)
        
        # Verify calls
        expected_path = f"saas_users/{user_id}/jobs/{job_id}/logs"
        self.mock_db.collection.assert_called_with(expected_path)
        mock_collection.add.assert_called_once()
        
        # Verify logged data
        add_call_args = mock_collection.add.call_args[0][0]
        self.assertEqual(add_call_args["message"], message)
        self.assertIn("timestamp", add_call_args)
    
    def test_log_progress_no_db(self):
        """Test logging progress when database is not available."""
        db_manager.db = None
        
        # Should not raise exception
        db_manager.log_progress("user", "job", "message")
    
    def test_refund_analysis_credit(self):
        """Test refunding analysis credit."""
        user_id = "test_user"
        amount = 2
        
        # Setup mocks
        mock_collection = Mock()
        mock_document = Mock()
        self.mock_db.collection.return_value = mock_collection
        mock_collection.document.return_value = mock_document
        
        # Call function
        db_manager.refund_analysis_credit(user_id, amount)
        
        # Verify calls
        self.mock_db.collection.assert_called_with("saas_users")
        mock_collection.document.assert_called_with(user_id)
        mock_document.update.assert_called_once()
        
        # Verify update call uses Increment
        update_call_args = mock_document.update.call_args[0][0]
        self.assertIn("analyses_remaining", update_call_args)


class TestTranscriptCache(unittest.TestCase):
    """Test transcript caching functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_db = Mock()
        db_manager.db = self.mock_db
        
        # Mock collection and document references
        self.mock_collection = Mock()
        self.mock_document = Mock()
        self.mock_db.collection.return_value = self.mock_collection
        self.mock_collection.document.return_value = self.mock_document
    
    def test_get_cached_transcript_exists(self):
        """Test getting cached transcript when it exists."""
        transcript_id = "youtube_123"
        
        # Setup mock document
        mock_doc = Mock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {
            "structured_transcript": [{"text": "Hello world", "start": 0}],
            "youtube_title": "Test Video",
            "youtube_channel_name": "Test Channel"
        }
        self.mock_document.get.return_value = mock_doc
        
        # Call function
        result = db_manager.get_cached_transcript(transcript_id)
        
        # Verify calls
        self.mock_db.collection.assert_called_with("pending_transcripts")
        self.mock_collection.document.assert_called_with(transcript_id)
        self.mock_document.delete.assert_called_once()  # Should delete after retrieval
        
        # Verify result
        self.assertIsNotNone(result)
        self.assertIn("structured_transcript", result)
        self.assertIn("youtube_title", result)
    
    def test_get_cached_transcript_not_exists(self):
        """Test getting cached transcript when it doesn't exist."""
        transcript_id = "youtube_123"
        
        # Setup mock document
        mock_doc = Mock()
        mock_doc.exists = False
        self.mock_document.get.return_value = mock_doc
        
        # Call function
        result = db_manager.get_cached_transcript(transcript_id)
        
        # Verify result
        self.assertIsNone(result)
        self.mock_document.delete.assert_not_called()  # Should not delete if doesn't exist
    
    def test_get_cached_transcript_no_db(self):
        """Test getting cached transcript when database is not available."""
        db_manager.db = None
        
        result = db_manager.get_cached_transcript("transcript_id")
        self.assertIsNone(result)


class TestGCSFileManagement(unittest.TestCase):
    """Test Google Cloud Storage file management."""
    
    @patch('db_manager.gcs_storage')
    @patch('db_manager.settings')
    def test_delete_gcs_file_success(self, mock_settings, mock_gcs_storage):
        """Test successful GCS file deletion."""
        # Setup
        storage_path = "audio/test_file.mp3"
        bucket_name = "test-bucket"
        mock_settings.GCP_STORAGE_BUCKET_NAME = bucket_name
        
        mock_client = Mock()
        mock_bucket = Mock()
        mock_blob = Mock()
        
        mock_gcs_storage.Client.return_value = mock_client
        mock_client.bucket.return_value = mock_bucket
        mock_bucket.blob.return_value = mock_blob
        
        # Call function
        db_manager.delete_gcs_file(storage_path)
        
        # Verify calls
        mock_gcs_storage.Client.assert_called_once()
        mock_client.bucket.assert_called_with(bucket_name)
        mock_bucket.blob.assert_called_with(storage_path)
        mock_blob.delete.assert_called_once()
    
    @patch('db_manager.gcs_storage')
    @patch('db_manager.settings')
    def test_delete_gcs_file_not_found(self, mock_settings, mock_gcs_storage):
        """Test GCS file deletion when file not found."""
        from google.api_core.exceptions import NotFound
        
        # Setup
        storage_path = "audio/missing_file.mp3"
        mock_settings.GCP_STORAGE_BUCKET_NAME = "test-bucket"
        
        mock_client = Mock()
        mock_bucket = Mock()
        mock_blob = Mock()
        mock_blob.delete.side_effect = NotFound("File not found")
        
        mock_gcs_storage.Client.return_value = mock_client
        mock_client.bucket.return_value = mock_bucket
        mock_bucket.blob.return_value = mock_blob
        
        # Call function - should not raise exception
        db_manager.delete_gcs_file(storage_path)
        
        # Should attempt deletion
        mock_blob.delete.assert_called_once()
    
    @patch('db_manager.settings')
    def test_delete_gcs_file_no_bucket_name(self, mock_settings):
        """Test GCS file deletion when bucket name is not set."""
        mock_settings.GCP_STORAGE_BUCKET_NAME = None
        
        # Call function - should not raise exception
        db_manager.delete_gcs_file("some/file.mp3")
    
    def test_delete_gcs_file_empty_path(self):
        """Test GCS file deletion with empty path."""
        # Call function - should return early
        db_manager.delete_gcs_file("")
        db_manager.delete_gcs_file(None)


if __name__ == "__main__":
    unittest.main(verbosity=2)