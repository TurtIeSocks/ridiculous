# Easing Picker Demo Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Front the Easing Picker demo section with a 2-column hero playground (basis/direction/preset/canvas on the left, animated preview with property toggles + code output on the right), keep existing 6 examples below as an API-surface catalog, and extend `PreviewProperty` with 4 new properties (`scaleX`, `scaleY`, `color`, `blur`).

**Architecture:** New demo-only component `EasingPlayground` at `src/examples/easing-picker/playground.tsx`. Composes registry sub-components (`BasisTabs`, `BezierCanvas`, `BezierInputs`, `SpringControls`, `StepsControls`, `EasingPreview`) into a glass-card 2-col layout. Owns single `useState<PlaygroundState>` for all knobs. Registry-side change is purely additive (4 new `PreviewProperty` members + 4 `PROP_KEYFRAMES` entries).

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, Biome, Vitest (jsdom). Existing site palette uses oklch + glass-card utility classes.

**Spec:** [docs/superpowers/specs/2026-05-21-easing-picker-demo-redesign.md](../specs/2026-05-21-easing-picker-demo-redesign.md)

---

## File Structure

- **Modify:** `src/components/ui/easing-picker/easing-picker.tsx` — extend `PreviewProperty` union (4 new members) + `PROP_KEYFRAMES` record (4 new entries)
- **Create:** `src/examples/easing-picker/playground.tsx` — new `EasingPlayground` demo-only component
- **Modify:** `src/app.tsx` — import + render `<EasingPlayground />` above existing 6 examples; wrap examples in 2-col grid with `/ API surface` label
- **Modify:** `tests/easing-picker.test.tsx` — extend `describe("EasingPreview")` with parametrized test covering new properties
- **Modify:** `tests/easing-types.test-d.ts` — add type-level exhaustiveness check `PreviewProperty === keyof typeof PROP_KEYFRAMES`
- **Create:** `tests/easing-playground.test.tsx` — smoke test + family-pill / property-toggle / replay tests

---

