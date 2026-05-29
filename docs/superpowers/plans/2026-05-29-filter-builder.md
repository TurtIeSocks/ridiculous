# filter-builder — Implementation Plan (TDD)

Spec: `docs/superpowers/specs/2026-05-29-filter-builder-design.md`.
Pattern source: `src/components/ui/transform-builder/*` (function-list dispatch, Phase 2).

Order: type-tests FIRST (the validator is the product), then types, then runtime helpers
(tests first), then component (tests first), then demo + wiring, then green `pnpm pr:check`.
Commit per logical unit. Each commit must leave the tree typecheck-clean.

Function set: `blur`(length), `hue-rotate`(angle),
`brightness|contrast|grayscale|invert|opacity|saturate|sepia`(non-neg number|percentage),
`drop-shadow`(2-3 lengths + optional trailing color), `url`(non-empty body). `none` = empty.

---

## Task 1 — Strict-tier type tests (RED)

File `tests/filter-builder-types.test-d.ts`. `expectTypeOf` + `toEqualTypeOf`/`toBeNever`,
`@ts-expect-error` on `cssFilter`. Import the (not-yet-existing) types from
`@/components/ui/filter-builder/filter-builder.types` + the component type for the onChange test.

Cover:
- **blur**: `blur(4px)`✓ `blur(2rem)`✓ `blur(0)`✗ (length needs a unit — `0` is bare number; CSS
  technically allows unitless 0 but the kit `IsLength` requires a unit, matching transform's
  translateZ behavior) `blur(45deg)`✗ `blur()`✗ (arity 0).
- **hue-rotate**: `hue-rotate(90deg)`✓ `hue-rotate(0.5turn)`✓ `hue-rotate(1rad)`✓
  `hue-rotate(10px)`✗.
- **amount fns** (brightness/contrast/grayscale/invert/opacity/saturate/sepia): `brightness(1.2)`✓
  `contrast(200%)`✓ `saturate(0)`✓ `opacity(50%)`✓ `brightness(-1)`✗ (negative bare number)
  `grayscale(45deg)`✗.
- **drop-shadow**: `drop-shadow(2px 2px)`✓ (x,y) `drop-shadow(2px 2px 4px)`✓ (x,y,blur)
  `drop-shadow(2px 2px 4px rgb(0 0 0))`✓ (x,y,blur,color) `drop-shadow(2px 2px red)`✗ — wait, `red`
  is a keyword not a ColorLiteral → ✗ (document: keyword colors aren't in ColorLiteral; use functional
  / hex) ; `drop-shadow(2px 2px #f00)`✓ (x,y,color) `drop-shadow(2px 2px 4px wrong)`✗ (bad color)
  `drop-shadow(red 2px 2px)`✗ (leading color — strict is color-last only) `drop-shadow(2px)`✗ (arity)
  `drop-shadow(2px 2px 3px 4px 5px)`✗ (too many).
- **url**: `url(#f)`✓ `url("filters.svg#blur")`✓ `url(filter.svg)`✓ `url()`✗ (empty body).
- **multi-function list**: `blur(4px) brightness(1.2) drop-shadow(2px 2px 4px #000)`✓ ;
  `blur(4px) brightness(45deg)`✗ (second invalid) ; `blur(4px) hue-rotate(90deg) saturate(150%)`✓.
- `none`✓ ; `""`✗ ; `wobble(3)`✗ ; `blur`✗ (no parens).
- **cssFilter**: a valid call returns the literal; `@ts-expect-error` on `blur(45deg)`,
  `hue-rotate(10px)`, `drop-shadow(2px 2px 4px wrong)`, `url()`, `wobble(3)`,
  `blur(calc(1px + 2px))` (calc undecidable strictly).
