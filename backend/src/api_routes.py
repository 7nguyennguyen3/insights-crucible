import os
import random
import time
from dotenv import load_dotenv

load_dotenv()

from fastapi import APIRouter, Depends, HTTPException
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import GenericProxyConfig
from src.models import (
    AnalysisRequest,
    ProcessResponse,
    BulkAnalysisRequest,
    BulkProcessResponse,
    BulkProcessResponseItem,
    TranscriptDetailResponse,
    TranscriptDetailRequest,
    OpenEndedSubmission,
    GradingJob,
    GradingResult,
)
from src.utils import (
    fetch_youtube_metadata,
    extract_youtube_video_id,
    format_iso_duration_to_readable,
)
from src import db_manager
from src.security import verify_api_key
from src import task_manager

import uuid
import datetime
from firebase_admin import firestore

router = APIRouter()

try:
    PROXY_USER = os.environ["DATIMP_USER"]
    PROXY_PASS = os.environ["DATIMP_PASS"]
    PROXY_HOST = os.environ["DATIMP_HOST"]
    PROXY_PORT = os.environ["DATIMP_PORT"]
except KeyError as e:
    missing = e.args[0]
    raise RuntimeError(
        f"Environment variable {missing} is required but not set. "
        "Please configure DATIMP_USER, DATIMP_PASS, DATIMP_HOST, and DATIMP_PORT."
    )


def fetch_transcript_with_retry(
    video_id: str, max_retries: int = 7, max_delay_seconds: int = 5
):
    """
    Attempts to fetch a YouTube transcript with a retry mechanism
    using exponential backoff.
    """
    delay = 1  # Initial delay of 1 seconds
    for attempt in range(max_retries):
        try:
            # This proxy setup creates a new connection (and thus gets a new IP)
            # for each attempt, which is exactly what we want.
            proxy_url = f"http://{PROXY_USER}:{PROXY_PASS}@{PROXY_HOST}:{PROXY_PORT}"
            api = YouTubeTranscriptApi(
                proxy_config=GenericProxyConfig(
                    http_url=proxy_url,
                    https_url=proxy_url,
                )
            )

            print(
                f"Attempt {attempt + 1}/{max_retries}: Fetching transcript for video {video_id}..."
            )
            transcript_object = api.fetch(video_id)
            print(f"Successfully fetched transcript on attempt {attempt + 1}.")
            return transcript_object.to_raw_data()  # Success! Return the data.

        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt + 1 == max_retries:
                # If this was the last attempt, re-raise the exception to be caught by the main endpoint.
                raise e

            # Calculate wait time with a small random jitter
            wait_time = delay + random.uniform(0, 1)
            print(f"Retrying in {wait_time:.2f} seconds...")
            time.sleep(wait_time)
            delay = min(delay * 2, max_delay_seconds)

    # This line should theoretically not be reached, but as a fallback:
    raise Exception("Max retries reached without success.")


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

    # Create a lookup dictionary for file metadata by filename
    file_metadata_lookup = {}
    if bulk_request.file_metadata:
        for file_meta in bulk_request.file_metadata:
            file_metadata_lookup[file_meta["name"]] = file_meta

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
            "source_type": bulk_request.source_type,
        }

        # Add file metadata if available and this is a file upload
        if bulk_request.source_type == "upload" and item.client_provided_id:
            file_meta = file_metadata_lookup.get(item.client_provided_id)
            if file_meta:
                single_job_payload["audio_filename"] = item.client_provided_id
                single_job_payload["duration_seconds"] = file_meta.get("duration")

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


