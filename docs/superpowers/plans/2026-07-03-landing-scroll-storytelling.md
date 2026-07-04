# Landing Scroll-Driven Storytelling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the landing page's uniform fade-up reveals with layered scroll-driven motion: a self-drawing steps line, hero parallax, staggered section headers, and a squad-steps light-up sequence.

**Architecture:** Two new focused components (`SectionHeader`, `ScrollStepsPath`) plus inline scroll transforms in `Landing.tsx`. All motion uses framer-motion v11 scroll primitives (`useScroll`, `useTransform`, `useSpring`) — no new dependencies. Every effect gates on `useReducedMotion()` and animates transform/opacity only.

**Tech Stack:** React 18 + TypeScript + Vite, framer-motion ^11, Tailwind (shadcn tokens), Vitest + @testing-library/react (tests in `src/test/`, setup at `src/test/setup.ts`).

**Spec:** `docs/superpowers/specs/2026-07-03-landing-scroll-storytelling-design.md`

## Global Constraints

- No new npm dependencies.
- Transform/opacity animations only — never layout-affecting properties.
- Every scroll/stagger effect must check `useReducedMotion()`; fallback = static or simple fade-up (current behavior).
- RTL (Hebrew) must work: horizontal line draw direction flips; get direction from `useLanguage().languageInfo.dir`.
- Untouched: preview-listings horizontal snap scroll, nav, footer, language switcher, all copy/i18n keys, routing.
- `@/` path alias maps to `src/`.
- Run tests with `npm run test`; dev server is `npm run dev` on port 8080.

---

### Task 1: Test-environment mocks + `SectionHeader` component

**Files:**
- Modify: `src/test/setup.ts`
- Create: `src/components/landing/SectionHeader.tsx`
- Test: `src/test/SectionHeader.test.tsx`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `SectionHeader` default export, props `{ title: string; subtitle: string }`. Renders the standard centered section header block (`text-center mb-10`) with staggered title/subtitle reveal. Task 4/5/6 import it as `import SectionHeader from "@/components/landing/SectionHeader";`.

- [ ] **Step 1: Add IntersectionObserver + ResizeObserver mocks to test setup**

framer-motion's `whileInView` needs `IntersectionObserver`; `Landing.tsx` uses `ResizeObserver`. jsdom has neither. Append to `src/test/setup.ts`:

```ts
class ObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: ObserverMock,
});

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ObserverMock,
});
```

- [ ] **Step 2: Write the failing test**

Create `src/test/SectionHeader.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SectionHeader from "@/components/landing/SectionHeader";

describe("SectionHeader", () => {
  it("renders title and subtitle", () => {
    render(<SectionHeader title="How it works" subtitle="Three steps" />);
    expect(screen.getByRole("heading", { name: "How it works" })).toBeInTheDocument();
    expect(screen.getByText("Three steps")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- src/test/SectionHeader.test.tsx`
Expected: FAIL — cannot resolve `@/components/landing/SectionHeader`.

- [ ] **Step 4: Implement `SectionHeader`**

Create `src/components/landing/SectionHeader.tsx`:

```tsx
import { motion, useReducedMotion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
}

export default function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">{title}</h2>
        <p className="text-muted-foreground mt-2">{subtitle}</p>
      </div>
    );
  }

  return (
    <div className="text-center mb-10">
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        className="text-2xl sm:text-3xl font-extrabold text-foreground"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-muted-foreground mt-2"
      >
        {subtitle}
      </motion.p>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- src/test/SectionHeader.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Run the full suite to confirm the setup change broke nothing**

Run: `npm run test`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/test/setup.ts src/test/SectionHeader.test.tsx src/components/landing/SectionHeader.tsx
git commit -m "feat: add SectionHeader with staggered title/subtitle reveal"
```

---

### Task 2: `ScrollStepsPath` component

