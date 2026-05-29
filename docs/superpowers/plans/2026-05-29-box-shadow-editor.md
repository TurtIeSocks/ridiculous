# Box Shadow Editor — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-05-29-box-shadow-editor-design.md`
**Approach:** TDD. Type-level tests first (the validator is the product), then runtime
helpers, then the component. Commit per logical unit. Biome: no semicolons, double
quotes, 2-space indent.

Reference implementations to mirror (do not edit them):
- `src/components/ui/filter-builder/*` — closest analog (drop-shadow = a shadow layer;
  function-list dispatch ≈ layer-list fold; color reuse; popover+panel; preview).
- `src/components/ui/easing-picker/easing-picker.types.ts` — the canonical types layout.
- `src/lib/ridiculous-type-kit/*` — `SplitByComma`, `SplitBySpace`, `IsLength`,
  `IsNonNegativeNumber`, `Trim`, `And`/`Or`/`Not`, `KeepIf`, `StartsWith`/`EndsWith`.

---

## Task 0 — scaffold the directory + barrel (no logic yet)

- `src/components/ui/box-shadow-editor/box-shadow-editor.types.ts` — placeholder exports
  so the barrel + tests can import (filled in Task 1).
- `index.ts` — barrel (will be extended as files land).

No test. Commit after Task 1 (types are the first real unit).

---

## Task 1 — strict types (`box-shadow-editor.types.ts`) + type tests FIRST

**Test file `tests/box-shadow-editor-types.test-d.ts`** (write first, expect red):

Acceptance:
- `BoxShadowLiteral<"0px 4px">` → itself (2 lengths).
- `BoxShadowLiteral<"0px 4px 8px">` → itself (3 lengths, blur).
- `BoxShadowLiteral<"0px 4px 8px 1px">` → itself (4 lengths, +spread).
- `BoxShadowLiteral<"inset 0px 4px 8px #000">` → itself (leading inset + color).
- `BoxShadowLiteral<"0px 4px 8px #000 inset">` → itself (trailing inset).
- `BoxShadowLiteral<"0px 2px 4px rgb(0 0 0 / 0.2)">` → itself (functional color stays whole).
- `BoxShadowLiteral<"0px 1px 2px #000, 0px 4px 8px #0008">` → itself (multi-layer).
- `BoxShadowLiteral<"none">` → `"none"`.
- `BoxShadowLiteral<"0px 0px 0px 0px oklch(0.5 0.1 240)">` → itself.

Rejection (`toBeNever`):
- arity: `"0px"` (1 length), `"0px 1px 2px 3px 4px"` (5 lengths).
- inset placement: `"0px inset 4px"` (mid), `"inset 0px 4px inset"` (double).
- color: `"0px 4px red"` (bare keyword), `"0px 4px wrong"` (bad), `"#000 0px 4px"`
  (leading color), `"0px 4px #00 0px"` — actually two colors: `"0px 4px #000 #fff"`.
- blur negative: `"0px 4px -8px"` (blur must be ≥ 0).
- bare zero: `"0 4px"` (`IsLength<"0">` is false).
- `calc`: `"0px calc(4px + 1px)"` → never (undecidable).
- garbage: `""`, `"wobble"`, `"0px"` alone, `"inset"` alone.
- a multi-layer list with one bad layer: `"0px 4px #000, 0px 4px red"` → never.

Util types:
- `LayersOf<"0px 4px #000, inset 0px 0px 2px">` → `["0px 4px #000", "inset 0px 0px 2px"]`.
- `LayerCountOf<...>` → `2`; `LayerCountOf<"none">` → `0`.
- `HasInset<"0px 4px, inset 0px 0px 2px">` → `true`; `HasInset<"0px 4px #000">` → `false`.
- `IsInsetLayer<"inset 0px 0px 2px">` → `true`; `IsInsetLayer<"0px 4px">` → `false`.

