# grid-builder — Component Design Spec

**Date:** 2026-05-29
**Status:** Draft for implementation
**Phase:** 4 of 11 (per `2026-05-29-ridiculous-component-roadmap-design.md`)
**Type:** Per-component design spec (scoped by roadmap §5 contract)

---

## 1. Overview

`grid-builder` edits the CSS grid template properties:

- `grid-template-columns` / `grid-template-rows` — a **track list**: a space-separated
  sequence of `<track-size>` tokens, `repeat()` / `minmax()` / `fit-content()`
  functions, and `[named-line]` brackets.
- `grid-template-areas` — a sequence of **quoted row strings** of cell names
  (`<ident>`) and `.` null cells, where every named area must form a contiguous
  rectangle and all rows must share the same column count.

It is the second "monster grammar" of the roadmap (calc was the first). The
namesake flex is two strict template-literal validators — `TrackListLiteral<S>`
and `GridAreasLiteral<S>` — built on `ridiculous-type-kit`. The component is
controlled (`value` + `onChange`) with three modes (tabs): **columns**, **rows**,
**areas**. Columns/rows share one track-list grammar; areas has its own.

This reuses the **function dispatch** pattern (`ParseFunction` + `SplitByComma` +
`SplitBySpace`) established by transform-builder (Phase 2) and filter-builder
(Phase 3), and the **`unit-input`** registry item for track-length entry.

---

## 2. Three-tier typing model (roadmap §5.2)

1. **Casual** — `value` accepts plain `string`. No validation. The escape hatch.
2. **IntelliSense** — suggestion-string unions (`TrackListString`, `GridAreasString`)
   drive autocomplete and are the `onChange` return type, narrowed per mode via
   `GridTemplateStringMap` + `GridMode`.
3. **Strict** — `TrackListLiteral<S>` / `GridAreasLiteral<S>` full validators +
   call-site helpers `cssTracks()` / `cssGridAreas()` resolving invalid input to
   `never`.

---

## 3. Strict tier scope (the namesake)

### 3.1 `TrackListLiteral<S>` — FULL track-list validation

`SplitBySpace<Trim<S>>` → tokens (paren/bracket-aware, so `minmax(a, b)`,
`repeat(2, 1fr)` and `[line-name]` stay single tokens). Every token must be a
valid **track-list element**:

| Element | Grammar | Validation |
|---------|---------|------------|
| `<length>` | `IsLength` | kit |
| `<percentage>` | `IsPercentage` | kit |
| `<flex>` | `IsFlex` (e.g. `1fr`, `0.5fr`) | kit |
| keywords | `auto` \| `min-content` \| `max-content` | literal union |
| `minmax(min, max)` | `ParseFunction` + `SplitByComma` to exactly 2 args; min is `<inflexible>` (length/percentage/auto/min-content/max-content — **NOT** an `fr`); max is any `<track-size>` (incl. `fr`) | dispatch |
| `fit-content(<len-pct>)` | `ParseFunction` + 1 arg; arg is length or percentage | dispatch |
| `repeat(count, tracks)` | `ParseFunction`; first comma-arg = count (`IsPositiveInt` \| `auto-fill` \| `auto-fit`); the remainder (re-joined) is itself a **track list** validated recursively | dispatch + recursion |
| `[ident]` named line | bracket body; one or more space-separated idents, each `<ident>`-valid via `AllChars` over an ident char set | bracket |

A `<track-size>` (used by `minmax` max, `repeat` tracks, top-level) = length |
percentage | flex | auto | min-content | max-content | minmax(...) |
fit-content(...). Inside `repeat`, the tracks segment may also contain named
lines. Resolve to `never` on any violation. `none` keyword → kept literal
(an empty track list). **`calc()` / `var()` are undecidable at the strict tier
→ `never`** (the runtime parser accepts them).

This is shipped **in full** for the track-list side — no variadic punt is needed
because `SplitBySpace`/`SplitByComma` are tail-recursive and the token counts in
real grids are small. A depth guard caps `repeat()` nesting recursion (CSS forbids
nested `repeat()` anyway; we weak-accept by capping at a small depth and letting
the runtime parser reject the pathological case — see §8 Assumptions).

### 3.2 `GridAreasLiteral<S>` — equal-column-count at the type level; rectangle at RUNTIME

Type-level (`GridAreasLiteral<S>`):

- Split `S` into the quoted row strings (each `"..."` segment).
- Require ≥ 1 row.
- For each row: strip quotes, `SplitBySpace` into cells, require ≥ 1 cell, each
  cell is a valid `<ident>` (via `AllChars`) **or** `.` / a run of dots (`..`,
  `...` are all valid null-cell tokens in CSS).
- Require **all rows have EQUAL cell count**.
- Keep the literal `S` on success, `never` otherwise.

