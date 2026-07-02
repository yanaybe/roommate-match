# RooMatch — Full Design Review (UI/UX/Product Audit)

**Date:** 2026-07-02
**Method:** Live app walkthrough (headless Chromium at 375px and 1440px, light + dark, EN + HE/RTL) + full source review of all 26 pages and 20 custom components.
**Reviewer stance:** Pre-launch bar — Airbnb/Linear/Stripe quality standard.
**Test account created for this audit:** `roomatch.design.audit.2026@gmail.com` (left in DB, flagged for cleanup).

---

## Scores

| Dimension | Score / 100 | One-line verdict |
|---|---|---|
| **UI (visual design)** | **62** | Solid token foundation & typography, undermined by emoji icons, 0% badges, and brand-name typo |
| **UX (flows & friction)** | **58** | Good bones; onboarding contradiction, cold-start dead ends, and a real redirect bug hurt trust |
| **Visual polish** | **65** | Cards/shadows/radius are coherent; details (badges, disabled states, washed CTAs) betray it |
| **Consistency** | **48** | Two brand names, two pricing stories, three plan-name schemes, 2/48 files use the design-system Button |
| **Mobile experience** | **72** | Best-in-class area: bottom nav, safe areas, dvh, split chat. Tiny targets & banner stacking remain |

**Launch verdict: NOT READY.** Nothing here is months of work — the worst offenders are days of work — but launching with a raw i18n key on a primary CTA, "0% match" on every listing, and two different brand spellings would permanently cost trust with first-cohort users.

---

## CRITICAL issues (launch blockers)

### C1. Every apartment card shows a red "0%" match badge
- **Page:** Rooms feed (`/`), Apartment detail
- **Component:** `ApartmentCard`, `MatchBadge` (`Index.tsx:128` — `dbRowToApartment` hardcodes `matchPercent: 0`)
- **Problem:** Room match score is never computed for the feed; `MatchBadge` renders `0%` in the "low match" red for every listing, including "Picked for you."
- **Why it hurts:** Matching is the product's core differentiator (hero says "Lifestyle-first roommate matching"). A wall of red 0% reads as "the product is broken" to every single user, on the first screen, forever.
- **Recommendation:** Compute `calculateRoomMatch()` for the feed (it already exists in `lib/matching.ts`), or hide the badge entirely when score is unknown. Never render 0% red.
- **Mockup:** Card image top-left shows either a green "87% match" pill or nothing. If profile incomplete → replace badge with subtle "Complete profile to see match" ghost pill linking to onboarding.

### C2. Raw i18n key `adjustPreferences` rendered on a primary CTA
- **Page:** Roommates (`/roommates`) empty state
- **Component:** `Roommates.tsx:367` — `t("adjustPreferences") ?? "Adjust Preferences"` (`t()` returns the key, never null, so fallback is dead code)
- **Problem:** The gradient primary button literally says **adjustPreferences**.
- **Why it hurts:** A visible variable name on a main CTA is the single fastest way to look like an unfinished student project. This is the screen every new user in an empty city hits.
- **Recommendation:** Add the key to all 3 locales; audit the entire translations map for missing keys (write a test that iterates keys used in code vs keys defined per locale).
- **Mockup:** Button reads "Adjust preferences" / "עדכון העדפות".

### C3. Brand is spelled two different ways in the same viewport
- **Page:** Rooms feed header vs sidebar/everywhere else
- **Component:** `Index.tsx:305` renders **Room**Match; logo, sidebar, landing, auth, footer render **Roo**Match
- **Problem:** On desktop both spellings are visible simultaneously (sidebar "RooMatch", page header "RoomMatch").
- **Why it hurts:** Users notice; investors notice; it reads as carelessness at the brand level.
- **Recommendation:** One wordmark component (`<Wordmark />`) used everywhere. Delete all inline spellings.
- **Mockup:** `Roo<span class="text-primary">Match</span>` — single source of truth.

