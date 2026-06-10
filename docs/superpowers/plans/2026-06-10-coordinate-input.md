# coordinate-input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `coordinate-input` shadcn registry item — a tiered-type lon/lat[/elevation] `Position` input with pointer-lock drag-scrubbing and range-validated axes — the reusable atom the `geojson-editor` consumes for vertex editing.

**Architecture:** Standalone registry item under `src/components/ui/coordinate-input/`. Value is a numeric `Position` tuple (`[number, number] | [number, number, number]`). Types reuse `ridiculous-type-kit`'s digit machinery (`IsNumberInClosedRange`, `IntRange`) via sign-aware `IsLongitude` / `IsLatitude` validators, plus a numeric-literal `coordinate([lon, lat])` call-site flex that stringifies each literal and range-checks it. The component composes per-axis `<AxisField>` units (numeric `Input` + label + pointer-lock scrub handle), mirroring the proven `unit-input` scrub mechanic.

**Tech Stack:** React 19, TypeScript, shadcn/ui (`Input`, `Label` primitives), Tailwind v4, vitest + jsdom + @testing-library/react, biome.

**Spec:** `docs/superpowers/specs/2026-06-10-geojson-editor-design.md` (§3.7, §6.1)

---

## File map

**Create:**
- `src/components/ui/coordinate-input/index.ts` — barrel re-export
- `src/components/ui/coordinate-input/coordinate-input.tsx` — React component + `AxisField`
- `src/components/ui/coordinate-input/coordinate-input.types.ts` — tiered type system
- `src/components/ui/coordinate-input/coordinate-input.helpers.ts` — parse/format/clamp
- `tests/coordinate-input-types.test-d.ts` — type-level assertions
- `tests/coordinate-input.test.tsx` — behavior + interaction tests
- `tests/coordinate-input-parse.test.ts` — helper unit tests
- `src/examples/coordinate-input/{basic-usage,tier-casual,tier-intellisense,tier-strict,api-reference,live-preview}.tsx`
- `src/pages/coordinate-input/page.tsx`
- `pages/coordinate-input/{index.html,main.tsx}` — MPA entry

**Modify:**
- `registry.json` — add `coordinate-input` item + extend the `all` bundle
- `src/components/layout/component-icons.ts` — `"coordinate-input": MapPin`
- `vitest.config.ts` — extend `coverage.include`
- `README.md` — add Coordinate Input to the Components list

**Reuse (no change):** `src/components/ui/input.tsx`, `src/components/ui/label.tsx` (shadcn primitives; pull via CLI in Task 1 if absent), `src/lib/ridiculous-type-kit`, `tests/setup.ts` (pointer-lock already mocked).

---

## Phase 1 — Foundation

### Task 1: Ensure shadcn primitives + scaffold files

**Files:**
- Create: `src/components/ui/coordinate-input/{index.ts,coordinate-input.tsx,coordinate-input.types.ts,coordinate-input.helpers.ts}`

- [ ] **Step 1: Ensure `Input` and `Label` primitives exist**

Run:
```bash
ls src/components/ui/input.tsx src/components/ui/label.tsx
```
Expected: both exist (Input from unit-input work; Label from earlier components). If `label.tsx` is missing, run `pnpm dlx shadcn@latest add label` and, if it lands elsewhere, move it to `src/components/ui/label.tsx`.

- [ ] **Step 2: Create placeholder files**

Create `src/components/ui/coordinate-input/coordinate-input.types.ts`:
```ts
// Type system for CoordinateInput. Filled in Phase 2.
export {}
```

Create `src/components/ui/coordinate-input/coordinate-input.helpers.ts`:
```ts
// Runtime helpers for CoordinateInput. Filled in Phase 3.
export {}
```

Create `src/components/ui/coordinate-input/coordinate-input.tsx`:
```tsx
// React component for CoordinateInput. Filled in Phase 4.
export {}
```

Create `src/components/ui/coordinate-input/index.ts`:
```ts
// Barrel re-exports. Populated as types, helpers, and component land.
export {}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `pnpm typecheck`
Expected: PASS — empty `export {}` modules are valid.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/coordinate-input/
git commit -m "$(cat <<'EOF'
Scaffold coordinate-input files

Seeds empty index/component/types/helpers placeholders under
src/components/ui/coordinate-input/. Implementation lands in
subsequent tasks.
EOF
)"
```

---

## Phase 2 — Type system

### Task 2: Position + IsLongitude/IsLatitude + numeric-literal flex

**Files:**
- Modify: `src/components/ui/coordinate-input/coordinate-input.types.ts`
- Modify: `src/components/ui/coordinate-input/index.ts`
- Test: `tests/coordinate-input-types.test-d.ts`

- [ ] **Step 1: Write failing type tests**

