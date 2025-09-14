"""
Unit tests for analysis pipeline orchestrator in pipeline/orchestrators/analysis_pipeline.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import unittest
from unittest.mock import patch, Mock, AsyncMock, MagicMock, call
import asyncio
import time
from dataclasses import dataclass
from typing import Dict, Any, List, Optional

# Mock external dependencies and pipeline interfaces
with patch.dict('sys.modules', {
    'langchain_core.runnables': Mock(),
    'rich': Mock(),
    'rich.panel': Mock()
}):
    # Create mock dataclasses and interfaces
    @dataclass
    class MockAnalysisRequest:
        user_id: str
        job_id: str
        persona: str
        transcript_id: Optional[str] = None
        storage_path: Optional[str] = None
        raw_transcript: Optional[str] = None
        config: Optional[Dict[str, Any]] = None
        model_choice: str = "universal"
        
        def __post_init__(self):
            if self.config is None:
                self.config = {}
    
    @dataclass 
    class MockAnalysisResult:
        job_id: str
        status: str
        final_title: str
        sections_processed: int
        cost_metrics: Dict[str, Any]
        timing_metrics: Dict[str, float]
        synthesis_results: Dict[str, Any]
        error_message: Optional[str] = None
    
    @dataclass
    class MockTranscriptUtterance:
        speaker_id: str
        start_seconds: int
        end_seconds: int
        text: str
    
    # Mock the pipeline module imports
    mock_interfaces = Mock()
    mock_interfaces.TranscriptNormalizer = Mock()
    mock_interfaces.TranscriptSegmenter = Mock()
    mock_interfaces.AudioProcessor = Mock()
    mock_interfaces.MetaAnalyzer = Mock()
    mock_interfaces.TitleGenerator = Mock()
    mock_interfaces.TranscriptUtterance = MockTranscriptUtterance
    mock_interfaces.SectionAnalysis = Mock()
    
    mock_enrichment = Mock()
    mock_enrichment.ClaimProcessor = Mock()
    mock_enrichment.ContextualBriefingGenerator = Mock()
    
    mock_config = Mock()
    mock_config.get_persona_config = Mock()
    mock_config.is_valid_persona = Mock()
    
    mock_section_processor = Mock()
    mock_section_processor.SectionProcessor = Mock()
    
    sys.modules['pipeline.interfaces'] = mock_interfaces
    sys.modules['pipeline.services.enrichment'] = mock_enrichment
    sys.modules['pipeline.config'] = mock_config
    sys.modules['pipeline.orchestrators.section_processor'] = mock_section_processor
    
    # Now import the actual module
    from pipeline.orchestrators.analysis_pipeline import AnalysisPipeline, AnalysisRequest, AnalysisResult


class TestAnalysisPipelineInitialization(unittest.TestCase):
    """Test AnalysisPipeline initialization."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_transcript_normalizer = Mock()
        self.mock_youtube_normalizer = Mock()
        self.mock_segmenter = Mock()
        self.mock_audio_processor = Mock()
        self.mock_section_processor = Mock()
        self.mock_meta_analyzer = Mock()
        self.mock_title_generator = Mock()
        self.mock_claim_processor = Mock()
        self.mock_briefing_generator = Mock()
        self.mock_db_manager = Mock()
        self.mock_token_tracker = Mock()
        
        self.pipeline = AnalysisPipeline(
            transcript_normalizer=self.mock_transcript_normalizer,
            youtube_normalizer=self.mock_youtube_normalizer,
            segmenter=self.mock_segmenter,
            audio_processor=self.mock_audio_processor,
            section_processor=self.mock_section_processor,
            meta_analyzer=self.mock_meta_analyzer,
            title_generator=self.mock_title_generator,
            claim_processor=self.mock_claim_processor,
            briefing_generator=self.mock_briefing_generator,
            db_manager=self.mock_db_manager,
            token_tracker=self.mock_token_tracker
        )
    
    def test_initialization_stores_dependencies(self):
        """Test that initialization stores all dependencies correctly."""
        self.assertEqual(self.pipeline.transcript_normalizer, self.mock_transcript_normalizer)
        self.assertEqual(self.pipeline.youtube_normalizer, self.mock_youtube_normalizer)
        self.assertEqual(self.pipeline.segmenter, self.mock_segmenter)
        self.assertEqual(self.pipeline.audio_processor, self.mock_audio_processor)
        self.assertEqual(self.pipeline.section_processor, self.mock_section_processor)
        self.assertEqual(self.pipeline.meta_analyzer, self.mock_meta_analyzer)
        self.assertEqual(self.pipeline.title_generator, self.mock_title_generator)
        self.assertEqual(self.pipeline.claim_processor, self.mock_claim_processor)
        self.assertEqual(self.pipeline.briefing_generator, self.mock_briefing_generator)
        self.assertEqual(self.pipeline.db_manager, self.mock_db_manager)
        self.assertEqual(self.pipeline.token_tracker, self.mock_token_tracker)
    
    def test_initialization_sets_cached_metadata(self):
        """Test that initialization sets up cached metadata."""
        self.assertEqual(self.pipeline._cached_youtube_metadata, {})


