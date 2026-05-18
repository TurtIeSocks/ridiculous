# UnitInput Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `unit-input` shadcn registry item — a tiered-type CSS-unit input with pointer-lock drag scrubbing — and refactor the 5 duplicate `<input type="number">` blocks in `gradient-editor.tsx` to consume it.

**Architecture:** Standalone registry item under `src/components/ui/unit-input/` with the 4-tier type system that mirrors `color-picker.types.ts` (primitives → literals → suggestion strings → strict helpers). Component composes the shadcn `Input` primitive inside a composite shell that owns the border, focus ring, and a divider before a suffix slot. Suffix doubles as a pointer-lock scrub handle. Gradient-editor adopts it at the boundary: bare numeric internal model stays, helpers wrap/parse going in and out.

**Tech Stack:** React 19, TypeScript, shadcn/ui (Input primitive), Tailwind v4, vitest + jsdom + @testing-library/react, biome.

**Spec:** `docs/superpowers/specs/2026-05-18-unit-input-design.md`

---

## File map

**Create:**
- `src/components/ui/input.tsx` — shadcn Input primitive (pulled via `npx shadcn add input`)
- `src/components/ui/unit-input/index.ts` — barrel re-export
- `src/components/ui/unit-input/unit-input.tsx` — React component
- `src/components/ui/unit-input/unit-input.types.ts` — 4-tier type system
- `tests/unit-input.test.tsx` — behavior + interaction tests
- `tests/unit-input-types.test-d.ts` — type-level assertions
- `src/examples/unit-input/basic-usage.tsx`
- `src/examples/unit-input/scrub.tsx`
- `src/examples/unit-input/strict-typing.tsx`
- `src/examples/unit-input/api-reference.tsx`

**Modify:**
- `registry.json` — add `unit-input` item + extend `gradient-editor.registryDependencies`
- `vitest.config.ts` — extend `coverage.include`
- `tests/setup.ts` — pointer-lock mocks
- `src/components/ui/gradient-editor/gradient-editor.tsx` — 5 call sites + boundary helpers
- `src/App.tsx` — wire UnitInput section
- `README.md` — add Unit Input to Components list

---

## Phase 1 — Foundation

### Task 1: Install shadcn Input primitive and seed unit-input files

**Files:**
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/unit-input/index.ts`
- Create: `src/components/ui/unit-input/unit-input.tsx`
- Create: `src/components/ui/unit-input/unit-input.types.ts`

- [ ] **Step 1: Install shadcn Input via the upstream registry**

Run:
```bash
pnpm dlx shadcn@latest add input
```
Expected: prints "Adding components" and creates `src/components/ui/input.tsx`. If it asks about overwrite, choose No (file shouldn't exist yet).

- [ ] **Step 2: Verify the Input file exists with the expected shape**

Read `src/components/ui/input.tsx`. Expected: exports `Input` as a `React.forwardRef`-style (or direct function) component using `cn` and standard shadcn class strings. If the installer wrote into a different path (e.g. project-style alias mismatch), move the file to `src/components/ui/input.tsx` so it matches the registry source paths the manifest will reference.

- [ ] **Step 3: Create empty unit-input files**

Create `src/components/ui/unit-input/unit-input.types.ts`:
```ts
// Type system for UnitInput. Filled in Phase 2.
export {}
```

Create `src/components/ui/unit-input/unit-input.tsx`:
```tsx
// React component for UnitInput. Filled in Phase 3.
export {}
```

Create `src/components/ui/unit-input/index.ts`:
```ts
// Barrel re-exports. Populated as types and component land.
export {}
```

- [ ] **Step 4: Verify typecheck still passes**

Run: `pnpm typecheck`
Expected: PASS — no errors. Empty modules with `export {}` are valid.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/input.tsx src/components/ui/unit-input/
git commit -m "$(cat <<'EOF'
Scaffold UnitInput files + add shadcn Input primitive

Pulls upstream shadcn Input via the CLI and seeds empty
unit-input/{index,unit-input,unit-input.types}.ts placeholders.
EOF
)"
```

---

## Phase 2 — Type system

### Task 2: Tier 1 primitives + Tier 2 strict literal validators

**Files:**
- Modify: `src/components/ui/unit-input/unit-input.types.ts`
- Modify: `src/components/ui/unit-input/index.ts`
- Test: `tests/unit-input-types.test-d.ts`

- [ ] **Step 1: Write failing type tests**

Create `tests/unit-input-types.test-d.ts`:
```ts
import { expectTypeOf, test } from "vitest"
import type {
  DegLiteral,
  PercentLiteral,
  PxLiteral,
  RemLiteral,
  EmLiteral,
  VwLiteral,
  VhLiteral,
  UnitLiteral,
} from "@/components/ui/unit-input"

test("DegLiteral accepts valid, rejects invalid", () => {
  expectTypeOf<DegLiteral<"45deg">>().toEqualTypeOf<"45deg">()
  expectTypeOf<DegLiteral<"-12.5deg">>().toEqualTypeOf<"-12.5deg">()
  expectTypeOf<DegLiteral<"45px">>().toBeNever()
  expectTypeOf<DegLiteral<"abcdeg">>().toBeNever()
  expectTypeOf<DegLiteral<"deg">>().toBeNever()
})

test("PercentLiteral accepts valid, rejects invalid", () => {
  expectTypeOf<PercentLiteral<"50%">>().toEqualTypeOf<"50%">()
  expectTypeOf<PercentLiteral<"-3.14%">>().toEqualTypeOf<"-3.14%">()
  expectTypeOf<PercentLiteral<"50">>().toBeNever()
  expectTypeOf<PercentLiteral<"50px">>().toBeNever()
})

test("Px/Rem/Em/Vw/Vh literals shape-check their suffix", () => {
  expectTypeOf<PxLiteral<"16px">>().toEqualTypeOf<"16px">()
  expectTypeOf<RemLiteral<"1.5rem">>().toEqualTypeOf<"1.5rem">()
  expectTypeOf<EmLiteral<"2em">>().toEqualTypeOf<"2em">()
  expectTypeOf<VwLiteral<"100vw">>().toEqualTypeOf<"100vw">()
  expectTypeOf<VhLiteral<"50vh">>().toEqualTypeOf<"50vh">()
  expectTypeOf<PxLiteral<"16em">>().toBeNever()
})

test("UnitLiteral is the union across all 7 unit literal types", () => {
  expectTypeOf<UnitLiteral<"45deg">>().toEqualTypeOf<"45deg">()
  expectTypeOf<UnitLiteral<"50%">>().toEqualTypeOf<"50%">()
  expectTypeOf<UnitLiteral<"16px">>().toEqualTypeOf<"16px">()
  expectTypeOf<UnitLiteral<"45">>().toBeNever()
})
```

- [ ] **Step 2: Run typecheck to verify failure**

Run: `pnpm typecheck`
Expected: FAIL — `Module '"@/components/ui/unit-input"' has no exported member 'DegLiteral'` (and similar for the other types).

- [ ] **Step 3: Implement Tier 1 primitives + Tier 2 literals**

Replace contents of `src/components/ui/unit-input/unit-input.types.ts`:
```ts
// =====================================================================
// 1. PRIMITIVES — private helpers, not exported
// =====================================================================

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

type WS = " " | "\n" | "\t"
type TrimLeft<S extends string> = S extends `${WS}${infer R}` ? TrimLeft<R> : S
type TrimRight<S extends string> = S extends `${infer R}${WS}`
  ? TrimRight<R>
  : S
type Trim<S extends string> = TrimLeft<TrimRight<S>>

type AllChars<S extends string, Allowed extends string> = S extends ""
  ? true
  : S extends `${infer C}${infer R}`
    ? C extends Allowed
      ? AllChars<R, Allowed>
      : false
    : false

type NonEmptyAllChars<S extends string, Allowed extends string> = S extends ""
  ? false
  : AllChars<S, Allowed>

type IsIntPart<S extends string> = S extends ""
  ? true
  : NonEmptyAllChars<S, Digit>

type IsNonNegativeNumber<S extends string> = S extends `${infer I}.${infer F}`
  ? IsIntPart<I> extends true
    ? NonEmptyAllChars<F, Digit>
    : false
  : NonEmptyAllChars<S, Digit>

type IsSignedDecimal<S extends string> = S extends `-${infer R}`
  ? IsNonNegativeNumber<R>
  : IsNonNegativeNumber<S>

type KeepIf<B extends boolean, S extends string> = B extends true ? S : never

// =====================================================================
// 2. STRICT VALIDATORS — exported, generic. Used by deg()/percent()/etc.
// =====================================================================

export type DegLiteral<S extends string> = S extends `${infer N}deg`
  ? KeepIf<IsSignedDecimal<Trim<N>>, S>
  : never

export type PercentLiteral<S extends string> = S extends `${infer N}%`
  ? KeepIf<IsSignedDecimal<Trim<N>>, S>
  : never

export type PxLiteral<S extends string> = S extends `${infer N}px`
  ? KeepIf<IsSignedDecimal<Trim<N>>, S>
  : never

export type RemLiteral<S extends string> = S extends `${infer N}rem`
  ? KeepIf<IsSignedDecimal<Trim<N>>, S>
  : never

export type EmLiteral<S extends string> = S extends `${infer N}em`
  ? KeepIf<IsSignedDecimal<Trim<N>>, S>
  : never

export type VwLiteral<S extends string> = S extends `${infer N}vw`
  ? KeepIf<IsSignedDecimal<Trim<N>>, S>
  : never

export type VhLiteral<S extends string> = S extends `${infer N}vh`
  ? KeepIf<IsSignedDecimal<Trim<N>>, S>
  : never

export type UnitLiteral<S extends string> =
  | DegLiteral<S>
  | PercentLiteral<S>
  | PxLiteral<S>
  | RemLiteral<S>
  | EmLiteral<S>
  | VwLiteral<S>
  | VhLiteral<S>
```

