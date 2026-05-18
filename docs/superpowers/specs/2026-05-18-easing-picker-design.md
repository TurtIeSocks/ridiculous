# EasingPicker — Design Spec

**Date:** 2026-05-18
**Status:** Draft for implementation
**Registry item:** `easing-picker` (third entry after `color-picker`, `gradient-editor`)
**Reference inspiration:** [easingwizard.com](https://easingwizard.com/) (clean-room implementation, not a port)

---

## 1. Overview

`EasingPicker` is a shadcn-installable component for editing CSS animation timing functions. It supports all CSS Easing Level 1+2 outputs (`cubic-bezier()`, `steps()`, named keywords) plus physics-based curves (spring, bounce, wiggle) baked to `linear()` multi-stop output. It ships a polynomial preset gallery and a built-in animation preview, and exposes its sub-components as named exports so consumers can compose their own motion-design UIs.

The "ridiculous" angle: same type-safe pattern as `color-picker` and `gradient-editor` — template-literal `EasingLiteral<S>` validator for compile-time range checking, suggestion strings for IntelliSense, and a `basis?` prop that narrows `onChange` to the specific output shape at the type level.

## 2. Scope decisions

Resolved during brainstorming (Q1–Q10):

| Decision | Resolution |
|----------|-----------|
| Supported easings | Bezier + named CSS keywords + `steps()` + Penner preset gallery + Spring/Bounce/Wiggle/Overshoot (Q2 → B, Q5 → B) |
| `linear()` user-editable multi-stop editor | **Out of scope.** `linear()` only used as emit format from baked physics curves. |
| Preset emit behavior | Always serialize to underlying `cubic-bezier(...)`; preset name is UI-only (Q3 → A) |
| Layout | Vertical stacked panel matching Easing Wizard (Q4 superseded by Q5) |
| Composition | `<EasingPicker />` (popover-wrapped) + `<EasingPanel />` (inline) — two top-level exports (Q6 → D) |
| Public sub-components | BezierCanvas, EasingPreview, PresetGallery, StepsControls, SpringControls, BounceControls, WiggleControls (Q7 → D) |
| Preview properties | 6: MoveX, MoveY, Scale, Rotate, Opacity, Width (Q8 → B) |
| Output formats | CSS / Tailwind v3 (arbitrary value) / Tailwind v4 (`@theme` variable) (Q9 → C) |
| Type-locked variants | `basis?: "bezier" | "spring" | "bounce" | "wiggle" | "steps"` narrows `onChange` (Q10 → A) |
| Control pattern | Controlled-only (required `value` + `onChange`) — matches `ColorPicker` precedent. A separate spawned task tightens `GradientEditor` to match. |
| Share-link URL encoding | **Out of scope** for v1. |

## 3. Architecture

### 3.1 File layout

```
src/components/ui/easing-picker/
  easing-picker.tsx       // all components + helpers, single file (~1500-1800 lines)
  easing-picker.types.ts  // Literal validators, suggestion strings, util types
  index.ts                // barrel exports
```

The >500-line single-file convention follows the precedent set by `gradient-editor.tsx` (1140 lines) and `color-picker.tsx` (1013 lines). If implementation crosses ~2000 lines we split sub-components into a sibling directory per CLAUDE.md guidance — deferred to implementation phase.

### 3.2 Registry entry

```json
{
  "name": "easing-picker",
  "type": "registry:ui",
  "title": "Easing Picker",
  "description": "Ridiculously typed CSS easing function picker with bezier canvas, spring/bounce/wiggle physics baked to linear(), polynomial preset gallery, and 6-property animation preview.",
  "registryDependencies": ["button", "popover"],
  "dependencies": [],
  "files": [
    { "path": "src/components/ui/easing-picker/index.ts", "type": "registry:ui", "target": "components/ui/easing-picker/index.ts" },
    { "path": "src/components/ui/easing-picker/easing-picker.tsx", "type": "registry:ui", "target": "components/ui/easing-picker/easing-picker.tsx" },
    { "path": "src/components/ui/easing-picker/easing-picker.types.ts", "type": "registry:ui", "target": "components/ui/easing-picker/easing-picker.types.ts" }
  ]
}
```

No cross-registry dependency on `color-picker` or `gradient-editor`; the easing surface is self-contained.

### 3.3 Component graph

```
EasingPicker (popover wrap)
  └─ trigger: <Button> with mini SVG curve thumbnail + easing name
  └─ <PopoverContent>
       └─ EasingPanel ──────────────────────────────┐
                                                    ↓
EasingPanel (inline, full wizard)
  ├─ BasisTabs (internal)         — bezier|spring|bounce|wiggle|steps
  ├─ PresetGallery (PUBLIC)       — shown when basis=bezier
  ├─ ActiveControls (one of)
  │    ├─ BezierCanvas (PUBLIC) + BezierInputs (internal)
  │    ├─ SpringControls (PUBLIC)
  │    ├─ BounceControls (PUBLIC)
  │    ├─ WiggleControls (PUBLIC)
  │    └─ StepsControls (PUBLIC)
  ├─ EasingPreview (PUBLIC)       — animation canvas + property selector + play controls
  └─ OutputPanel (internal)       — CSS / Tailwind v3 / Tailwind v4 toggle + copy
```

**Public named exports (9):** `EasingPicker`, `EasingPanel`, `BezierCanvas`, `PresetGallery`, `EasingPreview`, `StepsControls`, `SpringControls`, `BounceControls`, `WiggleControls`.

**Internal (not exported):** `BasisTabs`, `BezierInputs`, `OutputPanel`.

## 4. Type system

Mirrors `color-picker.types.ts` structure: primitives → strict validators → suggestion strings → utility types. EasingPicker duplicates the few primitives it needs (`Digit`, `Trim`, `AllChars`, `IsNumber0To1`, `IsSignedDecimal`, `KeepIf`, `And`, `Or`) rather than reaching into the color-picker file — keeps registry items independent.

### 4.1 Suggestion strings

```ts
export type EasingKeyword =
  | "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
  | "step-start" | "step-end"

export type CubicBezierString =
  | `cubic-bezier(${number}, ${number}, ${number}, ${number})`
  | `cubic-bezier(${number} ${number} ${number} ${number})`

export type StepPosition =
  | "start" | "end"
  | "jump-start" | "jump-end" | "jump-both" | "jump-none"

export type StepsString =
  | `steps(${number})`
  | `steps(${number}, ${StepPosition})`

export type LinearString = `linear(${string})`

export type EasingString =
  | EasingKeyword | CubicBezierString | StepsString | LinearString

export interface EasingStringMap {
  bezier: CubicBezierString
  spring: LinearString
  bounce: LinearString
  wiggle: LinearString
  steps:  StepsString
}

export type EasingBasis = keyof EasingStringMap
```

### 4.2 Strict literal validators

```ts
/** cubic-bezier(x1, y1, x2, y2) — x ∈ [0,1], y signed (overshoot allowed) */
export type CubicBezierLiteral<S extends string> =
  S extends `cubic-bezier(${infer X1}, ${infer Y1}, ${infer X2}, ${infer Y2})`
    ? KeepIf<
        And<
          IsNumber0To1<Trim<X1>>,
          And<
            IsSignedDecimal<Trim<Y1>>,
            And<IsNumber0To1<Trim<X2>>, IsSignedDecimal<Trim<Y2>>>
          >
        >,
        S
      >
    : S extends `cubic-bezier(${infer X1} ${infer Y1} ${infer X2} ${infer Y2})`
      ? KeepIf<
          And<
            IsNumber0To1<Trim<X1>>,
            And<
              IsSignedDecimal<Trim<Y1>>,
              And<IsNumber0To1<Trim<X2>>, IsSignedDecimal<Trim<Y2>>>
            >
          >,
          S
        >
      : never

/** steps(n) — n is a positive integer; optional 2nd arg constrained to StepPosition */
export type StepsLiteral<S extends string> =
  S extends `steps(${infer N}, ${infer P})`
    ? P extends StepPosition
      ? KeepIf<IsPositiveInt<Trim<N>>, S>
      : never
    : S extends `steps(${infer N})`
      ? KeepIf<IsPositiveInt<Trim<N>>, S>
      : never

export type EasingKeywordLiteral<S extends string> =
  S extends EasingKeyword ? S : never

/** linear() — weak validation: variadic stops not range-checked at type level. */
export type LinearLiteral<S extends string> =
  S extends `linear(${infer Body})`
    ? KeepIf<NonEmpty<Trim<Body>>, S> : never

export type EasingLiteral<S extends string> =
  | EasingKeywordLiteral<S>
  | CubicBezierLiteral<S>
  | StepsLiteral<S>
  | LinearLiteral<S>

/** Call-site validator helper, mirrors color()/gradient() */
export const easing = <S extends string>(
  value: S & EasingLiteral<S>,
): S => value
```

**Documented trade-off:** `LinearLiteral` is intentionally weak — true variadic stop validation (`linear(0, 0.5 50%, 1)` with optional `%`-positioned stops) at the type level would blow up compilation. Runtime parser does real validation; the type-level check is a shape-exists gate.

### 4.3 Utility types

```ts
export type FunctionOf<S extends string> =
  S extends `cubic-bezier(${string}` ? "bezier" :
  S extends `steps(${string}`        ? "steps" :
  S extends `linear(${string}`       ? "linear" :
  S extends "step-start" | "step-end" ? "steps" :
  S extends EasingKeyword            ? "bezier" :
  never

/** Note: BasisOfString<LinearString> is ambiguous — baked output erases physics type. */
export type BasisOfString<S extends string> =
  S extends LinearString ? "spring" | "bounce" | "wiggle" :
  S extends CubicBezierString | EasingKeyword ? "bezier" :
  S extends StepsString ? "steps" :
  never
```

### 4.4 Internal canonical state

```ts
export type EasingState =
  | { basis: "bezier"; x1: number; y1: number; x2: number; y2: number; extraTop: number; extraBottom: number }
  | { basis: "spring"; stiffness: number; damping: number; mass: number }
  | { basis: "bounce"; bounces: number; stiffness: number }
  | { basis: "wiggle"; wiggles: number; damping: number }
  | { basis: "steps";  n: number; position: StepPosition }
```

Exported so consumers with advanced use cases can construct or deserialize state directly.

### 4.5 Public type exports

10 types + 1 helper: `EasingKeyword`, `CubicBezierString`, `StepPosition`, `StepsString`, `LinearString`, `EasingString`, `EasingStringMap`, `EasingBasis`, `EasingState`, `EasingLiteral<S>`, `easing()`.

## 5. Component API

### 5.1 Top-level (popover + inline)

```ts
export interface EasingPickerProps<
  TBasis extends EasingBasis | undefined = undefined,
> {
  value: EasingString | (string & {})
  onChange: (
    value: TBasis extends EasingBasis ? EasingStringMap[TBasis] : EasingString,
  ) => void
  basis?: TBasis
  output?: "css" | "tailwind-v3" | "tailwind-v4"   // default snippet format in OutputPanel
  className?: string
  "aria-label"?: string
}

export interface EasingPanelProps<
  TBasis extends EasingBasis | undefined = undefined,
> extends EasingPickerProps<TBasis> {}
```

Both require `value` + `onChange` (controlled-only, matching ColorPicker). `EasingPicker` wraps in `<Popover>`; `EasingPanel` renders the wizard inline.

**Trigger appearance (EasingPicker only):** mini SVG curve thumbnail (~32×20px) rendered from current `value`, plus a label — `"easeOutQuart"` if the curve matches a known preset, otherwise the function type (`"cubic-bezier"`, `"spring"`, `"linear"`, `"steps"`).

### 5.2 Public sub-component props

All sub-components are controlled-only — `value` + `onChange` required, no internal state.

```ts
export interface BezierCanvasProps {
  value: { x1: number; y1: number; x2: number; y2: number }
  onChange: (v: { x1: number; y1: number; x2: number; y2: number }) => void
  extraTop?: number           // default 0.25 — Y range above 1
  extraBottom?: number        // default 0.25 — Y range below 0
  showLinearReference?: boolean
  className?: string
}

export type PolynomialFamily =
  | "Sine" | "Quad" | "Cubic" | "Quart" | "Quint" | "Expo" | "Circ" | "Back"
export type Direction = "In" | "Out" | "InOut" | "OutIn"
export type PresetName =
  | EasingKeyword
  | `ease${Direction}${PolynomialFamily}`
  | "anticipate" | "smoothStep"

export interface PresetGalleryProps {
  value?: PresetName
  onChange: (preset: PresetName, bezier: CubicBezierString) => void
  className?: string
}

export type PreviewProperty =
  | "moveX" | "moveY" | "scale" | "rotate" | "opacity" | "width"

export interface EasingPreviewProps {
  easing: EasingString
  property?: PreviewProperty         // default "moveX"
  duration?: number                  // ms, default 800
  loop?: boolean                     // default false
  showLinearComparison?: boolean     // default false
  className?: string
}

export interface StepsControlsProps {
  value: { n: number; position: StepPosition }
  onChange: (v: { n: number; position: StepPosition }) => void
  minSteps?: number   // default 1
  maxSteps?: number   // default 100
  className?: string
}

export interface SpringControlsProps {
  value: { stiffness: number; damping: number; mass: number }
  onChange: (v: { stiffness: number; damping: number; mass: number }) => void
  className?: string
}

export interface BounceControlsProps {
  value: { bounces: number; stiffness: number }
  onChange: (v: { bounces: number; stiffness: number }) => void
  className?: string
}

export interface WiggleControlsProps {
  value: { wiggles: number; damping: number }
  onChange: (v: { wiggles: number; damping: number }) => void
  className?: string
}
```

### 5.3 Data flow

```
parent owns value: EasingString
    ↓ (parse on mount + on external change)
EasingPanel internal state: EasingState (discriminated by basis)
    ↓ (user interaction: drag, slider, preset click, basis tab switch)
mutate state → serialize → onChange(EasingString)
    ↑ (lastEmittedRef sentinel prevents re-parsing our own emit)
```

The `lastEmittedRef` sentinel matches the ColorPicker pattern — prevents external-value re-sync after our own emit causes a parent re-render. Critical for stable handle positions when a basis is round-trip-lossy (spring → linear() → re-parse loses physics params).

### 5.4 Input/output asymmetry

The picker **parses** any `EasingString` (including `EasingKeyword` shorthand like `"ease"`), but **emits** the underlying `cubic-bezier(...)` literal for keyword-equivalent presets. Consequence: passing `value="ease"` works; the picker reflects the matching preset card; but the next `onChange` will fire with `"cubic-bezier(0.25, 0.1, 0.25, 1)"`. This is intentional (Q3 → A) — predictable, CSS-valid, no consumer-side keyword lookup required.

**Preset value-match detection is bidirectional:** whether the parent passes `value="ease"` (keyword form) OR `value="cubic-bezier(0.25, 0.1, 0.25, 1)"` (raw bezier matching a preset within tolerance 0.005), the picker resolves to the same internal state and highlights the same preset card. The trigger label uses this match — it reads `"easeOutQuart"` (or any matched preset name) regardless of whether `value` was passed as keyword or as raw bezier coords.

## 6. Physics baking

### 6.1 Spring → `linear()`

Classical damped harmonic oscillator:

```ts
function sampleSpring(
  stiffness: number,   // k, default 100, range 1..500
  damping: number,     // c, default 10, range 1..100
  mass: number,        // m, default 1, range 0.5..5
  samples: number,     // default 60
): Array<{ y: number; t: number }>
```

Underdamped (ζ<1) produces the bouncy spring; overdamped (ζ≥1) gives a smooth approach. Both branches handled. Sampling stops once curve settles within ε=0.001 of y=1 — keeps the output bounded.

### 6.2 Bounce → `linear()`

Parabolic-bounce model: N bounces with decreasing amplitude per restitution coefficient derived from `stiffness`. Each bounce contributes 2-3 stops at apex/contact (non-collinear, so survives prune).

```ts
function sampleBounce(
  bounces: number,    // default 3, range 1..6
  stiffness: number,  // default 0.5, controls energy retention per bounce
): Array<{ y: number; t: number }>
```

### 6.3 Wiggle → `linear()` (non-monotonic)

Sine-decay oscillation around y=1. Non-monotonic — crosses y=1 multiple times before settling. `linear()` handles this natively in all target browsers.

```ts
function sampleWiggle(
  wiggles: number,    // default 4, range 1..10
  damping: number,    // default 5, range 1..30
): Array<{ y: number; t: number }>
```

### 6.4 Post-prune pass

After sampling, collinear stops are dropped (within tolerance 0.005). Typical default-parameter spring outputs land at 25–40 stops after pruning; bounce at 15–25; wiggle at 30–50. Keeps the emitted CSS string compact.

### 6.5 Sample count exposure

Internal default 60 per basis, **not** exposed as prop in v1. Adding `samples?: number` to `SpringControlsProps` etc. is non-breaking if needed later.

### 6.6 Lossy round-trip

Baking is irreversible: parsing a `linear()` output back never recovers `{ stiffness, damping, mass }`. Documented limit. Matches Easing Wizard behavior.

## 7. Output formats (OutputPanel)

Three modes, switchable in the UI via segmented control:

**CSS:**
```css
cubic-bezier(0.42, 0, 0.58, 1)
```

**Tailwind v3 (arbitrary value):**
```html
class="ease-[cubic-bezier(0.42,0,0.58,1)]"
```
Spaces inside `cubic-bezier(...)` are stripped (Tailwind doesn't allow them in arbitrary values). For `linear()` outputs the value-percent space is preserved.

**Tailwind v4 (`@theme` variable):**
```css
@theme {
  --ease-custom: cubic-bezier(0.42, 0, 0.58, 1);
}
```
Variable name is editable via a small text input in OutputPanel for v4 mode (default `ease-custom`). Live-updates the preview as the user types.

**Copy button:** standard `navigator.clipboard.writeText`; brief visual confirmation (icon swap or label flicker, ~1.5s).

## 8. Preview

Pure CSS animation — no JS animation runtime. The emitted easing string is handed to CSS as `animation-timing-function`; the browser handles all four output types (`cubic-bezier`, `steps`, `linear`, keywords) natively.

```tsx
<div
  className="easing-preview-target"
  style={{
    animation: `easing-preview-${property} ${duration}ms ${loop ? "infinite" : "1"} ${easing}`,
    animationPlayState: playing ? "running" : "paused",
  }}
/>
```

**Property → keyframes mapping:**

| Property | Transform |
|----------|-----------|
| `moveX`   | `translateX(0)` → `translateX(200px)` |
| `moveY`   | `translateY(0)` → `translateY(100px)` |
| `scale`   | `scale(0.5)` → `scale(1.5)` |
| `rotate`  | `rotate(0)` → `rotate(360deg)` |
| `opacity` | `0` → `1` |
| `width`   | `width: 50px` → `width: 200px` |

**Play controls:** single play (default) with "Replay" button — clicking re-keys the element via React `key` increment so the CSS animation restarts cleanly. `loop` prop forces `animation-iteration-count: infinite`; UI shows a pause/play toggle.

**Show Linear Comparison:** renders a second ghost element at 35% opacity using `linear` timing for the same property + duration. Visual reference for "how non-linear is this curve?"

**Canvas size:** ~280×120 fixed. Keyframe values above are tuned to that size.

## 9. Preset gallery

Compile-time constant table, exported as `PRESETS` for advanced consumers:

```ts
export const PRESETS: ReadonlyArray<{
  name: PresetName
  bezier: readonly [number, number, number, number]
  family?: PolynomialFamily
  direction?: Direction
}> = [
  // CSS keywords (5)
  { name: "linear",      bezier: [0, 0, 1, 1] },
  { name: "ease",        bezier: [0.25, 0.1, 0.25, 1] },
  { name: "ease-in",     bezier: [0.42, 0, 1, 1] },
  { name: "ease-out",    bezier: [0, 0, 0.58, 1] },
  { name: "ease-in-out", bezier: [0.42, 0, 0.58, 1] },

  // Polynomial × direction (8 families × 4 directions = 32)
  // Sine, Quad, Cubic, Quart, Quint, Expo, Circ, Back
  // In, Out, InOut, OutIn — using easings.net Penner-equivalent coefficients
  { name: "easeInSine",   bezier: [0.12, 0, 0.39, 0],     family: "Sine",  direction: "In" },
  { name: "easeOutSine",  bezier: [0.61, 1, 0.88, 1],     family: "Sine",  direction: "Out" },
  // ... full set, 32 entries

  // Special (2)
  { name: "anticipate",  bezier: [0.45, -0.5, 0.55, 1] },
  { name: "smoothStep",  bezier: [0.45, 0, 0.55, 1] },
] as const
```

Total ~39 cards. Coefficients sourced from the Easing Functions Cheat Sheet (easings.net) — well-known Penner approximations.

**Thumbnail rendering:** each card is a ~48×32 SVG drawn directly from the bezier coords:
```
M 0 32 C ${x1*48} ${(1-y1)*32}, ${x2*48} ${(1-y2)*32}, 48 0
```

**Value-match detection:** when parent's `value` matches a preset within Euclidean coord tolerance 0.005, the matching card is highlighted. Same detection drives the popover trigger's name label.

**Grouping (UI):** three rows — CSS keywords, polynomial grid (8 cols × 4 rows), special row. No filtering/search in v1.

## 10. Testing

### 10.1 Files

```
tests/
  easing-parse.test.ts       // parser: EasingString → EasingState
  easing-format.test.ts      // serializer: EasingState → EasingString
  easing-baking.test.ts      // physics samplers + prune pass
  easing-presets.test.ts     // preset table integrity
  easing-picker.test.tsx     // component-level (popover, panel, basis switching)
  easing-types.test-d.ts     // type-level: literals, type-locked onChange
```

### 10.2 Coverage

| File | Cases |
|------|-------|
| `easing-parse.test.ts` | All 7 CSS keywords; cubic-bezier (comma + space forms); `steps(n, position)` and `steps(n)` default; overshoot beziers (y>1, y<0); garbage returns null |
| `easing-format.test.ts` | Bezier → comma form; steps with default position omits second arg; explicit position emits both; float precision 4 decimals trailing zeros stripped |
| `easing-baking.test.ts` | Spring monotonic (overdamped) + non-monotonic (underdamped) ending within ε of 1; bounce produces N local minima; wiggle crosses y=1 multiple times; prune keeps output stop count reasonable (20–50 typical); output re-parses as valid `linear()` |
| `easing-presets.test.ts` | Each tuple is (x,y,x,y), x ∈ [0,1]; no duplicates; CSS keyword entries match CSS Easing L1 spec; `bezierFromPreset(name)` returns table entry verbatim |
| `easing-picker.test.tsx` | Trigger renders matched preset name; popover renders active basis controls; preset card click emits underlying bezier; basis tab switch updates controls; `EasingPreview` replay re-keys element; OutputPanel cycles formats; copy writes expected string to mocked clipboard |
| `easing-types.test-d.ts` | `easing(...)` happy path + fail cases (`x1>1`, garbage); `<EasingPicker basis="bezier">` narrows onChange to `CubicBezierString`; `basis="spring"` narrows to `LinearString`; no basis keeps full union; `FunctionOf<...>` resolves correctly |

### 10.3 Targets

Match existing components: 100% on parser/format/types (pure functions, deterministic). Component tests cover happy paths + key user interactions — not exhaustive matrices. jsdom + canvas mock from `tests/setup.ts` is sufficient; no vitest browser provider needed (SVG only, no Canvas2D rendering).

### 10.4 Examples + docs

```
src/examples/easing-picker/
  basic-usage.tsx              // simple value+onChange
  type-locked.tsx              // basis="bezier" | "spring" | "steps"
  output-formats.tsx           // CSS / Tailwind v3 / Tailwind v4 toggle
  inline-panel.tsx             // EasingPanel embedded in a custom layout
  sub-component-bezier.tsx     // BezierCanvas standalone
  sub-component-spring.tsx     // SpringControls + EasingPreview wired manually
```

Plus `docs/easing-picker/api-reference.md` mirroring `docs/gradient-editor/api-reference.md`.

## 11. Out of scope (v1 non-goals)

- `linear()` multi-stop **editor** — only used as emit format from baked physics.
- Share-link URL state encoding (Easing Wizard's "Copy Share Link").
- RotateX / RotateY 3D preview properties.
- Shape morph preview.
- Custom preset registration (`customPresets` prop).
- Custom property registration in `EasingPreview` (render-prop / extension API).
- Round-trip from `linear()` back to physics params — documented lossy.
- CSS keyword emit (`"ease"`, etc.) — presets always emit underlying `cubic-bezier(...)` per Q3 → A.
- `prefers-reduced-motion` opt-out in EasingPreview (consumers wrap externally if needed).
- Sample-count prop on physics controls (internal default 60; non-breaking to add later).

## 12. Effort estimate

~10–12 days based on the Q5 → B scope. Breakdown sketch:

| Area | Days |
|------|------|
| Types + Literal validators + parser + format | 2 |
| BezierCanvas + BezierInputs + preset gallery | 2 |
| Spring + Bounce + Wiggle samplers + prune | 2 |
| StepsControls | 0.5 |
| EasingPreview (6 properties, replay, linear-comparison) | 1.5 |
| OutputPanel (3 formats, variable-name input, copy) | 1 |
| EasingPicker popover trigger + EasingPanel composed | 1 |
| Tests + examples + docs + registry wiring | 2 |

## 13. Related follow-ups

- **GradientEditor uniformity** — separate task: tighten `GradientEditor` to controlled-only API (currently uses hybrid uncontrolled fallback). Out of scope for this spec, spawned as a side task during brainstorming.
- **`linear()` multi-stop editor (v2)** — if user demand emerges for direct linear() editing (closer to gradient-editor in scope).
- **Share-link encoding (v2)** — URL state-machine for sharing curve configurations.
