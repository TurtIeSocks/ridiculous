# Ridiculous Type Kit (Phase 0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ridiculous-type-kit` — a shared, types-only registry item holding the template-literal primitives, CSS dimension validators, and parser combinators that every future ridiculous component composes on.

**Architecture:** A pure-type TypeScript module under `src/lib/ridiculous-type-kit/` (no runtime exports), split into `primitives.ts` (chars / trim / boolean logic / number-range validators), `dimensions.ts` (unit predicates + `Dimension` tag + `DimensionOf`), and `combinators.ts` (paren-aware list splitters + `ParseFunction` + `StartsWith`/`EndsWith`), re-exported through `index.ts`. Validation lives entirely in the type system; the per-component call-site helper (`const x = <S extends string>(v: S & XLiteral<S>): S => v`) stays a documented idiom because TypeScript cannot pass a generic type alias as a runtime value. Registered as a `registry:lib` item that later components declare as a `registryDependency`. The existing 4 components are NOT migrated onto the kit in this phase.

**Tech Stack:** TypeScript 6 (template-literal types, tail-recursive conditional types), Vitest `typecheck` mode (`tests/**/*.test-d.ts`, `expectTypeOf`), shadcn registry build, Biome (no semicolons, double quotes, 2-space indent).

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/lib/ridiculous-type-kit/primitives.ts` | Char classes, `Trim`, `AllChars`, boolean logic (`And`/`Or`/`Not`/`KeepIf`), `Length`, integer-range + bounded-number validators (`IntRange`, `IsByte`, `IsNumber0To1/100/360/400`, `IsPercent0To100`, `IsNonNegativeNumber`, `IsSignedDecimal`, `IsPositiveInt`, `IsNumber`). |
| `src/lib/ridiculous-type-kit/dimensions.ts` | CSS unit predicates (`IsLength`/`IsAngle`/`IsTime`/`IsResolution`/`IsPercentage`/`IsFlex`), the `Dimension` tag union, and `DimensionOf<S>`. Depends on `primitives.ts`. |
| `src/lib/ridiculous-type-kit/combinators.ts` | `StartsWith`/`EndsWith`, paren/bracket-aware `SplitByComma`/`SplitBySpace`, and `ParseFunction<S>`. Depends on `primitives.ts`. |
| `src/lib/ridiculous-type-kit/index.ts` | Barrel: `export type *` from the three modules + the documented call-site-helper idiom comment. |
| `tests/ridiculous-type-kit-primitives.test-d.ts` | Type-level tests for `primitives.ts`. |
| `tests/ridiculous-type-kit-dimensions.test-d.ts` | Type-level tests for `dimensions.ts`. |
| `tests/ridiculous-type-kit-combinators.test-d.ts` | Type-level tests for `combinators.ts`. |
| `tests/ridiculous-type-kit-barrel.test-d.ts` | Smoke test that every public type is reachable through the barrel. |
| `registry.json` | Add the `ridiculous-type-kit` item; add it first in the `all` bundle's `registryDependencies`. |

**Notes on conventions**
- All kit files are `export type` only — no runtime values. Tests import with `import type` and assert via `expectTypeOf` inside `test()` blocks (matching `tests/color-types.test-d.ts`).
- Boolean predicates return the literal types `true` / `false` (like the existing `IsByte`). Components combine them with `And`/`Or` then collapse with `KeepIf<B, S>` to produce `S | never` validators.
- Biome style: **no semicolons**, double quotes, 2-space indent. Match it exactly to avoid format churn.
- Bare numbers (including `0`) classify as dimension `"number"`, NOT `"length"`. A unitless value is only a length in CSS by context; the kit keeps the predicates crisp and lets components decide. Scientific notation (`5e3`) is out of scope for Phase 0.

---

## Task 1: Scaffold the kit directory + barrel + test wiring

**Files:**
- Create: `src/lib/ridiculous-type-kit/index.ts`
- Test: `tests/ridiculous-type-kit-barrel.test-d.ts`

- [ ] **Step 1: Write the smoke test**

Create `tests/ridiculous-type-kit-barrel.test-d.ts`:

```ts
import { expectTypeOf, test } from "vitest"

