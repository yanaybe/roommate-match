# Roomatch — Security Remediation Roadmap

**Audit Date:** 2026-05-07  
**Overall Score:** 38 / 100  
**Total Findings:** 23 (5 Critical · 6 High · 9 Medium · 3 Low)

All TODO comments have been added directly to the relevant source files.
This file is the master index — use it to track fix progress.

---

## 🔴 CRITICAL BEFORE LAUNCH

These must be fixed before any paid users or real data enters the system.

---

### C1 — Paddle Webhook Signature Optional
- **File:** `supabase/functions/paddle-webhook/index.ts` lines 13, 67–73
- **Risk:** Anyone can POST a forged event and grant themselves Platinum for free. Revenue → $0.
- **Fix:** Make `PADDLE_WEBHOOK_SECRET` mandatory. Return 500 if not set, remove `if (PADDLE_WEBHOOK_SECRET)` guard — verify unconditionally.
- **Difficulty:** Easy (15 min)
- **Status:** [x] DONE (2026-05-07)

---

### C2 — send-email Endpoint Unauthenticated by Default
- **File:** `supabase/functions/send-email/index.ts` lines 13, 101–104
- **Risk:** `WEBHOOK_SECRET` defaults to `""`. Empty string is falsy — auth check is skipped. Anyone can trigger emails to any user. Domain gets blacklisted for phishing.
- **Fix:** Change `?? ""` to require the secret. Return 500 if unset, 401 if header mismatch. Make check unconditional.
- **Difficulty:** Easy (10 min)
- **Status:** [x] DONE (2026-05-07)

---

### C3 — HTML Injection in Email Templates
- **File:** `supabase/functions/send-email/index.ts` line 134
- **Risk:** `msg.content` (raw user input) is injected into HTML email body. Attacker sends `<a href="evil.com">Click to verify</a>` as a chat message → phishing email from your domain to all recipients.
- **Fix:** HTML-escape all user content before embedding in email templates (see TODO comment in file for escapeHtml implementation).
- **Difficulty:** Easy (20 min)
- **Status:** [x] DONE (2026-05-07)

---

### C4 — Hidden Profiles Exposed in Network Response
- **File:** `src/hooks/useProfile.ts` lines 77–98
- **Risk:** All profiles including `profile_visibility = 'hidden'` are returned by the Supabase query. Filter is client-side only. Any user sees hidden profiles in DevTools. GDPR violation + paid feature that doesn't work.
- **Fix:**
  1. Add `.neq("profile_visibility", "hidden")` to the Supabase query
  2. Add RLS policy: `CREATE POLICY "Hide hidden profiles" ON profiles FOR SELECT USING (profile_visibility != 'hidden' OR user_id = auth.uid());`
- **Difficulty:** Easy (30 min)
- **Status:** [x] DONE (2026-05-07)

---

### C5 — notify Function: Any User Can Spam Any User
- **File:** `supabase/functions/notify/index.ts` lines 32–50
- **Risk:** Authenticated users can deliver notifications with arbitrary title/body to any other user. Enables platform-scale phishing and harassment via your notification system.
- **Fix:** Restrict to service-role only. Remove the authenticated-user path entirely — notifications should only come from DB triggers.
  ```ts
  if (!isServiceRole) return new Response("Forbidden", { status: 403 });
  ```
- **Difficulty:** Easy (10 min)
- **Status:** [x] DONE (2026-05-07)

---

## 🟠 HIGH PRIORITY

Fix within first week after launch.

---

### H1 — Paddle Boost: No Apartment Ownership Check
- **File:** `supabase/functions/paddle-webhook/index.ts` lines 172–188
- **Risk:** `custom_data.apartment_id` applied without verifying the purchaser owns the apartment.
- **Fix:** Query `apartments.user_id` before applying `is_featured = true`. Reject if mismatch.
- **Difficulty:** Easy (20 min)
- **Status:** [x] DONE (2026-05-07)

---

### H2 — Squad Chat: No Sanitization, No Rate Limit, No Length Cap
- **File:** `src/pages/SquadHub.tsx` lines 507–516
- **Risk:** Unlike Chats.tsx, squad messages are inserted raw. Enables content injection and message flooding.
- **Fix:** Apply `sanitizeText()` + `.substring(0, 2000)` + 500ms debounce ref (see Chats.tsx). Add DB CHECK constraint on `squad_messages.content`.
- **Difficulty:** Easy (30 min)
- **Status:** [x] DONE (2026-05-07)

---

