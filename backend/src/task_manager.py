import os
import json
from google.cloud import tasks_v2
from google.protobuf import duration_pb2

tasks_client = tasks_v2.CloudTasksClient()


def create_analysis_task(user_id: str, job_id: str):
    """
    Creates a new task in the Google Cloud Tasks queue.
    This version uses the root service URL for the OIDC token audience.
    """
    try:
        # --- 1. Read all configuration from environment variables ---
        GCP_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
        GCP_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION")
        GCP_QUEUE_ID = os.getenv("GOOGLE_CLOUD_QUEUE_ID")
        WORKER_SERVICE_URL = os.getenv("WORKER_SERVICE_URL")
        WORKER_SERVICE_AUTH_SA_EMAIL = os.getenv("WORKER_SERVICE_AUTH_SA_EMAIL")

        if not all(
            [
                GCP_PROJECT,
                GCP_LOCATION,
                GCP_QUEUE_ID,
                WORKER_SERVICE_URL,
                WORKER_SERVICE_AUTH_SA_EMAIL,
            ]
        ):
            raise ValueError(
                "One or more required Google Cloud environment variables are not set."
            )

        print(
            f"DEBUG: Task will be invoked as service account: {WORKER_SERVICE_AUTH_SA_EMAIL}"
        )  # <-- ADD THIS

        # --- 2. Construct the necessary paths and payload ---
        parent = tasks_client.queue_path(GCP_PROJECT, GCP_LOCATION, GCP_QUEUE_ID)

        # The URL for the HTTP request itself still needs the full path
        request_url = f"{WORKER_SERVICE_URL}/api/tasks/run-analysis"

        # --- THIS IS THE FIX ---
        # The audience for the security token must be the root URL of the receiving service.
        token_audience = WORKER_SERVICE_URL
        # --- END FIX ---

        payload = {"user_id": user_id, "job_id": job_id}

        # --- 3. Define the full task object ---
        task = {
            "http_request": {
                "http_method": tasks_v2.HttpMethod.POST,
                "url": request_url,
                "headers": {"Content-type": "application/json"},
                "body": json.dumps(payload).encode(),
                "oidc_token": {
                    "service_account_email": WORKER_SERVICE_AUTH_SA_EMAIL,
                    "audience": token_audience,
                },
            },
            "dispatch_deadline": duration_pb2.Duration(seconds=15 * 60),
        }

        # --- 4. Create the task ---
        print(
            f"INFO:     Creating task for job_id: {job_id} with audience: {token_audience}"
        )
        response = tasks_client.create_task(parent=parent, task=task)
        print(f"INFO:     Created task: {response.name}")
        return response

    except Exception as e:
        print(f"ERROR:    Failed to create task. Reason: {e}")
        raise e
