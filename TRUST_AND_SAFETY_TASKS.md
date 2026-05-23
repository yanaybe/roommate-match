# Roomatch — Trust & Safety Tasks

Generated: 2026-05-23

---

## CRITICAL

### TS-C01: Paid insights show fake data (42 views, 18 likes, 76% match rate)
- **Priority:** P0
- **Severity:** Critical
- **Files affected:** `src/pages/Settings.tsx` lines 234-252
- **Problem:** `InsightCard` components display hardcoded values: 42 profile views, 18 likes received, 76% match rate. These are shown to paying users (Plus/Gold/Platinum) who explicitly pay for "insights" as a premium feature. Every paying user sees identical fake statistics.
- **Risk:** Constitutes fraud under Israeli Consumer Protection Law 1981 §2 (prohibition on misleading representations). A user who pays ₪19/month for "analytics insights" is receiving fabricated data. High chargeback risk.
- **Solution:** 
  1. Create `profile_views` table: `(id, viewed_user_id, viewer_id, viewed_at)`. Increment via trigger on profile page load.
  2. Query `COUNT(*) FROM liked_profiles WHERE liked_user_id = auth.uid()` for likes received.
  3. Compute `(COUNT mutual likes / COUNT total likes) * 100` from `liked_profiles` for match rate.
- **Complexity:** M
- **Dependencies:** New DB tables, profile view tracking

---

### TS-C02: No minimum age enforcement — minors can use the platform
- **Priority:** P0
- **Severity:** Critical
- **Files affected:** `src/pages/Onboarding.tsx` line 241, `src/pages/TermsOfService.tsx`
- **Problem:** Onboarding validates `age >= 16` but Terms of Service states users must be 18+. A 16-year-old who signs up can browse adult profiles, receive messages, and arrange to move in with strangers.
- **Risk:** Legal liability for facilitating housing arrangements involving minors. Potential criminal liability in some jurisdictions.
- **Solution:** 
  1. Change validation: `age < 18` → display `t("ageMustBe18Plus")`
  2. Add DB CHECK: `ALTER TABLE profiles ADD CONSTRAINT min_age CHECK (age >= 18);`
  3. Update ToS validation copy to match.
- **Complexity:** S
- **Dependencies:** None

---

## HIGH

### TS-H01: No mutual match required to initiate conversation
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/Chats.tsx`, Supabase RLS policies
- **Problem:** The `create_conversation_with_participant` RPC function has no check for mutual like. Any authenticated user can cold-message any other user.
- **Risk:** Platform becomes a harassment vector. The core safety model (you can only be messaged by people you liked back) is completely unenforced at the DB level.
- **Solution:** Add RLS WITH CHECK on the conversations table INSERT:
  ```sql
  CREATE POLICY "require_mutual_like_to_chat" ON conversations
  WITH CHECK (
    EXISTS (SELECT 1 FROM liked_profiles WHERE user_id = auth.uid() AND liked_user_id = other_user_id)
    AND EXISTS (SELECT 1 FROM liked_profiles WHERE user_id = other_user_id AND liked_user_id = auth.uid())
  );
  ```
- **Complexity:** M
- **Dependencies:** Supabase dashboard, confirm liked_profiles RLS

### TS-H02: No admin moderation dashboard
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/components/ReportSheet.tsx`, no admin route exists
- **Problem:** Reports are submitted to the `reports` table but there is no interface to review them. There is no automated flagging, no escalation path, and no admin user type in the system.
- **Risk:** Platform has no ability to act on abuse. Known bad actors (harassers, scammers) remain active indefinitely. Platform is legally liable for harm it has been notified of but failed to address.
- **Solution:** 
  1. Create `/admin` route with auth guard requiring `is_admin = true` on user profile.
  2. Build moderation queue: list reports with reporter info, target profile, reason, date.
  3. Actions: dismiss, warn user, ban user (set `is_banned = true` + revoke sessions).
  4. Email notification to moderation team on new report.
- **Complexity:** XL
- **Dependencies:** Admin role in DB, new table columns

### TS-H03: Blocked users appear in conversation list
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/Chats.tsx` loadConversations function
- **Problem:** `loadConversations()` does not filter conversations where `other_user_id` is in the blocked_users list. A blocked user can still send messages that appear in the blocked person's inbox.
- **Solution:** In `loadConversations`: `const { data: blocks } = await supabase.from('blocked_users').select('blocked_id').eq('blocker_id', user.id)`. Filter out convIds where `other_user_id` is in blocks.
- **Complexity:** S
- **Dependencies:** None

### TS-H04: deleteConversation deletes the other user's history
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/Chats.tsx` deleteConversation function
- **Problem:** When a user deletes a conversation, the code deletes ALL messages and the conversation record entirely. The other participant loses their conversation history without any notification or consent.
- **Solution:** Implement soft-delete per user. Add `deleted_for_user_ids UUID[]` to conversations. When a user "deletes," append their ID to this array. Filter out conversations where `auth.uid() = ANY(deleted_for_user_ids)`.
- **Complexity:** M
- **Dependencies:** DB migration

