import os
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


@router.post("/get-transcript-details", response_model=TranscriptDetailResponse)
async def get_transcript_and_cache(
    request: TranscriptDetailRequest,
    _=Depends(verify_api_key),
):
    """
    Fetches a YouTube transcript through rotating residential proxies,
    caches it in Firestore with a TTL, and returns its details for cost calculation.
    """
    try:
        proxy_url = f"http://{PROXY_USER}:{PROXY_PASS}@{PROXY_HOST}:{PROXY_PORT}"
        api = YouTubeTranscriptApi(
            proxy_config=GenericProxyConfig(
                http_url=proxy_url,
                https_url=proxy_url,
            )
        )
        transcript_object = api.fetch(request.video_id)
        raw_transcript = transcript_object.to_raw_data()

        # Calculate character count
        full_text = " ".join([item["text"] for item in raw_transcript])
        character_count = len(full_text)
        print(f"DEBUG: Video ID {request.video_id} has {character_count} characters.")

        title = "YouTube Video Transcript"

        # Cache in Firestore
        if db_manager.db:
            transcript_id = str(uuid.uuid4())
            cache_ref = db_manager.db.collection("pending_transcripts").document(
                transcript_id
            )
            expiration_time = datetime.datetime.now(
                datetime.timezone.utc
            ) + datetime.timedelta(hours=1)

            cache_ref.set(
                {
                    "structured_transcript": raw_transcript,
                    "character_count": character_count,
                    "createdAt": firestore.SERVER_TIMESTAMP,
                    "expiresAt": expiration_time,
                }
            )

            return TranscriptDetailResponse(
                transcript_id=transcript_id,
                character_count=character_count,
                title=title,
            )
        else:
            raise ConnectionError("Database client not initialized.")

    except Exception as e:
        print(
            f"ERROR: Could not fetch or cache transcript for video {request.video_id}: {e}"
        )
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve transcript: {e}"
        )
