# `easing-picker` v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the easing-picker — the `ridiculous` registry's third component. Bezier + steps + physics (spring/bounce/wiggle) baked to CSS `linear()` + Penner preset gallery + 6-property animation preview + 3-format output (CSS/Tailwind v3/v4). Type-locked via `basis?` prop. Controlled-only.

**Architecture:** Three files in `src/components/ui/easing-picker/`: `easing-picker.tsx` (all components + parse/format/baking inline), `easing-picker.types.ts` (suggestion strings + `EasingLiteral<S>` + utility types), `index.ts` (barrel). No cross-registry deps (no color surface). Single composed wizard (`EasingPanel`) wrapped in popover (`EasingPicker`); 7 public sub-components for advanced composition.

**Tech Stack:** React 19, TypeScript 5+, Tailwind v4, Vitest + jsdom (canvas mock not required — preview is pure CSS animation, curves are SVG), Biome, pnpm 9.

**Source of design:** `docs/superpowers/specs/2026-05-18-easing-picker-design.md`. Read it first.

**Source of patterns:** the existing `src/components/ui/color-picker/` and `src/components/ui/gradient-editor/` are the references for everything — controlled-only state pattern (color-picker), single-file-with-sub-components convention (both), tier-1 type validators (color-picker types.ts), popover trigger button (both). When a step says "mirror color-picker pattern X", look at the corresponding section of `color-picker.tsx` or `color-picker.types.ts`.

---

## Phase 1 — Scaffolding

### Task 1: Stub the three files

**Files:**
- Create: `src/components/ui/easing-picker/easing-picker.tsx`
- Create: `src/components/ui/easing-picker/easing-picker.types.ts`
- Create: `src/components/ui/easing-picker/index.ts`

- [ ] **Step 1: Create `easing-picker.tsx` stub**

```tsx
"use client"

// ---------------------------------------------------------------------------
// Component (top of file — filled in Phase 9)
// ---------------------------------------------------------------------------

export function EasingPicker() {
  return null
}

// ---------------------------------------------------------------------------
// Composed: EasingPanel (filled in Phase 8)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sub-components (filled in Phases 3-7)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Parsing / formatting (Phase 2)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Physics samplers + baking (Phase 5)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Preset table (Phase 3)
// ---------------------------------------------------------------------------
```

- [ ] **Step 2: Create `easing-picker.types.ts` empty stub**

```ts
// =====================================================================
// 1. PRIMITIVES — private helpers, not exported (Phase 2)
// =====================================================================

// =====================================================================
// 2. STRICT VALIDATORS — exported, generic (Phase 2)
// =====================================================================

// =====================================================================
// 3. SUGGESTION STRINGS — non-generic, for IntelliSense + onChange (Phase 2)
// =====================================================================

// =====================================================================
// 4. UTILITY TYPES (Phase 2)
// =====================================================================

// =====================================================================
// 5. INTERNAL STATE (Phase 2)
// =====================================================================
```

- [ ] **Step 3: Create `index.ts` minimal barrel**

```ts
export { EasingPicker } from "./easing-picker"
```

- [ ] **Step 4: Verify typecheck passes**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/easing-picker/
git commit -m "Stub easing-picker module with section comments"
```

---

## Phase 2 — Type system

### Task 2: Type primitives (private helpers)

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.types.ts`

Duplicates the few primitives from `color-picker.types.ts` rather than importing — keeps registry items independent. New primitive: `IsPositiveInt` for `steps(n)` validation.

- [ ] **Step 1: Insert primitives block under section 1**

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

type Enumerate<
  N extends number,
  A extends number[] = [],
> = A["length"] extends N ? A[number] : Enumerate<N, [...A, A["length"]]>

type IntRange<From extends number, To extends number> = Exclude<
  Enumerate<To>,
  Enumerate<From>
>

type StripLeadingZeros<S extends string> = S extends `0${infer R}`
  ? R extends ""
    ? "0"
    : StripLeadingZeros<R>
  : S

type NormalizeInt<S extends string> = S extends "" ? "0" : StripLeadingZeros<S>

type IsIntPart<S extends string> = S extends ""
  ? true
  : NonEmptyAllChars<S, Digit>

type And<A extends boolean, B extends boolean> = A extends true
  ? B extends true
    ? true
    : false
  : false

type Or<A extends boolean, B extends boolean> = A extends true
  ? true
  : B extends true
    ? true
    : false

type KeepIf<B extends boolean, S extends string> = B extends true ? S : never

type IsNumber0To1<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>> extends true
    ? NormalizeInt<I> extends "0"
      ? true
      : NormalizeInt<I> extends "1"
        ? AllChars<F, "0">
        : false
    : false
  : NonEmptyAllChars<S, Digit> extends true
    ? NormalizeInt<S> extends "0" | "1"
      ? true
      : false
    : false

type IsNonNegativeNumber<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>>
  : NonEmptyAllChars<S, Digit>

type IsSignedDecimal<S extends string> = S extends `-${infer R}`
  ? IsNonNegativeNumber<R>
  : IsNonNegativeNumber<S>

type IsPositiveInt<S extends string> = S extends "0"
  ? false
  : S extends "" | "-"
    ? false
    : NonEmptyAllChars<S, Digit>
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS (no exports yet, just internal types).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.types.ts
git commit -m "Add easing-picker type primitives (duplicated from color-picker)"
```

### Task 3: Suggestion strings + EasingStringMap

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.types.ts`
- Create: `tests/easing-types.test-d.ts`

- [ ] **Step 1: Write failing type-level smoke test in `tests/easing-types.test-d.ts`**

```ts
import { expectTypeOf, test } from "vitest"
import type {
  CubicBezierString,
  EasingBasis,
  EasingKeyword,
  EasingString,
  EasingStringMap,
  LinearString,
  StepPosition,
  StepsString,
} from "@/components/ui/easing-picker/easing-picker.types"

test("EasingKeyword enumerates the 7 CSS keywords", () => {
  expectTypeOf<EasingKeyword>().toEqualTypeOf<
    | "linear"
    | "ease"
    | "ease-in"
    | "ease-out"
    | "ease-in-out"
    | "step-start"
    | "step-end"
  >()
})

test("StepPosition enumerates 6 jump terms", () => {
  expectTypeOf<StepPosition>().toEqualTypeOf<
    | "start"
    | "end"
    | "jump-start"
    | "jump-end"
    | "jump-both"
    | "jump-none"
  >()
})

test("CubicBezierString accepts the comma form", () => {
  expectTypeOf<"cubic-bezier(0.42, 0, 0.58, 1)">().toMatchTypeOf<CubicBezierString>()
})

test("StepsString accepts both arity forms", () => {
  expectTypeOf<"steps(3)">().toMatchTypeOf<StepsString>()
  expectTypeOf<"steps(3, jump-end)">().toMatchTypeOf<StepsString>()
})

test("LinearString accepts any body", () => {
  expectTypeOf<"linear(0, 0.5 50%, 1)">().toMatchTypeOf<LinearString>()
})

test("EasingString unions all four", () => {
  expectTypeOf<EasingString>().toEqualTypeOf<
    EasingKeyword | CubicBezierString | StepsString | LinearString
  >()
})

test("EasingBasis enumerates the 5 basis types", () => {
  expectTypeOf<EasingBasis>().toEqualTypeOf<
    "bezier" | "spring" | "bounce" | "wiggle" | "steps"
  >()
})

test("EasingStringMap maps basis to output string types", () => {
  expectTypeOf<EasingStringMap["bezier"]>().toEqualTypeOf<CubicBezierString>()
  expectTypeOf<EasingStringMap["spring"]>().toEqualTypeOf<LinearString>()
  expectTypeOf<EasingStringMap["steps"]>().toEqualTypeOf<StepsString>()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/easing-types.test-d.ts
```

Expected: FAIL with "Module has no exported member 'EasingKeyword'" etc.

- [ ] **Step 3: Add suggestion strings to `easing-picker.types.ts` (section 3)**

```ts
// =====================================================================
// 3. SUGGESTION STRINGS — non-generic, for IntelliSense + onChange returns
// =====================================================================

/** CSS Easing L1 named keywords. */
export type EasingKeyword =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "step-start"
  | "step-end"

/** `cubic-bezier(x1, y1, x2, y2)` — both comma and space forms. */
export type CubicBezierString =
  | `cubic-bezier(${number}, ${number}, ${number}, ${number})`
  | `cubic-bezier(${number} ${number} ${number} ${number})`

export type StepPosition =
  | "start"
  | "end"
  | "jump-start"
  | "jump-end"
  | "jump-both"
  | "jump-none"

export type StepsString =
  | `steps(${number})`
  | `steps(${number}, ${StepPosition})`

/** `linear()` multi-stop — variadic, weakly suggested. */
export type LinearString = `linear(${string})`

/** Union of every valid easing output. */
export type EasingString =
  | EasingKeyword
  | CubicBezierString
  | StepsString
  | LinearString

/** Basis → output-string type map. Used by `basis?` prop to narrow onChange. */
export interface EasingStringMap {
  bezier: CubicBezierString
  spring: LinearString
  bounce: LinearString
  wiggle: LinearString
  steps: StepsString
}

export type EasingBasis = keyof EasingStringMap
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/easing-types.test-d.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.types.ts tests/easing-types.test-d.ts
git commit -m "Add easing-picker suggestion strings + EasingStringMap"
```

### Task 4: Strict literal validators + `easing()` helper

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.types.ts`
- Modify: `tests/easing-types.test-d.ts`

- [ ] **Step 1: Append failing validator tests to `tests/easing-types.test-d.ts`**

```ts
import type { EasingLiteral } from "@/components/ui/easing-picker/easing-picker.types"
import { easing } from "@/components/ui/easing-picker/easing-picker.types"

test("EasingLiteral accepts CSS keywords", () => {
  expectTypeOf<EasingLiteral<"ease">>().toEqualTypeOf<"ease">()
  expectTypeOf<EasingLiteral<"ease-in-out">>().toEqualTypeOf<"ease-in-out">()
})

test("EasingLiteral accepts cubic-bezier with x ∈ [0,1]", () => {
  expectTypeOf<
    EasingLiteral<"cubic-bezier(0.42, 0, 0.58, 1)">
  >().toEqualTypeOf<"cubic-bezier(0.42, 0, 0.58, 1)">()
})

test("EasingLiteral allows overshoot y (signed decimal)", () => {
  expectTypeOf<
    EasingLiteral<"cubic-bezier(0.5, -0.5, 0.5, 1.5)">
  >().toEqualTypeOf<"cubic-bezier(0.5, -0.5, 0.5, 1.5)">()
})

test("EasingLiteral rejects cubic-bezier with x1 > 1", () => {
  expectTypeOf<EasingLiteral<"cubic-bezier(2, 0, 0.5, 1)">>().toBeNever()
})

test("EasingLiteral accepts steps with and without position", () => {
  expectTypeOf<EasingLiteral<"steps(3)">>().toEqualTypeOf<"steps(3)">()
  expectTypeOf<EasingLiteral<"steps(4, jump-end)">>().toEqualTypeOf<
    "steps(4, jump-end)"
  >()
})

test("EasingLiteral rejects steps with non-positive n", () => {
  expectTypeOf<EasingLiteral<"steps(0)">>().toBeNever()
})

