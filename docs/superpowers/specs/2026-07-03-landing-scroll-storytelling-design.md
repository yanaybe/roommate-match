# Landing Page Scroll-Driven Storytelling — Design

**Date:** 2026-07-03
**Status:** Approved by user
**Scope:** `src/pages/Landing.tsx` + one new component. No other pages.

## Goal

Upgrade the landing page from uniform fade-up reveals to layered, scroll-driven
motion that tells the product story as the user scrolls. Animation must feel
premium, stay on-brand (roommate matching), and never degrade usability.

## Approach

Implement with **framer-motion scroll primitives** (`useScroll`, `useTransform`,
`useSpring`) — already a dependency, matches existing code style. Use the
**21st.dev Magic MCP inspiration tool** as a pattern reference during
implementation (scroll-storytelling / step-timeline components), but all shipped
code is hand-written in the project's existing idiom (Tailwind tokens,
`t()` i18n, RTL-aware).

Rejected alternatives:
- Magic MCP code generation directly — output wouldn't match design tokens,
  i18n, or RTL; full rework needed anyway.
- GSAP ScrollTrigger — ~70KB new dependency, second animation system. Overkill.

## Components

### 1. "How it works" — centerpiece (new component: `ScrollStepsPath`)

- The 3 step cards animate in **sequence** tied to scroll progress through the
  section: card slides in with a spring, then its icon pops (scale spring).
- An **SVG connecting line draws itself** between steps 1 → 2 → 3:
  `pathLength` mapped to section scroll progress via `useScroll({ target, offset })`.
- Desktop (`sm:grid-cols-3`): line runs horizontally between cards.
- Mobile (single column): line runs vertically down the section.
- RTL: horizontal line direction flips (draw right → left in Hebrew).
- New component lives at `src/components/ScrollStepsPath.tsx`; owns the SVG
  path + scroll progress; step cards remain in `Landing.tsx` and receive
  per-step progress values (or the component wraps the grid — implementer's
  choice, keep the public surface to: steps data in, animated section out).

### 2. Hero parallax

- The two gradient blur blobs and the two floating chips (match / chat) drift
  at different speeds on scroll-away: `useTransform(scrollY, ...)` producing
  small translate offsets (max ~20–40px, different per element).
- Subtle by design; transform-only.

### 3. Section headers

- Section titles get slight upward parallax as they enter the viewport;
  subtitle fades in ~0.15s after the title (staggered, replacing the current
  single uniform fade-up on the header block).
- Applies to: Preview listings (no header today — skip), How it works,
  Why RooMatch, Features, Squad highlight, Pricing, Final CTA.

### 4. Squad highlight steps

- The inline 1 → 2 → 3 squad steps **light up one at a time** (opacity/color
  transition) as the section crosses the viewport, staggered.
- After the last step lights, the "Start a Squad" CTA does a **single**
  attention pulse (scale 1 → 1.04 → 1, once, not looping).

## Guardrails

- **Reduced motion:** all scroll-linked effects check
  `useReducedMotion()` (framer-motion). Fallback = current simple fade-up
  behavior. Line renders fully drawn, no parallax, no pulse.
- **Performance:** transform/opacity only. No layout-affecting properties.
  No scroll listeners outside framer-motion's rAF-batched hooks.
- **RTL:** parallax x-offsets and line draw direction respect `dir="rtl"`
  (Hebrew). Test in both directions.
- **Untouched:** preview-listings horizontal snap scroll, nav, footer,
  language switcher, all copy/i18n keys, routing.

## Testing

- `npm run test` stays green (Vitest).
- Manual: dev server, verify each section in LTR + RTL, light + dark,
  mobile viewport (375px) + desktop, and with OS reduced-motion enabled.
- Lint passes.

## Success criteria

- How-it-works line visibly draws with scroll; steps sequence correctly.
- Hero elements parallax at distinct speeds; no jank (60fps transform-only).
- Reduced-motion users get the current (pre-change) experience.
- No visual/behavioral regression in RTL Hebrew.
