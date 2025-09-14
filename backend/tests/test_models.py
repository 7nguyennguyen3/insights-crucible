"""
Unit tests for Pydantic models in models.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import unittest
from unittest.mock import patch
import pytest
from pydantic import ValidationError

from models import (
    FeatureConfig,
    AnalysisRequest,
    JobRequest,
    ProcessResponse,
    StatusResponse,
    ResultsResponse,
    BulkAnalysisItem,
    BulkAnalysisRequest,
    QuizQuestion,
    QuizMetadata,
    OpenEndedQuestion,
    SingleQuiz,
    MultiQuizResponse,
    OpenEndedSubmission,
    GradingResult
)


class TestFeatureConfig(unittest.TestCase):
    """Test FeatureConfig model."""
    
    def test_default_values(self):
        """Test default configuration values."""
        config = FeatureConfig()
        self.assertEqual(config.analysis_persona, "deep_dive")
    
    def test_custom_persona(self):
        """Test custom persona assignment."""
        config = FeatureConfig(analysis_persona="deep_dive")
        self.assertEqual(config.analysis_persona, "deep_dive")


class TestAnalysisRequest(unittest.TestCase):
    """Test AnalysisRequest model validation."""
    
    def test_valid_transcript_request(self):
        """Test valid request with transcript."""
        request = AnalysisRequest(
            user_id="test_user",
            transcript="This is a test transcript"
        )
        self.assertEqual(request.user_id, "test_user")
        self.assertEqual(request.transcript, "This is a test transcript")
        self.assertEqual(request.model_choice, "universal")
        self.assertIsInstance(request.config, FeatureConfig)
    
    def test_valid_duration_request(self):
        """Test valid request with duration."""
        request = AnalysisRequest(
            user_id="test_user",
            duration_seconds=300.5
        )
        self.assertEqual(request.duration_seconds, 300.5)
    
    def test_valid_storage_path_request(self):
        """Test valid request with storage path."""
        request = AnalysisRequest(
            user_id="test_user",
            storagePath="gs://bucket/audio.mp3"
        )
        self.assertEqual(request.storagePath, "gs://bucket/audio.mp3")
    
    def test_valid_transcript_id_request(self):
        """Test valid request with transcript ID."""
        request = AnalysisRequest(
            user_id="test_user",
            transcript_id="youtube_123"
        )
        self.assertEqual(request.transcript_id, "youtube_123")
    
    def test_model_choice_validation_valid(self):
        """Test valid model choice."""
        for model in ["universal", "slam-1", "nano"]:
            request = AnalysisRequest(
                user_id="test_user",
                transcript="test",
                model_choice=model
            )
            self.assertEqual(request.model_choice, model)
    
    def test_model_choice_validation_invalid(self):
        """Test invalid model choice raises error."""
        with self.assertRaises(ValidationError) as context:
            AnalysisRequest(
                user_id="test_user",
                transcript="test",
                model_choice="invalid_model"
            )
        self.assertIn("not a supported model", str(context.exception))
    
    def test_source_type_validation_valid(self):
        """Test valid source type."""
        for source_type in ["youtube", "upload", "paste"]:
            request = AnalysisRequest(
                user_id="test_user",
                transcript="test",
                source_type=source_type
            )
            self.assertEqual(request.source_type, source_type)
    
    def test_source_type_validation_invalid(self):
        """Test invalid source type raises error."""
        with self.assertRaises(ValidationError) as context:
            AnalysisRequest(
                user_id="test_user",
                transcript="test",
                source_type="invalid_source"
            )
        self.assertIn("not a supported source type", str(context.exception))
    
    def test_source_type_none_allowed(self):
        """Test that None source type is allowed."""
        request = AnalysisRequest(
            user_id="test_user",
            transcript="test",
            source_type=None
        )
        self.assertIsNone(request.source_type)
    
    def test_exclusive_inputs_validation_no_inputs(self):
        """Test validation fails when no inputs provided."""
        with self.assertRaises(ValidationError) as context:
            AnalysisRequest(user_id="test_user")
        self.assertIn("A valid input", str(context.exception))
    
    def test_exclusive_inputs_validation_multiple_inputs(self):
        """Test validation fails when multiple inputs provided."""
        with self.assertRaises(ValidationError) as context:
            AnalysisRequest(
                user_id="test_user",
                transcript="test",
                duration_seconds=300
            )
        self.assertIn("only one input type", str(context.exception))
    
    def test_youtube_metadata_fields(self):
        """Test YouTube metadata fields."""
        request = AnalysisRequest(
            user_id="test_user",
            transcript="test",
            youtube_url="https://youtube.com/watch?v=123",
            youtube_video_title="Test Video",
            youtube_channel_name="Test Channel",
            youtube_duration="10:30",
            youtube_thumbnail_url="https://img.youtube.com/vi/123/default.jpg"
        )
        self.assertEqual(request.youtube_url, "https://youtube.com/watch?v=123")
        self.assertEqual(request.youtube_video_title, "Test Video")
        self.assertEqual(request.youtube_channel_name, "Test Channel")
        self.assertEqual(request.youtube_duration, "10:30")
        self.assertEqual(request.youtube_thumbnail_url, "https://img.youtube.com/vi/123/default.jpg")


class TestBulkAnalysisItem(unittest.TestCase):
    """Test BulkAnalysisItem model validation."""
    
    def test_valid_transcript_item(self):
        """Test valid item with transcript."""
        item = BulkAnalysisItem(
            transcript="Test transcript",
            client_provided_id="item_1"
        )
        self.assertEqual(item.transcript, "Test transcript")
        self.assertEqual(item.client_provided_id, "item_1")
    
    def test_valid_storage_path_item(self):
        """Test valid item with storage path."""
        item = BulkAnalysisItem(
            storagePath="gs://bucket/audio.mp3",
            client_provided_id="item_2"
        )
        self.assertEqual(item.storagePath, "gs://bucket/audio.mp3")
    
    def test_exclusive_inputs_validation_no_inputs(self):
        """Test validation fails when no inputs provided."""
        with self.assertRaises(ValidationError) as context:
            BulkAnalysisItem(client_provided_id="item_1")
        self.assertIn("exactly one input", str(context.exception))
    
    def test_exclusive_inputs_validation_multiple_inputs(self):
        """Test validation fails when multiple inputs provided."""
        with self.assertRaises(ValidationError) as context:
            BulkAnalysisItem(
                transcript="test",
                storagePath="gs://bucket/audio.mp3"
            )
        self.assertIn("exactly one input", str(context.exception))


class TestBulkAnalysisRequest(unittest.TestCase):
    """Test BulkAnalysisRequest model validation."""
    
    def test_valid_bulk_request(self):
        """Test valid bulk analysis request."""
        items = [
            BulkAnalysisItem(transcript="Test 1"),
            BulkAnalysisItem(storagePath="gs://bucket/audio.mp3")
        ]
        request = BulkAnalysisRequest(
            user_id="test_user",
            items=items
        )
        self.assertEqual(request.user_id, "test_user")
        self.assertEqual(len(request.items), 2)
        self.assertEqual(request.model_choice, "universal")
    
    def test_model_choice_validation(self):
        """Test model choice validation in bulk request."""
        items = [BulkAnalysisItem(transcript="Test")]
        
        # Valid model choice
        request = BulkAnalysisRequest(
            user_id="test_user",
            items=items,
            model_choice="slam-1"
        )
        self.assertEqual(request.model_choice, "slam-1")
        
        # Invalid model choice
        with self.assertRaises(ValidationError) as context:
            BulkAnalysisRequest(
                user_id="test_user",
                items=items,
                model_choice="invalid"
            )
        self.assertIn("not a supported model", str(context.exception))


class TestQuizModels(unittest.TestCase):
    """Test quiz-related models."""
    
    def test_quiz_question_model(self):
        """Test QuizQuestion model."""
        question = QuizQuestion(
            question_id="q1",
            question="What is the main concept?",
            options=["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
            correct_answer="A",
            explanation="This is correct because...",
            supporting_quote="The key insight is...",
            related_timestamp="00:30",
            difficulty="medium"
        )
        self.assertEqual(question.question_id, "q1")
        self.assertEqual(question.question, "What is the main concept?")
        self.assertEqual(len(question.options), 4)
        self.assertEqual(question.correct_answer, "A")
        self.assertEqual(question.difficulty, "medium")
    
    def test_quiz_metadata_model(self):
        """Test QuizMetadata model."""
        metadata = QuizMetadata(
            quiz_number=1,
            section_range="Sections 1-3",
            total_questions=5,
            estimated_time_minutes=15,
            difficulty_distribution={"easy": 1, "medium": 3, "hard": 1},
            source_sections=[1, 2, 3],
            concepts_covered=10
        )
        self.assertEqual(metadata.quiz_number, 1)
        self.assertEqual(metadata.total_questions, 5)
        self.assertEqual(metadata.estimated_time_minutes, 15)
        self.assertEqual(len(metadata.source_sections), 3)
    
    def test_open_ended_question_model(self):
        """Test OpenEndedQuestion model."""
        question = OpenEndedQuestion(
            question_id="oe1",
            question="Explain the main concept in your own words.",
            supporting_quote="The key insight is...",
            related_timestamp="01:30",
            difficulty="hard"
        )
        self.assertEqual(question.question_id, "oe1")
        self.assertEqual(question.question, "Explain the main concept in your own words.")
        self.assertEqual(question.difficulty, "hard")
    
    def test_multi_quiz_response_model(self):
        """Test MultiQuizResponse model."""
        quiz_questions = [
            QuizQuestion(
                question_id="q1",
                question="Test question",
                options=["A", "B", "C", "D"],
                correct_answer="A",
                explanation="Test explanation",
                supporting_quote="Test quote",
                related_timestamp="00:30"
            )
        ]
        
        open_ended_questions = [
            OpenEndedQuestion(
                question_id="oe1",
                question="Test open ended",
                supporting_quote="Test quote",
                related_timestamp="01:00"
            )
        ]
        
        quiz_metadata = QuizMetadata(
            quiz_number=1,
            section_range="Section 1",
            total_questions=1,
            estimated_time_minutes=5,
            difficulty_distribution={"medium": 1},
            source_sections=[1],
            concepts_covered=3
        )
        
        single_quiz = SingleQuiz(
            quiz_questions=quiz_questions,
            quiz_metadata=quiz_metadata
        )
        
        response = MultiQuizResponse(
            quiz_questions=quiz_questions,
            open_ended_questions=open_ended_questions,
            quizzes=[single_quiz],
            quiz_metadata={"total_quizzes": 1}
        )
        
        self.assertEqual(len(response.quiz_questions), 1)
        self.assertEqual(len(response.open_ended_questions), 1)
        self.assertEqual(len(response.quizzes), 1)
        self.assertEqual(response.quiz_metadata["total_quizzes"], 1)


class TestOpenEndedSubmission(unittest.TestCase):
    """Test OpenEndedSubmission model."""
    
    def test_valid_submission(self):
        """Test valid open-ended submission."""
        submission = OpenEndedSubmission(
            user_id="test_user",
            job_id="job_123",
            question_id="oe1",
            user_answer="This is my thoughtful response."
        )
        self.assertEqual(submission.user_id, "test_user")
        self.assertEqual(submission.job_id, "job_123")
        self.assertEqual(submission.question_id, "oe1")
        self.assertEqual(submission.user_answer, "This is my thoughtful response.")


class TestGradingResult(unittest.TestCase):
    """Test GradingResult model."""
    
    def test_valid_grading_result(self):
        """Test valid grading result."""
        result = GradingResult(
            score=0.85,
            feedback="Good understanding demonstrated.",
            strengths=["Clear explanation", "Good examples"],
            improvements=["Could be more detailed", "Add more connections"],
            completeness=0.8,
            accuracy=0.9
        )
        self.assertEqual(result.score, 0.85)
        self.assertEqual(result.feedback, "Good understanding demonstrated.")
        self.assertEqual(len(result.strengths), 2)
        self.assertEqual(len(result.improvements), 2)
        self.assertEqual(result.completeness, 0.8)
        self.assertEqual(result.accuracy, 0.9)


class TestResponseModels(unittest.TestCase):
    """Test response models."""
    
    def test_process_response(self):
        """Test ProcessResponse model."""
        response = ProcessResponse(
            job_id="job_123",
            status="QUEUED",
            message="Analysis queued successfully"
        )
        self.assertEqual(response.job_id, "job_123")
        self.assertEqual(response.status, "QUEUED")
        self.assertEqual(response.message, "Analysis queued successfully")
    
    def test_status_response(self):
        """Test StatusResponse model."""
        response = StatusResponse(
            job_id="job_123",
            status="PROCESSING",
            progress="Step 3/7: Analyzing sections..."
        )
        self.assertEqual(response.job_id, "job_123")
        self.assertEqual(response.status, "PROCESSING")
        self.assertEqual(response.progress, "Step 3/7: Analyzing sections...")
    
    def test_results_response(self):
        """Test ResultsResponse model."""
        response = ResultsResponse(
            job_id="job_123",
            status="COMPLETED",
            job_title="Analysis of Test Content",
            transcript="This is the transcript",
            results=[{"section": 1, "title": "Introduction"}]
        )
        self.assertEqual(response.job_id, "job_123")
        self.assertEqual(response.status, "COMPLETED")
        self.assertEqual(response.job_title, "Analysis of Test Content")
        self.assertEqual(response.transcript, "This is the transcript")
        self.assertEqual(len(response.results), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)