// Phase 0 smoke: barrel module resolves and typecheck runs.
test("ridiculous-type-kit barrel imports", () => {
  expectTypeOf<string>().toBeString()
})
```

- [ ] **Step 2: Run the test to verify the suite is wired**

Run: `pnpm exec vitest run tests/ridiculous-type-kit-barrel.test-d.ts`
Expected: FAIL — `Cannot find module '@/lib/ridiculous-type-kit'` is NOT yet referenced, so this passes trivially; if instead vitest reports "No test files found", fix the path. Expected here: PASS (1 test). This step confirms vitest collects the new `*.test-d.ts` file.

- [ ] **Step 3: Create the empty barrel**

Create `src/lib/ridiculous-type-kit/index.ts`:

```ts
// =====================================================================
// ridiculous-type-kit — shared template-literal type machinery.
//
// Pure types only (no runtime). Boolean predicates return `true`/`false`;
// compose with And/Or/Not then collapse with KeepIf<B, S> to build an
// `S | never` validator.
//
// CALL-SITE HELPER IDIOM (copy into each component's *.types.ts — cannot
// be factored into a runtime helper because TS has no higher-kinded types):
//
//   export const cssThing = <S extends string>(v: S & CssThingLiteral<S>): S => v
// =====================================================================

export type {}
```

- [ ] **Step 4: Verify typecheck + biome are clean**

Run: `pnpm exec vitest run tests/ridiculous-type-kit-barrel.test-d.ts && pnpm exec biome check src/lib/ridiculous-type-kit tests/ridiculous-type-kit-barrel.test-d.ts`
Expected: vitest PASS (1 test); biome reports no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ridiculous-type-kit/index.ts tests/ridiculous-type-kit-barrel.test-d.ts
git commit -m "feat(type-kit): scaffold ridiculous-type-kit module + test wiring

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `primitives.ts` — chars, trim, boolean logic, Length

**Files:**
- Create: `src/lib/ridiculous-type-kit/primitives.ts`
- Modify: `src/lib/ridiculous-type-kit/index.ts`
- Test: `tests/ridiculous-type-kit-primitives.test-d.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/ridiculous-type-kit-primitives.test-d.ts`:

```ts
import { expectTypeOf, test } from "vitest"
import type {
  AllChars,
  And,
  KeepIf,
  Length,
  Not,
  Or,
  Trim,
} from "@/lib/ridiculous-type-kit"

test("Trim strips surrounding whitespace", () => {
  expectTypeOf<Trim<"  hi ">>().toEqualTypeOf<"hi">()
  expectTypeOf<Trim<"none">>().toEqualTypeOf<"none">()
})

test("AllChars checks membership", () => {
  expectTypeOf<AllChars<"123", "0123456789">>().toEqualTypeOf<true>()
  expectTypeOf<AllChars<"12a", "0123456789">>().toEqualTypeOf<false>()
})

test("boolean logic", () => {
  expectTypeOf<And<true, true>>().toEqualTypeOf<true>()
  expectTypeOf<And<true, false>>().toEqualTypeOf<false>()
  expectTypeOf<Or<false, true>>().toEqualTypeOf<true>()
  expectTypeOf<Or<false, false>>().toEqualTypeOf<false>()
  expectTypeOf<Not<true>>().toEqualTypeOf<false>()
})

test("KeepIf gates a literal", () => {
  expectTypeOf<KeepIf<true, "x">>().toEqualTypeOf<"x">()
  expectTypeOf<KeepIf<false, "x">>().toBeNever()
})