Suggestion strings + map + state:
- `"0px 4px 8px #000"` matches `BoxShadowString`; `"none"` matches.
- `BoxShadowStringMap["inset"]` extends `` `inset ${string}` ``.
- `BoxShadowKind` equals `keyof BoxShadowStringMap`.
- `ShadowLayer` record accepts `{ inset: false, offsetX: "0px", offsetY: "4px" }` and the
  full form with blur/spread/color.
- `cssBoxShadow("0px 4px 8px #000")` returns the literal; `@ts-expect-error` on
  `cssBoxShadow("0px 4px red")`, `cssBoxShadow("0px")`, `cssBoxShadow("0px calc(...)")`,
  `cssBoxShadow("#000 0px 4px")`.
- `BoxShadowEditor` `onChange` parameter is `BoxShadowString`.

**Implementation `box-shadow-editor.types.ts`** — sections mirror filter-builder.types:

1. **Imports** from `@/lib/ridiculous-type-kit`: `And`, `Or`, `Not`, `IsLength`,
   `IsNonNegativeNumber`, `SplitByComma`, `SplitBySpace`, `Trim`, `StartsWith`,
   `EndsWith`, `KeepIf`. And `ColorLiteral` from color-picker.

2. **Per-token predicate aliases:**
   - `IsColorTok<S>` = `ColorLiteral<Trim<S>> extends never ? false : true`.
   - `IsLengthTok<S>` = `IsLength<Trim<S>>`.
   - `IsNonNegLengthTok<S>` — length whose numeric part is non-negative. Implement as:
     strip a leading `-` → if present, `false` for the blur slot; else `IsLength`.
     Concretely `IsNonNegLength<S> = Trim<S> extends `-${string}` ? false : IsLength<Trim<S>>`.

3. **Length-group validator** `ValidateLengths<Parts, AllowColorTail>` — given the tuple
   of a layer's tokens *after inset is stripped*, validate 2–4 lengths + optional trailing
   color. Tuple-shape matches (like `ValidateDropShadow`):
   - `[X, Y]` → `And<IsLength X, IsLength Y>`.
   - `[X, Y, Z]` → `And<IsLength X, And<IsLength Y, Or<IsNonNegLength Z (blur), IsColor Z>>>`
     — i.e. 3rd is blur (non-neg length) OR a color.
   - `[X, Y, Z, W]` → X,Y lengths; Z = blur (non-neg length) OR color; if Z is a color then
     W must be… no — color is tail-only, so: either (Z blur non-neg length, W = spread
     length OR color) — careful. Enumerate the legal 4-tuples:
       - `[len, len, nnLen(blur), len(spread)]`
       - `[len, len, nnLen(blur), color]`
       - `[len, len, len(? but 3rd with color 4th means 3 lengths)]` → covered by 3-tuple+color
     So 4-tuple: `And<IsLen X, And<IsLen Y, And<IsNonNegLen Z, Or<IsLen W, IsColor W>>>>`.
   - `[X, Y, Z, W, V]` (5 after inset strip) → `false`.
   - fewer than 2 → `false`.
   Note: a color in the 3-tuple `[X,Y,color]` means only 2 real lengths — legal (`0px 4px
   #000`). The `Or<IsNonNegLength Z, IsColor Z>` branch handles it.

4. **Inset stripping** `StripInset<Parts>` → `{ ok: boolean; rest: string[] }`-ish. Since
   TS can't easily return a record from a tuple op, implement `ValidateLayerTokens<Parts>`
   that:
   - if `Parts` is `["inset", ...Rest]` → `ValidateLengths<Rest>` (and Rest must not
     contain another inset — enforced because ValidateLengths only accepts lengths+color,
     and `inset` is neither a length nor a ColorLiteral, so a second inset → false).
   - else if `Parts` is `[...Init, "inset"]` (trailing) → `ValidateLengths<Init>`.
     Implement trailing match via a recursive `EndsWithInset`/`DropLast` or a tuple
     pattern `[...infer Init, "inset"]`.
   - else → `ValidateLengths<Parts>` (no inset).
   A mid-token inset falls into the else branch and fails ValidateLengths (inset is not a
   length/color). Double inset: leading strip leaves a trailing inset in Rest →
   ValidateLengths sees `inset` token → false. 

