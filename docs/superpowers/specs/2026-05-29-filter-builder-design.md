# filter-builder — Design Spec

**Date:** 2026-05-29
**Phase:** 3 of 11 (Ridiculous Component Roadmap)
**Status:** Approved for implementation (autonomous; all calls recorded in §Assumptions)
**Roadmap contract:** `docs/superpowers/specs/2026-05-29-ridiculous-component-roadmap-design.md` §5 (per-component contract), §7 (risks)
**Pattern source:** `src/components/ui/transform-builder/` (Phase 2 — function-list dispatch)

---

## 1. Summary

`filter-builder` edits the CSS **`filter`** / **`backdrop-filter`** property: a space-separated list of
filter functions. It is the second consumer of the **function-list dispatch** type pattern established by
`transform-builder` (Phase 2) — `SplitBySpace` → `ParseFunction` → a signature table validating each
function's arity and every argument's *dimension*. Phase 3 validates that the pattern reuses cleanly with a
different function table (roadmap §3, Phase 3 rationale).

The component ships the standard 3-tier model (casual / IntelliSense / strict), a popover wrapper
`<FilterBuilder/>` + inline `<FilterBuilderPanel/>`, exported sub-components, runtime parse/format helpers,
and a live image/card preview with a `filter` ↔ `backdrop-filter` toggle and a control per function.

### Supported functions (CSS Filter Effects L1)

| Function | Argument grammar | Dimension rule |
|----------|------------------|----------------|
| `blur` | 1 `<length>` (non-negative in CSS; not range-checked at the type level) | length |
| `brightness` | 1 `<number>` \| `<percentage>`, non-negative | number-or-percentage |
| `contrast` | 1 `<number>` \| `<percentage>`, non-negative | number-or-percentage |
| `grayscale` | 1 `<number>` \| `<percentage>`, non-negative | number-or-percentage |
| `invert` | 1 `<number>` \| `<percentage>`, non-negative | number-or-percentage |
| `opacity` | 1 `<number>` \| `<percentage>`, non-negative | number-or-percentage |
| `saturate` | 1 `<number>` \| `<percentage>`, non-negative | number-or-percentage |
| `sepia` | 1 `<number>` \| `<percentage>`, non-negative | number-or-percentage |
| `hue-rotate` | 1 `<angle>` | angle |
| `drop-shadow` | 2–3 `<length>` (offset-x, offset-y, blur?) + an **optional trailing `<color>`** | length×{2,3} + color? |
| `url` | any non-empty body (`url(#svg-filter)`, `url("filters.svg#f")`) | opaque non-empty |

`none` is the empty state (mirrors transform's `none`).

---

## 2. Goals / non-goals

**Goals**

- Strict tier = **full** function-list dispatch (arity + per-arg dimension), mirroring transform's depth.
  Transform validates a 16-arg `matrix3d` flat fold well within budget, so filter's max arity (drop-shadow,
  4 tokens) is trivially affordable → ship full dispatch, no documented fallback expected.
- `drop-shadow` color argument validated via the kit's `ColorLiteral<S>` (imported from color-picker's
  re-export per the contract), so `drop-shadow(2px 2px 4px wrong)` → `never`.
- `mode?: "filter" | "backdrop-filter"` prop — drives the **preview target** and labels. The function
  grammar is identical for both, so it does **not** narrow the output type (see §5.3, Assumption A6).
