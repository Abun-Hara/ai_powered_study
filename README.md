# AI-Powered Study Planner

Modern React + Vite + TypeScript frontend with Supabase backend architecture.

## Architecture

```text
frontend/
  src/
backend/
  supabase/
    functions/
supabase/
  schema.sql

src/
  app/
  components/
    ui/
    layout/
    shared/
  features/
    auth/
    courses/
    schedule/
    analytics/
    ai/
    admin/
    dashboard/
  hooks/
  services/
  context/
  utils/
  routes/
```

## Implemented UI Features

- Auth: Login/Register with `react-hook-form` + `zod` validation
- Password visibility toggle + remember me + OAuth placeholder button
- Protected routes with role-based admin access
- Collapsible sidebar + topbar + mobile menu + avatar dropdown + notifications button
- Course management: add/edit/delete (modal), search/filter, pagination, course color + deadline picker
- Drag/drop weekly planner with `dnd-kit`, duration resizing, and auto-save
- AI notes area: drag/drop PDF upload UI, loading skeleton, summary cards, copy/save actions
- Analytics: weekly/monthly toggle, bar chart + pie chart
- Dark/light theme with local storage persistence
- UX states: toast notifications, skeletons, empty states, error boundary, confirmation modal

## Run

```bash
npm install
npm run dev
npm run build
```

## Supabase Backend Setup

1. Copy `.env.example` to `.env` and fill:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. In Supabase SQL editor, run `supabase/schema.sql`.
3. Create users from the UI, then set admin users by updating `users.role = 'admin'` in Supabase.
4. Restart the dev server after changing env vars.

## Demo Login

- Register a real user from the app (Supabase Auth).
- Password must match the one used at sign-up.
- Admin access is controlled by `users.role = 'admin'`.

## Backend Integration Points

- Supabase client: `src/lib/supabase.ts`
- Auth state and session sync: `src/store/authStore.ts`
- Courses CRUD (database): `src/features/courses/api.ts`
- Full backend docs: `backend/ARCHITECTURE.md`