5. **`ShadowLayerLiteral<S>`** = `SplitBySpace<Trim<S>> extends infer P extends string[] ?
   (ValidateLayerTokens<P> extends true ? S : never) : never`. Exported.

6. **`BoxShadowLiteral<S>`** = `Trim<S> extends "none" ? S : Trim<S> extends "" ? never :
   SplitByComma<Trim<S>> extends infer Layers extends string[] ? (Layers extends [] ?
   never : ValidateLayers<Layers> extends true ? S : never) : never`, where
   `ValidateLayers<Layers>` folds `ShadowLayerLiteral`-as-boolean over each layer with a
   **depth cap of 32** (accumulate a counter tuple; past 32, weak-validate non-empty).
   Implement the fold like filter's `ValidateList` but with a depth-count guard.

7. **`cssBoxShadow`** call-site helper.

8. **Suggestion strings:** `ShadowLayerString` (permissive, like FilterString — e.g.
   `` `${string} ${string}` `` won't be specific; instead use a small union of common
   shapes anchored on the structure, OR mirror filter's approach: a broad
   `` `${string}px ${string}` ``-ish is fragile. Simplest robust choice matching
   filter-builder: define `BoxShadowString` permissively as a union that the strict
   examples satisfy. Use:
   ```ts
   type Len = `${number}${string}` // number + unit (permissive)
   ```
   Keep it pragmatic — the suggestion tier is for autocomplete, the strict tier is the
   gate. Mirror filter's `FilterString = `${FilterFunctionName}(${string})` | "none"`
   pragmatism: define
   `ShadowLayerString` as a readable union of the offset-led + inset-led shapes, and
   `BoxShadowString = ShadowLayerString | `${ShadowLayerString}, ${string}` | "none"`.
   The test only asserts a couple of concrete strings *match* `BoxShadowString` (use
   `toMatchTypeOf`), so keep the union broad enough to contain them.)
   - `BoxShadowStringMap { outset: ShadowLayerString; inset: `inset ${string}` }`.
   - `BoxShadowKind = keyof BoxShadowStringMap`.

9. **Util types:** `LayersOf`, `LayerCountOf`, `HasInset`, `IsInsetLayer`. `HasInset`
   folds over `LayersOf` checking each layer's tokens for an `inset` (leading or trailing).
   `IsInsetLayer<S>` checks a single layer's `SplitBySpace` head/tail for `inset`.

10. **Internal state** `ShadowLayer` interface (exported).

**Verify:** `pnpm exec biome check` the file, then run only the type test:
`pnpm exec vitest run tests/box-shadow-editor-types.test-d.ts` (typecheck project). Iterate
to green. Watch tsc wall-time; if a branch explodes, simplify (weak-validate the tail).

**Commit:** `feat(box-shadow-editor): strict BoxShadowLiteral + type surface (+ type tests)`.

---

## Task 2 — runtime helpers (`box-shadow-editor.helpers.ts`) + parse/format tests FIRST

**Tests** `tests/box-shadow-editor-parse.test.ts` + `tests/box-shadow-editor-format.test.ts`
(write first), mirroring filter-builder-parse.test.ts:

parse:
- `"0px 4px 8px rgb(0 0 0 / 0.2)"` → `[{ inset:false, offsetX:"0px", offsetY:"4px",
  blur:"8px", color:"rgb(0 0 0 / 0.2)" }]` (functional color whole).
