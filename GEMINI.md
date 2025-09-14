# Project: Insights Crucible

## Project Overview

**Insights Crucible** is an AI-powered content analysis platform that transforms passive content consumption into active, structured learning experiences. It takes podcasts, YouTube videos, or text content and generates comprehensive analysis, including interactive learning materials, professional summaries, and business analysis.

The application is a full-stack solution with a **Next.js** and **TypeScript** frontend and a **FastAPI** and **Python** backend. It leverages **Google Gemini** for its core AI capabilities, **Google Firestore** as its database, and **Firebase** for authentication.

## Building and Running

### Frontend

To run the frontend development server:

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend will be available at `http://localhost:3000`.

### Backend

To run the backend server:

```bash
cd backend
pip install -r requirements.txt -r requirements-api.txt
python -m uvicorn src.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### Testing

**Frontend:**

```bash
cd frontend
pnpm test           # Run tests (if configured)
pnpm lint           # Run ESLint
pnpm type-check     # TypeScript checking
```

**Backend:**

```bash
cd backend
python run_debug_tests.py    # Run debug tests
python -m pytest tests/     # Run test suite (if configured)
```

## Development Conventions

*   **Frontend:**
    *   Uses **TypeScript** with strict mode.
    *   Styling is done with **Tailwind CSS** and **Radix UI**.
    *   State management is handled by **Zustand** and data fetching with **SWR**.
    *   Code quality is enforced with **ESLint** and **Prettier**.
*   **Backend:**
    *   Uses **Python** with async/await patterns.
    *   **Pydantic** is used for data modeling.
    *   **LangChain** is used as the LLM framework.
*   **General:**
    *   Follow existing code style and conventions.
    *   Implement proper error handling and validation.
    *   Add tests for new features.
