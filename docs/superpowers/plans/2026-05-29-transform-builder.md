# transform-builder — Implementation Plan (TDD)

Spec: `docs/superpowers/specs/2026-05-29-transform-builder-design.md`.
Pattern source: `src/components/ui/calc-editor/*`.

Order: type-tests FIRST (the validator is the product), then types, then runtime
helpers (tests first), then component (tests first), then demo + wiring, then green
`pnpm pr:check`. Commit per logical unit. Each commit must leave the tree
typecheck-clean.

---

## Task 1 — Strict-tier type tests (RED)

File `tests/transform-builder-types.test-d.ts`. Cover, with `expectTypeOf` +
`toEqualTypeOf` / `toBeNever` and `@ts-expect-error` on `cssTransform`:

- translateX/Y: `translateX(10px)`✓ `translateY(2rem)`✓ `translate(10px, 20%)`✓
  `translateX(45deg)`✗ `translateX()`✗ (arity 0)
- translateZ/perspective: `translateZ(10px)`✓ `perspective(800px)`✓
  `translateZ(50%)`✗ (z is length-only) `perspective(45deg)`✗
- translate3d: `translate3d(1px, 2%, 3px)`✓ `translate3d(1px, 2px, 3%)`✗ (z len)
  `translate3d(1px, 2px)`✗ (arity)
- rotate family: `rotate(45deg)`✓ `rotateX(1turn)`✓ `rotate(10px)`✗
- rotate3d: `rotate3d(1, 1, 1, 45deg)`✓ `rotate3d(1, 1, 1, 1)`✗ (4th must be angle)
  `rotate3d(1, 1, 45deg)`✗ (arity 3)
- scale family: `scale(1.5)`✓ `scale(50%)`✓ `scale(1, 2)`✓ `scaleX(2)`✓
  `scale3d(1, 2, 3)`✓ `scale(45deg)`✗ `scaleX(10px)`✗
- skew family: `skew(10deg)`✓ `skew(10deg, 20deg)`✓ `skewX(10deg)`✓ `skew(1px)`✗
- matrix: `matrix(1, 0, 0, 1, 0, 0)`✓ `matrix(1, 0, 0, 1, 0)`✗ (arity 5)
  `matrix(1, 0, 0, 1, 0, 0px)`✗ (arg not number)
- matrix3d: 16-number ✓ ; 15-number ✗ (arity)
- multi-function list: `translateX(10px) rotate(45deg) scale(1.5)`✓ ;
  `translateX(10px) rotate(10px)`✗ (second invalid)
- `none`✓ ; empty/garbage ✗
- `cssTransform("…valid…")` returns the literal; 4–5 `@ts-expect-error` invalid calls.
- Utility: `FunctionsOf<"translateX(1px) rotate(45deg)">` →
  `["translateX", "rotate"]`; `FunctionCountOf<…>` → `2`;
  `FunctionsOf<"none">` → `[]`.
- Suggestion: `"translate(1px, 2px)"` matches `TransformString`;
  `TransformStringMap["rotate"]` equals `` `rotate(${string})` ``;
  `TransformFn` equals the function-name union; `TransformFunctionName` union.
- State: a `TransformItem` value of each kind type-checks against the union.
- Component: `Parameters<typeof TransformBuilder>[0]["onChange"]` param 0 equals
  `TransformString` (no fn narrowing).