Create `tests/coordinate-input-types.test-d.ts`:
```ts
import { expectTypeOf, test } from "vitest"
import { coordinate } from "@/components/ui/coordinate-input"
import type {
  IsLatitude,
  IsLongitude,
  Position,
} from "@/components/ui/coordinate-input"

test("IsLongitude bounds magnitude at 180, sign-aware", () => {
  expectTypeOf<IsLongitude<"0">>().toEqualTypeOf<true>()
  expectTypeOf<IsLongitude<"180">>().toEqualTypeOf<true>()
  expectTypeOf<IsLongitude<"-180">>().toEqualTypeOf<true>()
  expectTypeOf<IsLongitude<"122.42">>().toEqualTypeOf<true>()
  expectTypeOf<IsLongitude<"180.0">>().toEqualTypeOf<true>()
  expectTypeOf<IsLongitude<"180.1">>().toEqualTypeOf<false>()
  expectTypeOf<IsLongitude<"200">>().toEqualTypeOf<false>()
  expectTypeOf<IsLongitude<"-181">>().toEqualTypeOf<false>()
  expectTypeOf<IsLongitude<"abc">>().toEqualTypeOf<false>()
})

test("IsLatitude bounds magnitude at 90, sign-aware", () => {
  expectTypeOf<IsLatitude<"90">>().toEqualTypeOf<true>()
  expectTypeOf<IsLatitude<"-90">>().toEqualTypeOf<true>()
  expectTypeOf<IsLatitude<"37.77">>().toEqualTypeOf<true>()
  expectTypeOf<IsLatitude<"91">>().toEqualTypeOf<false>()
  expectTypeOf<IsLatitude<"90.1">>().toEqualTypeOf<false>()
})

test("Position is a 2- or 3-number tuple", () => {
  expectTypeOf<[1, 2]>().toMatchTypeOf<Position>()
  expectTypeOf<[1, 2, 3]>().toMatchTypeOf<Position>()
})

test("coordinate() validates numeric-literal tuples", () => {
  expectTypeOf(coordinate([-122.42, 37.77])).toEqualTypeOf<
    readonly [-122.42, 37.77]
  >()
  expectTypeOf(coordinate([0, 0, 12])).toEqualTypeOf<readonly [0, 0, 12]>()
})

test("coordinate() rejects out-of-range / wrong-arity literals", () => {
  // @ts-expect-error — longitude 200 > 180
  coordinate([200, 0])
  // @ts-expect-error — latitude 91 > 90
  coordinate([0, 91])
  // @ts-expect-error — arity 1
  coordinate([0])
  // @ts-expect-error — arity 4
  coordinate([0, 0, 0, 0])
})
```

- [ ] **Step 2: Run typecheck to verify failure**

Run: `pnpm typecheck`
Expected: FAIL — `Module '"@/components/ui/coordinate-input"' has no exported member 'IsLongitude'` (and similar).

- [ ] **Step 3: Implement the type system**

Replace `src/components/ui/coordinate-input/coordinate-input.types.ts`:
```ts
// =====================================================================
// coordinate-input.types.ts — tiered types for a GeoJSON Position.
//
// casual / intellisense: `Position` tuple (the value type).
// strict (opt-in, literals only): `coordinate([lon, lat])` validates a
//   numeric-literal tuple by stringifying each literal and reusing the
//   ridiculous-type-kit digit range machinery. See spec §3.7.
// =====================================================================

import type {
  And,
  IntRange,
  IsNumberInClosedRange,
} from "@/lib/ridiculous-type-kit"

// --- value type (casual / intellisense tier) -------------------------

export type Position = [number, number] | [number, number, number]

// --- string-form range predicates (kit-based) ------------------------

// |value| ≤ 180: integers 0..180; a non-zero fraction only below 180;
// exactly 180 requires an all-zero fraction (180.0). Mirrors IsNumber0To360.
type Magnitude180<S extends string> = IsNumberInClosedRange<
  S,
  `${IntRange<0, 181>}`,
  `${IntRange<0, 180>}`,
  "180"
>
type Magnitude90<S extends string> = IsNumberInClosedRange<
  S,
  `${IntRange<0, 91>}`,
  `${IntRange<0, 90>}`,
  "90"
>

// Sign-aware: strip a single leading "-", then magnitude-check.
export type IsLongitude<S extends string> = S extends `-${infer R}`
  ? Magnitude180<R>
  : Magnitude180<S>
export type IsLatitude<S extends string> = S extends `-${infer R}`
  ? Magnitude90<R>
  : Magnitude90<S>

// --- numeric-literal tier (the opt-in flex) --------------------------

type IsNever<T> = [T] extends [never] ? true : false

// `${N}` stringifies the number literal; widened `number` → `string`
// (so non-literals reject — this is an authoring helper only). Then the
// string predicate decides. Booleans returned so `And` can compose.
type ValidLon<N extends number> = IsNever<
  `${N}` extends infer S extends string
    ? IsLongitude<S> extends true
      ? N
      : never
    : never
> extends true
  ? false
  : true
type ValidLat<N extends number> = IsNever<
  `${N}` extends infer S extends string
    ? IsLatitude<S> extends true
      ? N
      : never
    : never
> extends true
  ? false
  : true

export type CoordinateLiteral<P extends readonly number[]> = P extends
  | readonly [infer Lon extends number, infer Lat extends number]
  | readonly [infer Lon extends number, infer Lat extends number, number]
  ? And<ValidLon<Lon>, ValidLat<Lat>> extends true
    ? P
    : never
  : never

// Call-site helper: pass a numeric-literal tuple, get it back validated.
// `const` infers the literal tuple; `P & CoordinateLiteral<P>` collapses
// to `never` (a type error) when any axis is out of range or arity ≠ 2–3.
export const coordinate = <const P extends readonly number[]>(
  value: P & CoordinateLiteral<P>,
): P => value
```