**Files:**
- Create: `src/components/landing/ScrollStepsPath.tsx`
- Test: `src/test/ScrollStepsPath.test.tsx`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `ScrollStepsPath` default export and `ScrollStep` type:
  ```ts
  export interface ScrollStep {
    step: string;      // "01"
    icon: LucideIcon;
    title: string;
    desc: string;
  }
  // props: { steps: ScrollStep[]; rtl?: boolean }
  ```
  Renders the full how-it-works grid (cards included) with a scroll-drawn connecting line. Task 3 imports it as `import ScrollStepsPath from "@/components/landing/ScrollStepsPath";`.

- [ ] **Step 1: Write the failing test**

Create `src/test/ScrollStepsPath.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Users, Heart, MessageCircle } from "lucide-react";
import ScrollStepsPath from "@/components/landing/ScrollStepsPath";

const STEPS = [
  { step: "01", icon: Users, title: "Build profile", desc: "Answer questions" },
  { step: "02", icon: Heart, title: "Swipe & match", desc: "Find people" },
  { step: "03", icon: MessageCircle, title: "Chat & move in", desc: "Message matches" },
];

describe("ScrollStepsPath", () => {
  it("renders every step card", () => {
    render(<ScrollStepsPath steps={STEPS} />);
    for (const s of STEPS) {
      expect(screen.getByText(s.title)).toBeInTheDocument();
      expect(screen.getByText(s.desc)).toBeInTheDocument();
      expect(screen.getByText(s.step)).toBeInTheDocument();
    }
  });

  it("renders horizontal and vertical connector lines", () => {
    const { container } = render(<ScrollStepsPath steps={STEPS} />);
    const svgs = container.querySelectorAll("svg[aria-hidden='true'][data-connector]");
    expect(svgs).toHaveLength(2);
  });

  it("mirrors the horizontal line in RTL", () => {
    const { container } = render(<ScrollStepsPath steps={STEPS} rtl />);
    const horizontal = container.querySelector("svg[data-connector='horizontal']") as SVGElement;
    expect(horizontal.style.transform).toBe("scaleX(-1)");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/ScrollStepsPath.test.tsx`
Expected: FAIL — cannot resolve `@/components/landing/ScrollStepsPath`.

- [ ] **Step 3: Implement `ScrollStepsPath`**

