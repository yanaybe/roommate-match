# Roomatch — Technical Debt

Generated: 2026-05-23

---

## TypeScript Safety Issues

### TD-TS01: FullProfile type missing 10+ columns (14+ `as any` casts)
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/hooks/useProfile.ts`, `src/pages/Onboarding.tsx`, `src/pages/Settings.tsx`, `src/pages/Profile.tsx`, `src/pages/Chats.tsx`, `src/pages/RoommateProfile.tsx`
- **Problem:** `FullProfile` extends `ProfileData` but `ProfileData` does not include: `smoking_preference`, `pet_preference`, `lifestyle_vibe`, `phone_verified`, `phone_number`, `subscription_tier`, `paddle_customer_id`, `paddle_subscription_id`, `subscription_expires_at`, `is_premium`, `photos`. Every access to these fields requires `(profile as any).field_name`, bypassing TypeScript entirely.
- **Count:** 14+ instances of `(profile as any)` and `(data as any)` found across the codebase.
- **Solution:** 
  ```bash
  supabase gen types typescript --local > src/integrations/supabase/types.ts
  ```
  Then update `FullProfile` to include all fields or extend from the generated `Database['public']['Tables']['profiles']['Row']` type.
- **Complexity:** M
- **Dependencies:** Supabase CLI installed locally

### TD-TS02: (apartment as any) in ApartmentDetail
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/pages/ApartmentDetail.tsx` `dbRowToApartment` function
- **Problem:** `listingType: (row.listing_type ?? "room") as "room" | "entire_place"` — field accessed from `any` typed row. The `Apartment` type in `src/data/mockData.ts` does not include `listingType`. This requires consuming code to also use `(apartment as any).listingType`.
- **Solution:** Add `listingType: "room" | "entire_place"` to the `Apartment` interface in `src/data/mockData.ts`.
- **Complexity:** XS
- **Dependencies:** None

### TD-TS03: (data as any).subscription_tier in multiple files
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/pages/Settings.tsx` line 134, `src/hooks/useDailyLimits.tsx` line 57
- **Problem:** Both files query `profiles` and access `subscription_tier` via `(data as any).subscription_tier`. If this column is renamed in a migration, both silently return `undefined` and show "Free" to all paid users — including a potential revenue-impacting incident.
- **Solution:** Fix TD-TS01 first (regenerate types). Then remove both casts.
- **Complexity:** XS (after TD-TS01)
- **Dependencies:** TD-TS01

---

## Architecture Problems

### TD-A01: React Query installed but never used
- **Priority:** P2
- **Severity:** High
- **Files affected:** `src/App.tsx`, all data-fetching hooks
- **Problem:** `QueryClient` is initialized at the top of App.tsx. All data fetching uses raw `useEffect` + `useState` instead. This means: no request deduplication, no caching, no background refresh, no stale-while-revalidate, no automatic retry on error.
- **Impact:** Every navigation event triggers multiple redundant Supabase queries. On a 3G connection this is user-visible latency.
- **Solution:** Migrate the 5 most-called hooks first: `useProfile`, `useAllProfiles`, apartment fetching in `Index.tsx`, conversation list in `Chats.tsx`, notification list in `useNotifications`. Use `useQuery` with appropriate `staleTime` values.
- **Complexity:** XL
- **Dependencies:** None

### TD-A02: Auth race condition (onAuthStateChange + getSession)
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/hooks/useAuth.tsx`
- **Problem:** The `useEffect` in `AuthProvider` calls both `supabase.auth.onAuthStateChange()` AND `supabase.auth.getSession()`. Both resolve asynchronously and both call `setLoading(false)`. Whichever resolves first sets loading to false — then the second resolution triggers another state update. This causes a double re-render of all auth-dependent components on every page load.
- **Solution:** Use only `onAuthStateChange`. It fires immediately with the current session on mount (Supabase SDK behavior). Remove the `getSession()` call entirely, or add a `settled` ref:
  ```ts
  const settled = useRef(false);
  // In onAuthStateChange: if (settled.current) return; settled.current = true;
  ```
- **Complexity:** S
- **Dependencies:** None

### TD-A03: signOut() does not reset context state
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/hooks/useAuth.tsx`
- **Problem:** `signOut()` calls `supabase.auth.signOut()` but does not explicitly set `setSession(null)`, navigate away, or invalidate React Query cache. Stale profile data can remain in memory until the next auth state event fires.
- **Solution:**
  ```ts
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    queryClient.clear(); // if React Query migrated
    navigate('/auth');
  };
  ```
- **Complexity:** XS
- **Dependencies:** None

### TD-A04: Route-level ErrorBoundary missing
- **Priority:** P2
- **Severity:** High
- **Files affected:** `src/App.tsx`, `src/components/ErrorBoundary.tsx`
- **Problem:** `ErrorBoundary` wraps the entire app in App.tsx. A JavaScript error in `ApartmentDetail` (e.g., a null dereference on a malformed API response) kills the entire application — chat, profile, navigation are all down.
- **Solution:** Wrap each route individually:
  ```tsx
  <Route path="/apartment/:id" element={
    <ErrorBoundary><ApartmentDetail /></ErrorBoundary>
  } />
  ```
- **Complexity:** S
- **Dependencies:** None

### TD-A05: Squad join request uses wrong table (semantic inversion)
- **Priority:** P0
- **Severity:** Critical
- **Files affected:** `src/pages/MySquads.tsx` handleRequestJoin, `src/pages/SquadHub.tsx` handleRequestJoin
- **Problem:** When user A requests to join a squad owned by user B, the code inserts into `squad_invites` with `invitee_id = creatorId`. This means the squad creator receives an "invite" to their own squad. When they "accept" it, the accept flow inserts the creator as a member with role "member" — potentially demoting the creator.
- **Solution:** Create a separate `squad_join_requests(id, squad_id, requester_id, status, created_at)` table. Add an accept/reject UI specifically for the squad creator. The current `squad_invites` table should only be used for outbound invites from members to prospective members.
- **Complexity:** M
- **Dependencies:** DB migration

### TD-A06: HomeRoute and AuthedLayout both call useAuth() + useProfile()
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/App.tsx`
- **Problem:** `HomeRoute` calls `useAuth()` and `useProfile()`. `AuthedLayout` also calls `useAuth()`. These trigger separate context subscriptions that each re-render their subtrees independently on auth state changes. On login, both re-render twice.
- **Solution:** Consolidate into a single `useAppState()` context that holds `{user, profile, loading}` and exposes a single subscription point.
- **Complexity:** M
- **Dependencies:** None