- Reuse `<ColorPicker/>` (the color-picker registry item's UI) for the drop-shadow color control.

**Non-goals**

- No numeric range-checking at the type level (`brightness(-1)` is dimension-valid → kept). Matches
  transform ("dimension + arity only") and the roadmap risk note. The runtime parser does not range-check
  either; the preview clamps visually only.
- `calc()` / `var()` inside an argument resolve to `never` at the strict tier (undecidable), accepted by the
  runtime parser. Same contract as transform.
- No `filter`/`backdrop-filter` *shorthand-on-element* multi-property editing — a single value string only.

---

## 3. Type design (the namesake)

### 3.1 Strict tier — `FilterLiteral<S>`

Structurally identical to `TransformLiteral<S>`:

```
FilterLiteral<S> =
  Trim<S> extends "none" ? S
  : Trim<S> extends ""   ? never
  : SplitBySpace<Trim<S>> → Tokens
      Tokens extends [] ? never
      : ValidateList<Tokens> extends true ? S : never
```

- `ValidateList` folds the token list; every token must validate.
- `ValidateToken` = `ParseFunction<Token>` → `{ name; args }` → `ValidateFn<Name, ArgStr>`.
- `ValidateFn` is the dispatch table. `SplitByComma<ArgStr>` → `Args` tuple, then per-name arity + dimension:
  - `blur` → `[L]`, `IsLength<L>`.
  - `hue-rotate` → `[A]`, `IsAngle<A>`.
  - `brightness|contrast|grayscale|invert|opacity|saturate|sepia` → `[N]`,
    `Or<IsNonNegativeNumber<N>, IsPercentage<N>>`.
    - **Decision (A1):** use `IsNonNegativeNumber` for the bare-number branch (CSS forbids negatives for
      these amount functions) — *stricter* than transform's scale (which allows signed numbers). Percentage
      branch via `IsPercentage` (kit predicate; `%`-suffixed number, allows `>100%`, which CSS permits e.g.
      `saturate(200%)`).
  - `drop-shadow` → `[X, Y]` (`IsLength` both) **or** `[X, Y, B]` (3 lengths) **or** `[X, Y, C]`
    (2 lengths + `ColorLiteral`) **or** `[X, Y, B, C]` (3 lengths + `ColorLiteral`). i.e. 2–3 lengths with
    an optional trailing color. See §3.2.
  - `url` → `ParseUrl` accepts any **non-empty** body. **Decision (A2):** because `ParseFunction` already
    strips the outer `name(...)`, `url(...)`'s inner body is `args`; the body must be non-empty
    (`Trim<Args> extends "" ? false : true`). Quotes/`#`/paths all pass.
  - unknown name → `false`.

On any failure the whole literal collapses to `never`; on success the *original* `S` is preserved
(comments/whitespace kept verbatim, same as transform).

### 3.2 drop-shadow argument validation

drop-shadow's color is **space-separated within the function**, and the color itself may contain spaces
(`rgb(0 0 0)`) or slashes (`oklch(0 0 0 / .5)`). The kit's `SplitBySpace` is **bracket-aware** (tracks `()`
depth), so `drop-shadow(2px 2px 4px rgb(0 0 0))`'s args split into
`["2px","2px","4px","rgb(0 0 0)"]` — the color stays one token. Validation:

- Split the drop-shadow arg string by space → `Parts`.
- Match `[X, Y]`, `[X, Y, Z]`, or `[X, Y, Z, W]` (CSS allows color before *or* after offsets, but the
  canonical and far-more-common order is offsets-then-color; **Decision (A3):** the strict tier accepts
  **color-last only**; leading-color (`drop-shadow(red 2px 2px)`) resolves to `never` at the strict tier but
  is accepted and normalized to color-last by the runtime parser). Document this asymmetry.
- For `[X, Y]`: both `IsLength`.
- For `[X, Y, Z]`: `IsLength<X> ∧ IsLength<Y> ∧ (IsLength<Z> ∨ ColorLiteral<Z>)`. (blur OR color in slot 3.)
- For `[X, Y, Z, W]`: 3 lengths + `ColorLiteral<W>`.

Note drop-shadow uses **space**-separated args, unlike transform functions (comma-separated). The dispatch
table therefore splits drop-shadow's `ArgStr` with `SplitBySpace`, all others with `SplitByComma`. Since
every non-drop-shadow filter function is single-arg, `SplitByComma` on a single value is a no-op; we could
use either, but keep `SplitByComma` for the single-arg families to match transform's idiom and reserve
`SplitBySpace` for drop-shadow.

### 3.3 IntelliSense tier — suggestion strings

Mirror `TransformString` / `TransformStringMap`:

- `FilterFunctionName` — union of all 11 names.
- `FilterString = `${FilterFunctionName}(${string})` | "none"` — head-anchored per function; also matches
  multi-function lists (starts with a name, ends `)`). This is the `onChange` return type.
- `FilterStringMap` interface (`blur: \`blur(${string})\``, …) + `FilterFn = keyof FilterStringMap`.

**Decision (A4):** `hue-rotate` and `drop-shadow` are kebab-case identifiers. Template-literal keys like
`` `hue-rotate(${string})` `` and an interface key `"hue-rotate"` are both legal in TS — verified against the
kit (no constraint forbids `-`). `ParseFunction`'s `Name` infer captures `hue-rotate` fine (it splits on the
first `(`).

