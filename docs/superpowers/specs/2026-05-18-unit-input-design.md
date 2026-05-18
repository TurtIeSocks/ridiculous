# UnitInput — design

**Status:** Draft
**Date:** 2026-05-18
**Author:** Rin (TurtIeSocks)

## Problem

`gradient-editor.tsx` contains 5 near-duplicate `<input type="number">` blocks: linear angle, conic from-angle, position X, position Y, and stop position. Each has its own min/max clamp, suffix span, font-mono styling, and `Number.parseInt(..., 10) || 0` parsing — a footgun that snaps empty fields to 0 mid-edit. None of them support drag scrubbing, Shift/Alt step modifiers, or compile-time type safety on the unit-tagged CSS string they ultimately produce.

This spec introduces **UnitInput**, a standalone shadcn-compatible registry item that subsumes all five call sites, adds pointer-locked drag scrubbing + keyboard modifiers, and exposes a tiered type system mirroring the existing `color-picker` (casual / IntelliSense / strict + escape hatch). `gradient-editor` becomes the first consumer.

## Non-Goals

- Range bounds at the type level (compile-time `min<=value<=max`). The wide unit string types accept any `${number}${unit}`; runtime clamps via `min`/`max` props. Reason: a deg input bound to 0–360 still needs to type `"450deg"` temporarily during a scrub; a width input may legitimately exceed 100%.
- Wrap-around semantics (359 → +1 → 0). Out of scope for v1. Consumers needing wrap subtract/add modulo in their own `onChange` handler.
- Touch / pen gesture handling beyond what the browser provides. Pointer-lock is mouse-primary; tablet pens fall back to relative deltas without lock.
- Uncontrolled mode (`defaultValue`). Matches `color-picker`'s controlled-only contract — `value` + `onChange` both required.

## Architecture

### Registry item shape

Standalone item `unit-input`, installable via:
```bash
npx shadcn add https://turtiesocks.github.io/ridiculous/r/unit-input.json
```

File layout matches `color-picker` / `gradient-editor`:
```
src/components/ui/unit-input/
  index.ts                # barrel re-export
  unit-input.tsx          # React component
  unit-input.types.ts     # 4-tier type system
```

Registry entry in `registry.json`:
```json
{
  "name": "unit-input",
  "type": "registry:ui",
  "title": "Unit Input",
  "description": "Ridiculously typed CSS-unit input with built-in deg/%/px/rem/em/vw/vh validators, pointer-locked drag scrubbing, and pluggable custom units.",
  "registryDependencies": ["input"],
  "dependencies": [],
  "files": [
    { "path": "src/components/ui/unit-input/index.ts",            "type": "registry:ui", "target": "components/ui/unit-input/index.ts" },
    { "path": "src/components/ui/unit-input/unit-input.tsx",      "type": "registry:ui", "target": "components/ui/unit-input/unit-input.tsx" },
    { "path": "src/components/ui/unit-input/unit-input.types.ts", "type": "registry:ui", "target": "components/ui/unit-input/unit-input.types.ts" }
  ]
}
```

`registryDependencies: ["input"]` pulls upstream shadcn `Input`. UnitInput composes it inside a composite shell.

### Visual layout — composite shell (layout C)

```
┌────────────────────────────────────┐
│ [prefix?] [input borderless] | suf │
└────────────────────────────────────┘
   ↑ wrapper owns border, rounded corners, focus ring
   ↑ divider between input and suffix
   ↑ suffix has tinted background, ew-resize cursor
```

The shell is `inline-flex`, `h-7` by default. The wrapped shadcn `<Input>` is borderless (`border-0 rounded-none focus-visible:ring-0 bg-transparent`); border + focus ring belong to the outer wrapper. Suffix sits to the right of a 1px divider, with a tinted background (`bg-muted/50`) and `cursor-ew-resize` — its own scrub affordance.

