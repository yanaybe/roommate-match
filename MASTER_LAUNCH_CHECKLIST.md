# Roomatch — Master Pre-Launch Checklist

Generated: 2026-05-23 | Audit pass: src/ + supabase/functions/

---

## P0 — LAUNCH BLOCKERS (must fix before any users see production)

| # | Item | Category | Complexity | Files | Dependencies |
|---|------|----------|------------|-------|--------------|
| P0-01 | Paddle webhook signature verification bypassed when env var is missing | Security | S | `supabase/functions/paddle-webhook/index.ts` | None |
| P0-02 | Remove fabricated social proof stats from Landing and PremiumSheet | Legal | XS | `Landing.tsx`, `PremiumSheet.tsx` | None |
| P0-03 | BillingHistory is permanently empty — no real data fetched | Marketplace | M | `BillingHistory.tsx` | Paddle API key configured |
| P0-04 | Terms of Service says 18+ but Onboarding allows age 16 | Legal | S | `Onboarding.tsx`, DB migration | None |
| P0-05 | Settings Insights hardcode fake values (42 views, 18 likes, 76%) | Trust&Safety | M | `Settings.tsx`, new DB tables | None |
| P0-06 | Paddle price IDs undefined if env vars not set → zero revenue | Marketplace | XS | `PremiumSheet.tsx`, `.env.production` | Paddle account setup |
| P0-07 | No "Delete Account" feature — GDPR Article 17 / Israeli Privacy Law | Legal | L | `Profile.tsx`, `Settings.tsx`, edge function | Auth.admin API |
| P0-08 | Photo delete button invisible on mobile (hover-only) | Mobile | XS | `PhotoUpload.tsx` | None |
| P0-09 | Squad join request logic is semantically inverted (creator gets invite to own squad) | Backend | M | `MySquads.tsx`, DB schema | None |
| P0-10 | Hardcoded fake card "Visa •••• 4242" shown to all users | Legal/Marketplace | S | `BillingHistory.tsx` | Paddle portal API |

---

## P1 — HIGH SEVERITY (fix before marketing/paid acquisition)

| # | Item | Category | Complexity | Files | Dependencies |
|---|------|----------|------------|-------|--------------|
| P1-01 | handleUndo does not delete liked_profiles row — premium feature is broken | Backend | S | `Roommates.tsx` | None |
| P1-02 | RoommateProfile fetches 50 profiles to display 1 — O(50) waste per view | Performance | S | `RoommateProfile.tsx` | None |
| P1-03 | Any user can message any user without mutual match (RLS gap) | Trust&Safety | M | DB RLS policies | Supabase dashboard |
| P1-04 | No admin moderation dashboard — reports go into a black hole | Trust&Safety | XL | New admin route + DB | None |
| P1-05 | "Online" status permanently shown for all users — fake | UX | M | `Chats.tsx` | Supabase Realtime presence |
| P1-06 | Match notifications silently missed when app is closed | Trust&Safety | L | DB trigger + send-email fn | pg_net setup |
| P1-07 | Payment Methods button is dead (onClick={() => {}}) | UX | S | `Settings.tsx` | Paddle portal API |
| P1-08 | No landlord verification — fake listings can proliferate | Trust&Safety | L | `PostApartment.tsx`, new edge fn | Phone verify infra |
| P1-09 | Race condition between onAuthStateChange and getSession | Architecture | S | `useAuth.tsx` | None |
| P1-10 | Webhook: subscription.cancelled not handled → users keep premium forever | Marketplace | S | `paddle-webhook/index.ts` | None |
| P1-11 | loadConversations fetches ALL messages for ALL conversations | Performance | M | `Chats.tsx` | None |
| P1-12 | No GDPR consent banner / cookie consent | Legal | M | New component | localStorage |
| P1-13 | Swipe deck not filtered by city — irrelevant profiles shown | Scalability | M | `useProfile.ts` query | None |
| P1-14 | deleteConversation destroys other user's history without consent | Trust&Safety | S | `Chats.tsx`, DB schema | None |
| P1-15 | Dark mode preference not persisted to localStorage | UX | XS | `Settings.tsx` | None |
| P1-16 | "Export My Data" missing — GDPR Article 20 | Legal | L | New edge function | None |
| P1-17 | Blocked users not filtered from conversation list | Trust&Safety | S | `Chats.tsx` | None |
| P1-18 | Bottom nav missing iOS safe area insets | Mobile | XS | `BottomNav.tsx` | None |
| P1-19 | No duplicate listing detection | Trust&Safety | S | `PostApartment.tsx`, DB | None |
| P1-20 | Webhook deduplication missing — double-charge risk on retry | Marketplace | S | `paddle-webhook/index.ts` | New DB table |

---

## P2 — MEDIUM/LOW SEVERITY (fix before scale / Series A)

| # | Item | Category | Complexity | Files | Dependencies |
|---|------|----------|------------|-------|--------------|
| P2-01 | Matching algorithm runs client-side — cannot scale to 1000+ profiles | Scalability | XL | `matching.ts`, DB function | PostgreSQL plpgsql |
| P2-02 | React Query installed but never used — migrate useEffect fetches | Architecture | XL | All pages | React Query docs |
| P2-03 | No age-range DB pre-filtering in swipe deck | Scalability | S | `useProfile.ts` | None |
| P2-04 | No route-level ErrorBoundary — one crash kills entire app | Architecture | S | `App.tsx` | None |
| P2-05 | formatDate hardcodes en-US locale | Legal/UX | XS | `BillingHistory.tsx` | None |
| P2-06 | FullProfile type missing 10+ columns — (as any) used everywhere | Architecture | M | `useProfile.ts` | supabase gen types |
| P2-07 | useCallback dep array incomplete in handleSwipe | Architecture | XS | `Roommates.tsx` | None |
| P2-08 | Drag + scroll conflict on iOS Safari (SwipeCard) | Mobile | M | `SwipeCard.tsx` | None |
| P2-09 | Report rate limit enforced client-side (multi-tab bypass) | Trust&Safety | S | `useBlockReport.ts`, DB | None |
| P2-10 | Minimum match score clamped at 5% — incompatible users still shown | Architecture | S | `matching.ts` | None |
| P2-11 | Map pins all cluster at city center — geocoding not implemented | Marketplace | L | `PostApartment.tsx`, `Index.tsx` | Geocoding API |
| P2-12 | Supabase URL hardcoded in isSafeImageUrl | Security | XS | `security.ts` | None |
| P2-13 | SquadHub runs full client-side match computation for all squads | Scalability | L | `SquadHub.tsx`, `hooks/useSquad.ts` | DB RPC |
| P2-14 | No analytics tracking on landing page or auth funnel | Analytics | M | `Landing.tsx`, `Auth.tsx` | Analytics SDK |
| P2-15 | No A/B testing infrastructure for match algorithm weights | Architecture | XL | `matching.ts` | Feature flags |
| P2-16 | Squad chat has no rate limiting | Trust&Safety | S | `SquadHub.tsx` | None |
| P2-17 | Duplicate import of createContext in useNotifications.ts | Architecture | XS | `useNotifications.ts` | None |
| P2-18 | Tap threshold (5px) too tight for profile navigation | UX | XS | `SwipeCard.tsx` | None |
| P2-19 | No web push notification support (PWA) | Mobile | XL | New service worker | FCM/APNs |
| P2-20 | "Instant Message" and "Profile Highlight" charged but unimplemented | Marketplace | L | `PremiumSheet.tsx`, DB | None |