### 3.4 Utility types

- `FunctionsOf<S>` → ordered tuple of names (`["blur","brightness"]`); `none`/`""` → `[]`. Same shape as
  transform's, reusing `ParseFunction` over `SplitBySpace`.
- `FunctionCountOf<S>` → `FunctionsOf<S>["length"]`.
- **Decision (A5):** add `HasDropShadow<S>` (boolean) — a small filter-specific utility that reports whether
  the list contains a `drop-shadow` (the one function with a color arg). Cheap, demonstrates list
  interrogation, and is the natural filter analogue to transform's family helpers. Implemented as a fold
  over `FunctionsOf<S>`.

### 3.5 Strict validator + call-site helper

```ts
export type FilterLiteral<S extends string> = …
export const cssFilter = <S extends string>(value: S & FilterLiteral<S>): S => value
```

Mirrors `cssTransform` / `cssCalc` / `color` / `easing`. Named `cssFilter` per the dispatch brief.

### 3.6 Internal state — discriminated union (exported)

```ts
export type FilterItem =
  | { fn: "blur"; value: string }                                  // length
  | { fn: "hue-rotate"; value: string }                            // angle
  | { fn: AmountFn; value: string }                                // number|percentage
  | { fn: "drop-shadow"; x: string; y: string; blur?: string; color?: string }
  | { fn: "url"; url: string }                                     // opaque body
```

where `AmountFn = "brightness" | "contrast" | "grayscale" | "invert" | "opacity" | "saturate" | "sepia"`.
Exported for advanced use (programmatic build, custom serialization), mirroring `TransformItem`. Strings keep
raw text (units preserved), same rationale as transform.

---

## 4. Runtime helpers (`filter-builder.helpers.ts`)

The runtime tier is the **superset** of the strict tier (tolerant of `calc()`/`var()`, accepts leading-color
drop-shadow and normalizes it). Single-source-of-truth dispatch table `ARG_SPEC` keyed by function name,
mirroring transform's `helpers.ts`:

- `ArgKind = "length" | "amount" | "angle" | "shadow" | "url"` (filter-specific kinds).
- `ArgSpec { min; max; kind; … }` per function — drives parser + UI.
- Reuse transform's **paren-aware** `splitTopLevel(src, sep)` for both space (function list) and the
  drop-shadow space-split and the (degenerate) comma-split of single-arg functions.
- `parseFilter(src): FilterItem[] | null` — `none`/empty/whitespace → `[]`; unknown fn / arity error →
  `null`; tolerant of opaque `calc()`/`var()` args (kept verbatim).
  - `drop-shadow` parsing: space-split the args (paren-aware); detect the color token by "is it length-like?"
    — the first token that is **not** length-like (and not the first two required offsets) is the color.
    Supports leading-color and trailing-color; normalizes to `{x, y, blur?, color?}`.
- `formatFilter(items): string` — canonical re-serialization (single spaces; drop-shadow emits
  `x y [blur] [color]` color-last). Empty → `none`.
- `itemToCss(item)`, `filterFunctions(src)` (runtime mirror of `FunctionsOf`), `defaultItem(fn)` (seed a
  fresh row: `blur(4px)`, `brightness(1)`, `hue-rotate(90deg)`, `drop-shadow(4px 4px 8px rgb(0 0 0 / 0.5))`,
  `url(#filter)`), `argSpec(fn)`.

**Decision (A7):** `defaultItem("drop-shadow")` seeds an oklch-free `rgb(0 0 0 / 0.5)` so the value is broadly
readable and the ColorPicker round-trips it without surprises. (color-picker supports rgb.)

---

## 5. Component API (`filter-builder.tsx`)

Mirrors transform-builder's structure and a11y.

### 5.1 Exports

- `FilterBuilder` — popover-wrapped (Button trigger showing fn count + truncated value).
- `FilterBuilderPanel` — inline editor (rows + add menu + live string + preview).
- Sub-components (named exports): `FilterFunctionRow`, `FilterArgEditor`, `AddFilterMenu`, `FilterPreview`.
- `FilterPreview` is the showcase: an image/card with the filter stack applied, a per-function control, and a
  **`filter` ↔ `backdrop-filter` toggle**.

### 5.2 Props

```ts
interface FilterBuilderPanelProps {
  value: FilterString | (string & {})
  onChange: (value: FilterString) => void
  mode?: "filter" | "backdrop-filter"   // default "filter"
  className?: string
  "aria-label"?: string
}
interface FilterBuilderProps extends FilterBuilderPanelProps {}
```