## Task 1: Extend `PreviewProperty` + `PROP_KEYFRAMES`

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx:1609-1639`
- Modify: `tests/easing-picker.test.tsx:130-161` (extend `describe("EasingPreview")`)

- [ ] **Step 1: Write the failing test**

Open `tests/easing-picker.test.tsx`. Inside the existing `describe("EasingPreview", () => { ... })` block, append a new parametrized test after the existing tests:

```tsx
  test.each([
    ["scaleX", /scaleX/],
    ["scaleY", /scaleY/],
    ["color", /background-color/],
    ["blur", /blur\(/],
  ] as const)("emits keyframes for property=%s", (prop, expectedFragment) => {
    const { container } = render(
      <EasingPreview easing="ease" property={prop} />,
    )
    const styleEl = container.querySelector("style")
    expect(styleEl).not.toBeNull()
    expect(styleEl?.textContent ?? "").toMatch(expectedFragment)
  })
```

Confirm imports at the top of the test file already include `EasingPreview` (line 8 per scan). If not, add `EasingPreview` to the import from `@/components/ui/easing-picker`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/easing-picker.test.tsx -t "emits keyframes"`

Expected: 4 failures. Each fails because `PreviewProperty` does not include the new member yet — TypeScript will error on the literal (e.g. `Type '"scaleX"' is not assignable to type 'PreviewProperty'`).

- [ ] **Step 3: Extend `PreviewProperty` union and `PROP_KEYFRAMES`**

In `src/components/ui/easing-picker/easing-picker.tsx`, replace the existing `PreviewProperty` union (around line 1609) with:

```ts
export type PreviewProperty =
  | "moveX"
  | "moveY"
  | "scale"
  | "scaleX"
  | "scaleY"
  | "rotate"
  | "opacity"
  | "width"
  | "color"
  | "blur"
```

Replace the existing `PROP_KEYFRAMES` record (around line 1626) with:

```ts
const PROP_KEYFRAMES: Record<PreviewProperty, { from: string; to: string }> = {
  moveX: {
    from: "transform: translateX(0)",
    to: "transform: translateX(200px)",
  },
  moveY: {
    from: "transform: translateY(0)",
    to: "transform: translateY(100px)",
  },
  scale: { from: "transform: scale(0.5)", to: "transform: scale(1.5)" },
  scaleX: { from: "transform: scaleX(0.5)", to: "transform: scaleX(1.5)" },
  scaleY: { from: "transform: scaleY(0.5)", to: "transform: scaleY(1.5)" },
  rotate: { from: "transform: rotate(0)", to: "transform: rotate(360deg)" },
  opacity: { from: "opacity: 0", to: "opacity: 1" },
  width: { from: "width: 50px", to: "width: 200px" },
  color: {
    from: "background-color: oklch(0.55 0.2 300)",
    to: "background-color: oklch(0.55 0.2 30)",
  },
  blur: { from: "filter: blur(0px)", to: "filter: blur(8px)" },
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/easing-picker.test.tsx -t "emits keyframes"`

Expected: 4/4 PASS.

- [ ] **Step 5: Add type-level exhaustiveness check**

Open `tests/easing-types.test-d.ts`. At the end of the file, append:

```ts
import type { PreviewProperty } from "@/components/ui/easing-picker"

// Compile-time assertion: PreviewProperty must list every property the playground exposes.
// If a property is added/removed in PROP_KEYFRAMES without updating PreviewProperty
// (or vice versa), this fails at type-check time via the exhaustive list below.
const _EXHAUSTIVE_PREVIEW_PROPERTIES: ReadonlyArray<PreviewProperty> = [
  "moveX",
  "moveY",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
  "opacity",
  "width",
  "color",
  "blur",
] as const
void _EXHAUSTIVE_PREVIEW_PROPERTIES
```

- [ ] **Step 6: Run typecheck**

Run: `pnpm typecheck`

Expected: no errors.

- [ ] **Step 7: Run full test suite to confirm no regressions**

Run: `pnpm test`

Expected: all tests pass (272 baseline + 4 new = 276).

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.tsx tests/easing-picker.test.tsx tests/easing-types.test-d.ts
git commit -m "Extend PreviewProperty with scaleX, scaleY, color, blur"
```

---

## Task 2: Scaffold `EasingPlayground` shell + state

Create the new component file with state interface, top strip header, and a hollow 2-col container. No interactive sub-components yet — the next tasks fill those in.

**Files:**
- Create: `src/examples/easing-picker/playground.tsx`
- Create: `tests/easing-playground.test.tsx`

- [ ] **Step 1: Write the failing smoke test**

Create `tests/easing-playground.test.tsx`:

```tsx
import { describe, expect, test } from "vitest"
import { render } from "@testing-library/react"
import { EasingPlayground } from "@/examples/easing-picker/playground"

describe("EasingPlayground", () => {
  test("renders the playground container with eyebrow + heading", () => {
    const { container, getByText } = render(<EasingPlayground />)
    expect(container.querySelector("[data-slot='easing-playground']")).not.toBeNull()
    expect(getByText("Easing Picker")).toBeInTheDocument()
  })
})
```

Note: the test imports from `@/examples/...`. Check `tsconfig.app.json` for whether the `@/` alias covers `src/examples/`. The Vite alias config in [vitest.config.ts](../../vitest.config.ts) maps `@` → `./src`, so `@/examples/easing-picker/playground` resolves to `src/examples/easing-picker/playground.tsx`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/easing-playground.test.tsx`

Expected: FAIL — `Cannot find module '@/examples/easing-picker/playground'`.

- [ ] **Step 3: Create playground.tsx with state + shell**

Create `src/examples/easing-picker/playground.tsx`:

```tsx
"use client"

import { useState } from "react"
import type {
  EasingString,
  PolynomialFamily,
  PreviewProperty,
  StepPosition,
} from "@/components/ui/easing-picker"
import { cn } from "@/lib/utils"

type PlaygroundDirection = "In" | "Out" | "InOut" // subset of registry's Direction (4-way); playground UX exposes 3
type Basis = "bezier" | "spring" | "steps"
type OutputFormat = "css" | "tailwind-v3" | "tailwind-v4"

interface PlaygroundState {
  basis: Basis

  // bezier — extraTop/Bottom required by EasingState; canvas-viewport-only, not user-tweakable here
  x1: number
  y1: number
  x2: number
  y2: number
  extraTop: number
  extraBottom: number
  family: PolynomialFamily | null
  direction: PlaygroundDirection

  // spring
  stiffness: number
  damping: number
  mass: number

  // steps — `n` matches StepsControlsProps.value.n (not `steps`)
  n: number
  position: StepPosition

  // preview
  property: PreviewProperty
  duration: number
  loop: boolean
  replayKey: number

  // output
  format: OutputFormat
}

const INITIAL_STATE: PlaygroundState = {
  basis: "bezier",
  // easeInOutCubic = [0.65, 0, 0.35, 1] — keep bezier coords consistent with family="Cubic"
  x1: 0.65,
  y1: 0,
  x2: 0.35,
  y2: 1,
  extraTop: 0.25,
  extraBottom: 0.25,
  family: "Cubic",
  direction: "InOut",
  stiffness: 100,
  damping: 10,
  mass: 1,
  n: 4,
  position: "end",
  property: "moveX",
  duration: 600,
  loop: true,
  replayKey: 0,
  format: "css",
}

export function EasingPlayground() {
  const [state] = useState<PlaygroundState>(INITIAL_STATE)

  // Placeholder — replaced in later tasks once derived helpers are wired.
  const easing: EasingString = "cubic-bezier(0.42, 0, 0.58, 1)" as EasingString

  return (
    <section
      data-slot="easing-playground"
      data-replay-key={state.replayKey}
      className={cn(
        "glass-card rounded-2xl p-6 md:p-8 border border-white/10",
        "bg-[linear-gradient(135deg,oklch(0.18_0.04_290),oklch(0.14_0.03_270))]",
      )}
    >
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
            / component · playground
          </div>
          <h3 className="mt-1 text-xl font-bold tracking-tight">
            Easing Picker
          </h3>
        </div>
        <div className="text-xs font-mono text-muted-foreground">{easing}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr] items-stretch">
        <div data-slot="easing-playground-left">{/* filled in Task 3 */}</div>
        <div data-slot="easing-playground-right">{/* filled in Task 5 */}</div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/easing-playground.test.tsx`

Expected: PASS (1/1).

- [ ] **Step 5: Run typecheck**

Run: `pnpm typecheck`

Expected: no errors. (`state` is read via `data-replay-key={state.replayKey}`, satisfying the no-unused-var lint.)

- [ ] **Step 6: Commit**

```bash
git add src/examples/easing-picker/playground.tsx tests/easing-playground.test.tsx
git commit -m "Scaffold EasingPlayground shell with state interface"
```

---

## Task 3: Left column — basis tabs, direction toggle, family-pill row, bezier canvas

Wire up the left column for the `basis === "bezier"` path. Build a custom family-pill row (not `<PresetGallery />`, which has different layout). Direction toggle drives preset lookup.

**Files:**
- Modify: `src/examples/easing-picker/playground.tsx`
- Modify: `tests/easing-playground.test.tsx`

- [ ] **Step 1: Write the failing test for family-pill click**

In `tests/easing-playground.test.tsx`, add inside `describe("EasingPlayground")`:

```tsx
  test("clicking a family pill updates the displayed easing string", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    // Initially: Cubic + InOut → cubic-bezier(0.45, 0, 0.55, 1)
    const initial = container.querySelector(
      "[data-slot='easing-playground-value']",
    )?.textContent
    expect(initial).toContain("cubic-bezier")
    // Click Sine pill
    const sinePill = await findByRole("button", { name: /^Sine$/i })
    sinePill.click()
    // Sine + InOut → cubic-bezier(0.37, 0, 0.63, 1)
    const after = container.querySelector(
      "[data-slot='easing-playground-value']",
    )?.textContent
    expect(after).not.toBe(initial)
    expect(after).toContain("0.37")
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/easing-playground.test.tsx -t "clicking a family pill"`

Expected: FAIL — `data-slot='easing-playground-value'` not in DOM; `Sine` button not found.

- [ ] **Step 3: Implement left column with basis tabs, direction, family pills, canvas**

Replace the entire `src/examples/easing-picker/playground.tsx` file with:

```tsx
"use client"

import { useState } from "react"
import {
  BezierCanvas,
  type EasingString,
  formatEasing,
  type PolynomialFamily,
  PRESETS,
  type PreviewProperty,
  type StepPosition,
} from "@/components/ui/easing-picker"
import { cn } from "@/lib/utils"

const FAMILIES: ReadonlyArray<PolynomialFamily> = [
  "Sine",
  "Quad",
  "Cubic",
  "Quart",
  "Quint",
  "Expo",
  "Circ",
  "Back",
]

type PlaygroundDirection = "In" | "Out" | "InOut"
const DIRECTIONS: ReadonlyArray<PlaygroundDirection> = ["In", "Out", "InOut"]

type Basis = "bezier" | "spring" | "steps"
const BASES: ReadonlyArray<Basis> = ["bezier", "spring", "steps"]

type OutputFormat = "css" | "tailwind-v3" | "tailwind-v4"

interface PlaygroundState {
  basis: Basis
  x1: number
  y1: number
  x2: number
  y2: number
  extraTop: number
  extraBottom: number
  family: PolynomialFamily | null
  direction: PlaygroundDirection
  stiffness: number
  damping: number
  mass: number
  n: number
  position: StepPosition
  property: PreviewProperty
  duration: number
  loop: boolean
  replayKey: number
  format: OutputFormat
}

const INITIAL_STATE: PlaygroundState = {
  basis: "bezier",
  // easeInOutCubic = [0.65, 0, 0.35, 1] — keep bezier coords consistent with family="Cubic"
  x1: 0.65,
  y1: 0,
  x2: 0.35,
  y2: 1,
  extraTop: 0.25,
  extraBottom: 0.25,
  family: "Cubic",
  direction: "InOut",
  stiffness: 100,
  damping: 10,
  mass: 1,
  n: 4,
  position: "end",
  property: "moveX",
  duration: 600,
  loop: true,
  replayKey: 0,
  format: "css",
}

function resolveBezier(
  family: PolynomialFamily,
  direction: PlaygroundDirection,
): { x1: number; y1: number; x2: number; y2: number } | null {
  const match = PRESETS.find(
    (p) => p.family === family && p.direction === direction,
  )
  if (!match) return null
  const [x1, y1, x2, y2] = match.bezier
  return { x1, y1, x2, y2 }
}

function computeEasing(state: PlaygroundState): EasingString {
  if (state.basis === "bezier") {
    return formatEasing({
      basis: "bezier",
      x1: state.x1,
      y1: state.y1,
      x2: state.x2,
      y2: state.y2,
      extraTop: state.extraTop,
      extraBottom: state.extraBottom,
    })
  }
  if (state.basis === "spring") {
    return formatEasing({
      basis: "spring",
      stiffness: state.stiffness,
      damping: state.damping,
      mass: state.mass,
    })
  }
  return formatEasing({
    basis: "steps",
    n: state.n,
    position: state.position,
  })
}

const pillClass = (active: boolean) =>
  cn(
    "rounded-full px-3 py-1 text-xs font-mono border transition",
    active
      ? "bg-gradient-to-br from-violet-glow to-pink-glow text-background border-transparent"
      : "bg-white/5 border-white/10 hover:bg-white/10",
  )

const sectionLabelClass =
  "font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-2"

export function EasingPlayground() {
  const [state, setState] = useState<PlaygroundState>(INITIAL_STATE)
  const easing = computeEasing(state)

  const setBasis = (basis: Basis) => setState((s) => ({ ...s, basis }))
  const setDirection = (direction: PlaygroundDirection) =>
    setState((s) => {
      if (s.family == null) return { ...s, direction }
      const bezier = resolveBezier(s.family, direction)
      return bezier ? { ...s, direction, ...bezier } : { ...s, direction }
    })
  const setFamily = (family: PolynomialFamily) =>
    setState((s) => {
      const bezier = resolveBezier(family, s.direction)
      return bezier ? { ...s, family, ...bezier } : { ...s, family }
    })
  const setBezier = (b: { x1: number; y1: number; x2: number; y2: number }) =>
    setState((s) => ({ ...s, ...b, family: null }))

  return (
    <section
      data-slot="easing-playground"
      data-replay-key={state.replayKey}
      className={cn(
        "glass-card rounded-2xl p-6 md:p-8 border border-white/10",
        "bg-[linear-gradient(135deg,oklch(0.18_0.04_290),oklch(0.14_0.03_270))]",
      )}
    >
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
            / component · playground
          </div>
          <h3 className="mt-1 text-xl font-bold tracking-tight">
            Easing Picker
          </h3>
        </div>
        <div
          data-slot="easing-playground-value"
          className="text-xs font-mono text-muted-foreground"
        >
          {easing}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr] items-stretch">
        <div
          data-slot="easing-playground-left"
          className="flex flex-col gap-4"
        >
          <div>
            <div className={sectionLabelClass}>Basis</div>
            <div className="flex gap-1.5">
              {BASES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBasis(b)}
                  className={pillClass(state.basis === b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {state.basis === "bezier" && (
            <>
              <div>
                <div className={sectionLabelClass}>Direction</div>
                <div className="flex gap-1.5">
                  {DIRECTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDirection(d)}
                      className={pillClass(state.direction === d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className={sectionLabelClass}>Presets</div>
                <div className="flex flex-wrap gap-1.5">
                  {FAMILIES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFamily(f)}
                      className={pillClass(state.family === f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className={sectionLabelClass}>Curve</div>
                <div className="aspect-square max-w-60">
                  <BezierCanvas
                    value={{
                      x1: state.x1,
                      y1: state.y1,
                      x2: state.x2,
                      y2: state.y2,
                    }}
                    onChange={setBezier}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div data-slot="easing-playground-right">{/* filled in Task 5 */}</div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify family-pill test passes**

Run: `pnpm test tests/easing-playground.test.tsx -t "clicking a family pill"`

Expected: PASS.

- [ ] **Step 5: Run typecheck and existing test**

Run in parallel:
- `pnpm typecheck`
- `pnpm test tests/easing-playground.test.tsx`

Expected: typecheck clean, all playground tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/examples/easing-picker/playground.tsx tests/easing-playground.test.tsx
git commit -m "Wire EasingPlayground left column: basis, direction, family pills, canvas"
```

---

## Task 4: Spring + steps branches in left column

When `basis === "spring"` or `"steps"`, the family/direction/presets/canvas section is replaced with `<SpringControls />` or `<StepsControls />`.

**Files:**
- Modify: `src/examples/easing-picker/playground.tsx`
- Modify: `tests/easing-playground.test.tsx`

- [ ] **Step 1: Write the failing test for basis switch**

In `tests/easing-playground.test.tsx`, append inside `describe("EasingPlayground")`:

```tsx
  test("switching basis to spring renders SpringControls and emits linear(...)", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    const springTab = await findByRole("button", { name: /^spring$/i })
    springTab.click()
    // Sliders for stiffness / damping / mass appear
    const sliders = container.querySelectorAll('[role="slider"]')
    expect(sliders.length).toBeGreaterThanOrEqual(3)
    // Easing string updates to linear(...)
    const value = container.querySelector(
      "[data-slot='easing-playground-value']",
    )?.textContent
    expect(value).toMatch(/^linear\(/)
  })

  test("switching basis to steps renders StepsControls and emits steps(...)", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    const stepsTab = await findByRole("button", { name: /^steps$/i })
    stepsTab.click()
    const value = container.querySelector(
      "[data-slot='easing-playground-value']",
    )?.textContent
    expect(value).toMatch(/^steps\(/)
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/easing-playground.test.tsx -t "switching basis"`

Expected: 2 FAIL. Spring/Steps controls not rendered.

- [ ] **Step 3: Add spring + steps branches**

In `src/examples/easing-picker/playground.tsx`:

a) Extend the imports at the top:

```tsx
import {
  BezierCanvas,
  type EasingString,
  formatEasing,
  PRESETS,
  type PreviewProperty,
  SpringControls,
  StepsControls,
} from "@/components/ui/easing-picker"
```

b) Inside `EasingPlayground`'s left column, find the existing block:

```tsx
          {state.basis === "bezier" && (
            <>
              {/* Direction, Presets, Curve sections from Task 3 */}
            </>
          )}
```

(In Task 3 you wrote the full bezier block with Direction + Presets + Curve sections inside that fragment. Do NOT modify it here.)

Immediately AFTER that closing `)}` of the bezier fragment and BEFORE the closing `</div>` of `<div data-slot="easing-playground-left">`, append these two new branches:

```tsx
          {state.basis === "spring" && (
            <div>
              <div className={sectionLabelClass}>Spring</div>
              <SpringControls
                value={{
                  stiffness: state.stiffness,
                  damping: state.damping,
                  mass: state.mass,
                }}
                onChange={(v) => setState((s) => ({ ...s, ...v }))}
              />
            </div>
          )}

          {state.basis === "steps" && (
            <div>
              <div className={sectionLabelClass}>Steps</div>
              <StepsControls
                value={{ n: state.n, position: state.position }}
                onChange={(v) => setState((s) => ({ ...s, ...v }))}
              />
            </div>
          )}
```