Update `src/components/ui/unit-input/index.ts`:
```ts
export type {
  DegLiteral,
  EmLiteral,
  PercentLiteral,
  PxLiteral,
  RemLiteral,
  UnitLiteral,
  VhLiteral,
  VwLiteral,
} from "./unit-input.types"
```

Note on `PxLiteral<"16em">`: returns `never` because the template-literal prefix `${infer N}px` only matches strings ending in `px`. The `"16em"` candidate falls into the `never` branch of the conditional. The test on line `PxLiteral<"16em">` confirms.

- [ ] **Step 4: Run typecheck to verify pass**

Run: `pnpm typecheck`
Expected: PASS — no errors.

- [ ] **Step 5: Run type tests explicitly**

Run: `pnpm test tests/unit-input-types.test-d.ts`
Expected: PASS — vitest runs the typecheck pass on `*.test-d.ts` files (config has `typecheck.enabled: true`).

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/unit-input/unit-input.types.ts \
  src/components/ui/unit-input/index.ts \
  tests/unit-input-types.test-d.ts
git commit -m "$(cat <<'EOF'
Add UnitInput tier 1 primitives + tier 2 strict literals

Private digit/trim/signed-decimal primitives (self-contained, no
cross-item imports per shadcn philosophy). Exported strict literals
for deg/%/px/rem/em/vw/vh and a UnitLiteral union, all validating
shape only (no range bounds — runtime min/max handles bounds).
EOF
)"
```

---

### Task 3: Tier 3 suggestion strings + UnitStringMap + Tier 4 strict helpers

**Files:**
- Modify: `src/components/ui/unit-input/unit-input.types.ts`
- Modify: `src/components/ui/unit-input/index.ts`
- Modify: `tests/unit-input-types.test-d.ts`

- [ ] **Step 1: Extend the failing type tests**

Append to `tests/unit-input-types.test-d.ts`:
```ts
import {
  deg,
  em,
  percent,
  px,
  rem,
  vh,
  vw,
} from "@/components/ui/unit-input"
import type {
  DegString,
  EmString,
  KnownUnit,
  PercentString,
  PxString,
  RemString,
  UnitString,
  UnitStringMap,
  VhString,
  VwString,
} from "@/components/ui/unit-input"

test("Suggestion strings extend their template shape", () => {
  expectTypeOf<DegString>().toExtend<`${number}deg`>()
  expectTypeOf<PercentString>().toExtend<`${number}%`>()
  expectTypeOf<PxString>().toExtend<`${number}px`>()
  expectTypeOf<RemString>().toExtend<`${number}rem`>()
  expectTypeOf<EmString>().toExtend<`${number}em`>()
  expectTypeOf<VwString>().toExtend<`${number}vw`>()
  expectTypeOf<VhString>().toExtend<`${number}vh`>()
})

test("UnitStringMap keys are KnownUnit, values are correct strings", () => {
  expectTypeOf<KnownUnit>().toEqualTypeOf<keyof UnitStringMap>()
  expectTypeOf<UnitStringMap["deg"]>().toEqualTypeOf<DegString>()
  expectTypeOf<UnitStringMap["%"]>().toEqualTypeOf<PercentString>()
  expectTypeOf<UnitString>().toEqualTypeOf<UnitStringMap[KnownUnit]>()
})

test("Strict helpers return the literal back, error on shape mismatch", () => {
  expectTypeOf(deg("45deg")).toEqualTypeOf<"45deg">()
  expectTypeOf(percent("50%")).toEqualTypeOf<"50%">()
  expectTypeOf(px("16px")).toEqualTypeOf<"16px">()
  expectTypeOf(rem("1.5rem")).toEqualTypeOf<"1.5rem">()
  expectTypeOf(em("2em")).toEqualTypeOf<"2em">()
  expectTypeOf(vw("100vw")).toEqualTypeOf<"100vw">()
  expectTypeOf(vh("50vh")).toEqualTypeOf<"50vh">()
})

test("Strict helpers reject wrong suffix or missing suffix", () => {
  // @ts-expect-error — wrong suffix
  deg("45px")
  // @ts-expect-error — missing suffix
  deg("45")
  // @ts-expect-error — bare number
  percent("50")
})
```

- [ ] **Step 2: Run typecheck to verify failure**

Run: `pnpm typecheck`
Expected: FAIL — `Module '"@/components/ui/unit-input"' has no exported member 'DegString'` (and similar).

- [ ] **Step 3: Append Tier 3 + Tier 4 to the types module**

Append to `src/components/ui/unit-input/unit-input.types.ts`:
```ts
// =====================================================================
// 3. SUGGESTION STRINGS — non-generic, for IntelliSense + onChange returns.
// =====================================================================

export type DegString = `${number}deg`
export type PercentString = `${number}%`
export type PxString = `${number}px`
export type RemString = `${number}rem`
export type EmString = `${number}em`
export type VwString = `${number}vw`
export type VhString = `${number}vh`

export interface UnitStringMap {
  deg: DegString
  "%": PercentString
  px: PxString
  rem: RemString
  em: EmString
  vw: VwString
  vh: VhString
}

export type KnownUnit = keyof UnitStringMap
export type UnitString = UnitStringMap[KnownUnit]

// =====================================================================
// 4. STRICT HELPERS — validate at the call site, return the literal back.
// =====================================================================

export const deg = <S extends string>(value: S & DegLiteral<S>): S => value
export const percent = <S extends string>(
  value: S & PercentLiteral<S>,
): S => value
export const px = <S extends string>(value: S & PxLiteral<S>): S => value
export const rem = <S extends string>(value: S & RemLiteral<S>): S => value
export const em = <S extends string>(value: S & EmLiteral<S>): S => value
export const vw = <S extends string>(value: S & VwLiteral<S>): S => value
export const vh = <S extends string>(value: S & VhLiteral<S>): S => value
```

Replace `src/components/ui/unit-input/index.ts`:
```ts
export {
  deg,
  em,
  percent,
  px,
  rem,
  vh,
  vw,
} from "./unit-input.types"
export type {
  DegLiteral,
  DegString,
  EmLiteral,
  EmString,
  KnownUnit,
  PercentLiteral,
  PercentString,
  PxLiteral,
  PxString,
  RemLiteral,
  RemString,
  UnitLiteral,
  UnitString,
  UnitStringMap,
  VhLiteral,
  VhString,
  VwLiteral,
  VwString,
} from "./unit-input.types"
```

- [ ] **Step 4: Run typecheck + type tests**

Run: `pnpm typecheck && pnpm test tests/unit-input-types.test-d.ts`
Expected: PASS for both.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/unit-input/unit-input.types.ts \
  src/components/ui/unit-input/index.ts \
  tests/unit-input-types.test-d.ts
git commit -m "$(cat <<'EOF'
Add UnitInput tier 3 suggestion strings + tier 4 strict helpers

Wide ${number}deg-style suggestion strings for IntelliSense, a
UnitStringMap indexed by KnownUnit, and call-site validator helpers
mirroring color()'s pattern for deg/percent/px/rem/em/vw/vh.
EOF
)"
```

