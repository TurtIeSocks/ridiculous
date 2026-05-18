# Design — `gradient-editor` (v1, second `ridiculous` component)

**Date:** 2026-05-17
**Author:** Rin (@TurtIeSocks) + Claude
**Status:** Draft pending user review

## Goal

Ship the second component for the `ridiculous` shadcn registry: a visual editor for CSS gradients (`linear-gradient`, `radial-gradient`, `conic-gradient`) that demonstrates the registry's composability story. Each color stop reuses the existing `ColorLiteral<S>` validator from the color-picker registry item, so the brand pitch becomes *"every color stop is type-validated; the gradient string is assembled at runtime from validated pieces."*

The component name is `<GradientEditor>` (not `Picker`) because users compose a gradient out of many parts rather than picking a single value.

## Non-goals (v1)

- **Full type-level gradient validator (`GradientLiteral<S>`).** Recursive template-literal parsing of gradient syntax with balanced-paren handling and per-stop color validation is feasible but tanks TypeScript compile times on real-world files. Punted to a research-grade follow-up. v1 ships **tier 1 typing**: suggestion strings for IntelliSense + per-stop `ColorLiteral<S>` validation via runtime composition.
- **CSS Color 5 syntax** — `color-mix(...)`, relative color syntax, etc.
- **Color stop transition hints** (the `<percentage>` between two stops controlling midpoint). Less than 1% of gradients use this; cuts interaction model complexity.
- **`<image>` gradients on `mask-image`** — same syntax but a separate use case; demo only sells `background` use.
- **Saving/exporting as image** (PNG export). Out of scope.
- **Multi-gradient layering** (multiple gradients in one `background`). User can compose by hand; the editor handles one gradient at a time.
- **Read-only mode prop.** Trivial to add later if requested.

## Design philosophy

### Tier 1: composition over recursive validation

The color-picker registry item shipped three usage tiers — casual (`string`), IntelliSense (`ColorString`), strict (`color()` helper + `ColorLiteral<S>`). The gradient editor's tier story is structurally different:

- The gradient **string** itself is wide (no `GradientLiteral<S>` validator).
- The gradient's **color stops**, however, individually reuse `ColorLiteral<S>` when the user writes literal stops.

So the brand pitch becomes:

```ts
const grad = `linear-gradient(45deg, ${color("#ff0000")} 0%, ${color("#0000ff")} 100%)`
```

Each `color("...")` validates its literal at compile time. The template-literal interpolation concatenates them at runtime. The gradient string is composed of ridiculous-typed parts.

This sidesteps the TypeScript recursion-depth + compile-time-cost issues of validating the entire gradient grammar, while still landing a meaningful type-system flex.

### Same hybrid state pattern as color-picker

The color-picker shipped with an internal-oklch + lastEmittedRef pattern (see `2026-05-17-ridiculous-registry-color-picker-design.md` for context). The gradient editor uses the same pattern. Rationale:

- Stops, angle, position, and interpolation are 8+ state values that must persist coherently across re-renders.
- Re-parsing `value` on every render would drop sub-percent precision on positions and angles (round-trip drift).
- Mirror the proven solution: internal state is source of truth; sync from `value` only when prop changes from outside (tracked via `lastEmittedRef`).

### Single polymorphic component with `type` discriminant

Mirrors the color-picker's `mode` prop. One `<GradientEditor>` component, one trigger, one popover. Three gradient types switched via internal tabs (or locked via prop). `onChange`'s return type is discriminated by the `type` prop:

- `type` unset → switcher visible → `onChange` emits `GradientString` (union of all three)
- `type` set → switcher hidden → `onChange` emits `GradientStringMap[TType]`

### Interpolation defaults to `in oklch` (opinionated, configurable)

CSS Color 4 lets gradients specify the color space they interpolate through:

```css
linear-gradient(in oklch, red, blue)
```