Controlled-only (required `value`+`onChange`), per contract §5.6.

### 5.3 `mode` semantics

**Decision (A6):** `mode` selects the **preview render target**:
- `"filter"` → preview applies `style={{ filter: value }}` to a foreground image/card.
- `"backdrop-filter"` → preview applies `style={{ backdropFilter: value }}` to a translucent panel layered
  over a busy background (so the effect is visible — backdrop-filter is a no-op over an opaque solid).

`mode` is **also** surfaced as a toggle inside `<FilterPreview/>` for live exploration. Because both CSS
properties accept the identical `<filter-function-list>` grammar, `mode` does **not** change the validator or
narrow the `onChange` output type — `FilterString` is emitted regardless. This matches transform's "onChange
returns the open string" decision and the contract's note that a mode key is added "*where a mode prop narrows
output*" (filter's does not, so no `…Basis`/`ModeOf`-style key is added — documented, not omitted silently).

### 5.4 drop-shadow color control

The drop-shadow row renders length editors for x/y/blur plus a `<ColorPicker/>` (color-picker registry item)
for the color. The ColorPicker is controlled by the item's `color` string; its `onChange` writes back into the
item. **Decision (A8):** the color control is optional-but-default-on for drop-shadow (CSS lets you omit the
color → uses `currentColor`); a small "× color" affordance clears it back to no-color, and re-adding seeds the
default rgb. This keeps the optional-trailing-color grammar exercisable from the UI.

### 5.5 a11y

Focus management + ARIA parity with transform-builder: labeled selects (`Filter function`,
`Add a filter function`), labeled per-arg inputs (`${fn} ${slot}`), labeled unit selects, a labeled mode
toggle, remove buttons with accessible names. Range scrubbers in the preview are labeled per function.

---

## 6. Demo / registry / nav