---

## Phase 3 — Component

### Task 4: Props interface + minimal shell render

**Files:**
- Modify: `src/components/ui/unit-input/unit-input.tsx`
- Modify: `src/components/ui/unit-input/index.ts`
- Test: `tests/unit-input.test.tsx`

- [ ] **Step 1: Write failing render test**

Create `tests/unit-input.test.tsx`:
```tsx
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { UnitInput } from "@/components/ui/unit-input"

describe("UnitInput shell", () => {
  it("renders an input element and a suffix node", () => {
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={() => {}}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input")
    const suffix = container.querySelector(
      '[data-slot="unit-input-suffix"]',
    )
    expect(input).toBeTruthy()
    expect(suffix?.textContent).toBe("deg")
  })

  it("displays the parsed numeric portion of value in the input", () => {
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={() => {}}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    expect(input.value).toBe("45")
  })

  it("applies aria-label to the input", () => {
    const { getByLabelText } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={() => {}}
        aria-label="Angle in degrees"
      />,
    )
    expect(getByLabelText("Angle in degrees")).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run the failing test**

Run: `pnpm test tests/unit-input.test.tsx`
Expected: FAIL — `Module '"@/components/ui/unit-input"' has no exported member 'UnitInput'`.

- [ ] **Step 3: Implement minimal component + props**

Replace `src/components/ui/unit-input/unit-input.tsx`:
```tsx
"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type {
  KnownUnit,
  UnitStringMap,
} from "./unit-input.types"

export interface UnitInputProps<
  TUnit extends KnownUnit | (string & {}) = KnownUnit | (string & {}),
> {
  value: TUnit extends KnownUnit
    ? UnitStringMap[TUnit] | (string & {})
    : string
  onChange: (
    next: TUnit extends KnownUnit ? UnitStringMap[TUnit] : string,
  ) => void
  unit: TUnit
  min?: number
  max?: number
  step?: number
  precision?: number
  dragSensitivity?: number
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  disabled?: boolean
  "aria-label"?: string
  className?: string
}

function parseNumeric(value: string, unit: string): number {
  const stripped = value.endsWith(unit) ? value.slice(0, -unit.length) : value
  const n = Number.parseFloat(stripped)
  return Number.isNaN(n) ? 0 : n
}

export function UnitInput<TUnit extends KnownUnit | (string & {})>({
  value,
  unit,
  precision = 0,
  prefix,
  suffix,
  disabled,
  className,
  "aria-label": ariaLabel,
}: UnitInputProps<TUnit>) {
  const unitStr = String(unit)
  const parsed = parseNumeric(String(value), unitStr)
  const displayed = parsed.toFixed(precision)
  const suffixNode = suffix ?? (
    <span
      data-slot="unit-input-suffix"
      className="select-none cursor-ew-resize bg-muted/50 px-2 flex items-center text-xs font-mono text-muted-foreground"
      aria-hidden="true"
    >
      {unitStr}
    </span>
  )
  return (
    <div
      data-slot="unit-input"
      className={cn(
        "inline-flex items-stretch h-7 rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
        disabled && "opacity-50",
        className,
      )}
    >
      {prefix ? (
        <div
          data-slot="unit-input-prefix"
          className="flex items-center px-2 bg-muted/50 border-r border-input"
        >
          {prefix}
        </div>
      ) : null}
      <Input
        value={displayed}
        readOnly
        disabled={disabled}
        aria-label={ariaLabel}
        className="border-0 rounded-none bg-transparent px-2 font-mono text-xs h-full focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
      />
      <div className="w-px bg-input" aria-hidden="true" />
      {suffix === undefined ? (
        suffixNode
      ) : (
        <div data-slot="unit-input-suffix">{suffix}</div>
      )}
    </div>
  )
}
```

Update `src/components/ui/unit-input/index.ts` — prepend:
```ts
export type { UnitInputProps } from "./unit-input"
export { UnitInput } from "./unit-input"
```

- [ ] **Step 4: Run tests + typecheck**

Run: `pnpm test tests/unit-input.test.tsx tests/unit-input-types.test-d.ts && pnpm typecheck`
Expected: PASS for all. The shell renders with `readOnly` for now — keystroke handling lands in Task 5.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/unit-input/unit-input.tsx \
  src/components/ui/unit-input/index.ts \
  tests/unit-input.test.tsx
git commit -m "$(cat <<'EOF'
Add UnitInput component shell with props interface

Composite-shell layout (border + focus ring on wrapper, borderless
shadcn Input inside, divider, suffix slot). Renders only — input is
readOnly. Behavior (draft buffer, commit, keyboard, scrub) lands in
later tasks. Props are typed with TUnit generic narrowing for known
units.
EOF
)"
```

---

### Task 5: Raw-string draft buffer + blur commit + clamp + precision

**Files:**
- Modify: `src/components/ui/unit-input/unit-input.tsx`
- Modify: `tests/unit-input.test.tsx`

- [ ] **Step 1: Write failing behavior tests**

Append to `tests/unit-input.test.tsx`:
```tsx
import { fireEvent } from "@testing-library/react"
import { vi } from "vitest"

describe("UnitInput commit lifecycle", () => {
  it("does not call onChange while typing", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={onChange}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "60" } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it("commits on blur with the unit appended", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={onChange}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "60" } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith("60deg")
  })

  it("clamps to max on commit", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="50%"
        unit="%"
        onChange={onChange}
        min={0}
        max={100}
        aria-label="Percent"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "150" } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith("100%")
  })

  it("clamps to min on commit", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="50%"
        unit="%"
        onChange={onChange}
        min={0}
        max={100}
        aria-label="Percent"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "-5" } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith("0%")
  })

  it("rounds to precision on commit", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="1.50rem"
        unit="rem"
        precision={2}
        onChange={onChange}
        aria-label="Size"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "1.234567" } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith("1.23rem")
  })

  it("does not call onChange when committed value matches current", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={onChange}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "45" } })
    fireEvent.blur(input)
    expect(onChange).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm test tests/unit-input.test.tsx`
Expected: FAIL — all 6 new tests fail (input is `readOnly`, no commit logic exists).

- [ ] **Step 3: Replace component body with draft + commit logic**

Replace `src/components/ui/unit-input/unit-input.tsx` (full file):
```tsx
"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type {
  KnownUnit,
  UnitStringMap,
} from "./unit-input.types"

export interface UnitInputProps<
  TUnit extends KnownUnit | (string & {}) = KnownUnit | (string & {}),
> {
  value: TUnit extends KnownUnit
    ? UnitStringMap[TUnit] | (string & {})
    : string
  onChange: (
    next: TUnit extends KnownUnit ? UnitStringMap[TUnit] : string,
  ) => void
  unit: TUnit
  min?: number
  max?: number
  step?: number
  precision?: number
  dragSensitivity?: number
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  disabled?: boolean
  "aria-label"?: string
  className?: string
}

function parseNumeric(value: string, unit: string): number {
  const stripped = value.endsWith(unit) ? value.slice(0, -unit.length) : value
  const n = Number.parseFloat(stripped)
  return Number.isNaN(n) ? 0 : n
}

function clamp(n: number, min: number | undefined, max: number | undefined) {
  if (min !== undefined && n < min) return min
  if (max !== undefined && n > max) return max
  return n
}

export function UnitInput<TUnit extends KnownUnit | (string & {})>({
  value,
  onChange,
  unit,
  min,
  max,
  precision = 0,
  prefix,
  suffix,
  disabled,
  className,
  "aria-label": ariaLabel,
}: UnitInputProps<TUnit>) {
  const unitStr = String(unit)
  const parsedFromValue = parseNumeric(String(value), unitStr)
  const [rawDraft, setRawDraft] = React.useState<string | null>(null)
  const displayed = rawDraft ?? parsedFromValue.toFixed(precision)

  const commit = (raw: string) => {
    const parsed = Number.parseFloat(raw)
    const next = Number.isNaN(parsed)
      ? parsedFromValue
      : clamp(parsed, min, max)
    const rounded = Number(next.toFixed(precision))
    const formatted = `${rounded}${unitStr}`
    setRawDraft(null)
    if (formatted !== String(value)) {
      onChange(formatted as Parameters<typeof onChange>[0])
    }
  }

  const suffixNode =
    suffix === undefined ? (
      <span
        data-slot="unit-input-suffix"
        className="select-none cursor-ew-resize bg-muted/50 px-2 flex items-center text-xs font-mono text-muted-foreground"
        aria-hidden="true"
      >
        {unitStr}
      </span>
    ) : (
      <div data-slot="unit-input-suffix">{suffix}</div>
    )

  return (
    <div
      data-slot="unit-input"
      className={cn(
        "inline-flex items-stretch h-7 rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
        disabled && "opacity-50",
        className,
      )}
    >
      {prefix ? (
        <div
          data-slot="unit-input-prefix"
          className="flex items-center px-2 bg-muted/50 border-r border-input"
        >
          {prefix}
        </div>
      ) : null}
      <Input
        value={displayed}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => setRawDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        className="border-0 rounded-none bg-transparent px-2 font-mono text-xs h-full focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
      />
      <div className="w-px bg-input" aria-hidden="true" />
      {suffixNode}
    </div>
  )
}
```