Update `src/components/ui/coordinate-input/index.ts`:
```ts
export { coordinate } from "./coordinate-input.types"
export type {
  CoordinateLiteral,
  IsLatitude,
  IsLongitude,
  Position,
} from "./coordinate-input.types"
```

- [ ] **Step 4: Run typecheck + type tests**

Run: `pnpm typecheck && pnpm test tests/coordinate-input-types.test-d.ts`
Expected: PASS for both. If `coordinate([0, 0, 12])` errors, confirm the third tuple arm `readonly [Lon, Lat, number]` is present in `CoordinateLiteral` (elevation is unbounded — only lon/lat are range-checked).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/coordinate-input/coordinate-input.types.ts \
  src/components/ui/coordinate-input/index.ts \
  tests/coordinate-input-types.test-d.ts
git commit -m "$(cat <<'EOF'
Add coordinate-input type system (Position + lon/lat validators)

Position tuple value type; sign-aware IsLongitude/IsLatitude built on
the ridiculous-type-kit IsNumberInClosedRange engine (±180 / ±90, with
the cap accepting only an all-zero fraction). Opt-in coordinate([lon,
lat]) call-site flex stringifies each numeric literal and range-checks
it; non-literal numbers widen to string and are rejected (authoring
helper only, per spec §3.7).
EOF
)"
```

---

## Phase 3 — Runtime helpers

### Task 3: parse / format / clamp

**Files:**
- Modify: `src/components/ui/coordinate-input/coordinate-input.helpers.ts`
- Modify: `src/components/ui/coordinate-input/index.ts`
- Test: `tests/coordinate-input-parse.test.ts`

- [ ] **Step 1: Write failing helper tests**

Create `tests/coordinate-input-parse.test.ts`:
```ts
import { describe, expect, it } from "vitest"
import {
  clampLat,
  clampLon,
  formatCoordinate,
  parseCoordinate,
} from "@/components/ui/coordinate-input"

describe("parseCoordinate", () => {
  it("parses a 2-axis string", () => {
    expect(parseCoordinate("-122.42, 37.77")).toEqual([-122.42, 37.77])
  })
  it("parses a 3-axis string", () => {
    expect(parseCoordinate("1, 2, 3")).toEqual([1, 2, 3])
  })
  it("returns null on non-numeric parts", () => {
    expect(parseCoordinate("a, 2")).toBeNull()
  })
  it("returns null on wrong arity", () => {
    expect(parseCoordinate("1")).toBeNull()
    expect(parseCoordinate("1, 2, 3, 4")).toBeNull()
  })
})

describe("formatCoordinate", () => {
  it("joins with comma-space", () => {
    expect(formatCoordinate([-122.42, 37.77])).toBe("-122.42, 37.77")
  })
})

