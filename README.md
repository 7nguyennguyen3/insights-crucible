# Insights Crucible

**A product of [Embercore LLC](https://www.insightscrucible.com)**

> Transform podcasts, videos, and long-form content into structured learning materials and actionable insights using advanced AI analysis.

![Insights Crucible](https://img.shields.io/badge/Next.js-15-black?logo=next.js) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?logo=fastapi) ![Google AI](https://img.shields.io/badge/Google%20AI-Gemini-blue?logo=google) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)

## 🎯 Overview

**Insights Crucible** is an AI-powered content analysis platform that transforms passive content consumption into active, structured learning experiences. Upload podcasts, YouTube videos, or text content and receive comprehensive analysis including:

- **Interactive Learning Materials** with quizzes and concept breakdowns
- **Professional Summaries** with key insights and timestamps
- **Business Analysis** with strategic recommendations and market insights
- **Export Options** in PDF, DOCX, and Markdown formats

Perfect for students, researchers, professionals, and lifelong learners looking to extract maximum value from long-form content.

## ✨ Key Features

### 🎭 Analysis Personas

**📚 General Analysis**
- Comprehensive content summaries with timestamps
- Key quotes and notable insights extraction
- Entity identification (people, organizations, concepts)
- Q&A generation with contextual answers

**🎓 Learning Accelerator**
- Interactive quiz questions with explanations
- Structured lesson concepts and learning objectives
- Memory-boosting techniques integration
- Progressive difficulty assessment

**💼 Consultant Mode**
- Executive summaries for business content
- Pain points and opportunity identification
- Strategic insights and recommendations
- Market analysis and competitive intelligence

### 🔄 Content Processing Pipeline

- **Multi-Format Support**: YouTube URLs, MP3/MP4 files, direct text input
- **Professional Transcription**: AssemblyAI integration with word-level timestamps
- **Smart Segmentation**: Automatic content division into logical sections
- **Cross-Section Analysis**: Pattern recognition, contradictions, and theme synthesis
- **Real-Time Processing**: Live status updates with detailed progress tracking

### 📊 Advanced Analytics

- **Argument Structure Analysis**: Thesis identification and supporting evidence
- **Entity Relationship Mapping**: Connections between people, concepts, and ideas
- **Temporal Analysis**: How ideas develop throughout the content
- **Contradiction Detection**: Identify conflicting statements or viewpoints
- **Thematic Clustering**: Group related concepts and ideas

### 🎯 Export & Sharing

- **Multiple Formats**: PDF, DOCX (Word), Markdown export
- **Public Sharing**: Generate shareable links for analysis results
- **Timestamped References**: All insights linked to specific moments
- **Custom Branding**: Professional report formatting
- **Collaborative Features**: Share and discuss analysis results

## 🏗️ Architecture

### Frontend (Next.js + TypeScript)
```
frontend/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── engine/             # Analysis interface
│   │   ├── dashboard/          # User dashboard
│   │   ├── results/           # Analysis results viewer
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── ui/                # Radix UI components
│   │   ├── engine/            # Analysis interface components
│   │   └── home/              # Landing page components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and configurations
│   └── types/                 # TypeScript definitions
```

### Backend (FastAPI + Python)
```
backend/
├── src/
│   ├── main.py                # Application entry point
│   ├── api_routes.py          # Public API endpoints
│   ├── worker_routes.py       # Internal task processing
│   ├── config.py              # Configuration and LLM models
│   ├── models.py              # Pydantic data models
│   ├── features.py            # Core analysis logic
│   ├── db_manager.py          # Firestore database management
│   ├── pipeline/              # Content processing workflows
│   └── security.py            # Authentication and authorization
```

## 🚀 Technology Stack

### Core Technologies
- **Frontend**: Next.js 15, React 19, TypeScript 5
- **Backend**: FastAPI 0.115, Python 3.11+, Uvicorn/Gunicorn
- **Database**: Google Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS 4, Radix UI

### AI & Machine Learning
- **LLM Models**: Google Gemini 2.0 Flash, Gemini 2.5 Flash
- **LLM Framework**: LangChain 0.3
- **Transcription**: AssemblyAI
- **Web Search**: Tavily API

### Cloud Services & Infrastructure
- **Google Cloud Platform**: Storage, Tasks, AI Services
- **Firebase**: Authentication, Firestore, Hosting
- **Stripe**: Payment processing and subscriptions
- **Vercel**: Frontend deployment

### Development & DevOps
- **Package Management**: pnpm (frontend), pip (backend)
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **State Management**: Zustand (React), SWR (data fetching)
- **UI Components**: Radix UI, Lucide React icons

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.11+ and pip
- Google Cloud account with APIs enabled
- Firebase project setup
- AssemblyAI API key
- Stripe account (for payments)

### Frontend Setup

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
cd backend
pip install -r requirements.txt -r requirements-api.txt
python -m uvicorn src.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

**💡 Local Development Tip:** For full functionality with Google Cloud Tasks, you'll need to set up ngrok to create a public tunnel to your local backend. Install ngrok and run `ngrok http 8000`, then add the generated URL to your `.env` file as `WORKER_SERVICE_URL`. See the [Contributing Guide](CONTRIBUTING.md#setting-up-ngrok-for-local-development) for detailed setup instructions.

## ⚙️ Configuration

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

# Local Development (use ngrok for Cloud Tasks integration)
WORKER_SERVICE_URL=https://your-ngrok-url.ngrok.io

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

### LLM Model Configuration

The application supports multiple Google Gemini models configured in `backend/src/config.py`:

- `gemini-2.5-flash` - Best performance for complex analysis
- `gemini-2.0-flash-001` - Main production model
- `gemini-1.5-flash` - Default fallback model

## 📚 API Documentation

### Key Endpoints

**Analysis Endpoints:**
- `POST /api/submit-analysis` - Submit new analysis job
- `GET /api/results/{jobId}` - Get analysis results
- `GET /api/check-analysis/{jobId}` - Check analysis status

**User Management:**
- `POST /api/auth/signup` - User registration
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

**Export & Sharing:**
- `GET /api/results/{jobId}/bulk` - Export analysis results
- `GET /api/public/analysis/{shareId}` - Public analysis sharing

For detailed API documentation, visit `/docs` when running the backend server.

## 🚀 Deployment

### Frontend (Vercel)

```bash
# Deploy to Vercel
vercel --prod

# Or build for production
pnpm build
pnpm start
```

### Backend (Google Cloud Run / Docker)

```bash
# Build Docker image
docker build -t insights-crucible-backend .

# Deploy to Google Cloud Run
gcloud run deploy insights-crucible-backend \
  --image gcr.io/YOUR_PROJECT/insights-crucible-backend \
  --platform managed \
  --port 8000
```

## 🧪 Testing

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
python -m pytest tests/     # Run test suite (if configured)
```

## 📈 Performance & Scaling

- **Async Processing**: All AI analysis runs asynchronously using Google Cloud Tasks
- **Caching**: Intelligent caching for transcripts and analysis results
- **CDN**: Static assets served through Vercel Edge Network
- **Database Optimization**: Firestore indexes for efficient querying
- **Cost Management**: Usage tracking and rate limiting per subscription tier

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript strict mode for frontend code
- Use async/await patterns for Python backend
- Implement proper error handling and validation
- Add tests for new features
- Follow existing code style and conventions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google AI** for Gemini language models
- **AssemblyAI** for professional transcription services
- **Vercel** for frontend hosting and deployment
- **Firebase** for authentication and database services
- **Stripe** for secure payment processing
- **Radix UI** for accessible component primitives

## 📞 Support

- 📧 Email: support@insights-crucible.com
- 📚 Documentation: [docs.insights-crucible.com](https://docs.insights-crucible.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/insights-crucible/issues)
- 💬 Community: [Discord Server](https://discord.gg/insights-crucible)

---

<p align="center">
  Built with ❤️ by the Insights Crucible team<br>
  <em>Transform your learning, one insight at a time</em>
</p>