- [ ] **Step 4: Run tests + typecheck**

Run: `pnpm test tests/unit-input.test.tsx && pnpm typecheck`
Expected: PASS — 9 tests total (3 shell + 6 commit).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/unit-input/unit-input.tsx tests/unit-input.test.tsx
git commit -m "$(cat <<'EOF'
Add raw-string draft buffer + blur commit to UnitInput

Internal useState<string | null> holds the in-flight typed value;
display formula is rawDraft ?? parsedValue.toFixed(precision). Commit
on blur parses, clamps to min/max, rounds to precision, and emits
only when the formatted result differs from current value.
EOF
)"
```

---

### Task 6: Enter commits, Escape reverts, Arrow keys step with Shift/Alt modifiers

**Files:**
- Modify: `src/components/ui/unit-input/unit-input.tsx`
- Modify: `tests/unit-input.test.tsx`

- [ ] **Step 1: Write failing keyboard tests**

Append to `tests/unit-input.test.tsx`:
```tsx
describe("UnitInput keyboard", () => {
  it("commits on Enter", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={onChange}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "60" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onChange).toHaveBeenCalledWith("60deg")
  })

  it("reverts the draft on Escape without committing", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={onChange}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "60" } })
    fireEvent.keyDown(input, { key: "Escape" })
    expect(onChange).not.toHaveBeenCalled()
    expect(input.value).toBe("45")
  })

  it("steps +1 on ArrowUp", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={onChange}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.keyDown(input, { key: "ArrowUp" })
    expect(onChange).toHaveBeenCalledWith("46deg")
  })

  it("steps -1 on ArrowDown", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={onChange}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.keyDown(input, { key: "ArrowDown" })
    expect(onChange).toHaveBeenCalledWith("44deg")
  })

  it("Shift+ArrowUp multiplies step by 10", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={onChange}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.keyDown(input, { key: "ArrowUp", shiftKey: true })
    expect(onChange).toHaveBeenCalledWith("55deg")
  })

  it("Alt+ArrowUp with precision=1 emits 45.1", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45.0deg"
        unit="deg"
        precision={1}
        onChange={onChange}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.keyDown(input, { key: "ArrowUp", altKey: true })
    expect(onChange).toHaveBeenCalledWith("45.1deg")
  })
})
```

- [ ] **Step 2: Run failing tests**

Run: `pnpm test tests/unit-input.test.tsx`
Expected: FAIL — 6 new keyboard tests fail. The pure-text-change ones might inadvertently pass already if jsdom dispatches blur on Enter — verify they do fail.

- [ ] **Step 3: Add keyboard handling**

In `src/components/ui/unit-input/unit-input.tsx`, modify the component body to add the handler and pass it to `Input.onKeyDown`. Add inside the component, after the `commit` function:
```tsx
const step = arguments.length > 0 ? 1 : 1 // placeholder line removed below
```
(That line is a marker — replace the whole block below.)

Specifically replace the section starting at `const commit = (raw: string) => {` through the end of the component with this version (the rest of the file is unchanged):
```tsx
  const commit = (raw: string) => {
    const parsed = Number.parseFloat(raw)
    const next = Number.isNaN(parsed)
      ? parsedFromValue
      : clamp(parsed, min, max)
    const rounded = Number(next.toFixed(precision))
    const formatted = `${rounded}${unitStr}`
    setRawDraft(null)
    if (formatted !== String(value)) {
      onChange(formatted as Parameters<typeof onChange>[0])
    }
  }

  const stepValue = (
    direction: 1 | -1,
    modifier: { shift: boolean; alt: boolean },
  ) => {
    const stepProp = props_step
    const multiplier = modifier.shift ? 10 : modifier.alt ? 0.1 : 1
    const delta = stepProp * multiplier * direction
    const base =
      rawDraft !== null
        ? Number.parseFloat(rawDraft) || parsedFromValue
        : parsedFromValue
    commit(String(base + delta))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    if (e.key === "Enter") {
      e.preventDefault()
      commit(e.currentTarget.value)
    } else if (e.key === "Escape") {
      e.preventDefault()
      setRawDraft(null)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      stepValue(1, { shift: e.shiftKey, alt: e.altKey })
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      stepValue(-1, { shift: e.shiftKey, alt: e.altKey })
    }
  }
```

Then replace `step` destructuring at the top of the function so `step` is captured under a local name and the `stepValue` helper above can reference it. Update the destructure block to:
```tsx
export function UnitInput<TUnit extends KnownUnit | (string & {})>({
  value,
  onChange,
  unit,
  min,
  max,
  step: props_step = 1,
  precision = 0,
  prefix,
  suffix,
  disabled,
  className,
  "aria-label": ariaLabel,
}: UnitInputProps<TUnit>) {
```

And wire the handler on the `<Input>`:
```tsx
      <Input
        value={displayed}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => setRawDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={onKeyDown}
        className="border-0 rounded-none bg-transparent px-2 font-mono text-xs h-full focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
      />
```

- [ ] **Step 4: Run tests + typecheck + lint**

Run: `pnpm test tests/unit-input.test.tsx && pnpm typecheck && pnpm check`
Expected: PASS for all. Biome will flag the `props_step` snake_case name if it's strict — if so, rename to `stepSize` everywhere in the file.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/unit-input/unit-input.tsx tests/unit-input.test.tsx
git commit -m "$(cat <<'EOF'
Add Enter/Escape/Arrow keyboard handling to UnitInput

Enter commits the current draft via the existing commit pipeline.
Escape clears the draft buffer without emitting. ArrowUp/Down step
by the `step` prop (default 1) with Shift=×10 and Alt=÷10 multipliers.
Alt only takes effect when `precision >= 1`; with the default integer
precision the rounding pulls it back to the same value.
EOF
)"
```

---

### Task 7: Disabled, invalid value handling, dev warning

**Files:**
- Modify: `src/components/ui/unit-input/unit-input.tsx`
- Modify: `tests/unit-input.test.tsx`

- [ ] **Step 1: Write failing tests**

Append to `tests/unit-input.test.tsx`:
```tsx
describe("UnitInput defensive behavior", () => {
  it("ignores keystrokes when disabled", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={onChange}
        disabled
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    fireEvent.keyDown(input, { key: "ArrowUp" })
    expect(onChange).not.toHaveBeenCalled()
  })

  it("displays 0 and warns once for an unparseable value prop", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { container } = render(
      <UnitInput
        value="abcdef"
        unit="deg"
        onChange={() => {}}
        aria-label="Angle"
      />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    expect(input.value).toBe("0")
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toMatch(/UnitInput.*could not parse/i)
    warn.mockRestore()
  })

  it("renders custom suffix node when provided", () => {
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={() => {}}
        suffix={<span>°</span>}
        aria-label="Angle"
      />,
    )
    const suffix = container.querySelector(
      '[data-slot="unit-input-suffix"]',
    )
    expect(suffix?.textContent).toBe("°")
  })

  it("renders prefix slot when provided", () => {
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={() => {}}
        prefix={<span data-testid="dial">dial</span>}
        aria-label="Angle"
      />,
    )
    expect(
      container.querySelector('[data-slot="unit-input-prefix"]'),
    ).toBeTruthy()
    expect(container.querySelector('[data-testid="dial"]')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run failing tests**

Run: `pnpm test tests/unit-input.test.tsx`
Expected: FAIL — `disabled` doesn't block onKeyDown yet (already partially guarded — check), warning is not implemented, suffix/prefix render exists from earlier tasks (those two may pass already; leave them — they pin contract).

- [ ] **Step 3: Add invalid-value warning + verify disabled blocks**

In `src/components/ui/unit-input/unit-input.tsx`, replace `parseNumeric` with a variant that signals failure, and add the warning:
```tsx
function parseNumericResult(
  value: string,
  unit: string,
): { value: number; ok: boolean } {
  const stripped = value.endsWith(unit) ? value.slice(0, -unit.length) : value
  const n = Number.parseFloat(stripped)
  if (Number.isNaN(n)) return { value: 0, ok: false }
  return { value: n, ok: true }
}
```

Replace the parse + draft-state block at the top of the component body with:
```tsx
  const unitStr = String(unit)
  const warnedRef = React.useRef(false)
  const { value: parsedFromValue, ok: parseOk } = parseNumericResult(
    String(value),
    unitStr,
  )
  React.useEffect(() => {
    if (!parseOk && !warnedRef.current) {
      warnedRef.current = true
      console.warn(
        `[UnitInput] could not parse value "${String(value)}" for unit "${unitStr}". Falling back to 0.`,
      )
    }
  }, [parseOk, value, unitStr])
  const [rawDraft, setRawDraft] = React.useState<string | null>(null)
  const displayed = rawDraft ?? parsedFromValue.toFixed(precision)
```

The `onKeyDown` handler already short-circuits with `if (disabled) return`. Verify that the `commit` function is unreachable from `onBlur`/`onChange` while disabled — the underlying shadcn `<Input>` with `disabled` won't accept focus, so blur/change events don't fire. No further guard needed.

- [ ] **Step 4: Run tests + typecheck**

Run: `pnpm test tests/unit-input.test.tsx && pnpm typecheck`
Expected: PASS for all 19 unit-input tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/unit-input/unit-input.tsx tests/unit-input.test.tsx
git commit -m "$(cat <<'EOF'
Add UnitInput defensive behavior: disabled gating, invalid-value warn

Disabled disables the underlying Input (browser blocks focus/blur/
change) and short-circuits onKeyDown so arrow steps never fire. An
unparseable value prop falls back to 0 and emits a single dev-mode
console.warn per mount via a ref guard. Adds prefix/custom-suffix
slot tests to pin the contract introduced in Task 4.
EOF
)"
```

---

## Phase 4 — Pointer-lock scrub

### Task 8: Mock pointer-lock in tests/setup.ts + add scrub on pointerdown

**Files:**
- Modify: `tests/setup.ts`
- Modify: `src/components/ui/unit-input/unit-input.tsx`
- Modify: `tests/unit-input.test.tsx`

- [ ] **Step 1: Write failing scrub tests**

Append to `tests/unit-input.test.tsx`:
```tsx
describe("UnitInput pointer-lock scrub", () => {
  it("requests pointer lock on suffix pointerdown", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={onChange}
        aria-label="Angle"
      />,
    )
    const suffix = container.querySelector(
      '[data-slot="unit-input-suffix"]',
    ) as HTMLElement
    fireEvent.pointerDown(suffix, { pointerId: 1 })
    expect(Element.prototype.requestPointerLock).toHaveBeenCalled()
  })

  it("commits with onChange while dragging (1px = 1 step)", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={onChange}
        aria-label="Angle"
      />,
    )
    const suffix = container.querySelector(
      '[data-slot="unit-input-suffix"]',
    ) as HTMLElement
    fireEvent.pointerDown(suffix, { pointerId: 1 })
    fireEvent.pointerMove(window, { movementX: 5 })
    expect(onChange).toHaveBeenCalledWith("50deg")
  })

  it("applies shift ×10 multiplier during scrub", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={onChange}
        aria-label="Angle"
      />,
    )
    const suffix = container.querySelector(
      '[data-slot="unit-input-suffix"]',
    ) as HTMLElement
    fireEvent.pointerDown(suffix, { pointerId: 1 })
    fireEvent.pointerMove(window, { movementX: 2, shiftKey: true })
    expect(onChange).toHaveBeenCalledWith("65deg")
  })

  it("exits pointer lock on pointerup", () => {
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={() => {}}
        aria-label="Angle"
      />,
    )
    const suffix = container.querySelector(
      '[data-slot="unit-input-suffix"]',
    ) as HTMLElement
    fireEvent.pointerDown(suffix, { pointerId: 1 })
    fireEvent.pointerUp(window)
    expect(document.exitPointerLock).toHaveBeenCalled()
  })

  it("does not scrub when disabled", () => {
    const onChange = vi.fn()
    const { container } = render(
      <UnitInput
        value="45deg"
        unit="deg"
        onChange={onChange}
        disabled
        aria-label="Angle"
      />,
    )
    const suffix = container.querySelector(
      '[data-slot="unit-input-suffix"]',
    ) as HTMLElement
    fireEvent.pointerDown(suffix, { pointerId: 1 })
    expect(Element.prototype.requestPointerLock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Add pointer-lock mocks to setup.ts**

Append to `tests/setup.ts`:
```ts
// jsdom does not implement pointer-lock. Stub the two APIs UnitInput
// uses so scrub tests can assert call counts without throwing.
Element.prototype.requestPointerLock = vi.fn()
Object.defineProperty(document, "exitPointerLock", {
  value: vi.fn(),
  configurable: true,
})
```

Note that the existing file already imports `vi` from `vitest`.

- [ ] **Step 3: Run tests to verify failure**

Run: `pnpm test tests/unit-input.test.tsx`
Expected: FAIL — 5 new scrub tests fail (suffix has no pointer handler yet).

- [ ] **Step 4: Implement pointer-lock scrub in the component**

Edit `src/components/ui/unit-input/unit-input.tsx`. Add a scrub state ref and effect inside the component, after `onKeyDown` is defined:
```tsx
  const scrubRef = React.useRef<{
    active: boolean
    anchor: number
    deltaPx: number
  }>({ active: false, anchor: 0, deltaPx: 0 })

  React.useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!scrubRef.current.active) return
      scrubRef.current.deltaPx += event.movementX
      const multiplier = event.shiftKey ? 10 : event.altKey ? 0.1 : 1
      const next =
        scrubRef.current.anchor +
        scrubRef.current.deltaPx * props_step * dragSensitivity * multiplier
      commit(String(next))
    }
    const onPointerUp = () => {
      if (!scrubRef.current.active) return
      scrubRef.current.active = false
      document.exitPointerLock()
    }
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
    // Re-bind when dependencies that the closures read change.
    // commit is rebuilt every render and reads fresh props via closure, so
    // depending on the primitives that drive it is sufficient.
  }, [props_step, dragSensitivity, parsedFromValue, min, max, precision, unitStr])

  const onSuffixPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (disabled) return
    event.preventDefault()
    scrubRef.current = {
      active: true,
      anchor: parsedFromValue,
      deltaPx: 0,
    }
    event.currentTarget.requestPointerLock()
  }