### C4. Onboarding photos step contradicts itself and blocks completion
- **Page:** Onboarding step 6/6
- **Component:** `Onboarding.tsx:317` (`canFinish` requires ≥1 photo) vs the same screen's copy
- **Problem:** Header says "Optional — you can skip anytime"; helper text says "You can always add them later from your profile"; the **Complete button is disabled until you upload a photo**. There is no skip link on this step (it exists on steps 2–5 only).
- **Why it hurts:** Users who don't have a photo ready hit a hard wall at the very last step of a 6-step flow — the highest-value drop-off point in the entire funnel.
- **Recommendation:** Pick one: (a) make photos truly optional (enable Complete, keep the 4× matches nudge), or (b) require them and say so honestly ("1 photo required — profiles with photos get 4× more matches"). Option (a) recommended; you can gate swiping on photos later.
- **Mockup:** Enabled gradient "Complete ✓" button + secondary ghost link "I'll add photos later".

### C5. Cold-load redirect dumps onboarded users back into onboarding
- **Page:** Any deep load of `/` while logged in
- **Component:** `useProfile.ts:46-73` + `App.tsx:163`
- **Problem:** On mount with `user === null` (auth still resolving), the effect sets `loading = false`. When the user then arrives, `load()` refetches **without setting `loading` back to true** — so `HomeRoute` sees `profileLoading=false, profile=null` and issues `Navigate to="/onboarding"` before the profile arrives. Reproduced 100% in this audit (verified: API returned `onboarding_complete: true`, URL still landed on `/onboarding`).
- **Why it hurts:** Fully-onboarded users get thrown into "Set up your profile" on every cold page load — looks like data loss, drives support tickets.
- **Recommendation:** In `useProfile`, keep `loading=true` until the fetch for a *non-null user* resolves (distinguish "no user yet" from "no profile"). Also have `/onboarding` self-redirect to `/` when `onboarding_complete === true` and not in `?edit=true` mode (defense in depth).

### C6. Landing pricing contradicts the Pricing page
- **Page:** Landing "Simple pricing" vs `/pricing` vs `PremiumSheet`
- **Component:** `Landing.tsx:69-73`, `Pricing.tsx`, `PremiumSheet.tsx`
- **Problem:** Landing shows **3 tiers** (Free ₪0 / Gold ₪29 / Platinum ₪39) and "Free = 8 likes/day". Pricing page and in-app sheet show **4 tiers** (adds Plus ₪19) and "Free = 10 likes/day". Roommates page calls the upgrade "Plus+" (`Roommates.tsx:386`), a fourth naming variant.
- **Why it hurts:** Pricing is where trust is won or lost. Contradictory numbers across three surfaces looks deceptive, not just sloppy.
- **Recommendation:** One `plans.ts` constants file consumed by Landing, Pricing, and PremiumSheet. One likes-limit constant shared with `useDailyLimits`.

---

## HIGH issues

### H1. 54 emoji used as structural icons
- **Pages:** Landing ("Why RooMatch" 🧬👥🔒, "Search as a Squad 🚀"), Rooms banners (👤👥✨), Onboarding (🚬🐾🏠), Post Apartment (🚪🏠 option icons), ApartmentCard (🏠 Entire Apt, 🔥 Hot), Roommates city toggle (📍🌍), swipe tutorial (👆), Settings ("Upgrade ✨"), chat icebreaker headers, squad cards.
- **Problem:** Emojis render differently per OS, can't be themed, clash with the otherwise consistent Lucide stroke set.
- **Why it hurts:** This is the #1 "template app" tell. Next to Airbnb/Linear the product instantly reads amateur.
- **Recommendation:** Replace all 54 with Lucide equivalents inside the existing tinted-circle containers (`Dna`, `Users`, `Lock`, `Rocket`, `Cigarette`, `PawPrint`, `Home`, `DoorOpen`, `Flame`, `MapPin`, `Globe`, `Sparkles`). Emojis in *chat message content* (icebreakers) are fine — that's content, not chrome.

