import datetime

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import storage as gcs_storage
from typing import Dict, List, Any, Optional
from rich import print
from google.api_core.exceptions import NotFound

from src.config import settings
from src.find_quote_timestamps import convert_string_transcript_to_structured


db: firestore.Client = None


def initialize_db():
    global db

    if firebase_admin._apps:
        print("INFO:      Firebase Admin SDK already initialized.")
        if db is None:
            db = firestore.client()
        return

    try:
        print("INFO:      Attempting to initialize Firebase Admin SDK...")
        cred = credentials.ApplicationDefault()

        # Use the bucket name from the settings file
        firebase_admin.initialize_app(
            cred,
            {"storageBucket": settings.GCP_STORAGE_BUCKET_NAME},
        )

        db = firestore.client()
        print(
            "INFO:      Firebase SDK initialized successfully for Firestore and Storage."
        )

    except Exception as e:
        print(f"ERROR:     Failed to initialize Firebase: {e}")
        db = None


def create_job(user_id: str, request_data: dict) -> str:
    """
    Creates a new job record in Firestore.
    Filters request_data to only include fields relevant to the source type.
    """
    if db is None:
        raise ConnectionError("Database client not initialized.")

    now = datetime.datetime.now().strftime("%B %d, %Y at %I:%M %p")
    initial_title = f"Analysis from {now}"

    # Filter request_data based on source_type to keep only relevant fields
    filtered_request_data = _filter_request_data_by_source_type(request_data)

    # For paste jobs, store the transcript at root level as indicated by the filtering logic
    job_data = {
        "status": "QUEUED",
        "createdAt": firestore.SERVER_TIMESTAMP,
        "request_data": filtered_request_data,
        "job_title": initial_title,
        "folderId": None,
    }

    # Store transcript at root level for paste source type, converting to structured format
    if request_data.get("source_type") == "paste" and "transcript" in request_data:
        string_transcript = request_data["transcript"]
        print(f"INFO: Converting paste transcript to structured format (length: {len(string_transcript)})")

        # Convert string transcript to structured format
        structured_transcript = convert_string_transcript_to_structured(string_transcript)

        # Store only the structured format - original string is no longer needed
        job_data["transcript"] = structured_transcript

        print(f"INFO: Stored structured transcript with {len(structured_transcript)} entries for paste job")

    job_ref = db.collection(f"saas_users/{user_id}/jobs").document()
    job_ref.set(job_data)
    return job_ref.id


def _filter_request_data_by_source_type(request_data: dict) -> dict:
    """
    Filters request_data to only include fields relevant to the specific source type.
    This keeps the database clean and avoids storing irrelevant null/empty fields.
    """
    source_type = request_data.get("source_type")
    
    # Base fields that are always relevant
    base_fields = {"user_id", "source_type", "config"}
    
    # Define relevant fields for each source type
    source_type_fields = {
        "youtube": {
            "transcript_id", "youtube_url", "youtube_video_title", 
            "youtube_channel_name", "youtube_duration", "youtube_thumbnail_url"
        },
        "paste": set(),  # Only base fields for paste
        "upload": {
            "storagePath", "audio_filename", "duration_seconds", "model_choice"
        }
    }
    
    # Get relevant fields for this source type
    relevant_fields = base_fields | source_type_fields.get(source_type, set())
    
    # Filter the request_data to only include relevant fields
    filtered_data = {
        key: value for key, value in request_data.items() 
        if key in relevant_fields
    }
    
    # For paste source type, remove transcript from request_data since it's stored at root level in create_job()
    if source_type == "paste" and "transcript" in filtered_data:
        del filtered_data["transcript"]
    
    return filtered_data


def update_job_title(user_id: str, job_id: str, new_title: str):
    """Updates the title of a specific job."""
    if db is None:
        raise ConnectionError("Database client not initialized.")
    job_ref = db.collection(f"saas_users/{user_id}/jobs").document(job_id)
    job_ref.update({"job_title": new_title})
    print(f"INFO:      Renamed job {job_id} for user {user_id}")


def update_job_with_metadata(user_id: str, job_id: str, new_title: str, metadata: Dict[str, Any] = None):
    """Updates the title and metadata of a specific job."""
    if db is None:
        raise ConnectionError("Database client not initialized.")
    
    job_ref = db.collection(f"saas_users/{user_id}/jobs").document(job_id)
    update_data = {"job_title": new_title}
    
    job_ref.update(update_data)
    print(f"INFO:      Updated job {job_id} with title '{new_title}' and metadata for user {user_id}")