test("Length counts characters", () => {
  expectTypeOf<Length<"abc">>().toEqualTypeOf<3>()
  expectTypeOf<Length<"">>().toEqualTypeOf<0>()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/ridiculous-type-kit-primitives.test-d.ts`
Expected: FAIL — `Module '"@/lib/ridiculous-type-kit"' has no exported member 'Trim'` (and the others).

- [ ] **Step 3: Create `primitives.ts` with the char/logic core**

Create `src/lib/ridiculous-type-kit/primitives.ts`:

```ts
// =====================================================================
// primitives.ts — char classes, trim, boolean logic, char-count.
// Extracted from the inlined copies in color-picker / easing-picker /
// unit-input types. Boolean predicates return true | false.
// =====================================================================

export type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

export type HexDigit =
  | Digit
  | "a" | "b" | "c" | "d" | "e" | "f"
  | "A" | "B" | "C" | "D" | "E" | "F"

export type WS = " " | "\n" | "\t"

export type TrimLeft<S extends string> = S extends `${WS}${infer R}`
  ? TrimLeft<R>
  : S
export type TrimRight<S extends string> = S extends `${infer R}${WS}`
  ? TrimRight<R>
  : S
export type Trim<S extends string> = TrimLeft<TrimRight<S>>

export type AllChars<S extends string, Allowed extends string> = S extends ""
  ? true
  : S extends `${infer C}${infer R}`
    ? C extends Allowed
      ? AllChars<R, Allowed>
      : false
    : false

export type NonEmptyAllChars<
  S extends string,
  Allowed extends string,
> = S extends "" ? false : AllChars<S, Allowed>

export type And<A extends boolean, B extends boolean> = A extends true
  ? B extends true
    ? true
    : false
  : false

export type Or<A extends boolean, B extends boolean> = A extends true
  ? true
  : B extends true
    ? true
    : false

export type Not<A extends boolean> = A extends true ? false : true

export type KeepIf<B extends boolean, S extends string> = B extends true
  ? S
  : never

export type Length<
  S extends string,
  A extends unknown[] = [],
> = S extends `${string}${infer R}` ? Length<R, [...A, unknown]> : A["length"]
```

- [ ] **Step 4: Re-export from the barrel**

In `src/lib/ridiculous-type-kit/index.ts`, replace `export type {}` with:

```ts
export type * from "./primitives"
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run tests/ridiculous-type-kit-primitives.test-d.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/ridiculous-type-kit/primitives.ts src/lib/ridiculous-type-kit/index.ts tests/ridiculous-type-kit-primitives.test-d.ts
git commit -m "feat(type-kit): add char/trim/logic primitives

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `primitives.ts` — integer ranges + bounded-number validators

**Files:**
- Modify: `src/lib/ridiculous-type-kit/primitives.ts`
- Test: `tests/ridiculous-type-kit-primitives.test-d.ts` (append)

- [ ] **Step 1: Append the failing tests**

Append to `tests/ridiculous-type-kit-primitives.test-d.ts`:

```ts
import type {
  IsByte,
  IsNonNegativeNumber,
  IsNumber,
  IsNumber0To1,
  IsNumber0To100,
  IsNumber0To360,
  IsPercent0To100,
  IsPositiveInt,
  IsSignedDecimal,
} from "@/lib/ridiculous-type-kit"

test("IsByte range-checks 0-255", () => {
  expectTypeOf<IsByte<"0">>().toEqualTypeOf<true>()
  expectTypeOf<IsByte<"255">>().toEqualTypeOf<true>()
  expectTypeOf<IsByte<"256">>().toEqualTypeOf<false>()
  expectTypeOf<IsByte<"-1">>().toEqualTypeOf<false>()
})

test("bounded number validators", () => {
  expectTypeOf<IsNumber0To1<"0.5">>().toEqualTypeOf<true>()
  expectTypeOf<IsNumber0To1<"1.1">>().toEqualTypeOf<false>()
  expectTypeOf<IsNumber0To100<"100">>().toEqualTypeOf<true>()
  expectTypeOf<IsNumber0To100<"101">>().toEqualTypeOf<false>()
  expectTypeOf<IsNumber0To360<"360">>().toEqualTypeOf<true>()
  expectTypeOf<IsPercent0To100<"50%">>().toEqualTypeOf<true>()
  expectTypeOf<IsPercent0To100<"150%">>().toEqualTypeOf<false>()
})

test("number shape predicates", () => {
  expectTypeOf<IsNonNegativeNumber<"3.14">>().toEqualTypeOf<true>()
  expectTypeOf<IsSignedDecimal<"-0.05">>().toEqualTypeOf<true>()
  expectTypeOf<IsNumber<"+2">>().toEqualTypeOf<true>()
  expectTypeOf<IsNumber<"2px">>().toEqualTypeOf<false>()
  expectTypeOf<IsPositiveInt<"3">>().toEqualTypeOf<true>()
  expectTypeOf<IsPositiveInt<"0">>().toEqualTypeOf<false>()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/ridiculous-type-kit-primitives.test-d.ts`
Expected: FAIL — `has no exported member 'IsByte'` (and the others).

- [ ] **Step 3: Append the validators to `primitives.ts`**

Append to `src/lib/ridiculous-type-kit/primitives.ts`:

```ts
// --- integer range machinery -----------------------------------------

type Enumerate<
  N extends number,
  A extends number[] = [],
> = A["length"] extends N ? A[number] : Enumerate<N, [...A, A["length"]]>

export type IntRange<From extends number, To extends number> = Exclude<
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

// --- number shape predicates -----------------------------------------

export type IsNonNegativeNumber<S extends string> =
  S extends `${infer I}.${infer F}`
    ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>>
    : NonEmptyAllChars<S, Digit>

export type IsSignedDecimal<S extends string> = S extends `-${infer R}`
  ? IsNonNegativeNumber<R>
  : IsNonNegativeNumber<S>

export type IsNumber<S extends string> = S extends `+${infer R}`
  ? IsNonNegativeNumber<R>
  : IsSignedDecimal<S>

export type IsPositiveInt<S extends string> = S extends "0"
  ? false
  : S extends "" | "-"
    ? false
    : NonEmptyAllChars<S, Digit>

// --- bounded-number predicates ---------------------------------------

export type IsByte<S extends string> =
  NonEmptyAllChars<S, Digit> extends true
    ? NormalizeInt<S> extends `${IntRange<0, 256>}`
      ? true
      : false
    : false

export type IsNumber0To1<S extends string> = S extends `${infer I}.${infer F}`
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

export type IsNumber0To100<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>> extends true
    ? NormalizeInt<I> extends `${IntRange<0, 100>}`
      ? true
      : NormalizeInt<I> extends "100"
        ? AllChars<F, "0">
        : false
    : false
  : NonEmptyAllChars<S, Digit> extends true
    ? NormalizeInt<S> extends `${IntRange<0, 101>}`
      ? true
      : false
    : false

export type IsNumber0To360<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>> extends true
    ? NormalizeInt<I> extends `${IntRange<0, 360>}`
      ? true
      : NormalizeInt<I> extends "360"
        ? AllChars<F, "0">
        : false
    : false
  : NonEmptyAllChars<S, Digit> extends true
    ? NormalizeInt<S> extends `${IntRange<0, 361>}`
      ? true
      : false
    : false

export type IsNumber0To400<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>> extends true
    ? NormalizeInt<I> extends `${IntRange<0, 400>}`
      ? true
      : NormalizeInt<I> extends "400"
        ? AllChars<F, "0">
        : false
    : false
  : NonEmptyAllChars<S, Digit> extends true
    ? NormalizeInt<S> extends `${IntRange<0, 401>}`
      ? true
      : false
    : false

export type IsPercent0To100<S extends string> = S extends `${infer N}%`
  ? IsNumber0To100<N>
  : false
```

> Note: `Enumerate` / `StripLeadingZeros` / `NormalizeInt` / `IsIntPart` are module-private (not exported) — they are plumbing, not public surface. This matches the originals in `color-picker.types.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/ridiculous-type-kit-primitives.test-d.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ridiculous-type-kit/primitives.ts tests/ridiculous-type-kit-primitives.test-d.ts
git commit -m "feat(type-kit): add integer-range + bounded-number validators

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: `dimensions.ts` — unit predicates + `DimensionOf`

**Files:**
- Create: `src/lib/ridiculous-type-kit/dimensions.ts`
- Modify: `src/lib/ridiculous-type-kit/index.ts`
- Test: `tests/ridiculous-type-kit-dimensions.test-d.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/ridiculous-type-kit-dimensions.test-d.ts`:

```ts
import { expectTypeOf, test } from "vitest"
import type {
  Dimension,
  DimensionOf,
  IsAngle,
  IsFlex,
  IsLength,
  IsPercentage,
  IsResolution,
  IsTime,
} from "@/lib/ridiculous-type-kit"

test("IsLength accepts length units, rejects others", () => {
  expectTypeOf<IsLength<"10px">>().toEqualTypeOf<true>()
  expectTypeOf<IsLength<"1.5rem">>().toEqualTypeOf<true>()
  expectTypeOf<IsLength<"100dvh">>().toEqualTypeOf<true>()
  expectTypeOf<IsLength<"-2em">>().toEqualTypeOf<true>()
  expectTypeOf<IsLength<"50cqmin">>().toEqualTypeOf<true>()
  expectTypeOf<IsLength<"45deg">>().toEqualTypeOf<false>()
  expectTypeOf<IsLength<"10">>().toEqualTypeOf<false>()
})

test("IsAngle / IsTime / IsResolution / IsFlex / IsPercentage", () => {
  expectTypeOf<IsAngle<"45deg">>().toEqualTypeOf<true>()
  expectTypeOf<IsAngle<"0.25turn">>().toEqualTypeOf<true>()
  expectTypeOf<IsAngle<"100grad">>().toEqualTypeOf<true>()
  expectTypeOf<IsTime<"200ms">>().toEqualTypeOf<true>()
  expectTypeOf<IsTime<"1.5s">>().toEqualTypeOf<true>()
  expectTypeOf<IsResolution<"2dppx">>().toEqualTypeOf<true>()
  expectTypeOf<IsResolution<"96dpi">>().toEqualTypeOf<true>()
  expectTypeOf<IsFlex<"1fr">>().toEqualTypeOf<true>()
  expectTypeOf<IsFlex<"-1fr">>().toEqualTypeOf<false>()
  expectTypeOf<IsPercentage<"50%">>().toEqualTypeOf<true>()
})

test("DimensionOf classifies a value literal", () => {
  expectTypeOf<DimensionOf<"10px">>().toEqualTypeOf<"length">()
  expectTypeOf<DimensionOf<"45deg">>().toEqualTypeOf<"angle">()
  expectTypeOf<DimensionOf<"200ms">>().toEqualTypeOf<"time">()
  expectTypeOf<DimensionOf<"2dppx">>().toEqualTypeOf<"resolution">()
  expectTypeOf<DimensionOf<"1fr">>().toEqualTypeOf<"flex">()
  expectTypeOf<DimensionOf<"50%">>().toEqualTypeOf<"percent">()
  expectTypeOf<DimensionOf<"3">>().toEqualTypeOf<"number">()
  expectTypeOf<DimensionOf<"  12.5px  ">>().toEqualTypeOf<"length">()
  expectTypeOf<DimensionOf<"nonsense">>().toBeNever()
})

test("Dimension is the tag union", () => {
  expectTypeOf<Dimension>().toEqualTypeOf<
    "length" | "angle" | "time" | "percent" | "number" | "flex" | "resolution"
  >()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/ridiculous-type-kit-dimensions.test-d.ts`
Expected: FAIL — `has no exported member 'IsLength'` (and the others).

- [ ] **Step 3: Create `dimensions.ts`**

Create `src/lib/ridiculous-type-kit/dimensions.ts`:

```ts
import type { IsNonNegativeNumber, IsNumber, Trim } from "./primitives"

// Try each unit suffix in turn; on a matched-but-non-numeric prefix keep
// trying (handles ambiguous suffixes like rem/em, dvh/vh). OR over the set.
type HasUnit<S extends string, Units extends readonly string[]> = Units extends
  readonly [infer U extends string, ...infer Rest extends readonly string[]]
  ? S extends `${infer N}${U}`
    ? IsNumber<Trim<N>> extends true
      ? true
      : HasUnit<S, Rest>
    : HasUnit<S, Rest>
  : false

// Longest-first ordering is defensive only — HasUnit ORs over the whole set.
type LengthUnits = [
  "cqmin", "cqmax", "vmin", "vmax",
  "svw", "svh", "svi", "svb",
  "lvw", "lvh", "lvi", "lvb",
  "dvw", "dvh", "dvi", "dvb",
  "cqw", "cqh", "cqi", "cqb",
  "rlh", "rem", "cap", "rex",
  "px", "em", "ex", "ch", "ic", "lh", "vw", "vh", "vi", "vb",
  "cm", "mm", "in", "pt", "pc", "Q",
]
type AngleUnits = ["turn", "grad", "deg", "rad"]
type TimeUnits = ["ms", "s"]
type ResolutionUnits = ["dpcm", "dppx", "dpi", "x"]

export type IsLength<S extends string> = HasUnit<S, LengthUnits>
export type IsAngle<S extends string> = HasUnit<S, AngleUnits>
export type IsTime<S extends string> = HasUnit<S, TimeUnits>
export type IsResolution<S extends string> = HasUnit<S, ResolutionUnits>

export type IsPercentage<S extends string> = S extends `${infer N}%`
  ? IsNumber<Trim<N>>
  : false

export type IsFlex<S extends string> = S extends `${infer N}fr`
  ? IsNonNegativeNumber<Trim<N>>
  : false

export type Dimension =
  | "length"
  | "angle"
  | "time"
  | "percent"
  | "number"
  | "flex"
  | "resolution"

// Order matters: unit-bearing dimensions are checked before bare number.
export type DimensionOf<S extends string> = Trim<S> extends infer T extends
  string
  ? IsPercentage<T> extends true
    ? "percent"
    : IsAngle<T> extends true
      ? "angle"
      : IsTime<T> extends true
        ? "time"
        : IsResolution<T> extends true
          ? "resolution"
          : IsFlex<T> extends true
            ? "flex"
            : IsLength<T> extends true
              ? "length"
              : IsNumber<T> extends true
                ? "number"
                : never
  : never
```

- [ ] **Step 4: Re-export from the barrel**

Append to `src/lib/ridiculous-type-kit/index.ts`:

```ts
export type * from "./dimensions"
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run tests/ridiculous-type-kit-dimensions.test-d.ts`
Expected: PASS (4 tests). If `IsLength<"1.5rem">` is `false`, the `rem`/`em` ambiguity recursion is broken — confirm `HasUnit` recurses on the non-numeric branch (`: HasUnit<S, Rest>`), not `: false`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ridiculous-type-kit/dimensions.ts src/lib/ridiculous-type-kit/index.ts tests/ridiculous-type-kit-dimensions.test-d.ts
git commit -m "feat(type-kit): add CSS dimension predicates + DimensionOf

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: `combinators.ts` — splitters + `ParseFunction` + `StartsWith`/`EndsWith`

**Files:**
- Create: `src/lib/ridiculous-type-kit/combinators.ts`
- Modify: `src/lib/ridiculous-type-kit/index.ts`
- Test: `tests/ridiculous-type-kit-combinators.test-d.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/ridiculous-type-kit-combinators.test-d.ts`:

```ts
import { expectTypeOf, test } from "vitest"
import type {
  EndsWith,
  ParseFunction,
  SplitByComma,
  SplitBySpace,
  StartsWith,
} from "@/lib/ridiculous-type-kit"

test("StartsWith / EndsWith", () => {
  expectTypeOf<StartsWith<"calc(1px)", "calc(">>().toEqualTypeOf<true>()
  expectTypeOf<StartsWith<"min(1px)", "calc(">>().toEqualTypeOf<false>()
  expectTypeOf<EndsWith<"10px", "px">>().toEqualTypeOf<true>()
  expectTypeOf<EndsWith<"10em", "px">>().toEqualTypeOf<false>()
})

test("SplitByComma respects nested parens", () => {
  expectTypeOf<SplitByComma<"a, b(c, d), e">>().toEqualTypeOf<
    ["a", "b(c, d)", "e"]
  >()
  expectTypeOf<SplitByComma<"red 40%, blue">>().toEqualTypeOf<
    ["red 40%", "blue"]
  >()
})

test("SplitBySpace respects nested parens and collapses whitespace", () => {
  expectTypeOf<SplitBySpace<"translateX(1px) rotate(45deg)">>().toEqualTypeOf<
    ["translateX(1px)", "rotate(45deg)"]
  >()
  expectTypeOf<SplitBySpace<"rgb(255 0 0)">>().toEqualTypeOf<["rgb(255 0 0)"]>()
})

test("ParseFunction extracts name + args of the outer call", () => {
  expectTypeOf<ParseFunction<"minmax(0, 1fr)">>().toEqualTypeOf<
    { name: "minmax"; args: "0, 1fr" }
  >()
  expectTypeOf<ParseFunction<"calc((1 + 2) * 3)">>().toEqualTypeOf<
    { name: "calc"; args: "(1 + 2) * 3" }
  >()
  expectTypeOf<ParseFunction<"scale()">>().toEqualTypeOf<
    { name: "scale"; args: "" }
  >()
  expectTypeOf<ParseFunction<"not-a-call">>().toBeNever()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/ridiculous-type-kit-combinators.test-d.ts`
Expected: FAIL — `has no exported member 'StartsWith'` (and the others).

- [ ] **Step 3: Create `combinators.ts`**

Create `src/lib/ridiculous-type-kit/combinators.ts`:

```ts
import type { Trim } from "./primitives"

export type StartsWith<S extends string, P extends string> = S extends
  `${P}${string}` ? true : false

export type EndsWith<S extends string, P extends string> = S extends
  `${string}${P}` ? true : false

// --- paren/bracket-aware top-level splitter --------------------------
// Walks char-by-char tracking () and [] depth. Splits only on Sep when
// depth is 0. Tail-recursive (TS eliminates the tail recursion).

type Push<Acc extends string[], Cur extends string> = [...Acc, Cur]

type SplitTopLevel<
  S extends string,
  Sep extends string,
  Depth extends unknown[] = [],
  Cur extends string = "",
  Acc extends string[] = [],
> = S extends `${infer C}${infer Rest}`
  ? C extends "(" | "["
    ? SplitTopLevel<Rest, Sep, [...Depth, unknown], `${Cur}${C}`, Acc>
    : C extends ")" | "]"
      ? SplitTopLevel<
          Rest,
          Sep,
          Depth extends [unknown, ...infer D] ? D : [],
          `${Cur}${C}`,
          Acc
        >
      : C extends Sep
        ? Depth["length"] extends 0
          ? SplitTopLevel<Rest, Sep, Depth, "", Push<Acc, Cur>>
          : SplitTopLevel<Rest, Sep, Depth, `${Cur}${C}`, Acc>
        : SplitTopLevel<Rest, Sep, Depth, `${Cur}${C}`, Acc>
  : Push<Acc, Cur>

// Trim every token; for space-splitting also drop empties (collapses runs).
type TrimAll<
  T extends string[],
  DropEmpty extends boolean,
> = T extends [infer H extends string, ...infer R extends string[]]
  ? Trim<H> extends ""
    ? DropEmpty extends true
      ? TrimAll<R, DropEmpty>
      : ["", ...TrimAll<R, DropEmpty>]
    : [Trim<H>, ...TrimAll<R, DropEmpty>]
  : []

export type SplitByComma<S extends string> = TrimAll<
  SplitTopLevel<S, ",">,
  false
>

export type SplitBySpace<S extends string> = TrimAll<
  SplitTopLevel<S, " ">,
  true
>

// --- function parser --------------------------------------------------
// Splits on the FIRST "(" (name) and the LAST ")" (args), so the outer
// call wins for nested functions. Name is trimmed; args kept verbatim.

export type ParseFunction<S extends string> = Trim<S> extends
  `${infer Name}(${infer Args})`
  ? { name: Trim<Name>; args: Args }
  : never
```

- [ ] **Step 4: Re-export from the barrel**

Append to `src/lib/ridiculous-type-kit/index.ts`:

```ts
export type * from "./combinators"
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run tests/ridiculous-type-kit-combinators.test-d.ts`
Expected: PASS (4 tests). If `SplitBySpace<"rgb(255 0 0)">` returns 3 elements, the depth guard is wrong — confirm the `(`/`[` branch pushes to `Depth` and the `Sep` branch checks `Depth["length"] extends 0`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ridiculous-type-kit/combinators.ts src/lib/ridiculous-type-kit/index.ts tests/ridiculous-type-kit-combinators.test-d.ts
git commit -m "feat(type-kit): add paren-aware splitters + ParseFunction

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Barrel audit + public-surface smoke test

**Files:**
- Modify: `tests/ridiculous-type-kit-barrel.test-d.ts`

- [ ] **Step 1: Replace the barrel smoke test with a full public-surface check**

Replace the contents of `tests/ridiculous-type-kit-barrel.test-d.ts`:

```ts
import { expectTypeOf, test } from "vitest"
import type {
  // primitives
  AllChars,
  And,
  Digit,
  HexDigit,
  IsByte,
  IsNumber,
  IsNumber0To1,
  IsPercent0To100,
  IsPositiveInt,
  IsSignedDecimal,
  KeepIf,
  Length,
  Not,
  Or,
  Trim,
  // dimensions
  Dimension,
  DimensionOf,
  IsAngle,
  IsFlex,
  IsLength,
  IsPercentage,
  IsResolution,
  IsTime,
  // combinators
  EndsWith,
  ParseFunction,
  SplitByComma,
  SplitBySpace,
  StartsWith,
} from "@/lib/ridiculous-type-kit"

// Every public type must be reachable through the barrel. Referencing each
// in a no-op position fails compilation if an export is missing or renamed.
test("ridiculous-type-kit public surface is reachable via the barrel", () => {
  expectTypeOf<Trim<"  x ">>().toEqualTypeOf<"x">()
  expectTypeOf<DimensionOf<"10px">>().toEqualTypeOf<"length">()
  expectTypeOf<SplitByComma<"a, b">>().toEqualTypeOf<["a", "b"]>()
  expectTypeOf<ParseFunction<"min(0, 1)">>().toEqualTypeOf<
    { name: "min"; args: "0, 1" }
  >()
  // Compile-time reachability for the remainder (no assertion needed):
  type _Reach = [
    AllChars<"1", "1">, And<true, true>, Or<true, false>, Not<true>,
    KeepIf<true, "x">, Length<"ab">, Digit, HexDigit,
    IsByte<"1">, IsNumber<"1">, IsNumber0To1<"1">, IsPercent0To100<"1%">,
    IsPositiveInt<"1">, IsSignedDecimal<"-1">,
    Dimension, IsAngle<"1deg">, IsFlex<"1fr">, IsLength<"1px">,
    IsPercentage<"1%">, IsResolution<"1x">, IsTime<"1s">,
    EndsWith<"ab", "b">, SplitBySpace<"a b">, StartsWith<"ab", "a">,
  ]
  expectTypeOf<_Reach["length"]>().toEqualTypeOf<24>()
})
```

- [ ] **Step 2: Run the barrel test**

Run: `pnpm exec vitest run tests/ridiculous-type-kit-barrel.test-d.ts`
Expected: PASS (1 test). A missing export surfaces as `has no exported member '<Name>'`.

- [ ] **Step 3: Run the full type-test suite + biome**

Run: `pnpm exec vitest run tests/ridiculous-type-kit-primitives.test-d.ts tests/ridiculous-type-kit-dimensions.test-d.ts tests/ridiculous-type-kit-combinators.test-d.ts tests/ridiculous-type-kit-barrel.test-d.ts && pnpm exec biome check src/lib/ridiculous-type-kit tests/ridiculous-type-kit-*.test-d.ts`
Expected: vitest all PASS; biome no errors.

- [ ] **Step 4: Commit**

```bash
git add tests/ridiculous-type-kit-barrel.test-d.ts
git commit -m "test(type-kit): assert full public surface via barrel

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Register `ridiculous-type-kit` + build the registry JSON

**Files:**
- Modify: `registry.json`

- [ ] **Step 1: Add the registry item**

In `registry.json`, add this object as the FIRST entry of `items` (before `color-picker`):

```json
{
  "name": "ridiculous-type-kit",
  "type": "registry:lib",
  "title": "Ridiculous Type Kit",
  "description": "Shared template-literal type machinery: char/number primitives, CSS dimension validators (IsLength/IsAngle/IsTime/...), DimensionOf, and paren-aware parser combinators powering every ridiculous component.",
  "dependencies": [],
  "registryDependencies": [],
  "files": [
    {
      "path": "src/lib/ridiculous-type-kit/index.ts",
      "type": "registry:lib",
      "target": "lib/ridiculous-type-kit/index.ts"
    },
    {
      "path": "src/lib/ridiculous-type-kit/primitives.ts",
      "type": "registry:lib",
      "target": "lib/ridiculous-type-kit/primitives.ts"
    },
    {
      "path": "src/lib/ridiculous-type-kit/dimensions.ts",
      "type": "registry:lib",
      "target": "lib/ridiculous-type-kit/dimensions.ts"
    },
    {
      "path": "src/lib/ridiculous-type-kit/combinators.ts",
      "type": "registry:lib",
      "target": "lib/ridiculous-type-kit/combinators.ts"
    }
  ]
}
```

- [ ] **Step 2: Add the kit to the `all` bundle**

In the `all` item's `registryDependencies` array, add this as the FIRST element:

```json
"https://turtiesocks.github.io/ridiculous/r/ridiculous-type-kit.json",
```

- [ ] **Step 3: Build the registry**

Run: `pnpm registry:build`
Expected: completes without error and emits `public/r/ridiculous-type-kit.json`.

- [ ] **Step 4: Verify the emitted JSON**

Run: `test -f public/r/ridiculous-type-kit.json && echo OK`
Expected: prints `OK`.

> Contingency: if `shadcn build` errors on `type: "registry:lib"` (older CLI), change every `"registry:lib"` in the new item to `"registry:ui"` and keep the `lib/...` targets, then re-run Steps 3–4. Record which type was used in the commit message.

- [ ] **Step 5: Commit**

```bash
git add registry.json public/r/ridiculous-type-kit.json
git commit -m "feat(registry): publish ridiculous-type-kit item + add to all bundle

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Full verification gate

**Files:** none (verification only)

- [ ] **Step 1: Run the project's PR check**

Run: `pnpm pr:check`
(This runs `typecheck` + `biome check` + `vitest run` — including all `*.test-d.ts` via the configured `typecheck` mode.)
Expected: all three stages green. `tsc` wall-time should not balloon; if typecheck noticeably slows, note it for the calc phase (the recursive splitters are the suspect).

- [ ] **Step 2: Fix any failures inline**

If typecheck fails on a kit file, the most likely causes:
- `export type *` unsupported → switch the barrel to explicit `export type { ... } from "./module"` lines.
- A predicate returns `boolean` instead of `true`/`false` (a distributive-conditional leak) → wrap the offending check so it resolves to a single literal.
Re-run `pnpm pr:check` until green.

- [ ] **Step 3: Final commit (only if Step 2 changed anything)**

```bash
git add -A
git commit -m "fix(type-kit): resolve verification findings

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage** (roadmap §4.1 kit contents → task):
- Extracted existing primitives → Tasks 2–3. ✓
- New dimension primitives `IsLength`/`IsAngle`/`IsTime`/`IsResolution`/`IsPercentage`/`IsNumber`/`IsFlex` → Tasks 3 (`IsNumber`) + 4. ✓
- `Dimension` tag + `DimensionOf` → Task 4. ✓
- Combinators `SplitByComma`/`SplitBySpace`/`ParseFunction`/`StartsWith`/`EndsWith` → Task 5. ✓
- Call-site helper factory convention → documented in the barrel comment (Task 1) — deliberately NOT a runtime factory (TS limitation noted). ✓
- File layout under `src/lib/` + registry entry + type-level tests via `*-types.test-d.ts` / vitest typecheck → Tasks 1–7. ✓ (Test files are named `ridiculous-type-kit-*.test-d.ts`, matching the configured glob `tests/**/*.test-d.ts`.)
- No demo page (kit ships types only) → none planned. ✓
- Existing 4 NOT migrated → no task touches them. ✓

**2. Placeholder scan:** No "TBD"/"add error handling"/"similar to". Every code step has complete code. The Task 7 contingency is a concrete branch, not a placeholder. ✓

**3. Type/name consistency:** `HasUnit`, `SplitTopLevel`, `TrimAll`, `Push` are internal to their modules; public names (`IsLength`, `DimensionOf`, `SplitByComma`, `ParseFunction`, `StartsWith`, `EndsWith`, `And`/`Or`/`Not`/`KeepIf`, `Trim`, `IsNumber`, …) are spelled identically in the impl, the per-task tests, and the Task 6 barrel test. `IsNumber` is defined in Task 3 and consumed by `dimensions.ts` in Task 4 (dependency order correct). `Trim` (Task 2) is consumed by Tasks 4 and 5. ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-29-ridiculous-type-kit.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
