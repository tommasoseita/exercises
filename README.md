# AI Exercise Platform

A web platform for creating and delivering interactive AI-driven exercises, with SCORM export support.

## Architecture

- **Backend**: Node.js + Express + TypeScript + SQLite
- **Frontend**: React + TypeScript + Vite
- **AI**: Claude API (Anthropic)
- **SCORM**: 1.2 compliant export packages

## Setup

```bash
# Install dependencies
npm install

# Set your API key
export ANTHROPIC_API_KEY=your-key-here

# Start backend (port 3001)
cd backend && npm run dev

# Start frontend (port 5173, proxies /api to backend)
cd frontend && npm run dev
```

## Features

### Creator Side
- Full CRUD for exercises (title, description, system prompt)
- Configurable end conditions: max turns, keyword detection, AI-autonomous
- Static or AI-generated feedback on completion
- Optional video URL shown after completion
- Preview exercises before publishing
- Export any exercise as a SCORM 1.2 package (.zip)

### Learner Side
- Browse and start published exercises
- Chat with the AI agent in real-time
- Receive feedback and optional video on completion

### SCORM Export
- Valid .zip with `imsmanifest.xml`
- Self-contained chat UI
- API calls go through backend proxy (no API keys in package)
- Reports `cmi.core.lesson_status = 'completed'` on finish

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/exercises | List all exercises |
| GET | /api/exercises/:id | Get exercise by ID |
| POST | /api/exercises | Create exercise |
| PUT | /api/exercises/:id | Update exercise |
| DELETE | /api/exercises/:id | Delete exercise |
| POST | /api/chat/:exerciseId | Send chat message |
| GET | /api/scorm/:id | Download SCORM package |