When `prefix` is provided, it renders on the left of the input with the same divider treatment. When `suffix` is provided, it overrides the default unit-text suffix; scrub handle attaches to whatever node is rendered.

## Type system

`unit-input.types.ts` follows the exact 4-tier shape from `color-picker.types.ts`. Primitives are duplicated per the shadcn philosophy — each registry item ships self-contained types, no cross-item imports.

### Tier 1 — Primitives (private)
Copy of color-picker's `Digit`, `Trim`, `NonEmptyAllChars`, `IsNonNegativeNumber`, `IsSignedDecimal`, `KeepIf`. Not exported.

### Tier 2 — Strict literal validators (exported)
Per-unit shape check. **No range bounds** — runtime `min`/`max` clamps; types validate suffix shape only.

```ts
export type DegLiteral<S extends string>     = S extends `${infer N}deg`  ? KeepIf<IsSignedDecimal<Trim<N>>, S> : never
export type PercentLiteral<S extends string> = S extends `${infer N}%`    ? KeepIf<IsSignedDecimal<Trim<N>>, S> : never
export type PxLiteral<S extends string>      = S extends `${infer N}px`   ? KeepIf<IsSignedDecimal<Trim<N>>, S> : never
export type RemLiteral<S extends string>     = S extends `${infer N}rem`  ? KeepIf<IsSignedDecimal<Trim<N>>, S> : never
export type EmLiteral<S extends string>      = S extends `${infer N}em`   ? KeepIf<IsSignedDecimal<Trim<N>>, S> : never
export type VwLiteral<S extends string>      = S extends `${infer N}vw`   ? KeepIf<IsSignedDecimal<Trim<N>>, S> : never
export type VhLiteral<S extends string>      = S extends `${infer N}vh`   ? KeepIf<IsSignedDecimal<Trim<N>>, S> : never

export type UnitLiteral<S extends string> =
  | DegLiteral<S> | PercentLiteral<S> | PxLiteral<S>
  | RemLiteral<S> | EmLiteral<S> | VwLiteral<S> | VhLiteral<S>
```

### Tier 3 — Suggestion strings (IntelliSense)
```ts
export type DegString     = `${number}deg`
export type PercentString = `${number}%`
export type PxString      = `${number}px`
export type RemString     = `${number}rem`
export type EmString      = `${number}em`
export type VwString      = `${number}vw`
export type VhString      = `${number}vh`

export type UnitString =
  | DegString | PercentString | PxString
  | RemString | EmString | VwString | VhString

export interface UnitStringMap {
  deg: DegString
  "%": PercentString
  px:  PxString
  rem: RemString
  em:  EmString
  vw:  VwString
  vh:  VhString
}

export type KnownUnit = keyof UnitStringMap
```

### Tier 4 — Strict helpers (call-site validators)
```ts
export const deg     = <S extends string>(v: S & DegLiteral<S>): S => v
export const percent = <S extends string>(v: S & PercentLiteral<S>): S => v
export const px      = <S extends string>(v: S & PxLiteral<S>): S => v
export const rem     = <S extends string>(v: S & RemLiteral<S>): S => v
export const em      = <S extends string>(v: S & EmLiteral<S>): S => v
export const vw      = <S extends string>(v: S & VwLiteral<S>): S => v
export const vh      = <S extends string>(v: S & VhLiteral<S>): S => v
```

### Consumer tiers
- **casual**: `<UnitInput value={anyVar} unit="deg" />` — any string accepted
- **IntelliSense**: typed `DegString` autocompletes `${number}deg`
- **strict**: `deg("45deg")` errors at compile time on `"45px"` / `"abc"`
- **escape hatch**: `unit="vmin"` → value/onChange typed as plain `string`

## Props API

