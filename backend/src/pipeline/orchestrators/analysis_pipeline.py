"""
Main analysis pipeline orchestrator.
"""

import time
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from langchain_core.runnables import RunnableConfig
from rich import print
from rich.panel import Panel

from ..interfaces import (
    TranscriptNormalizer,
    TranscriptSegmenter,
    AudioProcessor,
    MetaAnalyzer,
    TitleGenerator,
    TranscriptUtterance,
    SectionAnalysis,
)
from ..services.enrichment import ClaimProcessor, ContextualBriefingGenerator
from ..config import get_persona_config, is_valid_persona
from .section_processor import SectionProcessor


def split_large_utterance(text: str, start_seconds: float, duration: float, speaker: str = None, max_chars: int = 500, min_duration: float = 1.0) -> List[Dict[str, Any]]:
    """
    Split a large utterance into smaller segments based on sentence boundaries.

    Args:
        text: The text to split
        start_seconds: Start time of the original utterance
        duration: Total duration of the original utterance
        speaker: Speaker identifier (optional)
        max_chars: Maximum characters per segment
        min_duration: Minimum duration per segment in seconds

    Returns:
        List of smaller transcript segments with proportional timing
    """
    import re

    # Split text into sentences using multiple delimiters
    sentences = re.split(r'[.!?]+\s+', text.strip())

    # Remove empty sentences and add back punctuation
    cleaned_sentences = []
    for i, sentence in enumerate(sentences):
        sentence = sentence.strip()
        if sentence:
            # Add back punctuation except for the last sentence (which might not have any)
            if i < len(sentences) - 1 or sentence[-1] not in '.!?':
                # Find the original punctuation in the text
                sentence_end_in_text = text.find(sentence) + len(sentence)
                if sentence_end_in_text < len(text) and text[sentence_end_in_text] in '.!?':
                    sentence += text[sentence_end_in_text]
                else:
                    sentence += '.'  # Default punctuation
            cleaned_sentences.append(sentence)

    if not cleaned_sentences:
        # Fallback: create a single segment if sentence splitting fails
        entry = {
            "start": start_seconds,
            "duration": duration,
            "text": text
        }
        if speaker:
            entry["speaker"] = speaker
        return [entry]

    # Group sentences into segments that don't exceed max_chars
    segments = []
    current_segment = ""
    current_sentences = []

    for sentence in cleaned_sentences:
        # Check if adding this sentence would exceed the limit
        test_segment = current_segment + (" " if current_segment else "") + sentence

        if len(test_segment) <= max_chars:
            current_segment = test_segment
            current_sentences.append(sentence)
        else:
            # Save current segment if it has content
            if current_segment:
                segments.append(current_segment)

            # Start new segment with current sentence
            current_segment = sentence
            current_sentences = [sentence]

    # Add final segment
    if current_segment:
        segments.append(current_segment)

    # If no segments were created, use the original text
    if not segments:
        segments = [text]

    # Calculate timing for each segment based on character count
    total_chars = sum(len(segment) for segment in segments)
    result_segments = []
    current_start = start_seconds

    for i, segment_text in enumerate(segments):
        # Calculate proportional duration based on character count
        char_ratio = len(segment_text) / total_chars if total_chars > 0 else 1.0 / len(segments)
        segment_duration = max(min_duration, duration * char_ratio)

        # Adjust the last segment to end exactly at the original end time
        if i == len(segments) - 1:
            segment_duration = (start_seconds + duration) - current_start
            segment_duration = max(min_duration, segment_duration)

        entry = {
            "start": round(current_start, 2),
            "duration": round(segment_duration, 2),
            "text": segment_text.strip()
        }

        if speaker:
            entry["speaker"] = speaker

        result_segments.append(entry)
        current_start += segment_duration

    return result_segments