class TestAnalysisPipelineValidation(unittest.TestCase):
    """Test analysis pipeline validation logic."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.pipeline = self._create_mock_pipeline()
    
    def _create_mock_pipeline(self):
        """Create a mock pipeline with all dependencies."""
        return AnalysisPipeline(
            transcript_normalizer=Mock(),
            youtube_normalizer=Mock(),
            segmenter=Mock(),
            audio_processor=Mock(),
            section_processor=Mock(),
            meta_analyzer=Mock(),
            title_generator=Mock(),
            claim_processor=Mock(),
            briefing_generator=Mock(),
            db_manager=Mock(),
            token_tracker=Mock()
        )
    
    @patch('pipeline.config.is_valid_persona')
    def test_run_analysis_invalid_persona(self, mock_is_valid_persona):
        """Test run_analysis with invalid persona."""
        async def run_test():
            # Setup
            mock_is_valid_persona.return_value = False
            request = MockAnalysisRequest(
                user_id="test_user",
                job_id="test_job",
                persona="invalid_persona"
            )
            
            # Should raise ValueError for invalid persona
            with self.assertRaises(ValueError) as context:
                await self.pipeline.run_analysis(request)
            
            self.assertIn("Invalid persona", str(context.exception))
        
        asyncio.run(run_test())
    
    @patch('pipeline.config.is_valid_persona')
    @patch('pipeline.config.get_persona_config')
    def test_run_analysis_job_not_found(self, mock_get_persona_config, mock_is_valid_persona):
        """Test run_analysis when job is not found."""
        async def run_test():
            # Setup
            mock_is_valid_persona.return_value = True
            mock_get_persona_config.return_value = {"test": "config"}
            
            # Mock db_manager to return None for job
            self.pipeline.db_manager.get_job_status.return_value = None
            
            request = MockAnalysisRequest(
                user_id="test_user",
                job_id="nonexistent_job",
                persona="deep_dive"
            )
            
            # Should raise ValueError for job not found
            with self.assertRaises(ValueError) as context:
                await self.pipeline.run_analysis(request)
            
            self.assertIn("Job nonexistent_job not found", str(context.exception))
        
        asyncio.run(run_test())
    
    @patch('pipeline.config.is_valid_persona')
    @patch('pipeline.config.get_persona_config')
    def test_run_analysis_job_wrong_status(self, mock_get_persona_config, mock_is_valid_persona):
        """Test run_analysis when job has wrong status."""
        async def run_test():
            # Setup
            mock_is_valid_persona.return_value = True
            mock_get_persona_config.return_value = {"test": "config"}
            
            # Mock db_manager to return job with wrong status
            self.pipeline.db_manager.get_job_status.return_value = {
                "status": "COMPLETED",
                "job_title": "Test Job"
            }
            
            request = MockAnalysisRequest(
                user_id="test_user",
                job_id="test_job",
                persona="deep_dive"
            )
            
            # Should return skipped result
            result = await self.pipeline.run_analysis(request)
            
            self.assertEqual(result.status, "skipped")
            self.assertEqual(result.sections_processed, 0)
        
        asyncio.run(run_test())


class TestInputProcessing(unittest.TestCase):
    """Test input processing functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.pipeline = self._create_mock_pipeline()
        self.mock_request = MockAnalysisRequest(
            user_id="test_user",
            job_id="test_job",
            persona="deep_dive"
        )
    
    def _create_mock_pipeline(self):
        """Create a mock pipeline with all dependencies."""
        return AnalysisPipeline(
            transcript_normalizer=Mock(),
            youtube_normalizer=Mock(),
            segmenter=Mock(),
            audio_processor=Mock(),
            section_processor=Mock(),
            meta_analyzer=Mock(),
            title_generator=Mock(),
            claim_processor=Mock(),
            briefing_generator=Mock(),
            db_manager=Mock(),
            token_tracker=Mock()
        )
    
    def test_process_input_transcript_id(self):
        """Test processing input with transcript ID."""
        async def run_test():
            # Setup
            self.mock_request.transcript_id = "youtube_123"
            
            cached_data = {
                "structured_transcript": [
                    {"speaker": "A", "text": "Hello", "start": 0, "end": 1000}
                ],
                "youtube_title": "Test Video",
                "youtube_channel_name": "Test Channel"
            }
            
            self.pipeline.db_manager.get_cached_transcript.return_value = cached_data
            self.pipeline.youtube_normalizer.normalize = AsyncMock(return_value=[
                MockTranscriptUtterance("Speaker A", 0, 1, "Hello")
            ])
            
            # Call function
            result = await self.pipeline._process_input(
                self.mock_request, {}, {}, time.time()
            )
            
            # Verify calls
            self.pipeline.db_manager.get_cached_transcript.assert_called_with("youtube_123")
            self.pipeline.youtube_normalizer.normalize.assert_called_once()
            
            # Verify cached metadata
            self.assertEqual(self.pipeline._cached_youtube_metadata["youtube_title"], "Test Video")
            self.assertEqual(self.pipeline._cached_youtube_metadata["youtube_channel_name"], "Test Channel")
            
            # Verify result
            self.assertEqual(len(result), 1)
            self.assertEqual(result[0].text, "Hello")
        
        asyncio.run(run_test())
    
    def test_process_input_storage_path(self):
        """Test processing input with storage path."""
        async def run_test():
            # Setup
            self.mock_request.storage_path = "gs://bucket/audio.mp3"
            
            transcription_result = {
                "utterances": [
                    {"speaker": "A", "text": "Hello", "start": 0, "end": 1000}
                ],
                "audio_duration": 60
            }
            
            self.pipeline.audio_processor.transcribe = AsyncMock(return_value=transcription_result)
            
            # Call function
            cost_metrics = {}
            result = await self.pipeline._process_input(
                self.mock_request, cost_metrics, {}, time.time()
            )
            
            # Verify calls
            self.pipeline.audio_processor.transcribe.assert_called_with("gs://bucket/audio.mp3", "universal")
            
            # Verify cost metrics updated
            self.assertEqual(cost_metrics["assemblyai_audio_seconds"], 60)
            
            # Verify result conversion
            self.assertEqual(len(result), 1)
            self.assertEqual(result[0].text, "Hello")
            self.assertEqual(result[0].speaker_id, "Speaker A")
        
        asyncio.run(run_test())
    
    def test_process_input_raw_transcript(self):
        """Test processing input with raw transcript."""
        async def run_test():
            # Setup
            self.mock_request.raw_transcript = "This is a test transcript\\\\nwith newlines"
            
            self.pipeline.transcript_normalizer.normalize = AsyncMock(return_value=[
                MockTranscriptUtterance("Speaker", 0, 10, "This is a test transcript with newlines")
            ])
            
            # Call function
            result = await self.pipeline._process_input(
                self.mock_request, {}, {}, time.time()
            )
            
            # Verify newline correction
            expected_text = "This is a test transcript\\nwith newlines"
            self.pipeline.transcript_normalizer.normalize.assert_called_with(expected_text)
            
            # Verify result
            self.assertEqual(len(result), 1)
        
        asyncio.run(run_test())
    
    def test_process_input_no_input_error(self):
        """Test processing input with no valid input."""
        async def run_test():
            # Setup - no transcript_id, storage_path, or raw_transcript
            self.mock_request.raw_transcript = None
            
            # Should raise ValueError
            with self.assertRaises(ValueError) as context:
                await self.pipeline._process_input(
                    self.mock_request, {}, {}, time.time()
                )
            
            self.assertIn("No input provided", str(context.exception))
        
        asyncio.run(run_test())
    
    def test_process_input_cached_transcript_not_found(self):
        """Test processing input when cached transcript not found."""
        async def run_test():
            # Setup
            self.mock_request.transcript_id = "nonexistent_123"
            self.pipeline.db_manager.get_cached_transcript.return_value = None
            
            # Should raise ValueError
            with self.assertRaises(ValueError) as context:
                await self.pipeline._process_input(
                    self.mock_request, {}, {}, time.time()
                )
            
            self.assertIn("Cached transcript for ID nonexistent_123 not found", str(context.exception))
        
        asyncio.run(run_test())


