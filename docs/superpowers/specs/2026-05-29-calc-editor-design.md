# CalcEditor — Design Spec

**Date:** 2026-05-29
**Status:** Draft for implementation
**Registry item:** `calc-editor` (Phase 1 of the ridiculous component roadmap)
**Roadmap:** `docs/superpowers/specs/2026-05-29-ridiculous-component-roadmap-design.md` (§5 contract, §7 risks)
**Reuses:** `ridiculous-type-kit` (Phase 0)

---

## 1. Overview

`CalcEditor` edits a CSS math expression — `calc()`, `clamp(min, preferred, max)`, `min(...)`, `max(...)`, nested — and produces a single valid CSS math value string. It is the **peak-spectacle** component of the roadmap: the strict tier performs **compile-time dimensional analysis** of the expression tree (`length + length` ✓, `length + angle` → `never`, `length × length` → `never`, divide-by-non-number → `never`), built entirely on `ridiculous-type-kit` primitives.

It follows the house pattern proven by `easing-picker`: a popover-wrapped `<CalcEditor />` plus an inline `<CalcEditorPanel />`, both controlled (`value` + `onChange`), with sub-components exported for composition. Three usage tiers (casual `string` → IntelliSense suggestion unions → strict `CalcLiteral<S>` + `cssCalc()` call-site helper) mirror `color()` / `easing()`.

The runtime side ships a full tokenizer + recursive-descent parser/evaluator that does *everything* the type tier does and more (operator precedence, numeric value computation where dimensions allow, friendly error messages).

---

## 2. Strict-tier scope — DECISION (the headline call)

The roadmap (§7) authorizes a fallback if full recursive dimensional algebra blows `tsc`. **It does not.** A measured prototype (6+8+5 type-assertions across three probe files) typechecks in ~470 ms — indistinguishable from the ~460 ms baseline. **Therefore we ship the FULL recursive dimensional algebra strict tier**, not the fallback.

### 2.1 What the strict tier (`CalcLiteral<S>`) validates at compile time

For `calc()`, `min()`, `max()`, `clamp()` (and nesting of all four), the type:

1. **Function dispatch** — recognizes the four function names via `ParseFunction` + a name check; anything else → `never`.
2. **Paren balance** — implicit: an unbalanced string fails the `` `${name}(${args})` `` template match or leaves a stray paren that `DimensionOf` rejects as a leaf.
3. **Argument arity** — `clamp()` must have **exactly 3** comma-separated args (via `SplitByComma` tuple length); `min()`/`max()` must have **≥ 1**; `calc()` is a single expression (no top-level commas).
4. **Operator validity** — only `+ - * /` between operands (space-delimited via `SplitBySpace`); any other token in operator position → `never`.
5. **Dimensional analysis** — every operand resolves to a `Dimension` via `DimensionOf`; operators combine dimensions:
   - `+` / `-` → both operands **same** dimension, result that dimension; mismatch → `never`. (`percent` is its own dimension.)
   - `*` → **at least one** operand is `number`; result is the other operand's dimension; `length × length` → `never`.
   - `/` → **divisor** is `number`; result is the dividend's dimension; divide-by-dimension → `never`.
6. **Result dimension** — the whole expression resolves to a single `Dimension` (or `never`). `clamp`/`min`/`max` require all args resolve to the **same** dimension; the result is that dimension.
7. **Keeps the literal on success** — `CalcLiteral<S>` returns `S` (not the dimension tag) when valid, `never` otherwise, so `cssCalc()` returns the input literal type unchanged (mirrors `color()`).

### 2.2 Documented limitations of the strict tier (intentional punts)

These are **type-level only**; the runtime parser handles every one correctly.