- **utility**: `FunctionsOf<"blur(4px) brightness(1.2)">` → `["blur","brightness"]` ;
  `FunctionCountOf<…>` → `2` ; `FunctionsOf<"none">` → `[]` ;
  `HasDropShadow<"blur(4px) drop-shadow(1px 1px #000)">` → `true` ;
  `HasDropShadow<"blur(4px)">` → `false`.
- **suggestion**: `"blur(4px)"` matches `FilterString` ; `"none"` matches ;
  `"blur(4px) brightness(1.2)"` matches ; `FilterStringMap["hue-rotate"]` equals
  `` `hue-rotate(${string})` `` ; `FilterStringMap["drop-shadow"]` equals
  `` `drop-shadow(${string})` `` ; `FilterFn` equals `FilterFunctionName`.
- **state**: a `FilterItem` of each kind type-checks (blur, hue-rotate, brightness amount,
  drop-shadow with+without color/blur, url).
- **component onChange**: `Parameters<typeof FilterBuilder>[0]["onChange"]` param 0 equals
  `FilterString`.

Run `pnpm exec vitest run tests/filter-builder-types.test-d.ts` → RED (module missing).

## Task 2 — `filter-builder.types.ts` (GREEN for Task 1)

Sections mirror `transform-builder.types.ts`:

1. **kit imports:** `And, IsAngle, IsLength, IsNonNegativeNumber, IsPercentage, Or, ParseFunction,
   SplitByComma, SplitBySpace, Trim`. **color import:** `ColorLiteral` from
   `@/components/ui/color-picker/color-picker.types`.
2. **predicate aliases:**
   - `IsAmount<S> = Or<IsNonNegativeNumber<Trim<S>>, IsPercentage<Trim<S>>>`
   - reuse kit `IsLength`/`IsAngle` directly.
   - `IsColor<S> = ColorLiteral<Trim<S>> extends never ? false : true` (collapse the literal-or-never
     validator into a boolean for the fold).
3. **drop-shadow validator** `ValidateDropShadow<ArgStr>`:
   - `Parts = SplitBySpace<ArgStr>` (paren-aware → color with internal spaces stays one token).
   - `Parts extends [X, Y]` → `And<IsLength<X>, IsLength<Y>>`
   - `Parts extends [X, Y, Z]` → `And<IsLength<X>, And<IsLength<Y>, Or<IsLength<Z>, IsColor<Z>>>>`
   - `Parts extends [X, Y, Z, W]` → `And<IsLength<X>, And<IsLength<Y>, And<IsLength<Z>, IsColor<W>>>>`
   - else `false`.
4. **url validator** `ValidateUrl<ArgStr> = Trim<ArgStr> extends "" ? false : true`.
5. **`ValidateFn<Name, ArgStr>`** dispatch table:
   - `blur` → `SplitByComma<ArgStr> extends [L] ? IsLength<Trim<L>> : false`
   - `hue-rotate` → `[A] ? IsAngle<Trim<A>> : false`
   - amount union → `[N] ? IsAmount<N> : false`
   - `drop-shadow` → `ValidateDropShadow<ArgStr>`
   - `url` → `ValidateUrl<ArgStr>`
   - else `false`.
6. **`ValidateToken<Token>`** = `ParseFunction<Token>` → `{name, args}` → `ValidateFn`. (`ParseFunction`
   handles kebab names — splits on first `(`.)
7. **`ValidateList<Tokens>`** — fold; any `false` → `false`; empty → `true`.
8. **`FilterLiteral<S>`**: `Trim<S> extends "none" ? S : Trim<S> extends "" ? never :
   SplitBySpace<Trim<S>> → Tokens ; Tokens extends [] ? never : ValidateList<Tokens> extends true ? S
   : never`. (Mirror `TransformLiteral` exactly.)
9. **`cssFilter`** call-site helper.
10. **suggestion strings:** `FilterFunctionName` union (all 11) ;
    `FilterString = `${FilterFunctionName}(${string})` | "none"` ; `FilterStringMap` interface keyed by
    name (kebab keys quoted) ; `FilterFn = keyof FilterStringMap`.