class TestSectionProcessing(unittest.TestCase):
    """Test section processing functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.pipeline = self._create_mock_pipeline()
    
    def _create_mock_pipeline(self):
        """Create a mock pipeline with all dependencies."""
        return AnalysisPipeline(
            transcript_normalizer=Mock(),
            youtube_normalizer=Mock(),
            segmenter=Mock(),
            audio_processor=Mock(),
            section_processor=Mock(),
            meta_analyzer=Mock(),
            title_generator=Mock(),
            claim_processor=Mock(),
            briefing_generator=Mock(),
            db_manager=Mock(),
            token_tracker=Mock()
        )
    
    def test_segment_transcript(self):
        """Test transcript segmentation."""
        async def run_test():
            # Setup
            transcript = [
                MockTranscriptUtterance("Speaker", 0, 10, "First part"),
                MockTranscriptUtterance("Speaker", 10, 20, "Second part")
            ]
            
            mock_sections = [
                {"start_time": "00:00", "end_time": "00:10", "content": "First part"},
                {"start_time": "00:10", "end_time": "00:20", "content": "Second part"}
            ]
            
            self.pipeline.segmenter.segment.return_value = mock_sections
            
            request = MockAnalysisRequest(
                user_id="test_user",
                job_id="test_job",
                persona="deep_dive"
            )
            
            # Call function
            timing_metrics = {}
            sections = await self.pipeline._segment_transcript(transcript, request, timing_metrics)
            
            # Verify calls
            self.pipeline.segmenter.segment.assert_called_with(transcript)
            self.pipeline.db_manager.log_progress.assert_called()
            
            # Verify timing metrics updated
            self.assertIn("segmentation_s", timing_metrics)
            
            # Verify result
            self.assertEqual(sections, mock_sections)
        
        asyncio.run(run_test())
    
    def test_analyze_sections_parallel(self):
        """Test parallel section analysis."""
        async def run_test():
            # Setup
            sections = [
                {"start_time": "00:00", "end_time": "00:10"},
                {"start_time": "00:10", "end_time": "00:20"}
            ]
            
            mock_results = [
                Mock(full_analysis={"title": "Section 1"}, cost_metrics={"llm_calls": 1}),
                Mock(full_analysis={"title": "Section 2"}, cost_metrics={"llm_calls": 1})
            ]
            
            self.pipeline.section_processor.process_sections_parallel = AsyncMock(return_value=mock_results)
            self.pipeline.token_tracker = Mock()
            
            request = MockAnalysisRequest(
                user_id="test_user",
                job_id="test_job",
                persona="deep_dive"
            )
            
            # Call function
            cost_metrics = {}
            runnable_config = Mock()
            
            result = await self.pipeline._analyze_sections(
                sections, request, runnable_config, cost_metrics
            )
            
            # Verify calls
            self.pipeline.section_processor.process_sections_parallel.assert_called_with(
                sections, "test_user", "test_job", runnable_config
            )
            
            # Verify cost metrics aggregation
            self.assertEqual(cost_metrics["llm_calls"], 2)
            
            # Verify result
            self.assertEqual(result, mock_results)
        
        asyncio.run(run_test())
    
    def test_analyze_sections_deep_dive_transcript_setup(self):
        """Test section analysis with deep_dive persona transcript setup."""
        async def run_test():
            # Setup deep_dive section processor
            self.pipeline.section_processor.persona = "deep_dive"
            self.pipeline.section_processor.set_structured_transcript = Mock()
            
            # Mock job document with transcript data
            job_doc = {
                "structured_transcript": [
                    {"text": "Hello", "start": 0, "end": 1000}
                ]
            }
            self.pipeline.db_manager.get_job_status.return_value = job_doc
            
            sections = [{"start_time": "00:00", "end_time": "00:10"}]
            mock_results = [Mock(full_analysis={"title": "Section 1"}, cost_metrics={})]
            
            self.pipeline.section_processor.process_sections_parallel = AsyncMock(return_value=mock_results)
            
            request = MockAnalysisRequest(
                user_id="test_user",
                job_id="test_job",
                persona="deep_dive"
            )
            
            # Call function
            await self.pipeline._analyze_sections(
                sections, request, Mock(), {}
            )
            
            # Verify transcript was set for deep_dive
            self.pipeline.section_processor.set_structured_transcript.assert_called_with(
                [{"text": "Hello", "start": 0, "end": 1000}]
            )
        
        asyncio.run(run_test())


class TestMetaAnalysis(unittest.TestCase):
    """Test meta-analysis functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.pipeline = self._create_mock_pipeline()
    
    def _create_mock_pipeline(self):
        """Create a mock pipeline with all dependencies."""
        mock_db = Mock()
        mock_db.collection.return_value.document.return_value.update = Mock()
        
        return AnalysisPipeline(
            transcript_normalizer=Mock(),
            youtube_normalizer=Mock(),
            segmenter=Mock(),
            audio_processor=Mock(),
            section_processor=Mock(),
            meta_analyzer=Mock(),
            title_generator=Mock(),
            claim_processor=Mock(),
            briefing_generator=Mock(),
            db_manager=mock_db,
            token_tracker=Mock()
        )
    
    def test_perform_meta_analysis_deep_dive_consultant_legacy(self):
        """Test meta-analysis for deep_dive persona (consultant legacy test)."""
        async def run_test():
            # Setup
            all_sections = [
                Mock(title="Section 1", summary="Summary 1"),
                Mock(title="Section 2", summary="Summary 2")
            ]
            
            synthesis_results = {
                "executive_summary": "Key insights",
                "recommendations": ["Rec 1", "Rec 2"]
            }
            
            self.pipeline.meta_analyzer.perform_synthesis = AsyncMock(return_value=synthesis_results)
            
            request = MockAnalysisRequest(
                user_id="test_user",
                job_id="test_job",
                persona="deep_dive"
            )
            
            # Call function
            result = await self.pipeline._perform_meta_analysis(
                all_sections, request, Mock(), {}
            )
            
            # Verify calls
            self.pipeline.meta_analyzer.perform_synthesis.assert_called_with(
                all_sections, Mock()
            )
            
            # Verify database update
            self.pipeline.db_manager.collection.assert_called()
            
            # Verify result
            self.assertEqual(result, synthesis_results)
        
        asyncio.run(run_test())
    
    def test_perform_meta_analysis_deep_dive(self):
        """Test meta-analysis for deep_dive persona.\""""
        async def run_test():
            # Setup
            all_sections = [Mock()]
            
            learning_synthesis = {
                "quiz_questions": [{"question": "What is?", "answer": "A"}],
                "open_ended_questions": [{"question": "Explain..."}],
                "generation_method": "section_aware",
                "multi_quiz_data": {
                    "quiz_metadata": {"total_quizzes": 2},
                    "quizzes": [{"quiz_number": 1}]
                }
            }
            
            self.pipeline.meta_analyzer.perform_synthesis = AsyncMock(return_value=learning_synthesis)
            
            # Mock job status retrieval for original transcript
            self.pipeline.db_manager.get_job_status.return_value = {
                "request_data": {"transcript": "Original transcript"}
            }
            
            request = MockAnalysisRequest(
                user_id="test_user",
                job_id="test_job",
                persona="deep_dive"
            )
            
            # Call function
            result = await self.pipeline._perform_meta_analysis(
                all_sections, request, Mock(), {}
            )
            
            # Verify synthesis was called with original transcript
            self.pipeline.meta_analyzer.perform_synthesis.assert_called_with(
                all_sections, Mock(), "Original transcript"
            )
            
            # Verify result
            self.assertEqual(result, learning_synthesis)
        
        asyncio.run(run_test())
    
    def test_perform_meta_analysis_deep_dive_general_legacy(self):
        """Test meta-analysis for deep_dive persona (general legacy test)."""
        async def run_test():
            # Setup
            all_sections = [Mock()]
            
            argument_results = {
                "main_argument": "Central thesis",
                "supporting_points": ["Point 1", "Point 2"]
            }
            
            self.pipeline.meta_analyzer.generate_argument_structure = AsyncMock(return_value=argument_results)
            
            request = MockAnalysisRequest(
                user_id="test_user",
                job_id="test_job",
                persona="deep_dive"
            )
            
            # Call function
            result = await self.pipeline._perform_meta_analysis(
                all_sections, request, Mock(), {}
            )
            
            # Verify calls
            self.pipeline.meta_analyzer.generate_argument_structure.assert_called_with(
                all_sections, Mock()
            )
            
            # Verify result
            self.assertEqual(result, argument_results)
        
        asyncio.run(run_test())
    
    def test_perform_meta_analysis_empty_sections(self):
        """Test meta-analysis with empty sections."""
        async def run_test():
            request = MockAnalysisRequest(
                user_id="test_user",
                job_id="test_job",
                persona="deep_dive"
            )
            
            # Call function with empty sections
            result = await self.pipeline._perform_meta_analysis(
                [], request, Mock(), {}
            )
            
            # Should return empty dict
            self.assertEqual(result, {})
        
        asyncio.run(run_test())