### H2. Feed half-translated — Hebrew UI is an English/Hebrew soup
- **Pages:** Rooms feed, ApartmentCard, Chats, empty states
- **Problem (verified in HE screenshot):** Header tagline, "Picked for you", "Based on your budget & location", "Load More", "Post a listing", "Available Immediately", "Message", "Details", "ROOM / MONTH", amenity chips, "Select a conversation", "is typing…", swipe tutorial "Pass/Like" — all hardcoded English. RTL layout flips correctly but ~60% of visible feed text stays English in Hebrew mode.
- **Why it hurts:** Israeli market is the stated target; Hebrew is presumably the majority language. Current state feels broken for the primary audience.
- **Recommendation:** Sweep all user-facing literals into the translations map (matches pending P1 list). Add an ESLint rule or test banning JSX literal strings in `src/pages`/`src/components`.

### H3. Cold-start dead ends on the two core screens
- **Pages:** Roommates, Rooms
- **Problem:** New user in a city with no other profiles gets a heart icon + "No more profiles / Check back later" (with the broken CTA of C2). The state doesn't distinguish "never had profiles" from "you swiped everyone". City-scope toggle label ("🌍 All cities") describes the *action*, not the current state — ambiguous.
- **Recommendation:** Differentiate empty states: first-visit + zero profiles → "You're early in {city}! 🎉 Browse all cities meanwhile" with a one-tap switch; exhausted deck → current copy + undo. Replace the toggle chip with a labelled segmented control: `[Tel Aviv] [All cities]`.
- **Mockup:** Empty state card with illustration, headline "Be the first in Herzliya", primary CTA "Search all cities", secondary "Invite friends".