11. **utility types:** `FunctionsOf<S>` (recurse `SplitBySpace` → `ParseFunction["name"]` tuple ;
    `none`/`""` → `[]`) ; `FunctionCountOf<S>` ; `HasDropShadow<S>` (fold `FunctionsOf<S>`, true if any
    element is `"drop-shadow"`).
12. **`FilterItem`** discriminated union (§3.6 of the spec): blur/hue-rotate/amount = `{fn; value}`,
    drop-shadow = `{fn:"drop-shadow"; x; y; blur?; color?}`, url = `{fn:"url"; url}`. Export
    `AmountFn` helper type. Re-export kit `Dimension` for convenience.

Run type test → GREEN. `pnpm exec tsc --noEmit -p tsconfig.app.json` clean. Commit types + type-test.

## Task 3 — runtime helper tests (RED)

`tests/filter-builder-parse.test.ts` + `tests/filter-builder-format.test.ts`.

parse:
- `parseFilter("blur(4px) brightness(1.2) hue-rotate(90deg)")` → 3 items, correct fn+value.
- `parseFilter("drop-shadow(2px 2px 4px rgb(0 0 0 / 0.5))")` →
  `[{fn:"drop-shadow", x:"2px", y:"2px", blur:"4px", color:"rgb(0 0 0 / 0.5)"}]` (paren-aware split keeps
  the color whole).
- `parseFilter("drop-shadow(2px 2px)")` → x,y, no blur, no color.
- `parseFilter("drop-shadow(2px 2px #000)")` → x,y,color (no blur).
- leading-color normalization: `parseFilter("drop-shadow(red 2px 2px)")` →
  `{x:"2px", y:"2px", color:"red"}` (runtime tolerant; normalized color-last).
- url variants: `url(#f)`, `url("a.svg#b")`, `url(a.svg)` → `{fn:"url", url:"…"}`.
- `parseFilter("none")`/`("")`/`("   ")` → `[]`.
- arity/unknown → `null`: `blur(1px, 2px)` (too many), `drop-shadow(1px)`, `wobble(3)`, `blur`.
- calc/var tolerant: `parseFilter("blur(calc(4px + 1px))")` keeps the opaque arg.
- `filterFunctions("blur(4px) brightness(1.2)")` → `["blur","brightness"]`.
- `defaultItem`: `blur`→`{value:"4px"}`, `brightness`→`{value:"1"}`, `hue-rotate`→`{value:"90deg"}`,
  `drop-shadow`→ x/y/blur/color seeded, `url`→`{url:"#filter"}`.
- `argSpec("blur")` → `{min:1, max:1, kind:"length"}` ; `argSpec("drop-shadow")` → shadow kind, min 2
  max 4 (token count) ; `argSpec("url")` → url kind.

format:
- `formatFilter(parseFilter("blur(4px)   brightness(1.2)")!)` → `"blur(4px) brightness(1.2)"`.
- drop-shadow canonical color-last:
  `formatFilter([{fn:"drop-shadow", x:"2px", y:"2px", blur:"4px", color:"#000"}])` →
  `"drop-shadow(2px 2px 4px #000)"` ; without blur → `"drop-shadow(2px 2px #000)"` ; without color →
  `"drop-shadow(2px 2px 4px)"`.
- `formatFilter([])` → `"none"`.
- `itemToCss` per kind (incl url, amount).
- round-trip each function group.

Run → RED.

## Task 4 — `filter-builder.helpers.ts` (GREEN for Task 3)

Implement `parseFilter`, `formatFilter`, `filterFunctions`, `defaultItem`, `itemToCss`, `argSpec`,
`ARG_SPEC`. Mirror transform's helpers:

- `ArgKind = "length" | "amount" | "angle" | "shadow" | "url"`.
- `ARG_SPEC: Record<FilterFunctionName, {min; max; kind; labels}>` — single source of truth.
- Reuse transform's paren-aware `splitTopLevel(src, sep)` (copy into this file — helpers don't share a
  module; same small util).
- `splitFunctions` (space, drop empties), regex for `name(args)` — **name regex must allow `-`**:
  `^([a-zA-Z][a-zA-Z-]*)\((.*)\)$` (so `hue-rotate`, `drop-shadow` match).
- `parseFilter`: per token → match → `isFilterName` guard → build item by kind:
  - length/amount/angle → `{fn, value: trimmed body}` (single arg; reject extra commas via arity).
  - `url` → `{fn:"url", url: trimmed body}` (non-empty; empty → null? — runtime: empty url is invalid →
    null).
  - `drop-shadow` → space-split args (paren-aware) → classify: collect tokens; the lengths are tokens
    that look length-like (`/^-?[\d.]+[a-z%]*$/i` and not a function), the color is the remaining
    non-length token (supports leading or trailing). Require ≥2 length tokens (x,y); optional 3rd length
    = blur; optional 1 color. >3 lengths or >1 color or <2 lengths → null. Build
    `{x, y, blur?, color?}`.
- `formatFilter` / `itemToCss`: drop-shadow emits `x y` + (blur ? ` ${blur}`) + (color ? ` ${color}`).
- `defaultItem` per spec §4 (A7 color seed `rgb(0 0 0 / 0.5)`).
- `filterFunctions` = parse then map `fn`.

Run → GREEN. Typecheck. Commit helpers + their tests.

## Task 5 — component tests (RED)

`tests/filter-builder.test.tsx` (jsdom; canvas mock already in setup.ts for the embedded ColorPicker):
- `FilterBuilderPanel value="blur(4px) brightness(1.2)"` → two rows, right function selects + arg inputs.
- editing a length arg → onChange with updated string.
- editing an amount arg (unitless / with % toggle) → onChange.
- changing a row fn select **dispatches**: blur→hue-rotate swaps to an angle editor; emits re-seeded
  string.
