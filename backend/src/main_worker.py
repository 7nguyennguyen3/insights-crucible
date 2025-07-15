from contextlib import asynccontextmanager
from fastapi import FastAPI
from src import config, db_manager
from src.worker_routes import router as task_router
import os

from src import clients
from langchain_google_genai import ChatGoogleGenerativeAI
from tavily import TavilyClient
import httpx
from google.cloud import storage as gcs_storage


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initializes shared resources like the database connection and LLM clients on startup.
    """
    print("INFO:     Worker Service startup initiated...")
    db_manager.initialize_db()

    print("INFO:     Pre-loading LLM and Tavily clients...")
    try:
        # --- Assign to the centralized clients module ---
        clients.llm_best = ChatGoogleGenerativeAI(
            model=config.app_config.LLM_MODELS["best"], temperature=0.2
        )
        clients.llm_best_lite = ChatGoogleGenerativeAI(
            model=config.app_config.LLM_MODELS["best-lite"], temperature=0
        )
        clients.llm_main = ChatGoogleGenerativeAI(
            model=config.app_config.LLM_MODELS["main"], temperature=0.1
        )
        clients.tavily_client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])

        # GCS and HTTPX
        print("--- Pre-loading GCS and HTTPX clients ---")
        clients.gcs_client = gcs_storage.Client()
        clients.httpx_client = httpx.AsyncClient(timeout=600.0)

        print("INFO:     LLM and Tavily clients pre-loaded successfully.")
    except Exception as e:
        print(f"ERROR:    Failed to pre-load clients: {e}")
        raise

    yield

    print("INFO:     Worker Service shutdown initiated...")
    print("INFO:     Worker Service shutdown complete.")


# Initialize the FastAPI app
app = FastAPI(
    title="Transcript Analysis API - Worker Service",
    description="A service to process long-running analysis tasks.",
    version="1.0.0",
    lifespan=lifespan,  # Ensure lifespan is correctly applied
)

# Include only the router responsible for handling internal tasks
app.include_router(task_router, prefix="/api/tasks", tags=["Internal Tasks"])


@app.get("/", tags=["Root"])
async def read_root():
    """A simple root endpoint to confirm the worker service is operational."""
    return {"message": "Worker Service is operational."}
