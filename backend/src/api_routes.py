from fastapi import APIRouter, Depends, HTTPException
from src.models import (
    AnalysisRequest,
    EstimateResponse,
    ProcessResponse,
    BulkAnalysisRequest,
    BulkProcessResponse,
    BulkProcessResponseItem,
)
from src import db_manager
from src.security import verify_api_key
from src import task_manager
import math
import uuid

router = APIRouter()


@router.post("/estimate", response_model=EstimateResponse)
async def estimate_analysis_cost(
    request: AnalysisRequest,
    _=Depends(verify_api_key),
):
    """
    Takes a transcript OR an audio duration and returns an estimated cost,
    factoring in the chosen transcription model and selected features.
    This estimate includes a buffer to improve user experience.
    """

    class Costs:
        MINIMUM_USD = 0.01
        BUFFER_PERCENTAGE = 0.15
        TRANSCRIPTION_PRICING = {
            "universal": 0.0075 / 60,  # Example: $0.0075/min
            "slam-1": 0.0075 / 60,
            "nano": 0.0033 / 60,  # Example: $0.0033/min
        }
        TAVILY_BRIEFING_PER_SECTION = 0.0825
        X_THREAD_PER_SECTION = 0.001
        BASE_LLM_ANALYSIS_PER_SECTION = 0.003
        AVG_WORDS_PER_MINUTE = 150
        AVG_WORDS_PER_SECTION = 1500

    # --- Start of Logic ---

    raw_estimated_cost = 0.0
    num_sections = 0
    message = ""

    # Check if the chosen model is valid
    if request.model_choice not in Costs.TRANSCRIPTION_PRICING:
        raise HTTPException(status_code=400, detail="Invalid model_choice provided.")

    # --- Case 1: Estimate based on audio duration ---
    if request.duration_seconds and request.duration_seconds > 0:
        transcription_cost = (
            request.duration_seconds * Costs.TRANSCRIPTION_PRICING[request.model_choice]
        )
        estimated_words = (request.duration_seconds / 60) * Costs.AVG_WORDS_PER_MINUTE
        num_sections = math.ceil(estimated_words / Costs.AVG_WORDS_PER_SECTION) or 1
        message = f"Estimate for a {math.ceil(request.duration_seconds / 60)}-minute audio file using the '{request.model_choice}' model."

        analysis_cost = num_sections * Costs.BASE_LLM_ANALYSIS_PER_SECTION

        # Add costs for optional features based on the config
        briefing_cost = (
            num_sections * Costs.TAVILY_BRIEFING_PER_SECTION
            if request.config.run_contextual_briefing
            else 0
        )
        x_thread_cost = (
            num_sections * Costs.X_THREAD_PER_SECTION
            if request.config.run_x_thread_generation
            else 0
        )
        # Add blog post cost if that feature is enabled
        blog_post_cost = 0.005 if request.config.run_blog_post_generation else 0

        raw_estimated_cost = (
            transcription_cost
            + analysis_cost
            + briefing_cost
            + x_thread_cost
            + blog_post_cost
        )

    # --- Case 2: Estimate based on a provided transcript ---
    elif request.transcript and request.transcript.strip():
        word_count = len(request.transcript.split())
        num_sections = math.ceil(word_count / Costs.AVG_WORDS_PER_SECTION) or 1
        message = f"Estimate for a {word_count}-word transcript."

        # No transcription cost for text input
        analysis_cost = num_sections * Costs.BASE_LLM_ANALYSIS_PER_SECTION

        # Add costs for optional features based on the config
        briefing_cost = (
            num_sections * Costs.TAVILY_BRIEFING_PER_SECTION
            if request.config.run_contextual_briefing
            else 0
        )
        x_thread_cost = (
            num_sections * Costs.X_THREAD_PER_SECTION
            if request.config.run_x_thread_generation
            else 0
        )
        # Add blog post cost if that feature is enabled
        blog_post_cost = 0.005 if request.config.run_blog_post_generation else 0

        raw_estimated_cost = (
            analysis_cost + briefing_cost + x_thread_cost + blog_post_cost
        )

    # --- Case 3: No valid input was provided ---
    else:
        # This case should ideally be caught by Pydantic models, but it's here as a safeguard.
        raise HTTPException(
            status_code=400,
            detail="Request must include either a valid transcript or audio duration.",
        )

    # Apply the buffer to the raw cost
    buffered_cost = raw_estimated_cost * (1 + Costs.BUFFER_PERCENTAGE)

    # Ensure the final cost is not below the minimum charge
    final_estimated_cost = max(Costs.MINIMUM_USD, buffered_cost)

    if final_estimated_cost > Costs.MINIMUM_USD and raw_estimated_cost > 0:
        message += " This includes a small buffer; your final cost may be lower."

    return EstimateResponse(
        estimated_cost_usd=round(final_estimated_cost, 4),
        num_sections=num_sections,
        message=message,
    )