```ts
export interface UnitInputProps<
  TUnit extends KnownUnit | (string & {}) = KnownUnit | (string & {}),
> {
  /** Current value. For known units, must match `${number}${unit}`. */
  value: TUnit extends KnownUnit
    ? UnitStringMap[TUnit] | (string & {})
    : string

  /** Called on commit (blur, Enter, arrow, scrub). Echoes input shape. */
  onChange: (
    next: TUnit extends KnownUnit ? UnitStringMap[TUnit] : string
  ) => void

  /** Unit suffix. Known units get strict types + drive default arrow step. */
  unit: TUnit

  /** Inclusive lower bound (soft clamp on commit). */
  min?: number

  /** Inclusive upper bound (soft clamp on commit). */
  max?: number

  /** Arrow-key step. Default 1. Shift = step × 10, Alt = step ÷ 10. */
  step?: number

  /** Decimal precision. Default 0 (integer). Used by `toFixed`. */
  precision?: number

  /** Drag scrub sensitivity: 1px = step × sensitivity. Default 1. */
  dragSensitivity?: number

  /** Optional left-side slot inside the shell. Shares the focus ring. */
  prefix?: React.ReactNode

  /** Override default unit-text suffix. Scrub handle attaches here. */
  suffix?: React.ReactNode

  /** Disables editing, arrow nudge, and scrub. */
  disabled?: boolean

  /** Required when no visible label is associated externally. */
  "aria-label"?: string

  /** Pass-through to the shell wrapper for sizing / spacing. */
  className?: string
}
```

### Generic narrowing
- `<UnitInput unit="deg" .../>` — `value` autocompletes `${number}deg`, `onChange` typed `(v: DegString) => void`.
- `<UnitInput unit="vmin" .../>` — escape hatch; value/onChange both `string`. No strict autocomplete.
- `(string & {})` keeps suggestions visible while accepting any string — same trick as color-picker's `value: ColorString | (string & {})`.

### Defaults

| Prop              | Default     | Notes                |
| ----------------- | ----------- | -------------------- |
| `step`            | `1`         |                      |
| `precision`       | `0`         | integer              |
| `dragSensitivity` | `1`         | 1px = 1 step         |
| `disabled`        | `false`     |                      |
| `min` / `max`     | `undefined` | unbounded            |
| `prefix`/`suffix` | `undefined` |                      |

## Internal behavior

### State model — single raw-string buffer
```ts
const [rawDraft, setRawDraft] = useState<string | null>(null)
// null = display value parsed from props.value
// string = user is editing; show this in the field
```
This avoids react-controlled-cursor-jump and decouples the in-flight edit from outside-driven `value` changes.

### Render path
1. Parse `value` prop: strip suffix, `parseFloat`. Fallback `0` + dev-warn if NaN.
2. Display formula: `rawDraft ?? parsed.toFixed(precision)`.
3. Input value never includes suffix — suffix lives in its own DOM node.

### Commit lifecycle
**Triggers:** blur, Enter, ArrowUp/Down, pointer-lock drag delta.

```
parsed = parseFloat(rawDraft ?? displayed)
if (isNaN(parsed)) parsed = parsedFromValue       // revert silently
clamped = clamp(parsed, min, max)                 // identity if min/max undefined
rounded = round(clamped, precision)
formatted = `${rounded}${unit}` as UnitString
if (formatted !== value) onChange(formatted)
setRawDraft(null)                                 // hand control back to props
```

**Escape:** `setRawDraft(null)` — revert visible field to prop value, no commit.

### Keyboard

| Key             | Effect                                     |
| --------------- | ------------------------------------------ |
| Digit / `-` / `.` | Updates `rawDraft`, no commit            |
| `ArrowUp`       | Commit `value + step`                      |
| `ArrowDown`     | Commit `value - step`                      |
| `Shift + Arrow` | step × 10                                  |
| `Alt + Arrow`   | step ÷ 10 (fine — requires `precision >= 1`; with default `precision=0` it rounds back to the same integer) |
| `Enter`         | Commit current `rawDraft`                  |
| `Escape`        | Discard `rawDraft`                         |
| `Tab` (blur)    | Commit                                     |

