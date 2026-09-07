# Sereenify — Cognitive Image Therapy Platform

AI-powered reminiscence therapy application using historical photographs to support Alzheimer's patients and caregivers.

---

## Project Structure

```
serenify/
├── frontend/          # React 19 + Vite 6 + Tailwind CSS v4 client
└── backend/           # FastAPI + LangChain + Unsplash + NeMo audio service
```

---

## Frontend

**Stack:** React 19 · Vite 8 · Tailwind CSS v4 · React Router v7 · React Hook Form · Recharts

```bash
cd frontend
npm install        # first time only
npm run dev        # dev server → http://localhost:3000
npm run build      # production build → frontend/dist/
```

---

## Backend

**Stack:** FastAPI · Uvicorn · LangChain + Groq LLM · Unsplash API · NeMo ASR

```bash
cd backend
# Activate virtual environment (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start API server
uvicorn main:app --reload --port 8000
```

The backend requires a `.env` file inside `backend/` with:
```
UNSPLASH_ACCESS_KEY=...
UNSPLASH_SECRET_KEY=...
GROQ_API_KEY=...
QDRANT_URL=...
QDRANT_API_KEY=...
HF_TOKEN=...
```

---

## Key Features

- **AI Image Search** — Groq LLM generates personalized Unsplash search queries from patient profiles
- **Audio Analysis** — NeMo-based acoustic biomarker extraction and ASR transcription (Hindi/multilingual)
- **Cognitive Scoring** — Lexical density, filler word detection, semantic relevance scoring
- **Reminiscence Therapy Sessions** — Curated image-response loop with AI-powered analysis