describe("clamp", () => {
  it("clamps longitude to ±180", () => {
    expect(clampLon(200)).toBe(180)
    expect(clampLon(-200)).toBe(-180)
    expect(clampLon(45)).toBe(45)
  })
  it("clamps latitude to ±90", () => {
    expect(clampLat(91)).toBe(90)
    expect(clampLat(-91)).toBe(-90)
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm test tests/coordinate-input-parse.test.ts`
Expected: FAIL — exports not found.

- [ ] **Step 3: Implement helpers**

Replace `src/components/ui/coordinate-input/coordinate-input.helpers.ts`:
```ts
import type { Position } from "./coordinate-input.types"

/** Parse `"lon, lat[, alt]"` → Position; null on NaN or arity ≠ 2–3. */
export function parseCoordinate(src: string): Position | null {
  const parts = src.split(",").map((s) => Number.parseFloat(s.trim()))
  if (parts.some((n) => Number.isNaN(n))) return null
  if (parts.length === 2) return [parts[0], parts[1]]
  if (parts.length === 3) return [parts[0], parts[1], parts[2]]
  return null
}

/** Serialize a Position back to `"lon, lat[, alt]"`. */
export function formatCoordinate(pos: Position): string {
  return pos.join(", ")
}

export const clampLon = (n: number): number => Math.min(180, Math.max(-180, n))
export const clampLat = (n: number): number => Math.min(90, Math.max(-90, n))
```

Append to `src/components/ui/coordinate-input/index.ts`:
```ts
export {
  clampLat,
  clampLon,
  formatCoordinate,
  parseCoordinate,
} from "./coordinate-input.helpers"
```

- [ ] **Step 4: Run tests + typecheck**

Run: `pnpm test tests/coordinate-input-parse.test.ts && pnpm typecheck`
Expected: PASS for all.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/coordinate-input/coordinate-input.helpers.ts \
  src/components/ui/coordinate-input/index.ts \
  tests/coordinate-input-parse.test.ts
git commit -m "$(cat <<'EOF'
Add coordinate-input runtime helpers

parseCoordinate / formatCoordinate round-trip the "lon, lat[, alt]"
string form; clampLon / clampLat bound axes to ±180 / ±90. These are
the runtime mirror of the type-level lon/lat validators.
EOF
)"
```

---

## Phase 4 — Component

### Task 4: Props + AxisField shell render

**Files:**
- Modify: `src/components/ui/coordinate-input/coordinate-input.tsx`
- Modify: `src/components/ui/coordinate-input/index.ts`
- Test: `tests/coordinate-input.test.tsx`

- [ ] **Step 1: Write failing render tests**

Create `tests/coordinate-input.test.tsx`:
```tsx
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { CoordinateInput } from "@/components/ui/coordinate-input"

describe("CoordinateInput shell", () => {
  it("renders lon + lat axis inputs", () => {
    const { container } = render(
      <CoordinateInput value={[-122.42, 37.77]} onChange={() => {}} />,
    )
    const inputs = container.querySelectorAll("input")
    expect(inputs).toHaveLength(2)
    expect((inputs[0] as HTMLInputElement).value).toBe("-122.42")
    expect((inputs[1] as HTMLInputElement).value).toBe("37.77")
  })

  it("renders a third axis when axes='3d'", () => {
    const { container } = render(
      <CoordinateInput value={[1, 2]} axes="3d" onChange={() => {}} />,
    )
    expect(container.querySelectorAll("input")).toHaveLength(3)
  })

  it("labels each axis", () => {
    const { getByText } = render(
      <CoordinateInput value={[1, 2, 3]} onChange={() => {}} />,
    )
    expect(getByText("lon")).toBeTruthy()
    expect(getByText("lat")).toBeTruthy()
    expect(getByText("alt")).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm test tests/coordinate-input.test.tsx`
Expected: FAIL — `CoordinateInput` not exported.

- [ ] **Step 3: Implement props + shell**

Replace `src/components/ui/coordinate-input/coordinate-input.tsx`:
```tsx
"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { clampLat, clampLon } from "./coordinate-input.helpers"
import type { Position } from "./coordinate-input.types"

type AxisKind = "lon" | "lat" | "alt"

const AXIS_LABEL: Record<AxisKind, string> = {
  lon: "lon",
  lat: "lat",
  alt: "alt",
}

const AXIS_CLAMP: Record<AxisKind, (n: number) => number> = {
  lon: clampLon,
  lat: clampLat,
  alt: (n) => n,
}

const AXIS_RANGE: Record<AxisKind, [number, number] | null> = {
  lon: [-180, 180],
  lat: [-90, 90],
  alt: null,
}

export interface CoordinateInputProps {
  value: Position
  onChange: (next: Position) => void
  axes?: "2d" | "3d"
  precision?: number
  disabled?: boolean
  className?: string
  "aria-label"?: string
}

interface AxisFieldProps {
  kind: AxisKind
  value: number
  precision: number
  disabled?: boolean
  onCommit: (next: number) => void
}

function AxisField({
  kind,
  value,
  precision,
  disabled,
  onCommit,
}: AxisFieldProps) {
  const [draft, setDraft] = React.useState<string | null>(null)
  const displayed = draft ?? value.toFixed(precision)
  const range = AXIS_RANGE[kind]
  const rawNumber = Number.parseFloat(displayed)
  const outOfRange =
    range !== null &&
    !Number.isNaN(rawNumber) &&
    (rawNumber < range[0] || rawNumber > range[1])

  const commit = (raw: string) => {
    const parsed = Number.parseFloat(raw)
    setDraft(null)
    if (Number.isNaN(parsed)) return
    const clamped = AXIS_CLAMP[kind](parsed)
    if (clamped !== value) onCommit(clamped)
  }

  return (
    <label className="inline-flex items-stretch h-7 rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
      <span
        data-slot="coordinate-axis-label"
        className={cn(
          "select-none px-2 flex items-center text-xs font-mono border-r border-input bg-muted/50",
          outOfRange ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {AXIS_LABEL[kind]}
      </span>
      <Input
        value={displayed}
        disabled={disabled}
        aria-label={AXIS_LABEL[kind]}
        aria-invalid={outOfRange || undefined}
        inputMode="decimal"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commit(e.currentTarget.value)
          } else if (e.key === "Escape") {
            e.preventDefault()
            setDraft(null)
          }
        }}
        className="w-20 border-0 rounded-none bg-transparent px-2 font-mono text-xs h-full focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
      />
    </label>
  )
}

export function CoordinateInput({
  value,
  onChange,
  axes = "2d",
  precision = 6,
  disabled,
  className,
  "aria-label": ariaLabel,
}: CoordinateInputProps) {
  const show3d = axes === "3d" || value.length === 3
  const kinds: AxisKind[] = show3d ? ["lon", "lat", "alt"] : ["lon", "lat"]

  const commitAxis = (index: number, next: number) => {
    const base: number[] = [value[0], value[1], value[2] ?? 0]
    base[index] = next
    const out: Position = show3d
      ? [base[0], base[1], base[2]]
      : [base[0], base[1]]
    onChange(out)
  }

  return (
    <div
      data-slot="coordinate-input"
      role="group"
      aria-label={ariaLabel}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      {kinds.map((kind, i) => (
        <AxisField
          key={kind}
          kind={kind}
          value={value[i] ?? 0}
          precision={precision}
          disabled={disabled}
          onCommit={(next) => commitAxis(i, next)}
        />
      ))}
    </div>
  )
}
```

Prepend to `src/components/ui/coordinate-input/index.ts`:
```ts
export { CoordinateInput } from "./coordinate-input"
export type { CoordinateInputProps } from "./coordinate-input"
```

- [ ] **Step 4: Run tests + typecheck**

Run: `pnpm test tests/coordinate-input.test.tsx && pnpm typecheck`
Expected: PASS — 3 shell tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/coordinate-input/coordinate-input.tsx \
  src/components/ui/coordinate-input/index.ts \
  tests/coordinate-input.test.tsx
git commit -m "$(cat <<'EOF'
Add CoordinateInput component shell

Per-axis AxisField (label + numeric Input) for lon/lat plus an optional
alt axis (axes="3d" or a 3-tuple value). Blur/Enter commit with per-axis
clamp; Escape reverts the draft; out-of-range drafts flag aria-invalid.
Scrub lands next.
EOF
)"
```

---

### Task 5: Commit lifecycle assertions (clamp, range flag, no-op suppression)

**Files:**
- Modify: `tests/coordinate-input.test.tsx`

- [ ] **Step 1: Write failing behavior tests**

Append to `tests/coordinate-input.test.tsx`:
```tsx
import { fireEvent } from "@testing-library/react"
import { vi } from "vitest"

describe("CoordinateInput commit", () => {
  it("commits an edited axis with the full tuple", () => {
    const onChange = vi.fn()
    const { container } = render(
      <CoordinateInput value={[-122.42, 37.77]} onChange={onChange} />,
    )
    const lon = container.querySelectorAll("input")[0] as HTMLInputElement
    fireEvent.change(lon, { target: { value: "-120" } })
    fireEvent.blur(lon)
    expect(onChange).toHaveBeenCalledWith([-120, 37.77])
  })

  it("clamps longitude on commit", () => {
    const onChange = vi.fn()
    const { container } = render(
      <CoordinateInput value={[0, 0]} onChange={onChange} />,
    )
    const lon = container.querySelectorAll("input")[0] as HTMLInputElement
    fireEvent.change(lon, { target: { value: "999" } })
    fireEvent.blur(lon)
    expect(onChange).toHaveBeenCalledWith([180, 0])
  })

  it("clamps latitude on commit", () => {
    const onChange = vi.fn()
    const { container } = render(
      <CoordinateInput value={[0, 0]} onChange={onChange} />,
    )
    const lat = container.querySelectorAll("input")[1] as HTMLInputElement
    fireEvent.change(lat, { target: { value: "-91" } })
    fireEvent.blur(lat)
    expect(onChange).toHaveBeenCalledWith([0, -90])
  })

  it("does not emit when the committed axis is unchanged", () => {
    const onChange = vi.fn()
    const { container } = render(
      <CoordinateInput value={[10, 20]} onChange={onChange} />,
    )
    const lon = container.querySelectorAll("input")[0] as HTMLInputElement
    fireEvent.change(lon, { target: { value: "10" } })
    fireEvent.blur(lon)
    expect(onChange).not.toHaveBeenCalled()
  })

  it("flags aria-invalid on an out-of-range draft", () => {
    const { container } = render(
      <CoordinateInput value={[0, 0]} onChange={() => {}} />,
    )
    const lat = container.querySelectorAll("input")[1] as HTMLInputElement
    fireEvent.change(lat, { target: { value: "120" } })
    expect(lat.getAttribute("aria-invalid")).toBe("true")
  })

  it("promotes to a 3-tuple when editing alt on a 2-tuple in 3d mode", () => {
    const onChange = vi.fn()
    const { container } = render(
      <CoordinateInput value={[1, 2]} axes="3d" onChange={onChange} />,
    )
    const alt = container.querySelectorAll("input")[2] as HTMLInputElement
    fireEvent.change(alt, { target: { value: "5" } })
    fireEvent.blur(alt)
    expect(onChange).toHaveBeenCalledWith([1, 2, 5])
  })
})
```

- [ ] **Step 2: Run tests**

Run: `pnpm test tests/coordinate-input.test.tsx`
Expected: PASS — the Task 4 implementation already satisfies these (this task pins the commit contract before scrub changes the component). If "does not emit when unchanged" fails, verify `commit` compares `clamped !== value` against the *axis* value, not the tuple.

- [ ] **Step 3: Commit**

```bash
git add tests/coordinate-input.test.tsx
git commit -m "$(cat <<'EOF'
Pin CoordinateInput commit contract

Tests for per-axis clamp, full-tuple emit, no-op suppression,
aria-invalid on out-of-range draft, and 2-tuple → 3-tuple promotion
when editing alt in 3d mode. Locks behavior before adding scrub.
EOF
)"
```

---

### Task 6: Pointer-lock drag scrub per axis

**Files:**
- Modify: `src/components/ui/coordinate-input/coordinate-input.tsx`
- Modify: `tests/coordinate-input.test.tsx`

- [ ] **Step 1: Write failing scrub tests**

Append to `tests/coordinate-input.test.tsx`:
```tsx
describe("CoordinateInput scrub", () => {
  it("requests pointer lock on axis-label pointerdown", () => {
    const { container } = render(
      <CoordinateInput value={[0, 0]} onChange={() => {}} />,
    )
    const label = container.querySelector(
      '[data-slot="coordinate-axis-label"]',
    ) as HTMLElement
    fireEvent.pointerDown(label, { pointerId: 1 })
    expect(Element.prototype.requestPointerLock).toHaveBeenCalled()
  })

  it("scrubs the axis on pointermove (1px = 1 unit)", () => {
    const onChange = vi.fn()
    const { container } = render(
      <CoordinateInput value={[0, 0]} onChange={onChange} />,
    )
    const lonLabel = container.querySelector(
      '[data-slot="coordinate-axis-label"]',
    ) as HTMLElement
    fireEvent.pointerDown(lonLabel, { pointerId: 1 })
    fireEvent.pointerMove(window, { movementX: 5 })
    expect(onChange).toHaveBeenCalledWith([5, 0])
  })

  it("clamps while scrubbing past the range", () => {
    const onChange = vi.fn()
    const { container } = render(
      <CoordinateInput value={[0, 89]} onChange={onChange} />,
    )
    const latLabel = container.querySelectorAll(
      '[data-slot="coordinate-axis-label"]',
    )[1] as HTMLElement
    fireEvent.pointerDown(latLabel, { pointerId: 1 })
    fireEvent.pointerMove(window, { movementX: 10 })
    expect(onChange).toHaveBeenLastCalledWith([0, 90])
  })

  it("releases pointer lock on pointerup", () => {
    const { container } = render(
      <CoordinateInput value={[0, 0]} onChange={() => {}} />,
    )
    const label = container.querySelector(
      '[data-slot="coordinate-axis-label"]',
    ) as HTMLElement
    fireEvent.pointerDown(label, { pointerId: 1 })
    fireEvent.pointerUp(window)
    expect(document.exitPointerLock).toHaveBeenCalled()
  })

  it("does not scrub when disabled", () => {
    const { container } = render(
      <CoordinateInput value={[0, 0]} disabled onChange={() => {}} />,
    )
    const label = container.querySelector(
      '[data-slot="coordinate-axis-label"]',
    ) as HTMLElement
    fireEvent.pointerDown(label, { pointerId: 1 })
    expect(Element.prototype.requestPointerLock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm test tests/coordinate-input.test.tsx`
Expected: FAIL — 5 new scrub tests fail (the label has no pointer handler). Pointer-lock is already mocked in `tests/setup.ts`.

- [ ] **Step 3: Add scrub to AxisField**

In `src/components/ui/coordinate-input/coordinate-input.tsx`, add scrub state + handlers inside `AxisField` (after the `commit` function), and wire them on the label `<span>`:
```tsx
  const scrubRef = React.useRef({ active: false, anchor: 0, deltaPx: 0 })

  React.useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!scrubRef.current.active) return
      scrubRef.current.deltaPx += event.movementX
      const multiplier = event.shiftKey ? 10 : event.altKey ? 0.1 : 1
      const next = scrubRef.current.anchor + scrubRef.current.deltaPx * multiplier
      const clamped = AXIS_CLAMP[kind](next)
      onCommit(clamped)
    }
    const onUp = () => {
      if (!scrubRef.current.active) return
      scrubRef.current.active = false
      document.exitPointerLock()
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [kind, onCommit])

  const onLabelPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (disabled) return
    event.preventDefault()
    scrubRef.current = { active: true, anchor: value, deltaPx: 0 }
    event.currentTarget.requestPointerLock()
  }
```

Wire `onPointerDown` + a scrub cursor on the label `<span>`:
```tsx
      <span
        data-slot="coordinate-axis-label"
        onPointerDown={onLabelPointerDown}
        className={cn(
          "select-none cursor-ew-resize px-2 flex items-center text-xs font-mono border-r border-input bg-muted/50",
          outOfRange ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {AXIS_LABEL[kind]}
      </span>
```

Note: `onCommit` is rebuilt each render and the effect depends on it, so the window listeners always close over the latest `value`/`onChange`. The "scrub past range" test expects the *last* call to be the clamped bound because each pointermove re-commits from the anchor + cumulative delta.

- [ ] **Step 4: Run tests + typecheck + lint**

Run: `pnpm test tests/coordinate-input.test.tsx && pnpm typecheck && pnpm check`
Expected: PASS for all (14 tests). If biome flags the effect deps, keep `[kind, onCommit]` — `AXIS_CLAMP[kind]` is module-constant.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/coordinate-input/coordinate-input.tsx \
  tests/coordinate-input.test.tsx
git commit -m "$(cat <<'EOF'
Add pointer-lock drag scrub to CoordinateInput axes

Axis label is the scrub handle: pointerdown captures the axis value as
anchor and requests pointer-lock; a window pointermove listener
accumulates movementX (Shift=×10, Alt=÷10), clamps per-axis, and
commits; pointerup releases. Mirrors the unit-input scrub mechanic;
pointer-lock is mocked in tests/setup.ts.
EOF
)"
```

---

## Phase 5 — Demo, registry, nav

### Task 7: Examples + page + MPA entry

**Files:**
- Create: `src/examples/coordinate-input/{basic-usage,tier-casual,tier-intellisense,tier-strict,api-reference,live-preview}.tsx`
- Create: `src/pages/coordinate-input/page.tsx`
- Create: `pages/coordinate-input/{index.html,main.tsx}`
- Modify: `vite.config.ts`

- [ ] **Step 1: Create the examples**

Create `src/examples/coordinate-input/basic-usage.tsx`:
```tsx
import * as React from "react"
import { CoordinateInput } from "@/components/ui/coordinate-input"
import type { Position } from "@/components/ui/coordinate-input"

export function BasicUsage() {
  const [pos, setPos] = React.useState<Position>([-122.42, 37.77])
  return (
    <div className="flex flex-col gap-3">
      <CoordinateInput value={pos} onChange={setPos} aria-label="Location" />
      <code className="text-xs text-muted-foreground">
        {JSON.stringify(pos)}
      </code>
    </div>
  )
}
```

Create `src/examples/coordinate-input/tier-casual.tsx`:
```tsx
import * as React from "react"
import { CoordinateInput } from "@/components/ui/coordinate-input"
import type { Position } from "@/components/ui/coordinate-input"

// Casual tier: plain Position tuples, no compile-time range checks.
export function TierCasual() {
  const [pos, setPos] = React.useState<Position>([0, 0])
  return <CoordinateInput value={pos} onChange={setPos} aria-label="Casual" />
}
```

Create `src/examples/coordinate-input/tier-intellisense.tsx`:
```tsx
import type { Position } from "@/components/ui/coordinate-input"

// IntelliSense tier: the Position tuple gives arity + autocomplete.
const sanFrancisco: Position = [-122.42, 37.77]
const everestSummit: Position = [86.925, 27.988, 8849]

export function TierIntellisense() {
  return (
    <pre className="text-xs">
      {JSON.stringify({ sanFrancisco, everestSummit }, null, 2)}
    </pre>
  )
}
```

Create `src/examples/coordinate-input/tier-strict.tsx`:
```tsx
import { coordinate } from "@/components/ui/coordinate-input"

// Strict tier: numeric-literal validation at the call site.
const valid = coordinate([-122.42, 37.77])

export function TierStrict() {
  // @ts-expect-error — longitude 200 is out of range
  const invalid = coordinate([200, 0])
  void invalid
  return <pre className="text-xs">{JSON.stringify(valid)}</pre>
}
```

Create `src/examples/coordinate-input/api-reference.tsx`:
```tsx
export function ApiReference() {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <h3>CoordinateInput</h3>
      <ul>
        <li>
          <code>value: Position</code> — <code>[lon, lat]</code> or{" "}
          <code>[lon, lat, alt]</code>.
        </li>
        <li>
          <code>onChange(next: Position): void</code> — emits the full tuple on
          commit.
        </li>
        <li>
          <code>axes?: "2d" | "3d"</code> — show the elevation axis (default{" "}
          <code>"2d"</code>; a 3-tuple value forces 3d).
        </li>
        <li>
          <code>precision?: number</code> — display decimals (default 6).
        </li>
        <li>
          <code>disabled?</code>, <code>className?</code>,{" "}
          <code>aria-label?</code>.
        </li>
      </ul>
      <h3>Strict helper</h3>
      <p>
        <code>coordinate([lon, lat])</code> validates a numeric-literal tuple
        (lon ±180, lat ±90). Literals only — runtime values use the component +{" "}
        <code>parseCoordinate</code>.
      </p>
    </div>
  )
}
```

Create `src/examples/coordinate-input/live-preview.tsx`:
```tsx
import * as React from "react"
import { CoordinateInput } from "@/components/ui/coordinate-input"
import type { Position } from "@/components/ui/coordinate-input"

export function LivePreview() {
  const [pos, setPos] = React.useState<Position>([-122.42, 37.77, 16])
  return (
    <div className="flex flex-col gap-3">
      <CoordinateInput
        value={pos}
        axes="3d"
        onChange={setPos}
        aria-label="Drag a label to scrub"
      />
      <p className="text-xs text-muted-foreground">
        Drag the lon / lat / alt labels to scrub. Shift = ×10, Alt = ×0.1.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create the page**

Read an existing page first to match the layout exactly:
```bash
cat src/pages/transition-editor/page.tsx
```

Create `src/pages/coordinate-input/page.tsx` following that structure: import the layout/section-header components used there, render a `SectionHeader` per example, mount `BasicUsage`, `LivePreview`, `TierCasual`, `TierIntellisense`, `TierStrict`, `ApiReference`, and an `InstallCta` with `args="add https://turtiesocks.github.io/ridiculous/r/coordinate-input.json"`. Default-export the page component. Match the import paths and prop names exactly as the transition-editor page uses them.

- [ ] **Step 3: Create the MPA entry**

Copy the transition-editor MPA pair and rename:
```bash
mkdir -p pages/coordinate-input
cp pages/transition-editor/main.tsx pages/coordinate-input/main.tsx
cp pages/transition-editor/index.html pages/coordinate-input/index.html
```
Edit `pages/coordinate-input/main.tsx` so it imports `@/pages/coordinate-input/page`. Edit `pages/coordinate-input/index.html` `<title>` to `Coordinate Input — ridiculous`.

- [ ] **Step 4: Register the MPA input**

In `vite.config.ts`, add `"coordinate-input"` to the MPA inputs map (append-only, following the existing entries' shape).

- [ ] **Step 5: Verify the page renders**

Run: `pnpm dev` then open `http://localhost:5173/ridiculous/coordinate-input/`. Confirm the inputs render, scrubbing works, and the strict example compiles. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/examples/coordinate-input/ src/pages/coordinate-input/ \
  pages/coordinate-input/ vite.config.ts
git commit -m "$(cat <<'EOF'
Add coordinate-input examples, page, and MPA entry

basic-usage, tier-casual/intellisense/strict, api-reference, and a
live-preview scrub demo; docs page mirroring the transition-editor
layout; MPA entry wired into vite.config.ts.
EOF
)"
```

---

### Task 8: registry.json, icon, coverage, README, nav

**Files:**
- Modify: `registry.json`, `src/components/layout/component-icons.ts`, `vitest.config.ts`, `README.md`

- [ ] **Step 1: Add the registry item**

In `registry.json`, add a `coordinate-input` item of `type: "registry:ui"` following the shape of an existing `registry:ui` entry (e.g. `unit-input`). Include:
- `name`, `title: "Coordinate Input"`, a one-to-two-sentence `description`.
- `registryDependencies`: `["https://turtiesocks.github.io/ridiculous/r/ridiculous-type-kit.json", "input", "label"]`.
- `files`: the four `src/components/ui/coordinate-input/*` files, each `type: "registry:ui"` with the matching `target`.

Add `coordinate-input.json` to the `all` bundle's `registryDependencies` and refresh its description.

- [ ] **Step 2: Add the icon**

In `src/components/layout/component-icons.ts`, import `MapPin` from `lucide-react` (insert alphabetically) and add `"coordinate-input": MapPin` to `COMPONENT_ICONS`.

- [ ] **Step 3: Extend coverage**

In `vitest.config.ts`, add `"src/components/ui/coordinate-input/**"` to `coverage.include`.

- [ ] **Step 4: Update README**

In `README.md`, add a Coordinate Input bullet to the Components list (one line, matching the existing style).

- [ ] **Step 5: Build nav + registry, run full verification**

Run:
```bash
pnpm nav:build
pnpm registry:build
pnpm typecheck && pnpm check && pnpm test
```
Expected: nav picks up the page; `public/r/coordinate-input.json` emitted (gitignored — do not commit); typecheck/lint/tests all PASS. The icon-map test should pass now that the entry exists.

- [ ] **Step 6: Commit**

```bash
git add registry.json src/components/layout/component-icons.ts \
  vitest.config.ts README.md
git commit -m "$(cat <<'EOF'
Register coordinate-input (registry, icon, coverage, README)

Adds the coordinate-input registry:ui item (deps: ridiculous-type-kit,
input, label) + the all-bundle entry, a MapPin icon mapping, the
coverage include glob, and the README Components bullet.
EOF
)"
```

---

## Self-review checklist (run before handoff)

- [ ] **Spec coverage:** Position value type (§6.1) ✓ Task 2; lon/lat range validators (§3.1) ✓ Task 2; numeric-literal `coordinate()` flex + caveats (§3.7) ✓ Task 2; drag-scrub Shift/Alt (§6.1) ✓ Task 6; tiers + examples ✓ Task 7; registry/icon/coverage ✓ Task 8.
- [ ] **Type consistency:** `Position`, `IsLongitude`, `IsLatitude`, `CoordinateLiteral`, `coordinate`, `parseCoordinate`, `formatCoordinate`, `clampLon`, `clampLat`, `CoordinateInput`, `CoordinateInputProps` — names identical across types/helpers/component/tests/index.
- [ ] **No placeholders:** every code step is complete; the page step references the concrete transition-editor page to copy structure (no invented import paths).
