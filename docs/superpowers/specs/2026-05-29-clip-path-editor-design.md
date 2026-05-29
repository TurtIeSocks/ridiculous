# Clip Path Editor — Component Design Spec

**Date:** 2026-05-29
**Phase:** 5 of 11 (per `2026-05-29-ridiculous-component-roadmap-design.md`)
**Status:** Approved (autonomous phase-lead; all calls recorded in §Assumptions)
**Component:** `clip-path-editor`
**Reuses:** `ridiculous-type-kit`, `unit-input`, shadcn `button` / `popover` / `input`

---

## 1. Overview

`clip-path-editor` edits the CSS `clip-path` property (and, via a `mode` prop, the
identical-grammar `shape-outside` property). The value is a single CSS
`<basic-shape>` — `inset()`, `circle()`, `ellipse()`, or `polygon()` — with an
optional leading or trailing `<geometry-box>` keyword.

This is the **basic-shape grammar** entry in the roadmap (§2 #5, §3 Phase 5). Unlike
the `transform` / `filter` builders (Phase 2/3), the value is **one** function, so
dispatch happens once on the whole value (`ParseFunction`) rather than over a
space-separated list. The "ridiculous" flex is per-shape argument grammar: a 1–4
length-percentage box for `inset()`, a radius + `at <position>` for `circle()` /
`ellipse()`, and a **variadic** comma-separated vertex list for `polygon()` where
each vertex is two length-percentages.

The best visual demo in the whole roadmap lives here: a **draggable-vertex polygon
editor** over an image, where React pointer handlers convert pointer position to
percentage vertices and apply the resulting `polygon()` as a live `clip-path` on a
preview element.

### Through-line: three tiers (per roadmap §5.2)

1. **Casual** — `value: string`. No compile-time validation; runtime parser handles
   anything including `calc()` / `var()` inside arguments.
2. **IntelliSense** — `ClipPathString` suggestion union (per-shape heads + the
   keyword-only forms). This is also the `onChange` return type.
3. **Strict** — `ClipPathLiteral<S>` resolves to `S` when the value is a
   dimensionally- and arity-valid basic shape (+ optional geometry box), `never`
   otherwise. Call-site helper `cssClipPath`.

---

## 2. Grammar scope (what the strict tier validates)

CSS `<basic-shape>` (the supported subset), with `<lp>` = `<length-percentage>`:

```
clip-path-value := <geometry-box>? <basic-shape> <geometry-box>?     // at least one present; bare box also allowed
                 | none

<basic-shape>   := inset( <lp>{1,4} [ round <border-radius> ]? )
                 | circle( <radius>? [ at <position> ]? )
                 | ellipse( [ <radius> <radius> ]? [ at <position> ]? )
                 | polygon( [ <fill-rule> , ]? <vertex># )

<radius>        := <lp> | closest-side | farthest-side          // circle: one; ellipse: two
<vertex>        := <lp> <lp>                                     // "x y"
<fill-rule>     := nonzero | evenodd
<geometry-box>  := margin-box | border-box | padding-box | content-box
                 | fill-box | stroke-box | view-box
<position>      := simplified — see §2.4
```

### 2.1 `inset()` — FULL strict validation

- 1 to 4 length-percentages (top / right / bottom / left, with CSS shorthand
  collapsing). Each validated by `IsLengthPct` (kit `IsLength` ∨ `IsPercentage`).
- Optional `round <border-radius>` tail — **WEAK-validated**: the tokens after
  `round` are accepted as long as `round` is present and the tail is non-empty.
  Full elliptical 8-value `/` radius validation is out of scope (documented; the
  runtime parser keeps it verbatim). Rationale: §7 risk budget — `border-radius`'s
  full grammar (1–4 + optional `/` + 1–4) is its own monster and not the point of
  this component.

### 2.2 `circle()` — FULL strict validation

- Optional radius: one `<lp>` **or** the keyword `closest-side` / `farthest-side`.
- Optional `at <position>` clause (see §2.4).
- Empty `circle()` is valid (defaults to `closest-side at center`).

### 2.3 `ellipse()` — FULL strict validation

- Optional **pair** of radii: `<rx> <ry>`, each a `<lp>` or `closest-side` /
  `farthest-side`. A single radius is **invalid** per spec (ellipse takes 0 or 2).
- Optional `at <position>` clause.
- Empty `ellipse()` is valid.

### 2.4 `<position>` — SIMPLIFIED strict validation (documented)

Full CSS `<position>` is a 1–4-token grammar with edge-offset pairs
(`right 20% bottom 30%`). The strict tier validates a **practical subset**:

- 1 token: a keyword (`left|right|center|top|bottom`) **or** a `<lp>`.
- 2 tokens: `<x> <y>` where each is a keyword **or** a `<lp>`.

Edge-offset 3/4-token forms (`bottom 10px right 20px`) resolve to `never` at the
strict tier but are accepted by the runtime parser. Documented in the API page and
`@example` JSDoc. Rationale: §7 risk budget + the editor UI only ever produces the
1/2-token form.

### 2.5 `polygon()` — FULL per-vertex validation up to a DEPTH CAP

- Optional leading `<fill-rule>` (`nonzero` / `evenodd`) followed by a comma.
- A comma-separated list of vertices; each vertex is exactly two `<lp>` separated by
  whitespace. **VARIADIC.**
- **Depth cap: 32 vertices.** Each of the first 32 vertices is fully validated (both
  coordinates checked with `IsLengthPct`). If the list is longer than 32, the tail
  beyond vertex 32 is **weak-validated** (accepted without per-coordinate checks) to
  bound `tsc` recursion per §7. 32 covers every realistic hand-authored polygon and
  every shape the draggable editor produces; the runtime parser validates all
  vertices regardless. The cap is documented in JSDoc, the API page, and §7 below.
  - **Recursion strategy:** the vertex fold is tail-recursive and threads a tuple
    accumulator for the count, so TS eliminates the tail call; the cap is a guard,
    not a hard recursion-limit workaround. Measured `tsc` cost recorded in the plan.

### 2.6 `<geometry-box>` keyword

- An optional leading **or** trailing geometry-box keyword:
  `margin-box | border-box | padding-box | content-box | fill-box | stroke-box | view-box`.
- A bare geometry box with no shape is itself valid (`clip-path: border-box`).
- Both leading and trailing boxes (`border-box circle() padding-box`) → `never`
  (CSS allows at most one). Documented.

### 2.7 What strict ALWAYS defers (resolves to `never`)

- `calc()` / `var()` / `env()` / `min()` / `max()` / `clamp()` inside any argument
  (undecidable at compile time — the runtime parser accepts them).
- `inset()`'s `round` radius beyond presence + non-empty tail.
- 3/4-token edge-offset `<position>`.
- Polygon vertices beyond the depth cap (weak-validated, not rejected).

---

## 3. Type surface (`clip-path-editor.types.ts`)

Per roadmap §5.3. Built on the kit (`ParseFunction`, `SplitByComma`,
`SplitBySpace`, `IsLength`, `IsPercentage`, `And`, `Or`, `Trim`).

### 3.1 Strict validator + helper

```ts
export type ClipPathLiteral<S extends string>   // S | never
export const cssClipPath = <S extends string>(v: S & ClipPathLiteral<S>): S => v
```

Pipeline: strip `none` → split off an optional leading/trailing geometry box →
`ParseFunction` the remaining shape → dispatch on the shape name to a per-shape
validator → collapse to `S | never`.

### 3.2 Suggestion strings (IntelliSense + `onChange`)

```ts
export type BasicShapeName = "inset" | "circle" | "ellipse" | "polygon"
export type GeometryBox =
  | "margin-box" | "border-box" | "padding-box" | "content-box"
  | "fill-box" | "stroke-box" | "view-box"

export type ClipPathString =
  | `${BasicShapeName}(${string})`
  | `${BasicShapeName}(${string}) ${GeometryBox}`
  | `${GeometryBox} ${BasicShapeName}(${string})`
  | GeometryBox
  | "none"

export interface ClipPathStringMap {        // shape → output-string shape
  inset: `inset(${string})`
  circle: `circle(${string})`
  ellipse: `ellipse(${string})`
  polygon: `polygon(${string})`
}
export type ClipPathShape = keyof ClipPathStringMap
```

`mode` does **not** narrow the output (clip-path and shape-outside share the
grammar), mirroring filter-builder's `mode`. `onChange` returns `ClipPathString` in
both modes. There is no per-mode `StringMap` key type because the output is
mode-invariant; `ClipPathStringMap` keys on the shape instead. (Documented
deviation from §5.3's "mode/basis key type where a mode prop narrows output" —
the antecedent "where a mode prop narrows output" does not hold here.)

### 3.3 Utility types (literal-level operators)

```ts
export type ShapeOf<S extends string>        // "inset" | "circle" | "ellipse" | "polygon" | "none" | "box"
export type VertexCountOf<S extends string>  // number of polygon vertices (0 if not a polygon)
export type GeometryBoxOf<S extends string>  // the geometry box keyword present, or "none"
```

`ShapeOf` is the `ModeOf`/`FunctionOf` analog. `VertexCountOf` is the polygon
counterpart to filter's `FunctionCountOf`. `GeometryBoxOf` extracts the box.

### 3.4 Internal state — exported discriminated union

```ts
export type ClipPathShapeState =
  | { shape: "inset"; top: string; right?: string; bottom?: string; left?: string; round?: string }
  | { shape: "circle"; radius?: string; atX?: string; atY?: string }
  | { shape: "ellipse"; rx?: string; ry?: string; atX?: string; atY?: string }
  | { shape: "polygon"; fillRule?: "nonzero" | "evenodd"; vertices: Array<{ x: string; y: string }> }

export interface ClipPathState {
  box?: GeometryBox
  boxPosition?: "leading" | "trailing"   // where the box sits relative to the shape
  shape: ClipPathShapeState | null        // null = bare geometry box / none
}
```

Exported for advanced use (custom serialization, programmatic build), mirroring
`FilterItem` / `TransformItem` / `EasingState`.

---

## 4. Runtime helpers (`clip-path-editor.helpers.ts`)

Superset of the strict tier — tolerant parse/format/spec, single source of truth
for the UI. Mirrors `filter-builder.helpers.ts`.

```ts
export function parseClipPath(src: string): ClipPathState | null   // null on syntax/arity/unknown-shape error; "none"/"" → { shape: null }
export function formatClipPath(state: ClipPathState): string       // canonical re-serialization; { shape: null, no box } → "none"
export function defaultShape(shape: BasicShapeName): ClipPathShapeState  // seed a fresh shape with sensible defaults
export function shapeName(src: string): string                     // runtime mirror of ShapeOf
export function polygonVertices(src: string): Array<{ x: string; y: string }>  // mirror of vertex extraction; [] if not a polygon
```

- `parseClipPath` tolerates `calc()`/`var()` (kept verbatim, opaque) via paren-aware
  splitting (runtime mirror of the kit's `SplitTopLevel`), validates arity, accepts
  a leading **or** trailing geometry box, and accepts the 3/4-token `<position>`
  form (normalizing to the 2-token `atX`/`atY` it can represent, dropping edge
  keywords it cannot — documented best-effort).
- `formatClipPath` emits the canonical single-spaced form (fill-rule first if
  present; box in its stored position).
- Internal `ARG`-style spec table (per-shape default + radius/position defaults)
  drives both `defaultShape` and the UI add-menu.

---

## 5. Component API (`clip-path-editor.tsx`)

Per roadmap §5.6. Single-file `.tsx`. Controlled-only.

### 5.1 Top-level exports

- `<ClipPathEditor />` — popover-wrapped (Button trigger showing shape + value).
- `<ClipPathEditorPanel />` — inline editor.

Shared props:

```ts
export interface ClipPathEditorPanelProps {
  value: ClipPathString | (string & {})
  onChange: (value: ClipPathString) => void
  /** Which CSS property the preview targets. Both share the grammar, so this does
   *  NOT narrow the output type — it only drives the preview render + labels.
   *  Default "clip-path". */
  mode?: "clip-path" | "shape-outside"
  className?: string
  "aria-label"?: string
}
export interface ClipPathEditorProps extends ClipPathEditorPanelProps {}
```

### 5.2 Exported sub-components (named, for composition)

- `<ShapeSelect value onChange />` — choose the basic shape (inset/circle/ellipse/
  polygon) + a bare-box / none option.
- `<GeometryBoxSelect value onChange />` — the optional geometry-box keyword (+ a
  "none" entry and a leading/trailing toggle).
- `<InsetControls state onChange />` — 4 length-percentage editors + optional round.
- `<CircleControls state onChange />` — radius (lp or keyword) + `at` position.
- `<EllipseControls state onChange />` — rx / ry + `at` position.
- `<PolygonControls state onChange />` — fill-rule select + a list of vertex rows
  (add / remove / edit each x,y), plus the draggable canvas.
- `<LengthPctEditor label value onChange />` — a number field + unit `<select>`
  (px / % / rem / em / vw / vh) for `<length-percentage>` slots; raw text passthrough
  for opaque `calc()`/`var()`. (Internal-styled, exported for reuse.)
- `<ClipPathPreview value mode? onChange? />` — **the showcase.** An image/box with
  the live `clip-path` (or `shape-outside`) applied, and for `polygon()` an
  overlaid SVG with **draggable vertex handles**. Pointer handlers convert client
  coordinates to **percentage** vertices and write back the `polygon()` string.

### 5.3 Draggable-vertex behavior (the namesake demo)

- Each polygon vertex renders as a draggable handle positioned at its
  `(x%, y%)` over the preview box.
- `onPointerDown` on a handle captures the pointer (`setPointerCapture`);
  `onPointerMove` computes the new vertex as
  `clamp(0,100, (clientX − rect.left) / rect.width * 100)` (and same for y),
  rounds to a configurable precision (default 1 decimal), rebuilds the
  `polygon()` string, and calls `onChange`.
- Double-click on an edge inserts a vertex at the midpoint; a handle's context
  affordance (small ✕ button or alt-click) removes it (min 3 vertices enforced).
- Keyboard: handles are focusable; arrow keys nudge by 1% (shift = 10%).
- For non-polygon shapes the preview shows the shape applied without handles, plus
  the relevant scrub controls (circle/ellipse radius + position; inset offsets).

### 5.4 a11y

- Popover focus management inherited from shadcn `Popover`.
- Each vertex handle: `role="slider"`-style focusable button with an `aria-label`
  (`Vertex 1 at 20% 30%`); arrow-key nudging.
- All numeric editors have `aria-label`s; the shape select and box select are
  labeled.

---

## 6. Demo, registry, navigation

### 6.1 MPA + page + examples (roadmap §5.4)

- `pages/clip-path-editor/index.html` + `pages/clip-path-editor/main.tsx`.
- `src/pages/clip-path-editor/page.tsx`.
- `src/examples/clip-path-editor/`:
  - `basic-usage.tsx` — controlled `<ClipPathEditor>` + live string.
  - `tier-casual.tsx` — `useState<string>`.
  - `tier-intellisense.tsx` — `useState<ClipPathString>`.
  - `tier-strict.tsx` — `cssClipPath()` with `@ts-expect-error` rejections.
  - `api-reference.tsx` — props / helpers / types tables + strict-scope notes.
  - `polygon-playground.tsx` — the **draggable-vertex** showcase over an image.
- Vite MPA `input` entry added to `vite.config.ts`.
- `pnpm nav:build` regenerates `src/generated/nav.ts`.

### 6.2 Registry (`registry.json`)

Add a `clip-path-editor` item:

```jsonc
{
  "name": "clip-path-editor",
  "type": "registry:ui",
  "registryDependencies": [
    "ridiculous-type-kit", "unit-input",
    "button", "popover", "input", "label", "select"
  ],
  "files": [ index.ts, .tsx, .types.ts, .helpers.ts ]   // all four
}
```

Add `clip-path-editor.json` to the `all` bundle's `registryDependencies` and update
the bundle description. `pnpm registry:build` regenerates `public/r/*.json` (GITIGNORED
— regenerate, do **not** commit; commit only `registry.json`).

---

## 7. Testing (roadmap §5.5)

- `tests/clip-path-editor-types.test-d.ts` — vitest `typecheck`. **Accept + reject
  for each shape:** inset (1–4 lp; round tail; bad dimension), circle (lp / keyword
  radius; at position; reject ellipse-style two radii), ellipse (two radii; reject
  single; at position), polygon (fill-rule; multi-vertex; reject odd-token vertex;
  weak-validate past cap), geometry box (leading/trailing; reject double box),
  `none`, garbage, `calc()` → never. Plus `cssClipPath`, suggestion strings,
  `ShapeOf` / `VertexCountOf` / `GeometryBoxOf`, the discriminated union, and the
  `onChange` parameter type.
- `tests/clip-path-editor-parse.test.ts` — `parseClipPath` round-trips, tolerant
  cases (calc/var, leading/trailing box, 3/4-token position best-effort), error
  cases (null on bad arity / unknown shape).
- `tests/clip-path-editor-format.test.ts` — `formatClipPath` canonical output,
  empty → `none`, fill-rule ordering, box position.
- `tests/clip-path-editor.test.tsx` — jsdom render/interaction: popover opens,
  shape switch reseeds, vertex add/remove, a pointer-drag updates a vertex (via
  `getBoundingClientRect` stub), `onChange` emits a valid string.
- Add `src/components/ui/clip-path-editor/**` to `coverage.include` in
  `vitest.config.ts`. Keep thresholds 90/85/90/90.

---

## 8. File layout (deliverables)

```
src/components/ui/clip-path-editor/
  clip-path-editor.tsx
  clip-path-editor.types.ts
  clip-path-editor.helpers.ts
  index.ts
pages/clip-path-editor/{index.html,main.tsx}
src/pages/clip-path-editor/page.tsx
src/examples/clip-path-editor/{basic-usage,tier-casual,tier-intellisense,tier-strict,api-reference,polygon-playground}.tsx
tests/{clip-path-editor-types.test-d.ts,clip-path-editor-parse.test.ts,clip-path-editor-format.test.ts,clip-path-editor.test.tsx}
```

Modified (allowed): `registry.json` (append item + `all`), `vite.config.ts` (MPA
entry), `src/generated/nav.ts` (via `nav:build`), `vitest.config.ts`
(`coverage.include` line).

---

## 9. Assumptions (autonomous decisions — the human's review checkpoint)

1. **Single basic-shape, not a list.** `clip-path` accepts one `<basic-shape>` (+ box),
   not a space-separated list. Dispatch is one `ParseFunction` on the value, after
   peeling an optional geometry box. (Differs structurally from transform/filter.)
2. **Shapes shipped FULL:** `inset` (1–4 lp), `circle` (radius lp/keyword + at),
   `ellipse` (two radii + at), `polygon` (per-vertex up to a 32 cap). **Weak-validated:**
   `inset`'s `round` tail, `<position>` 3/4-token edge-offset forms, polygon vertices
   past 32. `xywh()`, `rect()`, `path()`, `shape()` are **out of scope** (not in the
   roadmap's named set; documented).
3. **Polygon depth cap = 32 vertices.** Covers all realistic polygons; bounds `tsc`.
   Beyond 32, weak-validate the tail (accept, don't reject). Per §7.
4. **`<position>` simplified to 1–2 tokens** (keyword | length-%). 3/4-token
   edge-offset forms defer to `never` (strict) but parse at runtime. The editor UI
   only ever emits the 1/2-token form.
5. **Geometry box: at most one, leading or trailing.** Bare box is valid. Double box
   → `never`. Stored with a `boxPosition` discriminant so round-trips preserve order.
6. **`mode` does not narrow output.** `clip-path` and `shape-outside` share the
   grammar (filter-builder precedent). `onChange` returns `ClipPathString` in both
   modes; `mode` only drives the preview target + labels. No per-mode key type
   (documented deviation from §5.3, whose antecedent doesn't hold).
7. **`ClipPathStringMap` keys on the SHAPE, not a mode** — the analog of
   `FilterStringMap`/`TransformStringMap` keying on the function.
8. **Reuse `unit-input` for fixed-unit numeric scrubs where natural** (e.g. the
   circle radius % scrub in the preview), but `<length-percentage>` panel slots use a
   bespoke `LengthPctEditor` (number + unit `<select>`) because `UnitInput` locks to a
   single unit and lp slots must switch px↔%. Same pattern filter-builder uses for its
   arg editors. Registry still lists `unit-input` as a dep (the component imports it
   for the radius scrub).
9. **Draggable vertices write PERCENTAGE coordinates** (the natural, resolution-
   independent unit for a responsive clip). Drag math:
   `(clientX − rect.left) / rect.width * 100`, clamped to 0–100, rounded to 1 decimal.
   Min 3 vertices enforced. (Roadmap §2 #5 — "best draggable-vertex visual demo.")
10. **No new runtime dependency.** SVG handles + native pointer events only (roadmap
    §4.2). Uses shadcn `button`/`popover`/`input` and native `<select>` (matching the
    other builders, which list `label`/`select` as registry deps without importing a
    shadcn `select`).
11. **`fill-box`/`stroke-box`/`view-box`** included in the geometry-box set even
    though they're primarily `shape-outside`/SVG-context — CSS parses them for both;
    keeping the full keyword set is simpler and harmless.
12. **Coverage threshold unchanged** (90/85/90/90). The draggable-canvas pointer math
    is exercised by a jsdom test stubbing `getBoundingClientRect`.

---

## 10. Risks (component-specific, extends roadmap §7)

- **Polygon variadic recursion (top risk).** Mitigated by the 32-vertex cap +
  tail-recursive count accumulator. If `tsc` still strains, lower the cap to 16 (still
  ample) — recorded in the plan after a measurement.
- **Geometry-box ambiguity.** A bare keyword vs. a keyword-prefixed shape must not
  cross-match. Mitigated by peeling the box with explicit `${GeometryBox} ${infer Rest}`
  / `${infer Rest} ${GeometryBox}` patterns before `ParseFunction`, and requiring the
  remainder to itself be a valid shape (or empty, for the bare-box case).
- **`<position>` under-validation.** Accepted: the strict tier is deliberately a
  subset; the runtime parser + UI cover the rest. Documented everywhere it matters.
