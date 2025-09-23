# Contributing to Insights Crucible

Thank you for your interest in contributing to **Insights Crucible**! 🎯

We're excited to have you help us build an AI-powered content analysis platform that transforms passive content consumption into active, structured learning experiences. This guide will help you get started with contributing to our project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing](#testing)
- [Reporting Issues](#reporting-issues)
- [Community and Communication](#community-and-communication)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@insights-crucible.com](mailto:conduct@insights-crucible.com).

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and **pnpm** (for frontend)
- **Python** 3.11+ and **pip** (for backend)
- **Git** for version control
- A **Google Cloud** account with APIs enabled
- **Firebase** project setup
- **AssemblyAI** API key

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/insights-crucible.git
   cd insights-crucible
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/original-owner/insights-crucible.git
   ```

## Development Environment Setup

### Frontend Setup (Next.js + TypeScript)

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Create `.env.local` file with your configuration:

   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Stripe (for testing)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   STRIPE_SECRET_KEY=your_stripe_secret

   # API Configuration
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

The frontend will be available at `http://localhost:3000`.

### Backend Setup (FastAPI + Python)

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:

   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux
   python -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt -r requirements-api.txt
   ```

4. Create `.env` file with your configuration:

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

   # Local Development with ngrok (see setup instructions below)
   WORKER_SERVICE_URL=https://your-ngrok-url.ngrok.io

   # Firebase
   FIREBASE_CREDENTIALS=your_firebase_credentials_json
   ```

5. Start the development server:
   ```bash
   python -m uvicorn src.main:app --reload --port 8000
   ```

The API will be available at `http://localhost:8000` with documentation at `http://localhost:8000/docs`.

### Setting up ngrok for Local Development

For local development that involves Google Cloud Tasks (which handle asynchronous job processing), you'll need to set up **ngrok** to create a public tunnel to your local backend. This allows Google Cloud Tasks to send job requests back to your local development server.

1. **Install ngrok:**
   ```bash
   # Download from https://ngrok.com/download
   # Or install via package manager:

   # Windows (using Chocolatey)
   choco install ngrok

   # macOS (using Homebrew)
   brew install ngrok

   # Or download directly from https://ngrok.com/download
   ```

2. **Start ngrok tunnel:**
   ```bash
   # In a separate terminal, run:
   ngrok http 8000
   ```

3. **Copy the ngrok URL:**
   - ngrok will display a forwarding URL like `https://abc123.ngrok.io`
   - Copy this URL and update your `.env` file:
   ```env
   WORKER_SERVICE_URL=https://abc123.ngrok.io
   ```

4. **Restart your backend server** to pick up the new environment variable.

**Important Notes:**
- Keep the ngrok terminal running while developing
- The ngrok URL changes each time you restart it (unless you have a paid account)
- Update the `WORKER_SERVICE_URL` in your `.env` file whenever the ngrok URL changes
- This setup is only needed for testing features that involve asynchronous job processing

**Testing the Setup:**
- Submit an analysis job through the frontend
- Check that the job processes correctly and updates status in real-time
- Monitor the ngrok terminal for incoming webhook requests from Google Cloud Tasks

## Project Structure

```
insights-crucible/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and configurations
│   │   └── types/           # TypeScript definitions
│   └── package.json
├── backend/                  # FastAPI backend
│   ├── src/
│   │   ├── main.py          # Application entry point
│   │   ├── api_routes.py    # Public API endpoints
│   │   ├── worker_routes.py # Internal task processing
│   │   ├── config.py        # Configuration and LLM models
│   │   ├── models.py        # Pydantic data models
│   │   ├── features.py      # Core analysis logic
│   │   ├── pipeline/        # Content processing workflows
│   │   └── tests/           # Test files
│   └── requirements.txt
├── CONTRIBUTING.md           # This file
├── CODE_OF_CONDUCT.md        # Code of conduct
├── README.md                 # Project documentation
└── CLAUDE.md                 # Claude Code assistant instructions
```

## Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

- **🐛 Bug Fixes**: Fix issues in existing functionality
- **✨ New Features**: Add new analysis capabilities or UI improvements
- **📚 Documentation**: Improve documentation, examples, or tutorials
- **🧪 Tests**: Add or improve test coverage
- **🎨 UI/UX**: Enhance user interface and experience
- **⚡ Performance**: Optimize existing code for better performance
- **♿ Accessibility**: Improve accessibility features

### Before You Start

1. **Check existing issues** to see if your idea or bug is already being worked on
2. **Create an issue** to discuss new features before implementing them
3. **Join our Discord** to discuss ideas with the community
4. **Review our roadmap** to align with project priorities

### Workflow

1. **Create a branch** for your feature:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** following our code style guidelines

3. **Test your changes** thoroughly:

   ```bash
   # Frontend
   cd frontend && pnpm lint && pnpm build

   # Backend
   cd backend && python run_debug_tests.py
   ```

4. **Commit your changes** with clear, descriptive messages:

   ```bash
   git commit -m "feat: add new analysis feature for podcast timestamps"
   git commit -m "fix: resolve memory leak in transcript processing"
   git commit -m "docs: update setup instructions for Windows users"
   ```

5. **Push to your fork** and create a pull request

## Pull Request Process

### Before Submitting

- [ ] Your code follows our style guidelines
- [ ] You have tested your changes thoroughly
- [ ] All existing tests pass
- [ ] You have added tests for new functionality
- [ ] Documentation has been updated if necessary
- [ ] Your commit messages are clear and descriptive

### PR Requirements

1. **Clear title** that describes what the PR does
2. **Detailed description** including:

   - What changes were made and why
   - How to test the changes
   - Screenshots for UI changes
   - Any breaking changes or migration notes

3. **Link related issues** using keywords like "Closes #123"

4. **Update documentation** if your changes affect:
   - API endpoints
   - Configuration options
   - User interface
   - Setup procedures

### Review Process

1. All PRs require **at least one review** from a maintainer
2. **Automated checks** must pass (linting, tests, build)
3. PRs should be **up to date** with the main branch
4. **Address feedback** promptly and professionally
5. Once approved, a maintainer will merge your PR

## Code Style Guidelines

### Frontend (TypeScript/React)

- **TypeScript strict mode** is enforced
- Use **functional components** with hooks
- Follow **React best practices** for state management
- Use **Tailwind CSS** for styling with Radix UI components
- **ESLint and Prettier** configurations are provided

#### Example Component Structure:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ExampleComponentProps {
  title: string;
  onSubmit: (data: string) => void;
}

export function ExampleComponent({ title, onSubmit }: ExampleComponentProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    onSubmit(value);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <Button onClick={handleSubmit}>Submit</Button>
    </div>
  );
}
```

### Backend (Python/FastAPI)

- Follow **PEP 8** style guidelines
- Use **async/await** patterns for I/O operations
- **Type hints** are required for all functions
- Use **Pydantic models** for request/response validation
- Follow **FastAPI best practices** for route organization

#### Example Route Structure:

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from ..models import AnalysisRequest, AnalysisResponse
from ..security import get_current_user

router = APIRouter()

class CreateAnalysisRequest(BaseModel):
    content: str
    analysis_type: str

@router.post("/analysis", response_model=AnalysisResponse)
async def create_analysis(
    request: CreateAnalysisRequest,
    current_user: dict = Depends(get_current_user)
) -> AnalysisResponse:
    """Create a new content analysis."""
    try:
        # Implementation here
        pass
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### General Guidelines

- **Write clear, self-documenting code**
- **Add comments for complex logic**
- **Use meaningful variable and function names**
- **Keep functions small and focused**
- **Handle errors gracefully**
- **Never commit sensitive information** (API keys, credentials)

## Testing

### Frontend Testing

```bash
cd frontend
pnpm lint          # Run ESLint
pnpm build         # Ensure build works
# Add specific test commands when test suite is implemented
```

### Backend Testing

```bash
cd backend
python run_debug_tests.py    # Run debug tests
# python -m pytest tests/     # Full test suite (when implemented)
```

### Testing Guidelines

- **Write tests for new features**
- **Test edge cases and error conditions**
- **Mock external dependencies** (APIs, databases)
- **Test both success and failure scenarios**
- **Keep tests isolated and independent**

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected vs actual behavior**
- **Environment details** (OS, browser, Node/Python versions)
- **Screenshots or logs** if applicable
- **Minimal reproduction case** if possible

### Feature Requests

For new features, please include:

- **Clear description** of the proposed feature
- **Use case and motivation** for the feature
- **Proposed implementation** approach (if you have ideas)
- **Potential impact** on existing functionality

### Security Issues

**Do not create public issues for security vulnerabilities.** Instead, please email us directly at [security@insights-crucible.com](mailto:security@insights-crucible.com) with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Community and Communication

### Communication Channels

- **GitHub Issues**: For bug reports, feature requests, and project discussion
- **GitHub Discussions**: For questions, ideas, and community discussion
- **Discord Server**: For real-time chat and community interaction
- **Email**: [support@insights-crucible.com](mailto:support@insights-crucible.com) for general inquiries

### Community Guidelines

- **Be respectful** and inclusive to all community members
- **Help others** learn and contribute to the project
- **Ask questions** if you're unsure about anything
- **Share knowledge** and experience with the community
- **Follow our Code of Conduct** in all interactions

### Getting Help

If you're stuck or need help:

1. **Check the documentation** and existing issues first
2. **Search Discord** for similar questions
3. **Ask in GitHub Discussions** for project-related questions
4. **Join our Discord** for real-time help from the community

## Recognition

We value all contributions and maintain a list of contributors in our project. By contributing, you'll be:

- **Listed as a contributor** on our GitHub repository
- **Mentioned in release notes** for significant contributions
- **Invited to join** our contributors' Discord channel
- **Eligible for contributor swag** (when available)

## Development Tips

### Useful Commands

```bash
# Frontend development
cd frontend
pnpm dev --turbopack     # Fast development with Turbopack
pnpm lint --fix          # Auto-fix linting issues
pnpm build && pnpm start # Test production build

# Backend development
cd backend
.\venv\Scripts\activate  # Activate virtual environment (Windows)
python -m uvicorn src.main:app --reload --port 8000  # Start with auto-reload
```

### IDE Recommendations

- **VS Code** with extensions:
  - TypeScript and JavaScript Language Features
  - Python
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

### Debugging

- **Frontend**: Use browser developer tools and React Developer Tools
- **Backend**: Use FastAPI's automatic documentation at `/docs` endpoint
- **API Testing**: Use the interactive docs or tools like Postman/Insomnia

---

Thank you for contributing to Insights Crucible! Together, we're building something that will help people learn more effectively from the content they consume. 🚀

**Questions?** Feel free to reach out through any of our communication channels. We're here to help!