CSS default (when omitted) is `in srgb`, which produces muddy gray midpoints for cross-hue gradients. `in oklch` stays perceptually vivid through the transition. The brand bias is toward `oklch` defaults everywhere in this registry, so the editor:

- Defaults to `in oklch` for fresh state (when initial `value` doesn't specify a space).
- Parses whatever space the input string declares (or `srgb` if none).
- Exposes the space as a dropdown so users can override.

### Multi-file barrel pattern + cross-registry dependency

Same file structure as color-picker. Crucially, the registry entry lists **`color-picker` as a `registryDependency`**, so consumers running `npx shadcn add gradient-editor` cascade-install the color-picker too (via cross-registry URL reference). If shadcn 4 doesn't support cross-registry URLs in `registryDependencies` as a first-class feature, fallback: document the requirement in the install instructions and let users `add color-picker` first.

## Project layout

```
ridiculous/
├── ... existing files ...
├── registry.json                              ← UPDATE: add gradient-editor item
├── src/
│   ├── components/ui/
│   │   ├── color-picker/                      ← existing, unchanged
│   │   └── gradient-editor/                   ← NEW
│   │       ├── index.ts                       ← barrel
│   │       ├── gradient-editor.tsx            ← component + sub-components + parse/format
│   │       └── gradient-editor.types.ts       ← suggestion strings + utility types
│   ├── examples/
│   │   ├── color-picker/                      ← existing, unchanged
│   │   └── gradient-editor/                   ← NEW
│   │       ├── basic-usage.tsx
│   │       ├── type-locked.tsx
│   │       ├── stops-control.tsx
│   │       ├── interpolation.tsx
│   │       └── api-reference.tsx
│   └── app.tsx                                ← UPDATE: add Gradient Editor section + Composition section
└── tests/
    ├── color-*.test.ts*                        ← existing, unchanged
    ├── gradient-parse.test.ts                 ← NEW
    ├── gradient-format.test.ts                ← NEW
    ├── gradient-editor.test.tsx               ← NEW
    └── gradient-types.test-d.ts               ← NEW
```

## Type system (`gradient-editor.types.ts`)

Four named blocks, mirrors color-picker's structural pattern (but no strict-validator block — tier 1):

### 1. Suggestion strings (exported, non-generic)

```ts
export type LinearGradientString =
  | `linear-gradient(${string})`
  | `linear-gradient(in ${string}, ${string})`

export type RadialGradientString =
  | `radial-gradient(${string})`
  | `radial-gradient(in ${string}, ${string})`

export type ConicGradientString =
  | `conic-gradient(${string})`
  | `conic-gradient(in ${string}, ${string})`

export type GradientString =
  | LinearGradientString
  | RadialGradientString
  | ConicGradientString

export interface GradientStringMap {
  linear: LinearGradientString
  radial: RadialGradientString
  conic: ConicGradientString
}

export type GradientType = keyof GradientStringMap
```

### 2. Interpolation

```ts
export type InterpolationSpace = "srgb" | "oklch" | "oklab" | "hsl" | "hwb"
export type InterpolationHueMethod = "shorter" | "longer"

/** Polar spaces support hue interpolation method. Cartesian (srgb, oklab) don't. */
export type PolarSpace = Extract<InterpolationSpace, "oklch" | "hsl" | "hwb">
```

### 3. Utility types

```ts
/**
 * Extract gradient type from a literal.
 * GradientTypeOf<"linear-gradient(red, blue)"> = "linear"
 */
export type GradientTypeOf<S extends string> =
  S extends `linear-gradient(${string}` ? "linear"
    : S extends `radial-gradient(${string}` ? "radial"
    : S extends `conic-gradient(${string}` ? "conic"
    : never

/**
 * Extract interpolation space from a literal, if declared.
 * InterpolationOf<"linear-gradient(in oklch, red, blue)"> = "oklch"
 * InterpolationOf<"linear-gradient(in oklch longer hue, red, blue)"> = "oklch"
 */
export type InterpolationOf<S extends string> =
  S extends `${string}-gradient(in ${infer Space}, ${string}`
    ? Space extends `${infer Pure} longer hue` | `${infer Pure} shorter hue`
      ? Pure
      : Space
    : never
```

### 4. Internal stop representation (exported)

```ts
import type { ColorString } from "@/components/ui/color-picker"

/**
 * A single color stop in the editor's internal representation.
 * Reuses ColorString from the color-picker registry item.
 */
export interface GradientStop {
  /** Color in any of the 6 supported color modes. */
  color: ColorString
  /** Position 0..100. */
  position: number
}
```

### Helpers (in `gradient-editor.tsx`, not types file)

```ts
/**
 * Runtime type guard. Parallel to isColorString from color-picker.
 * Narrows wide string to GradientString suggestion union; narrows literal S to S & matching gradient template.
 */
export function isGradientString(value: string): value is GradientString
export function isGradientString<S extends string>(
  value: S,
): value is S & (LinearGradientString | RadialGradientString | ConicGradientString)
```

### Naming-convention parity with color-picker

| color-picker | gradient-editor | Notes |
|---|---|---|
| `ColorString` | `GradientString` | |
| `ColorStringMap` | `GradientStringMap` | |
| `ColorMode` | `GradientType` | |
| `ColorLiteral<S>` | *(skipped — tier 1)* | Brand sells via composition |
| `ModeOf<S>` | `GradientTypeOf<S>` | |
| `WithAlpha<S, A>` | *(N/A — alpha is per-stop)* | |
| `color()` helper | *(skipped — tier 1)* | |
| `isColorString()` | `isGradientString()` | |

Gradient-specific additions: `InterpolationOf<S>`, `InterpolationSpace`, `InterpolationHueMethod`, `PolarSpace`, `GradientStop`.

## Component API (`gradient-editor.tsx`)

### Props

```ts
import type {
  GradientString,
  GradientStringMap,
  GradientType,
} from "./gradient-editor.types"

export interface GradientEditorProps<
  TType extends GradientType | undefined = undefined,
> {
  /** Current gradient. Accepts any string; IntelliSense suggests literal shapes. */
  value: GradientString | (string & {})

  /**
   * Lock gradient type. When set, in-popover type switcher is hidden.
   * When unset, switcher shows 3 tabs (linear / radial / conic).
   */
  type?: TType

  /**
   * Emits the next gradient.
   * - If `type` is set, value is typed as that type's string.
   * - If `type` is unset, value is typed as `GradientString` (union).
   */
  onChange: (
    value: TType extends GradientType ? GradientStringMap[TType] : GradientString,
  ) => void

  /**
   * Maximum number of stops the editor allows. Default 8.
   * Minimum (2) is always enforced — the editor refuses to delete below 2.
   */
  maxStops?: number

  /** Class applied to the trigger preview swatch. */
  className?: string

  /** Accessible label for the trigger. Default "Edit gradient". */
  "aria-label"?: string
}
```

### Behavior contract

| `type` prop | Switcher UI | `onChange` return type |
|---|---|---|
| `undefined` | visible — 3 tabs | `GradientString` |
| `"linear"` \| `"radial"` \| `"conic"` | hidden | `GradientStringMap[TType]` |

### Internal state

```ts
interface InternalState {
  type: GradientType
  stops: GradientStop[]                            // always 2..maxStops
  angle: number                                    // degrees, used by linear
  shape: "circle" | "ellipse"                      // radial
  size: "closest-side" | "farthest-corner" | "closest-corner" | "farthest-side"  // radial
  position: { x: number; y: number }               // %, 0..100, radial + conic
  fromAngle: number                                // degrees, conic
  interpolation: {
    space: InterpolationSpace
    hueMethod?: InterpolationHueMethod             // polar spaces only
  }
}
```

### State management (hybrid pattern, mirrors color-picker)

- `useState<InternalState>` lazy-initialized from `parseGradient(value)`.
- `useRef<string | null>` tracks `lastEmittedRef`.
- `useEffect` resyncs internal state from `value` only when `value !== lastEmittedRef.current`.
- All editor interactions call `emit(nextState)` which:
  1. `setInternal(nextState)`
  2. Serializes via `formatGradient(nextState)` → final CSS string
  3. Sets `lastEmittedRef.current = formatted`
  4. Calls `onChange(formatted as Parameters<typeof onChange>[0])`

### Parsing pipeline (`parseGradient`)

1. Match `^(linear|radial|conic)-gradient\(` prefix → determine `type`.
2. Strip outer parens.
3. **Balanced-paren split on top-level commas** — must handle commas inside `oklch(0.5 0.1 240 / 50%)` and `rgb(255, 0, 0)`-style stops without false-positive splits. Implementation: iterate chars, track paren depth, split only when depth === 0.
4. First segment: parse optional `in <space>[, <method> hue]?` clause + type-specific prelude:
   - **linear**: angle (`<number>deg` or side keyword like `to right`) or default `to bottom`
   - **radial**: optional `<shape> <size>? at <position>?`
   - **conic**: optional `from <angle>deg at <position>?`
5. Remaining segments: each is a stop `<color> [<position>%]?`. Parse color via `parseColor` imported from the color-picker module. Auto-distribute positions when absent: stop N → `(N / (count - 1)) * 100%`.
6. Return assembled `InternalState`, or `null` on first parse failure.

Unparseable input → render fallback `<span>` with raw value as `background-color`, no popover. Same pattern as color-picker.

### Emission pipeline (`formatGradient`)

Canonical-form output:

- **linear**: `linear-gradient(${inClause}${angle}deg, ${stops})`
- **radial**: `radial-gradient(${inClause}${shape} ${size} at ${x}% ${y}%, ${stops})`
- **conic**: `conic-gradient(${inClause}from ${fromAngle}deg at ${x}% ${y}%, ${stops})`

Where:
- `inClause` = `in ${space}` (+ ` ${hueMethod} hue` if polar + hueMethod set), followed by `, ` — but omitted entirely when space is `srgb` and no hue method, keeping output clean.
- Stops formatted as `${color} ${Math.round(position)}%` (integer percent, matches color-picker's byte-quantized convention).

### Sub-components (inline in `gradient-editor.tsx`, none exported)

| Component | Purpose | Shown when |
|---|---|---|
| `TypeSwitcher` | 3 tabs (linear/radial/conic) | `type` prop unset |
| `GradientPreview` | 296×80 preview pane | always |
| `StopTrack` | Draggable handle row overlaid on preview | always |
| `StopDetailRow` | `[ColorPicker] [PositionInput] [DeleteBtn]` for selected stop | always |
| `LinearControls` | `[AngleDial] [AngleInput]` | `type === "linear"` |
| `RadialControls` | `[ShapeSelect] [SizeSelect] [PositionPicker] [x/y inputs]` | `type === "radial"` |
| `ConicControls` | `[FromAngleDial] [FromAngleInput] [PositionPicker] [x/y inputs]` | `type === "conic"` |
| `PositionPicker` | Drag-a-dot box + numeric inputs | inside Radial/Conic controls |
| `InterpolationPicker` | `[SpaceSelect]` + conditional `[HueMethodSelect]` | always |

### Trigger swatch

Like color-picker — small button with the live gradient as `background`. Dimensions `h-5 w-12` (wider than color-picker's `h-5 w-5` to show a meaningful gradient sample).

## Popover layout

296px content width inside a 320px popover (`w-fit min-w-[320px] p-3`). Top-to-bottom:

```
┌──────────────────────────────────────┐
│ [ linear ] [ radial ] [ conic ]      │  ← type switcher (32px, when shown)
├──────────────────────────────────────┤
│ ╔══════════════════════════════════╗ │
│ ║      gradient preview (80px)     ║ │  ← preview + track overlay
│ ║  ◆────◆──────────────◆          ║ │
│ ╚══════════════════════════════════╝ │
├──────────────────────────────────────┤
│ [ □ ] [ 50%  ] [ × ]                 │  ← stop detail row (32px)
├──────────────────────────────────────┤
│ ─── type-specific controls ───       │  ← 40px (linear) or 120px (radial/conic)
├──────────────────────────────────────┤
│ [ space: oklch ▼ ] [ hue: shorter ▼ ]│  ← interpolation (32px)
└──────────────────────────────────────┘
```

### Preview + stop track (overlay pattern)

- Preview pane: 296×80 px, `background = formatGradient({ ...internal, type: "linear", angle: 90 })` — **always rendered as horizontal linear during editing**, regardless of the real `type`, because stop positions are 1D and need a 1D track to manipulate.
- Trigger swatch (outside popover) shows the real type, so users still see the radial/conic preview at rest.
- Stop handles overlaid as `<button>` absolute-positioned `left: ${position}%`, vertical-center on a thin track at the pane's bottom edge.
- Handle visual: small diamond with white border, fill = stop color.
- Selected handle: ring outline + `z-index` bump.

### Track interactions

| Action | Result |
|---|---|
| Click handle | Selects the stop; opens detail row below |
| Drag handle | Repositions (clamped 0..100; auto-sort by position on drag end) |
| Click empty area on track | Adds new stop at clicked position; color = interpolated value between adjacent stops |
| Delete key (track focused, handle selected) | Removes selected stop (no-op at min 2) |
| `+` key | Adds stop at midpoint of selected + right neighbor |
| Arrow Left/Right | Nudges selected stop ±1% (±5% with Shift) |
| Tab | Cycles between handles |

### Stop detail row (32px)

```
[ColorPicker 20×20] [PositionInput 60px wide, % suffix] [DeleteBtn 24×24]
```

- ColorPicker reused from sibling registry item with `mode` prop unset → full mode switcher inside its own popover.
- PositionInput: typed number 0–100 with `%` label. Arrow up/down ±1 (±5 with Shift).
- DeleteBtn: disabled (opacity-50, no-op) when `stops.length === 2`.

### Type-specific controls

**Linear (40px tall, single row):**
```
[AngleDial 40×40] [AngleInput 60px, ° suffix]
```

**Radial (120px tall, two rows):**
```
[ShapeSelect 80px] [SizeSelect 140px]
[PositionPicker 60×60] [x: input 50px] [y: input 50px]
```

**Conic (120px tall, two rows):**
```
[FromAngleDial 40×40] [FromAngleInput 60px, ° suffix]
[PositionPicker 60×60] [x: input 50px] [y: input 50px]
```

### Angle dial widget

Circular SVG, 40×40 px. Draggable indicator line from center. Drag rotates. Shift snaps to 15° increments. Arrow keys nudge ±1°.

### Position picker

60×60 square representing the bounding box. Draggable dot inside. Drag sets x/y in %. Numeric inputs alongside set exact values. Click inside square snaps dot to click point.

### Interpolation picker

```
[SpaceSelect 130px] [HueMethodSelect 130px (conditional)]
```

- Space dropdown: `srgb | oklch | oklab | hsl | hwb`. Default `oklch` for fresh state; parsed from input value if present.
- Hue method dropdown: visible only when space is polar. Options `shorter | longer`. Default `shorter` (CSS default).

### Popover total dimensions

| Section | Linear | Radial / Conic |
|---|---|---|
| Type switcher (when shown) | 32 | 32 |
| Preview + track | 80 | 80 |
| Stop detail row | 32 | 32 |
| Type-specific | 40 | 120 |
| Interpolation | 32 | 32 |
| Padding (p-3 × 2) | 24 | 24 |
| Gaps (gap-3 × 4) | 48 | 48 |
| **Total height** | **288 px** | **368 px** |

Width: `w-fit min-w-[320px]` — same dynamic-width pattern as color-picker.

## Registry config (`registry.json` update)

Append a new item:

```json
{
  "name": "gradient-editor",
  "type": "registry:ui",
  "title": "Gradient Editor",
  "description": "Linear / radial / conic gradient editor with draggable stops, position picker, oklch-default interpolation, and reusable color-picker stops.",
  "registryDependencies": ["button", "popover", "color-picker"],
  "dependencies": [],
  "files": [
    {
      "path": "src/components/ui/gradient-editor/index.ts",
      "type": "registry:ui",
      "target": "components/ui/gradient-editor/index.ts"
    },
    {
      "path": "src/components/ui/gradient-editor/gradient-editor.tsx",
      "type": "registry:ui",
      "target": "components/ui/gradient-editor/gradient-editor.tsx"
    },
    {
      "path": "src/components/ui/gradient-editor/gradient-editor.types.ts",
      "type": "registry:ui",
      "target": "components/ui/gradient-editor/gradient-editor.types.ts"
    }
  ]
}
```

**Cross-registry note:** `"color-picker"` in `registryDependencies` references this registry's own item. shadcn 4's resolver should handle bare names (resolved against the same registry the parent item came from). If shadcn 4 instead requires a URL or doesn't support intra-registry deps cleanly, fallback: emit a more verbose form or document the manual two-step install. The plan should verify this empirically during implementation.

## Demo additions (`src/app.tsx`)

Restructured layout — expand from "one component shown" to "two components + composition narrative":

```
Hero                                          (existing)

/ component → Color Picker                    (existing, unchanged)
  BasicUsage / ModeLocked / Native

/ component → Gradient Editor                 (NEW)
  BasicUsage / TypeLocked / StopsControl / Interpolation

/ types → Three usage tiers                   (existing, color-picker-focused)
  TierCasual / TierIntellisense / TierStrict

/ composition → Compose the brand             (NEW)
  Single card: live GradientEditor + the literal expression
  `linear-gradient(45deg, ${color("#ff0000")} 0%, ${color("#0000ff")} 100%)`
  Caption explains the tier-1 narrative.

/ api → API                                   (existing, extend)
  Color Picker block (existing)
  Gradient Editor block (NEW) — same Component / Helpers / Types layout
  Runtime helpers updated to list isGradientString
  Types section updated to list gradient-editor exports

/ install → Drop it in                        (existing, extend)
  Show TWO install commands stacked.

Footer                                        (existing)
```

### Example files

**`src/examples/gradient-editor/basic-usage.tsx`** — type unset, switcher visible, single editor + value chip + CopyButton.

**`src/examples/gradient-editor/type-locked.tsx`** — three cards in a grid, one per type (linear / radial / conic), each with mode locked via prop.

**`src/examples/gradient-editor/stops-control.tsx`** — two cards side-by-side, `maxStops={3}` (showing add disabled at 3) and `maxStops={12}`. Demonstrates the prop's UX consequences.

**`src/examples/gradient-editor/interpolation.tsx`** — two GradientEditors with identical stops but different `in <space>` clauses (`in srgb` vs `in oklch`). Visually obvious diff for cross-hue gradients (red → blue). Sells the `oklch` default.

**`src/examples/gradient-editor/api-reference.tsx`** — public API table for `GradientEditor`. Same `PropsTable`/`TypesList` components as color-picker's api-reference.

### Composition section

Single glass-card with two columns:

- **Left:** live `<GradientEditor>` instance with a pre-set value composed via `color()` literals.
- **Right:** syntax-highlighted code block showing the literal expression with `color("#ff0000")` and `color("#0000ff")` highlighted.
- **Caption:** "Every color stop is `ColorLiteral<S>`-validated. The gradient string is assembled at runtime from validated pieces. Ridiculous from ridiculous parts."

## Testing strategy

### Three layers (same as color-picker)

| Layer | Env | File pattern | Goal |
|---|---|---|---|
| Pure unit (parse/format) | jsdom or node | `gradient-parse.test.ts`, `gradient-format.test.ts` | 100% line coverage on math/parse logic |
| Component | jsdom | `gradient-editor.test.tsx` | Smoke + interaction (no canvas needed) |
| Type-level | tsc typecheck via vitest | `gradient-types.test-d.ts` | Validators + utility types accept/reject correct literals |

**No canvas mock needed** — gradient editor uses CSS `background` for preview. The existing `tests/setup.ts` canvas mock stays in place (still needed for color-picker's `LcPad`).

### `vitest.config.ts` update

Extend `coverage.include` to add `src/components/ui/gradient-editor/**` alongside the existing color-picker glob. Same thresholds (90 statements, 85 branches, 90 functions, 90 lines).

### Parse-test cases (per gradient type, multiplied):

- Basic: `linear-gradient(red, blue)`
- With angle/side: `linear-gradient(45deg, red, blue)`, `linear-gradient(to right, red, blue)`
- With interpolation: `linear-gradient(in oklch, red, blue)`
- With hue method: `linear-gradient(in oklch longer hue, red, blue)`
- Radial with shape + position: `radial-gradient(circle farthest-corner at 50% 50%, red, blue)`
- Conic with from-angle: `conic-gradient(from 90deg at 50% 50%, red, blue)`
- Stops with explicit positions: `linear-gradient(red 0%, blue 100%)`
- Stops with mixed color modes: `linear-gradient(#ff0000 0%, oklch(0.5 0.1 240) 100%)`
- **Balanced-paren regression**: `linear-gradient(rgb(255, 0, 0), oklch(0.5 0.1 240 / 50%))` — comma inside `rgb(...)` must NOT split the stop list
- Invalid input → null
- Edge: 1-stop gradient → null (CSS requires 2+)

### Format-test cases — round-trip integrity:

```ts
const parsed = parseGradient(input)
const formatted = formatGradient(parsed)
const reparsed = parseGradient(formatted)
expect(reparsed).toEqual(parsed)
```

Plus:
- Interpolation `srgb` is omitted from output (CSS default; clean)
- Hue method included only when space is polar
- Stop positions formatted as integer percent

### Component test cases

- Renders trigger with `background: ${value}` preview
- Renders fallback span for unparseable value
- Type switcher visible when `type` prop unset, hidden when set
- Stop track renders one handle per stop
- `data-slot` attributes for each piece (`gradient-editor-trigger`, `gradient-editor-track`, `gradient-editor-handle`, etc.) — same convention as color-picker
- onChange fires after clicking a type switcher tab → output in new type's syntax
- `maxStops` enforces add-disabled state
- Min-2 enforces delete-disabled state

### Type-level test cases

```ts
test("GradientTypeOf extracts type", () => {
  expectTypeOf<GradientTypeOf<"linear-gradient(red, blue)">>().toEqualTypeOf<"linear">()
  expectTypeOf<GradientTypeOf<"radial-gradient(red, blue)">>().toEqualTypeOf<"radial">()
  expectTypeOf<GradientTypeOf<"conic-gradient(red, blue)">>().toEqualTypeOf<"conic">()
  expectTypeOf<GradientTypeOf<"not a gradient">>().toBeNever()
})

test("InterpolationOf extracts space, strips hue method", () => {
  expectTypeOf<InterpolationOf<"linear-gradient(in oklch, red, blue)">>()
    .toEqualTypeOf<"oklch">()
  expectTypeOf<InterpolationOf<"linear-gradient(in oklch longer hue, red, blue)">>()
    .toEqualTypeOf<"oklch">()
  expectTypeOf<InterpolationOf<"linear-gradient(red, blue)">>().toBeNever()
})

test("isGradientString narrows at runtime", () => {
  expect(isGradientString("linear-gradient(red, blue)")).toBe(true)
  expect(isGradientString("not a gradient")).toBe(false)
})
```

### Deferred to v2

- Pointer-event drag simulation tests on stop handles (jsdom flaky for overlay handles + pointer capture).
- Visual regression / screenshot tests.
- Browser-provider tests (jsdom-only for v1, matches color-picker precedent).
- Native `<input>` variant — N/A (no native gradient input exists).

## Open questions for implementation phase

The following are deliberate design choices deferred to writing-plans:

- **Exact balanced-paren split algorithm.** Probably a `while` loop counting paren depth, splitting at depth-0 commas. Plan should specify the helper signature.
- **Angle dial widget rendering.** SVG arc with draggable indicator vs Canvas. Probably SVG (no pixel paint, simpler keyboard support). Plan should pick one and detail the math.
- **Cross-registry `registryDependencies` syntax.** Need to verify shadcn 4 resolves bare names against the parent item's registry. If not, plan adjusts to absolute URL or two-step install docs.
- **Auto-color interpolation when adding a stop on empty track area.** Linear blend between adjacent stops? Or pick the visually-correct color at that position in the gradient? Plan should pick a strategy.
- **Position auto-distribution rule on parse.** When stops omit positions (e.g. `linear-gradient(red, blue)`), assign `0, 100`. With 3 stops omitted: `0, 50, 100`. Spec assumes `N / (count - 1) * 100%` — plan confirms.
- **Behavior when value has `0` stops or just one.** Spec says parse fails → null → fallback. Plan should confirm.
- **Demo's composition section code block.** Probably static syntax-highlighted JSX (like tier-strict's code block in color-picker demo). Plan should pick a syntax highlighter or hand-color the spans.

## Implementation plan reference

After this spec is approved by the user, the writing-plans skill produces a step-by-step plan covering:

1. Stub `gradient-editor.tsx`, `gradient-editor.types.ts`, `index.ts` with section comments and minimal placeholder export.
2. Types file content — suggestion strings, interpolation types, utility types (`GradientTypeOf`, `InterpolationOf`), `GradientStop`.
3. Test infra setup — register new test files in vitest's coverage `include`.
4. Pure parse functions (TDD): `parseLinearGradient`, `parseRadialGradient`, `parseConicGradient`, plus the `parseStop` helper that reuses `parseColor` from color-picker.
5. Balanced-paren split helper + tests.
6. Pure format functions (TDD): `formatLinearGradient`, `formatRadialGradient`, `formatConicGradient`, `formatStop`.
7. Top-level `parseGradient` + `formatGradient` dispatchers.
8. `isGradientString` runtime guard + tests.
9. Type-level tests for `GradientTypeOf` and `InterpolationOf`.
10. Component shell — renders trigger swatch + fallback for unparseable input.
11. Sub-components in dependency order:
   1. `InterpolationPicker`
   2. `LinearControls` (angle dial + input)
   3. `PositionPicker` (drag-a-dot box + numeric inputs)
   4. `RadialControls` (shape + size + position)
   5. `ConicControls` (from-angle + position)
   6. `StopDetailRow` (uses color-picker)
   7. `StopTrack` (handles, drag, add, delete)
   8. `GradientPreview` (the 296×80 pane)
   9. `TypeSwitcher` (3 tabs)
12. Wire popover + emit logic — internal state, lastEmittedRef, hybrid sync effect.
13. Barrel `index.ts`.
14. `registry.json` update — append gradient-editor item.
15. Verify `pnpm registry:build` emits `public/r/gradient-editor.json` and `dist/r/gradient-editor.json` after `pnpm build`.
16. Demo example files (5 of them) + composition card + app.tsx restructure.
17. Final end-to-end verification: live consumer install, `npx shadcn add gradient-editor.json` pulls color-picker too.