Create `src/components/landing/ScrollStepsPath.tsx`. Notes on the mechanics:
- `useScroll({ target, offset: ["start 0.85", "end 0.55"] })` gives 0→1 as the section scrolls through the viewport; `useSpring` smooths it so cards land with a spring feel.
- The line is two SVGs: horizontal (`hidden sm:block`, sits at the icon row, `top-[46px]`) and vertical (`sm:hidden`, centered, full height). Both sit behind the cards (cards have `bg-card`), so the line shows only in the gaps — reading as a connector.
- `motion.path style={{ pathLength }}` does the self-drawing; framer-motion normalizes path length internally.
- Per-card hooks live in a `StepCard` child component (hooks can't go in a loop).
- Reduced motion: line fully drawn, cards static.

```tsx
import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
  MotionValue,
} from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface ScrollStep {
  step: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface ScrollStepsPathProps {
  steps: ScrollStep[];
  rtl?: boolean;
}

function StepCard({
  step,
  index,
  total,
  progress,
  reduceMotion,
}: {
  step: ScrollStep;
  index: number;
  total: number;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}) {
  const start = (index / total) * 0.7;
  const end = start + 0.3;
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [36, 0]);
  const iconScale = useTransform(progress, [start + 0.08, end], [0.6, 1]);
  const Icon = step.icon;

  return (
    <motion.div
      style={reduceMotion ? undefined : { opacity, y }}
      className="bg-card rounded-2xl p-6 shadow-card relative"
    >
      <span className="absolute top-4 right-4 text-xs font-extrabold text-muted-foreground/30">
        {step.step}
      </span>
      <motion.div
        style={reduceMotion ? undefined : { scale: iconScale }}
        className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center mb-4"
      >
        <Icon className="w-5 h-5 text-primary-foreground" />
      </motion.div>
      <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
    </motion.div>
  );
}

export default function ScrollStepsPath({ steps, rtl = false }: ScrollStepsPathProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.85", "end 0.55"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const pathLength = reduceMotion ? 1 : progress;

  return (
    <div ref={sectionRef} className="relative">
      {/* Horizontal connector — desktop; sits at icon-row height, behind cards */}
      <svg
        aria-hidden="true"
        data-connector="horizontal"
        className="hidden sm:block absolute top-[46px] left-0 w-full h-1 pointer-events-none text-primary/40"
        viewBox="0 0 100 2"
        preserveAspectRatio="none"
        style={rtl ? { transform: "scaleX(-1)" } : undefined}
      >
        <motion.path
          d="M 0 1 H 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ pathLength }}
        />
      </svg>
      {/* Vertical connector — mobile; centered, behind cards, visible in gaps */}
      <svg
        aria-hidden="true"
        data-connector="vertical"
        className="sm:hidden absolute left-1/2 top-4 -ml-px h-[calc(100%-2rem)] w-0.5 pointer-events-none text-primary/40"
        viewBox="0 0 2 100"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M 1 0 V 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ pathLength }}
        />
      </svg>

      <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <StepCard
            key={step.step}
            step={step}
            index={i}
            total={steps.length}
            progress={progress}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/ScrollStepsPath.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/test/ScrollStepsPath.test.tsx src/components/landing/ScrollStepsPath.tsx
git commit -m "feat: add ScrollStepsPath with scroll-drawn connector line"
```

---

### Task 3: Integrate `ScrollStepsPath` into the How-it-works section

**Files:**
- Modify: `src/pages/Landing.tsx` (the How-it-works section, currently lines 325–355, and imports)

**Interfaces:**
- Consumes: `ScrollStepsPath` + `ScrollStep` from Task 2; `SectionHeader` from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add imports and pass RTL flag**

In `src/pages/Landing.tsx` add:

```tsx
import SectionHeader from "@/components/landing/SectionHeader";
import ScrollStepsPath from "@/components/landing/ScrollStepsPath";
```

`useLanguage()` is already destructured on line 25; extend it to also take `languageInfo` — it already does (`const { t, language, setLanguage, languageInfo } = useLanguage();`). No change needed there.

- [ ] **Step 2: Replace the How-it-works section body**

Replace the current section (the `motion.div` header block plus the `grid grid-cols-1 sm:grid-cols-3 gap-6` map over `HOW_IT_WORKS`) with:

```tsx
{/* ── How it works ── */}
<section className="px-5 py-16 bg-secondary/40">
  <div className="max-w-5xl mx-auto">
    <SectionHeader title={t("howItWorksTitle")} subtitle={t("howItWorksSub")} />
    <ScrollStepsPath steps={HOW_IT_WORKS} rtl={languageInfo.dir === "rtl"} />
  </div>
</section>
```

`HOW_IT_WORKS` (defined at the top of the component) already matches the `ScrollStep` shape (`step`, `icon`, `title`, `desc`) — no data changes.

- [ ] **Step 3: Verify build and lint**

Run: `npm run build && npm run lint`
Expected: build succeeds; no new lint errors.

- [ ] **Step 4: Visual check**

Run: `npm run dev` and open `http://localhost:8080/` in a signed-out browser session (App.tsx renders `<Landing />` at `/` when there is no user — use a private window if you have a session). Scroll to How-it-works: cards should appear in sequence and the line should draw with scroll. Switch language to עברית and confirm the line draws right-to-left. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "feat: scroll-driven how-it-works with self-drawing connector"
```

---

### Task 4: Hero parallax (blobs + floating chips)

**Files:**
- Modify: `src/pages/Landing.tsx` (hero section, currently lines 159–268, plus imports)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add scroll transforms**

Extend the framer-motion import in `Landing.tsx`:

```tsx
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion";
```

Inside the `Landing` component (after the existing `useState`/`useRef` calls):

```tsx
const reduceMotion = useReducedMotion() ?? false;
const { scrollY } = useScroll();
const blob1Y = useTransform(scrollY, [0, 600], [0, 80]);
const blob2Y = useTransform(scrollY, [0, 600], [0, -60]);
const chipMatchY = useTransform(scrollY, [0, 600], [0, -36]);
const chipChatY = useTransform(scrollY, [0, 600], [0, -20]);
```

- [ ] **Step 2: Apply to the blobs**

Replace the two static blob `div`s at the top of the hero section:

```tsx
<motion.div
  style={{ background: "var(--gradient-primary)", y: reduceMotion ? 0 : blob1Y }}
  className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl"
/>
<motion.div
  style={{ y: reduceMotion ? 0 : blob2Y }}
  className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10 blur-3xl bg-accent"
/>
```

- [ ] **Step 3: Apply to the floating chips**

In the desktop product visual, convert the two chip `div`s to `motion.div` and add the parallax while keeping their rotation (move rotate into the transform via Tailwind class as-is — framer-motion `y` composes with CSS class rotation only if rotation is also a motion style, so move it there):

```tsx
<motion.div
  style={{ y: reduceMotion ? 0 : chipMatchY, rotate: -3 }}
  className="absolute -left-10 top-10 bg-card rounded-2xl shadow-elevated px-4 py-3 flex items-center gap-2.5"
>
  {/* …existing chip content unchanged… */}
</motion.div>

<motion.div
  style={{ y: reduceMotion ? 0 : chipChatY, rotate: 2 }}
  className="absolute -right-8 bottom-14 bg-card rounded-2xl shadow-elevated px-4 py-3 flex items-center gap-2.5"
>
  {/* …existing chip content unchanged… */}
</motion.div>
```

(Remove the `-rotate-3` / `rotate-2` Tailwind classes — rotation now comes from the motion style so it composes with the parallax translate.)

- [ ] **Step 4: Verify build, lint, tests**

Run: `npm run build && npm run lint && npm run test`
Expected: all pass.

- [ ] **Step 5: Visual check**

`npm run dev`, desktop viewport: scroll slowly away from the hero — blobs drift apart (one down, one up), chips float up at different speeds. Everything subtle (≤80px total). Stop the server.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "feat: hero parallax on gradient blobs and floating chips"
```

---

### Task 5: Staggered section headers everywhere

**Files:**
- Modify: `src/pages/Landing.tsx` (headers of: Why RooMatch, Features, Pricing, Squad highlight, Final CTA sections)

**Interfaces:**
- Consumes: `SectionHeader` from Task 1 (How-it-works already converted in Task 3); `reduceMotion` const from Task 4.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace the three remaining `motion.div` header blocks**

Each section currently has this pattern:

```tsx
<motion.div
  variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.01 }}
  className="text-center mb-10"
>
  <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">{t("…Title")}</h2>
  <p className="text-muted-foreground mt-2">{t("…Sub")}</p>
</motion.div>
```

Replace with one line each:

```tsx
<SectionHeader title={t("whyRoomatchTitle")} subtitle={t("whyRoomatchSub")} />
<SectionHeader title={t("featuresTitle")} subtitle={t("featuresSub")} />
<SectionHeader title={t("pricingTitle")} subtitle={t("pricingSub")} />
```

The Squad highlight and Final CTA headings use different markup (left-aligned inside a card / block with a button), so they can't use `SectionHeader` — stagger them inline instead.

- [ ] **Step 2: Stagger the Squad highlight heading inline**

Inside the Squad section card (the h2 + p directly under the "Only on RooMatch" badge), replace:

```tsx
<h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
  {t("squadSectionTitle")}
</h2>
<p className="text-muted-foreground mb-6 max-w-lg">
  {t("squadSectionDesc")}
</p>
```

with:

```tsx
<motion.h2
  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.5 }}
  className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3"
>
  {t("squadSectionTitle")}
</motion.h2>
<motion.p
  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.5, delay: 0.15 }}
  className="text-muted-foreground mb-6 max-w-lg"
>
  {t("squadSectionDesc")}
</motion.p>
```

(`reduceMotion` is the const added in Task 4; `initial={false}` renders the element already settled, skipping the reveal.)

- [ ] **Step 3: Stagger the Final CTA heading inline**

In the Final CTA section, keep the outer `motion.div` wrapper but convert its h2 + p the same way:

```tsx
<motion.h2
  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.5 }}
  className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3"
>
  {t("ctaTitle")}
</motion.h2>
<motion.p
  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.5, delay: 0.15 }}
  className="text-muted-foreground mb-7"
>
  {t("ctaDesc")}
</motion.p>
```

- [ ] **Step 4: Verify build, lint, tests**

Run: `npm run build && npm run lint && npm run test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "feat: staggered section header reveals"
```

---

### Task 6: Squad steps light-up + single CTA pulse

**Files:**
- Modify: `src/pages/Landing.tsx` (Squad highlight section, currently lines 437–483)

**Interfaces:**
- Consumes: `reduceMotion` const added in Task 4.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Convert the 3-step explainer to a staggered light-up**

Replace the steps container (`<div className="flex items-center gap-2 mb-5">` and its map) with:

```tsx
<motion.div
  className="flex items-center gap-2 mb-5"
  initial="hidden"
  whileInView="show"
  viewport={{ once: true, amount: 0.6 }}
  variants={{ hidden: {}, show: { transition: { staggerChildren: reduceMotion ? 0 : 0.35 } } }}
>
  {[
    { step: "1", label: t("squadInlineStep1") },
    { step: "2", label: t("squadInlineStep2") },
    { step: "3", label: t("squadStep4") },
  ].map(({ step, label }, i) => (
    <motion.div
      key={step}
      variants={{
        hidden: { opacity: reduceMotion ? 1 : 0.2 },
        show: { opacity: 1, transition: { duration: 0.4 } },
      }}
      className="flex items-center gap-1.5"
    >
      {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      <div className="flex flex-col items-center text-center">
        <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center mb-1 shrink-0">
          <span className="text-[11px] font-bold text-primary-foreground">{step}</span>
        </div>
        <span className="text-[10px] text-foreground font-medium leading-tight max-w-[56px]">{label}</span>
      </div>
    </motion.div>
  ))}
</motion.div>
```

- [ ] **Step 2: Add the single CTA pulse**

Convert the "Start a Squad" `button` to `motion.button`; pulse fires once after the steps finish lighting (3 × 0.35s stagger + 0.4s ≈ 1.45s):

```tsx
<motion.button
  onClick={() => navigate("/auth")}
  whileInView={reduceMotion ? undefined : { scale: [1, 1.04, 1] }}
  viewport={{ once: true, amount: 0.8 }}
  transition={{ delay: 1.5, duration: 0.5 }}
  className="gradient-primary text-primary-foreground font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 w-fit"
>
  <Users className="w-4 h-4" />
  {t("startASquad")}
</motion.button>
```

- [ ] **Step 3: Verify build, lint, tests**

Run: `npm run build && npm run lint && npm run test`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "feat: squad steps light-up sequence with one-shot CTA pulse"
```

---

### Task 7: Full verification pass

**Files:**
- No new files. Fix-ups only if checks fail.

**Interfaces:**
- Consumes: everything above.
- Produces: verified feature.

- [ ] **Step 1: Automated checks**

Run: `npm run test && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 2: Manual matrix (dev server on :8080)**

Verify each cell; the spec's success criteria:

| Check | LTR (EN) | RTL (עברית) |
|---|---|---|
| How-it-works line draws with scroll; steps in sequence | ☐ | ☐ (draws right→left) |
| Hero blobs/chips parallax, distinct speeds, no jank | ☐ | ☐ |
| Section headers: title then subtitle | ☐ | ☐ |
| Squad steps light 1→2→3, CTA pulses once | ☐ | ☐ |
| Preview-listings horizontal snap scroll unchanged | ☐ | ☐ |
| Mobile 375px: vertical line, everything sequences | ☐ | ☐ |

Then enable reduced motion (macOS: System Settings → Accessibility → Display → Reduce motion, or DevTools → Rendering → `prefers-reduced-motion: reduce`) and confirm: line fully drawn, no parallax, no pulse, headers static, squad steps full opacity.

Check light + dark themes once each (line color `text-primary/40` must be visible on both `bg-secondary/40` and card gaps).

- [ ] **Step 3: Commit any fix-ups**

```bash
git add -A src/
git commit -m "fix: scroll-storytelling polish from verification pass"
```

Only commit if fixes were needed.
