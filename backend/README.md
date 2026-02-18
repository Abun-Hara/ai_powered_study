# Backend (Supabase)

This folder contains the backend partition for the AI-Powered Study Planner.

## Structure

- `backend/supabase/functions/ai-summarize/index.ts`: secure Edge Function for AI summarization.
- `backend/.env.example`: backend environment variables for local function development.
- `supabase/schema.sql`: database schema, RLS, storage policies, and SQL business logic.
- `backend/server`: Node server for OpenAI summaries, chat, flashcards, and study plan.

## Setup

1. Run the SQL from `supabase/schema.sql` in Supabase SQL Editor.
2. Deploy Edge Function:
   - `supabase functions deploy ai-summarize`
3. Set Edge Function secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
4. Invoke function from frontend with the logged-in user's access token.

## Notes

- Roles: `user`, `admin` in `public.users`.
- Suspension: set `public.users.status = 'suspended'`.
- Admin analytics: query `public.admin_system_analytics`.
