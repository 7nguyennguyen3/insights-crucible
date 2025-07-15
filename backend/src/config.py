from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

APP_ROOT_DIR: Path = Path(__file__).parent.parent.resolve()


class Settings(BaseSettings):
    """
    Defines and loads all application settings.
    """

    INTERNAL_API_KEY: Optional[str] = None

    # The worker service needs these, but the API might not.
    ASSEMBLYAI_API_KEY: Optional[str] = None

    # The API service needs these to create tasks for the worker.
    WORKER_SERVICE_URL: Optional[str] = None
    GCP_SERVICE_ACCOUNT_EMAIL: Optional[str] = None
    GOOGLE_CLOUD_LOCATION: Optional[str] = None
    GCP_STORAGE_BUCKET_NAME: Optional[str] = None
    GOOGLE_CLOUD_QUEUE_ID: Optional[str] = None

    TAVILY_API_KEY: Optional[str] = None

    class Config:
        # 2. Reference the same constant here.
        env_file = APP_ROOT_DIR / ".env"
        env_file_encoding = "utf-8"

        extra = "ignore"


settings = Settings()


class AppConfig:
    # --- LLM Model Names ---
    # A dictionary makes it easy to manage and swap models
    LLM_MODELS = {
        "best": "gemini-2.5-flash",
        "best-lite": "gemini-2.5-flash-lite-preview-06-17",
        "main": "gemini-2.0-flash-001",
        "main-lite": "gemini-2.0-flash-lite",
        "default": "gemini-1.5-flash",
    }

    # --- Sectioning Parameters ---
    # Central place to tune how your transcript is segmented
    SECTIONING_PARAMS = {"lines_per_chunk": 60, "overlap_lines": 10}

    SEMANTIC_BOUNDARY_PARAMS = {"max_words": 12, "min_capitalization_ratio": 0.7}


app_config = AppConfig()
