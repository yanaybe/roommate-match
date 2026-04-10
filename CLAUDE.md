# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server on port 8080
npm run build        # Production build
npm run build:dev    # Dev build
npm run lint         # ESLint
npm run test         # Run tests once (Vitest)
npm run test:watch   # Watch mode
```

For E2E tests, Playwright is configured but uses `npx playwright test`.

## Architecture

**Stack**: React 18 + TypeScript + Vite + Supabase + Tailwind CSS + shadcn/ui

### Provider Layer (App.tsx)
Wraps the app in this order: `QueryClientProvider → AuthProvider → LanguageProvider → UnreadCountProvider → TooltipProvider → Router`. All 20 routes are defined in App.tsx.

### Data Layer
- **Supabase** is the sole backend — PostgreSQL + Auth. Client is at `src/integrations/supabase/client.ts`.
- Auto-generated TypeScript types live in `src/integrations/supabase/types.ts`. Do not hand-edit these.
- Data fetching is mostly raw Supabase calls inside `useEffect` hooks (not React Query, despite it being installed).

### Key Database Tables
| Table | Purpose |
|-------|---------|
| `profiles` | 30+ field user profile (lifestyle, habits, budget, preferences) |
| `apartments` | Listings with amenities, location, images |
| `squads` | Groups of roommate-seekers searching together |
| `squad_members` | Squad membership with status/role |
| `squad_invites` | Invite system (unique constraint: squad_id + invitee_id) |
| `squad_likes` | Per-user apartment votes within a squad |
| `conversations` / `messages` | Direct messaging |
| `saved_apartments` | User bookmarks |
| `liked_profiles` | Roommate likes |

### State Management
No Redux/Zustand. Uses:
- **Context API**: `AuthContext`, `LanguageContext`, `UnreadCountContext` — accessed via `useAuth()`, `useLanguage()`, `useUnreadCount()`
- **Custom hooks** in `src/hooks/` for data fetching
- **Local `useState`** for UI state
- **React Hook Form + Zod** for form validation

### Matching Algorithm (`src/lib/matching.ts`)
Three weighted scoring functions (0–100):
- `calculateUserMatch()` — 14 lifestyle factors (smoking 15%, cleanliness 15%, sleep schedule 12%, ...)
- `calculateRoomMatch()` — 30% budget fit + 70% avg roommate compatibility
- `calculateSquadMatch()` — 20% budget + 20% preferences + 60% member compatibility

### Routing
Bottom nav bar persists on main pages (Rooms `/`, Roommates `/roommates`, Create, Chats `/chats`, Profile `/profile`). Protected routes use `useRequireAuth` and `useRequireVerified` hooks.

### Internationalization
`useLanguage()` provides a `t()` translation function. Supports English, Hebrew (RTL), and French. Language state lives in `LanguageContext`.

### UI Components
`src/components/ui/` contains 50+ shadcn/ui components (Radix UI + Tailwind). Do not modify these directly — use the shadcn CLI to add/update components. Custom app components live in `src/components/`.

### Path Alias
`@/` maps to `src/` — use it for all internal imports.
