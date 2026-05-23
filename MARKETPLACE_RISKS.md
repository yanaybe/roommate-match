# Roomatch — Marketplace Risks

Generated: 2026-05-23

---

## CRITICAL — Revenue Blockers

### MKT-C01: BillingHistory page is a permanent stub
- **Priority:** P0
- **Severity:** Critical
- **Files affected:** `src/pages/BillingHistory.tsx`
- **Problem:** `mockTransactions: Transaction[] = []` is hardcoded. No Supabase query, no Paddle API call. Every paying user who opens Billing History sees ₪0.00 spent and 0 transactions. The payment method section shows "Visa •••• 4242" hardcoded.
- **Business risk:** First thing a paying user does after upgrading is verify their payment. This page will generate immediate support tickets and chargebacks. Trust destroyed on day 1.
- **Solution:** 
  1. Create `transactions` table in Supabase. Populate via `paddle-webhook` on `transaction.completed`.
  2. Query: `supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', {ascending: false})`
  3. For payment method: redirect to Paddle customer portal via `paddle.PaddlePortal.open()`
- **Complexity:** M
- **Dependencies:** Paddle webhook working (MKT-C02)

### MKT-C02: Paddle price IDs undefined at launch
- **Priority:** P0
- **Severity:** Critical
- **Files affected:** `src/components/PremiumSheet.tsx`
- **Problem:** `VITE_PADDLE_PRICE_PLUS`, `VITE_PADDLE_PRICE_GOLD`, `VITE_PADDLE_PRICE_PLATINUM` resolve to `undefined` if `.env.production` does not contain them. `openCheckout(undefined)` triggers "This plan is not available yet." toast. Zero revenue is possible without these configured.
- **Solution:** 
  1. Set all price IDs in Vercel environment variables.
  2. Add runtime guard: `if (!priceId) { toast.error("Payment temporarily unavailable. Contact support."); return; }`
  3. Add pre-deploy check: fail CI if any VITE_PADDLE_PRICE_* var is unset.
- **Complexity:** XS
- **Dependencies:** Paddle account with live prices created

### MKT-C03: Paddle webhook signature verification bypassable
- **Priority:** P0
- **Severity:** Critical
- **Files affected:** `supabase/functions/paddle-webhook/index.ts`
- **Problem:** (See SEC-C01) Verification is skipped when env var is missing. Also: subscription.cancelled/paused events only partially handled.
- **Solution:** See SEC-C01. Additionally add explicit handling for `subscription.past_due` → downgrade to free after grace period.
- **Complexity:** S
- **Dependencies:** None

---

## HIGH — Monetization Gaps

### MKT-H01: "Instant Message" feature charged but not implemented
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/components/PremiumSheet.tsx` extras array
- **Problem:** "Instant Message" is offered as a ₪5 one-time purchase in the paywall. When purchased (if Paddle is configured), the `transaction.completed` webhook fires but there is no code to grant the user a "message credit" or bypass the mutual match requirement in Chats.tsx.
- **Business risk:** Charging for an unimplemented feature is fraud under Israeli Consumer Protection Law 1981 §10. Immediate legal exposure.
- **Solution:** Either: (A) Remove from paywall before launch. Or (B) Implement: add `instant_message_credits` column to profiles, decrement on use in Chats.tsx, grant via webhook.
- **Complexity:** L
- **Dependencies:** Webhook handling

### MKT-H02: "Profile Highlight" feature charged but not implemented
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/components/PremiumSheet.tsx` extras array, `src/pages/Roommates.tsx`
- **Problem:** "Profile Highlight" is offered as a ₪7 one-time purchase. No DB column `highlighted_until`, no sorting boost in swipe deck.
- **Business risk:** Same as MKT-H01.
- **Solution:** 
  1. Add `highlighted_until TIMESTAMP` to profiles.
  2. Set in `transaction.completed` webhook.
  3. In `useAllProfiles`, sort highlighted profiles first: `.order('highlighted_until', {ascending: false, nullsFirst: false})`
- **Complexity:** M
- **Dependencies:** Webhook handling

### MKT-H03: "1 free boost per week" for Gold never granted
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/components/PremiumSheet.tsx` (Gold features), `supabase/functions/`
- **Problem:** Gold plan advertises "1 free boost per week" as a feature. The webhook sets subscription_tier but never grants weekly_boosts_remaining. Gold subscribers can never claim this benefit.
- **Business risk:** Advertised feature not delivered. Basis for refund/chargeback claims.
- **Solution:** 
  1. Add `weekly_boosts_remaining INTEGER DEFAULT 0` to profiles.
  2. Create a scheduled Supabase function (cron) that runs Monday 00:00 UTC: `UPDATE profiles SET weekly_boosts_remaining = 1 WHERE subscription_tier = 'gold'`.
  3. Decrement in BoostListingSheet on use.
- **Complexity:** M
- **Dependencies:** Supabase cron (pg_cron extension)

### MKT-H04: Payment Methods button is dead
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/Settings.tsx` SettingsItem onClick={() => {}}
- **Problem:** "Payment Methods" in Settings has an empty onClick handler. Tapping it does nothing.
- **Business risk:** Users cannot update their payment method. Failed renewals cannot be remedied. Churn from card expiry.
- **Solution:** Call `paddle.PaddlePortal.open()` or create a Supabase edge function that generates a Paddle customer portal URL and redirects the user.
- **Complexity:** S
- **Dependencies:** Paddle customer portal API access