Run `pnpm exec vitest run tests/transform-builder-types.test-d.ts` → RED
(module missing). Commit nothing yet (RED is the start of Task 2's commit).

## Task 2 — `transform-builder.types.ts` (GREEN for Task 1)

Implement to satisfy Task 1. Sections mirror calc-editor.types.ts:

1. **kit imports:** `DimensionOf, IsAngle, IsLength, IsNumber, IsPercentage,
   ParseFunction, SplitByComma, SplitBySpace, Trim, And, Or, KeepIf` + `Dimension`.
2. **per-dimension predicate aliases** (kept clean for Phase 3 reuse):
   - `IsLengthPct<S> = Or<IsLength<Trim<S>>, IsPercentage<Trim<S>>>`
   - `IsNumberPct<S> = Or<IsNumber<Trim<S>>, IsPercentage<Trim<S>>>`
   - reuse kit `IsLength`/`IsAngle`/`IsNumber` directly for the rest.
3. **`AllArgsAre<Args extends string[], Pred>`** — flat fold; but TS has no
   higher-kinded preds, so implement as **explicit folds per predicate**:
   `AllLength`, `AllAngle`, `AllNumber`, `AllNumberPct`, `AllLengthPct` —
   each `Args extends [H, ...T] ? (PredOnH extends true ? AllX<T> : false) : true`.
   (Empty tuple → true; arity is checked separately so callers guard count.)
4. **`ValidateFn<Name, ArgStr>`** — the dispatch table. `Args = SplitByComma<ArgStr>`.
   For each name: check `Args["length"]` against allowed arities, then the right
   `AllX<Args>`. Special-cases:
   - `translate3d`: split is fine but z differs — destructure
     `Args extends [infer X, infer Y, infer Z]` and check
     `And<IsLengthPct<X>, And<IsLengthPct<Y>, IsLength<Z>>>`.
   - `rotate3d`: `[infer A, infer B, infer C, infer D]` →
     `And<IsNumber<A>, And<IsNumber<B>, And<IsNumber<C>, IsAngle<D>>>`.
   - 1–2 arity functions (`translate`,`scale`,`skew`): accept length 1 OR 2.
   - returns `true` | `false`.
5. **`ValidateList<Tokens extends string[]>`** — fold over `SplitBySpace`
   result; each token `ParseFunction<token>` → `{name, args}` → `ValidateFn`.
   Any `false` → `false`. Empty list → handled by caller (`none`).
6. **`TransformLiteral<S>`**: `Trim<S> extends "none" ? S : (ValidateList<SplitBySpace<Trim<S>>> extends true ? S : never)`.
   Guard the empty-string / single-garbage-token cases so they → `never`.
7. **`cssTransform`** call-site helper.
8. **Suggestion strings:** `TransformFunctionName` union; `TransformString`
   = union of `` `${fn}(${string})` `` per function + `"none"` + the open
   list form. NOTE: to make multi-function strings assignable, include a
   `` `${string})` ``-style catch or compose; verify against Task-1
   `toMatchTypeOf` (use the same approach as `CalcString` — a union of the
   per-function head shapes; multi-function lists match via the trailing
   `${string}` of the FIRST function's shape — confirm in tests, adjust if
   `toMatchTypeOf` fails by adding `` `${TransformFunctionName}(${string}` ``
   broad members).
9. **`TransformStringMap`** interface keyed by function name; `TransformFn`.
10. **Utility types:** `FunctionsOf<S>` (recurse `SplitBySpace` → map each via
    `ParseFunction["name"]` into a tuple; `none`/empty → `[]`),
    `FunctionCountOf<S>` (= `FunctionsOf<S>["length"]`).
11. **`TransformItem`** discriminated union (one variant per function, `fn` as
    discriminant) + `TransformFunctionName` re-used. Re-export kit `Dimension`.

Run the type test → GREEN. Run `pnpm exec tsc --noEmit -p tsconfig.app.json` to
confirm no type errors. Commit: types + type-test together.

## Task 3 — runtime helper tests (RED)

`tests/transform-builder-parse.test.ts` + `tests/transform-builder-format.test.ts`.

parse:
- `parseTransform("translateX(10px) rotate(45deg)")` → 2 items with correct
  `fn` + parsed args.
- `parseTransform("none")` → `[]`; `parseTransform("")` → `[]`.
- arity violation `matrix(1,0,0,1,0)` → `null`; unknown `foo(1)` → `null`.
- dimension-tolerant: `translateX(calc(1px + 2px))` → parses (opaque arg kept).
- `transformFunctions("translateX(1px) rotate(45deg)")` → `["translateX","rotate"]`.
- `defaultItem("rotate")` → rotate item with `0deg`; `defaultItem("matrix")` →
  identity 6-tuple.
- `argSpec("translate3d")` → `{ count: 3, … , labels: ["x","y","z"] }` (count
  may be a range marker for 1–2 fns; assert shape).

format:
- `formatTransform(parseTransform("translateX(10px)  rotate(45deg)")!)` →
  `"translateX(10px) rotate(45deg)"` (normalized single spaces).
- `formatTransform([])` → `"none"`.
- `itemToCss` per item kind.

Run → RED.

## Task 4 — `transform-builder.helpers.ts` (GREEN for Task 3)

Implement `parseTransform`, `formatTransform`, `transformFunctions`,
`defaultItem`, `itemToCss`, `argSpec`. A runtime `ARG_SPEC` table keyed by
function name = single source of truth (count or count-range, arg "kind"s,
axis labels). Parser: split top-level by spaces (paren-aware), regex
`^([a-zA-Z3d]+)\((.*)\)$` per token, split args by top-level commas, validate
count against the spec (range-aware for translate/scale/skew), store raw arg
strings + parsed numeric+unit where simple. `none`/empty → `[]`. Run → GREEN.
Run typecheck. Commit helpers + their tests.

## Task 5 — component tests (RED)

`tests/transform-builder.test.tsx` (jsdom):
- `TransformBuilderPanel value="translateX(10px) rotate(45deg)"` renders two
  rows with the right function selects + arg inputs.
- editing an arg input emits `onChange` with the updated valid string.
- changing a row's function select **dispatches**: arg editors swap (e.g.
  translateX→rotate shows a single angle input) and emits a re-seeded string.
