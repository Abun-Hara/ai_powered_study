# Node AI Server

Express server for OpenAI summaries, Q&A chat, flashcards, and study plans.

## Setup
1. Copy `backend/server/.env.example` to `backend/server/.env`.
2. Install deps in `backend/server`:
   - `npm install`
3. Run:
   - `npm run dev`

## Endpoints
- `POST /api/ai/summarize` (multipart)
  - `file` (PDF or image) OR `text`
  - requires `Authorization: Bearer <supabase access token>`
- `POST /api/ai/chat`
  - `{ messages: [{ role, content }] }`
- `POST /api/ai/flashcards`
  - `{ text, count?, difficulty? }`
- `POST /api/ai/study-plan`
  - `{ goal, timeframeWeeks?, hoursPerWeek?, subjects? }`

All endpoints require a Supabase access token and log usage to `ai_usage`.