```

Add `dragSensitivity = 1` to the destructure and wire `onPointerDown` on the default suffix `<span>`:
```tsx
export function UnitInput<TUnit extends KnownUnit | (string & {})>({
  value,
  onChange,
  unit,
  min,
  max,
  step: props_step = 1,
  precision = 0,
  dragSensitivity = 1,
  prefix,
  suffix,
  disabled,
  className,
  "aria-label": ariaLabel,
}: UnitInputProps<TUnit>) {
```

```tsx
  const suffixNode =
    suffix === undefined ? (
      <span
        data-slot="unit-input-suffix"
        className="select-none cursor-ew-resize bg-muted/50 px-2 flex items-center text-xs font-mono text-muted-foreground"
        aria-hidden="true"
        onPointerDown={onSuffixPointerDown}
      >
        {unitStr}
      </span>
    ) : (
      <div data-slot="unit-input-suffix" onPointerDown={onSuffixPointerDown}>
        {suffix}
      </div>
    )
```

Note on the scrub-commit path: `commit` is called from the pointermove handler. It uses `String(parsed.toFixed(...))`, so even mid-drag it emits formatted `${number}${unit}` strings; consumers see a stream of `onChange` calls during the drag. This matches the spec ("Commit on each pointermove").

- [ ] **Step 5: Run tests + typecheck**

Run: `pnpm test tests/unit-input.test.tsx && pnpm typecheck`
Expected: PASS for all 24 tests. If the "shift ×10" test fails by being off-by-one (`65` vs `55`), audit `scrubRef.current.deltaPx += event.movementX` — the second movement-only test expects only the new event's delta, while shift uses the cumulative delta from start of drag. Since the test fires a single pointermove of `movementX: 2` after a fresh pointerdown, `deltaPx` is `2` and `2 * 1 * 1 * 10 = 20`, plus anchor `45` = `65`. Correct.

- [ ] **Step 6: Commit**

```bash
git add tests/setup.ts \
  src/components/ui/unit-input/unit-input.tsx \
  tests/unit-input.test.tsx
git commit -m "$(cat <<'EOF'
Add pointer-lock drag scrub to UnitInput

Suffix pointerdown captures the current parsed value as anchor and
requests pointer-lock on the suffix element. A window-level pointermove
listener accumulates movementX deltas and commits via the existing
pipeline using `step * dragSensitivity * modifier` (shift=×10, alt=÷10).
pointerup releases the lock. Pointer-lock is mocked in tests/setup.ts
because jsdom does not implement it.
EOF
)"
```

---

## Phase 5 — Registry + coverage

### Task 9: Register unit-input in registry.json + extend coverage config

**Files:**
- Modify: `registry.json`
- Modify: `vitest.config.ts`

- [ ] **Step 1: Add the unit-input entry to registry.json**

Edit `registry.json`. After the `color-picker` item and before the `gradient-editor` item, insert:
```json
    {
      "name": "unit-input",
      "type": "registry:ui",
      "title": "Unit Input",
      "description": "Ridiculously typed CSS-unit input with built-in deg/%/px/rem/em/vw/vh validators, pointer-locked drag scrubbing, and pluggable custom units.",
      "registryDependencies": ["input"],
      "dependencies": [],
      "files": [
        {
          "path": "src/components/ui/unit-input/index.ts",
          "type": "registry:ui",
          "target": "components/ui/unit-input/index.ts"
        },
        {
          "path": "src/components/ui/unit-input/unit-input.tsx",
          "type": "registry:ui",
          "target": "components/ui/unit-input/unit-input.tsx"
        },
        {
          "path": "src/components/ui/unit-input/unit-input.types.ts",
          "type": "registry:ui",
          "target": "components/ui/unit-input/unit-input.types.ts"
        }
      ]
    },
