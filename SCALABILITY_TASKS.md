# Roomatch — Scalability Tasks

Generated: 2026-05-23

---

## Database Indexes

### SCALE-DB01: Missing index on liked_profiles(user_id, created_at)
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/hooks/useDailyLimits.tsx`
- **Problem:** Daily limit check queries `liked_profiles` filtered by `user_id` and `created_at >= todayStart`. Without an index on these columns the query is a full table scan. At 10k users × 50 likes/day average = 500k rows, this query will take seconds.
- **Solution:** `CREATE INDEX idx_liked_profiles_user_date ON liked_profiles(user_id, created_at DESC);`
- **Complexity:** XS
- **Dependencies:** DB migration access

### SCALE-DB02: Missing index on reports(reporter_id, created_at)
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/hooks/useBlockReport.ts`
- **Problem:** Report rate limit check counts rows with `reporter_id = X AND created_at >= 24h_ago`. Without an index this is a full scan on every report submission.
- **Solution:** `CREATE INDEX idx_reports_reporter_date ON reports(reporter_id, created_at DESC);`
- **Complexity:** XS
- **Dependencies:** None

### SCALE-DB03: Missing index on messages(conversation_id, created_at)
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/Chats.tsx`
- **Problem:** Messages are queried by `conversation_id` and ordered by `created_at`. With a high-traffic conversation, this query scans the entire messages table.
- **Solution:** `CREATE INDEX idx_messages_conv_time ON messages(conversation_id, created_at DESC);`
- **Complexity:** XS
- **Dependencies:** None

---

## Query Optimization

### SCALE-Q01: RoommateProfile fetches 50 profiles to display 1
- **Priority:** P1
- **Severity:** Critical
- **Files affected:** `src/pages/RoommateProfile.tsx` line 72
- **Problem:** `useAllProfiles()` loads up to 50 rows from the profiles table. The component then runs `.find(p => p.user_id === id)` to get 1 record. This is a 50x data over-fetch on every profile page view.
- **Solution:** Replace `useAllProfiles()` with a direct query: `supabase.from('profiles').select('*').eq('user_id', id).maybeSingle()`
- **Complexity:** S
- **Dependencies:** None

### SCALE-Q02: Chats.tsx fetches ALL messages for ALL conversations
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/Chats.tsx` loadConversations function
- **Problem:** Step 4 of loadConversations fetches ALL messages from ALL conversation IDs with no LIMIT. 50 conversations × 200 messages each = 10,000 rows per page load.
- **Solution:** For conversation list: only fetch `LIMIT 1` latest message per conversation (use a subquery or DB view). Only load full message history when a specific conversation is opened, paginated (LIMIT 50, offset on scroll-up).
- **Complexity:** M
- **Dependencies:** Possible DB view

### SCALE-Q03: SquadHub runs full client-side match computation for all squads
- **Priority:** P2
- **Severity:** High
- **Files affected:** `src/pages/SquadHub.tsx`, `src/hooks/useSquad.ts`
- **Problem:** `useDiscoverSquads` fetches all open squads, all members, and all profiles. Then client computes `calculateUserMatch()` for every member of every squad. 500 squads × 10 members = 5000 match calculations per page load.
- **Solution:** Create a server-side RPC function `discover_squads(user_id, limit, offset)` that returns squads pre-sorted by compatibility score. Pre-compute scores in a materialized view refreshed on profile update.
- **Complexity:** L
- **Dependencies:** PostgreSQL RPC function

---

## Pagination

### SCALE-P01: Swipe deck sorted by created_at — best matches buried
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/hooks/useProfile.ts` (useAllProfiles), `src/pages/Roommates.tsx`
- **Problem:** Profiles are fetched in created_at DESC order (newest users first). A user's best match may have signed up 6 months ago and sits at pagination position 300+, never surfaced.
- **Solution:** Pre-compute compatibility scores server-side. Sort swipe deck by compatibility score descending. Use cursor-based pagination with score as cursor.
- **Complexity:** XL
- **Dependencies:** Server-side matching (SCALE-M01)

### SCALE-P02: No city-based DB filtering before swipe deck
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/hooks/useProfile.ts`
- **Problem:** useAllProfiles fetches all onboarded profiles regardless of city. A Tel Aviv user sees Beer Sheva profiles, Jerusalem profiles, etc. in their swipe deck.
- **Solution:** Add `WHERE city = ANY(user.preferred_cities)` to the profiles query. Fall back to no filter if user hasn't set city preference.
- **Complexity:** S
- **Dependencies:** User profile loaded before fetch

### SCALE-P03: No age-range filtering in swipe deck
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/hooks/useProfile.ts`
- **Problem:** preferred_age_min/max fields exist in profiles but are only used as match score modifiers, not as DB-level filters. A user who wants 22-30 year olds still sees 55-year-olds in their deck.
- **Solution:** Add `WHERE age BETWEEN user.preferred_age_min AND user.preferred_age_max` to the profiles fetch query.
- **Complexity:** S
- **Dependencies:** User's preferred_age_min/max must be available before the query

---

## Caching

### SCALE-C01: React Query installed but never used
- **Priority:** P2
- **Severity:** High
- **Files affected:** `src/App.tsx`, all pages using useEffect + Supabase
- **Problem:** `@tanstack/react-query` is installed and a `QueryClient` is initialized, but all data fetching uses raw `useEffect` + `useState`. Every navigation to any page triggers fresh network requests. No deduplication, no background refresh, no stale-while-revalidate.
- **Solution:** Migrate top data fetching hooks to `useQuery`: `useProfile` (staleTime: 5 min), `useAllProfiles` (staleTime: 2 min), apartment lists (staleTime: 1 min). Use `queryClient.invalidateQueries()` on mutations.
- **Complexity:** XL
- **Dependencies:** None

### SCALE-C02: useProfile re-fetches on every mount
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/hooks/useProfile.ts`
- **Problem:** `useProfile` fires a new Supabase request every time any component mounts. The user's own profile almost never changes between navigation events. At 20 navigations per session = 20 unnecessary profile requests.
- **Solution:** Migrate to React Query with `staleTime: 5 * 60 * 1000`. Data is served from cache for 5 minutes before background refresh.
- **Complexity:** S
- **Dependencies:** SCALE-C01 migration

---

## Server-Side Computation

### SCALE-M01: Matching algorithm must move server-side
- **Priority:** P2
- **Severity:** High
- **Files affected:** `src/lib/matching.ts`
- **Problem:** `calculateUserMatch()` runs in the browser for every visible card on every render. At 1000+ profiles this causes browser-side compute bottleneck. At 100k users, client-side matching is architecturally impossible.
- **Solution:** Create PostgreSQL function `calculate_user_match(profile_a_id UUID, profile_b_id UUID) RETURNS INTEGER`. Call via `supabase.rpc()`. Pre-compute scores nightly for all pairs and cache in a `match_scores` table.
- **Complexity:** XL
- **Dependencies:** DB migration, new table

---

## Real-time Subscriptions

### SCALE-RT01: Apartments real-time subscription persists across navigation
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/Index.tsx`
- **Problem:** The `apartments:realtime` Supabase channel is opened on Index mount. When the user navigates to /chats or /profile, the subscription stays open (the component never unmounts at the root level due to React Router's layout structure). Verified: `return () => { supabase.removeChannel(channel); }` IS in the code — no issue here. However the channel is created unconditionally even for unauthenticated users viewing the landing page.
- **Solution:** Gate channel creation inside `if (user)` block to avoid anonymous subscriptions.
- **Complexity:** XS
- **Dependencies:** None