- `AddFilterMenu` adds a row.
- remove button drops a row.
- `value="none"` → empty list + add control; adding emits a real string.
- **drop-shadow row**: renders x/y/blur length editors + a ColorPicker (assert the color-picker trigger
  exists). Editing the blur slot emits the updated drop-shadow string. (ColorPicker interaction itself is
  covered by color-picker's own suite; here assert presence + a length-slot edit.)
- **mode toggle / preview**: `FilterPreview value="blur(4px)" mode="filter"` applies `filter` to the
  target; toggling to backdrop-filter applies `backdropFilter`. Assert `style.filter` /
  `style.backdropFilter` via `data-` attr on the preview target.
- preview scrubber commits back through onChange.
- `FilterBuilder` (popover) renders a trigger; opening reveals the panel.

Run → RED.

## Task 6 — `filter-builder.tsx` + `index.ts` (GREEN for Task 5)

Implement per spec §5. State = `FilterItem[]` from `parseFilter(value)`, resynced on external value
(skip own emits via `lastEmittedRef`, transform pattern). Rows render from `ARG_SPEC`.
`commit(items)` → `formatFilter` → `onChange`.

- `FilterArgEditor`: native number input + unit `<select>` for length(px/rem/em/%/vw/vh)/angle
  (deg/grad/rad/turn) kinds; unitless for amount (with an optional `%` suffix toggle — keep it simple: a
  number input + a `%` toggle button, OR just a number input and let the user type `%`; choose number
  input + unit select where the amount unit set is `["", "%"]`). Opaque calc/var → raw text input (no
  unit select), transform pattern.
- `DropShadowRow` (or inline in `FilterFunctionRow`): x/y/blur `FilterArgEditor`s (length) + a
  `<ColorPicker value={item.color ?? "rgb(0 0 0 / 0.5)"} onChange={…} />` + a "× color" clear toggle
  (A8). Reuse `ColorPicker` from `@/components/ui/color-picker`.
- `FilterPreview` (showcase): a stage with a busy gradient/image background and a foreground card/image;
  a `filter` ↔ `backdrop-filter` toggle (controlled by `mode`, defaulting from the prop) that switches
  which element receives the value; range scrubbers for blur/brightness/contrast/saturate/hue-rotate that
  merge into the list (transform's `applyScrub` pattern). Mark the styled element with a `data-*` attr for
  testability.
- Barrel `index.ts` exports components, helpers, full type surface (mirror transform/index.ts), incl.
  `cssFilter`, `FilterLiteral`, `FilterString`, `FilterStringMap`, `FilterFn`, `FilterFunctionName`,
  `FunctionsOf`, `FunctionCountOf`, `HasDropShadow`, `FilterItem`, `AmountFn`, `Dimension`, `ArgKind`,
  `ArgSpec`.

Run component test → GREEN. Typecheck + biome. Commit component + index + component test.

## Task 7 — demo page + examples

`pages/filter-builder/{index.html,main.tsx}` (copy transform's, retitle "Filter Builder — ridiculous"),
`src/pages/filter-builder/page.tsx`,
`src/examples/filter-builder/{basic-usage,tier-casual,tier-intellisense,tier-strict,api-reference,
live-preview}.tsx`. Mirror transform examples. `live-preview` = the image/card with the filter stack, a
control per function, and the filter/backdrop-filter toggle (uses `FilterPreview` + `FilterBuilderPanel`).
Install snippet via `InstallCta args="add https://turtiesocks.github.io/ridiculous/r/filter-builder.json"`.
Commit.

## Task 8 — wiring: vite + registry + nav + coverage

- `vite.config.ts`: add `"filter-builder"` MPA input line.
- `registry.json`: add `filter-builder` item (registryDependencies: ridiculous-type-kit, color-picker,
  button, popover, input, label, slider) + add `filter-builder.json` URL to the `all` bundle + update the
  `all` description.
- `vitest.config.ts`: add `"src/components/ui/filter-builder/**"` to `coverage.include`.
- `pnpm nav:build` (regenerates `src/generated/nav.ts`).
- `pnpm registry:build` (regenerates gitignored `public/r/*` — do NOT commit).
Commit `vite.config.ts`, `registry.json`, `vitest.config.ts`, regenerated `src/generated/nav.ts`.

## Task 9 — green `pnpm pr:check`

typecheck + check + test in parallel where possible. Fix biome (no semicolons, double quotes, 2-space).
Iterate to GREEN. If vitest errors on `@/generated/nav`, run `pnpm nav:build` first. Final fixup commit if
needed.

---

### Risk watch
- **drop-shadow color split.** The one tricky type. Verify `SplitBySpace` keeps `rgb(0 0 0 / .5)` whole
  inside drop-shadow args (it is paren-aware — confirmed in kit). If a color with a `/` alpha trips a
  tuple-shape match, add a test and adjust the `ValidateDropShadow` tuple arms.
- **`IsColor` collapse.** `ColorLiteral<S> extends never ? false : true` — confirm `ColorLiteral` resolves
  to exactly `never` (not a union containing never) for bad input so the boolean collapse is correct. The
  color-picker types use `KeepIf<…, S>` → `never` on failure and `S` on success, unioned across modes;
  for an invalid string every arm is `never`, so the union is `never`. Good.
- **kebab keys.** Confirm `FilterStringMap["hue-rotate"]` and `ParseFunction` over `hue-rotate(...)` both
  work (Task 1 asserts both). If `ParseFunction` mis-splits, fall back to a name-normalization step
  (unlikely — it splits on first `(`).
- **Compile budget.** Max arity 4 (drop-shadow) ≪ transform's 16-arg matrix3d → non-issue (spec A10).
