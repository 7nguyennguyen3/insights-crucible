from pydantic import BaseModel, model_validator, Field, field_validator
from typing import List, Dict, Any, Optional


class FeatureConfig(BaseModel):
    run_contextual_briefing: bool = False
    run_x_thread_generation: bool = False
    run_blog_post_generation: bool = False
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
    transcript: Optional[str] = None
    duration_seconds: Optional[float] = None  # For audio estimates
    storagePath: Optional[str] = None  # For audio processing

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

    @model_validator(mode="before")
    @classmethod
    def check_exclusive_inputs(cls, data: Any) -> Any:
        """
        Your existing validator is excellent. It ensures that exactly one
        of the primary input types is provided. No changes needed here.
        """
        if isinstance(data, dict):
            inputs_provided = sum(
                1
                for key in ["transcript", "duration_seconds", "storagePath"]
                if key in data and data.get(key)
            )

            if inputs_provided == 0:
                raise ValueError(
                    "A valid input (transcript, duration_seconds, or storagePath) is required."
                )
            if inputs_provided > 1:
                raise ValueError(
                    "Please provide only one input type: transcript, duration_seconds, or storagePath."
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
