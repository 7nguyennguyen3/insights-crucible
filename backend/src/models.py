from pydantic import BaseModel, model_validator, Field, field_validator
from typing import List, Dict, Any, Optional


class FeatureConfig(BaseModel):
    analysis_persona: str = "general"


class AnalysisRequest(BaseModel):
    user_id: str

    # --- IMPROVEMENT: Use the specific FeatureConfig model ---
    # This ensures the config object always has the correct structure.
    # `default_factory` creates a new FeatureConfig with its defaults if none is provided.
    config: FeatureConfig = Field(default_factory=FeatureConfig)

    # --- NEW: Add the optional model_choice field with a default ---
    model_choice: str = "universal"

    # Optional fields for different job types
    totalCost: Optional[float] = None  # Cost calculation from frontend
    transcript: Optional[str] = None
    duration_seconds: Optional[float] = None  # For audio estimates
    storagePath: Optional[str] = None  # For audio processing
    transcript_id: Optional[str] = None
    
    # Source metadata fields
    source_type: Optional[str] = None  # "youtube", "upload", "paste"
    youtube_url: Optional[str] = None
    youtube_video_title: Optional[str] = None
    youtube_channel_name: Optional[str] = None
    youtube_duration: Optional[str] = None
    youtube_thumbnail_url: Optional[str] = None
    audio_filename: Optional[str] = None

    @field_validator("model_choice")
    @classmethod
    def validate_model_choice(cls, v: str) -> str:
        """Ensures that only supported models can be chosen."""
        supported_models = {"universal", "slam-1", "nano"}
        if v not in supported_models:
            raise ValueError(
                f"'{v}' is not a supported model. Choose from: {supported_models}"
            )
        return v

    @field_validator("source_type")
    @classmethod
    def validate_source_type(cls, v: Optional[str]) -> Optional[str]:
        """Ensures that only supported source types can be chosen."""
        if v is None:
            return v
        supported_source_types = {"youtube", "upload", "paste"}
        if v not in supported_source_types:
            raise ValueError(
                f"'{v}' is not a supported source type. Choose from: {supported_source_types}"
            )
        return v

    @model_validator(mode="before")
    @classmethod
    def check_exclusive_inputs(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # ✅ ADD 'transcript_id' TO THIS LIST
            inputs_provided = sum(
                1
                for key in [
                    "transcript",
                    "duration_seconds",
                    "storagePath",
                    "transcript_id",
                ]
                if key in data and data.get(key)
            )

            if inputs_provided == 0:
                raise ValueError(
                    "A valid input (transcript, duration_seconds, storagePath, or transcript_id) is required."
                )
            if inputs_provided > 1:
                raise ValueError(
                    "Please provide only one input type: transcript, duration_seconds, storagePath, or transcript_id."
                )
        return data


# --- NEW: Request models for status and results ---
class JobRequest(BaseModel):
    user_id: str
    job_id: str


class ProcessResponse(BaseModel):
    job_id: str
    status: str
    message: str


class StatusResponse(BaseModel):
    job_id: str
    status: str
    progress: Optional[str] = None


class ResultsResponse(BaseModel):
    job_id: str
    status: str
    job_title: str = "Untitled Analysis"
    transcript: Optional[str] = None  # Add this field
    results: Optional[List[Dict[str, Any]]] = None


class RenameJobRequest(BaseModel):
    user_id: str
    job_id: str
    new_title: str


class BulkAnalysisItem(BaseModel):
    """
    Represents a single item within a bulk analysis request.
    Each item must have either a transcript or a storagePath.
    """

    transcript: Optional[str] = None
    storagePath: Optional[str] = None

    # A unique ID provided by the client to help them track this specific item.
    client_provided_id: Optional[str] = Field(
        None, description="A client-side identifier for tracking."
    )
    
    # Source metadata fields for bulk items
    source_type: Optional[str] = None  # "youtube", "upload", "paste"
    youtube_url: Optional[str] = None
    youtube_video_title: Optional[str] = None
    youtube_channel_name: Optional[str] = None
    youtube_duration: Optional[str] = None
    youtube_thumbnail_url: Optional[str] = None
    audio_filename: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def check_exclusive_inputs(cls, data: Any) -> Any:
        """Ensures each item in the bulk request has exactly one input type."""
        if isinstance(data, dict):
            inputs_provided = sum(
                1
                for key in ["transcript", "storagePath"]
                if key in data and data.get(key)
            )
            if inputs_provided != 1:
                raise ValueError(
                    "Each item must have exactly one input: 'transcript' or 'storagePath'."
                )
        return data


class BulkAnalysisRequest(BaseModel):
    """
    Defines the overall structure for a bulk processing request.
    It includes a list of items and a shared configuration that applies to all of them.
    """

    user_id: str
    items: List[BulkAnalysisItem]

    # The config and model_choice apply to all items in the batch.
    config: FeatureConfig = Field(default_factory=FeatureConfig)
    model_choice: str = "universal"
    
    # Source metadata fields for bulk requests
    source_type: Optional[str] = None  # "youtube", "upload", "paste"
    file_metadata: Optional[List[Dict[str, Any]]] = None  # For file uploads with names and durations

    @field_validator("model_choice")
    @classmethod
    def validate_model_choice(cls, v: str) -> str:
        """Re-uses the same validation logic as the single AnalysisRequest."""
        supported_models = {"universal", "slam-1", "nano"}
        if v not in supported_models:
            raise ValueError(
                f"'{v}' is not a supported model. Choose from: {supported_models}"
            )
        return v


class BulkProcessResponseItem(BaseModel):
    """
    Represents the result for a single item that was part of a bulk request.
    """

    job_id: str
    status: str
    client_provided_id: Optional[str] = (
        None  # Echoes back the client's ID for easy mapping.
    )


class BulkProcessResponse(BaseModel):
    """
    The response sent back to the user after submitting a bulk request.
    It contains a master 'batch_id' for tracking the entire group.
    """

    batch_id: str
    jobs: List[BulkProcessResponseItem]
    message: str


class TranscriptDetailRequest(BaseModel):
    video_id: str


class TranscriptDetailResponse(BaseModel):
    transcript_id: str
    character_count: int
    title: str


# --- NEW: Enhanced Quiz Models for Multi-Quiz Support ---

class QuizQuestion(BaseModel):
    """Individual quiz question with metadata."""
    question_id: str
    question: str
    options: List[str]  # 4 answer choices
    correct_answer: str  # A, B, C, or D
    explanation: str
    supporting_quote: str
    related_timestamp: str
    source_section: Optional[int] = None
    difficulty: str = "medium"
    quiz_number: Optional[int] = None
    section_range: Optional[str] = None


class QuizMetadata(BaseModel):
    """Metadata for a single quiz."""
    quiz_number: int
    section_range: str
    total_questions: int
    estimated_time_minutes: int
    difficulty_distribution: Dict[str, int]
    source_sections: List[int]
    concepts_covered: int


# --- Open-Ended Quiz Models ---

class OpenEndedQuestion(BaseModel):
    """Open-ended question for deeper learning assessment."""
    question: str


class SingleQuiz(BaseModel):
    """Individual quiz with its questions and metadata."""
    quiz_questions: List[QuizQuestion]
    quiz_metadata: QuizMetadata


class MultiQuizResponse(BaseModel):
    """Response model for multiple quiz generation."""
    quiz_questions: List[QuizQuestion]  # All questions combined (backward compatibility)
    open_ended_questions: List[OpenEndedQuestion] = []  # Open-ended questions for deeper learning
    quizzes: List[SingleQuiz]  # New multi-quiz structure
    quiz_metadata: Dict[str, Any]  # Overall metadata for all quizzes


class LegacyQuizResponse(BaseModel):
    """Legacy quiz response format for backward compatibility."""
    quiz_metadata: Dict[str, Any]
    questions: List[Dict[str, Any]]
    quiz_type: str = "knowledge_testing"


class OpenEndedSubmission(BaseModel):
    """User submission for open-ended question (now stored in job subcollection)."""
    user_id: str
    job_id: str
    question_id: str
    user_answer: str
    submitted_at: Optional[str] = None


class GradingJob(BaseModel):
    """DEPRECATED: Legacy grading job model for backward compatibility."""
    user_id: str
    submission_id: str
    status: str  # PENDING, PROCESSING, COMPLETED, FAILED
    created_at: Optional[str] = None
    completed_at: Optional[str] = None


class GradingResult(BaseModel):
    """Result of AI grading for open-ended response."""
    score: float  # 0.0 to 1.0
    feedback: str
    strengths: List[str]
    improvements: List[str]
    completeness: float  # 0.0 to 1.0
    accuracy: float  # 0.0 to 1.0