---

## HIGH — Cold Start Problem

### MKT-H05: Empty swipe deck on launch day
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/Roommates.tsx` empty state
- **Problem:** On launch day with <50 users, every user will see the empty state ("No more profiles") immediately after completing onboarding. The empty state shows hardcoded English strings ("Adjust Preferences", "Undo last swipe") without translation.
- **Business risk:** First-time user experience is broken. 80%+ day-1 churn if users see "no results" immediately.
- **Solution:** 
  1. Seed 50 beta tester profiles with real photos and data before launch.
  2. Create blurred "preview" demo profiles for the empty state that encourage registration.
  3. Fix empty state translation: `t("adjustPreferences")`, `t("undoLastSwipe")`.
- **Complexity:** M (seeding) + XS (translation fix)
- **Dependencies:** 50 real beta users OR demo profile creation

### MKT-H06: No listing supply at launch
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/Index.tsx`, `src/pages/ApartmentDetail.tsx`
- **Problem:** Without pre-seeded apartment listings, the main feed (Index) shows no content. Users who want to browse apartments will see an empty page.
- **Risk:** Seeded demo listings exist but their `user_id` values are ghost UUIDs not in `auth.users`. When a user tries "Contact Landlord," the conversation creation fails or connects to a non-existent account.
- **Solution:** 
  1. Create real landlord accounts for all demo listings.
  2. OR clearly mark seeded listings as "Demo" and disable contact button.
  3. Recruit 10-20 real landlords before launch.
- **Complexity:** M
- **Dependencies:** Landlord outreach

---

## MEDIUM — Retention Loops

### MKT-M01: No re-engagement for missed matches
- **Priority:** P1
- **Severity:** Medium
- **Files affected:** `src/components/NotificationToaster.tsx`, `supabase/functions/`
- **Problem:** Matches that happen while a user is offline are never communicated. No email, no push notification.
- **Solution:** See TS-H05 — implement email notifications for matches.
- **Complexity:** L
- **Dependencies:** send-email edge function

### MKT-M02: No onboarding completion incentive
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/pages/Onboarding.tsx`
- **Problem:** Users who abandon onboarding mid-way receive no follow-up email, no reminder, no incentive to return. Onboarding completion rate will be low.
- **Solution:** 
  1. On user signup, schedule a reminder email if `onboarding_complete` is still false after 24 hours.
  2. Show progress persistence ("Resume where you left off").
- **Complexity:** M
- **Dependencies:** Email infrastructure

### MKT-M03: No landlord conversion funnel
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/pages/Landing.tsx`, `src/pages/PostApartment.tsx`
- **Problem:** Landing page primarily targets roommate-seekers. There is no dedicated landlord value proposition or easy path to post a listing from the landing page.
- **Solution:** Add a "For Landlords" section to the landing page with a direct CTA to `/create`.
- **Complexity:** S
- **Dependencies:** None

---

## LEGAL — Israeli Consumer Protection

### MKT-L01: Fabricated social proof throughout app
- **Priority:** P0
- **Severity:** Critical
- **Files affected:** `src/pages/Landing.tsx`, `src/components/PremiumSheet.tsx`
- **Problem:** Statistics like "2,400+ people found roommates this month" are hardcoded in multiple places. At launch with <100 users these are demonstrably false.
- **Legal basis:** Israeli Consumer Protection Law 1981 §2: prohibition on misleading representations in advertising. Also potentially violates Apple App Store Review Guidelines §3.1 (deceptive apps).
- **Solution:** Remove ALL fabricated statistics before launch. Replace with truthful messaging: "Be among our first members", "Early access community."
- **Complexity:** XS
- **Dependencies:** None — must be done before any user acquisition

### MKT-L02: Missing mandatory payment disclosures
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/components/PremiumSheet.tsx`
- **Problem:** The checkout sheet does not show: recurring billing disclosure, cancellation terms, trial terms, VAT information. Israeli Consumer Protection Law and Paddle's own terms require clear billing disclosures before subscription.
- **Solution:** Add subscription terms below the subscribe button: "Billed monthly. Cancel anytime. Prices shown exclude VAT where applicable."
- **Complexity:** XS
- **Dependencies:** Legal review of required disclosures