### Pointer-lock drag scrub
On `pointerdown` on suffix (or custom suffix when provided):
```
1. event.preventDefault() — don't focus input
2. event.target.requestPointerLock()
3. Set internal scrubAnchor = parsedValue (numeric value at drag start)
4. Track cumulative deltaPx across pointermove
5. nextRaw = scrubAnchor + (deltaPx * step * dragSensitivity * modifierMult)
   modifierMult: shift=10, alt=0.1, neither=1 (read each frame from event)
6. Commit clamp(round(nextRaw)) on each pointermove (throttled to rAF)
7. On pointerup: document.exitPointerLock(); clear scrub state
```
Cursor is `ew-resize` on hover. While locked, the browser hides the cursor (native pointer-lock UX).

### Edge cases
- **External `value` change mid-edit:** if `rawDraft !== null`, the prop change is queued; applied on next commit. Avoids stomping the user's in-flight edit.
- **Invalid external `value`** (`"abc"`, or `"45px"` when `unit="deg"`): try strip-non-digits; fall back to `0`; dev-warn once per mount.
- **Disabled:** all triggers no-op. Pointer-lock not requested. Cursor `not-allowed` on suffix.
- **No `min`/`max`:** clamp is identity. `step` still works.

## Gradient-editor consumer refactor

All 5 numeric `<input>` blocks in `gradient-editor.tsx` collapse to `<UnitInput>`. Internal numeric model (`angle: number`, `position: {x,y}: number`, `stop.position: number`) stays intact — UnitInput is wrapped at the boundary.

### Module-scope helpers (added to gradient-editor.tsx)
```ts
const toDeg = (n: number) => `${Math.round(n)}deg` as const
const toPct = (n: number) => `${Math.round(n)}%` as const
const fromUnitString = (s: string) => parseFloat(s) || 0
```

### Call site map

| Site                                   | Before                                                  | After                                                                                                       |
| -------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| LinearControls angle (`gradient-editor.tsx:730`)       | bare `<input>` + `<span>deg</span>`            | `<UnitInput unit="deg" value={toDeg(angle)} onChange={v=>onChange(fromUnitString(v))} min={0} max={360}/>`  |
| ConicControls fromAngle (`gradient-editor.tsx:893`)    | identical shape                                | same as above with `angle` → `fromAngle`                                                                    |
| PositionPicker x (`gradient-editor.tsx:787`)           | `<input>` + `%` text                           | `<UnitInput unit="%" value={toPct(x)} min={0} max={100} onChange={v=>onChange({x: fromUnitString(v), y})}/>` |
| PositionPicker y (`gradient-editor.tsx:801`)           | mirror of x                                    | mirror — onChange returns `{x, y: fromUnitString(v)}`                                                       |
| StopDetailRow position (`gradient-editor.tsx:970`)     | `<input>` + label                              | `<UnitInput unit="%" value={toPct(stop.position)} min={0} max={100} onChange={v=>onChange({...stop, position: fromUnitString(v)})}/>` |

### Net deltas

|                                                | Before | After |
| ---------------------------------------------- | ------ | ----- |
| Raw `<input>` count in gradient-editor         | 5      | 0     |
| LOC for the 5 input blocks                     | ~90    | ~35   |
| Inputs with arrow keys (browser-native ±1)     | 5      | 5 + Shift/Alt scaling, + scrub |
| Inputs with pointer-lock drag scrub            | 0      | 5     |
| `Number.parseInt(x, 10) \|\| 0` patterns       | 5      | 0     |

### Registry update
`registry.json` `gradient-editor` entry adds `"unit-input"` to `registryDependencies`. Install order becomes: shadcn `input` → ridiculous `unit-input` → ridiculous `gradient-editor`.

## Testing strategy

### Files
```
tests/
  unit-input.test.tsx        # behavior + interaction (vitest + jsdom + RTL)
  unit-input-types.test-d.ts # type-level assertions (vitest typecheck)
```