def delete_job(user_id: str, job_id: str):
    """Deletes a specific job document for a user."""
    if db is None:
        raise ConnectionError("Database client not initialized.")
    job_ref = db.collection(f"saas_users/{user_id}/jobs").document(job_id)
    job_ref.delete()
    print(f"INFO:      Deleted job {job_id} for user {user_id}")


def save_section_result(
    user_id: str, job_id: str, section_index: int, section_data: Dict
):
    """Saves a single analysis section as a new document in a subcollection."""
    if db is None:
        raise ConnectionError("Database client not initialized.")

    # Use a formatted string for the document ID for easy ordering
    doc_id = f"section_{section_index:03d}"

    job_ref = db.collection(f"saas_users/{user_id}/jobs").document(job_id)
    results_subcollection_ref = job_ref.collection("results").document(doc_id)
    results_subcollection_ref.set(section_data)


def get_job_results_from_subcollection(
    user_id: str, job_id: str
) -> List[Dict[str, Any]]:
    """Retrieves all section results from the subcollection for a given job."""
    if db is None:
        raise ConnectionError("Database client not initialized.")

    job_ref = db.collection(f"saas_users/{user_id}/jobs").document(job_id)
    results_subcollection_ref = (
        job_ref.collection("results").order_by("start_time").stream()
    )  # Order by name (section_001, etc.)

    results = [doc.to_dict() for doc in results_subcollection_ref]
    return results


def get_section_result(user_id: str, job_id: str, section_doc_id: str) -> Dict[str, Any]:
    """Retrieves a single section result from the subcollection for a given job."""
    if db is None:
        raise ConnectionError("Database client not initialized.")

    job_ref = db.collection(f"saas_users/{user_id}/jobs").document(job_id)
    section_ref = job_ref.collection("results").document(section_doc_id)
    doc = section_ref.get()
    
    if not doc.exists:
        return None
    return doc.to_dict()


def get_job_status(user_id: str, job_id: str) -> Dict[str, Any]:
    """Retrieves the full document for a specific job."""
    if db is None:
        raise ConnectionError("Database client not initialized.")

    job_ref = db.collection(f"saas_users/{user_id}/jobs").document(job_id)
    doc = job_ref.get()
    if not doc.exists:
        return None
    return doc.to_dict()


def update_job_status(
    user_id: str,
    job_id: str,
    status: str,
    progress: str = None,
    transcript: List[Dict] = None,
):
    """
    Updates the status, progress, and optionally the main transcript of a job.
    """
    if db is None:
        raise ConnectionError("Database client not initialized.")

    job_ref = db.collection(f"saas_users/{user_id}/jobs").document(job_id)
    update_data = {"status": status, "updatedAt": firestore.SERVER_TIMESTAMP}

    if progress:
        update_data["progress"] = progress

    if transcript:
        print(
            f"[bold green]LOG:[/bold green] Saving transcript with {len(transcript)} entries to job {job_id}."
        )
        update_data["transcript"] = transcript

    job_ref.update(update_data)


def save_job_results(user_id: str, job_id: str, results: List[Dict[str, Any]]):
    """Saves the final, completed analysis results to the job document."""
    if db is None:
        raise ConnectionError("Database client not initialized.")

    job_ref = db.collection(f"saas_users/{user_id}/jobs").document(job_id)
    job_ref.update({"results": results})