@router.post("/get-transcript-details", response_model=TranscriptDetailResponse)
async def get_transcript_and_cache(
    request: TranscriptDetailRequest,
    _=Depends(verify_api_key),
):
    """
    Fetches a YouTube transcript through rotating residential proxies,
    caches it in Firestore with a TTL, and returns its details for cost calculation.

    This endpoint now uses a retry mechanism with exponential backoff.
    """
    try:
        # --- MODIFIED LOGIC ---
        # Call the new helper function that contains the retry loop.
        raw_transcript = fetch_transcript_with_retry(request.video_id)
        # --- END MODIFIED LOGIC ---

        # Log the raw transcript structure for debugging
        print(
            f"DEBUG: Raw transcript structure (first 3 items): {raw_transcript[:3] if raw_transcript else 'Empty'}"
        )
        print(
            f"DEBUG: Total transcript items: {len(raw_transcript) if raw_transcript else 0}"
        )

        # Calculate character count (for cost estimation)
        full_text = " ".join([item["text"] for item in raw_transcript])
        character_count = len(full_text)
        print(f"DEBUG: Video ID {request.video_id} has {character_count} characters.")

        # Save the complete transcript with timestamps to fetched_transcript.md
        try:
            with open("fetched_transcript.md", "w", encoding="utf-8") as f:
                f.write(f"# YouTube Transcript - Video ID: {request.video_id}\n\n")

                # Save with timestamps if available
                if (
                    raw_transcript
                    and len(raw_transcript) > 0
                    and "start" in raw_transcript[0]
                ):
                    f.write("## Timestamped Transcript\n\n")
                    for item in raw_transcript:
                        start_time = item.get("start", 0)
                        text = item.get("text", "")
                        # Format timestamp as MM:SS
                        minutes = int(start_time // 60)
                        seconds = int(start_time % 60)
                        f.write(f"**[{minutes:02d}:{seconds:02d}]** {text}\n\n")
                else:
                    # Fallback to plain text if no timestamps
                    f.write("## Plain Text Transcript\n\n")
                    f.write(full_text)

            print(f"DEBUG: Transcript saved to fetched_transcript.md")
        except Exception as e:
            print(f"WARNING: Failed to save transcript to file: {e}")

        # Fetch YouTube metadata
        metadata = await fetch_youtube_metadata(request.video_id)
        title = metadata.get("title", "YouTube Video Transcript")

        # Cache in Firestore
        if db_manager.db:
            transcript_id = str(uuid.uuid4())
            cache_ref = db_manager.db.collection("pending_transcripts").document(
                transcript_id
            )
            expiration_time = datetime.datetime.now(
                datetime.timezone.utc
            ) + datetime.timedelta(hours=1)

            # Include metadata in cached data
            cached_data = {
                "structured_transcript": raw_transcript,
                "character_count": character_count,
                "createdAt": firestore.SERVER_TIMESTAMP,
                "expiresAt": expiration_time,
            }

            # Add YouTube metadata if available
            if metadata:
                cached_data.update(
                    {
                        "youtube_title": metadata.get("title", ""),
                        "youtube_channel_name": metadata.get("channel_name", ""),
                        "youtube_thumbnail_url": metadata.get("thumbnail_url", ""),
                        "youtube_duration": metadata.get("duration", ""),
                    }
                )

            cache_ref.set(cached_data)

            return TranscriptDetailResponse(
                transcript_id=transcript_id,
                character_count=character_count,
                title=title,
            )
        else:
            raise ConnectionError("Database client not initialized.")

    except Exception as e:
        # This will now catch the error only after all retries have failed.
        print(
            f"ERROR: Could not fetch transcript for video {request.video_id} after multiple retries: {e}"
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve transcript after multiple retries: {e}",
        )


# --- NEW: Open-Ended Quiz Endpoints ---


@router.post("/submit-open-ended-answer", status_code=202)
async def submit_open_ended_answer(
    submission: OpenEndedSubmission,
    _=Depends(verify_api_key),
):
    """
    Submit an open-ended answer for grading.
    Creates a submission record in the job's subcollection.
    """
    try:
        # Create the open-ended submission in job's subcollection
        question_id = db_manager.create_open_ended_submission(
            user_id=submission.user_id,
            job_id=submission.job_id,
            question_id=submission.question_id,
            user_answer=submission.user_answer,
        )

        # Enqueue the grading task
        try:
            task_manager.create_grading_task(
                user_id=submission.user_id,
                job_id=submission.job_id,
                question_id=question_id,
            )
        except Exception as e:
            print(f"WARNING: Failed to enqueue grading task: {e}")
            # Even if we can't enqueue the task, we still return success
            # The grading can be processed manually or by a fallback mechanism

        return {
            "question_id": question_id,
            "job_id": submission.job_id,
            "status": "PENDING",
            "message": "Answer submitted successfully. Grading will begin shortly.",
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to submit open-ended answer: {e}"
        )


@router.get("/grading-status/{job_id}/{question_id}")
async def get_grading_status(
    user_id: str,
    job_id: str,
    question_id: str,
    _=Depends(verify_api_key),
):
    """
    Get the status and result of an open-ended answer grading.
    """
    try:
        # Get the question grading status from job subcollection
        question_data = db_manager.get_open_ended_question_status(
            user_id, job_id, question_id
        )

        if not question_data:
            raise HTTPException(
                status_code=404,
                detail=f"Question {question_id} not found in job {job_id} for user {user_id}",
            )

        return {
            "question_id": question_id,
            "job_id": job_id,
            "grading_status": question_data["grading_status"],
            "grading_result": question_data.get("grading_result"),
            "submitted_at": question_data.get("submitted_at"),
            "graded_at": question_data.get("graded_at"),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve grading status: {e}"
        )


@router.get("/latest-grading-results/{user_id}/{job_id}")
async def get_latest_grading_results(
    user_id: str,
    job_id: str,
    _=Depends(verify_api_key),
):
    """
    Get the latest completed grading results for a specific job.
    """
    try:
        # Get the latest grading results for this job
        grading_results = db_manager.get_latest_grading_results(user_id, job_id)

        if not grading_results:
            return {
                "has_results": False,
                "message": "No grading results found for this job",
            }

        return {"has_results": True, "results": grading_results}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve latest grading results: {e}"
        )