```

- [ ] **Step 2: Run registry build to verify the manifest is valid**

Run: `pnpm registry:build`
Expected: emits `public/r/unit-input.json` alongside the existing `color-picker.json` and `gradient-editor.json`. No errors.

- [ ] **Step 3: Extend coverage.include in vitest.config.ts**

In `vitest.config.ts`, replace:
```ts
      include: ["src/components/ui/color-picker/**"],
```
with:
```ts
      include: [
        "src/components/ui/color-picker/**",
        "src/components/ui/unit-input/**",
      ],
```

- [ ] **Step 4: Run the full test suite + coverage**

Run: `pnpm test`
Expected: PASS — all existing color-picker + gradient-editor + new unit-input tests pass.

(Coverage thresholds will trip if unit-input has gaps. If it does, add tests covering the missing lines before continuing. Likely candidates: the `parseNumericResult` `ok: false` path is covered by the warning test; the `commit` no-op early return is covered; the prefix slot conditional has both branches covered by Task 7's tests.)

- [ ] **Step 5: Commit**

```bash
git add registry.json vitest.config.ts public/r/unit-input.json
git commit -m "$(cat <<'EOF'
Register unit-input as a shadcn item + extend coverage

Adds the unit-input entry to registry.json (registryDep on shadcn's
upstream `input`) and emits public/r/unit-input.json via the shadcn
build. Extends vitest coverage.include so the 90/85/90/90 threshold
applies to the new component.
EOF
)"
```

---

## Phase 6 — Gradient-editor refactor

### Task 10: Add boundary helpers and refactor LinearControls angle input

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`

- [ ] **Step 1: Run existing gradient-editor tests as the baseline**

Run: `pnpm test tests/gradient-editor.test.tsx`
Expected: PASS — captures the current behavior contract.

- [ ] **Step 2: Add module-scope helpers and import UnitInput**

In `src/components/ui/gradient-editor/gradient-editor.tsx`, add to the imports near the top of the file (alongside the existing color-picker import):
```tsx
import { UnitInput } from "@/components/ui/unit-input"
```

After the existing module-level constants (e.g. `GRADIENT_TYPES`), add:
```tsx
const toDeg = (n: number) => `${Math.round(n)}deg`
const toPct = (n: number) => `${Math.round(n)}%`
const fromUnitString = (s: string) => {
  const n = Number.parseFloat(s)
  return Number.isNaN(n) ? 0 : n
}
```

- [ ] **Step 3: Refactor the LinearControls angle input**

Locate the `LinearControls` function (around `gradient-editor.tsx:720`). Replace the `<input type="number">` + `<span>deg</span>` block:
```tsx
      <input
        type="number"
        min={0}
        max={360}
        value={Math.round(angle)}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10) || 0)}
        className="h-7 w-16 rounded border bg-background px-2 font-mono text-xs"
        aria-label="Angle in degrees"
      />
      <span className="font-mono text-xs text-muted-foreground">deg</span>
```
with:
```tsx
      <UnitInput
        unit="deg"
        value={toDeg(angle)}
        onChange={(v) => onChange(fromUnitString(v))}
        min={0}
        max={360}
        aria-label="Angle in degrees"
        className="h-7 w-16"
      />
```

- [ ] **Step 4: Run gradient-editor tests + typecheck**

Run: `pnpm test tests/gradient-editor.test.tsx && pnpm typecheck`
Expected: PASS — the visible behavior contract is preserved.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/gradient-editor/gradient-editor.tsx
git commit -m "$(cat <<'EOF'
Refactor gradient-editor LinearControls angle to UnitInput

Replaces the raw <input type="number"> + <span>deg</span> pair with
UnitInput, gaining pointer-lock scrub + Shift/Alt step modifiers.
Adds module-scope toDeg/toPct/fromUnitString boundary helpers used by
this and the four subsequent refactors.
EOF
)"
```

---

### Task 11: Refactor ConicControls fromAngle input

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`

- [ ] **Step 1: Locate the ConicControls input**

Find `ConicControls` (around `gradient-editor.tsx:880`). The from-angle block looks like:
```tsx
        <input
          type="number"
          min={0}
          max={360}
          value={Math.round(fromAngle)}
          onChange={(e) =>
            onChange({
              fromAngle: Number.parseInt(e.target.value, 10) || 0,
              position,
            })
          }
          className="h-7 w-16 rounded border bg-background px-2 font-mono text-xs"
          aria-label="Conic from-angle in degrees"
        />
        <span className="font-mono text-xs text-muted-foreground">deg</span>
```

- [ ] **Step 2: Replace with UnitInput**

```tsx
        <UnitInput
          unit="deg"
          value={toDeg(fromAngle)}
          onChange={(v) =>
            onChange({ fromAngle: fromUnitString(v), position })
          }
          min={0}
          max={360}
          aria-label="Conic from-angle in degrees"
          className="h-7 w-16"
        />
```

- [ ] **Step 3: Run tests**

Run: `pnpm test tests/gradient-editor.test.tsx && pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/gradient-editor/gradient-editor.tsx
git commit -m "Refactor gradient-editor ConicControls fromAngle to UnitInput"
```

---

### Task 12: Refactor PositionPicker x and y inputs

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`

- [ ] **Step 1: Locate the PositionPicker inputs**

Find `PositionPicker` (around `gradient-editor.tsx:745`). The x input is around line 787 and y around line 801. The two `<label>` wrappers contain an `<input>` and a `%` literal.

- [ ] **Step 2: Replace both inputs**

Replace the x block (the `<label>` that wraps the x input and trailing `%`):
```tsx
        <label className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
          x:
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(x)}
            onChange={(e) =>
              onChange({ x: Number.parseInt(e.target.value, 10) || 0, y })
            }
            className="h-6 w-12 rounded border bg-background px-1 font-mono text-xs"
          />
          %
        </label>
```
with:
```tsx
        <label className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
          x:
          <UnitInput
            unit="%"
            value={toPct(x)}
            onChange={(v) => onChange({ x: fromUnitString(v), y })}
            min={0}
            max={100}
            aria-label="Position x"
            className="h-6 w-12"
          />
        </label>
```

Replace the y block (mirror):
```tsx
        <label className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
          y:
          <UnitInput
            unit="%"
            value={toPct(y)}
            onChange={(v) => onChange({ x, y: fromUnitString(v) })}
            min={0}
            max={100}
            aria-label="Position y"
            className="h-6 w-12"
          />
        </label>
