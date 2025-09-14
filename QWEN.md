# Insights Crucible - Project Context

## Project Overview

**Insights Crucible** is an AI-powered content analysis platform that transforms passive content consumption into active, structured learning experiences. The application allows users to upload podcasts, YouTube videos, or text content and receive comprehensive analysis including interactive learning materials, professional summaries, business analysis, and export options in multiple formats.

The platform is built with a modern technology stack:

- **Frontend**: Next.js 15, React 19, TypeScript 5
- **Backend**: FastAPI 0.115, Python 3.11+
- **Database**: Google Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **AI Services**: Google Gemini models via LangChain
- **Other Services**: AssemblyAI for transcription, Tavily for web search

## Architecture

### Frontend (Next.js + TypeScript)

```
frontend/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── engine/             # Analysis interface
│   │   ├── dashboard/          # User dashboard
│   │   ├── results/            # Analysis results viewer
│   │   └── api/                # API routes
│   ├── components/             # React components
│   │   ├── ui/                 # Radix UI components
│   │   ├── engine/             # Analysis interface components
│   │   └── home/               # Landing page components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and configurations
│   └── types/                  # TypeScript definitions
```

### Backend (FastAPI + Python)

```
backend/
├── src/
│   ├── main.py                 # Application entry point
│   ├── api_routes.py           # Public API endpoints
│   ├── worker_routes.py        # Internal task processing
│   ├── config.py               # Configuration and LLM models
│   ├── models.py               # Pydantic data models
│   ├── features.py             # Core analysis logic
│   ├── db_manager.py           # Firestore database management
│   ├── pipeline/               # Content processing workflows
│   └── security.py             # Authentication and authorization
```

## Development Environment Setup

### Prerequisites

- Node.js 18+ and pnpm
- Python 3.11+ and pip
- Google Cloud account with APIs enabled
- Firebase project setup
- AssemblyAI API key
- Stripe account (for payments)

### Frontend Development

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend will be available at `http://localhost:3000`

### Backend Development

```bash
cd backend
pip install -r requirements.txt -r requirements-api.txt
python -m uvicorn src.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## Key Configuration Files

### Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend `.env`:**

```env
# Authentication
INTERNAL_API_KEY=your_internal_api_key

# AI Services
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
ASSEMBLYAI_API_KEY=your_assemblyai_key
TAVILY_API_KEY=your_tavily_key

# Google Cloud
PROJECT_ID=your_gcp_project_id
CLOUD_TASKS_QUEUE=your_task_queue
CLOUD_TASKS_LOCATION=your_location

# Firebase
FIREBASE_CREDENTIALS=your_firebase_credentials_json

# External Services
YOUTUBE_API_KEY=your_youtube_api_key (optional)
```

**Frontend `.env.local`:**

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## LLM Model Configuration

The application supports multiple Google Gemini models configured in `backend/src/config.py`:

- `gemini-2.5-flash` - Best performance for complex analysis
- `gemini-2.0-flash-001` - Main production model
- `gemini-1.5-flash` - Default fallback model

## Key API Endpoints

### Analysis Endpoints:

- `POST /api/submit-analysis` - Submit new analysis job
- `GET /api/results/{jobId}` - Get analysis results
- `GET /api/check-analysis/{jobId}` - Check analysis status

### User Management:

- `POST /api/auth/signup` - User registration
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Export & Sharing:

- `GET /api/results/{jobId}/bulk` - Export analysis results
- `GET /api/public/analysis/{shareId}` - Public analysis sharing

For detailed API documentation, visit `/docs` when running the backend server.

## Development Conventions

### Frontend:

- Uses TypeScript with strict mode
- Implements modern React patterns with hooks
- Uses Tailwind CSS for styling
- Follows Next.js App Router conventions
- Uses Radix UI for accessible components

### Backend:

- Uses FastAPI with Pydantic models for validation
- Implements async/await patterns
- Follows REST API conventions
- Uses dependency injection for shared resources
- Implements proper error handling and logging

## Testing

### Frontend Testing

```bash
cd frontend
pnpm test           # Run tests (if configured)
pnpm lint           # Run ESLint
pnpm type-check     # TypeScript checking
```

### Backend Testing

```bash
cd backend
python run_debug_tests.py    # Run debug tests
python -m pytest tests/      # Run test suite (if configured)
```