def create_notification(user_id: str, job_id: str, title: str):
    if db is None:
        raise ConnectionError("Database client not initialized.")

    notifications_ref = db.collection(f"saas_users/{user_id}/notifications").document()
    notifications_ref.set(
        {
            "message": f"Your analysis for '{title}' is complete.",
            "link": f"/results/{job_id}",
            "isRead": False,
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
    )
    print(
        f"INFO:      Created notification for user {user_id}, job {job_id} in saas_users collection."
    )


def create_usage_record(user_id: str, job_id: str, usage_data: Dict):
    """Creates a new record in the top-level usage_records collection."""
    if db is None:
        raise ConnectionError("Database client not initialized.")

    # Add createdAt timestamp to the record
    usage_data["createdAt"] = firestore.SERVER_TIMESTAMP
    usage_data["userId"] = user_id
    usage_data["jobId"] = job_id

    # Create a new document in the usage_records collection
    db.collection("usage_records").add(usage_data)
    print(f"INFO:      Created usage record for job {job_id}.")


def does_section_result_exist(user_id: str, job_id: str, section_doc_id: str) -> bool:
    """Checks if a specific section result document already exists in Firestore."""
    if db is None:
        raise ConnectionError("Database client not initialized.")

    doc_ref = db.collection(f"saas_users/{user_id}/jobs/{job_id}/results").document(
        section_doc_id
    )
    return doc_ref.get().exists


def log_progress(user_id: str, job_id: str, message: str):
    """Adds a new timestamped log entry to the job's log subcollection."""
    if db is None:
        return  # Don't crash if db isn't available

    log_entry = {"message": message, "timestamp": firestore.SERVER_TIMESTAMP}
    db.collection(f"saas_users/{user_id}/jobs/{job_id}/logs").add(log_entry)


# get_user_plan function removed - no longer needed in credit-based system


def refund_analysis_credit(user_id: str, amount: int = 1):
    """
    Refunds a specified number of analysis credits to a user.
    """
    try:
        user_doc_ref = db.collection("saas_users").document(user_id)
        user_doc_ref.update({"analyses_remaining": firestore.Increment(amount)})
        log_progress(
            user_id, None, f"✅ Successfully refunded {amount} analysis credit."
        )
        print(
            f"[bold green]CRITICAL: Successfully refunded {amount} analysis credit for user {user_id}[/bold green]"
        )
    except Exception as e:
        print(
            f"[bold red]CRITICAL: Failed to refund analysis credit for user {user_id}: {e}[/bold red]"
        )


def delete_gcs_file(storage_path: str):
    """
    Deletes a file from the default Google Cloud Storage bucket.
    """
    if not storage_path:
        return

    try:
        storage_client = gcs_storage.Client()

        # 2. Use the settings object instead of os.getenv()
        bucket_name = settings.GCP_STORAGE_BUCKET_NAME

        if not bucket_name:
            print(
                "[bold red]ERROR: GCP_STORAGE_BUCKET_NAME not set in config. Cannot delete file.[/bold red]"
            )
            return

        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(storage_path)

        print(f"Attempting to delete gs://{bucket_name}/{storage_path}...")
        blob.delete()
        print(f"[green]✓ Successfully deleted source file.[/green]")

    except NotFound:
        print(
            f"[yellow]Warning: File not found at {storage_path}. It may have already been deleted.[/yellow]"
        )
    except Exception as e:
        print(
            f"[bold red]CRITICAL: Failed to delete GCS file {storage_path}: {e}[/bold red]"
        )


def get_cached_transcript(transcript_id: str) -> Optional[Dict]:  # Return a Dict now
    """Retrieves and deletes a cached transcript from the pending_transcripts collection."""
    if db is None:
        return None

    doc_ref = db.collection("pending_transcripts").document(transcript_id)
    doc = doc_ref.get()

    if doc.exists:
        transcript_data = doc.to_dict()  # Get the whole document
        doc_ref.delete()
        print(f"INFO:     Retrieved and deleted cached transcript {transcript_id}")
        return transcript_data  # Return all data
    return None


# --- NEW: Open-Ended Quiz Functions (Jobs Subcollection) ---

def create_open_ended_submission(
    user_id: str,
    job_id: str,
    question_id: str,
    user_answer: str
) -> str:
    """
    Creates a new open-ended submission in the job's subcollection.
    Returns the question_id as the document identifier.
    """
    if db is None:
        raise ConnectionError("Database client not initialized.")

    # Store in jobs subcollection using question_id as document ID
    question_ref = db.collection(f"saas_users/{user_id}/jobs/{job_id}/open_ended_questions").document(question_id)
    
    submission_data = {
        "user_id": user_id,
        "job_id": job_id,
        "question_id": question_id,
        "user_answer": user_answer,
        "submitted_at": firestore.SERVER_TIMESTAMP,
        "grading_status": "PENDING",
        "grading_result": None,
        "graded_at": None
    }
    
    question_ref.set(submission_data)
    print(f"INFO:      Created open-ended submission for question {question_id} in job {job_id}")
    return question_id


def update_open_ended_grading(
    user_id: str,
    job_id: str,
    question_id: str,
    status: str,
    result: Optional[Dict] = None
):
    """
    Updates the grading status and result for an open-ended question.
    """
    if db is None:
        raise ConnectionError("Database client not initialized.")

    question_ref = db.collection(f"saas_users/{user_id}/jobs/{job_id}/open_ended_questions").document(question_id)
    
    update_data = {
        "grading_status": status,
        "updated_at": firestore.SERVER_TIMESTAMP
    }
    
    if status == "COMPLETED" and result is not None:
        update_data["graded_at"] = firestore.SERVER_TIMESTAMP
        update_data["grading_result"] = result
    
    question_ref.update(update_data)
    print(f"INFO:      Updated grading for question {question_id} in job {job_id} to status {status}")


def get_open_ended_question_status(
    user_id: str,
    job_id: str,
    question_id: str
) -> Optional[Dict[str, Any]]:
    """
    Retrieves the status and result of an open-ended question.
    """
    if db is None:
        raise ConnectionError("Database client not initialized.")

    question_ref = db.collection(f"saas_users/{user_id}/jobs/{job_id}/open_ended_questions").document(question_id)
    doc = question_ref.get()
    
    if not doc.exists:
        return None
    return doc.to_dict()


def get_latest_grading_results(
    user_id: str,
    job_id: str
) -> List[Dict[str, Any]]:
    """
    Gets all grading results for open-ended questions in a specific job.
    Much simpler now that everything is in the job's subcollection.
    """
    if db is None:
        raise ConnectionError("Database client not initialized.")

    try:
        # Get all open-ended questions for this job
        questions_ref = db.collection(f"saas_users/{user_id}/jobs/{job_id}/open_ended_questions")
        questions_query = questions_ref.order_by("submitted_at")
        questions = questions_query.get()
        
        if not questions:
            return []
        
        results = []
        
        # Return all questions with their grading data
        for question_doc in questions:
            question_data = question_doc.to_dict()
            
            results.append({
                "question_id": question_data.get("question_id"),
                "user_answer": question_data.get("user_answer"),
                "submitted_at": question_data.get("submitted_at"),
                "grading_status": question_data.get("grading_status"),
                "grading_result": question_data.get("grading_result"),
                "graded_at": question_data.get("graded_at")
            })
        
        return results
        
    except Exception as e:
        print(f"Error retrieving latest grading results: {e}")
        return []


def get_open_ended_submission(
    user_id: str,
    job_id: str,
    question_id: str
) -> Optional[Dict[str, Any]]:
    """
    Retrieves an open-ended submission by question ID from the job's subcollection.
    """
    if db is None:
        raise ConnectionError("Database client not initialized.")

    question_ref = db.collection(f"saas_users/{user_id}/jobs/{job_id}/open_ended_questions").document(question_id)
    doc = question_ref.get()
    
    if not doc.exists:
        return None
    return doc.to_dict()


# --- DEPRECATED: Legacy functions for backward compatibility ---
# These can be removed after migration

def create_grading_job(
    user_id: str,
    submission_id: str
) -> str:
    """
    DEPRECATED: Legacy function for backward compatibility.
    Use create_open_ended_submission instead.
    """
    print("WARNING: create_grading_job is deprecated. Use create_open_ended_submission instead.")
    return submission_id


def update_grading_job_status(
    user_id: str,
    grading_job_id: str,
    status: str,
    result: Optional[Dict] = None
):
    """
    DEPRECATED: Legacy function for backward compatibility.
    Use update_open_ended_grading instead.
    """
    print("WARNING: update_grading_job_status is deprecated. Use update_open_ended_grading instead.")
    pass


def get_grading_job_status(
    user_id: str,
    grading_job_id: str
) -> Optional[Dict[str, Any]]:
    """
    DEPRECATED: Legacy function for backward compatibility.
    Use get_open_ended_question_status instead.
    """
    print("WARNING: get_grading_job_status is deprecated. Use get_open_ended_question_status instead.")
    return None


def save_quiz_answers(
    user_id: str,
    job_id: str,
    answers: List[Dict[str, Any]],
    final_score: Dict[str, int]
) -> str:
    """
    Saves quiz answers and final score to Firestore.
    
    Args:
        user_id: The ID of the user who took the quiz
        job_id: The ID of the job/analysis the quiz belongs to
        answers: List of answer objects containing question data and user responses
        final_score: Dictionary with 'correct' and 'total' keys
        
    Returns:
        The document ID of the saved quiz attempt
    """
    if db is None:
        raise ConnectionError("Database client not initialized.")
    
    # Create quiz attempt document
    quiz_attempt_data = {
        "user_id": user_id,
        "job_id": job_id,
        "answers": answers,
        "final_score": final_score,
        "submitted_at": firestore.SERVER_TIMESTAMP,
        "created_at": firestore.SERVER_TIMESTAMP
    }
    
    # Save to quiz_attempts collection
    quiz_ref = db.collection("quiz_attempts").document()
    quiz_ref.set(quiz_attempt_data)
    
    print(f"INFO:      Saved quiz answers for user {user_id}, job {job_id}, score: {final_score['correct']}/{final_score['total']}")
    
    return quiz_ref.id