`SpringControls`'s `onChange` emits the same `{stiffness, damping, mass}` shape — spread directly into state. `StepsControls`'s value uses `n` (not `steps`) and `position` of type `StepPosition` — the spread updates both at once.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/easing-playground.test.tsx`

Expected: all playground tests pass (smoke + family-pill + spring + steps = 4).

- [ ] **Step 5: Run typecheck**

Run: `pnpm typecheck`

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/examples/easing-picker/playground.tsx tests/easing-playground.test.tsx
git commit -m "Wire spring and steps branches in EasingPlayground left column"
```

---

## Task 5: Right column — animated preview + property toggles

`<EasingPreview />` mounted on the right with linear comparison ghost on, and a row of 10 property toggle pills.

**Files:**
- Modify: `src/examples/easing-picker/playground.tsx`
- Modify: `tests/easing-playground.test.tsx`

- [ ] **Step 1: Write the failing test for property toggle**

In `tests/easing-playground.test.tsx`, append:

```tsx
  test("clicking a property toggle updates the EasingPreview keyframe name", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    // EasingPreview renders `animation: easing-preview-<property> ...` on the target's inline style.
    const initialAnim = (
      container.querySelector("[data-preview-target]") as HTMLElement
    ).style.animation
    expect(initialAnim).toContain("easing-preview-moveX")
    // Click scale toggle (exact name to avoid matching scaleX/scaleY pills)
    const scalePill = await findByRole("button", { name: /^scale$/i })
    scalePill.click()
    const after = (
      container.querySelector("[data-preview-target]") as HTMLElement
    ).style.animation
    expect(after).toContain("easing-preview-scale")
    expect(after).not.toContain("easing-preview-moveX")
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/easing-playground.test.tsx -t "property toggle"`