```

- [ ] **Step 3: Run tests**

Run: `pnpm test tests/gradient-editor.test.tsx && pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/gradient-editor/gradient-editor.tsx
git commit -m "Refactor gradient-editor PositionPicker x/y to UnitInput"
```

---

### Task 13: Refactor StopDetailRow position input + update registry deps

**Files:**
- Modify: `src/components/ui/gradient-editor/gradient-editor.tsx`
- Modify: `registry.json`

- [ ] **Step 1: Locate the StopDetailRow input**

Find `StopDetailRow` (around `gradient-editor.tsx:955`). The stop position input is around line 970 — `<input type="number" min={0} max={100} value={Math.round(stop.position)} ...>`.

- [ ] **Step 2: Replace the input**

```tsx
      <UnitInput
        unit="%"
        value={toPct(stop.position)}
        onChange={(v) =>
          onChange({
            ...stop,
            position: Math.max(0, Math.min(100, fromUnitString(v))),
          })
        }
        min={0}
        max={100}
        aria-label="Stop position"
        className="h-7 w-16"
      />
```

The outer `Math.max(0, Math.min(100, ...))` belt-and-suspenders mirrors the original behavior; UnitInput's `min`/`max` already clamp, but keeping the redundant clamp preserves the original semantics exactly in case external callers rely on it.

- [ ] **Step 3: Update gradient-editor's registry dependencies**

In `registry.json`, find the `gradient-editor` item. Update its `registryDependencies` from:
```json
      "registryDependencies": ["button", "popover", "color-picker"],
```
to:
```json
      "registryDependencies": ["button", "popover", "color-picker", "unit-input"],
```

- [ ] **Step 4: Rebuild registry + run full suite**

Run: `pnpm registry:build && pnpm test && pnpm typecheck && pnpm check`
Expected: PASS — `public/r/gradient-editor.json` regenerated with the new dep, all tests pass, typecheck clean, biome clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/gradient-editor/gradient-editor.tsx \
  registry.json \
  public/r/gradient-editor.json
git commit -m "$(cat <<'EOF'
Refactor gradient-editor StopDetailRow to UnitInput + bump deps

Final of the 5 gradient-editor numeric-input refactors. Adds
unit-input to gradient-editor's registryDependencies so consumers
running `npx shadcn add gradient-editor` cascade-install unit-input.
EOF
)"
```

---

## Phase 7 — Demo + docs

### Task 14: basic-usage, scrub, and strict-typing example components

**Files:**
- Create: `src/examples/unit-input/basic-usage.tsx`
- Create: `src/examples/unit-input/scrub.tsx`
- Create: `src/examples/unit-input/strict-typing.tsx`

- [ ] **Step 1: Write basic-usage example**

Create `src/examples/unit-input/basic-usage.tsx`:
```tsx
import { useState } from "react"
import { UnitInput } from "@/components/ui/unit-input"

export function BasicUsage() {
  const [angle, setAngle] = useState<string>("45deg")
  const [pct, setPct] = useState<string>("50%")
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> tier-casual
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Basic Usage</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Two UnitInputs, two units. Type a number; commit on blur or Enter.
        Arrow keys step ±1, Shift+Arrow ±10. Hover the suffix to scrub.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          angle:
          <UnitInput
            unit="deg"
            value={angle}
            onChange={setAngle}
            min={0}
            max={360}
            aria-label="Angle"
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          opacity:
          <UnitInput
            unit="%"
            value={pct}
            onChange={setPct}
            min={0}
            max={100}
            aria-label="Opacity"
          />
        </label>
        <code className="text-sm font-mono bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg">
          {angle}, {pct}
        </code>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write scrub example**

Create `src/examples/unit-input/scrub.tsx`:
```tsx
import { useState } from "react"
import { UnitInput } from "@/components/ui/unit-input"

export function Scrub() {
  const [size, setSize] = useState<string>("16px")
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> drag-to-scrub
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Pointer-lock Scrub</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Hover the <code className="font-mono">px</code> suffix → cursor turns
        into ↔ → drag horizontally. The cursor disappears (pointer-lock) and
        the value tracks your delta. Shift = coarse (×10), Alt = fine (÷10).
      </p>
      <div className="mt-6 flex items-center gap-6">
        <UnitInput
          unit="px"
          value={size}
          onChange={setSize}
          step={1}
          dragSensitivity={1}
          aria-label="Size"
        />
        <div
          aria-hidden="true"
          className="rounded bg-linear-to-br from-violet-glow to-pink-glow"
          style={{ width: size, height: size }}
        />
        <code className="text-sm font-mono bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg">
          {size}
        </code>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write strict-typing example**

Create `src/examples/unit-input/strict-typing.tsx`:
```tsx
import { useState } from "react"
import {
  UnitInput,
  deg,
  type DegString,
} from "@/components/ui/unit-input"

export function StrictTyping() {
  // DegString = `${number}deg`. The deg() helper validates a literal
  // at compile time — uncomment the line below to see the type error.
  // const bad = deg("45px")
  const [angle, setAngle] = useState<DegString>(deg("90deg"))
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> tier-strict
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Strict Typing</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        <code className="font-mono">unit="deg"</code> narrows the value/onChange
        types to <code className="font-mono">DegString</code>. The{" "}
        <code className="font-mono">deg()</code> call-site helper rejects
        wrong-suffix literals at compile time.
      </p>
      <div className="mt-6 flex items-center gap-6">
        <UnitInput
          unit="deg"
          value={angle}
          onChange={setAngle}
          min={0}
          max={360}
          aria-label="Angle"
        />
        <code className="text-sm font-mono bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg">
          {angle}
        </code>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run typecheck + lint**

Run: `pnpm typecheck && pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/examples/unit-input/
git commit -m "$(cat <<'EOF'
Add UnitInput demo examples: basic-usage, scrub, strict-typing

Three example components showcasing the casual, drag-scrub, and
strict-typing usage tiers. Wired into App.tsx in the next task.
EOF
)"
```

---

### Task 15: API reference example + wire into App.tsx

**Files:**
- Create: `src/examples/unit-input/api-reference.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Check the existing api-reference helper components**

Read `src/examples/color-picker/api-reference.tsx`. It imports/defines `Section`, `Signature`, `PropsTable`, `ApiRow`, `TypesList` components. Find where these are exported and reuse them.

- [ ] **Step 2: Write api-reference example for UnitInput**

Create `src/examples/unit-input/api-reference.tsx`. Use the same helper components as color-picker's api-reference. Skeleton:
```tsx
import {
  ApiRow,
  PropsTable,
  Section,
  Signature,
  TypesList,
} from "../color-picker/api-reference" // or wherever helpers are exported from

export function ApiReference() {
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 space-y-10">
      <Section title="Component">
        <Signature>
          {
            "<UnitInput<TUnit extends KnownUnit | (string & {})>\n  value: UnitStringMap[TUnit] | (string & {}) | string\n  onChange: (next: UnitStringMap[TUnit] | string) => void\n  unit: TUnit\n  min?: number\n  max?: number\n  step?: number\n  precision?: number\n  dragSensitivity?: number\n  prefix?: React.ReactNode\n  suffix?: React.ReactNode\n  disabled?: boolean\n  aria-label?: string\n  className?: string\n/>"
          }
        </Signature>
        <PropsTable
          rows={[
            { name: "value", type: "UnitStringMap[TUnit] | (string & {})", desc: "Current value, e.g. \"45deg\". Any string accepted; IntelliSense narrows by `unit`." },
            { name: "onChange", type: "(next) => void", desc: "Called on commit (blur, Enter, arrow, scrub). Return type narrows by `unit`." },
            { name: "unit", type: "KnownUnit | (string & {})", desc: "Suffix label. Known units (deg/%/px/rem/em/vw/vh) get strict typing; unknown widens to string." },
            { name: "min", type: "number?", desc: "Inclusive lower bound. Soft-clamps on commit." },
            { name: "max", type: "number?", desc: "Inclusive upper bound. Soft-clamps on commit." },
            { name: "step", type: "number (default 1)", desc: "Arrow-key step. Shift=×10, Alt=÷10." },
            { name: "precision", type: "number (default 0)", desc: "Decimal places. Round via toFixed on commit." },
            { name: "dragSensitivity", type: "number (default 1)", desc: "Scrub: 1px = step × sensitivity." },
            { name: "prefix", type: "React.ReactNode?", desc: "Left-side slot inside the shell, shares focus ring." },
            { name: "suffix", type: "React.ReactNode?", desc: "Override the default unit-text suffix. Scrub handle attaches here." },
            { name: "disabled", type: "boolean", desc: "Disables typing, arrow nudge, and scrub." },
            { name: "aria-label", type: "string", desc: "Required when no visible label is associated externally." },
            { name: "className", type: "string", desc: "Applied to the shell wrapper for sizing/spacing." },
          ]}
        />
      </Section>

      <Section title="Runtime helpers">
        <ApiRow signature="deg<S extends string>(value: S & DegLiteral<S>): S" desc="Validate a deg literal at the call site." />
        <ApiRow signature="percent<S extends string>(value: S & PercentLiteral<S>): S" desc="Validate a % literal at the call site." />
        <ApiRow signature="px<S extends string>(value: S & PxLiteral<S>): S" desc="Validate a px literal." />
        <ApiRow signature="rem<S extends string>(value: S & RemLiteral<S>): S" desc="Validate a rem literal." />
        <ApiRow signature="em<S extends string>(value: S & EmLiteral<S>): S" desc="Validate an em literal." />
        <ApiRow signature="vw<S extends string>(value: S & VwLiteral<S>): S" desc="Validate a vw literal." />
        <ApiRow signature="vh<S extends string>(value: S & VhLiteral<S>): S" desc="Validate a vh literal." />
      </Section>

      <Section title="Types">
        <TypesList
          rows={[
            { name: "UnitString", desc: "Union of all 7 suggestion strings (DegString | PercentString | …)." },
            { name: "UnitStringMap", desc: "{ deg: DegString, \"%\": PercentString, px: PxString, rem: RemString, em: EmString, vw: VwString, vh: VhString }" },
            { name: "KnownUnit", desc: 'keyof UnitStringMap — "deg" | "%" | "px" | "rem" | "em" | "vw" | "vh".' },
            { name: "UnitLiteral<S>", desc: "Union of all strict literal validators. Returns S if S is a valid unit literal in any of the known shapes, otherwise never." },
          ]}
        />
      </Section>
    </div>
  )
}
```