test("easing() helper validates at call site", () => {
  const a = easing("cubic-bezier(0.42, 0, 0.58, 1)")
  expectTypeOf(a).toEqualTypeOf<"cubic-bezier(0.42, 0, 0.58, 1)">()

  // @ts-expect-error — x1 > 1
  easing("cubic-bezier(2, 0, 0.5, 1)")

  // @ts-expect-error — not a known easing
  easing("garbage")
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/easing-types.test-d.ts
```

Expected: FAIL with missing-export errors.

- [ ] **Step 3: Add strict validators to `easing-picker.types.ts` (section 2)**

```ts
// =====================================================================
// 2. STRICT VALIDATORS — exported, generic. Used by easing() helper.
// =====================================================================

/** Named CSS Easing L1 keyword. */
export type EasingKeywordLiteral<S extends string> = S extends EasingKeyword
  ? S
  : never

/** `cubic-bezier(x1, y1, x2, y2)` — x ∈ [0,1], y signed (overshoot OK). */
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

/** `steps(n)` or `steps(n, position)` — n positive integer. */
export type StepsLiteral<S extends string> =
  S extends `steps(${infer N}, ${infer P})`
    ? P extends StepPosition
      ? KeepIf<IsPositiveInt<Trim<N>>, S>
      : never
    : S extends `steps(${infer N})`
      ? KeepIf<IsPositiveInt<Trim<N>>, S>
      : never

/**
 * `linear()` — weak validation. Variadic stop range-checking at the type
 * level would blow up compile time. Runtime parser does real validation.
 */
export type LinearLiteral<S extends string> = S extends `linear(${infer Body})`
  ? Trim<Body> extends ""
    ? never
    : S
  : never

/** Union — accepts any valid CSS easing function or keyword. */
export type EasingLiteral<S extends string> =
  | EasingKeywordLiteral<S>
  | CubicBezierLiteral<S>
  | StepsLiteral<S>
  | LinearLiteral<S>

/** Call-site validator helper. Mirrors `color()` from color-picker. */
export const easing = <S extends string>(value: S & EasingLiteral<S>): S => value
```

Note: The validators reference suggestion-string types (`EasingKeyword`, `StepPosition`) defined in section 3. TypeScript hoists type declarations regardless of file order, so the section-2-before-section-3 layout works. Keep section 3 below section 2 for parity with `color-picker.types.ts`.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/easing-types.test-d.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.types.ts tests/easing-types.test-d.ts
git commit -m "Add EasingLiteral validators + easing() helper"
```

### Task 5: Utility types + EasingState

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.types.ts`
- Modify: `tests/easing-types.test-d.ts`

- [ ] **Step 1: Append failing utility-type tests**

```ts
import type {
  BasisOfString,
  EasingState,
  FunctionOf,
} from "@/components/ui/easing-picker/easing-picker.types"

test("FunctionOf resolves to function family", () => {
  expectTypeOf<FunctionOf<"cubic-bezier(0,0,1,1)">>().toEqualTypeOf<"bezier">()
  expectTypeOf<FunctionOf<"steps(4, jump-end)">>().toEqualTypeOf<"steps">()
  expectTypeOf<FunctionOf<"linear(0, 1)">>().toEqualTypeOf<"linear">()
  expectTypeOf<FunctionOf<"ease-in">>().toEqualTypeOf<"bezier">()
  expectTypeOf<FunctionOf<"step-start">>().toEqualTypeOf<"steps">()
  expectTypeOf<FunctionOf<"garbage">>().toBeNever()
})

test("BasisOfString returns ambiguous union for linear()", () => {
  expectTypeOf<BasisOfString<"linear(0, 0.5, 1)">>().toEqualTypeOf<
    "spring" | "bounce" | "wiggle"
  >()
  expectTypeOf<BasisOfString<"cubic-bezier(0.5, 0, 0.5, 1)">>().toEqualTypeOf<"bezier">()
  expectTypeOf<BasisOfString<"steps(3)">>().toEqualTypeOf<"steps">()
})

test("EasingState discriminates by basis", () => {
  const bezier: EasingState = {
    basis: "bezier",
    x1: 0.42,
    y1: 0,
    x2: 0.58,
    y2: 1,
    extraTop: 0.25,
    extraBottom: 0.25,
  }
  const spring: EasingState = {
    basis: "spring",
    stiffness: 100,
    damping: 10,
    mass: 1,
  }
  expectTypeOf(bezier.basis).toEqualTypeOf<"bezier" | "spring" | "bounce" | "wiggle" | "steps">()
  expectTypeOf(spring.basis).toEqualTypeOf<"bezier" | "spring" | "bounce" | "wiggle" | "steps">()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/easing-types.test-d.ts
```

Expected: FAIL with missing-export errors.

- [ ] **Step 3: Add utility types + state to `easing-picker.types.ts` (sections 4 + 5)**

```ts
// =====================================================================
// 4. UTILITY TYPES — operate on easing literals at the type level.
// =====================================================================

/**
 * Extract CSS function type from a literal at the type level.
 *
 * @example
 * type T1 = FunctionOf<"cubic-bezier(0,0,1,1)">  // "bezier"
 * type T2 = FunctionOf<"steps(3)">                // "steps"
 * type T3 = FunctionOf<"ease-in">                 // "bezier"
 * type T4 = FunctionOf<"step-start">              // "steps"
 */
export type FunctionOf<S extends string> = S extends `cubic-bezier(${string}`
  ? "bezier"
  : S extends `steps(${string}`
    ? "steps"
    : S extends `linear(${string}`
      ? "linear"
      : S extends "step-start" | "step-end"
        ? "steps"
        : S extends EasingKeyword
          ? "bezier"
          : never

/**
 * Extract basis from a literal. Note: `linear()` output is ambiguous —
 * baking erases the physics type, so spring/bounce/wiggle all collapse.
 */
export type BasisOfString<S extends string> = S extends LinearString
  ? "spring" | "bounce" | "wiggle"
  : S extends CubicBezierString | EasingKeyword
    ? "bezier"
    : S extends StepsString
      ? "steps"
      : never

// =====================================================================
// 5. INTERNAL STATE — discriminated union, source of truth in the editor.
//    Exported for advanced use cases (custom serialization, dehydration).
// =====================================================================

export type EasingState =
  | {
      basis: "bezier"
      x1: number
      y1: number
      x2: number
      y2: number
      extraTop: number
      extraBottom: number
    }
  | { basis: "spring"; stiffness: number; damping: number; mass: number }
  | { basis: "bounce"; bounces: number; stiffness: number }
  | { basis: "wiggle"; wiggles: number; damping: number }
  | { basis: "steps"; n: number; position: StepPosition }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/easing-types.test-d.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.types.ts tests/easing-types.test-d.ts
git commit -m "Add FunctionOf/BasisOfString utility types + EasingState union"
```

---

## Phase 3 — Parser + serializer

### Task 6: `parseEasing` runtime parser

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx`
- Create: `tests/easing-parse.test.ts`

The parser converts any `EasingString` into an `EasingState`. Returns `null` for garbage input (matches `parseColor` from color-picker).

- [ ] **Step 1: Create `tests/easing-parse.test.ts` with full coverage**

```ts
import { describe, expect, test } from "vitest"
import { parseEasing } from "@/components/ui/easing-picker/easing-picker"
import type { EasingState } from "@/components/ui/easing-picker/easing-picker.types"

describe("parseEasing", () => {
  test("parses all 7 CSS keywords", () => {
    expect(parseEasing("linear")).toEqual<EasingState>({
      basis: "bezier",
      x1: 0,
      y1: 0,
      x2: 1,
      y2: 1,
      extraTop: 0.25,
      extraBottom: 0.25,
    })
    expect(parseEasing("ease")).toMatchObject({ basis: "bezier", x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 })
    expect(parseEasing("ease-in")).toMatchObject({ basis: "bezier", x1: 0.42, y1: 0, x2: 1, y2: 1 })
    expect(parseEasing("ease-out")).toMatchObject({ basis: "bezier", x1: 0, y1: 0, x2: 0.58, y2: 1 })
    expect(parseEasing("ease-in-out")).toMatchObject({ basis: "bezier", x1: 0.42, y1: 0, x2: 0.58, y2: 1 })
    expect(parseEasing("step-start")).toEqual<EasingState>({ basis: "steps", n: 1, position: "jump-start" })
    expect(parseEasing("step-end")).toEqual<EasingState>({ basis: "steps", n: 1, position: "jump-end" })
  })

  test("parses cubic-bezier in comma form", () => {
    expect(parseEasing("cubic-bezier(0.42, 0, 0.58, 1)")).toMatchObject({
      basis: "bezier",
      x1: 0.42,
      y1: 0,
      x2: 0.58,
      y2: 1,
    })
  })

  test("parses cubic-bezier in space form", () => {
    expect(parseEasing("cubic-bezier(0.42 0 0.58 1)")).toMatchObject({
      basis: "bezier",
      x1: 0.42,
      y1: 0,
      x2: 0.58,
      y2: 1,
    })
  })

  test("parses overshoot bezier (y > 1, y < 0)", () => {
    expect(parseEasing("cubic-bezier(0.5, -0.5, 0.5, 1.5)")).toMatchObject({
      basis: "bezier",
      x1: 0.5,
      y1: -0.5,
      x2: 0.5,
      y2: 1.5,
    })
  })

  test("parses steps with position", () => {
    expect(parseEasing("steps(4, jump-end)")).toEqual<EasingState>({
      basis: "steps",
      n: 4,
      position: "jump-end",
    })
  })

  test("parses steps without position (defaults to end)", () => {
    expect(parseEasing("steps(3)")).toEqual<EasingState>({
      basis: "steps",
      n: 3,
      position: "end",
    })
  })

  test("parses linear() as a degenerate spring state", () => {
    // linear() output cannot recover physics params; we restore default spring
    // params and flag the raw string so the OutputPanel can re-emit it as-is.
    const result = parseEasing("linear(0, 0.5 50%, 1)")
    expect(result).not.toBeNull()
    expect(result?.basis).toBe("spring")
  })

  test("returns null for garbage", () => {
    expect(parseEasing("garbage")).toBeNull()
    expect(parseEasing("")).toBeNull()
    expect(parseEasing("cubic-bezier(abc)")).toBeNull()
    expect(parseEasing("steps()")).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/easing-parse.test.ts
```

Expected: FAIL with "parseEasing is not a function".

- [ ] **Step 3: Implement `parseEasing` in `easing-picker.tsx`**

Insert under the "Parsing / formatting" section comment:

```ts
import type {
  EasingState,
  EasingString,
  StepPosition,
} from "./easing-picker.types"

const KEYWORD_BEZIER: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
}

const STEP_POSITIONS: ReadonlySet<StepPosition> = new Set([
  "start",
  "end",
  "jump-start",
  "jump-end",
  "jump-both",
  "jump-none",
])

const DEFAULT_EXTRA = 0.25

const DEFAULT_SPRING = { stiffness: 100, damping: 10, mass: 1 } as const

function parseNumber(s: string): number | null {
  const t = s.trim()
  if (t === "" || t === "-") return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function parseEasing(value: string): EasingState | null {
  const v = value.trim()

  // Keywords
  if (v in KEYWORD_BEZIER) {
    const [x1, y1, x2, y2] = KEYWORD_BEZIER[v]
    return {
      basis: "bezier",
      x1,
      y1,
      x2,
      y2,
      extraTop: DEFAULT_EXTRA,
      extraBottom: DEFAULT_EXTRA,
    }
  }
  if (v === "step-start") return { basis: "steps", n: 1, position: "jump-start" }
  if (v === "step-end") return { basis: "steps", n: 1, position: "jump-end" }

  // cubic-bezier(...)
  const cb = v.match(/^cubic-bezier\((.+)\)$/)
  if (cb) {
    const body = cb[1]
    const parts = body.includes(",")
      ? body.split(",").map((p) => p.trim())
      : body.split(/\s+/).filter(Boolean)
    if (parts.length !== 4) return null
    const nums = parts.map(parseNumber)
    if (nums.some((n) => n === null)) return null
    const [x1, y1, x2, y2] = nums as [number, number, number, number]
    if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) return null
    return {
      basis: "bezier",
      x1,
      y1,
      x2,
      y2,
      extraTop: DEFAULT_EXTRA,
      extraBottom: DEFAULT_EXTRA,
    }
  }

  // steps(...)
  const st = v.match(/^steps\((.+)\)$/)
  if (st) {
    const body = st[1]
    const parts = body.split(",").map((p) => p.trim())
    if (parts.length < 1 || parts.length > 2) return null
    const n = parseNumber(parts[0])
    if (n === null || !Number.isInteger(n) || n < 1) return null
    if (parts.length === 1) return { basis: "steps", n, position: "end" }
    const pos = parts[1] as StepPosition
    if (!STEP_POSITIONS.has(pos)) return null
    return { basis: "steps", n, position: pos }
  }

  // linear(...)
  const ln = v.match(/^linear\((.+)\)$/)
  if (ln) {
    const body = ln[1].trim()
    if (body === "") return null
    return { basis: "spring", ...DEFAULT_SPRING }
  }

  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/easing-parse.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.tsx tests/easing-parse.test.ts
git commit -m "Add parseEasing runtime parser"
```

### Task 7: `formatEasing` runtime serializer

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx`
- Create: `tests/easing-format.test.ts`

`formatEasing(state)` emits CSS-valid string. Bezier → `cubic-bezier(...)` comma form. Steps → `steps(n)` or `steps(n, position)`. Spring/bounce/wiggle → `linear(...)` via samplers (deferred to Task 13). For now, format only bezier + steps; physics emission filled in Phase 5.

- [ ] **Step 1: Create `tests/easing-format.test.ts`**

```ts
import { describe, expect, test } from "vitest"
import { formatEasing } from "@/components/ui/easing-picker/easing-picker"

describe("formatEasing", () => {
  test("formats bezier with comma form, 4 decimals, trailing zeros stripped", () => {
    expect(
      formatEasing({
        basis: "bezier",
        x1: 0.42,
        y1: 0,
        x2: 0.58,
        y2: 1,
        extraTop: 0.25,
        extraBottom: 0.25,
      }),
    ).toBe("cubic-bezier(0.42, 0, 0.58, 1)")
  })

  test("formats bezier preserving overshoot", () => {
    expect(
      formatEasing({
        basis: "bezier",
        x1: 0.5,
        y1: -0.5,
        x2: 0.5,
        y2: 1.5,
        extraTop: 0.5,
        extraBottom: 0.5,
      }),
    ).toBe("cubic-bezier(0.5, -0.5, 0.5, 1.5)")
  })

  test("formats steps with default position omits second arg", () => {
    expect(formatEasing({ basis: "steps", n: 3, position: "end" })).toBe(
      "steps(3)",
    )
  })

  test("formats steps with non-default position emits both", () => {
    expect(formatEasing({ basis: "steps", n: 4, position: "jump-end" })).toBe(
      "steps(4, jump-end)",
    )
  })

  test("rounds bezier coords to 4 decimals", () => {
    expect(
      formatEasing({
        basis: "bezier",
        x1: 0.123456789,
        y1: 0,
        x2: 0.987654321,
        y2: 1,
        extraTop: 0.25,
        extraBottom: 0.25,
      }),
    ).toBe("cubic-bezier(0.1235, 0, 0.9877, 1)")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/easing-format.test.ts
```

Expected: FAIL with "formatEasing is not a function".

- [ ] **Step 3: Implement `formatEasing` in `easing-picker.tsx`**

Append under `parseEasing`:

```ts
/** Round to up to 4 decimal places, strip trailing zeros + bare decimal point. */
function fmtNum(n: number): string {
  const rounded = Math.round(n * 10000) / 10000
  return rounded.toString()
}

export function formatEasing(state: EasingState): EasingString {
  switch (state.basis) {
    case "bezier": {
      const { x1, y1, x2, y2 } = state
      return `cubic-bezier(${fmtNum(x1)}, ${fmtNum(y1)}, ${fmtNum(x2)}, ${fmtNum(y2)})`
    }
    case "steps": {
      const { n, position } = state
      return position === "end" ? `steps(${n})` : `steps(${n}, ${position})`
    }
    case "spring":
    case "bounce":
    case "wiggle": {
      // Filled in Phase 5 (Task 13/14/15)
      return "linear(0, 1)" as const
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/easing-format.test.ts
```

Expected: PASS (physics branches return placeholder for now).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.tsx tests/easing-format.test.ts
git commit -m "Add formatEasing serializer (bezier + steps; physics stubbed)"
```

---

## Phase 4 — Preset table + PresetGallery

### Task 8: PRESETS table + match detection

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx`
- Modify: `src/components/ui/easing-picker/easing-picker.types.ts`
- Create: `tests/easing-presets.test.ts`

Coefficients from easings.net (Penner equivalents). 39 entries: 5 CSS keywords + 32 polynomial × direction + 2 special.

- [ ] **Step 1: Add `PresetName` type to types.ts (under section 3, after `EasingBasis`)**

```ts
export type PolynomialFamily =
  | "Sine"
  | "Quad"
  | "Cubic"
  | "Quart"
  | "Quint"
  | "Expo"
  | "Circ"
  | "Back"

export type Direction = "In" | "Out" | "InOut" | "OutIn"

export type PresetName =
  | EasingKeyword
  | `ease${Direction}${PolynomialFamily}`
  | "anticipate"
  | "smoothStep"
```

- [ ] **Step 2: Create `tests/easing-presets.test.ts`**

```ts
import { describe, expect, test } from "vitest"
import {
  PRESETS,
  bezierFromPreset,
  matchPreset,
} from "@/components/ui/easing-picker/easing-picker"

describe("PRESETS table", () => {
  test("contains the 5 CSS keyword entries with canonical coefficients", () => {
    expect(PRESETS.find((p) => p.name === "linear")?.bezier).toEqual([0, 0, 1, 1])
    expect(PRESETS.find((p) => p.name === "ease")?.bezier).toEqual([0.25, 0.1, 0.25, 1])
    expect(PRESETS.find((p) => p.name === "ease-in")?.bezier).toEqual([0.42, 0, 1, 1])
    expect(PRESETS.find((p) => p.name === "ease-out")?.bezier).toEqual([0, 0, 0.58, 1])
    expect(PRESETS.find((p) => p.name === "ease-in-out")?.bezier).toEqual([0.42, 0, 0.58, 1])
  })

  test("has no duplicate names", () => {
    const names = PRESETS.map((p) => p.name)
    expect(new Set(names).size).toBe(names.length)
  })

  test("every preset has x1, x2 in [0, 1]", () => {
    for (const p of PRESETS) {
      expect(p.bezier[0]).toBeGreaterThanOrEqual(0)
      expect(p.bezier[0]).toBeLessThanOrEqual(1)
      expect(p.bezier[2]).toBeGreaterThanOrEqual(0)
      expect(p.bezier[2]).toBeLessThanOrEqual(1)
    }
  })

  test("polynomial set covers 8 families × 4 directions = 32 entries", () => {
    const polyCount = PRESETS.filter((p) => p.family && p.direction).length
    expect(polyCount).toBe(32)
  })
})

describe("bezierFromPreset", () => {
  test("returns the underlying cubic-bezier literal", () => {
    expect(bezierFromPreset("ease")).toBe("cubic-bezier(0.25, 0.1, 0.25, 1)")
    expect(bezierFromPreset("easeOutQuart")).toMatch(/^cubic-bezier\(/)
  })
})

describe("matchPreset", () => {
  test("matches exact coefficients", () => {
    expect(matchPreset(0.25, 0.1, 0.25, 1)).toBe("ease")
    expect(matchPreset(0.42, 0, 1, 1)).toBe("ease-in")
  })

  test("matches within 0.005 tolerance", () => {
    expect(matchPreset(0.252, 0.099, 0.249, 1.001)).toBe("ease")
  })

  test("returns null when no preset within tolerance", () => {
    expect(matchPreset(0.7, 0.3, 0.4, 0.8)).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm test tests/easing-presets.test.ts
```

Expected: FAIL with missing exports.

- [ ] **Step 4: Implement preset table + helpers in `easing-picker.tsx`**

Insert under "Preset table" section:

```ts
import type {
  PresetName,
  PolynomialFamily,
  Direction,
} from "./easing-picker.types"

interface PresetEntry {
  readonly name: PresetName
  readonly bezier: readonly [number, number, number, number]
  readonly family?: PolynomialFamily
  readonly direction?: Direction
}

export const PRESETS: readonly PresetEntry[] = [
  // CSS keywords (5)
  { name: "linear", bezier: [0, 0, 1, 1] },
  { name: "ease", bezier: [0.25, 0.1, 0.25, 1] },
  { name: "ease-in", bezier: [0.42, 0, 1, 1] },
  { name: "ease-out", bezier: [0, 0, 0.58, 1] },
  { name: "ease-in-out", bezier: [0.42, 0, 0.58, 1] },

  // Sine
  { name: "easeInSine", bezier: [0.12, 0, 0.39, 0], family: "Sine", direction: "In" },
  { name: "easeOutSine", bezier: [0.61, 1, 0.88, 1], family: "Sine", direction: "Out" },
  { name: "easeInOutSine", bezier: [0.37, 0, 0.63, 1], family: "Sine", direction: "InOut" },
  { name: "easeOutInSine", bezier: [0.45, 1, 0.55, 0], family: "Sine", direction: "OutIn" },

  // Quad
  { name: "easeInQuad", bezier: [0.11, 0, 0.5, 0], family: "Quad", direction: "In" },
  { name: "easeOutQuad", bezier: [0.5, 1, 0.89, 1], family: "Quad", direction: "Out" },
  { name: "easeInOutQuad", bezier: [0.45, 0, 0.55, 1], family: "Quad", direction: "InOut" },
  { name: "easeOutInQuad", bezier: [0.5, 1, 0.5, 0], family: "Quad", direction: "OutIn" },

  // Cubic
  { name: "easeInCubic", bezier: [0.32, 0, 0.67, 0], family: "Cubic", direction: "In" },
  { name: "easeOutCubic", bezier: [0.33, 1, 0.68, 1], family: "Cubic", direction: "Out" },
  { name: "easeInOutCubic", bezier: [0.65, 0, 0.35, 1], family: "Cubic", direction: "InOut" },
  { name: "easeOutInCubic", bezier: [0.5, 1, 0.5, 0], family: "Cubic", direction: "OutIn" },

  // Quart
  { name: "easeInQuart", bezier: [0.5, 0, 0.75, 0], family: "Quart", direction: "In" },
  { name: "easeOutQuart", bezier: [0.25, 1, 0.5, 1], family: "Quart", direction: "Out" },
  { name: "easeInOutQuart", bezier: [0.76, 0, 0.24, 1], family: "Quart", direction: "InOut" },
  { name: "easeOutInQuart", bezier: [0.5, 1, 0.5, 0], family: "Quart", direction: "OutIn" },

  // Quint
  { name: "easeInQuint", bezier: [0.64, 0, 0.78, 0], family: "Quint", direction: "In" },
  { name: "easeOutQuint", bezier: [0.22, 1, 0.36, 1], family: "Quint", direction: "Out" },
  { name: "easeInOutQuint", bezier: [0.83, 0, 0.17, 1], family: "Quint", direction: "InOut" },
  { name: "easeOutInQuint", bezier: [0.5, 1, 0.5, 0], family: "Quint", direction: "OutIn" },

  // Expo
  { name: "easeInExpo", bezier: [0.7, 0, 0.84, 0], family: "Expo", direction: "In" },
  { name: "easeOutExpo", bezier: [0.16, 1, 0.3, 1], family: "Expo", direction: "Out" },
  { name: "easeInOutExpo", bezier: [0.87, 0, 0.13, 1], family: "Expo", direction: "InOut" },
  { name: "easeOutInExpo", bezier: [0.5, 1, 0.5, 0], family: "Expo", direction: "OutIn" },

  // Circ
  { name: "easeInCirc", bezier: [0.55, 0, 1, 0.45], family: "Circ", direction: "In" },
  { name: "easeOutCirc", bezier: [0, 0.55, 0.45, 1], family: "Circ", direction: "Out" },
  { name: "easeInOutCirc", bezier: [0.85, 0, 0.15, 1], family: "Circ", direction: "InOut" },
  { name: "easeOutInCirc", bezier: [0.5, 1, 0.5, 0], family: "Circ", direction: "OutIn" },

  // Back (overshoot)
  { name: "easeInBack", bezier: [0.36, 0, 0.66, -0.56], family: "Back", direction: "In" },
  { name: "easeOutBack", bezier: [0.34, 1.56, 0.64, 1], family: "Back", direction: "Out" },
  { name: "easeInOutBack", bezier: [0.68, -0.6, 0.32, 1.6], family: "Back", direction: "InOut" },
  { name: "easeOutInBack", bezier: [0.5, 1.6, 0.5, -0.6], family: "Back", direction: "OutIn" },

  // Special
  { name: "anticipate", bezier: [0.45, -0.5, 0.55, 1] },
  { name: "smoothStep", bezier: [0.45, 0, 0.55, 1] },
] as const

export function bezierFromPreset(name: PresetName): string {
  const preset = PRESETS.find((p) => p.name === name)
  if (!preset) throw new Error(`Unknown preset: ${name}`)
  const [x1, y1, x2, y2] = preset.bezier
  return `cubic-bezier(${fmtNum(x1)}, ${fmtNum(y1)}, ${fmtNum(x2)}, ${fmtNum(y2)})`
}

const PRESET_MATCH_TOLERANCE = 0.005

export function matchPreset(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): PresetName | null {
  for (const p of PRESETS) {
    const [px1, py1, px2, py2] = p.bezier
    const dx1 = Math.abs(x1 - px1)
    const dy1 = Math.abs(y1 - py1)
    const dx2 = Math.abs(x2 - px2)
    const dy2 = Math.abs(y2 - py2)
    if (
      dx1 < PRESET_MATCH_TOLERANCE &&
      dy1 < PRESET_MATCH_TOLERANCE &&
      dx2 < PRESET_MATCH_TOLERANCE &&
      dy2 < PRESET_MATCH_TOLERANCE
    ) {
      return p.name
    }
  }
  return null
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm test tests/easing-presets.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.tsx src/components/ui/easing-picker/easing-picker.types.ts tests/easing-presets.test.ts
git commit -m "Add PRESETS table + bezierFromPreset + matchPreset"
```

### Task 9: PresetGallery component

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx`

- [ ] **Step 1: Implement `PresetGallery` in `easing-picker.tsx`**

Append under "Sub-components" section:

```tsx
import { cn } from "@/lib/utils"

export interface PresetGalleryProps {
  value?: PresetName
  onChange: (preset: PresetName, bezier: string) => void
  className?: string
}

function PresetThumb({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const path = `M 0 32 C ${x1 * 48} ${(1 - y1) * 32}, ${x2 * 48} ${(1 - y2) * 32}, 48 0`
  return (
    <svg viewBox="0 0 48 32" className="size-full">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function PresetGallery({
  value,
  onChange,
  className,
}: PresetGalleryProps) {
  const keywords = PRESETS.filter((p) => !p.family && p.name !== "anticipate" && p.name !== "smoothStep")
  const polynomials = PRESETS.filter((p) => p.family)
  const specials = PRESETS.filter((p) => p.name === "anticipate" || p.name === "smoothStep")

  return (
    <div className={cn("space-y-3", className)}>
      <PresetRow label="Keywords" presets={keywords} value={value} onChange={onChange} />
      <PresetGrid presets={polynomials} value={value} onChange={onChange} />
      <PresetRow label="Special" presets={specials} value={value} onChange={onChange} />
    </div>
  )
}

function PresetRow({
  label,
  presets,
  value,
  onChange,
}: {
  label: string
  presets: readonly PresetEntry[]
  value?: PresetName
  onChange: (preset: PresetName, bezier: string) => void
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <PresetCard key={p.name} preset={p} active={value === p.name} onClick={() => onChange(p.name, bezierFromPreset(p.name))} />
        ))}
      </div>
    </div>
  )
}

function PresetGrid({
  presets,
  value,
  onChange,
}: {
  presets: readonly PresetEntry[]
  value?: PresetName
  onChange: (preset: PresetName, bezier: string) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-1">
      {presets.map((p) => (
        <PresetCard key={p.name} preset={p} active={value === p.name} onClick={() => onChange(p.name, bezierFromPreset(p.name))} />
      ))}
    </div>
  )
}

function PresetCard({
  preset,
  active,
  onClick,
}: {
  preset: PresetEntry
  active: boolean
  onClick: () => void
}) {
  const [x1, y1, x2, y2] = preset.bezier
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 p-1.5 rounded text-xs border transition-colors",
        active
          ? "bg-accent border-accent-foreground/20"
          : "bg-transparent border-transparent hover:bg-accent/50",
      )}
      title={preset.name}
    >
      <div className="size-10 text-muted-foreground">
        <PresetThumb x1={x1} y1={y1} x2={x2} y2={y2} />
      </div>
      <span className="text-[10px] truncate w-full text-center">{preset.name}</span>
    </button>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Verify the component renders (smoke test)**

Add to `tests/easing-picker.test.tsx` (create if missing):

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import { PresetGallery } from "@/components/ui/easing-picker/easing-picker"

describe("PresetGallery", () => {
  test("renders 39 preset buttons", () => {
    render(<PresetGallery onChange={() => {}} />)
    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(39)
  })

  test("highlights the active preset", () => {
    render(<PresetGallery value="easeOutQuart" onChange={() => {}} />)
    const active = screen.getByTitle("easeOutQuart")
    expect(active.className).toContain("bg-accent")
  })

  test("fires onChange with name + bezier string on click", () => {
    const onChange = vi.fn()
    render(<PresetGallery onChange={onChange} />)
    screen.getByTitle("ease").click()
    expect(onChange).toHaveBeenCalledWith("ease", "cubic-bezier(0.25, 0.1, 0.25, 1)")
  })
})
```

- [ ] **Step 4: Run test**

```bash
pnpm test tests/easing-picker.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.tsx tests/easing-picker.test.tsx
git commit -m "Add PresetGallery component with SVG thumbnails"
```

---

## Phase 5 — Physics samplers

### Task 10: Spring sampler

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx`
- Create: `tests/easing-baking.test.ts`

Closed-form damped harmonic oscillator. Underdamped (ζ<1) for bouncy, overdamped (ζ≥1) for smooth approach. Sample at N points, stop when settled within ε.

- [ ] **Step 1: Create `tests/easing-baking.test.ts` with spring tests only (extend later)**

```ts
import { describe, expect, test } from "vitest"
import { sampleSpring, bakeLinear } from "@/components/ui/easing-picker/easing-picker"

describe("sampleSpring", () => {
  test("default params produce a monotonic-approaching curve ending near 1", () => {
    const samples = sampleSpring(100, 10, 1, 60)
    expect(samples.length).toBeGreaterThan(10)
    expect(samples[0].y).toBeCloseTo(0, 1)
    expect(samples[samples.length - 1].y).toBeCloseTo(1, 2)
  })

  test("underdamped (low damping) overshoots y=1", () => {
    const samples = sampleSpring(200, 3, 1, 60)
    const maxY = Math.max(...samples.map((s) => s.y))
    expect(maxY).toBeGreaterThan(1)
  })

  test("overdamped (high damping) approaches monotonically without overshoot", () => {
    const samples = sampleSpring(50, 50, 1, 60)
    const maxY = Math.max(...samples.map((s) => s.y))
    expect(maxY).toBeLessThanOrEqual(1.001)
  })
})

describe("bakeLinear", () => {
  test("emits valid linear() with comma-separated stops + percentage anchors", () => {
    const result = bakeLinear([
      { y: 0, t: 0 },
      { y: 0.5, t: 0.5 },
      { y: 1, t: 1 },
    ])
    expect(result).toBe("linear(0, 0.5 50%, 1)")
  })

  test("first and last stops omit percentage anchors", () => {
    const result = bakeLinear([
      { y: 0, t: 0 },
      { y: 1, t: 1 },
    ])
    expect(result).toBe("linear(0, 1)")
  })

  test("prunes collinear stops within tolerance", () => {
    const result = bakeLinear([
      { y: 0, t: 0 },
      { y: 0.5, t: 0.5 },
      { y: 0.5001, t: 0.5001 },
      { y: 1, t: 1 },
    ])
    // 0.5 and 0.5001 are collinear with 0→1; the middle one stays as the
    // hinge, the redundant one is dropped.
    expect(result.split(",").length).toBeLessThanOrEqual(3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/easing-baking.test.ts
```

Expected: FAIL with missing-export errors.

- [ ] **Step 3: Implement `sampleSpring` + `bakeLinear` in `easing-picker.tsx`**

Append under "Physics samplers" section:

```ts
export interface Sample {
  y: number
  t: number
}

const SETTLE_EPSILON = 0.001

export function sampleSpring(
  stiffness: number,
  damping: number,
  mass: number,
  samples: number,
): Sample[] {
  const k = stiffness
  const c = damping
  const m = mass
  const w0 = Math.sqrt(k / m)
  const zeta = c / (2 * Math.sqrt(k * m))

  // Total simulation time scales inversely with natural frequency.
  // Pick a window long enough for the curve to settle.
  const tMax = Math.max(3 / (zeta * w0), 5) // seconds-equivalent; normalized below
  const dt = tMax / samples

  const out: Sample[] = []
  for (let i = 0; i < samples; i++) {
    const t = i * dt
    let y: number
    if (zeta < 1) {
      // Underdamped
      const wd = w0 * Math.sqrt(1 - zeta * zeta)
      y =
        1 -
        Math.exp(-zeta * w0 * t) *
          (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
    } else if (zeta === 1) {
      // Critically damped
      y = 1 - Math.exp(-w0 * t) * (1 + w0 * t)
    } else {
      // Overdamped
      const r1 = -w0 * (zeta - Math.sqrt(zeta * zeta - 1))
      const r2 = -w0 * (zeta + Math.sqrt(zeta * zeta - 1))
      y = 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1)
    }
    out.push({ y, t: i / (samples - 1) })
    // Early-exit once settled within epsilon for several consecutive samples
    if (
      i > samples / 4 &&
      Math.abs(y - 1) < SETTLE_EPSILON &&
      out.slice(-3).every((s) => Math.abs(s.y - 1) < SETTLE_EPSILON)
    ) {
      // Force last sample to exactly 1, t=1
      out[out.length - 1] = { y: 1, t: 1 }
      break
    }
  }
  // Always force endpoint t=1, y=1
  if (out[out.length - 1].t < 1) out.push({ y: 1, t: 1 })
  return out
}

const PRUNE_TOLERANCE = 0.005

/** Drop stops that fall on the line between their neighbors within tolerance. */
function pruneCollinear(samples: Sample[]): Sample[] {
  if (samples.length <= 2) return samples
  const out: Sample[] = [samples[0]]
  for (let i = 1; i < samples.length - 1; i++) {
    const prev = out[out.length - 1]
    const curr = samples[i]
    const next = samples[i + 1]
    const slope = (next.y - prev.y) / (next.t - prev.t)
    const expectedY = prev.y + slope * (curr.t - prev.t)
    if (Math.abs(curr.y - expectedY) >= PRUNE_TOLERANCE) {
      out.push(curr)
    }
  }
  out.push(samples[samples.length - 1])
  return out
}

export function bakeLinear(samples: Sample[]): string {
  const pruned = pruneCollinear(samples)
  const parts = pruned.map((s, i) => {
    if (i === 0 || i === pruned.length - 1) return fmtNum(s.y)
    return `${fmtNum(s.y)} ${fmtNum(s.t * 100)}%`
  })
  return `linear(${parts.join(", ")})`
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/easing-baking.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.tsx tests/easing-baking.test.ts
git commit -m "Add sampleSpring + bakeLinear with collinear-prune pass"
```

### Task 11: Bounce + Wiggle samplers

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx`
- Modify: `tests/easing-baking.test.ts`

- [ ] **Step 1: Append bounce + wiggle tests**

```ts
import { sampleBounce, sampleWiggle } from "@/components/ui/easing-picker/easing-picker"

describe("sampleBounce", () => {
  test("produces N local minima for N bounces", () => {
    const samples = sampleBounce(3, 0.5)
    const minima: number[] = []
    for (let i = 1; i < samples.length - 1; i++) {
      if (samples[i].y < samples[i - 1].y && samples[i].y < samples[i + 1].y) {
        minima.push(i)
      }
    }
    // Bounces produce 3 contact dips (allow off-by-one due to sampling)
    expect(minima.length).toBeGreaterThanOrEqual(2)
    expect(minima.length).toBeLessThanOrEqual(4)
  })

  test("ends at y=1", () => {
    const samples = sampleBounce(3, 0.5)
    expect(samples[samples.length - 1].y).toBeCloseTo(1, 2)
  })
})

describe("sampleWiggle", () => {
  test("crosses y=1 multiple times (non-monotonic)", () => {
    const samples = sampleWiggle(4, 5)
    let crossings = 0
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i - 1].y - 1) * (samples[i].y - 1) < 0) crossings++
    }
    expect(crossings).toBeGreaterThanOrEqual(3)
  })

  test("ends at y=1", () => {
    const samples = sampleWiggle(4, 5)
    expect(samples[samples.length - 1].y).toBeCloseTo(1, 1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/easing-baking.test.ts
```

Expected: FAIL with missing exports.

- [ ] **Step 3: Implement `sampleBounce` + `sampleWiggle`**

Append under `bakeLinear`:

```ts
export function sampleBounce(bounces: number, stiffness: number): Sample[] {
  // Parabolic-bounce model. Restitution decreases per bounce; each bounce
  // is half a parabola (descending → contact → ascending).
  const restitution = 0.4 + 0.5 * stiffness // 0.4..0.9
  const out: Sample[] = []

  // Compute durations such that total = 1
  const segDurations: number[] = []
  let energy = 1
  for (let i = 0; i <= bounces; i++) {
    segDurations.push(Math.sqrt(energy))
    energy *= restitution
  }
  const totalDur = segDurations.reduce((a, b) => a + b, 0)
  for (let i = 0; i < segDurations.length; i++) segDurations[i] /= totalDur

  let t = 0
  // Initial drop: descend from y=0 (start) to y=1 (ground)
  const samplesPerSeg = 12
  for (let i = 0; i < samplesPerSeg; i++) {
    const localT = i / samplesPerSeg
    out.push({ y: localT * localT, t: t + localT * segDurations[0] })
  }
  t += segDurations[0]
  out.push({ y: 1, t })

  // Bounces: rise to peak, fall back to ground
  let energyTracker = restitution
  for (let b = 0; b < bounces; b++) {
    const peak = 1 - energyTracker
    const segDur = segDurations[b + 1]
    for (let i = 1; i <= samplesPerSeg; i++) {
      const localT = i / samplesPerSeg
      // y = 1 - peak*(1 - (2*localT - 1)^2) — inverted parabola from 1 to 1-peak to 1
      const u = 2 * localT - 1
      const y = 1 - (1 - energyTracker) * (1 - u * u)
      out.push({ y, t: t + localT * segDur })
    }
    t += segDur
    energyTracker *= restitution
  }
  // Ensure exactly ends at y=1, t=1
  out.push({ y: 1, t: 1 })
  return out
}

export function sampleWiggle(wiggles: number, damping: number): Sample[] {
  // Decaying sine wave around y=1. After settling, y=1.
  const samples = 80
  const out: Sample[] = []
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1)
    const decay = Math.exp(-damping * t)
    const wave = Math.sin(wiggles * 2 * Math.PI * t)
    const y = 1 - decay * Math.cos(wiggles * 2 * Math.PI * t) + 0 * wave
    out.push({ y, t })
  }
  // Force endpoint
  out[out.length - 1] = { y: 1, t: 1 }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/easing-baking.test.ts
```

Expected: PASS.

- [ ] **Step 5: Wire physics into `formatEasing`**

Replace the `spring | bounce | wiggle` placeholder in `formatEasing`:

```ts
    case "spring": {
      const { stiffness, damping, mass } = state
      return bakeLinear(sampleSpring(stiffness, damping, mass, 60)) as EasingString
    }
    case "bounce": {
      const { bounces, stiffness } = state
      return bakeLinear(sampleBounce(bounces, stiffness)) as EasingString
    }
    case "wiggle": {
      const { wiggles, damping } = state
      return bakeLinear(sampleWiggle(wiggles, damping)) as EasingString
    }
```

- [ ] **Step 6: Append physics serialization tests to `tests/easing-format.test.ts`**

```ts
import { formatEasing } from "@/components/ui/easing-picker/easing-picker"

test("formatEasing spring emits a linear() string", () => {
  const result = formatEasing({ basis: "spring", stiffness: 100, damping: 10, mass: 1 })
  expect(result).toMatch(/^linear\(/)
  expect(result).toMatch(/\)$/)
})

test("formatEasing bounce emits a linear() string", () => {
  const result = formatEasing({ basis: "bounce", bounces: 3, stiffness: 0.5 })
  expect(result).toMatch(/^linear\(/)
})

test("formatEasing wiggle emits a linear() string", () => {
  const result = formatEasing({ basis: "wiggle", wiggles: 4, damping: 5 })
  expect(result).toMatch(/^linear\(/)
})
```

- [ ] **Step 7: Run all format + baking tests**

```bash
pnpm test tests/easing-format.test.ts tests/easing-baking.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.tsx tests/easing-baking.test.ts tests/easing-format.test.ts
git commit -m "Add sampleBounce + sampleWiggle and wire physics into formatEasing"
```

---

## Phase 6 — Bezier + Steps controls

### Task 12: BezierCanvas

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx`
- Modify: `tests/easing-picker.test.tsx`

Draggable P1/P2 handles. SVG-based, no canvas. Pointer events with capture for drag continuity.

- [ ] **Step 1: Append failing BezierCanvas test**

```tsx
import { BezierCanvas } from "@/components/ui/easing-picker/easing-picker"
import { fireEvent } from "@testing-library/react"

describe("BezierCanvas", () => {
  test("renders SVG with the cubic-bezier path", () => {
    const { container } = render(
      <BezierCanvas
        value={{ x1: 0.42, y1: 0, x2: 0.58, y2: 1 }}
        onChange={() => {}}
      />,
    )
    const path = container.querySelector("path[data-curve]")
    expect(path).not.toBeNull()
    expect(path?.getAttribute("d")).toContain("C")
  })

  test("dragging P1 handle fires onChange with new coords", () => {
    const onChange = vi.fn()
    const { container } = render(
      <BezierCanvas
        value={{ x1: 0.42, y1: 0, x2: 0.58, y2: 1 }}
        onChange={onChange}
      />,
    )
    const handle = container.querySelector("[data-handle='p1']") as HTMLElement
    fireEvent.pointerDown(handle, { clientX: 100, clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(handle, { clientX: 150, clientY: 80, pointerId: 1 })
    fireEvent.pointerUp(handle, { pointerId: 1 })
    expect(onChange).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/easing-picker.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement BezierCanvas**

Append under PresetGallery in `easing-picker.tsx`:

```tsx
import { useRef, useState } from "react"

export interface BezierCanvasProps {
  value: { x1: number; y1: number; x2: number; y2: number }
  onChange: (v: { x1: number; y1: number; x2: number; y2: number }) => void
  extraTop?: number
  extraBottom?: number
  showLinearReference?: boolean
  className?: string
}

const CANVAS_SIZE = 240
const CANVAS_PAD = 8

export function BezierCanvas({
  value,
  onChange,
  extraTop = 0.25,
  extraBottom = 0.25,
  showLinearReference = true,
  className,
}: BezierCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<"p1" | "p2" | null>(null)

  const yMin = -extraBottom
  const yMax = 1 + extraTop
  const yRange = yMax - yMin
  const innerSize = CANVAS_SIZE - 2 * CANVAS_PAD

  const toScreen = (x: number, y: number) => ({
    sx: CANVAS_PAD + x * innerSize,
    sy: CANVAS_PAD + (yMax - y) * (innerSize / yRange),
  })

  const fromScreen = (sx: number, sy: number) => ({
    x: clamp((sx - CANVAS_PAD) / innerSize, 0, 1),
    y: yMax - ((sy - CANVAS_PAD) / innerSize) * yRange,
  })

  const p0 = toScreen(0, 0)
  const p3 = toScreen(1, 1)
  const p1 = toScreen(value.x1, value.y1)
  const p2 = toScreen(value.x2, value.y2)

  const pathD = `M ${p0.sx} ${p0.sy} C ${p1.sx} ${p1.sy}, ${p2.sx} ${p2.sy}, ${p3.sx} ${p3.sy}`

  const handlePointerDown = (which: "p1" | "p2") => (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(which)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scale = CANVAS_SIZE / rect.width
    const sx = (e.clientX - rect.left) * scale
    const sy = (e.clientY - rect.top) * scale
    const { x, y } = fromScreen(sx, sy)
    if (dragging === "p1") onChange({ ...value, x1: x, y1: y })
    else onChange({ ...value, x2: x, y2: y })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(null)
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      className={cn("size-full bg-muted/30 rounded", className)}
    >
      {/* Optional reference y=x line */}
      {showLinearReference && (
        <line
          x1={p0.sx}
          y1={p0.sy}
          x2={p3.sx}
          y2={p3.sy}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeDasharray="2 2"
        />
      )}

      {/* Handle tangent lines */}
      <line x1={p0.sx} y1={p0.sy} x2={p1.sx} y2={p1.sy} stroke="currentColor" strokeOpacity={0.4} />
      <line x1={p3.sx} y1={p3.sy} x2={p2.sx} y2={p2.sy} stroke="currentColor" strokeOpacity={0.4} />

      {/* Bezier curve */}
      <path data-curve d={pathD} fill="none" stroke="currentColor" strokeWidth="2" />

      {/* Handles */}
      <circle
        data-handle="p1"
        cx={p1.sx}
        cy={p1.sy}
        r="6"
        fill="currentColor"
        className="cursor-grab"
        onPointerDown={handlePointerDown("p1")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <circle
        data-handle="p2"
        cx={p2.sx}
        cy={p2.sy}
        r="6"
        fill="currentColor"
        className="cursor-grab"
        onPointerDown={handlePointerDown("p2")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </svg>
  )
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}
```

- [ ] **Step 4: Run test**

```bash
pnpm test tests/easing-picker.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.tsx tests/easing-picker.test.tsx
git commit -m "Add BezierCanvas with draggable P1/P2 handles"
```

### Task 13: BezierInputs (internal)

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx`

Numeric inputs for X1/Y1/X2/Y2 + extra-top/extra-bottom.

- [ ] **Step 1: Add `BezierInputs` (NOT exported)**

```tsx
interface BezierInputsProps {
  value: {
    x1: number
    y1: number
    x2: number
    y2: number
    extraTop: number
    extraBottom: number
  }
  onChange: (v: BezierInputsProps["value"]) => void
}

function BezierInputs({ value, onChange }: BezierInputsProps) {
  const set = (k: keyof BezierInputsProps["value"]) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value)
    if (!Number.isFinite(n)) return
    onChange({ ...value, [k]: n })
  }
  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <Field label="X1" value={value.x1} min={0} max={1} step={0.01} onChange={set("x1")} />
      <Field label="Y1" value={value.y1} step={0.01} onChange={set("y1")} />
      <Field label="X2" value={value.x2} min={0} max={1} step={0.01} onChange={set("x2")} />
      <Field label="Y2" value={value.y2} step={0.01} onChange={set("y2")} />
      <Field label="Extra Top" value={value.extraTop} min={0} step={0.05} onChange={set("extraTop")} />
      <Field label="Extra Bottom" value={value.extraBottom} min={0} step={0.05} onChange={set("extraBottom")} />
    </div>
  )
}

function Field({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        className="px-2 py-1 bg-muted rounded text-foreground"
      />
    </label>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.tsx
git commit -m "Add internal BezierInputs numeric grid"
```

### Task 14: StepsControls

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx`
- Modify: `tests/easing-picker.test.tsx`

- [ ] **Step 1: Append failing test**

```tsx
import { StepsControls } from "@/components/ui/easing-picker/easing-picker"

describe("StepsControls", () => {
  test("renders n input and position select", () => {
    render(<StepsControls value={{ n: 3, position: "end" }} onChange={() => {}} />)
    expect(screen.getByLabelText(/steps/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/position/i)).toBeInTheDocument()
  })

  test("emits onChange when n changes", () => {
    const onChange = vi.fn()
    render(<StepsControls value={{ n: 3, position: "end" }} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/steps/i), { target: { value: "5" } })
    expect(onChange).toHaveBeenCalledWith({ n: 5, position: "end" })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/easing-picker.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `StepsControls`**

```tsx
export interface StepsControlsProps {
  value: { n: number; position: StepPosition }
  onChange: (v: { n: number; position: StepPosition }) => void
  minSteps?: number
  maxSteps?: number
  className?: string
}

const STEP_POSITIONS_ARR: StepPosition[] = [
  "start",
  "end",
  "jump-start",
  "jump-end",
  "jump-both",
  "jump-none",
]

export function StepsControls({
  value,
  onChange,
  minSteps = 1,
  maxSteps = 100,
  className,
}: StepsControlsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2 text-xs", className)}>
      <label className="flex flex-col gap-0.5">
        <span className="text-muted-foreground">Steps</span>
        <input
          type="number"
          aria-label="Steps"
          min={minSteps}
          max={maxSteps}
          step={1}
          value={value.n}
          onChange={(e) => {
            const n = Math.max(minSteps, Math.min(maxSteps, Math.floor(Number(e.target.value))))
            if (Number.isFinite(n)) onChange({ ...value, n })
          }}
          className="px-2 py-1 bg-muted rounded text-foreground"
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-muted-foreground">Position</span>
        <select
          aria-label="Position"
          value={value.position}
          onChange={(e) => onChange({ ...value, position: e.target.value as StepPosition })}
          className="px-2 py-1 bg-muted rounded text-foreground"
        >
          {STEP_POSITIONS_ARR.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
```

- [ ] **Step 4: Run test**

```bash
pnpm test tests/easing-picker.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.tsx tests/easing-picker.test.tsx
git commit -m "Add StepsControls component"
```

---

## Phase 7 — Physics controls

### Task 15: SpringControls + BounceControls + WiggleControls

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx`
- Modify: `tests/easing-picker.test.tsx`

Three slider-based controls. Same shape as StepsControls but with range inputs.

- [ ] **Step 1: Append smoke tests for all three**

```tsx
import {
  BounceControls,
  SpringControls,
  WiggleControls,
} from "@/components/ui/easing-picker/easing-picker"

describe("SpringControls", () => {
  test("renders 3 sliders + emits onChange", () => {
    const onChange = vi.fn()
    render(
      <SpringControls
        value={{ stiffness: 100, damping: 10, mass: 1 }}
        onChange={onChange}
      />,
    )
    const sliders = screen.getAllByRole("slider")
    expect(sliders).toHaveLength(3)
    fireEvent.change(sliders[0], { target: { value: "200" } })
    expect(onChange).toHaveBeenCalledWith({ stiffness: 200, damping: 10, mass: 1 })
  })
})

describe("BounceControls", () => {
  test("renders 2 sliders + emits onChange", () => {
    render(<BounceControls value={{ bounces: 3, stiffness: 0.5 }} onChange={() => {}} />)
    expect(screen.getAllByRole("slider")).toHaveLength(2)
  })
})

describe("WiggleControls", () => {
  test("renders 2 sliders + emits onChange", () => {
    render(<WiggleControls value={{ wiggles: 4, damping: 5 }} onChange={() => {}} />)
    expect(screen.getAllByRole("slider")).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL.

- [ ] **Step 3: Implement all three controls**

Shared helper:

```tsx
function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-0.5 text-xs">
      <span className="flex justify-between text-muted-foreground">
        <span>{label}</span>
        <span>{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

export interface SpringControlsProps {
  value: { stiffness: number; damping: number; mass: number }
  onChange: (v: SpringControlsProps["value"]) => void
  className?: string
}

export function SpringControls({ value, onChange, className }: SpringControlsProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Slider label="Stiffness" value={value.stiffness} min={1} max={500} step={1} onChange={(v) => onChange({ ...value, stiffness: v })} />
      <Slider label="Damping" value={value.damping} min={1} max={100} step={1} onChange={(v) => onChange({ ...value, damping: v })} />
      <Slider label="Mass" value={value.mass} min={0.5} max={5} step={0.1} onChange={(v) => onChange({ ...value, mass: v })} />
    </div>
  )
}

export interface BounceControlsProps {
  value: { bounces: number; stiffness: number }
  onChange: (v: BounceControlsProps["value"]) => void
  className?: string
}

export function BounceControls({ value, onChange, className }: BounceControlsProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Slider label="Bounces" value={value.bounces} min={1} max={6} step={1} onChange={(v) => onChange({ ...value, bounces: v })} />
      <Slider label="Stiffness" value={value.stiffness} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...value, stiffness: v })} />
    </div>
  )
}

export interface WiggleControlsProps {
  value: { wiggles: number; damping: number }
  onChange: (v: WiggleControlsProps["value"]) => void
  className?: string
}

export function WiggleControls({ value, onChange, className }: WiggleControlsProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Slider label="Wiggles" value={value.wiggles} min={1} max={10} step={1} onChange={(v) => onChange({ ...value, wiggles: v })} />
      <Slider label="Damping" value={value.damping} min={1} max={30} step={0.5} onChange={(v) => onChange({ ...value, damping: v })} />
    </div>
  )
}
```

- [ ] **Step 4: Run test**

```bash
pnpm test tests/easing-picker.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.tsx tests/easing-picker.test.tsx
git commit -m "Add SpringControls + BounceControls + WiggleControls"
```

---

## Phase 8 — EasingPreview

### Task 16: EasingPreview component

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx`
- Modify: `tests/easing-picker.test.tsx`

Pure CSS animation. 6 properties, replay key, optional linear comparison.

- [ ] **Step 1: Append smoke test**

```tsx
import { EasingPreview } from "@/components/ui/easing-picker/easing-picker"

describe("EasingPreview", () => {
  test("renders an animated element with the easing applied", () => {
    const { container } = render(
      <EasingPreview easing="cubic-bezier(0.42, 0, 0.58, 1)" />,
    )
    const target = container.querySelector("[data-preview-target]") as HTMLElement
    expect(target).not.toBeNull()
    expect(target.style.animation).toContain("cubic-bezier(0.42, 0, 0.58, 1)")
  })

  test("renders linear comparison ghost when enabled", () => {
    const { container } = render(
      <EasingPreview easing="ease" showLinearComparison />,
    )
    expect(container.querySelector("[data-preview-ghost]")).not.toBeNull()
  })

  test("Replay button increments the animation key", () => {
    const { container } = render(<EasingPreview easing="ease" />)
    const target = container.querySelector("[data-preview-target]") as HTMLElement
    const initialKey = target.dataset.animationKey
    screen.getByRole("button", { name: /replay/i }).click()
    const newKey = container.querySelector("[data-preview-target]")?.getAttribute("data-animation-key")
    expect(newKey).not.toBe(initialKey)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL.

- [ ] **Step 3: Implement EasingPreview**

```tsx
export type PreviewProperty =
  | "moveX"
  | "moveY"
  | "scale"
  | "rotate"
  | "opacity"
  | "width"

export interface EasingPreviewProps {
  easing: string
  property?: PreviewProperty
  duration?: number
  loop?: boolean
  showLinearComparison?: boolean
  className?: string
}

const PROP_KEYFRAMES: Record<PreviewProperty, { from: string; to: string }> = {
  moveX: { from: "transform: translateX(0)", to: "transform: translateX(200px)" },
  moveY: { from: "transform: translateY(0)", to: "transform: translateY(100px)" },
  scale: { from: "transform: scale(0.5)", to: "transform: scale(1.5)" },
  rotate: { from: "transform: rotate(0)", to: "transform: rotate(360deg)" },
  opacity: { from: "opacity: 0", to: "opacity: 1" },
  width: { from: "width: 50px", to: "width: 200px" },
}

export function EasingPreview({
  easing,
  property = "moveX",
  duration = 800,
  loop = false,
  showLinearComparison = false,
  className,
}: EasingPreviewProps) {
  const [animKey, setAnimKey] = useState(0)
  const animName = `easing-preview-${property}`

  return (
    <div className={cn("relative w-full h-[120px] bg-muted/30 rounded overflow-hidden", className)}>
      <style>
        {`@keyframes ${animName} {
          from { ${PROP_KEYFRAMES[property].from}; }
          to { ${PROP_KEYFRAMES[property].to}; }
        }`}
      </style>
      {showLinearComparison && (
        <div
          key={`ghost-${animKey}`}
          data-preview-ghost
          className="absolute top-6 left-4 size-8 rounded bg-muted-foreground/35"
          style={{
            animation: `${animName} ${duration}ms ${loop ? "infinite" : "1"} linear`,
          }}
        />
      )}
      <div
        key={`target-${animKey}`}
        data-preview-target
        data-animation-key={animKey}
        className="absolute top-6 left-4 size-8 rounded bg-primary"
        style={{
          animation: `${animName} ${duration}ms ${loop ? "infinite" : "1"} ${easing}`,
        }}
      />
      <div className="absolute bottom-2 right-2 flex gap-1">
        <button
          type="button"
          onClick={() => setAnimKey((k) => k + 1)}
          className="px-2 py-1 text-xs bg-background border rounded"
        >
          Replay
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test**

```bash
pnpm test tests/easing-picker.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.tsx tests/easing-picker.test.tsx
git commit -m "Add EasingPreview component with 6-property CSS animation"
```

---

## Phase 9 — OutputPanel + BasisTabs + EasingPanel

### Task 17: OutputPanel (internal)

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx`

CSS / Tailwind v3 / Tailwind v4 toggle. v4 includes editable variable name. Copy button writes to clipboard. OutputPanel is internal — its behavior is exercised end-to-end via the `EasingPanel` integration test in Task 19 (which covers the copy-to-clipboard path). No dedicated test in this task.

- [ ] **Step 1: Implement OutputPanel (internal)**

```tsx
type OutputFormat = "css" | "tailwind-v3" | "tailwind-v4"

interface OutputPanelProps {
  easing: string
  format: OutputFormat
  onFormatChange: (format: OutputFormat) => void
}

function OutputPanel({ easing, format, onFormatChange }: OutputPanelProps) {
  const [varName, setVarName] = useState("ease-custom")
  const [copied, setCopied] = useState(false)

  const snippet = formatSnippet(easing, format, varName)

  const copy = async () => {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 text-xs">
        {(["css", "tailwind-v3", "tailwind-v4"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFormatChange(f)}
            className={cn(
              "px-2 py-1 rounded border",
              format === f ? "bg-accent border-accent-foreground/20" : "border-transparent hover:bg-accent/50",
            )}
          >
            {f}
          </button>
        ))}
      </div>
      {format === "tailwind-v4" && (
        <label className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">--var name:</span>
          <input
            type="text"
            value={varName}
            onChange={(e) => setVarName(e.target.value.replace(/[^a-z0-9-]/g, ""))}
            className="px-2 py-1 bg-muted rounded text-foreground flex-1"
          />
        </label>
      )}
      <pre className="text-xs bg-muted rounded p-2 overflow-auto whitespace-pre-wrap font-mono">
        {snippet}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="w-full px-2 py-1 text-xs bg-primary text-primary-foreground rounded"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}

function formatSnippet(easing: string, format: OutputFormat, varName: string): string {
  switch (format) {
    case "css":
      return easing
    case "tailwind-v3": {
      // Strip spaces inside cubic-bezier(...) for arbitrary-value class
      const stripped = easing.replace(/cubic-bezier\(([^)]+)\)/, (_, body) =>
        `cubic-bezier(${body.replace(/\s+/g, "")})`,
      )
      return `class="ease-[${stripped}]"`
    }
    case "tailwind-v4":
      return `@theme {\n  --${varName}: ${easing};\n}\n/* usage: class="${varName.replace(/^ease-/, "ease-")}" */`
  }
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.tsx
git commit -m "Add internal OutputPanel with 3 output formats + copy"
```

### Task 18: BasisTabs (internal)

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx`

- [ ] **Step 1: Implement BasisTabs**

```tsx
interface BasisTabsProps {
  value: EasingBasis
  onChange: (basis: EasingBasis) => void
  available?: readonly EasingBasis[]
}

const ALL_BASES: readonly EasingBasis[] = ["bezier", "spring", "bounce", "wiggle", "steps"] as const

function BasisTabs({ value, onChange, available = ALL_BASES }: BasisTabsProps) {
  return (
    <div className="flex gap-1 text-xs border-b">
      {available.map((basis) => (
        <button
          key={basis}
          type="button"
          onClick={() => onChange(basis)}
          className={cn(
            "px-3 py-1.5 capitalize transition-colors",
            value === basis ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {basis}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.tsx
git commit -m "Add internal BasisTabs switcher"
```

### Task 19: EasingPanel composed

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx`
- Modify: `tests/easing-picker.test.tsx`

The full wizard, inline. Owns internal state (parsed from value, serialized to onChange). Implements the controlled-only pattern with `lastEmittedRef` sentinel.

- [ ] **Step 1: Append failing integration test**

```tsx
import { EasingPanel } from "@/components/ui/easing-picker/easing-picker"

describe("EasingPanel integration", () => {
  test("changing basis tab updates emitted output", async () => {
    const onChange = vi.fn()
    render(
      <EasingPanel value="cubic-bezier(0.42, 0, 0.58, 1)" onChange={onChange} />,
    )
    // Click "spring" tab
    fireEvent.click(screen.getByText(/spring/i))
    // Spring controls render
    expect(screen.getAllByRole("slider").length).toBeGreaterThan(0)
    // onChange fires with linear() output
    await new Promise((r) => setTimeout(r, 0))
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^linear\(/))
  })

  test("preset click emits underlying bezier", () => {
    const onChange = vi.fn()
    render(<EasingPanel value="cubic-bezier(0.42, 0, 0.58, 1)" onChange={onChange} />)
    fireEvent.click(screen.getByTitle("ease"))
    expect(onChange).toHaveBeenCalledWith("cubic-bezier(0.25, 0.1, 0.25, 1)")
  })

  test("basis prop locks tab visibility", () => {
    render(
      <EasingPanel
        basis="bezier"
        value="cubic-bezier(0.42, 0, 0.58, 1)"
        onChange={() => {}}
      />,
    )
    expect(screen.queryByText(/spring/i)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL.

- [ ] **Step 3: Implement EasingPanel**

```tsx
import { useEffect, useRef, useState } from "react"

export interface EasingPanelProps<
  TBasis extends EasingBasis | undefined = undefined,
> {
  value: EasingString | (string & {})
  onChange: (
    value: TBasis extends EasingBasis
      ? EasingStringMap[TBasis]
      : EasingString,
  ) => void
  basis?: TBasis
  output?: OutputFormat
  className?: string
  "aria-label"?: string
}

const DEFAULT_SPRING_STATE: Extract<EasingState, { basis: "spring" }> = {
  basis: "spring",
  stiffness: 100,
  damping: 10,
  mass: 1,
}
const DEFAULT_BOUNCE_STATE: Extract<EasingState, { basis: "bounce" }> = {
  basis: "bounce",
  bounces: 3,
  stiffness: 0.5,
}
const DEFAULT_WIGGLE_STATE: Extract<EasingState, { basis: "wiggle" }> = {
  basis: "wiggle",
  wiggles: 4,
  damping: 5,
}
const DEFAULT_BEZIER_STATE: Extract<EasingState, { basis: "bezier" }> = {
  basis: "bezier",
  x1: 0.42,
  y1: 0,
  x2: 0.58,
  y2: 1,
  extraTop: 0.25,
  extraBottom: 0.25,
}
const DEFAULT_STEPS_STATE: Extract<EasingState, { basis: "steps" }> = {
  basis: "steps",
  n: 4,
  position: "end",
}

const DEFAULT_BY_BASIS: Record<EasingBasis, EasingState> = {
  bezier: DEFAULT_BEZIER_STATE,
  spring: DEFAULT_SPRING_STATE,
  bounce: DEFAULT_BOUNCE_STATE,
  wiggle: DEFAULT_WIGGLE_STATE,
  steps: DEFAULT_STEPS_STATE,
}

export function EasingPanel<
  TBasis extends EasingBasis | undefined = undefined,
>({
  value,
  onChange,
  basis: basisProp,
  output: outputProp = "css",
  className,
  "aria-label": ariaLabel = "Pick an easing",
}: EasingPanelProps<TBasis>) {
  const parsed = parseEasing(value) ?? DEFAULT_BEZIER_STATE
  const [internal, setInternal] = useState<EasingState>(parsed)
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(outputProp)
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from external value (skip our own emits)
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const next = parseEasing(value)
    if (next) setInternal(next)
  }, [value])

  const emit = (next: EasingState) => {
    setInternal(next)
    const s = formatEasing(next)
    lastEmittedRef.current = s
    onChange(s as never)
  }

  const switchBasis = (basis: EasingBasis) => {
    emit(DEFAULT_BY_BASIS[basis])
  }

  const available: readonly EasingBasis[] = basisProp
    ? ([basisProp] as const)
    : ALL_BASES

  const currentName =
    internal.basis === "bezier"
      ? matchPreset(internal.x1, internal.y1, internal.x2, internal.y2)
      : null

  return (
    <div
      className={cn("w-[480px] space-y-3 p-3 bg-background", className)}
      aria-label={ariaLabel}
    >
      <BasisTabs
        value={internal.basis}
        onChange={switchBasis}
        available={available}
      />
      {internal.basis === "bezier" && (
        <>
          <PresetGallery
            value={currentName ?? undefined}
            onChange={(_, bezier) => {
              const parsed = parseEasing(bezier)
              if (parsed) emit(parsed)
            }}
          />
          <div className="grid grid-cols-[1fr_180px] gap-3">
            <div className="size-60">
              <BezierCanvas
                value={{
                  x1: internal.x1,
                  y1: internal.y1,
                  x2: internal.x2,
                  y2: internal.y2,
                }}
                extraTop={internal.extraTop}
                extraBottom={internal.extraBottom}
                onChange={(v) => emit({ ...internal, ...v })}
              />
            </div>
            <BezierInputs
              value={internal}
              onChange={(v) => emit({ basis: "bezier", ...v })}
            />
          </div>
        </>
      )}
      {internal.basis === "spring" && (
        <SpringControls
          value={internal}
          onChange={(v) => emit({ basis: "spring", ...v })}
        />
      )}
      {internal.basis === "bounce" && (
        <BounceControls
          value={internal}
          onChange={(v) => emit({ basis: "bounce", ...v })}
        />
      )}
      {internal.basis === "wiggle" && (
        <WiggleControls
          value={internal}
          onChange={(v) => emit({ basis: "wiggle", ...v })}
        />
      )}
      {internal.basis === "steps" && (
        <StepsControls
          value={internal}
          onChange={(v) => emit({ basis: "steps", ...v })}
        />
      )}
      <EasingPreview easing={formatEasing(internal)} />
      <OutputPanel
        easing={formatEasing(internal)}
        format={outputFormat}
        onFormatChange={setOutputFormat}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run test**

```bash
pnpm test tests/easing-picker.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.tsx tests/easing-picker.test.tsx
git commit -m "Add EasingPanel composed wizard with lastEmittedRef sentinel"
```

---

## Phase 10 — EasingPicker popover + trigger

### Task 20: EasingPicker popover-wrap + trigger thumbnail

**Files:**
- Modify: `src/components/ui/easing-picker/easing-picker.tsx`
- Modify: `tests/easing-picker.test.tsx`

- [ ] **Step 1: Append failing popover test**

```tsx
import { EasingPicker } from "@/components/ui/easing-picker/easing-picker"

describe("EasingPicker popover", () => {
  test("trigger button renders curve thumbnail + name label", () => {
    render(
      <EasingPicker value="cubic-bezier(0.42, 0, 0.58, 1)" onChange={() => {}} />,
    )
    expect(screen.getByRole("button")).toBeInTheDocument()
    // Matches "ease-in-out" preset, so trigger should show that label
    expect(screen.getByRole("button").textContent).toContain("ease-in-out")
  })

  test("opening popover renders EasingPanel", async () => {
    render(<EasingPicker value="ease" onChange={() => {}} />)
    fireEvent.click(screen.getByRole("button"))
    // PopoverContent renders BasisTabs
    expect(await screen.findByText(/bezier/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL (current EasingPicker is a `return null` stub from Task 1).

- [ ] **Step 3: Replace EasingPicker stub with popover wrapper**

Replace the stub from Task 1:

```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

export interface EasingPickerProps<
  TBasis extends EasingBasis | undefined = undefined,
> extends EasingPanelProps<TBasis> {}

export function EasingPicker<
  TBasis extends EasingBasis | undefined = undefined,
>({
  value,
  onChange,
  basis,
  output,
  className,
  "aria-label": ariaLabel = "Pick an easing",
}: EasingPickerProps<TBasis>) {
  const parsed = parseEasing(value)
  const label = computeTriggerLabel(parsed)
  const thumb = computeTriggerThumb(parsed)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 px-3", className)}
          aria-label={ariaLabel}
        >
          <div className="size-5 text-foreground/70">{thumb}</div>
          <span className="text-xs font-mono">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <EasingPanel
          value={value}
          onChange={onChange}
          basis={basis}
          output={output}
        />
      </PopoverContent>
    </Popover>
  )
}

function computeTriggerLabel(state: EasingState | null): string {
  if (!state) return "(invalid)"
  switch (state.basis) {
    case "bezier": {
      const name = matchPreset(state.x1, state.y1, state.x2, state.y2)
      return name ?? "cubic-bezier"
    }
    case "spring":
      return "spring"
    case "bounce":
      return "bounce"
    case "wiggle":
      return "wiggle"
    case "steps":
      return `steps(${state.n})`
  }
}

function computeTriggerThumb(state: EasingState | null): React.ReactNode {
  if (!state || state.basis !== "bezier") {
    // Fallback flat line
    return (
      <svg viewBox="0 0 48 32">
        <line x1="0" y1="16" x2="48" y2="16" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }
  const path = `M 0 32 C ${state.x1 * 48} ${(1 - state.y1) * 32}, ${state.x2 * 48} ${(1 - state.y2) * 32}, 48 0`
  return (
    <svg viewBox="0 0 48 32">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
```

- [ ] **Step 4: Run test**

```bash
pnpm test tests/easing-picker.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Update `index.ts` to export the full surface**

```ts
export type {
  EasingPanelProps,
  EasingPickerProps,
  BezierCanvasProps,
  PresetGalleryProps,
  EasingPreviewProps,
  StepsControlsProps,
  SpringControlsProps,
  BounceControlsProps,
  WiggleControlsProps,
  PreviewProperty,
} from "./easing-picker"
export {
  EasingPicker,
  EasingPanel,
  BezierCanvas,
  PresetGallery,
  EasingPreview,
  StepsControls,
  SpringControls,
  BounceControls,
  WiggleControls,
  PRESETS,
  bezierFromPreset,
  matchPreset,
  parseEasing,
  formatEasing,
  sampleSpring,
  sampleBounce,
  sampleWiggle,
  bakeLinear,
} from "./easing-picker"
export type {
  CubicBezierString,
  Direction,
  EasingBasis,
  EasingKeyword,
  EasingLiteral,
  EasingState,
  EasingString,
  EasingStringMap,
  FunctionOf,
  BasisOfString,
  LinearString,
  PolynomialFamily,
  PresetName,
  StepPosition,
  StepsString,
} from "./easing-picker.types"
export { easing } from "./easing-picker.types"
```

- [ ] **Step 6: Run all tests + typecheck**

```bash
pnpm test && pnpm typecheck
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/easing-picker/easing-picker.tsx src/components/ui/easing-picker/index.ts tests/easing-picker.test.tsx
git commit -m "Add EasingPicker popover wrap + trigger thumbnail + full barrel exports"
```

---

## Phase 11 — Type-locked onChange narrowing test

### Task 21: Verify type-locked basis prop narrows onChange

**Files:**
- Modify: `tests/easing-types.test-d.ts`

The runtime emits whatever it computes; the type-level guarantee is that `basis="bezier"` narrows the `onChange` parameter to `CubicBezierString`, etc.

- [ ] **Step 1: Append failing type-level test**

```ts
import { EasingPicker } from "@/components/ui/easing-picker"

test("EasingPicker basis='bezier' narrows onChange to CubicBezierString", () => {
  type Props = Parameters<typeof EasingPicker<"bezier">>[0]
  expectTypeOf<Props["onChange"]>().parameter(0).toEqualTypeOf<CubicBezierString>()
})

test("EasingPicker basis='spring' narrows onChange to LinearString", () => {
  type Props = Parameters<typeof EasingPicker<"spring">>[0]
  expectTypeOf<Props["onChange"]>().parameter(0).toEqualTypeOf<LinearString>()
})

test("EasingPicker basis='steps' narrows onChange to StepsString", () => {
  type Props = Parameters<typeof EasingPicker<"steps">>[0]
  expectTypeOf<Props["onChange"]>().parameter(0).toEqualTypeOf<StepsString>()
})

test("EasingPicker without basis keeps full EasingString union", () => {
  type Props = Parameters<typeof EasingPicker>[0]
  expectTypeOf<Props["onChange"]>().parameter(0).toEqualTypeOf<EasingString>()
})
```

- [ ] **Step 2: Run test**

```bash
pnpm test tests/easing-types.test-d.ts
```

Expected: PASS (the props were defined generic over `TBasis` in Task 19).

- [ ] **Step 3: Commit**

```bash
git add tests/easing-types.test-d.ts
git commit -m "Add type-level tests for EasingPicker basis-prop onChange narrowing"
```

---

## Phase 12 — Examples

### Task 22: Basic usage example

**Files:**
- Create: `src/examples/easing-picker/basic-usage.tsx`

- [ ] **Step 1: Create example**

```tsx
"use client"

import { useState } from "react"
import {
  EasingPicker,
  type EasingString,
} from "@/components/ui/easing-picker"

export function BasicUsageExample() {
  const [easing, setEasing] = useState<EasingString>(
    "cubic-bezier(0.42, 0, 0.58, 1)",
  )
  return (
    <div className="space-y-4">
      <EasingPicker value={easing} onChange={setEasing} />
      <div className="text-xs font-mono text-muted-foreground">{easing}</div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/examples/easing-picker/
git commit -m "Add basic-usage example for EasingPicker"
```

### Task 23: Type-locked example

**Files:**
- Create: `src/examples/easing-picker/type-locked.tsx`

- [ ] **Step 1: Create example**

```tsx
"use client"

import { useState } from "react"
import {
  EasingPicker,
  type CubicBezierString,
  type LinearString,
  type StepsString,
} from "@/components/ui/easing-picker"

export function TypeLockedExample() {
  const [bezier, setBezier] = useState<CubicBezierString>("cubic-bezier(0.42, 0, 0.58, 1)")
  const [spring, setSpring] = useState<LinearString>("linear(0, 1)")
  const [steps, setSteps] = useState<StepsString>("steps(4)")

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-sm font-medium">basis="bezier"</div>
        <EasingPicker basis="bezier" value={bezier} onChange={setBezier} />
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium">basis="spring"</div>
        <EasingPicker basis="spring" value={spring} onChange={setSpring} />
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium">basis="steps"</div>
        <EasingPicker basis="steps" value={steps} onChange={setSteps} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/examples/easing-picker/type-locked.tsx
git commit -m "Add type-locked example showing 3 basis prop variants"
```

### Task 24: Output-formats example

**Files:**
- Create: `src/examples/easing-picker/output-formats.tsx`

- [ ] **Step 1: Create example**

```tsx
"use client"

import { useState } from "react"
import { EasingPicker, type EasingString } from "@/components/ui/easing-picker"

export function OutputFormatsExample() {
  const [easing, setEasing] = useState<EasingString>(
    "cubic-bezier(0.42, 0, 0.58, 1)",
  )
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        Toggle CSS / Tailwind v3 / Tailwind v4 inside the popover.
      </div>
      <EasingPicker value={easing} onChange={setEasing} output="tailwind-v4" />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/examples/easing-picker/output-formats.tsx
git commit -m "Add output-formats example showing 3-format toggle"
```

### Task 25: Inline panel example

**Files:**
- Create: `src/examples/easing-picker/inline-panel.tsx`

- [ ] **Step 1: Create example**

```tsx
"use client"

import { useState } from "react"
import {
  EasingPanel,
  type EasingString,
} from "@/components/ui/easing-picker"

export function InlinePanelExample() {
  const [easing, setEasing] = useState<EasingString>("ease-in-out")
  return (
    <div className="border rounded-lg p-4">
      <EasingPanel value={easing} onChange={setEasing} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/examples/easing-picker/inline-panel.tsx
git commit -m "Add inline-panel example using EasingPanel directly"
```

### Task 26: Sub-component examples

**Files:**
- Create: `src/examples/easing-picker/sub-component-bezier.tsx`
- Create: `src/examples/easing-picker/sub-component-spring.tsx`

- [ ] **Step 1: Create bezier sub-component example**

```tsx
// src/examples/easing-picker/sub-component-bezier.tsx
"use client"

import { useState } from "react"
import { BezierCanvas } from "@/components/ui/easing-picker"

export function SubComponentBezierExample() {
  const [value, setValue] = useState({ x1: 0.42, y1: 0, x2: 0.58, y2: 1 })
  return (
    <div className="space-y-2 w-60">
      <BezierCanvas value={value} onChange={setValue} />
      <div className="text-xs font-mono">
        cubic-bezier({value.x1.toFixed(2)}, {value.y1.toFixed(2)}, {value.x2.toFixed(2)}, {value.y2.toFixed(2)})
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create spring sub-component example**

```tsx
// src/examples/easing-picker/sub-component-spring.tsx
"use client"

import { useMemo, useState } from "react"
import {
  EasingPreview,
  SpringControls,
  bakeLinear,
  sampleSpring,
} from "@/components/ui/easing-picker"

export function SubComponentSpringExample() {
  const [spring, setSpring] = useState({ stiffness: 100, damping: 10, mass: 1 })
  const easing = useMemo(
    () => bakeLinear(sampleSpring(spring.stiffness, spring.damping, spring.mass, 60)),
    [spring],
  )
  return (
    <div className="space-y-2 w-72">
      <SpringControls value={spring} onChange={setSpring} />
      <EasingPreview easing={easing} property="moveX" />
      <div className="text-xs font-mono break-all">{easing}</div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/examples/easing-picker/sub-component-bezier.tsx src/examples/easing-picker/sub-component-spring.tsx
git commit -m "Add sub-component examples (BezierCanvas + SpringControls standalone)"
```

---

## Phase 13 — Registry wiring + docs

### Task 27: Register easing-picker in registry.json

**Files:**
- Modify: `registry.json`

- [ ] **Step 1: Add new entry to `registry.json` items array**

After the `gradient-editor` entry, add:

```json
{
  "name": "easing-picker",
  "type": "registry:ui",
  "title": "Easing Picker",
  "description": "Ridiculously typed CSS easing function picker — bezier canvas, spring/bounce/wiggle physics baked to linear(), polynomial preset gallery, 6-property animation preview, 3-format output (CSS/Tailwind v3/v4).",
  "registryDependencies": ["button", "popover"],
  "dependencies": [],
  "files": [
    {
      "path": "src/components/ui/easing-picker/index.ts",
      "type": "registry:ui",
      "target": "components/ui/easing-picker/index.ts"
    },
    {
      "path": "src/components/ui/easing-picker/easing-picker.tsx",
      "type": "registry:ui",
      "target": "components/ui/easing-picker/easing-picker.tsx"
    },
    {
      "path": "src/components/ui/easing-picker/easing-picker.types.ts",
      "type": "registry:ui",
      "target": "components/ui/easing-picker/easing-picker.types.ts"
    }
  ]
}
```

- [ ] **Step 2: Run registry build to verify it emits a public JSON file**

```bash
pnpm registry:build
```

Expected: `public/r/easing-picker.json` is created.

- [ ] **Step 3: Commit**

```bash
git add registry.json
git commit -m "Register easing-picker item in registry.json"
```

### Task 28: API reference doc

**Files:**
- Create: `docs/easing-picker/api-reference.md`

Mirror the structure of `docs/gradient-editor/api-reference.md`.

- [ ] **Step 1: Inspect existing docs structure**

```bash
ls docs/
```

- [ ] **Step 2: Create `docs/easing-picker/api-reference.md`**

```markdown
# EasingPicker API Reference

CSS easing function picker with bezier, steps, spring/bounce/wiggle physics, polynomial preset gallery, and animation preview.

## Install

```bash
npx shadcn add https://turtiesocks.github.io/ridiculous/r/easing-picker.json
```

## Components

### `EasingPicker`

Popover-wrapped composed wizard.

**Props:**
- `value: EasingString | (string & {})` — required. CSS easing function or keyword.
- `onChange: (value) => void` — required. Type narrows based on `basis` prop.
- `basis?: EasingBasis` — optional. Lock to one of `"bezier" | "spring" | "bounce" | "wiggle" | "steps"`. Narrows `onChange` parameter type.
- `output?: "css" | "tailwind-v3" | "tailwind-v4"` — default snippet format in the OutputPanel.
- `className?: string`
- `aria-label?: string`

### `EasingPanel`

Same as `EasingPicker` but renders the wizard inline without a popover wrapper.

### Sub-components

All controlled-only — `value` + `onChange` required.

- `BezierCanvas` — draggable P1/P2 SVG canvas.
- `PresetGallery` — 39-preset card grid.
- `EasingPreview` — CSS-animated preview with 6 property options.
- `StepsControls` — n + position editor.
- `SpringControls` — stiffness/damping/mass sliders.
- `BounceControls` — bounces/stiffness sliders.
- `WiggleControls` — wiggles/damping sliders.

## Types

- `EasingString` — union of all valid output strings.
- `EasingLiteral<S>` — strict literal validator for call-site validation.
- `easing()` — call-site validator helper, mirrors `color()` and `gradient()`.
- `PresetName` — named preset union.
- `EasingState` — internal discriminated union (exported for advanced use).
- `EasingStringMap` / `EasingBasis` — basis → output-string map for type narrowing.

## Helpers

- `parseEasing(s)` — string → `EasingState | null`.
- `formatEasing(state)` — `EasingState` → CSS-valid string.
- `bezierFromPreset(name)` — preset name → `cubic-bezier(...)` literal.
- `matchPreset(x1, y1, x2, y2)` — reverse lookup by coords with tolerance 0.005.
- `sampleSpring(k, c, m, n)` / `sampleBounce(n, k)` / `sampleWiggle(n, d)` — physics samplers.
- `bakeLinear(samples)` — sample array → `linear(...)` string with collinear-prune pass.

## Limitations

- Round-trip from `linear()` back to physics params is lossy — the baked output erases the source `{stiffness, damping, mass}`.
- Preset selection emits the underlying `cubic-bezier(...)` literal, never the keyword form.
- `LinearLiteral<S>` does weak validation (variadic stop ranges not checked at type level); runtime parser is authoritative.

## Out of scope (v1)

- `linear()` multi-stop direct editor.
- Share-link URL state encoding.
- RotateX / RotateY preview properties.
- Shape morph preview.
- Custom preset / property registration.
```

- [ ] **Step 3: Commit**

```bash
git add docs/easing-picker/
git commit -m "Add api-reference for easing-picker"
```

### Task 29: Wire into demo app

**Files:**
- Modify: `src/app.tsx` (or whatever the demo's primary entrypoint is)

- [ ] **Step 1: Check the demo app structure**

```bash
head -60 src/app.tsx
```

- [ ] **Step 2: Add easing-picker section to demo**

Following the same pattern as the gradient-editor section (mirror how `src/app.tsx` registers gradient-editor — import the examples, render in a labelled section). Show the basic-usage example as the primary, and link to the other examples via tabs or accordion (whichever pattern app.tsx already uses for gradient-editor).

If the demo uses a section component:

```tsx
import { BasicUsageExample } from "@/examples/easing-picker/basic-usage"
// ... other example imports

<section id="easing-picker">
  <h2>Easing Picker</h2>
  <BasicUsageExample />
  {/* other examples in tabs/accordion */}
</section>
```

- [ ] **Step 3: Run dev server to verify it works in browser**

```bash
pnpm dev
```

Open http://localhost:5173/ridiculous/, scroll to the easing-picker section, verify:
- The popover opens.
- Switching basis tabs works.
- Clicking a preset updates the curve and emits onChange.
- The preview animation plays.
- Copy button works for all 3 output formats.

- [ ] **Step 4: Commit**

```bash
git add src/app.tsx
git commit -m "Wire easing-picker into demo app: section + examples"
```

---

## Phase 14 — Final verification + lint

### Task 30: Run full test + lint + build

**Files:**
- (Verification only — no file modifications)

- [ ] **Step 1: Full test suite**

```bash
pnpm test
```

Expected: all PASS, no test failures.

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Biome lint + format check**

```bash
pnpm check
```

Expected: PASS or fixable warnings. If warnings appear, run `pnpm check --write` (or equivalent — check `package.json` scripts) to auto-fix, then re-run.

- [ ] **Step 4: Production build**

```bash
pnpm build
```

Expected: PASS. Verify `dist/` contains the registry JSON.

- [ ] **Step 5: Commit any auto-fix artifacts**

```bash
git status
# If any files were auto-fixed:
git add -A
git commit -m "Apply biome auto-fixes"
```

- [ ] **Step 6: Final summary**

The easing-picker is now shippable. Next step is `pnpm registry:build` deployment to GitHub Pages (out of scope for this plan — handled by repo CI on push to main).
