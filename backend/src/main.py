from dotenv import load_dotenv

load_dotenv()
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# --- THIS IS THE FIX ---
# Import the routers from their new, separate files
from src.api_routes import router as analysis_router
from src.worker_routes import router as task_router

# --- END FIX ---

from src import db_manager

# This allows you to load variables from a .env file for local development


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- Initializing application and database connection ---")
    db_manager.initialize_db()
    yield
    print("--- Application shutting down ---")


app = FastAPI(
    title="Transcript Analysis API (Local Dev Mode)",
    lifespan=lifespan,
)

# Your standard CORS setup
origins = ["http://localhost:3000", "https://your-frontend.com"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include BOTH routers for the all-in-one server ---
print("--- Including API router at /api ---")
app.include_router(analysis_router, prefix="/api", tags=["Analysis"])

print("--- Including WORKER router at /api/tasks ---")
app.include_router(task_router, prefix="/api/tasks", tags=["Internal Tasks"])


@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Local All-in-One Server is running!"}