Expected: FAIL — `[data-preview-target]` not found (right column is still empty).

- [ ] **Step 3: Implement right column with preview + property toggles**

In `src/examples/easing-picker/playground.tsx`:

a) Extend imports:

```tsx
import {
  BezierCanvas,
  type EasingString,
  EasingPreview,
  formatEasing,
  PRESETS,
  type PreviewProperty,
  SpringControls,
  StepsControls,
} from "@/components/ui/easing-picker"
```

b) Add a `PROPERTIES` constant near the other `const`s at the top:

```tsx
const PROPERTIES: ReadonlyArray<PreviewProperty> = [
  "moveX",
  "moveY",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
  "opacity",
  "width",
  "color",
  "blur",
]
```

c) Add a setter near other setters in `EasingPlayground`:

```tsx
  const setProperty = (property: PreviewProperty) =>
    setState((s) => ({ ...s, property }))
```

d) Fill in the right column. Replace the placeholder `<div data-slot="easing-playground-right">{/* filled in Task 5 */}</div>` with:

```tsx
        <div
          data-slot="easing-playground-right"
          className="flex flex-col gap-4 min-w-0"
        >
          <div className="flex-1 rounded-lg border border-white/10 bg-background/40 p-4">
            <div className={sectionLabelClass}>
              Preview · {state.property} (linear ghost shown)
            </div>
            <EasingPreview
              key={state.replayKey}
              easing={easing}
              property={state.property}
              duration={state.duration}
              loop={state.loop}
              showLinearComparison
            />
          </div>

          <div>
            <div className={sectionLabelClass}>Property</div>
            <div className="flex flex-wrap gap-1.5">
              {PROPERTIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProperty(p)}
                  className={pillClass(state.property === p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
```

