# Roomatch — Mobile UX Tasks

Generated: 2026-05-23

---

## CRITICAL

### MOB-C01: Photo delete button invisible on mobile
- **Priority:** P0
- **Severity:** Critical
- **Files affected:** `src/components/PhotoUpload.tsx` line 122
- **Problem:** The delete photo button uses `opacity-0 group-hover:opacity-100 transition-opacity`. On touch devices, hover state never fires. Mobile users (the primary audience) cannot delete photos during onboarding or profile editing.
- **Impact:** If a user uploads the wrong photo, they have no way to remove it on mobile. Onboarding is blocked.
- **Solution:** Detect touch capability: `window.matchMedia('(hover: none)').matches`. On touch devices, always show the delete button (styled as a small X in the corner). On desktop, use hover. Alternatively, always show with lower opacity and use hover to increase opacity.
  ```tsx
  const isTouchDevice = window.matchMedia('(hover: none)').matches;
  className={`... ${isTouchDevice ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ...`}
  ```
- **Complexity:** XS
- **Dependencies:** None

---

## HIGH

### MOB-H01: Missing iOS safe area insets in bottom nav
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/components/BottomNav.tsx` line 36
- **Problem:** Bottom nav container uses `h-16` fixed height without `padding-bottom: env(safe-area-inset-bottom)`. On iPhone X and later (notch + home indicator devices), nav icons sit behind the home indicator bar.
- **Affected devices:** iPhone X, XS, XR, 11, 12, 13, 14, 15, 16 (all Pro/Max variants) — the majority of the iOS install base.
- **Solution:** The nav already has `safe-bottom` class — verify this CSS class applies `padding-bottom: env(safe-area-inset-bottom)` in the Tailwind config. If not, add inline style or configure the plugin.
  ```tsx
  <nav className="... pb-safe" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
  ```
  Also ensure `<meta name="viewport" content="viewport-fit=cover">` is set in index.html.
- **Complexity:** XS
- **Dependencies:** Check Tailwind `pb-safe` plugin configuration

### MOB-H02: Drag + vertical scroll conflict on iOS Safari
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/components/SwipeCard.tsx`
- **Problem:** `dragElastic={0.9}` on a horizontally-draggable framer-motion element causes both horizontal drag AND native vertical scroll to fire simultaneously on iOS Safari. Result: swiping a card can scroll the page, causing card dismissals or scroll jumps.
- **Solution:** 
  1. Add `dragMomentum={false}` to reduce over-shoot.
  2. Apply `style={{ touchAction: 'none' }}` on the motion.div during drag.
  3. On `onDragEnd`, restore `touchAction: 'auto'`.
  ```tsx
  <motion.div
    style={{ x, rotate, zIndex: isTop ? 10 : 0, touchAction: 'none' }}
    dragMomentum={false}
    ...
  >
  ```
- **Complexity:** S
- **Dependencies:** None

### MOB-H03: iOS keyboard pushes layout out of view in Chats
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/pages/Chats.tsx` (chat panel), `src/pages/SquadHub.tsx` (chat tab)
- **Problem:** When the iOS soft keyboard appears in the chat input, it can push the entire chat panel up or clip the message list. The `height: calc(100vh - 240px)` in SquadHub is a fixed calc that doesn't account for keyboard height.
- **Solution:** Use `dvh` (dynamic viewport height) units: `height: calc(100dvh - 240px)`. Apply `overflow: hidden` on the root and use `flex-col` with `flex-1 overflow-y-auto` for the message list.
- **Complexity:** S
- **Dependencies:** None

### MOB-H04: Tap-to-view-profile threshold too tight (5px)
- **Priority:** P1
- **Severity:** High
- **Files affected:** `src/components/SwipeCard.tsx` line 121
- **Problem:** `if (Math.abs(x.get()) < 5)` — a finger tap on a mobile device often registers 3-8px offset due to finger width and slight movement. Users trying to tap the card info to view the full profile often fail because their tap exceeds the 5px threshold.
- **Solution:** Increase threshold to 10-15px: `if (Math.abs(x.get()) < 12)`
- **Complexity:** XS
- **Dependencies:** None

---

## MEDIUM

### MOB-M01: Two-column Age/City grid may overflow on 320px screens
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/pages/Onboarding.tsx` Step 2 (Basic Info)
- **Problem:** Step 2 uses a two-column grid layout for Age and City fields. On iPhone SE (375px) and older devices (320px), this grid may overflow or cause fields to be inaccessible.
- **Solution:** Apply `grid-cols-1 sm:grid-cols-2` — single column on screens narrower than `sm` breakpoint (640px in Tailwind default, but most phones are in this range). Audit on 320px viewport in Chrome DevTools.
- **Complexity:** XS
- **Dependencies:** None

### MOB-M02: No web push notification support
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/components/NotificationToaster.tsx`
- **Problem:** The app is a web app with no Service Worker, no Web App Manifest push permission request, and no FCM/APNs integration. Users who add the app to their home screen or close the browser tab never receive match notifications.
- **Solution:** 
  1. Register a Service Worker on app load.
  2. Request push notification permission on first match.
  3. Use `web-push` library in an edge function to send browser push notifications.
  4. Long-term: build a native app (React Native) for reliable push.
- **Complexity:** XL
- **Dependencies:** VAPID keys, service worker setup

### MOB-M03: No accessibility labels on navigation buttons
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/components/BottomNav.tsx`
- **Problem:** Nav buttons have no `aria-label` attributes. Screen readers will read the icon name or nothing at all for the navigation items.
- **Solution:** Add to each nav button:
  ```tsx
  aria-label={tab.label}
  aria-current={isActive ? "page" : undefined}
  ```
- **Complexity:** XS
- **Dependencies:** Translation keys for labels (already available via t())

### MOB-M04: Keyboard handling in Onboarding text fields
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/pages/Onboarding.tsx`
- **Problem:** Text inputs in onboarding have no `returnKeyType`, `inputMode`, or `enterKeyHint` attributes. On mobile, the "Done" key on the keyboard doesn't advance to the next field or dismiss keyboard intelligently.
- **Solution:** Add `enterKeyHint="next"` to intermediate fields and `enterKeyHint="done"` to the last field in each step. Add `inputMode="numeric"` to age and budget fields.
- **Complexity:** XS
- **Dependencies:** None

### MOB-M05: Long loading state with no skeleton in Roommates
- **Priority:** P2
- **Severity:** Medium
- **Files affected:** `src/pages/Roommates.tsx`
- **Problem:** While profiles load, the skeleton shows a `Skeleton` for the card area — this is good. However the tab bar and action buttons appear immediately before cards load, creating a confusing layout shift.
- **Solution:** Show skeleton for both the card area AND the action buttons (or disable action buttons) while `profilesLoading` is true.
- **Complexity:** XS
- **Dependencies:** None

---

## LOW

### MOB-L01: framer-motion motion values not verified for cleanup
- **Priority:** P2
- **Severity:** Low
- **Files affected:** `src/components/SwipeCard.tsx`
- **Problem:** `useMotionValue(0)` and `useTransform()` are called at the component top level. framer-motion handles cleanup automatically via React's useEffect, but with rapid card transitions (user swiping fast), memory pressure from many SwipeCard instances may accumulate.
- **Solution:** Profile memory usage during a fast swipe session. Verify no memory leak in Chrome DevTools Memory panel. Consider memoizing the SwipeCard component with `React.memo`.
- **Complexity:** S
- **Dependencies:** None
