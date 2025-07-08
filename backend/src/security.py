import os
from fastapi import Security, HTTPException, status, Request
from fastapi.security import APIKeyHeader
from google.auth.transport import requests  # Add this import
from google.oauth2 import id_token

# Define the name of the header we will look for.
API_KEY_HEADER = APIKeyHeader(name="X-Internal-API-Key")

# Get the secret key from an environment variable for security.
# NEVER hardcode this value.
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")

if not INTERNAL_API_KEY:
    raise ValueError("INTERNAL_API_KEY environment variable not set")


async def verify_api_key(api_key: str = Security(API_KEY_HEADER)):
    """
    A dependency that checks for a valid internal API key in the request header.
    """
    if api_key != INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing API key",
        )


async def verify_gcp_task_request(request: Request):
    """
    Verifies that the request is coming from Google Cloud Tasks by validating
    the OIDC token in the Authorization header.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=403, detail="Forbidden: Missing Authorization header"
        )

    token = auth_header.split("Bearer ")[1]

    try:
        # --- 1. Get the expected audience from environment variables ---
        WORKER_SERVICE_URL = os.getenv("WORKER_SERVICE_URL")
        if not WORKER_SERVICE_URL:
            raise ValueError("WORKER_SERVICE_URL environment variable not set.")

        # --- THIS IS THE FIX ---
        # The audience to check against must match what was set during task creation.
        expected_audience = WORKER_SERVICE_URL
        # --- END FIX ---

        # --- 2. Verify the token using Google's library ---
        decoded_token = id_token.verify_oauth2_token(
            token, requests.Request(), audience=expected_audience
        )

        # --- 3. Verify the token issuer and service account email ---
        if decoded_token.get("iss") != "https://accounts.google.com":
            raise HTTPException(
                status_code=403, detail="Forbidden: Invalid token issuer"
            )

        email = decoded_token.get("email")
        gcp_service_account = os.getenv("GCP_SERVICE_ACCOUNT_EMAIL")
        if email != gcp_service_account:
            raise HTTPException(
                status_code=403, detail="Forbidden: Invalid token service account email"
            )

    except Exception as e:
        print(
            f"ERROR: Invalid OIDC token validation. Expected Audience: '{expected_audience}'. Error: {e}"
        )
        raise HTTPException(status_code=403, detail="Forbidden: Invalid OIDC token.")
