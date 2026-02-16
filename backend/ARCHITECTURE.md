# Backend Architecture (Supabase)

## Partition

- Frontend: React app under `src/`
- Backend: Supabase schema + Edge Functions under `supabase/` and `backend/supabase/functions/`

## Auth and Roles

- Supabase Auth (email/password)
- App roles in `public.users.role` (`user`, `admin`)
- Suspension flag in `public.users.status` (`active`, `suspended`)

## Data Model

- `public.users`
- `public.courses`
- `public.tasks`
- `public.study_logs`
- `public.ai_usage`
- `public.ai_summaries`
- `public.uploaded_files` (PDF metadata)

## RLS Model

- Every table is RLS-enabled.
- Regular users can access rows where `user_id = auth.uid()` (or `id = auth.uid()` for `users` table).
- Admins can access all rows via `public.is_admin(auth.uid())`.

## Storage Model

- Private bucket: `study-pdfs`
- Object path convention: `<auth.uid()>/<filename>.pdf`
- Storage policies allow owner or admin only.
- Metadata written to `public.uploaded_files`.

## Business Logic (SQL)

- `public.mark_task_completed(task_id)`:
  - sets task status to completed
  - sets completion timestamp
  - increments `study_logs` for that day
- `public.get_progress_percentage(user_id)`:
  - returns completed/total * 100
- `public.get_study_streak(user_id)`:
  - returns consecutive days with task completions
- `public.assert_daily_ai_limit(user_id, additional_tokens)`:
  - blocks over-limit usage
- `public.track_ai_usage(action_type, tokens_used)`:
  - validates limit and records usage

## Admin Features

- List users: `select * from public.users`
- Suspend/activate users: update `public.users.status`
- Analytics: `select * from public.admin_system_analytics`

