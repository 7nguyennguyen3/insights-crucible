# Insights Crucible

## Project Overview

**Insights Crucible** is an AI-powered content analysis platform designed to transform podcasts, videos, and long-form text into structured learning materials and actionable insights.

**Core Functionality:**
-   **Ingestion:** Accepts YouTube URLs, audio/video files (MP3/MP4), and direct text.
-   **Analysis:** Uses Google Gemini (2.0/2.5) models via LangChain to generate summaries, quizzes, business insights, and more.
-   **Transcription:** Integrates with AssemblyAI for high-quality transcripts with timestamps.
-   **Storage:** Persists data in Google Firestore and files in Google Cloud Storage.

## Technology Stack

### Frontend
-   **Framework:** Next.js 15 (App Router)
-   **Language:** TypeScript 5
-   **UI Library:** React 19, Radix UI, Tailwind CSS 4
-   **State Management:** Zustand, SWR
-   **Auth:** Firebase Authentication

### Backend
-   **Framework:** FastAPI 0.115
-   **Language:** Python 3.11+
-   **AI/LLM:** Google Gemini, LangChain
-   **Transcription:** AssemblyAI
-   **Database:** Google Firestore (NoSQL)
-   **Task Queue:** Google Cloud Tasks

## Directory Structure

### `frontend/`
-   `src/app/`: Next.js App Router pages and layouts.
-   `src/components/`: Reusable UI components (Radix UI, domain-specific).
-   `src/lib/`: Utilities, API clients, and service configurations.
-   `src/store/`: Zustand state stores (auth, user profile).

### `backend/`
-   `src/main.py`: Application entry point and lifespan management.
-   `src/api_routes.py`: Public API endpoints.
-   `src/worker_routes.py`: Internal task processing endpoints.
-   `src/pipeline/`: Complex content processing workflows.
-   `src/features.py`: Core analysis logic.
-   `src/config.py`: Configuration and LLM model definitions.

## key Commands

### Frontend (`frontend/`)
-   **Install Dependencies:** `pnpm install`
-   **Development Server:** `pnpm dev` (Runs on http://localhost:3000)
-   **Build:** `pnpm build`
-   **Lint:** `pnpm lint`

### Backend (`backend/`)
-   **Install Dependencies:** `pip install -r requirements.txt -r requirements-api.txt`
-   **Development Server:** `python -m uvicorn src.main:app --reload --port 8000` (Runs on http://localhost:8000)
-   **Testing:** `python -m pytest tests/`

## Development Conventions

-   **TypeScript:** Enforce strict mode. Prefer server components where possible; use `"use client"` only when necessary.
-   **Python:** Use `async/await` for all I/O bound operations. Use Pydantic models for request/response validation.
-   **Styling:** Tailwind CSS for styling. Follow the existing design system.
-   **State:** Use Zustand for global client state (auth, notifications).
-   **API:** All backend endpoints should be typed and documented via FastAPI's auto-generated docs.
