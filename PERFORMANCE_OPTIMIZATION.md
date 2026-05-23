# Roomatch — Performance Optimization

Generated: 2026-05-23

---

## Critical — Data Over-fetch

### PERF-C01: RoommateProfile fetches 50 profiles to display 1
- **Priority:** P1
- **Severity:** Critical
- **Files affected:** `src/pages/RoommateProfile.tsx` line 72
- **Problem:** `useAllProfiles()` fetches up to 50 rows. `.find(p => p.user_id === id)` extracts 1. This is a 50x data over-fetch on every profile view. Each profile has 30+ columns including bio, photos arrays, and all lifestyle fields.
- **Estimated waste:** ~50KB of JSON transferred per profile view (50 profiles × ~1KB each).
- **Solution:** Replace with direct single-row query:
  ```ts
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', id)
    .maybeSingle();
  ```
- **Complexity:** S
- **Dependencies:** None

---

## High — N+1 and Sequential Queries

### PERF-H01: Chats.tsx — all messages for all conversations fetched
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/Chats.tsx` loadConversations (step 4)
- **Problem:** `loadConversations` fetches ALL messages for ALL conversation IDs (`.in("conversation_id", convIds)`) with no LIMIT. At 50 conversations × 200 messages average = 10,000 rows per page load.
- **Estimated cost:** 10,000 DB rows → ~500KB JSON → 2-3 second load time at scale.
- **Solution:** 
  1. For conversation list view: use a DB view or lateral join to get only the latest 1 message per conversation.
  2. Load full messages only when a conversation is opened, LIMIT 50, load more on scroll-up.
  ```sql
  -- Create view: latest_message_per_conversation
  SELECT DISTINCT ON (conversation_id) *
  FROM messages
  ORDER BY conversation_id, created_at DESC;
  ```
- **Complexity:** M
- **Dependencies:** DB migration for view

### PERF-H02: Real-time apartment subscription — unnecessary for unauthenticated users
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/Index.tsx`
- **Problem:** The `apartments:realtime` subscription channel is opened unconditionally on mount, including for the landing page viewer (where Index is never shown, but confirming the pattern). The subscription should only be active when the user is logged in and on the Index page.
- **Solution:** Gate the channel creation: `if (user) { const channel = supabase.channel(...).subscribe(); return () => supabase.removeChannel(channel); }` The cleanup is already there but the user check is missing.
- **Complexity:** XS
- **Dependencies:** None

### PERF-H03: items computed without useMemo in Roommates
- **Priority:** P2
- **Severity:** High
- **Files affected:** `src/pages/Roommates.tsx` line 92
- **Problem:** `const items = otherProfiles.map(...)` creates a new array on every render. `otherProfiles` is already memoized, but `items` is not. framer-motion re-renders on drag, causing items to be recomputed frequently.
- **Solution:** Wrap in `useMemo`: `const items = useMemo(() => otherProfiles.map(p => ({ user: p.user, matchPercent: p.matchPercent })), [otherProfiles]);`
- **Complexity:** XS
- **Dependencies:** None

---

## High — Client-side Computation

### PERF-H04: Matching algorithm runs in browser for all profiles
- **Priority:** P2
- **Severity:** High
- **Files affected:** `src/lib/matching.ts`, `src/pages/Roommates.tsx`, `src/pages/RoommateProfile.tsx`
- **Problem:** `calculateUserMatch()` is called in the browser for every profile in the swipe deck on every render. The algorithm involves 14 weighted comparisons per pair. At 50 profiles × 14 comparisons = 700 computations per render triggered by framer-motion drag events.
- **Solution:** Move to PostgreSQL function. Pre-compute and cache scores. Return only score from API, not computation.
- **Complexity:** XL
- **Dependencies:** DB function creation

### PERF-H05: SquadHub runs O(squads × members) match computations client-side
- **Priority:** P2
- **Severity:** High
- **Files affected:** `src/pages/SquadHub.tsx` discoverProfiles useMemo, `src/pages/MySquads.tsx`
- **Problem:** The `discoverProfiles` memo in SquadHub computes `calculateUserMatch()` for every member of every squad against the current user. At 100 squads × 10 members = 1000 match computations. The `groupCompatibility` memo adds another O(members²) computation.
- **Solution:** Pre-compute squad compatibility scores server-side in a `squad_match_scores(user_id, squad_id, score)` materialized view. Refresh on profile update or squad member change.
- **Complexity:** L
- **Dependencies:** DB function

---

## Medium — Caching

### PERF-M01: useProfile re-fetches on every component mount
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/hooks/useProfile.ts`
- **Problem:** Every component that calls `useProfile()` (there are 10+ pages) fires a new Supabase query on mount. The user's own profile changes rarely. At 20 navigation events per session = 20 unnecessary profile fetches.
- **Estimated waste:** 20 network requests × 1KB profile JSON = 20KB of redundant data transfer per session.
- **Solution:** Migrate to React Query: `useQuery({ queryKey: ['profile', user?.id], queryFn: fetchProfile, staleTime: 5 * 60 * 1000 })`. Profile is served from cache for 5 minutes before background refresh.
- **Complexity:** M
- **Dependencies:** React Query migration plan

### PERF-M02: JSON.stringify filter comparison is order-dependent
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/pages/Index.tsx`
- **Problem:** Active filter indicator uses `JSON.stringify(filters) !== JSON.stringify(defaultFilters)`. If the filter object's key order ever changes (e.g., after a lodash merge or spread), this comparison silently breaks — showing the wrong active state.
- **Solution:** Import `fast-deep-equal` or compare individual fields: `const isFiltered = filters.minPrice !== defaultFilters.minPrice || filters.city !== defaultFilters.city || ...`
- **Complexity:** XS
- **Dependencies:** None

---

## Medium — Bundle Size

### PERF-B01: @tanstack/react-query installed but unused
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/App.tsx`, `package.json`
- **Problem:** `@tanstack/react-query` is a ~45KB gzipped dependency. The `QueryClient` is initialized in App.tsx but no `useQuery` hook is used anywhere in the codebase. This adds bundle weight with no benefit.
- **Solution:** Either migrate data fetching to React Query (recommended — see PERF-M01) or remove the dependency entirely: `npm uninstall @tanstack/react-query @tanstack/react-query-devtools`.
- **Complexity:** XS (remove) or XL (migrate)
- **Dependencies:** Decision on architecture direction

---

## Low — Animation Performance

### PERF-L01: AnimatePresence over large lists in Chats
- **Priority:** P2
- **Severity:** Low
- **Files affected:** `src/pages/Chats.tsx` conversations list
- **Problem:** `AnimatePresence` wraps the entire conversations list. Every add/remove triggers layout animation for all visible conversations.
- **Solution:** Use `AnimatePresence mode="popLayout"` for smoother exits. Consider virtualizing the conversation list with `react-virtual` when list exceeds 50 items.
- **Complexity:** S
- **Dependencies:** None