- [ ] **Step 4: Run tests to verify**

Run: `pnpm test tests/easing-playground.test.tsx`

Expected: all 5 playground tests pass.

- [ ] **Step 5: Run typecheck**

Run: `pnpm typecheck`

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/examples/easing-picker/playground.tsx tests/easing-playground.test.tsx
git commit -m "Wire EasingPlayground right column: preview + property toggles"
```

---

## Task 6: Duration slider, replay button, loop toggle

**Files:**
- Modify: `src/examples/easing-picker/playground.tsx`
- Modify: `tests/easing-playground.test.tsx`

- [ ] **Step 1: Write the failing test for replay button**

In `tests/easing-playground.test.tsx`, append:

```tsx
  test("restart button bumps the playground's replay key", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    const section = container.querySelector("[data-slot='easing-playground']")
    const initialKey = section?.getAttribute("data-replay-key")
    const restartBtn = await findByRole("button", {
      name: /restart playground/i,
    })
    restartBtn.click()
    const newKey = container
      .querySelector("[data-slot='easing-playground']")
      ?.getAttribute("data-replay-key")
    expect(newKey).not.toBe(initialKey)
  })

  test("loop checkbox toggles loop on EasingPreview", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    const loopBox = (await findByRole("checkbox", {
      name: /loop/i,
    })) as HTMLInputElement
    expect(loopBox.checked).toBe(true) // default on
    loopBox.click()
    expect(loopBox.checked).toBe(false)
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/easing-playground.test.tsx -t "restart|loop"`

Expected: 2 FAIL.

- [ ] **Step 3: Add controls row to right column**

In `src/examples/easing-picker/playground.tsx`, add helpers near the other setters in `EasingPlayground`:

```tsx
  const bumpReplay = () =>
    setState((s) => ({ ...s, replayKey: s.replayKey + 1 }))
  const toggleLoop = () => setState((s) => ({ ...s, loop: !s.loop }))
  const setDuration = (duration: number) =>
    setState((s) => ({ ...s, duration }))
```

Then insert a controls row INSIDE the right column, AFTER the property pill row and BEFORE the right-column closing `</div>`:

```tsx
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={bumpReplay}
              aria-label="Restart playground animation"
              className={cn(
                "rounded-md border border-white/10 px-3 py-1 text-xs font-mono",
                "bg-white/5 hover:bg-white/10",
              )}
            >
              ▶ Restart
            </button>
            <label className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <input
                type="checkbox"
                checked={state.loop}
                onChange={toggleLoop}
                aria-label="loop"
              />
              loop
            </label>
            <div className="flex flex-1 items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
                duration
              </span>
              <input
                type="range"
                min={100}
                max={2000}
                step={50}
                value={state.duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                aria-label="duration"
                className="flex-1 accent-violet-500"
              />
              <span className="text-[10px] font-mono text-foreground w-12 text-right">
                {state.duration}ms
              </span>
            </div>
          </div>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/easing-playground.test.tsx`

Expected: all 7 playground tests pass.

- [ ] **Step 5: Run typecheck**

Run: `pnpm typecheck`

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/examples/easing-picker/playground.tsx tests/easing-playground.test.tsx
git commit -m "Add replay + loop + duration controls to EasingPlayground"
```

---

## Task 7: Code output block with format tabs + copy

Render a 3-format tab row (`CSS` / `Tailwind v3` / `Tailwind v4`), a code box showing the format-adapted string, and a copy button.

**Files:**
- Modify: `src/examples/easing-picker/playground.tsx`
- Modify: `tests/easing-playground.test.tsx`

- [ ] **Step 1: Write the failing test for format tabs**

In `tests/easing-playground.test.tsx`, append:

```tsx
  test("switching format tab changes the displayed code snippet", async () => {
    const { container, findByRole } = render(<EasingPlayground />)
    const codeBlock = () =>
      container.querySelector("[data-slot='easing-playground-code']")
        ?.textContent ?? ""
    // Default CSS
    expect(codeBlock()).toMatch(/cubic-bezier/)
    expect(codeBlock()).not.toMatch(/ease-\[/)
    // Switch to Tailwind v3
    const tw3 = await findByRole("button", { name: /tailwind v3/i })
    tw3.click()
    expect(codeBlock()).toMatch(/ease-\[/)
    // Switch to Tailwind v4
    const tw4 = await findByRole("button", { name: /tailwind v4/i })
    tw4.click()
    expect(codeBlock()).toMatch(/@theme/)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/easing-playground.test.tsx -t "format tab"`

Expected: FAIL — `easing-playground-code` not in DOM.

- [ ] **Step 3: Implement format adapter + output block**

In `src/examples/easing-picker/playground.tsx`:

a) Add a format adapter near the top of the file (outside the component):

```tsx
const FORMATS: ReadonlyArray<OutputFormat> = [
  "css",
  "tailwind-v3",
  "tailwind-v4",
]

function formatSnippet(easing: string, format: OutputFormat): string {
  switch (format) {
    case "css":
      return easing
    case "tailwind-v3":
      return `class="ease-[${easing.replace(/\s+/g, "_")}]"`
    case "tailwind-v4":
      return `@theme {\n  --ease-custom: ${easing};\n}\n/* usage: class="ease-custom" */`
  }
}
```

b) Add setters near the other setters inside `EasingPlayground`:

```tsx
  const setFormat = (format: OutputFormat) =>
    setState((s) => ({ ...s, format }))
```

c) Append the output block at the end of the right column (after the duration/replay/loop row), still inside `<div data-slot="easing-playground-right">`:

```tsx
          <div className="rounded-lg border border-white/10 bg-background/60 p-3 mt-2 space-y-2">
            <div className="flex items-center gap-1">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={cn(
                    "rounded px-2 py-1 text-[10px] font-mono uppercase tracking-[0.05em] border",
                    state.format === f
                      ? "bg-violet-500/20 border-violet-400/40 text-violet-200"
                      : "border-transparent text-muted-foreground hover:bg-white/5",
                  )}
                >
                  {f === "tailwind-v3"
                    ? "Tailwind v3"
                    : f === "tailwind-v4"
                      ? "Tailwind v4"
                      : "CSS"}
                </button>
              ))}
              <CopyButton
                text={formatSnippet(easing, state.format)}
                className="ml-auto"
              />
            </div>
            <pre
              data-slot="easing-playground-code"
              className="text-xs font-mono text-foreground/90 whitespace-pre-wrap break-all"
            >
              {formatSnippet(easing, state.format)}
            </pre>
          </div>
```

d) Add a `CopyButton` helper just above the `export function EasingPlayground()` line:

```tsx
function CopyButton({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          /* clipboard blocked — ignore */
        }
      }}
      className={cn(
        "rounded px-2 py-1 text-[10px] font-mono uppercase tracking-[0.05em] border border-white/10 bg-white/5 hover:bg-white/10",
        className,
      )}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/easing-playground.test.tsx`

Expected: all 8 playground tests pass.

- [ ] **Step 5: Run typecheck**

Run: `pnpm typecheck`

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/examples/easing-picker/playground.tsx tests/easing-playground.test.tsx
git commit -m "Add code output block with format tabs and copy to EasingPlayground"
```

---

## Task 8: Wire into `src/app.tsx`

Import the new component, render it above the existing examples, add the `/ API surface` label, wrap the 6 examples in a 2-col grid.

**Files:**
- Modify: `src/app.tsx`

- [ ] **Step 1: Inspect the current section**

Open `src/app.tsx`. Locate the Easing Picker block (search for `title="Easing Picker"`). It looks like:

```tsx
<SectionHeader
  className="mt-32"
  eyebrow="component"
  title="Easing Picker"
  description="..."
/>
<div className="mt-12 space-y-10">
  <EasingBasicUsage />
  <EasingTypeLocked />
  <EasingOutputFormats />
  <EasingInlinePanel />
  <EasingSubBezier />
  <EasingSubSpring />