- **L1. Right-associative evaluation, no value-level precedence.** The type evaluator recurses on the tail, making it right-associative for value arithmetic. This is **dimensionally lossless** — for `+`/`-` the same-dimension requirement is symmetric and transitive, and for `*`/`/` the number-operand requirement is order-independent — so the *dimensional verdict* is always correct. It is not used to compute a numeric result at the type level (nor should it be). Consequence: a dimensionally-valid expression is accepted regardless of grouping; the runtime parser applies real `* /` before `+ -` precedence for the computed value.
- **L2. Expression depth cap.** Nested `()` / nested functions recurse with a depth budget (`Depth` tuple, length 8). Beyond 8 levels of nesting the type **weak-accepts** (returns the literal rather than `never`) instead of recursing further — the §7 "depth cap + weak-validate the tail" mitigation. Eight levels is far past realistic CSS; the runtime parser has no cap.
- **L3. Bare-keyword math constants not range-analyzed.** `pi`, `e`, `infinity`, `-infinity`, `NaN` are accepted as `number`-dimension leaves (they are numbers in CSS math). No further checking.
- **L4. No unit *normalization*.** `calc(1in + 1px)` is `length + length` → `length` ✓ (correct: both length). The type does not assert the *computed* numeric value; runtime does.
- **L5. Function args inside an operand are dimension-resolved, not re-parsed for their own internal validity beyond what `DimensionOf` + nested `EvalCalc` cover.** A nested `min(1px, 2px)` operand resolves to `length`; a nested `min(1px, 2deg)` operand resolves to `never` (mismatched), propagating `never` up. This is correct.
- **L6. `var()` / `env()` / `attr()` and other arbitrary functions are NOT dimension-typeable** at compile time (their value is unknown). The strict tier treats an unrecognized function leaf as `never`. **Suggestion strings and the runtime tier accept them** (a `var()` can be any dimension at runtime). Documented asymmetry: if you use `var()` inside a strict `cssCalc()` literal, it will `never`; use the IntelliSense or casual tier instead. The UI builder supports inserting `var()` tokens and the runtime validator treats them as dimension-agnostic (compatible with anything).

This is a **maximal** strict tier — strictly more than the §7 fallback floor (which only required name + paren + operator + leaf-is-a-dimension). We do the full algebra.

---

## 3. Architecture

### 3.1 File layout (per §5.1)

```
src/components/ui/calc-editor/
  calc-editor.tsx         // components (CalcEditor, CalcEditorPanel, sub-components)
  calc-editor.types.ts    // CalcLiteral<S>, suggestion strings, util types, CalcNode state, cssCalc()
  calc-editor.helpers.ts  // pure runtime: tokenize, parse → AST, evaluate (dimension + value), format
  index.ts                // barrel
```

Single-file `.tsx` per the convention (color-picker 1013, gradient-editor 1140, easing-picker ~1300). Helpers split into `.helpers.ts` (color/gradient precedent) because the tokenizer/parser/evaluator is substantial pure logic. Types + the `cssCalc` const live in `.types.ts` (never beside the component → no `react-refresh/only-export-components`).

### 3.2 Component graph

```
CalcEditor (popover wrap)
  └─ trigger: <Button> — fx glyph + truncated expression + a dimension badge ("length", "—" if invalid)
  └─ <PopoverContent> → CalcEditorPanel

CalcEditorPanel (inline)
  ├─ FunctionTabs (internal)        — calc | clamp | min | max  (wraps current expr when switched)
  ├─ ExpressionField (PUBLIC)       — text input (the source of truth) + live validity/dimension readout
  ├─ TokenPalette (PUBLIC)          — click-to-insert: operators, common units, var(), clamp/min/max, parens
  ├─ FluidTypePlayground (PUBLIC)   — viewport-width slider + live computed-value readout (clamp focus)
  └─ ResultReadout (internal)       — parsed dimension, computed value @ a reference viewport, error msg
```

**Public named exports (component):** `CalcEditor`, `CalcEditorPanel`, `ExpressionField`, `TokenPalette`, `FluidTypePlayground`.
**Internal (not exported):** `FunctionTabs`, `ResultReadout`.