- **MPA entry:** `pages/filter-builder/{index.html,main.tsx}` (copy transform's, retitle).
- **Page:** `src/pages/filter-builder/page.tsx` (sections: basic-usage + live preview; 3 tiers; API; install).
- **Examples:** `src/examples/filter-builder/{basic-usage,tier-casual,tier-intellisense,tier-strict,api-reference}.tsx`
  plus a **live-preview** example (image/card with the filter stack, a control per function, filter ↔
  backdrop-filter toggle).
- **Vite MPA:** add `"filter-builder"` to `rollupOptions.input` in `vite.config.ts`.
- **registry.json:** add a `filter-builder` item (`type: registry:ui`), `registryDependencies`:
  `["ridiculous-type-kit", "color-picker", "button", "popover", "input", "label", "slider"]`. Add
  `filter-builder.json` URL to the `all` bundle and update its description. **Decision (A9):** include
  `color-picker` (drop-shadow color UI + `ColorLiteral`) and the same shadcn bases transform uses; `label`
  and `slider` are pulled because the preview uses labeled range controls (matching transform's set).
- `pnpm nav:build` (nav auto-derives from registry.json) + `pnpm registry:build` (regenerate `public/r/*`,
  **gitignored — do not commit**; commit only `registry.json`).

---

## 7. Testing

Per contract §5.5 — type tests are the primary gate.

- `tests/filter-builder-types.test-d.ts` — **accept + reject** for every function: blur length-only,
  hue-rotate angle-only, amount functions number/percentage (reject angle, reject signed-negative bare
  number), drop-shadow 2/3 lengths + optional color (accept `…4px rgb(0 0 0)`; reject `…4px wrong`; reject
  leading-color), url non-empty (reject `url()`), multi-function list, `none`/empty/garbage, `cssFilter`
  call-site `@ts-expect-error`s, `FilterString`/map, `FunctionsOf`/`FunctionCountOf`/`HasDropShadow`,
  `FilterItem` discrimination, component `onChange` returns `FilterString`.
- `tests/filter-builder-parse.test.ts` — multi-fn parse, drop-shadow with/without blur/color, leading-color
  normalization, url variants, arity/unknown rejection (`null`), calc()/var() verbatim, whitespace,
  `filterFunctions`, `defaultItem`, `argSpec`.
- `tests/filter-builder-format.test.ts` — round-trip each function, drop-shadow color-last canonicalization,
  whitespace normalization, empty → `none`, `itemToCss`.
- `tests/filter-builder.test.tsx` (jsdom) — row-per-function render, edit arg → onChange, change fn re-seeds,
  add/remove rows, `none` empty state, drop-shadow color via ColorPicker, mode toggle switches preview
  target, preview scrubber commits back, popover trigger + open.
- `vitest.config.ts` — add `"src/components/ui/filter-builder/**"` to `coverage.include`. Thresholds
  unchanged (90/85/90/90).

---

## 8. File layout (deliverables)

```
src/components/ui/filter-builder/
  filter-builder.tsx          // components + UI-local helpers
  filter-builder.types.ts     // FilterLiteral, FilterString(+Map), utility types, FilterItem, cssFilter
  filter-builder.helpers.ts   // parseFilter / formatFilter / itemToCss / defaultItem / argSpec / ARG_SPEC
  index.ts                    // barrel
pages/filter-builder/{index.html,main.tsx}
src/pages/filter-builder/page.tsx
src/examples/filter-builder/{basic-usage,tier-casual,tier-intellisense,tier-strict,api-reference,live-preview}.tsx
tests/filter-builder-{types.test-d,parse.test,format.test}.* , tests/filter-builder.test.tsx
```

Single-file `.tsx` per contract §5.1 (well under the 2000-line split threshold).

---

## 9. Assumptions (autonomous decisions — human asleep, all calls delegated)

- **A1** Amount functions (`brightness`/…/`sepia`) bare-number branch uses `IsNonNegativeNumber` (CSS forbids
  negatives); percentage branch uses `IsPercentage` (allows `>100%`). Stricter than transform's scale.
- **A2** `url(...)` strict validation = non-empty body only (any chars, quotes, `#`, paths accepted). Runtime
  identical.
- **A3** Strict tier accepts drop-shadow **color-last only**; leading-color resolves to `never` strictly but
  the runtime parser accepts + normalizes it to color-last. Asymmetry documented in the API reference.
- **A4** kebab-case function identifiers (`hue-rotate`, `drop-shadow`) are used directly as template-literal
  segments and interface keys (legal TS; `ParseFunction` handles them).
- **A5** Add `HasDropShadow<S>` utility type (boolean fold) as the filter-specific list-interrogation flex,
  alongside the standard `FunctionsOf`/`FunctionCountOf`.
- **A6** `mode: "filter" | "backdrop-filter"` is a **preview/label** prop, not an output-narrowing one (both
  properties share the grammar) — no mode key added to the string map; `onChange` always emits `FilterString`.
- **A7** `defaultItem("drop-shadow")` color seed is `rgb(0 0 0 / 0.5)` (broadly readable; ColorPicker
  round-trips rgb).
- **A8** drop-shadow color control is optional-but-on by default with a clear ("× color") affordance to
  exercise the optional-trailing-color grammar; cleared = `currentColor` (CSS default).
- **A9** registryDependencies = `ridiculous-type-kit`, `color-picker`, `button`, `popover`, `input`, `label`,
  `slider` (color-picker for the drop-shadow color UI + `ColorLiteral`; the rest match transform's set).
- **A10** Strict tier is **full dispatch** (no documented fallback) — filter's max arity is 4 (drop-shadow),
  far below transform's already-affordable 16-arg matrix3d, so the compile budget is a non-issue. If a `tsc`
  perf surprise appears during implementation, fall back per roadmap §7 and document it here; not expected.
- **A11** `<ColorPicker/>` is reused for the drop-shadow color control (per the dispatch brief's option) — it
  is the color-picker registry item's only UI export and supports controlled `value`+`onChange`.

---

## 10. Risks

- **drop-shadow grammar is the only non-trivial part.** It mixes space-separated lengths with an embedded
  color literal that itself contains spaces/slashes. Mitigation: the kit's `SplitBySpace` is paren-aware, so
  `rgb(0 0 0 / .5)` stays one token; the dispatch matches fixed tuple shapes (`[X,Y] | [X,Y,Z] | [X,Y,Z,W]`)
  and uses `Or<IsLength, ColorLiteral>` for the ambiguous slot-3.
- **Compile budget.** Mitigated by A10 (tiny arities). Type-test wall-time watched at `pr:check`.
- **ColorPicker integration in jsdom.** color-picker's canvas pad needs the canvas mock — already present in
  `tests/setup.ts` (LcPad `getContext`/`putImageData` stub). No new setup needed.