- `"0px 4px"` → `[{ inset:false, offsetX:"0px", offsetY:"4px" }]`.
- `"0px 4px 8px 1px"` → with `spread:"1px"`.
- `"inset 0px 0px 4px #000"` → `inset:true`.
- `"0px 4px 8px #000 inset"` (trailing inset) → `inset:true`.
- `"#000 0px 4px"` (leading color) → normalized `{ inset:false, offsetX:"0px",
  offsetY:"4px", color:"#000" }`.
- multi-layer: `"0px 1px 2px #000, inset 0px 0px 2px"` → two layers.
- `"none"`, `""`, `"   "` → `[]`.
- arity / dup rejects (null): `"0px"`, `"0px 1px 2px 3px 4px"`, `"0px 4px #000 #fff"`
  (two colors), `"inset 0px 4px inset"` (two insets), `"inset"` alone.
- calc/var passthrough: `"calc(0px) 4px"` → kept verbatim as offsetX.
- whitespace tolerance: `"0px   4px"` → one layer.

format + layerToCss + defaultLayer + boxShadowLayerCount:
- `formatBoxShadow([{inset:false,offsetX:"0px",offsetY:"4px",blur:"8px",color:"#000"}])`
  → `"0px 4px 8px #000"`.
- inset leads, color trails: `formatBoxShadow([{inset:true,offsetX:"0px",offsetY:"0px",
  blur:"2px",color:"#000"}])` → `"inset 0px 0px 2px #000"`.
- spread present → included between blur and color.
- empty → `"none"`.
- `defaultLayer()` shape (a soft drop shadow).
- `boxShadowLayerCount("0px 4px, 0px 8px")` → 2; `("none")` → 0.

**Implementation** mirrors filter-builder.helpers: `splitTopLevel`, classify tokens
(`inset` keyword; length-ish via regex incl. calc/var; else color), build `ShadowLayer`
with ≥2 length requirement, ≤4 lengths, ≤1 color, ≤1 inset → else null.

**Verify:** biome + run the two runtime tests (jsdom — fast, run after this step).

**Commit:** `feat(box-shadow-editor): tolerant runtime parser + formatter (+ tests)`.

---

## Task 3 — the component (`box-shadow-editor.tsx`) + jsdom tests

**Tests** `tests/box-shadow-editor.test.tsx` (write first), mirroring filter-builder.test.tsx:
- `cssBoxShadow` returns its arg at runtime.
- `BoxShadowEditorPanel` renders one row per layer (count the inset toggles or remove
  buttons).
- editing offset-x emits onChange with the updated string.
- toggling inset emits an inset-prefixed string.
- adding a color via the "+ color" affordance; removing it.
- `AddLayerButton` appends a layer.
- removing a row drops it.
- `value="none"` renders empty + an add affordance.
- `BoxShadowPreview` applies the stacked shadow to `[data-shadow-target]`'s
  `style.boxShadow`.
- the draggable light source: fire `pointerDown`/`pointerMove`/`pointerUp` on the
  `role="slider"` light handle and assert onChange fired with a reformatted string whose
  offsets changed. (Mock `setPointerCapture`/`releasePointerCapture` in tests/setup if not
  present — check tests/setup.ts first; jsdom lacks them. Add a no-op mock there ONLY if
  absent — that's an allowed coverage.include-adjacent edit? No: setup.ts is a test file,
  editable.) Use `getBoundingClientRect` mock via the element if needed.
- `UnitInput` elevation scrubber in the preview updates blur/y across layers.

**Implementation** mirrors filter-builder.tsx:
- `BoxShadowEditor` (popover) + `BoxShadowEditorPanel` (inline, useState + resync effect +
  `commit` → format + onChange + lastEmittedRef).
- `ShadowLayerRow`: inset toggle (a `<button aria-pressed>` or checkbox), four
  `ShadowLengthEditor`s (x/y/blur/spread; blur `allowNegative={false}`), color
  add/remove + `<ColorPicker native>`, remove button.