**Runtime helpers exported** (from `.helpers.ts` re-barreled): `tokenizeCalc`, `parseCalc`, `evaluateCalc`, `formatCalc`, `calcDimension`, `computeCalc`.

### 3.3 Registry entry

```jsonc
{
  "name": "calc-editor",
  "type": "registry:ui",
  "registryDependencies": ["ridiculous-type-kit", "button", "popover", "input"]
}
```

Uses `button` + `popover` (popover wrapper) and `input` (the expression field + token inserts). **No `slider`** shadcn item — the fluid-type playground uses a native `<input type="range">` (matches easing-picker's `Slider`, avoids adding `@radix-ui/react-slider` as a runtime dep for one viewport control). Added to the `all` bundle's `registryDependencies`.

---

## 4. Type system (`calc-editor.types.ts`)

Structure mirrors `easing-picker.types.ts`: import kit primitives → strict validators → call-site helper → suggestion strings → utility types → internal state.

### 4.1 Imports from the kit

```ts
import type {
  And, Or, Dimension, DimensionOf, SplitByComma, SplitBySpace, Trim, ParseFunction,
} from "@/lib/ridiculous-type-kit"
```

### 4.2 The dimensional evaluator (core)

```ts
// Combine two dimensions under one operator → Dimension | never.
type CombineDim<A extends Dimension, Op extends string, B extends Dimension> =
  Op extends "+" | "-" ? (A extends B ? A : never)
  : Op extends "*"     ? (A extends "number" ? B : B extends "number" ? A : never)
  : Op extends "/"     ? (B extends "number" ? A : never)
  : never

// A leaf is a dimension literal, a math constant, a parenthesized sub-expr,
// or a nested calc/min/max/clamp function call.
type EvalLeaf<S extends string, Depth extends unknown[]> =
  Trim<S> extends "pi" | "e" | "infinity" | "-infinity" | "NaN" ? "number"
  : Trim<S> extends `(${infer Inner})`
    ? Depth extends [unknown, ...infer R] ? EvalExpr<SplitBySpace<Trim<Inner>>, R> : Trim<S> /* L2 weak-accept → handled upstream */
    : Trim<S> extends `${infer Name}(${infer Args})`
      ? EvalFn<Trim<Name>, Args, Depth>
      : DimensionOf<Trim<S>>

// Evaluate a space-split token list, right-associative (L1).
type EvalExpr<Tokens extends string[], Depth extends unknown[]> = ...

// Dispatch nested function calls.
type EvalFn<Name extends string, Args extends string, Depth extends unknown[]> =
  Name extends "calc" ? EvalExpr<SplitBySpace<Trim<Args>>, Depth>
  : Name extends "min" | "max" ? EvalVariadicSame<SplitByComma<Args>, Depth>
  : Name extends "clamp" ? EvalClamp<SplitByComma<Args>, Depth>
  : never  // unknown fn (var/env/attr) → never at strict tier (L6)
```

`EvalVariadicSame` folds a comma list requiring every arg to resolve to the same dimension (≥1 arg). `EvalClamp` asserts exactly 3 args, all same dimension.

### 4.3 `CalcLiteral` + `cssCalc`

```ts
/** Strict validator: resolves to S if the expression is dimensionally valid, else never. */
export type CalcLiteral<S extends string> =
  EvalTop<Trim<S>> extends Dimension ? S : never

// EvalTop parses the outermost calc/min/max/clamp and runs the evaluator with the depth budget.
type EvalTop<S extends string> = ...

/** Call-site helper. Mirrors color()/easing(). */
export const cssCalc = <S extends string>(value: S & CalcLiteral<S>): S => value
```

### 4.4 Suggestion strings (IntelliSense + `onChange` return)

```ts
export type CalcFunctionName = "calc" | "clamp" | "min" | "max"

export type CalcString =
  | `calc(${string})`
  | `clamp(${string})`
  | `min(${string})`
  | `max(${string})`

// Per-function narrowing for the function? prop:
export interface CalcStringMap {
  calc:  `calc(${string})`
  clamp: `clamp(${string})`
  min:   `min(${string})`
  max:   `max(${string})`
}
export type CalcFn = keyof CalcStringMap
```

(Argument-level suggestion templates like `` `calc(${string} + ${string})` `` are *not* the union — they would explode and add no autocomplete value over `calc(${string})`. The IntelliSense tier's job here is "this is a calc-family string"; the strict tier does the real work.)

### 4.5 Utility types (literal-level operators, per §5.3)

```ts
/** The CSS function family of a literal. */
export type FunctionOf<S extends string> =
  S extends `calc(${string}`  ? "calc"  :
  S extends `clamp(${string}` ? "clamp" :
  S extends `min(${string}`   ? "min"   :
  S extends `max(${string}`   ? "max"   : never

/** The resolved dimension of a calc literal, or never if invalid. */
export type DimensionOfCalc<S extends string> =
  EvalTop<Trim<S>> extends infer D extends Dimension ? D : never

/** Argument count of the outer function (clamp ⇒ 3, etc.). */
export type ArgCountOf<S extends string> = ...  // SplitByComma length of ParseFunction args
```

### 4.6 Internal state — discriminated union (exported, per §5.3)

The editor's source of truth is the **text expression** (a calc string is its own best serialization), but we also expose a parsed AST node type for advanced consumers (custom serialization / programmatic construction), discriminated by `kind`:

```ts
export type CalcNode =
  | { kind: "literal"; value: string; dimension: Dimension | null }   // "10px", "2", "50%"
  | { kind: "var"; name: string; raw: string }                         // var(--x)
  | { kind: "binary"; op: "+" | "-" | "*" | "/"; left: CalcNode; right: CalcNode }
  | { kind: "fn"; name: CalcFunctionName; args: CalcNode[] }           // clamp/min/max/calc
  | { kind: "group"; inner: CalcNode }                                  // ( ... )
```

The editor's React state is `{ fn: CalcFn; expr: string }` (the active outer function + the raw expression text). `CalcNode` is the parse output, used by the runtime evaluator and exported for power users.

### 4.7 Public type exports (count)

`CalcFunctionName`, `CalcString`, `CalcStringMap`, `CalcFn`, `CalcLiteral<S>`, `FunctionOf<S>`, `DimensionOfCalc<S>`, `ArgCountOf<S>`, `CalcNode`, plus `cssCalc()` — 9 types + 1 helper. Re-export `Dimension` from the kit for convenience.

---

## 5. Component API

### 5.1 Top-level props (popover + inline)

```ts
export interface CalcEditorPanelProps<TFn extends CalcFn | undefined = undefined> {
  value: CalcString | (string & {})
  onChange: (value: TFn extends CalcFn ? CalcStringMap[TFn] : CalcString) => void
  fn?: TFn                       // lock the outer function; narrows onChange
  referenceViewport?: number     // px, default 1280 — used for the computed-value readout
  className?: string
  "aria-label"?: string
}

export interface CalcEditorProps<TFn extends CalcFn | undefined = undefined>
  extends CalcEditorPanelProps<TFn> {}
```

Controlled-only (`value` + `onChange`), matching the ColorPicker/EasingPicker precedent. `fn` mirrors easing's `basis` — locking it narrows `onChange`'s argument to e.g. `` `clamp(${string})` ``.

### 5.2 Public sub-component props

```ts
export interface ExpressionFieldProps {
  value: string
  onChange: (value: string) => void
  dimension?: Dimension | null   // for the validity badge; if omitted, field computes it
  className?: string
}

export interface TokenPaletteProps {
  onInsert: (token: string) => void   // appends/inserts a token (operator, unit-stub, var(), fn)
  className?: string
}

export interface FluidTypePlaygroundProps {
  /** A clamp()/calc() expression to evaluate live. */
  expression: string
  minViewport?: number   // px, default 320
  maxViewport?: number   // px, default 1920
  className?: string
}
```

`FluidTypePlayground` is the required showcase: a viewport-width `<input type=range>` (320–1920) and a live computed-value readout that re-evaluates `expression` at the selected viewport width (resolving `vw`/`%` against it), so a `clamp(1rem, 0.5rem + 2vw, 3rem)` visibly tracks across the range.

### 5.3 Data flow

```
parent owns value: CalcString
   ↓ (parse on mount + external change; lastEmittedRef sentinel skips our own emit)
panel state: { fn: CalcFn; expr: string }     // text is the source of truth
   ↓ (user types in ExpressionField, clicks TokenPalette, switches FunctionTabs)
evaluateCalc(expr) → { node, dimension, error }   (live, every keystroke)
   ↓
onChange(`${fn}(...)` as CalcString)   when the expression is a valid calc-family string
```

Switching `FunctionTabs` from `calc`→`clamp` wraps the current inner expression sensibly (e.g. seeds `clamp(_, <expr>, _)` placeholders); switching back unwraps where unambiguous. The text field remains authoritative — no lossy round-trip through an AST on every keystroke (the AST is derived, not stored).

---

## 6. Runtime helpers (`calc-editor.helpers.ts`)

Full implementation (the type tier's superset).

- **`tokenizeCalc(src: string): Token[]`** — lexer producing `number` (with optional unit suffix), `ident` (function names, `var`, math constants), `op` (`+ - * /`), `comma`, `lparen`, `rparen`, `percent`. Handles signs, decimals, scientific-ish CSS numbers, whitespace.
- **`parseCalc(src: string): CalcNode | null`** — recursive-descent parser with real precedence (`* /` bind tighter than `+ -`), parens, function calls (`calc`/`clamp`/`min`/`max`/`var`/passthrough). Returns `null` on any syntax error (unbalanced parens, bad arity, stray operator).
- **`calcDimension(node: CalcNode): Dimension | null`** — the runtime mirror of the type evaluator: same combine rules; `var()` is dimension-agnostic (unifies with any sibling — returns the sibling's dimension, or a special `"unknown"`-tolerant pass). Returns `null` on a dimensional violation.
- **`computeCalc(node: CalcNode, ctx: { viewport: number; rootFontSize?: number; ... }): number | null`** — numeric evaluation where units are resolvable (px, rem→16px default, vw/vh→viewport, %→relative if a basis is given). Used by `FluidTypePlayground` + `ResultReadout`. Returns `null` if a `var()` blocks computation.
- **`evaluateCalc(src: string): { node: CalcNode | null; dimension: Dimension | null; error: string | null }`** — the convenience facade the UI calls each keystroke.
- **`formatCalc(node: CalcNode): CalcString`** — canonical serialization (normalized spacing: `calc(10px + 2rem)`).

`var()` runtime policy: dimension-agnostic. In `calcDimension`, a `var()` operand unifies with its sibling under `+`/`-` (adopts the sibling's dimension) and is treated as a valid `number`-or-any under `*`/`/`. This makes `calc(100% - var(--gap))` valid at runtime (dimension `percent`/`length` tolerant) even though the strict type tier rejects `var()` (L6). Matches real CSS permissiveness.

---

## 7. Demo & examples

### 7.1 MPA entry + page

- `pages/calc-editor/index.html` + `pages/calc-editor/main.tsx` (clone easing's).
- `src/pages/calc-editor/page.tsx` — `Layout variant="compact"`, `SectionHeader`s, examples, `InstallCta args="add https://turtiesocks.github.io/ridiculous/r/calc-editor.json"`.

### 7.2 Examples (`src/examples/calc-editor/`)

Per §5.4 minimum + the required playground:

- `basic-usage.tsx` — `CalcEditor` with `value`+`onChange`, shows emitted string.
- `tier-casual.tsx` — `useState<string>`, plain string in/out (matches the index 3-tier card shape).
- `tier-intellisense.tsx` — `useState<CalcString>`, suggestion-union typed.
- `tier-strict.tsx` — `cssCalc(...)` valid + `@ts-expect-error` rejections (length−angle, length×length, divide-by-length).
- `api-reference.tsx` — props + helper + type tables (mirror easing's `ApiReference`).
- `fluid-type-playground.tsx` — **the showcase**: `clamp()` expression + viewport slider + live computed px readout, demonstrating fluid typography resolving across the viewport.

Index page 3-tier cards (`src/pages/index/page.tsx`) currently import color-picker tiers; **not touched** (do-not-modify rule). The calc tiers live only on the calc page.

### 7.3 Nav + registry

`pnpm nav:build` regenerates `src/generated/nav.ts` (picks up the registry item). `pnpm registry:build` emits `public/r/calc-editor.json` (gitignored — regenerated, not committed). Only `registry.json` is committed.

---

## 8. Testing (per §5.5)

- **`tests/calc-editor-types.test-d.ts`** — the primary gate. Asserts acceptance (valid literals resolve to themselves via `expectTypeOf<CalcLiteral<...>>().toEqualTypeOf<...>()` and `cssCalc(...)` happy paths) AND rejection (`toBeNever()` on dimension violations, `@ts-expect-error` on `cssCalc` bad calls). Covers: calc add/sub same-dim, mismatch→never, mul number-rule, mul dim×dim→never, div divisor-rule, clamp 3-arg + arity violation, min/max ≥1, nested calc/clamp, percent dimension, var()→never (L6), depth weak-accept (L2), `FunctionOf`/`DimensionOfCalc`/`ArgCountOf`, `CalcEditor fn="clamp"` narrows onChange.
- **`tests/calc-editor-parse.test.ts`** — `tokenizeCalc`/`parseCalc`/`calcDimension`/`evaluateCalc`: valid expressions parse to expected AST; syntax errors → null; dimensional violations → null dimension; var() tolerance; nested functions; precedence (`10px + 2 * 5px` parses with `*` tighter).
- **`tests/calc-editor-format.test.ts`** — `formatCalc`/`computeCalc`: canonical spacing; computed value at a reference viewport for `vw`/`rem`/`%`; clamp clamping behavior in `computeCalc`; null when var() blocks.
- **`tests/calc-editor.test.tsx`** — jsdom render/interaction: panel renders the field; typing emits onChange with a valid calc string; invalid input shows the error/—badge and does NOT emit; TokenPalette insert appends a token; FunctionTabs switch wraps; FluidTypePlayground slider updates the computed readout; popover trigger shows the dimension badge.
- **Coverage:** add `"src/components/ui/calc-editor/**"` to `vitest.config.ts` `coverage.include`. Thresholds unchanged (90/85/90/90).

---

## 9. Assumptions (every design call made on the sleeping human's behalf)

1. **Strict tier = FULL dimensional algebra, not the §7 fallback.** Justified by a measured `tsc` prototype (~470 ms, ≈ baseline). This is the single biggest call. If a later phase's kit growth regresses `tsc`, the documented fallback (name + paren + operator + leaf-is-dimension) remains a drop-in retreat.
2. **Call-site helper name = `cssCalc`** (roadmap's suggested example). `calc` collides with the CSS function mentally and is too generic; `cssCalc` is unambiguous and non-colliding with any export.
3. **Inline panel name = `CalcEditorPanel`** (not `CalcPanel`) — consistent with `<Component>` + `<ComponentPanel>` only loosely (easing uses `EasingPanel`); chose the longer form for clarity since "CalcPanel" is ambiguous. Both `CalcEditor` and `CalcEditorPanel` exported.
4. **Public sub-components = `ExpressionField`, `TokenPalette`, `FluidTypePlayground`** (3). Smaller surface than easing's 9 because calc is text-expression-centric, not multi-mode-canvas-centric. These three are the genuinely reusable units.
5. **Text is the source of truth, AST is derived.** A calc string round-trips losslessly to itself; storing an AST as state would force lossy reconstruction on every keystroke (operator precedence, spacing). The exported `CalcNode` discriminated union satisfies the §5.3 "exported internal discriminated-union state" requirement as the *parse output* type, which is the meaningful advanced-use surface here.
6. **`fn?` prop mirrors easing's `basis?`** for type-locked `onChange` narrowing (`CalcStringMap`). Default undefined → full `CalcString` union.
7. **IntelliSense tier = `calc(${string})`-family unions**, not argument-templated. Argument-level templates add no real autocomplete and risk union blowup; the strict tier is where precision lives.
8. **`var()` asymmetry (L6):** strict tier rejects `var()` (undecidable dimension at compile time); IntelliSense + casual + the UI + the runtime accept it (runtime treats it dimension-agnostically). Documented; the tier-strict example notes it.
9. **Math constants** (`pi`, `e`, `infinity`, `-infinity`, `NaN`) treated as `number` leaves. No range analysis (L3).
10. **Depth cap = 8** nested levels, weak-accept beyond (L2 / §7 mitigation). Runtime uncapped.
11. **No `slider` shadcn dep** — native `<input type=range>` for the viewport control, matching easing-picker's internal `Slider`. Keeps runtime deps unchanged; `registryDependencies` = `ridiculous-type-kit`, `button`, `popover`, `input`.
12. **`referenceViewport` default = 1280**, playground range **320–1920** — common desktop reference + mobile→desktop span for fluid-type demos.
13. **`rem` computes against 16px** in `computeCalc` (CSS initial value); not configurable in v1 (non-breaking to add a `rootFontSize` ctx field — already in the signature).
14. **Right-associative type evaluation (L1)** accepted as dimensionally lossless; documented. No attempt to encode full operator precedence at the type level (unnecessary for dimensional correctness, and a real `tsc` cost).
15. **FunctionTabs wrap/unwrap heuristic:** switching to `clamp` seeds the current expr as the middle (preferred) arg with placeholder min/max; switching among `calc`/`min`/`max` rewraps the inner. Best-effort, never throws; the text field stays editable as the escape hatch.
16. **Do-not-modify scope honored:** only new files + append to `registry.json` + the one `coverage.include` line in `vitest.config.ts`. The index page's 3-tier cards stay color-picker-based.

---

## 10. Out of scope (v1 non-goals)

- `sin()`/`cos()`/`tan()`/`atan2()`/`pow()`/`sqrt()`/`hypot()`/`mod()`/`rem()`/`round()` CSS math functions — runtime parser may *tolerate* them as passthrough/number, but no dedicated typing or UI; full trig/exponent typing is a v2.
- Type-level numeric *value* computation (only dimensional analysis at compile time).
- `var()` strict-tier typing (undecidable; L6).
- Unit conversion/normalization at the type level (L4).
- A visual expression-tree editor (drag nodes) — text field + palette only in v1.
- `attr()` typed return (`attr(data-x px)`) — passthrough only.
- Persisting/serializing editor state beyond the calc string itself.

---

## 11. Effort sketch

| Area | Notes |
|------|-------|
| Types: `CalcLiteral` evaluator + suggestion + util + state | prototyped; ~½ the type-test file is the gate |
| Helpers: tokenizer + parser + dimension + compute + format | the bulk of runtime LOC |
| Components: Panel + ExpressionField + TokenPalette + FluidTypePlayground + popover | ~600–800 lines `.tsx` |
| Tests: type-d + parse + format + tsx | type-d is primary |
| Wiring: registry + nav + demo page + examples | mechanical, mirror easing |
