# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Insights Crucible" - an AI-powered content analysis platform that processes audio, video, and text content to generate actionable insights. The application consists of a FastAPI backend and a Next.js frontend, with Firebase authentication and Google Cloud services integration.

## Architecture

### Backend (FastAPI + Python)

- **Main Entry**: `backend/src/main.py` - All-in-one server with lifespan management
- **API Routes**: `backend/src/api_routes.py` - Main analysis endpoints
- **Worker Routes**: `backend/src/worker_routes.py` - Internal task processing
- **Configuration**: `backend/src/config.py` - Centralized settings and LLM model configs
- **Database**: `backend/src/db_manager.py` - Firestore database management
- **Models**: `backend/src/models.py` - Pydantic models for request/response validation
- **Features**: `backend/src/features.py` - Core analysis pipeline logic
- **Pipeline**: `backend/src/pipeline/` - Content processing workflows

### Frontend (Next.js + TypeScript)

- **Framework**: Next.js 15 with TypeScript and Tailwind CSS
- **Authentication**: Firebase Auth with Zustand state management (`frontend/src/store/authStore.ts`)
- **UI Components**: Radix UI components in `frontend/src/components/ui/`
- **Pages**: App Router structure in `frontend/src/app/`
- **API Integration**: Custom API client in `frontend/src/lib/apiClient.ts`

### Key Dependencies

- **Backend**: FastAPI, LangChain, Google Generative AI, Firebase Admin, Tavily
- **Frontend**: Next.js, React, Firebase, Stripe, Zustand, Radix UI, Tailwind CSS

## Development Commands

### Frontend Commands

```bash
cd frontend
pnpm dev          # Start development server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Backend Commands

```bash
cd backend
# Activate virtual environment (use PowerShell on Windows)
.\venv\Scripts\activate
pip install -r requirements.txt -r requirements-api.txt    # Install dependencies
python -m uvicorn src.main:app --reload --port 8000    # Start development server
```

**Note**: On Windows, use PowerShell to activate the virtual environment. For Claude Code, run Python commands using: `powershell -Command "& { Set-Location 'backend'; & '.\venv\Scripts\python.exe' 'script.py' }"`

### Testing

- **Backend**: Run `python run_debug_tests.py` or files in `backend/tests/`
- **Frontend**: No specific test commands configured - check for test files

## Key Configuration

### Environment Variables

Backend requires `.env` file with:

- `INTERNAL_API_KEY` - Internal API authentication
- `ASSEMBLYAI_API_KEY` - Audio transcription service
- `TAVILY_API_KEY` - Web search integration
- Google Cloud credentials for storage and tasks
- Firebase configuration

### LLM Models

Configured in `backend/src/config.py`:

- `best`: gemini-2.5-flash
- `best-lite`: gemini-2.5-flash-lite-preview-06-17
- `main`: gemini-2.0-flash-001
- `main-lite`: gemini-2.0-flash-lite
- `default`: gemini-1.5-flash

## Important Patterns

### Backend

- Uses async context managers for resource initialization
- Pydantic models for all API request/response validation
- Firebase Firestore for data persistence
- Google Cloud Tasks for job queuing
- LangChain for LLM interactions

### Frontend

- Server components by default, client components marked with "use client"
- Zustand for state management (auth, notifications)
- SWR for data fetching in hooks
- Custom hooks in `frontend/src/hooks/` for complex operations
- Modular component structure with separation of concerns

### Authentication Flow

- Firebase Authentication on frontend
- JWT token validation on backend via `src/security.py`
- User profiles stored in Firestore

### Analysis Pipeline

- Content ingestion (audio/video/text)
- Transcript generation via AssemblyAI
- AI-powered analysis using Google Gemini models
- Export capabilities (PDF, DOCX, Markdown)
- Public sharing functionality

## Database Schema

Uses Firestore with collections for:

- `analyses` - Analysis job records
- `users` - User profiles and subscription data
- `transcripts` - Processed transcript data

## Deployment Notes

- Frontend deployed on Vercel
- Backend can run as single process or distributed worker model
- Google Cloud Storage for file handling
- Stripe integration for billing