- `ShadowLengthEditor`: number field + unit `<select>` (px/rem/em/%/vw/vh), opaque
  passthrough for calc/var (regex like filter's). `allowNegative` gates the `-` in the
  numeric regex.
- `AddLayerButton`.
- `BoxShadowPreview`: a stage with a `[data-shadow-target]` card (`style.boxShadow =
  value === "none" ? undefined : value`), a draggable light-source dot
  (`role="slider"`, `aria-label`, `tabIndex`, pointer handlers + arrow-key nudge → sets
  every layer's offsetX/offsetY to the negated depth-scaled light vector), and a
  `UnitInput` "elevation" scrubber (unit `px`, min 0) that scales blur (+ y offset) across
  all layers — this is the genuine `unit-input` usage justifying the dependency.

**Verify:** biome + run the component test (jsdom). Then `pnpm nav:build` (so the
generated nav exists), then the full `pnpm test` once at the end of this task.

**Commit:** `feat(box-shadow-editor): editor, layer rows, draggable-light preview (+ tests)`.

---

## Task 4 — barrel, demo page, examples, MPA entry

- Finish `index.ts` barrel: components + props types + helpers + types + `cssBoxShadow`.
- `src/examples/box-shadow-editor/`: `basic-usage`, `tier-casual`, `tier-intellisense`,
  `tier-strict`, `api-reference`, `live-preview` — copy the filter-builder examples'
  structure/classNames, swap content. `tier-strict` includes `@ts-expect-error` lines for
  bad layers (matching the type tests) — these are compiled by tsc (typecheck) so they
  must be genuinely erroneous.
- `src/pages/box-shadow-editor/page.tsx` — Layout + SectionHeaders + the 6 examples +
  `InstallCta args="add https://turtiesocks.github.io/ridiculous/r/box-shadow-editor.json"`.
- `pages/box-shadow-editor/index.html` + `main.tsx` (copy filter-builder's, swap names +
  title).

**Verify:** biome + typecheck (`pnpm typecheck` — runs nav:build via pretypecheck).

**Commit:** `feat(box-shadow-editor): demo page, examples, MPA entry`.

---

## Task 5 — registry + vite MPA input + coverage include + nav

- `registry.json`: add the `box-shadow-editor` item (registry:ui; the 4 files;
  registryDependencies `["ridiculous-type-kit","color-picker","unit-input","button",
  "popover","input","label","slider"]`) and append its `r/box-shadow-editor.json` URL to
  the `all` bundle's registryDependencies.
- `vite.config.ts`: add `"box-shadow-editor": path.resolve(__dirname,
  "pages/box-shadow-editor/index.html")` to `rollupOptions.input`.
- `vitest.config.ts`: add `"src/components/ui/box-shadow-editor/**"` to `coverage.include`.
- `pnpm registry:build` (regenerates public/r/*.json — gitignored, do NOT commit them).
- `pnpm nav:build` (regenerates src/generated/nav.ts).

**Verify:** `git status` (confirm public/r/* is ignored), biome check the JSON/TS edits.

**Commit:** `feat(box-shadow-editor): registry item, vite MPA entry, coverage include`.

---

## Task 6 — final `pnpm pr:check` green

Run `pnpm nav:build` first (in case vitest typecheck needs `@/generated/nav`), then
`pnpm pr:check` (typecheck + biome check + vitest incl. type tests). Fix any failures.
The last commit must leave the tree typecheck-clean. Report STATUS + counts + the
bare-color-keyword decision + commit SHA range.

---

## Risk notes (carry from spec §2.5)

- If the strict `BoxShadowLiteral` recursion is slow, the depth cap (32) + weak tail is
  the lever. The per-layer validator is fixed-arity (≤6 tokens) so it's cheap; the comma
  fold is the only recursion.
- The trailing-inset tuple match `[...infer Init, "inset"]` is the one slightly fancy
  type op — verify it compiles; fallback is a recursive `DropLastIfInset`.
- jsdom lacks `setPointerCapture`; add a no-op mock in `tests/setup.ts` if absent (it's a
  test-support file). Verify before editing.