@router.post("/process", response_model=ProcessResponse, status_code=202)
async def start_analysis_processing(
    request: AnalysisRequest,  # It now uses the updated, more flexible model
    _=Depends(verify_api_key),
):
    """
    Takes a request with a transcript OR a storagePath, creates a job record,
    and enqueues the analysis task in Google Cloud Tasks.
    """
    # NO VALIDATION LOGIC IS NEEDED HERE.
    # The Pydantic model 'AnalysisRequest' handles all validation.
    # This function's only job is to create the records and the task.

    user_id = request.user_id

    # The request.dict() will correctly contain either 'transcript' or 'storagePath'
    job_id = db_manager.create_job(user_id, request.dict())

    try:
        task_manager.create_analysis_task(user_id=user_id, job_id=job_id)
    except Exception as e:
        db_manager.update_job_status(
            user_id, job_id, "FAILED", f"Failed to enqueue analysis task: {e}"
        )
        raise HTTPException(
            status_code=500, detail="Failed to enqueue job for processing."
        )

    return ProcessResponse(
        job_id=job_id,
        status="QUEUED",
        message="Analysis has been queued for processing.",
    )


@router.post("/process-bulk", response_model=BulkProcessResponse, status_code=202)
async def start_bulk_analysis_processing(
    bulk_request: BulkAnalysisRequest,
    _=Depends(verify_api_key),
):
    """
    Takes a bulk request containing multiple transcripts or storagePaths,
    creates an independent job and task for each item, and returns a batch ID
    to track the group.
    """
    user_id = bulk_request.user_id
    created_jobs = []

    # 1. Generate a single BATCH ID to group all these jobs
    batch_id = str(uuid.uuid4())

    for item in bulk_request.items:
        # 2. For each item in the bulk request, create a payload for a single job
        single_job_payload = {
            "user_id": user_id,
            "transcript": item.transcript,
            "storagePath": item.storagePath,
            "config": bulk_request.config.dict(),
            "model_choice": bulk_request.model_choice,
            "batch_id": batch_id,  # ** CRUCIAL FOR TRACKING **
            "client_provided_id": item.client_provided_id,
        }

        # 3. Create the job in the database (your existing function works perfectly)
        job_id = db_manager.create_job(user_id, single_job_payload)

        try:
            # 4. Enqueue the analysis task (your existing function works perfectly)
            task_manager.create_analysis_task(user_id=user_id, job_id=job_id)

            created_jobs.append(
                BulkProcessResponseItem(
                    job_id=job_id,
                    status="QUEUED",
                    client_provided_id=item.client_provided_id,
                )
            )
        except Exception as e:
            # If enqueueing fails for one, we should log it but not stop the whole batch
            db_manager.update_job_status(
                user_id, job_id, "FAILED", f"Failed to enqueue: {e}"
            )
            created_jobs.append(
                BulkProcessResponseItem(
                    job_id=job_id,
                    status="FAILED",
                    client_provided_id=item.client_provided_id,
                )
            )
            # You might want to add more robust error logging here
            print(f"Failed to enqueue job {job_id} for user {user_id}: {e}")

    return BulkProcessResponse(
        batch_id=batch_id,
        jobs=created_jobs,
        message=f"Successfully queued {len(created_jobs)} analysis jobs under batch ID {batch_id}.",
    )
