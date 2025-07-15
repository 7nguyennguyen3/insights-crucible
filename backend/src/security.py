# src/security.py

from fastapi import Security, HTTPException, status, Request
from fastapi.security import APIKeyHeader
from google.auth.transport import requests
from google.oauth2 import id_token

# 1. Import the centralized settings object
from src.config import settings

# 2. Define constants and get variables directly from the validated settings object
API_KEY_HEADER = APIKeyHeader(name="X-Internal-API-Key")
INTERNAL_API_KEY = settings.INTERNAL_API_KEY
WORKER_SERVICE_URL = settings.WORKER_SERVICE_URL
GCP_SERVICE_ACCOUNT_EMAIL = settings.GCP_SERVICE_ACCOUNT_EMAIL


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
        # The audience to check against is now read from our settings object
        expected_audience = WORKER_SERVICE_URL

        # Verify the token using Google's library
        decoded_token = id_token.verify_oauth2_token(
            token, requests.Request(), audience=expected_audience
        )

        # Verify the token issuer and service account email
        if decoded_token.get("iss") != "https://accounts.google.com":
            raise HTTPException(
                status_code=403, detail="Forbidden: Invalid token issuer"
            )

        email = decoded_token.get("email")
        print(
            f"DEBUG: Token email: {email}, Expected email: {GCP_SERVICE_ACCOUNT_EMAIL}"
        )
        if email != GCP_SERVICE_ACCOUNT_EMAIL:
            raise HTTPException(
                status_code=403, detail="Forbidden: Invalid token service account email"
            )

    except Exception as e:
        print(
            f"ERROR: Invalid OIDC token validation. Expected Audience: '{expected_audience}'. Error: {e}"
        )
        raise HTTPException(status_code=403, detail="Forbidden: Invalid OIDC token.")