class TestErrorHandling(unittest.TestCase):
    """Test error handling in analysis pipeline."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.pipeline = self._create_mock_pipeline()
    
    def _create_mock_pipeline(self):
        """Create a mock pipeline with all dependencies."""
        return AnalysisPipeline(
            transcript_normalizer=Mock(),
            youtube_normalizer=Mock(),
            segmenter=Mock(),
            audio_processor=Mock(),
            section_processor=Mock(),
            meta_analyzer=Mock(),
            title_generator=Mock(),
            claim_processor=Mock(),
            briefing_generator=Mock(),
            db_manager=Mock(),
            token_tracker=Mock()
        )
    
    def test_handle_pipeline_error(self):
        """Test pipeline error handling."""
        async def run_test():
            # Setup
            error = Exception("Test error")
            request = MockAnalysisRequest(
                user_id="test_user",
                job_id="test_job",
                persona="deep_dive",
                storage_path="gs://bucket/file.mp3"
            )
            
            # Call function
            result = await self.pipeline._handle_pipeline_error(
                error, request, {}, {}
            )
            
            # Verify database updates
            self.pipeline.db_manager.update_job_status.assert_called_with(
                "test_user", "test_job", "FAILED", "Analysis failed: Test error"
            )
            self.pipeline.db_manager.log_progress.assert_called()
            self.pipeline.db_manager.refund_analysis_credit.assert_called_with("test_user")
            
            # Verify cleanup for storage path
            self.pipeline.db_manager.delete_gcs_file.assert_called_with("gs://bucket/file.mp3")
            
            # Verify result
            self.assertEqual(result.status, "failed")
            self.assertEqual(result.error_message, "Analysis failed: Test error")
        
        asyncio.run(run_test())
    
    def test_handle_pipeline_error_no_storage_cleanup(self):
        """Test pipeline error handling without storage cleanup."""
        async def run_test():
            # Setup
            error = Exception("Test error")
            request = MockAnalysisRequest(
                user_id="test_user",
                job_id="test_job",
                persona="deep_dive"
                # No storage_path
            )
            
            # Call function
            result = await self.pipeline._handle_pipeline_error(
                error, request, {}, {}
            )
            
            # Verify no storage cleanup
            self.pipeline.db_manager.delete_gcs_file.assert_not_called()
            
            # Verify result
            self.assertEqual(result.status, "failed")
        
        asyncio.run(run_test())


class TestUtilityMethods(unittest.TestCase):
    """Test utility methods in analysis pipeline."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.pipeline = self._create_mock_pipeline()
    
    def _create_mock_pipeline(self):
        """Create a mock pipeline with all dependencies."""
        return AnalysisPipeline(
            transcript_normalizer=Mock(),
            youtube_normalizer=Mock(),
            segmenter=Mock(),
            audio_processor=Mock(),
            section_processor=Mock(),
            meta_analyzer=Mock(),
            title_generator=Mock(),
            claim_processor=Mock(),
            briefing_generator=Mock(),
            db_manager=Mock(),
            token_tracker=Mock()
        )
    
    def test_convert_section_for_legacy(self):
        """Test converting SectionAnalysis to legacy format."""
        # Create mock section
        section = Mock()
        section.start_time = "00:00"
        section.end_time = "05:00"
        section.title = "Test Section"
        section.summary = "Test summary"
        section.quotes = ["Quote 1", "Quote 2"]
        section.entities = [
            Mock(name="Entity1", explanation="Explanation1"),
            Mock(name="Entity2", explanation="Explanation2")
        ]
        section.additional_data = {"extra": "data"}
        
        # Call function
        result = self.pipeline._convert_section_for_legacy(section)
        
        # Verify conversion
        self.assertEqual(result["start_time"], "00:00")
        self.assertEqual(result["end_time"], "05:00")
        self.assertEqual(result["generated_title"], "Test Section")
        self.assertEqual(result["1_sentence_summary"], "Test summary")
        self.assertEqual(result["notable_quotes"], ["Quote 1", "Quote 2"])
        self.assertEqual(len(result["entities"]), 2)
        self.assertEqual(result["entities"][0]["name"], "Entity1")
        self.assertEqual(result["extra"], "data")
    
    def test_convert_section_for_learning(self):
        """Test converting SectionAnalysis to learning format."""
        # Create mock section
        section = Mock()
        section.start_time = "00:00"
        section.end_time = "05:00"
        section.title = "Learning Module"
        section.summary = "Learning summary"
        section.quotes = ["Quote 1"]
        section.entities = [Mock(name="Concept1")]
        section.additional_data = {
            "learning_objectives": ["Objective 1"],
            "difficulty_level": "intermediate",
            "real_world_applications": ["Application 1"]
        }
        
        # Call function
        result = self.pipeline._convert_section_for_learning(section)
        
        # Verify conversion
        self.assertEqual(result["module_title"], "Learning Module")
        self.assertEqual(result["learning_objectives"], ["Objective 1"])
        self.assertEqual(result["core_concepts"], ["Concept1"])
        self.assertEqual(result["difficulty_level"], "intermediate")
        self.assertEqual(result["memorable_examples"], ["Quote 1"])
        self.assertEqual(result["real_world_applications"], ["Application 1"])
    
    @patch('pipeline.orchestrators.analysis_pipeline.Panel')
    def test_print_metrics(self, mock_panel):
        """Test metrics printing functionality."""
        timing_metrics = {
            "transcription_s": 30.5,
            "segmentation_s": 5.2,
            "total_job_s": 120.0
        }
        
        llm_metrics = {
            "llm_input_tokens": 1000,
            "llm_output_tokens": 500,
            "llm_calls": 10
        }
        
        cost_metrics = {
            "tavily_searches": 2,
            "assemblyai_audio_seconds": 60.0
        }
        
        internal_cost = 0.05
        
        # Call function
        self.pipeline._print_metrics(
            timing_metrics, llm_metrics, cost_metrics, internal_cost
        )
        
        # Verify Panel was called (metrics were printed)
        self.assertTrue(mock_panel.called)
        # Should be called multiple times for different metric panels
        self.assertGreaterEqual(mock_panel.call_count, 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)