from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.worker_routes import router as task_router
from src import db_manager


# This context manager will run startup and shutdown logic
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initializes shared resources like the database connection on startup.
    """
    db_manager.initialize_db()
    yield
    print("INFO:     Worker Service shutdown...")


# Initialize the FastAPI app
app = FastAPI(
    title="Transcript Analysis API - Worker Service",
    description="A service to process long-running analysis tasks.",
    version="1.0.0",
    lifespan=lifespan,
)

# Include only the router responsible for handling internal tasks
app.include_router(task_router, prefix="/api/tasks", tags=["Internal Tasks"])


@app.get("/", tags=["Root"])
async def read_root():
    """A simple root endpoint to confirm the worker service is operational."""
    return {"message": "Worker Service is operational."}
