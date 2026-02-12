# AI-Powered Study Planner Frontend

Modern React + Vite + TypeScript frontend using feature-based architecture.

## Architecture

```text
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

## Demo Login

- Student: `student@example.com`
- Admin: `admin@example.com`
- Any password works in frontend mock mode.

## Backend Integration Points

- Auth: `src/context/AuthContext.tsx`
- AI summarization endpoint call: `src/services/aiService.ts`
- Route system: `src/routes/AppRouter.tsx`
