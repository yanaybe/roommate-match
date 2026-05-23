# Roomatch — Security Audit Tasks

Generated: 2026-05-23

---

## CRITICAL

### SEC-C01: Paddle webhook signature bypass
- **Priority:** P0
- **Severity:** Critical
- **Files affected:** `supabase/functions/paddle-webhook/index.ts` line 67
- **Problem:** `if (PADDLE_WEBHOOK_SECRET)` — if env var is missing (empty/undefined = falsy), entire HMAC-SHA256 verification is skipped. An unauthenticated attacker who knows the edge function URL can POST a fake `subscription.activated` payload and upgrade any account to Platinum for free.
- **Attack vector:** Unauthenticated HTTP POST to `https://<project>.supabase.co/functions/v1/paddle-webhook` with `{"event_type": "subscription.activated", "data": {"custom_data": {"user_id": "<victim-uuid>"}, "items": [{"price": {"id": "<platinum-price-id>"}}]}}`
- **Solution:** Remove the conditional. Replace with: `if (!PADDLE_WEBHOOK_SECRET) { return new Response("Webhook secret not configured", { status: 500 }) }` — then always verify.
- **Complexity:** XS
- **Dependencies:** None

---

### SEC-C02: JWT remains valid after password change (no server-side revocation)
- **Priority:** P1
- **Severity:** Critical
- **Files affected:** `src/hooks/useAuth.tsx`
- **Problem:** `signOut()` only calls `supabase.auth.signOut()` for the current session. If a user changes their password (or is compromised), existing JWTs on other devices remain valid until natural expiry (typically 1 hour for access tokens, weeks for refresh tokens).
- **Attack vector:** Attacker who obtains a session token retains access even after victim changes password.
- **Solution:** On password change, call `supabase.auth.admin.signOut(userId, 'others')` to invalidate all other sessions. This requires a server-side edge function with service role key.
- **Complexity:** M
- **Dependencies:** Edge function infrastructure

---

## HIGH

### SEC-H01: isSafeImageUrl hardcodes Supabase hostname
- **Priority:** P2
- **Severity:** High
- **Files affected:** `src/lib/security.ts` line 16
- **Problem:** `ALLOWED_IMAGE_HOSTS` is a hardcoded string array containing `"fwgyslyngfpjpditoiov.supabase.co"`. If the project is migrated, cloned for staging, or the hostname changes, ALL image validation silently fails — either blocking all legitimate images or (if the check is loosened) allowing arbitrary image URLs.
- **Solution:** `const allowedHost = new URL(import.meta.env.VITE_SUPABASE_URL).hostname;` — read from env at runtime.
- **Complexity:** XS
- **Dependencies:** None

### SEC-H02: Matching algorithm exposed in client bundle
- **Priority:** P2
- **Severity:** High
- **Files affected:** `src/lib/matching.ts`
- **Problem:** All algorithm weights, scoring functions, and scoring logic are visible in the minified JS bundle. Users can reverse-engineer optimal profile answers to score 95%+ with specific targets without actually being compatible.
- **Solution:** Move `calculateUserMatch()` to a Postgres function. Client receives only the score integer.
- **Complexity:** L
- **Dependencies:** DB migration + RPC function

### SEC-H03: No consent before personal data processing
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/PrivacyPolicy.tsx`, root App.tsx
- **Problem:** App collects name, age, occupation, city, lifestyle data and stores it immediately without explicit user consent. GDPR Article 6 requires a lawful basis; Article 7 requires consent to be freely given, specific, and documented.
- **Solution:** Implement cookie/consent banner on first visit. Store `consent_given_at` in Supabase user metadata. Block data collection until consent is given.
- **Complexity:** M
- **Dependencies:** None

### SEC-H04: Rate limiting for reports is client-side only
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/hooks/useBlockReport.ts` line 73-79
- **Problem:** Daily report limit (10/day) is enforced by querying `reports` table once per component mount per browser tab. Opening multiple tabs gives each tab a fresh count of 0.
- **Attack vector:** Open 10 tabs → submit 10 reports per tab → 100 reports per day against a single user.
- **Solution:** Add a DB-level constraint: `CREATE OR REPLACE FUNCTION check_report_rate_limit()` as a BEFORE INSERT trigger on `reports`, counting recent reports within 24h per `reporter_id` and raising an exception if over limit.
- **Complexity:** S
- **Dependencies:** None

### SEC-H05: No mutual match enforcement on conversation creation
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/Chats.tsx`, Supabase DB RLS
- **Problem:** RLS policy on `conversations` table does not check for mutual like before allowing conversation creation. Any authenticated user can create a conversation with any other user.
- **Attack vector:** Authenticated user calls `supabase.rpc('create_conversation_with_participant', {other_user_id: victim_uuid})` without a mutual like.
- **Solution:** Add RLS WITH CHECK on conversation creation: `EXISTS (SELECT 1 FROM liked_profiles WHERE user_id = auth.uid() AND liked_user_id = other_user_id) AND EXISTS (SELECT 1 FROM liked_profiles WHERE user_id = other_user_id AND liked_user_id = auth.uid())`
- **Complexity:** M
- **Dependencies:** Supabase dashboard access

---

## MEDIUM

### SEC-M01: Auth error messages leak internal state
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/pages/Auth.tsx`
- **Problem:** Raw Supabase error messages (e.g., "Email not confirmed", "Invalid login credentials") are shown directly in English. These confirm account existence and email verification status to potential attackers.
- **Solution:** Map Supabase error codes to generic translated strings. E.g., `"invalid_credentials"` → `t("invalidEmailOrPassword")` without specifying which.
- **Complexity:** S
- **Dependencies:** Translation keys

### SEC-M02: No client-side login rate limiting display
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/pages/Auth.tsx`
- **Problem:** Supabase applies server-side rate limits but the client UI does not track failed attempts or show a lockout warning. Users attempting credential stuffing see no friction.
- **Solution:** Track `failedAttempts` in component state. After 5 failures, show "Too many attempts. Try again in X minutes" and disable the submit button for a cooldown period.
- **Complexity:** S
- **Dependencies:** None

---

## LOW

### SEC-L01: No auth event analytics for brute-force detection
- **Priority:** P2
- **Severity:** Low
- **Files affected:** `src/hooks/useAuth.tsx`
- **Problem:** No tracking of auth events means brute-force patterns are invisible.
- **Solution:** Add PostHog/Mixpanel events on `SIGNED_IN`, `SIGNED_OUT`, `USER_UPDATED` auth state transitions.
- **Complexity:** XS
- **Dependencies:** Analytics SDK installed