If the helper components (`Section`, `Signature`, `PropsTable`, `ApiRow`, `TypesList`) live inline inside the color-picker api-reference file and aren't exported, factor them into a shared module first (e.g. `src/examples/_shared/api-helpers.tsx`) and update both color-picker and gradient-editor api-references to import from there. Otherwise this task is import-and-go.

- [ ] **Step 3: Wire UnitInput section into App.tsx**

In `src/App.tsx`, add imports near the other example imports:
```tsx
import { ApiReference as UnitInputApiReference } from "./examples/unit-input/api-reference"
import { BasicUsage as UnitInputBasicUsage } from "./examples/unit-input/basic-usage"
import { Scrub as UnitInputScrub } from "./examples/unit-input/scrub"
import { StrictTyping as UnitInputStrictTyping } from "./examples/unit-input/strict-typing"
```

After the gradient-editor section in App's `<main>`, add:
```tsx
          <SectionHeader
            eyebrow="component"
            title="Unit Input"
            description="CSS-unit input with built-in deg/%/px/rem/em/vw/vh validators, pointer-locked drag scrubbing, and tiered typing tiers from casual to strict."
          />
          <div className="mt-12 space-y-10">
            <UnitInputBasicUsage />
            <UnitInputScrub />
            <UnitInputStrictTyping />
            <UnitInputApiReference />
          </div>
```

- [ ] **Step 4: Run typecheck + lint + dev verify**

Run: `pnpm typecheck && pnpm check`
Expected: PASS.

Optional sanity check (manual): `pnpm dev` and open http://localhost:5173/ridiculous/ — confirm the new section renders, the inputs accept typing, blur commits, arrows step, and the px suffix supports drag-scrub. Close after verifying.

- [ ] **Step 5: Commit**

```bash
git add src/examples/unit-input/api-reference.tsx src/App.tsx
git commit -m "$(cat <<'EOF'
Add UnitInput API reference + wire demo section into App.tsx

Mirrors the color-picker/gradient-editor api-reference structure
(Component / Runtime helpers / Types). Adds the Unit Input section
header and the four examples to the demo page.
EOF
)"
```

---

### Task 16: README.md update

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add UnitInput to the Components list**

In `README.md`, update the Components section. After the Color Picker entry, insert:
```md
- **Unit Input** — typed CSS-unit input (deg/%/px/rem/em/vw/vh) with
  pointer-locked drag scrubbing, Shift/Alt step modifiers, and a
  call-site validator helper per unit.
```

Also confirm the Gradient Editor entry (if present) is unchanged. The README's `npx shadcn add` example does not need updating — users typically install components individually.

If the README does not yet list Gradient Editor, add both in alphabetical order:
```md
- **Color Picker** — oklch L×C pad, hue/alpha strips, 6 modes (oklch, oklab, hex, rgb, hsl, hwb), tiered typing (casual / IntelliSense / strict).
- **Gradient Editor** — linear / radial / conic editor with draggable stops, position picker, oklch interpolation.
- **Unit Input** — typed CSS-unit input (deg/%/px/rem/em/vw/vh) with pointer-locked drag scrubbing, Shift/Alt step modifiers, and a call-site validator helper per unit.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Document UnitInput in README components list"
```

---

## Phase 8 — Verification + cleanup

### Task 17: Final verification

**Files:** none (read-only verification)

- [ ] **Step 1: Run the full test suite, typecheck, lint, and build in parallel**

Run the following in one parallel Bash batch:
- `pnpm test`
- `pnpm typecheck`
- `pnpm check`
- `pnpm build`

Expected: PASS for all four. Build emits to `dist/` and includes the regenerated registry manifests.

- [ ] **Step 2: Verify the registry manifests**

Read `public/r/unit-input.json` and `public/r/gradient-editor.json`. Confirm:
- `unit-input.json` lists `input` in `registryDependencies` and inlines the three source files.
- `gradient-editor.json` lists `unit-input` in `registryDependencies`.

- [ ] **Step 3: Confirm git tree is clean**

Run: `git status`
Expected: `nothing to commit, working tree clean`.

- [ ] **Step 4: Push notes (no commit)**

If anything from the verification surfaced a defect, fix it in a new commit on the same branch (do NOT amend) and re-run Step 1 until it passes.

---

## Self-review

### Spec coverage check

| Spec section | Task(s) |
|---|---|
| Component shape + file structure | Task 1, Task 9 |
| Type system tier 1 + 2 | Task 2 |
| Type system tier 3 + 4 | Task 3 |
| Props API + generic narrowing | Task 4 (shape), Task 5 (`min`/`max`/`precision` wiring), Task 6 (`step`), Task 7 (`disabled`/`prefix`/`suffix`), Task 8 (`dragSensitivity`) |
| Composite shell layout (layout C) | Task 4 |
| Raw-string draft buffer | Task 5 |
| Commit lifecycle + clamp + precision | Task 5 |
| Enter / Escape / Arrows / Shift / Alt | Task 6 |
| Disabled + invalid value + dev warn | Task 7 |
| Prefix / custom suffix slots | Task 4 (shape), Task 7 (tests) |
| Pointer-lock scrub | Task 8 |
| Registry entry | Task 9 |
| Coverage config | Task 9 |
| Gradient-editor refactor (5 sites) | Tasks 10–13 |
| Gradient-editor registry dep update | Task 13 |
| basic-usage / scrub / strict-typing examples | Task 14 |
| api-reference + App.tsx wiring | Task 15 |
| README update | Task 16 |
| Full verification | Task 17 |
| Type-level tests | Task 2, Task 3 |
| Behavior tests | Tasks 4, 5, 6, 7 |
| Scrub tests + pointer-lock mocks | Task 8 |

### Placeholder scan

No TBD/TODO/"implement later". Every step contains either the exact code, the exact command, or a directly-actionable instruction with a fallback (e.g. "if Biome flags snake_case, rename" in Task 6; "factor helpers if not exported" in Task 15).

### Type consistency

- `parseNumeric` (Task 4) is replaced by `parseNumericResult` (Task 7). Task 7 explicitly says "replace `parseNumeric` with". ✓
- `props_step` (Task 6) — flagged for potential rename in Task 6 itself. ✓
- `toDeg`/`toPct`/`fromUnitString` helpers — defined in Task 10, used in Tasks 10–13 with consistent names. ✓
- `UnitInput` import path consistent across tasks: `@/components/ui/unit-input`. ✓

### Out-of-scope / external-questions

- Touch / pen scrub gestures — explicitly out of scope per spec.
- Real (un-mocked) pointer-lock browser behavior — manual / E2E only per spec.
- Wrap-around semantics for deg → 0/360 — explicit non-goal per spec.

Plan is complete.