### Behavior tests
- Renders parsed number from `value="45deg"`; suffix is a separate node.
- Typing into the field updates internal draft; no `onChange`.
- Blur commits: type `"60"` → blur → `onChange("60deg")` once.
- Enter commits: same trigger.
- Escape reverts: type `"60"` → Escape → field re-renders `"45"`, no `onChange`.
- Arrow Up commits: `onChange("46deg")`.
- Shift+Arrow Up commits: `onChange("55deg")` (step×10).
- Alt+Arrow Up commits: `onChange("45.1deg")` with `precision=1`.
- Clamp on commit: `min=0 max=100`, type `"150"` → blur → `onChange("100%")`.
- External `value` change mid-edit: type `"60"`, prop changes to `"30deg"`; draft preserved until next commit.
- Disabled: typing / arrow / scrub all no-op.
- Invalid `value` prop (`"abc"`): displays `0`; dev warning fires once.

### Scrub tests (pointer-lock mocked in `tests/setup.ts`)
jsdom doesn't implement `Element.requestPointerLock` / `document.exitPointerLock`. Setup mock:
```ts
Element.prototype.requestPointerLock = vi.fn()
Object.defineProperty(document, "exitPointerLock", { value: vi.fn() })
```
- pointerdown on suffix → `requestPointerLock` called.
- pointermove with `movementX: 5` → `onChange("50deg")` (anchor=45, +5×1×1).
- Shift held during move → ×10 multiplier.
- Alt held during move → ÷10 multiplier.
- pointerup → `exitPointerLock` called.

### Type-level tests
```ts
import { expectTypeOf } from "vitest"
import { deg, percent, DegLiteral, DegString, UnitInputProps } from "@/components/ui/unit-input"

// Strict helper
expectTypeOf(deg("45deg")).toEqualTypeOf<"45deg">()
// @ts-expect-error
deg("45px")
// @ts-expect-error
deg("45")

// Suggestion shape
expectTypeOf<DegString>().toExtend<`${number}deg`>()

// Generic narrowing
type Props = UnitInputProps<"deg">
expectTypeOf<Props["value"]>().toExtend<DegString | (string & {})>()
expectTypeOf<Parameters<Props["onChange"]>[0]>().toEqualTypeOf<DegString>()

// Escape hatch widens
type CustomProps = UnitInputProps<"vmin">
expectTypeOf<Parameters<CustomProps["onChange"]>[0]>().toEqualTypeOf<string>()
```

### Coverage config (vitest.config.ts)
`coverage.include` extended:
```ts
include: [
  "src/components/ui/color-picker/**",
  "src/components/ui/unit-input/**",
]
```
Existing thresholds (90/85/90/90) apply.

### Out of scope for tests
- Real pointer-lock browser UX (cursor hiding, escape-to-release) — manual / E2E only.
- Touch gesture handling — out of scope entirely.

## Open questions

None at this time. All design decisions resolved during brainstorming.

## Migration / rollout

1. Build `unit-input` component, types, tests in `src/components/ui/unit-input/`.
2. Add registry entry in `registry.json`. Run `pnpm registry:build` to emit `public/r/unit-input.json`.
3. Refactor `gradient-editor.tsx` 5 call sites; update gradient-editor registry to depend on `unit-input`. Existing gradient-editor tests should pass unchanged.
4. Add basic-usage / scrub / strict-typing examples under `src/examples/unit-input/` matching the gradient-editor / color-picker example pattern.
5. Add API reference page mirroring color-picker / gradient-editor.
6. Update root `README.md` Components list.

## References

- `src/components/ui/color-picker/color-picker.types.ts` — reference type system pattern
- `src/components/ui/gradient-editor/gradient-editor.tsx:720-985` — current `<input>` call sites to refactor
- `docs/superpowers/specs/2026-05-17-ridiculous-registry-color-picker-design.md` — sibling spec
- `docs/superpowers/specs/2026-05-17-gradient-editor-design.md` — sibling spec