### H4. Banner stacking on the Rooms feed
- **Page:** `/` (Index)
- **Problem:** Up to 4 stacked banners can appear above content: new-listings pill + complete-profile banner + squad banner + live-activity strip — pushing listings below the fold on mobile.
- **Recommendation:** One promo slot, priority-ordered (new listings > complete profile > squad), rotate the rest into feed-injected cards (the squad card at position 3 already exists — that's the right pattern).

### H5. Onboarding "match quality" gamification is broken
- **Page:** Onboarding, all steps
- **Problem:** Shows "56% match quality unlocked" on an *empty* form, jumps to 94% after step 1, then stays 94% through steps 3–6 — so five screens of work "earn" nothing.
- **Why it hurts:** A progress mechanic that doesn't move teaches users the remaining steps are pointless — the opposite of its purpose.
- **Recommendation:** Recalibrate weights so each step adds visible progress (e.g. 20 → 45 → 65 → 80 → 92 → 100), or drop the metric and keep only the step bar.

### H6. Chat list: destructive icon on every row, no outside-click close on menu
- **Page:** Chats
- **Problem:** A trash button sits permanently on every conversation row (accidental-tap magnet, visual noise). The chat header ⋮ menu is a hand-rolled dropdown with no outside-click/Escape close and no aria. All three menu icons (Block/Report/Delete) are `text-destructive` red — no hierarchy.
- **Recommendation:** Remove per-row trash; move delete into the existing ⋮ menu (or swipe-to-delete on mobile). Replace the hand-rolled menu with shadcn `DropdownMenu` (focus trap, Escape, outside click free). Only "Delete chat" should be red.

### H7. Placeholder-only labels on all auth inputs
- **Page:** Auth (login + signup)
- **Problem:** Email/password fields have no visible labels — placeholder disappears on focus; browser autofill turns fields ambiguous. Password toggles have `tabIndex={-1}` (invisible to keyboard). Signup has no Terms/Privacy consent line (legal + trust standard).
- **Recommendation:** Small labels above fields (pattern already exists in Onboarding — reuse it); remove `tabIndex={-1}`; add "By signing up you agree to the Terms & Privacy Policy" under the CTA.

### H8. Generic error with no recovery path on signup
- **Page:** Auth signup
- **Problem (verified):** Invalid-format email → toast + inline "Something went wrong. Please try again." — twice, with no hint the *email* is the problem. The security-driven error mapper collapses too many cases into the generic message.
- **Recommendation:** Keep enumeration-safe messages but add safe specificity: "That email address doesn't look valid" for 400-class validation, retry hint for 5xx. Focus the failing field (`focus-management`).

### H9. Accessibility: focus & labels effectively absent outside the nav
- **Evidence:** 1 file outside `components/ui` uses `focus-visible`; 3 files use `aria-label`. Icon-only buttons without labels: map/list toggle, filter, bookmark, image dots, chat trash/⋮/send, sidebar collapse (has aria ✓). Match badges convey meaning by color only. `EmailVerificationBanner` overlays the top with no layout offset.
- **Recommendation:** Global pass: every icon-only button gets `aria-label` + `focus-visible:ring-2 ring-primary`; add score text context to MatchBadge (`aria-label="87% compatibility"`); keyboard-test the swipe deck (currently pointer-only — add ←/→ key support since buttons exist).

### H10. Desktop is a stretched mobile app
- **Pages:** Rooms (only ~3 columns in a 1400px shell with dead right rail), Landing (single narrow column, preview card clipped by fade overlay mid-card), Roommates (a lone card floating in 1200px of whitespace), forms centered at ~480px with no context.
- **Recommendation:** Rooms: 4-col grid at ≥1280px + persistent filter rail on the left (replaces modal on desktop). Roommates: side panel showing the *next* profiles or "who liked you" teaser beside the deck. Landing desktop: 2-col hero (copy left, product screenshot right — you have beautiful listing UI to show off).

---

## MEDIUM issues

- **M1 — Redundant "Details" button on ApartmentCard.** Whole card navigates + "Details" button navigates. Replace with Save/Share or drop; one primary action per card (`primary-action`).
- **M2 — Image carousel dots are ~6px tap targets** (`ApartmentCard.tsx:158`), min is 44px. Make the whole image swipeable with edge-tap zones; dots become indicators only.
- **M3 — "Matched X ago" shown for every conversation** (`Chats.tsx:597`) — conversations start from listings too; "Matched" is often false. Also fallback claims "online" with no presence data. Show "Active recently" or nothing.
- **M4 — Slider design** (Onboarding): full-width near-black track reads as "filled to max"; no filled-portion differentiation. Use muted track + primary filled range (shadcn Slider does this free).
- **M5 — Native `input type="month"`** renders "-------- ----" placeholder chrome (verified). Replace with two chips row ("ASAP", "Next month", "In 2–3 months", "Flexible") — better data too.
- **M6 — WFH toggle looks like an unselected chip** (Onboarding step 3): no on/off affordance. Use a Switch row.
- **M7 — Deal-breakers substep confusion:** header says "step 3/6 — Lifestyle" while content says "Deal-breakers"; progress bar doesn't move between substeps. Fold substeps into the step count (7 steps) or advance the bar half-width.
- **M8 — Squad cards: "Created by Unknown"** (verified twice) + "0/3 members" for a squad that must contain its creator. Fix the join/lookup; fallback "a RooMatch user", never "Unknown". Member count should include the creator.
- **M9 — "Ask to Join" washed CTA:** pale pink bg + primary text ≈ low contrast, looks disabled. Use outline-primary or solid style.
- **M10 — Settings insights: blurred locked cards + "—" Match Rate** with no explanation; 4 upsell surfaces on one screen (plan banner, Manage, locked cards, privacy Upgrade chip). Keep plan banner + one locked-insights row; give Match Rate a tooltip or hide until data exists.
- **M11 — Landing nav at 375px wraps "Sign In"** into two lines; five items crowd 56px. Hide "Sign In" behind "Get started" (login link lives on auth screen) or collapse language into a menu.
- **M12 — "Picked for you" duplicates cards** that appear again in the main grid right below — feels like a bug when the feed has <10 listings. Exclude picks from the main grid or only show the rail when inventory > ~12.
- **M13 — Toast for likes-remaining fires on a timer with an emoji ("✨")** and duplicates the premium sheet nudge. Consolidate premium nudges: one channel (sheet), one moment (limit hit).
- **M14 — Login vs signup pages have different architectures** (centered card vs sheet-from-bottom); moving between tabs feels like changing apps. Unify on the sheet layout with a segmented Login/Signup control.
- **M15 — Save action gives zero feedback** beyond icon fill — no toast, no undo, and daily-limit errors arrive only *after* tapping. Add "Saved ✓ · View saved" toast with undo.
- **M16 — Apartment detail: thumbnail strip duplicates the hero carousel** immediately below it on mobile; "Current Roommates (0)" renders an empty section with no message. Drop thumbnails on mobile (keep swipe + dots); empty roommates → "Be the first to move in" line or hide.
- **M17 — `QueryClient` installed but all fetching is `useEffect` + `useState`** — no cache, refetch storms on nav, loading flashes everywhere (root cause of C5). Migrate the 5 hottest queries (profile, apartments, conversations, squads, likes) to React Query.

## LOW issues

- L1 — Two toast systems mounted (`Toaster` + `Sonner`); only sonner used (33 files). Remove the shadcn toaster.
- L2 — `--radius: 1rem` tokens exist but 6 ad-hoc radius utilities are used (254× full, 207× xl, 178× 2xl…). Define semantic roles: chips=full, buttons=xl, cards=2xl, sheets=3xl.
- L3 — Custom `desk:` breakpoint duplicates `md:` (both 768px) — pick one.
- L4 — `scroll-behavior: smooth` globally hijacks anchor jumps and "back" restoration; scope it to the landing scroll-to-preview only.
- L5 — Landing preview: right-edge fade overlay cuts the 4th card mid-face at desktop; fade should only render when overflow exists.
- L6 — Sidebar footer shows user occupation but truncates at 160px; long names/occupations collide.
- L7 — `©2026 RooMatch` hardcoded in two places; make it `new Date().getFullYear()`.
- L8 — Chat unread badge `w-4 h-4` clips at 2 digits ("12"); use min-width + px padding, cap at "9+".
- L9 — Billing filter chips (All/Subscriptions/Boosts/Extras) render before any transaction exists; hide until >5 rows.
- L10 — Skip-link, heading order (multiple h1-equivalents per page), and `main` landmarks absent.

---

## Design-consistency inventory

| Axis | State |
|---|---|
| Brand name | "RooMatch" vs "RoomMatch" (C3) |
| Plans | Landing 3 tiers / Pricing 4 tiers / "Plus+" naming / 8 vs 10 likes (C6) |
| Buttons | 48 files hand-roll `<button>`, 2 use design-system `Button` → every disabled/hover/focus state is bespoke |
| Icons | Lucide (good) + 54 emojis (bad) + inline SVGs (Google, socials — fine) |
| Radius | 6 variants ad hoc (L2) |
| Toasts | 2 systems mounted, 1 used (L1) |
| Breakpoints | `desk:` ≡ `md:` duplicate (L3) |
| Empty states | 4 different patterns (icon circle sizes 16/20/24, different copy tones) |
| i18n | 3 locales, ~40% of feed strings hardcoded EN (H2) |
| Section headers | Settings uses uppercase micro-labels; Profile doesn't; Detail page uses a third style ("YOUR ROOM") |

---

## Missing UI/UX features (pre-launch shortlist)

1. **Saved-listings surface** — saving exists, browsing saved items is buried in a Profile sheet. Needs a tab or filter chip on the feed.
2. **Swipe history / "Liked by me" list** — users can't review who they liked (only who liked them, paywalled).
3. **Listing-quality guards** — image count/quality hints, min description length in Post flow.
4. **Notification preferences** — sheet exists; per-channel granularity (matches/messages/squads) unclear.
5. **Search suggestions/recents** — search is plain substring; no recent searches, no neighborhood autocomplete (city list exists in code).
6. **Report/Block from listing & profile pages** — present in chat only.
7. **Message request preview** — Platinum "message before matching" exists; recipients need a requests inbox pattern.
8. **Skeletons for chat list & squads** (text-only "Loading…" today; feed already has good skeletons).
9. **Onboarding progress save-and-exit** — closing mid-flow loses everything; persist draft to localStorage.
10. **Photo cropping/reorder** on upload.
11. **Web push opt-in moment** — VAPID key configured, but no contextual ask ("Get notified when someone likes you").
12. **Keyboard shortcuts** — at minimum ←/→/U on the swipe deck, Enter-to-send + Shift+Enter newline in chat (currently single-line input only).

## Pages needing redesign (not just fixes)

1. **Roommates desktop** — deck alone in a void; needs a two-pane layout.
2. **Landing desktop hero** — needs a product visual; currently text-only column.
3. **Apartment detail mobile** — hero/thumbnail duplication, section rhythm, sticky CTA bar (Message/Save) missing.

## Components needing redesign

1. `MatchBadge` — unknown-score state, color+text semantics, a11y label.
2. Onboarding `SliderField` — filled-track design.
3. City-scope toggle chip → segmented control.
4. Hand-rolled chat dropdown → shadcn `DropdownMenu`.
5. `ApartmentCard` footer — one primary action, real match data, i18n.

## What makes it feel less premium (root causes)

1. Emojis as UI chrome (54×).
2. Dead/placeholder data surfaced proudly (0% badges, "Created by Unknown", "—" stats, "94% unlocked" static).
3. English leaking through Hebrew UI.
4. Same-purpose things built 3 different ways (buttons, toasts, menus, empty states).
5. Paywall pressure density (Settings screen shows 4 upsells before any value).

---

## Top 25 improvements by impact

1. Fix 0% match badges (C1)
2. Fix `adjustPreferences` raw key + i18n key audit (C2)
3. Unify brand spelling (C3)
4. Un-block onboarding photo step (C4)
5. Fix cold-load onboarding redirect (C5)
6. Unify pricing across Landing/Pricing/Sheet (C6)
7. Replace all 54 emoji icons with Lucide (H1)
8. Hebrew i18n sweep of feed/chat/cards (H2)
9. Cold-start empty states with city-switch CTA (H3)
10. Banner slot system on feed (H4)
11. Recalibrate onboarding match-quality % (H5)
12. Chat row cleanup + proper dropdown (H6)
13. Auth labels + consent line + keyboard-reachable toggles (H7)
14. Error specificity on signup (H8)
15. aria-label + focus-visible global pass (H9)
16. Desktop feed: 4-col + filter rail (H10)
17. React Query migration for 5 core queries (M17)
18. ApartmentCard: drop Details, add save feedback + undo (M1, M15)
19. Segmented city-scope control (H3b)
20. Onboarding slider + WFH switch + move-in chips (M4–M6)
21. Squad card data fixes + CTA contrast (M8, M9)
22. Settings upsell consolidation (M10)
23. Apartment detail sticky CTA + section cleanup (M16)
24. Landing mobile nav de-crowding (M11)
25. Radius/button/toast system consolidation (L1–L3 + Button adoption)

## Prioritized action plan

**Wave 1 — Stop the bleeding (1–2 days):** items 1–6. All are small code changes; C1/C2/C3 are hours.
**Wave 2 — Perceived quality (2–4 days):** items 7–15. Emoji swap + i18n sweep + a11y pass are mechanical; empty states need light copywriting.
**Wave 3 — Structure (1–2 weeks):** items 16–23. Desktop layouts, React Query, detail page.
**Wave 4 — System debt (ongoing):** items 24–25 + consistency inventory; adopt `Button`/`DropdownMenu` on touch, not big-bang.

---

*Screenshots from this audit: `~/.claude/jobs/5c0e49d7/tmp/shots/` (landing, auth, pricing, onboarding steps 1–6, feed light/dark/HE, roommates, chats, profile, settings, squads, post-apartment, billing, apartment detail — mobile 375px & desktop 1440px).*
