# src/main.py

from src import config
from src import clients

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api_routes import router as analysis_router
from src.worker_routes import router as task_router
from src import db_manager

from langchain_google_genai import ChatGoogleGenerativeAI
from tavily import TavilyClient
import httpx
from google.cloud import storage as gcs_storage


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initializes ALL shared resources for the application.
    """
    print("--- Initializing application, database, and LLM clients ---")

    # 1. Initialize Database
    db_manager.initialize_db()

    # 2. Initialize LLM and Tavily Clients
    print("--- Pre-loading LLM and Tavily clients for local dev ---")
    try:
        clients.llm_best = ChatGoogleGenerativeAI(
            model=config.app_config.LLM_MODELS["best"], temperature=0.2
        )
        clients.llm_best_lite = ChatGoogleGenerativeAI(
            model=config.app_config.LLM_MODELS["best-lite"], temperature=0
        )
        clients.llm_main = ChatGoogleGenerativeAI(
            model=config.app_config.LLM_MODELS["main"], temperature=0.1
        )
        clients.tavily_client = TavilyClient(api_key=config.settings.TAVILY_API_KEY)
        print("--- LLM and Tavily clients pre-loaded successfully. ---")

        # GCS and HTTPX
        print("--- Pre-loading GCS and HTTPX clients ---")
        clients.gcs_client = gcs_storage.Client()
        clients.httpx_client = httpx.AsyncClient(timeout=600.0)
    except Exception as e:
        print(f"FATAL: Failed to pre-load clients during startup: {e}")
        # Optionally re-raise to stop the server from starting in a broken state
        # raise

    yield

    print("--- Application shutting down ---")


app = FastAPI(
    title="Transcript Analysis API (Local Dev Mode)",
    lifespan=lifespan,
)

# Your standard CORS setup (no changes)
origins = ["http://localhost:3000", "https://your-frontend.com"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Including routers (no changes)
print("--- Including API router at /api ---")
app.include_router(analysis_router, prefix="/api", tags=["Analysis"])
print("--- Including WORKER router at /api/tasks ---")
app.include_router(task_router, prefix="/api/tasks", tags=["Internal Tasks"])


@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Local All-in-One Server is running!"}