### H3 — Phone Verification Permanently Broken
- **File:** `src/components/PhoneVerifySheet.tsx` lines 59–63
- **Risk:** The `guard_profile_sensitive_fields` DB trigger silently resets `phone_verified` back to false on every client update. Users think they're verified — they're not.
- **Fix:** Create a `SECURITY DEFINER` RPC function `mark_phone_verified(user_id)` callable only with service role. Call it from an Edge Function after OTP validation, not from the client.
- **Difficulty:** Medium (2 hours)
- **Status:** [x] DONE (2026-05-07)

---

### H4 — Apartment Images: No Magic Bytes Validation
- **File:** `src/pages/PostApartment.tsx` lines 247–254
- **Risk:** Only `file.type` (MIME sniff) checked — trivially bypassed. SVG with `<script>` tags can be uploaded and served. Avatar uploads already have `validateImageMagicBytes()` — apartment uploads don't.
- **Fix:** Import and apply `validateImageMagicBytes` (already written in `src/lib/security.ts`) for each image before upload.
- **Difficulty:** Easy (20 min)
- **Status:** [x] DONE (2026-05-07)

---

### H5 — Boost Timestamps Not Protected by Guard Trigger
- **File:** `src/components/BoostListingSheet.tsx` line 143
- **Risk:** `gold_boost_used_at` and `platinum_boost_used_at_*` columns are not in the security trigger. Any user can reset them to `null` via DevTools → unlimited free boosts.
- **Fix:** Add these fields to `guard_profile_sensitive_fields` trigger (block nulling when non-null). Or better: move boost logic to a SECURITY DEFINER RPC.
- **Difficulty:** Medium (1 hour)
- **Status:** [x] DONE (2026-05-07)

---

### H6 — Apartment Storage: No Upload Path Restriction
- **File:** Supabase dashboard → Storage → apartment-images bucket policy
- **Risk:** Storage INSERT policy only checks `bucket_id`. Any user can overwrite another user's apartment photos by uploading to their path.
- **Fix:**
  ```sql
  CREATE POLICY "Users upload to own folder only" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'apartment-images' AND (storage.foldername(name))[1] = auth.uid()::text);
  ```
  Upload path in PostApartment.tsx already prefixes with `${user.id}/` — the RLS just needs to enforce it.
- **Difficulty:** Easy (20 min)
- **Status:** [x] DONE (2026-05-11) — migration `20260507000005_apartment_images_path_restriction.sql` applied.

---

## 🟡 MEDIUM PRIORITY

Fix before scaling to real users.

---

### M1 — ErrorBoundary Exposes Raw DB Error Messages
- **File:** `src/components/ErrorBoundary.tsx` lines 16–17, 33
- **Risk:** `error.message` is rendered to users. Postgres errors contain table names, column names, constraint names. Helps attackers map the DB schema.
- **Fix:** In `getDerivedStateFromError`, return `message: ""` always. Show only `t("unexpectedErrorDesc")` in render. Log raw errors to Sentry or similar.
- **Difficulty:** Easy (10 min)
- **Status:** [x] DONE (2026-05-07)

---

### M2 — JWT Tokens in localStorage
- **File:** `src/integrations/supabase/client.ts` line 13
- **Risk:** Any JavaScript on the page (including third-party scripts or future XSS) can read the refresh token and impersonate users indefinitely.
- **Fix:** Switch to `sessionStorage` (tab-scoped). For max security: HttpOnly cookie relay via Edge Function.
- **Difficulty:** Easy (20 min)
- **Status:** [x] DONE (2026-05-07)

---

### M3 — apartment_views Table Missing
- **File:** `src/pages/ApartmentDetail.tsx` line 197
- **Risk:** Table doesn't exist. Every apartment view throws a Supabase 42P01 error. Analytics broken. Error may expose table name via ErrorBoundary.
- **Fix:** Create migration (see TODO comment in ApartmentDetail.tsx for full SQL).
- **Difficulty:** Easy (15 min)
- **Status:** [x] DONE (2026-05-11) — migration `20260508000000_apartment_views.sql` applied.

---

### M4 — Contact Form Sends PII to Formspree (Third Party)
- **File:** `src/pages/ContactSupport.tsx` line 59
- **Risk:** User email + support messages sent to Formspree without a DPA. GDPR data processor violation. Formspree breach = all support history leaked.
- **Fix:** Remove Formspree call. Support messages already saved to `support_messages` DB table — just send notification email via Resend Edge Function.
- **Difficulty:** Medium (1 hour)
- **Status:** [x] DONE (2026-05-11) — Formspree was already removed; ContactSupport.tsx writes only to `support_messages` Supabase table.