**Punt (per roadmap §7):** the **contiguous-rectangle** invariant (each area name
must span a single filled rectangle) is **NOT** enforced at the type level — it
is too costly / borderline-undecidable as a template-literal type and would make
`tsc` crawl. It is enforced at **RUNTIME** by `parseAreas` /
`validateAreasRectangles`. The strict type tier validates *shape* (quoting, equal
columns, valid cells); the runtime does *full* validation including rectangles.
This punt is documented here and in the `tier-strict` example + the
`GridAreasLiteral` JSDoc.

### 3.3 Runtime helpers — FULL validation

`parseTracks` / `formatTracks` and `parseAreas` / `formatAreas` mirror the strict
grammar but additionally (a) tolerate `calc()`/`var()` (opaque), and (b)
`validateAreasRectangles` performs the contiguous-rectangle check that the type
tier punts. `parseAreas` returns `null` on any violation (unequal columns, bad
ident, non-rectangular area).

---

## 4. File layout (roadmap §5.1)

```
src/components/ui/grid-builder/
  grid-builder.tsx        // components (popover + panel + sub-components)
  grid-builder.types.ts   // validators, suggestion strings, util types, state
  grid-builder.helpers.ts // pure runtime parse/format/validate (tracks + areas)
  index.ts                // barrel
```

Single-file `.tsx`. Non-component exports live in `.types.ts` / `.helpers.ts`.

---

## 5. Type surface (`grid-builder.types.ts`)

**Strict validators + helpers:**

- `export type TrackListLiteral<S extends string>`
- `export type GridAreasLiteral<S extends string>`
- `export const cssTracks = <S extends string>(v: S & TrackListLiteral<S>): S => v`
- `export const cssGridAreas = <S extends string>(v: S & GridAreasLiteral<S>): S => v`

**Suggestion strings (IntelliSense + onChange):**

- `export type TrackListString` — broad union: `<track-size>` heads, `repeat(${string})`,
  `minmax(${string})`, `fit-content(${string})`, `[${string}]`, `none`, plus the
  open `(string & {})` fallback is added at the prop boundary (not the type alias).
- `export type GridAreasString` — `` `"${string}"` `` row-string-shaped union + `none`.
- `export type GridTrackSize` — the named track-size keyword/suggestion union.
- `export interface GridTemplateStringMap { columns; rows; areas }` keyed by `GridMode`.
- `export type GridMode = "columns" | "rows" | "areas"`.

**Utility types:**

- `export type TrackCountOf<S>` — number of top-level tracks (named lines excluded).
- `export type TracksOf<S>` — tuple of top-level track tokens (named lines excluded).
- `export type AreaRowCountOf<S>` — number of rows in an areas string.
- `export type AreaColumnCountOf<S>` — column count (cells in the first row; the
  validator guarantees uniformity).

**Internal state (discriminated union, exported):**

```ts
export type GridTemplateState =
  | { mode: "columns"; tracks: string }   // raw track-list text
  | { mode: "rows"; tracks: string }
  | { mode: "areas"; rows: string[] }      // one string per quoted row (no quotes)
```

Re-export `Dimension` from the kit for convenience (matches filter-builder).

---

## 6. Component API (roadmap §5.6)

- **Controlled-only:** required `value` + `onChange`.
- `<GridBuilder />` — popover-wrapped trigger button.
- `<GridBuilderPanel />` — inline panel with a mode tab strip (columns / rows /
  areas), per-mode editors, a live `<GridPreview />`, and a `LiveString` readout.
- Exported sub-components: `GridBuilderPanel`, `TrackListEditor`, `TrackTokenRow`,
  `AreasEditor`, `AreasPainter`, `GridPreview`.