### TS-H05: Match notifications require app to be open
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/components/NotificationToaster.tsx`
- **Problem:** Match and squad_invite notifications are delivered only via the in-app toast system, which requires the app to be open in an active browser tab. The vast majority of matches happen when one or both parties are offline.
- **Risk:** Users miss matches. Poor retention. Core product loop (match → message → move in) is broken for offline users.
- **Solution:** 
  1. Add database trigger: `AFTER INSERT ON liked_profiles` — check for mutual like.
  2. If mutual: invoke `send-email` edge function via `pg_net.http_post()`.
  3. Send match email with link to chat.
  4. Long-term: implement PWA Web Push via service worker.
- **Complexity:** L
- **Dependencies:** pg_net extension enabled, send-email function

### TS-H06: No landlord verification
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/PostApartment.tsx`
- **Problem:** Any user can post a listing. There is no phone verification, identity check, address validation, or image originality check. A scammer can post 50 fake listings with Unsplash photos in minutes.
- **Risk:** Fake listings are the most common cause of user churn in marketplace apps. One widely-shared scam story can kill the platform.
- **Solution:** 
  1. Require phone verification before posting (PhoneVerifySheet component already exists).
  2. Add address geocoding validation — if address doesn't geocode, reject listing.
  3. Add duplicate detection: `(address, price, size)` uniqueness check.
  4. Consider requiring a security deposit or ID verification for landlords.
- **Complexity:** L
- **Dependencies:** Phone verify flow already exists

### TS-H07: Profile detail accessible to any authenticated user without match
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/RoommateProfile.tsx`
- **Problem:** Any authenticated user can navigate to `/roommate/<any-uuid>` and view a person's full profile: city, occupation, age, bio, multiple photos. There is no mutual match requirement.
- **Risk:** Users can be stalked. Their city, workplace, and appearance are visible to anyone who has their UUID (which can be obtained from the liked_profiles or conversations tables).
- **Solution:** Either: (A) Require mutual match to view full profile — show only name and blurred photo until matched. Or (B) Add an RLS policy on profiles that only allows reads when a liked_profiles mutual record exists.
- **Complexity:** M
- **Dependencies:** None

### TS-H08: Report rate limit bypassable via multiple tabs
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/hooks/useBlockReport.ts`
- **Problem:** Rate limit is checked by querying the DB on each `reportUser()` call, but the check is per-tab not per-session. Each new tab gets a fresh count.
- **Solution:** Enforce at the DB level via a BEFORE INSERT trigger on `reports` table. Count reports by `reporter_id` in the last 24 hours and raise SQLSTATE 'P0001' if over limit.
- **Complexity:** S
- **Dependencies:** None

---

## MEDIUM

### TS-M01: No confirmation after report submission
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/components/ReportSheet.tsx`
- **Problem:** After `onSubmit()` succeeds and the sheet closes, users get no acknowledgment. The toast is triggered from `useBlockReport.reportUser()` ("Report submitted. We'll review it shortly.") which is good — but the sheet closes immediately making it easy to miss.
- **Solution:** Show a full confirmation screen within the sheet before closing: "Your report has been received. We review all reports within 24 hours."
- **Complexity:** XS
- **Dependencies:** None

### TS-M02: Fabricated stats in PremiumSheet ("2,400+ people found roommates")
- **Priority:** P0 (legal overlap — see MARKETPLACE_RISKS.md)
- **Severity:** Medium
- **Files affected:** `src/components/PremiumSheet.tsx`
- **Problem:** Hardcoded social proof shown in the paywall to convert users. At launch with <100 users, this is demonstrably false.
- **Solution:** Remove all fabricated statistics. Use honest copy: "Join our early community."
- **Complexity:** XS
- **Dependencies:** None

### TS-M03: No duplicate listing detection
- **Priority:** P1
- **Severity:** Medium
- **Files affected:** `src/pages/PostApartment.tsx`
- **Problem:** The same fake listing can be posted hundreds of times.
- **Solution:** Before INSERT, check: `SELECT id FROM apartments WHERE address ILIKE $address AND price = $price AND size = $size AND user_id != auth.uid()`. Warn or block if duplicate found.
- **Complexity:** S
- **Dependencies:** None