</div>
```

- [ ] **Step 2: Add the import**

Add this import near the other `EasingXxx` imports in `src/app.tsx`:

```tsx
import { EasingPlayground } from "./examples/easing-picker/playground"
```

Keep the import section sorted alphabetically — the existing biome config (already running on the file) will normalize it on the next save if not.

- [ ] **Step 3: Replace the existing examples wrapper**

Replace the `<div className="mt-12 space-y-10">...</div>` block (the one containing the 6 EasingXxx examples) with:

```tsx
<div className="mt-12 space-y-10">
  <EasingPlayground />
  <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
    <span className="text-gradient">/</span> API surface
  </div>
  <div className="grid gap-8 lg:grid-cols-2">
    <EasingBasicUsage />
    <EasingTypeLocked />
    <EasingOutputFormats />
    <EasingInlinePanel />
    <EasingSubBezier />
    <EasingSubSpring />
  </div>
</div>
```

Leave `<SectionHeader ... title="Easing Picker" .../>` unchanged.

- [ ] **Step 4: Run lint, typecheck, tests in parallel**

Run in a single bash batch (multiple Bash calls in one message):
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`

Expected:
- Lint: 8 pre-existing warnings (no new ones)
- Typecheck: clean
- Tests: all pass (276+ depending on prior task counts)

- [ ] **Step 5: Visual smoke test in browser**

Start dev server (preview_start with `ridiculous-dev`), open the page, scroll to the Easing Picker section, verify:
- Playground renders with section heading + emitted easing string in top-right
- Basis tabs switch (bezier ↔ spring ↔ steps)
- For bezier: Direction + Presets + Curve visible; clicking a family pill updates curve + code
- For spring: SpringControls renders three sliders; code updates to `linear(...)`
- Animated preview box moves with the current property; toggle to `scale` → it scales; toggle to `color` → background-color transitions
- Replay button restarts the animation
- Loop toggle stops/starts continuous play
- Duration slider 100–2000ms updates animation timing
- Format tabs swap the code box; Copy button copies (test clipboard manually)
- `/ API surface` label visible
- 6 small examples render in 2-col grid below

If anything is broken, fix inline and re-verify before committing.

- [ ] **Step 6: Commit**

```bash
git add src/app.tsx
git commit -m "Wire EasingPlayground into demo with API-surface grid for existing examples"
```

---

## Task 9: Final verification

**Files:** none modified

- [ ] **Step 1: Run lint, typecheck, full test suite, registry build in parallel**

Run all four in a single Bash batch:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm registry:build`

Expected:
- Lint: same 8 pre-existing warnings; no new
- Typecheck: clean
- Tests: all pass
- Registry build: `✔ Building registry` (verifies `public/r/easing-picker.json` regenerates with the extended `PreviewProperty`)

- [ ] **Step 2: Browser smoke test**

Reload preview (`window.location.reload()` via preview_eval), scroll through every section of the demo, confirm:
- Color Picker, Gradient Editor, Unit Input sections still render normally (unchanged)
- Easing Picker section shows playground at top, label, then 6 examples in 2-col grid
- No console errors via `preview_console_logs` level=error
- No console warnings beyond pre-existing baseline via `preview_console_logs` level=warn

If `preview_console_logs` shows new errors or warnings traceable to the playground, fix and re-verify.

- [ ] **Step 3: Confirm task list is complete**

`git log --oneline main..HEAD` should show roughly this sequence at the top:
- Final verification (if any fixes from steps 1-2 — optional)
- Wire EasingPlayground into demo with API-surface grid for existing examples
- Add code output block with format tabs and copy to EasingPlayground
- Add replay + loop + duration controls to EasingPlayground
- Wire EasingPlayground right column: preview + property toggles
- Wire spring and steps branches in EasingPlayground left column
- Wire EasingPlayground left column: basis, direction, family pills, canvas
- Scaffold EasingPlayground shell with state interface
- Extend PreviewProperty with scaleX, scaleY, color, blur
- Add EasingPicker demo redesign spec (committed during brainstorming)
- (rebase of the original 34 easing-picker commits below)

If any task was skipped, return to it.

- [ ] **Step 4: Stop preview server**

Use `preview_stop` to release port 5173.

---

## Notes

- **No `registry.json` edit required.** The registry-side change in Task 1 extends an existing file already listed in `registry.json` (the previous refactor commit). Running `pnpm registry:build` regenerates the bundled `easing-picker.json` automatically.
- **No `.gitignore` edit required.** The brainstorm session writes to `.superpowers/brainstorm/` which is already ignored.
- **TDD applies to playground tests.** Each playground task lands one test → fail → impl → pass → commit cycle. Registry-side changes (Task 1) follow the same TDD shape but with parametrized tests for the 4 new properties.
- **Worktree:** This plan executes on `claude/distracted-goldberg-cb6a06` (the rebased branch). No new worktree needed.
- **Replay key strategy:** EasingPreview's internal replay button still exists; we just provide an *external* replay that bumps a `key` prop forcing a remount. Internal button still works; if it confuses users we can hide it via a later prop (out of scope for this plan).