- `AddFunctionMenu` adds a row (onChange grows the list).
- remove button drops a row.
- `value="none"` renders an empty list + add control; adding emits a real string.
- `TransformPreview3D` renders a card whose style.transform reflects the value.
- a slider scrubber updates the value (range input change → onChange).
- `TransformBuilder` (popover) renders a trigger; opening reveals the panel.

Run → RED.

## Task 6 — `transform-builder.tsx` + `index.ts` (GREEN for Task 5)

Implement components per spec §5. State = `TransformItem[]` derived from
`value` via `parseTransform`, resynced on external value change (skip own
emits via a `lastEmittedRef`, calc-editor pattern). Rows render from
`ARG_SPEC`. `commit(items)` → `formatTransform` → `onChange`. `ArgEditor` =
native number input + unit `<select>` for length/angle kinds (unitless for
number/number-pct). `TransformPreview3D`: a perspective wrapper + a card with
`style={{ transform: value }}` + a few range scrubbers that map to
translateX/translateY/rotate/scale/skewX items merged into the list.
Barrel `index.ts` exports components, helpers, and all type surface (mirror
calc-editor/index.ts). Run component test → GREEN. Typecheck + biome. Commit
component + index + component test.

## Task 7 — demo page + examples

`pages/transform-builder/{index.html,main.tsx}`, `src/pages/transform-builder/page.tsx`,
`src/examples/transform-builder/{basic-usage,tier-casual,tier-intellisense,
tier-strict,api-reference,preview-3d}.tsx`. Mirror calc-editor examples
structure. Commit.

## Task 8 — wiring: vite + registry + nav + coverage

- `vite.config.ts`: add the MPA input line.
- `registry.json`: add `transform-builder` item + add to `all` bundle +
  update `all` description.
- `vitest.config.ts`: add `src/components/ui/transform-builder/**` to
  `coverage.include`.
- `pnpm nav:build` (regenerates `src/generated/nav.ts`).
- `pnpm registry:build` (regenerates gitignored `public/r/*` — do NOT commit).
Commit `vite.config.ts`, `registry.json`, `vitest.config.ts`, and the
regenerated `src/generated/nav.ts`.

## Task 9 — green `pnpm pr:check`

Run typecheck + check + test (in parallel where possible). Fix biome
(no semicolons, double quotes, 2-space). Iterate to GREEN. If vitest errors on
`@/generated/nav`, run `pnpm nav:build` first. Final commit if any fixups.

---

### Risk watch
- `TransformString` `toMatchTypeOf` for multi-function lists — the trickiest
  suggestion-string call. If a flat union of per-function heads doesn't match
  `"translateX(1px) rotate(45deg)"`, broaden to include
  `` `${TransformFunctionName}(${string}` `` members (head-anchored) — the
  multi-fn string still starts with a function name. Confirm via Task-1 test.
- matrix3d 16-arg fold compile time — measure `tsc` wall-time after Task 2;
  if it regresses, switch matrix3d to arity-only per spec §2.1 fallback and
  note it in the api-reference + spec.