- `onChange` returns `GridTemplateString` (= `TrackListString | GridAreasString`).
  Because a single component spans three properties, `onChange` does **not**
  narrow per-mode in the public popover signature (mirrors filter-builder's "list,
  no narrowing" decision); the `GridTemplateStringMap` + `GridMode` give callers
  the per-mode shapes when they want them.

**Props:**

```ts
interface GridBuilderPanelProps {
  value: GridTemplateString | (string & {})
  onChange: (value: GridTemplateString) => void
  mode?: GridMode          // initial active tab; default "columns"
  className?: string
  "aria-label"?: string
}
interface GridBuilderProps extends GridBuilderPanelProps {}
```

A11y: tab strip uses `role="tablist"`/`aria-selected`; the areas painter cells are
`<button>`s with `aria-label` describing row/col + current cell; track rows have
labelled inputs.

### 6.1 Live preview + areas painter

- `GridPreview` renders a real `<div style={{ display: "grid", gridTemplateColumns,
  gridTemplateRows, gridTemplateAreas }}>` reflecting the current value. For
  columns/rows mode it lays out N numbered cells; for areas mode it renders one
  cell per distinct area name placed via `gridArea`. **Pure inline-style React —
  no browser automation.**
- `AreasPainter` is a grid of clickable cells; clicking cycles a cell through the
  current palette of area names (and `.`), writing back to state. This is the
  "areas painter" deliverable — clickable cells mutating the areas matrix.

---

## 7. Demo, registry, navigation (roadmap §5.4)

- **MPA entry:** `pages/grid-builder/index.html` + `pages/grid-builder/main.tsx`;
  add to `vite.config.ts` `rollupOptions.input`.
- **Page:** `src/pages/grid-builder/page.tsx`.
- **Examples:** `src/examples/grid-builder/{basic-usage,tier-casual,tier-intellisense,
  tier-strict,api-reference}.tsx` + `live-preview.tsx` (the grid preview + areas
  painter showcase).
- **Registry:** add a `grid-builder` item (`type: registry:ui`;
  `registryDependencies: ["ridiculous-type-kit", "unit-input", "button", "popover",
  "input", "label"]`); add `grid-builder` to the `all` bundle. `pnpm registry:build`
  regenerates `public/r/*.json` (gitignored — do not commit).
- **Nav:** `pnpm nav:build`.

---

## 8. Testing (roadmap §5.5)

- `tests/grid-builder-types.test-d.ts` — accept + reject for: each track size,
  `minmax` (incl. rejecting `fr` as the min), `repeat` (count keywords + nested
  tracks), named lines `[a]` / `[a b]`, `fit-content`, keywords, and areas with
  equal vs unequal column counts + bad idents. Plus utility types + suggestion
  strings + state.
- `tests/grid-builder-parse.test.ts` — `parseTracks` / `parseAreas` incl. the
  runtime **rectangle** check (the type-tier punt), `calc()` tolerance, unequal
  columns rejection.
- `tests/grid-builder-format.test.ts` — `formatTracks` / `formatAreas` round-trips.
- `tests/grid-builder.test.tsx` — jsdom render/interaction (tab switch, add track,
  paint a cell, preview renders a grid).
- Add `src/components/ui/grid-builder/**` to `coverage.include` in
  `vitest.config.ts`.

---

## 9. Assumptions (every call made on the sleeping human's behalf)

1. **Areas rectangle check punted to runtime** (per roadmap §7 explicit license).
   Type tier validates quoting + equal column count + valid cell idents/dots;
   runtime `validateAreasRectangles` enforces contiguous rectangles. Documented in
   JSDoc + `tier-strict` example.
2. **`repeat()` nesting depth cap.** The recursive track-list validator caps
   `repeat()`-within-`repeat()` recursion at depth 2 (CSS disallows nested
   `repeat()`; auto-repeat additionally disallows intrinsic sizes — that finer rule
   is a runtime-only check). Pathological deep nesting weak-accepts at the type
   level and is rejected at runtime. Keeps `tsc` fast (§7 compile-budget).
3. **`auto-fill` / `auto-fit` with intrinsic/flex tracks** — the CSS rule that
   auto-repeat forbids `fr`/intrinsic track sizes is **runtime-only**; the type
   tier accepts a syntactically valid `repeat(auto-fill, 1fr)`. Lower spectacle
   cost than value, and avoids a brittle type branch.
4. **`calc()` / `var()` → `never` at strict tier** (matches filter/transform/calc
   precedent); runtime parser keeps them opaque.
5. **`<ident>` char set** for line names and area names = ASCII letters, digits,
   `-`, `_`, and must not start with a digit. Implemented via `AllChars` + a
   leading-char guard. CSS's full ident grammar (escapes, non-ASCII) is out of
   scope; documented.
6. **`onChange` does not narrow per mode** in the popover signature (filter-builder
   precedent); `GridTemplateStringMap`/`GridMode` expose per-mode shapes.
7. **Null cells:** `.`, `..`, `...` (any run of dots) are all valid null tokens, per CSS.
8. **`none`** is a valid value for all three properties (empty track list / no
   areas) and is kept as the literal.
9. **Mode is a UI concern, not a validator input.** `value` is validated by whichever
   grammar matches its shape; the component's `mode` tab only selects the editor +
   preview target. The two strict validators are independent generics so callers
   pick the right one for their property.
10. **Single-file `.tsx`** even past ~500 lines (roadmap §5.1 overrides the global
    split-at-500 rule for this repo's components, citing color-picker ~1013).

---

## 10. Deferred / out of scope

- `subgrid` and `masonry` track values (newer; not in the core grammar here).
- `grid-template` shorthand (areas + rows + columns in one) — separate property.
- Line-name `[ident]` ranges tied to `repeat()` auto-placement semantics beyond
  syntactic validity.
- Full CSS `<custom-ident>` escape/unicode grammar.