---

### M5 — Duplicate Conversations Created in RoommateProfile
- **File:** `src/pages/RoommateProfile.tsx` lines 210–221
- **Risk:** Direct insert to `conversations` bypasses deduplication. Repeated message clicks create multiple conversations, splitting history.
- **Fix:** Use `create_conversation_with_participant` RPC (atomic find-or-create).
- **Difficulty:** Easy (20 min)
- **Status:** [x] DONE (2026-05-07)

---

### M6 — squad_deleted Notification Type Violates DB Constraint
- **File:** `src/pages/SquadHub.tsx` + `supabase/migrations/20260411000002_notifications.sql`
- **Risk:** `notifications.type` CHECK constraint allows only `'match'` and `'squad_invite'`. `'squad_deleted'` throws on insert. Squad deletion notifications always fail silently.
- **Fix:** `ALTER TABLE notifications DROP CONSTRAINT notifications_type_check; ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('match', 'squad_invite', 'squad_deleted', 'message'));`
- **Difficulty:** Easy (10 min)
- **Status:** [x] DONE (2026-05-07)

---

### M7 — profile_visibility Toggle Not Server-Side Tier-Gated
- **File:** `src/pages/Settings.tsx` lines 143–159
- **Risk:** Tier check is client-side. Free users can set `profile_visibility = 'hidden'` directly via the Supabase API, bypassing the paywall.
- **Fix:** Add to `guard_profile_sensitive_fields` trigger: block setting `profile_visibility = 'hidden'` when `OLD.subscription_tier = 'free'`.
- **Difficulty:** Medium (45 min)
- **Status:** [x] DONE (2026-05-07)

---

### M8 — No Security Headers
- **File:** `vite.config.ts` + hosting config
- **Risk:** No CSP (any XSS executes freely), no X-Frame-Options (clickjacking), no X-Content-Type-Options (MIME sniffing).
- **Fix:** Add headers in Vercel/hosting config (see TODO comment in vite.config.ts for full config).
- **Difficulty:** Easy (20 min)
- **Status:** [x] DONE (2026-05-07)

---

### M9 — Billing History Hardcoded Empty
- **File:** `src/pages/BillingHistory.tsx` line 20
- **Risk:** Users cannot see their payment history. Legal exposure under Israeli Consumer Protection Law and GDPR (right to receipts).
- **Fix:** Create `supabase/functions/billing-history/index.ts` that fetches real Paddle transactions.
- **Difficulty:** Hard (4 hours)
- **Status:** [x] DONE (2026-05-11) — `billing-history` Edge Function implemented; BillingHistory.tsx fetches and displays real Paddle transactions.

---

## 🔵 LOW PRIORITY

---

### L1 — Onboarding Skips Email Verification for ?edit=true
- **File:** `src/pages/Onboarding.tsx` line 174
- **Fix:** Remove `!isEdit &&` condition — always require email confirmation.
- **Difficulty:** Easy (5 min)
- **Status:** [x] DONE (2026-05-07)

---

### L2 — PostApartment Draft in localStorage Not Cleared + Not Sanitized
- **File:** `src/pages/PostApartment.tsx`
- **Fix:** Clear draft with `localStorage.removeItem("post_apartment_draft")` on successful submit. Apply `sanitizeText()` before saving draft.
- **Difficulty:** Easy (15 min)
- **Status:** [x] DONE (2026-05-07)

---

### L3 — CORS Wildcard on Edge Functions
- **File:** All `supabase/functions/*/index.ts`
- **Fix:** Replace `"Access-Control-Allow-Origin": "*"` with your production domain. Remove CORS headers entirely from `paddle-webhook` (server-to-server, no browser).
- **Difficulty:** Easy (15 min)
- **Status:** [x] DONE (2026-05-07)

---

## ⚡ QUICK WINS (Under 30 Minutes Each)

These fixes are high-impact and require almost no code:

| # | Fix | File | Time |
|---|---|---|---|
| 1 | Make Paddle webhook secret mandatory (remove `if` guard) | `paddle-webhook/index.ts` | 5 min |
| 2 | Make send-email webhook secret mandatory | `send-email/index.ts` | 5 min |
| 3 | HTML-escape `msg.content` in email template | `send-email/index.ts` | 10 min |
| 4 | Add `.neq("profile_visibility","hidden")` to profiles query | `useProfile.ts` | 5 min |
| 5 | Lock notify function to service-role only | `notify/index.ts` | 5 min |
| 6 | Apply `validateImageMagicBytes` to apartment uploads | `PostApartment.tsx` | 10 min |
| 7 | Remove `this.state.message` from ErrorBoundary render | `ErrorBoundary.tsx` | 5 min |
| 8 | Add security headers to hosting config | `vercel.json` | 15 min |
| 9 | Add `squad_deleted` to notifications type constraint | SQL migration | 5 min |
| 10 | Remove `!isEdit &&` from email verification check | `Onboarding.tsx` | 2 min |

---

## 🔮 FUTURE SCALING SECURITY CONCERNS

### FS1 — RLS Performance at Scale
- `is_squad_member()` and similar SECURITY DEFINER functions are called on every row evaluation.
- At 10k+ squads → table scans on every query.
- **Fix:** Add composite index: `CREATE INDEX ON squad_members(squad_id, user_id, status);`

### FS2 — pg_net Webhook Reliability
- pg_net is fire-and-forget with no retry logic. At volume, notification emails will silently fail (cold starts, network timeouts).
- **Fix:** Implement outbox pattern with `pg_cron` for retry, or use a proper message queue.

### FS3 — Client-Side Matching Algorithm
- `calculateUserMatch()` runs over ALL profiles in the browser. At 10k+ profiles → UI freeze.
- **Fix:** Move to a DB function with pre-computed compatibility scores in a materialized view.

### FS4 — No Global API Rate Limit
- Anon key can scrape all profiles at full speed — no per-IP or per-token throttle.
- **Fix:** Add edge-level rate limiting (Cloudflare Workers / Vercel Edge Middleware).

### FS5 — Realtime Subscription Security
- No server-side validation of Realtime channel subscription attempts.
- At scale, unauthorized subscription attempts generate noise and consume resources.
- **Fix:** Move to presence-based channel naming with JWT validation on subscription.

### FS6 — Session Token Storage Migration
- When migrating from localStorage to sessionStorage/HttpOnly cookies, existing sessions will be invalidated.
- Plan a migration window and communicate to users.

---

## DB-LEVEL SECURITY FIXES NEEDED

Run these in Supabase SQL Editor:

```sql
-- Fix 1: Hidden profiles RLS (C4)
CREATE POLICY "Hide hidden profiles from non-owners"
ON profiles FOR SELECT
USING (profile_visibility != 'hidden' OR user_id = auth.uid());

-- Fix 2: notifications type constraint (M6)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('match', 'squad_invite', 'squad_deleted', 'message'));

-- Fix 3: Apartment storage path restriction (H6)
-- Run in Supabase Dashboard → Storage → apartment-images → Policies
CREATE POLICY "Users upload to own folder only" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'apartment-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Fix 4: Squad messages length constraint (H2)
ALTER TABLE squad_messages
ADD CONSTRAINT squad_messages_content_length CHECK (char_length(content) <= 2000);

-- Fix 5: profile_visibility tier gate in guard trigger
-- Add to guard_profile_sensitive_fields function:
--   IF NEW.profile_visibility = 'hidden' AND OLD.subscription_tier = 'free' THEN
--     NEW.profile_visibility := OLD.profile_visibility;
--   END IF;

-- Fix 6: apartment_views table (M3)
CREATE TABLE IF NOT EXISTS apartment_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now()
);
ALTER TABLE apartment_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Insert own views" ON apartment_views FOR INSERT
  WITH CHECK (viewer_id = auth.uid() OR viewer_id IS NULL);
CREATE POLICY "Owners see their listing views" ON apartment_views FOR SELECT
  USING (apartment_id IN (SELECT id FROM apartments WHERE user_id = auth.uid()));

-- Fix 7: Squad messages RLS (verify this exists)
-- squad_messages should only be readable/writable by squad members
```

---

## WHAT DESTROYS THE BUSINESS IF IGNORED

| Finding | Consequence |
|---|---|
| C1 (Paddle webhook optional) | All subscriptions forgeable for free. Revenue = $0. |
| C2+C3 (send-email unauthenticated + HTML injection) | Bulk phishing from your domain. Domain blacklisted permanently. |
| C4 (hidden profiles exposed) | GDPR complaint → Privacy Authority investigation → fines up to 4% turnover. |
| C5 (notify open to all users) | Competitor floods all users with harassment. App store reviews collapse overnight. |
| DB webhook project ID mismatch (fixed in our session) | All notifications silently broken. Users see a dead app. Retention → 0. |