def convert_structured_to_simple_transcript(structured_transcript: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Convert AssemblyAI structured transcript to simple transcript format.
    Converts from structured format with millisecond timing to simple format with second-based timing.
    Automatically splits oversized utterances into smaller, manageable segments.

    Args:
        structured_transcript: List of utterances from AssemblyAI

    Returns:
        List of simplified transcript segments with second-based timing
    """
    if not structured_transcript:
        return []

    simple_transcript = []
    MAX_DURATION_THRESHOLD = 30.0  # seconds
    MAX_CHARS_THRESHOLD = 500  # characters

    for utterance in structured_transcript:
        if not isinstance(utterance, dict):
            continue

        # Extract required fields - structured_transcript uses 'start', 'end', 'text', 'speaker'
        start_ms = utterance.get("start")
        end_ms = utterance.get("end")
        text = utterance.get("text", "").strip()
        speaker = utterance.get("speaker")

        # Skip if missing essential data
        if start_ms is None or end_ms is None or not text:
            continue

        # Convert milliseconds to seconds
        start_seconds = start_ms / 1000.0
        end_seconds = end_ms / 1000.0
        duration = end_seconds - start_seconds

        # Check if utterance is too large and needs splitting
        is_oversized = duration > MAX_DURATION_THRESHOLD or len(text) > MAX_CHARS_THRESHOLD

        if is_oversized:
            # Split large utterance into smaller segments
            split_segments = split_large_utterance(
                text=text,
                start_seconds=start_seconds,
                duration=duration,
                speaker=speaker,
                max_chars=MAX_CHARS_THRESHOLD
            )
            simple_transcript.extend(split_segments)
        else:
            # Use utterance as-is for normal-sized segments
            entry = {
                "start": round(start_seconds, 2),
                "duration": round(duration, 2),
                "text": text
            }

            # Add speaker if present (optional field)
            if speaker:
                entry["speaker"] = speaker

            simple_transcript.append(entry)

    return simple_transcript


@dataclass
class AnalysisRequest:
    """Request for pipeline analysis."""

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
class AnalysisResult:
    """Result of pipeline analysis."""

    job_id: str
    status: str
    final_title: str
    sections_processed: int
    cost_metrics: Dict[str, Any]
    timing_metrics: Dict[str, float]
    synthesis_results: Dict[str, Any]
    error_message: Optional[str] = None


class AnalysisPipeline:
    """Main orchestrator for the analysis pipeline."""

    def __init__(
        self,
        transcript_normalizer: TranscriptNormalizer,
        youtube_normalizer: TranscriptNormalizer,
        segmenter: TranscriptSegmenter,
        audio_processor: AudioProcessor,
        section_processor: SectionProcessor,
        meta_analyzer: MetaAnalyzer,
        title_generator: TitleGenerator,
        claim_processor: ClaimProcessor,
        briefing_generator: ContextualBriefingGenerator,
        db_manager,
        token_tracker,
    ):
        self.transcript_normalizer = transcript_normalizer
        self.youtube_normalizer = youtube_normalizer
        self.segmenter = segmenter
        self.audio_processor = audio_processor
        self.section_processor = section_processor
        self.meta_analyzer = meta_analyzer
        self.title_generator = title_generator
        self.claim_processor = claim_processor
        self.briefing_generator = briefing_generator
        self.db_manager = db_manager
        self.token_tracker = token_tracker
        self._cached_youtube_metadata = {}

    async def run_analysis(self, request: AnalysisRequest) -> AnalysisResult:
        """
        Execute the complete analysis pipeline.
        """
        total_start_time = time.monotonic()
        timing_metrics = {}
        final_cost_metrics = {"tavily_searches": 0, "assemblyai_audio_seconds": 0}

        # Validate persona
        if not is_valid_persona(request.persona):
            raise ValueError(f"Invalid persona: {request.persona}")

        persona_config = get_persona_config(request.persona)

        print(
            Panel(
                f"[bold cyan]🚀 Analysis Pipeline Started[/bold cyan]\n"
                f"[white]Job ID: {request.job_id}[/white]\n"
                f"[bold]Persona:[/bold] [yellow]{request.persona}[/yellow]",
                border_style="cyan",
                expand=False,
            )
        )

        self.db_manager.log_progress(
            request.user_id,
            request.job_id,
            f"Analysis initiated with '{request.persona}' persona...",
        )

        try:
            # Step 1: Verify job status and setup
            job_doc = self.db_manager.get_job_status(request.user_id, request.job_id)
            if not job_doc:
                raise ValueError(
                    f"Job {request.job_id} not found for user {request.user_id}"
                )

            if job_doc.get("status") != "QUEUED":
                print(
                    f"[bold yellow]Job has status '{job_doc.get('status')}'. Skipping.[/bold yellow]"
                )
                return AnalysisResult(
                    job_id=request.job_id,
                    status="skipped",
                    final_title="",
                    sections_processed=0,
                    cost_metrics=final_cost_metrics,
                    timing_metrics=timing_metrics,
                    synthesis_results={},
                )

            self.db_manager.update_job_status(
                request.user_id,
                request.job_id,
                "PROCESSING",
                "Step 2/7: Preparing transcript...",
            )

            # Step 2: Input acquisition and normalization
            canonical_transcript = await self._process_input(
                request, final_cost_metrics, timing_metrics, total_start_time
            )

            if not canonical_transcript:
                raise ValueError("Failed to produce a usable transcript")

            # Step 3: Segmentation
            sections = await self._segment_transcript(
                canonical_transcript, request, timing_metrics
            )

            # Step 4: Section analysis
            runnable_config = RunnableConfig(callbacks=[self.token_tracker])
            section_results = await self._analyze_sections(
                sections, request, runnable_config, final_cost_metrics
            )

            all_section_analyses = [
                result.full_analysis
                for result in section_results
                if result.full_analysis
            ]

            # Step 5: Meta-analysis
            pass_2_data = await self._perform_meta_analysis(
                all_section_analyses, request, runnable_config, timing_metrics
            )

            # Step 7: Generate final title and update with metadata
            final_title = await self.title_generator.generate_title(
                pass_2_data, runnable_config
            )
            
            # Update job with title and metadata (including YouTube metadata if available)
            if self._cached_youtube_metadata and any(self._cached_youtube_metadata.values()):
                # Ensure analysis_persona is set
                self._cached_youtube_metadata['analysis_persona'] = request.persona
                self.db_manager.update_job_with_metadata(
                    request.user_id, request.job_id, final_title, self._cached_youtube_metadata
                )
            else:
                self.db_manager.update_job_title(request.user_id, request.job_id, final_title)

            # Step 8: Generate content assets
            await self._generate_content_assets(
                all_section_analyses,
                pass_2_data,
                request,
                runnable_config,
                timing_metrics,
            )

            # Step 9: Finalize metrics and complete job
            await self._finalize_job(
                request,
                final_cost_metrics,
                timing_metrics,
                len(sections),
                total_start_time,
            )

            return AnalysisResult(
                job_id=request.job_id,
                status="completed",
                final_title=final_title,
                sections_processed=len(sections),
                cost_metrics=final_cost_metrics,
                timing_metrics=timing_metrics,
                synthesis_results=pass_2_data,
            )

        except Exception as e:
            return await self._handle_pipeline_error(
                e, request, final_cost_metrics, timing_metrics
            )

    async def _process_input(
        self,
        request: AnalysisRequest,
        cost_metrics: Dict[str, int],
        timing_metrics: Dict[str, float],
        start_time: float,
    ) -> List[TranscriptUtterance]:
        """Process input and normalize to canonical format."""

        if request.transcript_id:
            # YouTube transcript processing
            print(f"INFO: Processing YouTube transcript (ID: {request.transcript_id})")
            self.db_manager.log_progress(
                request.user_id, request.job_id, "Fetching cached YouTube transcript..."
            )

            cached_data = self.db_manager.get_cached_transcript(request.transcript_id)
            if not cached_data:
                raise ValueError(
                    f"Cached transcript for ID {request.transcript_id} not found"
                )

            raw_youtube_transcript = cached_data.get("structured_transcript")
            
            # Store cached YouTube metadata for later use
            self._cached_youtube_metadata = {
                'youtube_title': cached_data.get('youtube_title', ''),
                'youtube_channel_name': cached_data.get('youtube_channel_name', ''),
                'youtube_thumbnail_url': cached_data.get('youtube_thumbnail_url', ''),
                'youtube_duration': cached_data.get('youtube_duration', ''),
                'analysis_persona': request.persona
            }
            
            # Save the original YouTube transcript to the job
            if request.transcript_id or request.storage_path:
                self.db_manager.update_job_status(
                    request.user_id,
                    request.job_id,
                    "PROCESSING",
                    "Step 2/7: Preparing transcript...",
                    transcript=raw_youtube_transcript
                )

            if isinstance(raw_youtube_transcript, list):
                return await self.youtube_normalizer.normalize(raw_youtube_transcript)
            elif isinstance(raw_youtube_transcript, str):
                return await self.transcript_normalizer.normalize(
                    raw_youtube_transcript
                )
            else:
                raise ValueError("Invalid cached transcript format")

        elif request.storage_path:
            # Audio file processing
            self.db_manager.update_job_status(
                request.user_id,
                request.job_id,
                "PROCESSING",
                "Step 2/7: Transcribing audio file...",
            )

            transcription_result = await self.audio_processor.transcribe(
                request.storage_path, request.model_choice
            )

            if transcription_result:
                audio_duration = transcription_result.get("audio_duration", 0)
                if audio_duration:
                    cost_metrics["assemblyai_audio_seconds"] = audio_duration

            # Convert AssemblyAI utterances to simple transcript format
            utterances = transcription_result.get("utterances", [])
            simple_transcript = convert_structured_to_simple_transcript(utterances)

            # Save the converted transcript in simple format
            self.db_manager.update_job_status(
                request.user_id,
                request.job_id,
                "PROCESSING",
                "Step 2/7: Transcribing audio file...",
                transcript=simple_transcript
            )

            # Convert AssemblyAI format to canonical
            utterances = transcription_result.get("utterances", [])
            canonical_transcript = []

            for utt in utterances:
                canonical_transcript.append(
                    TranscriptUtterance(
                        speaker_id=f"Speaker {utt.get('speaker', 'A')}",
                        start_seconds=utt.get("start", 0) // 1000,
                        end_seconds=utt.get("end", 0) // 1000,
                        text=utt.get("text", ""),
                    )
                )

            timing_metrics["transcription_s"] = time.monotonic() - start_time
            return canonical_transcript

        else:
            # Text input processing
            self.db_manager.update_job_status(
                request.user_id,
                request.job_id,
                "PROCESSING",
                "Step 2/7: Processing text input...",
            )

            if not request.raw_transcript:
                # Enhanced error message with more context
                error_msg = (
                    f"No text input provided for job {request.job_id}. "
                    f"raw_transcript is {type(request.raw_transcript)} with length "
                    f"{len(request.raw_transcript) if request.raw_transcript else 0}"
                )
                print(f"[ERROR] {error_msg}")
                raise ValueError("No input provided")

            # Additional check for empty lists
            if isinstance(request.raw_transcript, list) and len(request.raw_transcript) == 0:
                error_msg = f"Empty transcript list provided for job {request.job_id}"
                print(f"[ERROR] {error_msg}")
                raise ValueError("Empty transcript list provided")

            # Save the original text transcript to the job at root level for consistency
            self.db_manager.update_job_status(
                request.user_id,
                request.job_id,
                "PROCESSING",
                "Step 2/7: Processing text input...",
                transcript=request.raw_transcript
            )

            # Handle both string and list formats for raw_transcript
            if isinstance(request.raw_transcript, list):
                # Check if it's a structured transcript with timing data (paste with timestamps)
                has_timing_data = (
                    len(request.raw_transcript) > 0 and
                    isinstance(request.raw_transcript[0], dict) and
                    'start' in request.raw_transcript[0] and
                    'text' in request.raw_transcript[0] and
                    request.raw_transcript[0].get('start', -1) >= 0
                )

                if has_timing_data:
                    # Use YouTube normalizer for structured transcript with timing data
                    print(f"[INFO] Processing structured transcript with timing data ({len(request.raw_transcript)} entries)")
                    print("[cyan]Routing paste content through YouTube normalizer for timestamp preservation[/cyan]")
                    return await self.youtube_normalizer.normalize(request.raw_transcript)
                else:
                    # If it's a structured transcript without timing, extract text content
                    print(f"[INFO] Processing structured transcript without timing data ({len(request.raw_transcript)} entries)")
                    # Extract text from structured format and join
                    text_parts = []
                    for entry in request.raw_transcript:
                        if isinstance(entry, dict) and 'text' in entry:
                            text_parts.append(entry['text'])
                        elif isinstance(entry, str):
                            text_parts.append(entry)
                    corrected_text = ' '.join(text_parts)
            else:
                # Handle string format (legacy or fallback)
                print(f"[INFO] Processing string transcript (length: {len(request.raw_transcript)})")
                # Un-escape newlines and normalize
                corrected_text = request.raw_transcript.replace("\\\\n", "\\n")

            # For non-timestamped content, verify we have valid text content and use text normalizer
            if not corrected_text.strip():
                error_msg = f"No valid text content found in transcript for job {request.job_id}"
                print(f"[ERROR] {error_msg}")
                raise ValueError("No valid text content found in transcript")

            return await self.transcript_normalizer.normalize(corrected_text)

    async def _segment_transcript(
        self,
        transcript: List[TranscriptUtterance],
        request: AnalysisRequest,
        timing_metrics: Dict[str, float],
    ):
        """Segment the normalized transcript."""
        start_time = time.monotonic()

        self.db_manager.log_progress(
            request.user_id, request.job_id, "Step 4/7: Segmenting transcript..."
        )

        # Determine segmentation strategy
        sections = self.segmenter.segment(transcript)

        timing_metrics["segmentation_s"] = time.monotonic() - start_time
        self.db_manager.log_progress(
            request.user_id,
            request.job_id,
            f"✓ Transcript segmented into {len(sections)} sections.",
        )

        return sections

    async def _analyze_sections(
        self,
        sections,
        request: AnalysisRequest,
        runnable_config: RunnableConfig,
        cost_metrics: Dict[str, int],
    ):
        """Analyze all sections in parallel."""
        log_msg = f"Step 5/7: Analyzing {len(sections)} sections in parallel..."
        print(f"[magenta]\n{log_msg}[/magenta]")
        self.db_manager.update_job_status(
            request.user_id, request.job_id, "PROCESSING", log_msg
        )

        start_time = time.monotonic()

        # Set appropriate transcript for timestamp extraction (deep dive persona only)
        if hasattr(self.section_processor, 'persona') and self.section_processor.persona == "deep_dive":
            try:
                # Get the job document to retrieve transcript data and source type
                job_doc = self.db_manager.get_job_status(request.user_id, request.job_id)
                source_type = job_doc.get("request_data", {}).get("source_type", "unknown")
                
                print(f"[blue]Setting structured transcript for timestamp extraction (source_type: {source_type})...[/blue]")
                
                # All source types now use structured transcript format
                # Try structured_transcript field first, then transcript field
                structured_transcript = job_doc.get("structured_transcript")
                transcript_source = "structured_transcript"
                
                if not structured_transcript:
                    structured_transcript = job_doc.get("transcript")
                    transcript_source = "transcript"
                
                if structured_transcript and isinstance(structured_transcript, list):
                    print(f"[blue]Setting structured transcript from '{transcript_source}' field ({len(structured_transcript)} entries)[/blue]")
                    self.section_processor.set_structured_transcript(structured_transcript)
                else:
                    print(f"[yellow]No structured transcript found for {source_type} source[/yellow]")
                
                # Debug: show what fields are available if nothing worked
                if not (hasattr(self.section_processor, 'structured_transcript') and self.section_processor.structured_transcript):
                    available_fields = list(job_doc.keys()) if job_doc else []
                    print(f"[yellow]No structured transcript found. Available job document fields: {available_fields}[/yellow]")
                    if "transcript" in job_doc:
                        transcript_type = type(job_doc["transcript"]).__name__
                        print(f"[yellow]Transcript field type: {transcript_type}[/yellow]")
                        
            except Exception as e:
                print(f"[yellow]Warning: Could not set transcript for timestamp extraction: {e}[/yellow]")

        section_results = await self.section_processor.process_sections_parallel(
            sections, request.user_id, request.job_id, runnable_config
        )

        # Aggregate cost metrics
        for result in section_results:
            if result.cost_metrics:
                for key, value in result.cost_metrics.items():
                    cost_metrics[key] = cost_metrics.get(key, 0) + value

        return section_results

    async def _perform_meta_analysis(
        self,
        all_sections: List[SectionAnalysis],
        request: AnalysisRequest,
        runnable_config: RunnableConfig,
        timing_metrics: Dict[str, float],
    ) -> Dict[str, Any]:
        """Perform meta-analysis based on persona."""
        if not all_sections:
            return {}

        start_time = time.monotonic()

        # Fetch original transcript for timestamp matching
        original_transcript = None
        try:
            job_doc = self.db_manager.get_job_status(request.user_id, request.job_id)
            if job_doc:
                # Try multiple locations for transcript data
                # 1. First try request_data (for some job types)
                if "request_data" in job_doc:
                    request_data = job_doc["request_data"]
                    original_transcript = request_data.get("transcript")

                # 2. Fallback to root level transcript (your case)
                if not original_transcript:
                    original_transcript = job_doc.get("transcript")

                # 3. Fallback to structured_transcript field
                if not original_transcript:
                    original_transcript = job_doc.get("structured_transcript")

                if original_transcript:
                    transcript_type = type(original_transcript).__name__
                    transcript_length = len(original_transcript) if isinstance(original_transcript, list) else 'unknown'
                    print(f"[blue]Found transcript source: {transcript_type} with {transcript_length} entries[/blue]")
                else:
                    print(f"[yellow]No transcript found in any location[/yellow]")

        except Exception as e:
            print(f"[yellow]Warning: Could not fetch original transcript: {e}[/yellow]")

        if request.persona == "consultant":
            try:
                synthesis_results = await self.meta_analyzer.perform_synthesis(
                    all_sections, runnable_config
                )
                
                if not synthesis_results:
                    print("[bold yellow]Warning: Empty synthesis results for consultant persona[/bold yellow]")
                    self.db_manager.log_progress(
                        request.user_id, request.job_id, 
                        "Warning: Empty synthesis results from meta-analyzer"
                    )

                self.db_manager.db.collection(
                    f"saas_users/{request.user_id}/jobs"
                ).document(request.job_id).update({"synthesis_results": synthesis_results})
                
                print(f"[green]✓ Saved consultant synthesis results with {len(synthesis_results)} keys[/green]")
                timing_metrics["synthesis_pass_s"] = time.monotonic() - start_time
                return synthesis_results
            except Exception as e:
                print(f"[bold red]Error in consultant synthesis: {e}[/bold red]")
                self.db_manager.log_progress(
                    request.user_id, request.job_id, 
                    f"Error in consultant synthesis: {e}"
                )
                return {}


        elif request.persona == "deep_dive":
            try:
                # Pass original transcript to the synthesizer for timestamp matching
                deep_dive_synthesis = await self.meta_analyzer.perform_synthesis(
                    all_sections, runnable_config, original_transcript
                )
                
                if not deep_dive_synthesis:
                    print("[bold yellow]Warning: Empty synthesis results for deep_dive persona[/bold yellow]")
                    self.db_manager.log_progress(
                        request.user_id, request.job_id, 
                        "Warning: Empty synthesis results from deep dive analyzer"
                    )

                # Handle deep dive quiz format similar to learning accelerator
                quiz_questions = deep_dive_synthesis.get("quiz_questions", [])
                open_ended_questions = deep_dive_synthesis.get("open_ended_questions", [])
                multi_quiz_data = deep_dive_synthesis.get("multi_quiz_data", {})
                generation_method = deep_dive_synthesis.get("generation_method", "deep_dive_focused")
                
                quiz_data = {
                    "quiz_metadata": {
                        "total_questions": len(quiz_questions),
                        "total_open_ended_questions": len(open_ended_questions),
                        "estimated_time_minutes": len(quiz_questions) * 2 + len(open_ended_questions) * 5,
                        "difficulty_distribution": {"easy": 1, "medium": 2, "hard": 0},
                        "source": "deep_dive_analysis"
                    },
                    "questions": quiz_questions,
                    "open_ended_questions": open_ended_questions,
                    "quiz_type": "deep_dive_focused",
                    "generation_method": generation_method
                }

                self.db_manager.db.collection(
                    f"saas_users/{request.user_id}/jobs"
                ).document(request.job_id).update(
                    {"generated_quiz_questions": quiz_data}
                )
                
                print(f"[green]✓ Saved deep dive quiz with {len(quiz_data['questions'])} questions and {len(quiz_data.get('open_ended_questions', []))} open-ended questions[/green]")
                timing_metrics["deep_dive_synthesis_s"] = time.monotonic() - start_time
                return deep_dive_synthesis
            except Exception as e:
                print(f"[bold red]Error in deep dive synthesis: {e}[/bold red]")
                self.db_manager.log_progress(
                    request.user_id, request.job_id, 
                    f"Error in deep dive synthesis: {e}"
                )
                return {}

        elif request.persona == "general":
            try:
                argument_results = await self.meta_analyzer.generate_argument_structure(
                    all_sections, runnable_config
                )
                
                if not argument_results:
                    print("[bold yellow]Warning: Empty argument structure results for general persona[/bold yellow]")
                    self.db_manager.log_progress(
                        request.user_id, request.job_id, 
                        "Warning: Empty argument structure results"
                    )

                self.db_manager.db.collection(
                    f"saas_users/{request.user_id}/jobs"
                ).document(request.job_id).update({"argument_structure": argument_results})
                
                print(f"[green]✓ Saved general persona argument structure with {len(argument_results)} keys[/green]")
                timing_metrics["argument_analysis_s"] = time.monotonic() - start_time
                return argument_results
            except Exception as e:
                print(f"[bold red]Error in general persona argument analysis: {e}[/bold red]")
                self.db_manager.log_progress(
                    request.user_id, request.job_id, 
                    f"Error in general persona argument analysis: {e}"
                )
                return {}

        return {}

    async def _generate_global_briefing(
        self,
        all_sections: List[SectionAnalysis],
        pass_2_data: Dict[str, Any],
        request: AnalysisRequest,
        runnable_config: RunnableConfig,
        cost_metrics: Dict[str, int],
        timing_metrics: Dict[str, float],
    ):
        """Generate global contextual briefing."""
        log_msg = "Step 5b: Generating Global Contextual Briefing..."
        print(f"[magenta]\n{log_msg}[/magenta]")
        self.db_manager.log_progress(request.user_id, request.job_id, log_msg)

        start_time = time.monotonic()

        # Global briefing generation would go here if needed

        # Generate the briefing
        # Note: This would need to be implemented in the briefing generator
        # For now, keeping compatibility with existing implementation

        timing_metrics["global_briefing_s"] = time.monotonic() - start_time

    async def _generate_content_assets(
        self,
        all_sections: List[SectionAnalysis],
        synthesis_data: Dict[str, Any],
        request: AnalysisRequest,
        runnable_config: RunnableConfig,
        timing_metrics: Dict[str, float],
    ):
        """Generate final content assets."""
        log_msg = "Step 6/7: Generating final content assets..."
        print(f"[magenta]\n{log_msg}[/magenta]")
        self.db_manager.update_job_status(
            request.user_id, request.job_id, "PROCESSING", log_msg
        )

        start_time = time.monotonic()
        persona_config = get_persona_config(request.persona)


        timing_metrics["content_generation_s"] = time.monotonic() - start_time

    async def _finalize_job(
        self,
        request: AnalysisRequest,
        cost_metrics: Dict[str, int],
        timing_metrics: Dict[str, float],
        sections_count: int,
        start_time: float,
    ):
        """Finalize job with metrics and status updates."""
        log_msg = "Step 7/7: Finalizing results and logging analytics..."
        print(f"[magenta]\n{log_msg}[/magenta]")
        self.db_manager.update_job_status(
            request.user_id, request.job_id, "PROCESSING", log_msg
        )

        finalization_start = time.monotonic()
        timing_metrics["finalization_s"] = time.monotonic() - finalization_start
        timing_metrics["total_job_s"] = time.monotonic() - start_time

        # Calculate costs and create usage record
        final_llm_metrics = self.token_tracker.get_metrics()
        from ..config.constants import (
            LLM_INPUT_TOKEN_COST,
            LLM_OUTPUT_TOKEN_COST,
            TAVILY_SEARCH_COST,
            ASSEMBLYAI_PER_SECOND_COST,
        )

        internal_cost_usd = (
            (final_llm_metrics.get("llm_input_tokens", 0) * LLM_INPUT_TOKEN_COST)
            + (final_llm_metrics.get("llm_output_tokens", 0) * LLM_OUTPUT_TOKEN_COST)
            + (cost_metrics.get("tavily_searches", 0) * TAVILY_SEARCH_COST)
            + (
                cost_metrics.get("assemblyai_audio_seconds", 0)
                * ASSEMBLYAI_PER_SECOND_COST
            )
        )

        usage_record = {
            "userId": request.user_id,
            "jobId": request.job_id,
            "type": "audio" if request.storage_path else "text",
            "persona": request.persona,
            "internalCostUSD": round(internal_cost_usd, 6),
            "totalCompletionSeconds": round(timing_metrics["total_job_s"], 2),
            "timingBreakdownSeconds": {
                key.replace("_s", ""): round(value, 2)
                for key, value in timing_metrics.items()
                if key != "total_job_s"
            },
            "breakdown": {
                **final_llm_metrics,
                **cost_metrics,
            },
        }

        self.db_manager.create_usage_record(
            request.user_id, request.job_id, usage_record
        )

        # Update final status
        self.db_manager.update_job_status(
            request.user_id,
            request.job_id,
            "COMPLETED",
            f"Analysis of {sections_count} sections complete.",
        )
        self.db_manager.log_progress(
            request.user_id, request.job_id, "✅ Analysis Complete."
        )

        # Print performance metrics
        self._print_metrics(
            timing_metrics,
            final_llm_metrics,
            cost_metrics,
            internal_cost_usd,
            request.persona,
        )

    async def _handle_pipeline_error(
        self,
        error: Exception,
        request: AnalysisRequest,
        cost_metrics: Dict[str, int],
        timing_metrics: Dict[str, float],
    ) -> AnalysisResult:
        """Handle pipeline errors with proper cleanup."""
        error_message = f"Analysis failed: {str(error)}"
        print(
            Panel(
                f"[bold red]❌ ERROR for Job ID: {request.job_id}[/bold red]\n{error_message}",
                border_style="red",
            )
        )

        self.db_manager.update_job_status(
            request.user_id, request.job_id, "FAILED", error_message
        )
        self.db_manager.log_progress(
            request.user_id, request.job_id, f"❌ Analysis Failed: {error_message}"
        )

        # Issue refund
        print(f"[yellow]Issuing refund for job {request.job_id}...[/yellow]")
        self.db_manager.refund_analysis_credit(request.user_id)

        # Cleanup storage if needed
        if request.storage_path:
            print("[cyan]Cleaning up source file...[/cyan]")
            self.db_manager.delete_gcs_file(request.storage_path)

        return AnalysisResult(
            job_id=request.job_id,
            status="failed",
            final_title="",
            sections_processed=0,
            cost_metrics=cost_metrics,
            timing_metrics=timing_metrics,
            synthesis_results={},
            error_message=error_message,
        )

    def _convert_section_for_legacy(self, section: SectionAnalysis) -> Dict:
        """Convert SectionAnalysis to legacy format for existing features."""
        return {
            "start_time": section.start_time,
            "end_time": section.end_time,
            "generated_title": section.title,
            "1_sentence_summary": section.summary,
            "notable_quotes": section.quotes,
            "entities": [
                {"name": e.name, "explanation": e.explanation} for e in section.entities
            ],
            **section.additional_data,
        }


    def _print_metrics(
        self,
        timing_metrics: Dict[str, float],
        llm_metrics: Dict[str, int],
        cost_metrics: Dict[str, int],
        internal_cost: float,
        persona: str = None,
        synthesis_data: Dict[str, Any] = None,
    ):
        """Print performance and cost metrics."""
        # Print timing metrics
        timing_lines = [
            f"  - {key.replace('_s', '').replace('_', ' ').capitalize():<30}: {value:.2f}s"
            for key, value in timing_metrics.items()
            if key != "total_job_s"
        ] + [
            "-" * 40,
            f"  - {'Total job time':<30}: {timing_metrics.get('total_job_s', 0):.2f}s",
        ]

        print(
            Panel(
                "\n".join(timing_lines),
                title="[bold yellow]⏱️ Performance Metrics[/bold yellow]",
                border_style="yellow",
                expand=False,
            )
        )

        # Print cost metrics
        cost_lines = [
            f"  - {'LLM Input Tokens':<30}: {llm_metrics.get('llm_input_tokens', 0):,}",
            f"  - {'LLM Output Tokens':<30}: {llm_metrics.get('llm_output_tokens', 0):,}",
            f"  - {'Total LLM Requests':<30}: {llm_metrics.get('llm_calls', 0)}",
            f"  - {'Tavily Searches':<30}: {cost_metrics.get('tavily_searches', 0)}",
            f"  - {'AssemblyAI Audio':<30}: {cost_metrics.get('assemblyai_audio_seconds', 0):.2f}s",
            "-" * 40,
            f"  - {'Estimated Internal Cost':<30}: ${internal_cost:.6f}",
        ]

        print(
            Panel(
                "\n".join(cost_lines),
                title="[bold green]💰 Cost & Usage Metrics[/bold green]",
                border_style="green",
                expand=False,
            )
        )


        print(
            Panel(
                f"[bold green]✅ Analysis Pipeline Complete[/bold green]",
                border_style="green",
            )
        )

