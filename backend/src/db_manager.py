import datetime

import firebase_admin
from firebase_admin import firestore
from typing import Dict, List, Any
from rich import print

db: firestore.Client = None


def initialize_db():
    """
    Initializes the Firestore client. It automatically finds the credentials
    via the GOOGLE_APPLICATION_CREDENTIALS environment variable.
    """
    global db

    if db is not None:
        print("INFO:      Firestore client already initialized.")
        return

    try:
        print("INFO:      Attempting to initialize Firestore client...")

        # When called with no arguments, initialize_app() automatically uses the
        # credentials from the file path specified in the
        # GOOGLE_APPLICATION_CREDENTIALS environment variable.
        if not firebase_admin._apps:
            firebase_admin.initialize_app()

        db = firestore.client()
        print("INFO:      Firestore client initialized successfully.")

    except Exception as e:
        print(f"ERROR:     Failed to initialize Firestore: {e}")
        db = None


def create_job(user_id: str, request_data: dict) -> str:
    """
    Creates a new job record in Firestore, saving the estimated cost
    for later settlement.
    """
    if db is None:
        raise ConnectionError("Database client not initialized.")

    now = datetime.datetime.now().strftime("%B %d, %Y at %I:%M %p")
    initial_title = f"Analysis from {now}"

    # Extract the estimated cost from the request data sent by the Next.js API
    estimated_cost = request_data.get("estimated_cost_usd", 0)

    job_ref = db.collection(f"saas_users/{user_id}/jobs").document()
    job_ref.set(
        {
            "status": "QUEUED",
            "createdAt": firestore.SERVER_TIMESTAMP,
            "request_data": request_data,
            "job_title": initial_title,
            "folderId": None,
            "estimated_cost_usd": estimated_cost,
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


def update_job_cost_metrics(user_id: str, job_id: str, metrics_update: Dict):
    """Updates specific cost metrics for a job."""
    if db is None:
        raise ConnectionError("Database client not initialized.")
    job_ref = db.collection(f"saas_users/{user_id}/jobs").document(job_id)
    # Use array_union or increment if you're tracking lists or counts
    # For sums, you'll fetch, update, then set
    # For simplicity, we'll assume we're passing the new total or using .update() for specific fields
    job_ref.update(
        {
            f"cost_metrics.{key}": (
                firestore.Increment(value) if isinstance(value, (int, float)) else value
            )
            for key, value in metrics_update.items()
        }
    )


def get_job_cost_metrics(user_id: str, job_id: str) -> Dict[str, Any]:
    job_doc = get_job_status(user_id, job_id)
    return job_doc.get("cost_metrics", {}) if job_doc else {}


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


def settle_job_cost(user_id: str, estimated_cost: float, final_cost: float) -> bool:
    """
    Settles the final cost of a job using a transaction.
    - Decrements credits by the final_cost
    - Decrements pending_deductions by the estimated_cost
    """
    if db is None:
        raise ConnectionError("Database client not initialized.")

    user_ref = db.collection("saas_users").document(user_id)

    @firestore.transactional
    def _settle(transaction, user_ref, estimated, final):
        snapshot = user_ref.get(transaction=transaction)
        if not snapshot.exists:
            return False

        # Atomically update both fields
        transaction.update(
            user_ref,
            {
                "credits": firestore.Increment(-final),
                "pending_deductions": firestore.Increment(-estimated),
            },
        )
        return True

    transaction = db.transaction()
    return _settle(transaction, user_ref, estimated_cost, final_cost)


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
