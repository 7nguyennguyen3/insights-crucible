from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src import config
from src.api_routes import router as analysis_router
from src import db_manager


# This context manager will run startup and shutdown logic
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initializes shared resources like the database connection on startup.
    """
    db_manager.initialize_db()
    yield
    print("INFO:     API Service shutdown...")


# Initialize the FastAPI app
app = FastAPI(
    title="Transcript Analysis API - API Service",
    description="An API to validate and enqueue transcript analysis jobs.",
    version="1.0.0",
    lifespan=lifespan,
)

# Define the origins that are allowed to connect
origins = [
    "http://localhost:3000",
    "https://your-production-frontend.com",  # Remember to change this
]

# Add the CORS middleware to allow cross-origin requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include only the router responsible for handling analysis requests
app.include_router(analysis_router, prefix="/api", tags=["Analysis"])


@app.get("/", tags=["Root"])
async def read_root():
    """A simple root endpoint to confirm the API service is running."""
    return {"message": "Welcome to the Transcript Analysis API Service!"}
