import datetime

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import storage as gcs_storage
from typing import Dict, List, Any
from rich import print
from google.api_core.exceptions import NotFound

from src.config import settings


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
    """
    if db is None:
        raise ConnectionError("Database client not initialized.")

    now = datetime.datetime.now().strftime("%B %d, %Y at %I:%M %p")
    initial_title = f"Analysis from {now}"

    job_ref = db.collection(f"saas_users/{user_id}/jobs").document()
    job_ref.set(
        {
            "status": "QUEUED",
            "createdAt": firestore.SERVER_TIMESTAMP,
            "request_data": request_data,
            "job_title": initial_title,
            "folderId": None,
        }
    )
    return job_ref.id


def update_job_title(user_id: str, job_id: str, new_title: str):
    """Updates the title of a specific job."""
    if db is None:
        raise ConnectionError("Database client not initialized.")
    job_ref = db.collection(f"saas_users/{user_id}/jobs").document(job_id)
    job_ref.update({"job_title": new_title})
    print(f"INFO:      Renamed job {job_id} for user {user_id}")


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
    transcript: str = None,
    structured_transcript: List[Dict] = None,
):
    """
    Updates the status, progress, and optionally the main transcript
    and the new structured_transcript of a job.
    """
    if db is None:
        raise ConnectionError("Database client not initialized.")

    job_ref = db.collection(f"saas_users/{user_id}/jobs").document(job_id)
    update_data = {"status": status, "updatedAt": firestore.SERVER_TIMESTAMP}

    if progress:
        update_data["progress"] = progress

    if transcript:
        update_data["transcript"] = transcript

    # New section to handle the structured transcript
    if structured_transcript:
        print(
            f"[bold green]LOG:[/bold green] Saving structured_transcript with {len(structured_transcript)} entries to job {job_id}."
        )
        update_data["structured_transcript"] = structured_transcript

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


def get_user_plan(user_id: str) -> str:
    """
    Retrieves the plan for a specific user from the 'saas_users' collection.
    Defaults to 'free' if the user or plan is not found.
    """
    if db is None:
        # Return 'free' as a safe default if the database isn't available
        return "free"

    try:
        user_ref = db.collection("saas_users").document(user_id)
        doc = user_ref.get()
        if doc.exists:
            # Safely get the 'plan' field, default to 'free' if it's missing
            return doc.to_dict().get("plan", "free")
        else:
            # If user document doesn't exist, they are on the free plan
            return "free"
    except Exception as e:
        print(f"ERROR: Could not retrieve user plan for {user_id}: {e}")
        return "free"  # Default to 'free' on any error


def refund_analysis_credit(user_id: str, amount: int = 1):
    """
    Refunds a specified number of analysis credits to a user.
    """
    try:
        user_doc_ref = db.collection("saas_users").doc(user_id)
        user_doc_ref.update({"analyses_remaining": firestore.Increment(amount)})
        log_progress(
            user_id, None, f"✅ Successfully refunded {amount} analysis credit."
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