---

## Missing Abstractions

### TD-MA01: refetch function not memoized in useProfile
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/hooks/useProfile.ts`
- **Problem:** `refetch` is defined as an inline async function in the `return` object literal. A new function reference is created on every render. Components that use `refetch` as a `useEffect` dependency or pass it as a prop will re-render unnecessarily.
- **Solution:** Wrap in `useCallback([user])`.
- **Complexity:** XS
- **Dependencies:** None

### TD-MA02: likesUsed disconnected from DB after reload
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/hooks/useDailyLimits.tsx`
- **Problem:** `likesUsed` is initialized from DB on mount, then incremented locally via `recordLike()`. If a user likes 5 profiles, refreshes the page, the DB count is re-fetched correctly. But between the page load and the re-fetch completing, `canLike` is temporarily `true` (0 < 8), potentially allowing an extra like during the loading window.
- **Solution:** Show a loading state while limits are being fetched. Disable like buttons while `limitsLoading` is true.
- **Complexity:** S
- **Dependencies:** None

---

## Code Quality

### TD-CQ01: Duplicate import in useNotifications.ts
- **Priority:** P2
- **Severity:** Low
- **Files affected:** `src/hooks/useNotifications.ts` lines 2 and 25
- **Problem:** `createContext` is imported from `react` on line 2 (as part of destructured import), then again on line 25 as `import { createContext as _createContext } from "react"`. The second import is unused (the alias `_createContext` is never called).
- **Solution:** Remove line 25 entirely.
- **Complexity:** XS
- **Dependencies:** None

### TD-CQ02: useCallback dep array incomplete in Roommates handleSwipe
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/pages/Roommates.tsx` line 154
- **Problem:** `useCallback` dep array is `[remaining, requireAuth, user]` but the callback also uses `canLike`, `likesLimit`, `recordLike`, `openPremiumSheet`. These are values from `useDailyLimits()` context that can change independently. A stale closure will use old `canLike` values after the context updates.
- **Solution:** Add all consumed values: `[remaining, requireAuth, user, canLike, likesLimit, recordLike, openPremiumSheet]`
- **Complexity:** XS
- **Dependencies:** None

### TD-CQ03: formatDate hardcodes "en-US" locale in BillingHistory
- **Priority:** P2
- **Severity:** Low
- **Files affected:** `src/pages/BillingHistory.tsx` lines 36 and 44
- **Problem:** Both `formatDate` and `groupByMonth` use `"en-US"` hardcoded locale for date formatting. The app supports Hebrew and French — dates should match the user's locale setting.
- **Solution:** Use `useLanguage()` hook and map language codes to locale strings: `{ en: 'en-US', he: 'he-IL', fr: 'fr-FR' }`.
- **Complexity:** XS
- **Dependencies:** None

### TD-CQ04: Supabase URL hardcoded in security.ts
- **Priority:** P2
- **Severity:** Medium  
- **Files affected:** `src/lib/security.ts` line 16
- **Problem:** `"fwgyslyngfpjpditoiov.supabase.co"` is hardcoded. This hostname is the Supabase project reference — if the project is migrated (e.g., EU region for GDPR compliance), ALL image validation breaks silently.
- **Solution:** `const allowedHost = new URL(import.meta.env.VITE_SUPABASE_URL).hostname;`
- **Complexity:** XS
- **Dependencies:** None

### TD-CQ05: Dark mode not persisted to localStorage
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/Settings.tsx` toggleDarkMode function
- **Problem:** Dark mode toggle uses `document.documentElement.classList.add('dark')` but does not persist to localStorage. Every page reload reverts to the default (light mode). This is a basic UX requirement.
- **Solution:** 
  ```ts
  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem('theme', enabled ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', enabled);
  };
  // Initialize:
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && document.documentElement.classList.contains('dark'));
  });
  ```
- **Complexity:** XS
- **Dependencies:** None

---

## Missing Features (listed as tech debt due to advertised-but-unimplemented status)

### TD-MF01: No GDPR "Delete Account" feature
- **Priority:** P0
- **Severity:** Critical
- **Files affected:** `src/pages/Profile.tsx`, `src/pages/Settings.tsx`
- **Problem:** No "Delete Account" button exists anywhere. Required by GDPR Article 17 (right to erasure) and Israel's Privacy Protection Law. The Privacy Policy almost certainly references data deletion.
- **Complexity:** L
- **Dependencies:** Service role key in edge function

### TD-MF02: No GDPR "Export My Data" feature  
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/Profile.tsx`
- **Problem:** GDPR Article 20 (right to data portability) requires users to be able to export all their personal data in a machine-readable format.
- **Complexity:** M
- **Dependencies:** Edge function with service role key
