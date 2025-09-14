"""
New refactored pipeline entry point.

This module provides the new, refactored pipeline implementation
while maintaining compatibility with the existing interface.
"""

from typing import Dict, Any
from src import clients, db_manager, cost_tracking
from src.pipeline.factories import PipelineFactory
from src.pipeline.orchestrators import AnalysisRequest


async def run_full_analysis(user_id: str, job_id: str, persona: str):
    """
    Main entry point for the refactored analysis pipeline.

    This function maintains the same signature as the original pipeline
    for backward compatibility while using the new architecture internally.

    Args:
        user_id: The ID of the user requesting analysis
        job_id: The unique job identifier
        persona: The analysis persona ('deep_dive')
    """

    # Create token tracker for cost tracking
    token_tracker = cost_tracking.TokenCostCallbackHandler(user_id, job_id)

    # Create pipeline using factory pattern
    pipeline = PipelineFactory.create_default_pipeline(
        db_manager=db_manager,
        clients_module=clients,
        token_tracker=token_tracker,
        persona=persona,
    )

    # Get job configuration from database
    job_doc = db_manager.get_job_status(user_id, job_id)
    if not job_doc:
        raise ValueError(f"Job {job_id} not found for user {user_id}")

    request_data = job_doc.get("request_data", {})

    # Get transcript from either request_data or root level (for paste jobs)
    # For paste jobs, transcript is stored at root level due to filtering logic
    transcript_value = request_data.get("transcript") or job_doc.get("transcript")

    # Validation: ensure we have the required input for the job type
    source_type = request_data.get("source_type")
    if source_type == "paste" and not transcript_value:
        raise ValueError(f"No transcript found for paste job {job_id}. Expected either in request_data or at root level.")

    # Create analysis request
    request = AnalysisRequest(
        user_id=user_id,
        job_id=job_id,
        persona=persona,
        transcript_id=request_data.get("transcript_id"),
        storage_path=request_data.get("storagePath"),
        raw_transcript=transcript_value,
        config=request_data.get("config", {}),
        model_choice=request_data.get("model_choice", "universal"),
    )

    # Run the analysis
    result = await pipeline.run_analysis(request)

    return result


# For backward compatibility, expose the old function name as well
async def run_full_analysis_legacy(user_id: str, job_id: str, persona: str):
    """Legacy function name for backward compatibility."""
    return await run_full_analysis(user_id, job_id, persona)
