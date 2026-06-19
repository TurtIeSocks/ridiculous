# shape-path-editor — Design Spec

**Date:** 2026-06-19
**Status:** Draft for implementation
**Type:** Per-component design spec (roadmap §5; promotes the §2.2 stretch-bench "SVG `path()` editor" item, reframed to the CSS `shape()` function)
**Component:** `shape-path-editor` — edits a CSS `shape()` `<basic-shape>` value (for `clip-path` / `offset-path`): a `from` seed plus a move/line/hline/vline/curve/smooth/arc/close command list.
**Authoring mode:** Delegated. Judgement calls in §11.

---

## 1. What it is

`shape-path-editor` is a controlled editor for a CSS `shape()` value — the CSS Shapes Level 2 function that draws a path from line/curve/arc commands (the modern, animatable cousin of `path()`, usable in `clip-path` and `offset-path`).

The namesake — *ridiculously precise template-literal types* — lands on the **per-command dispatch**: `ShapeLiteral<S>` peels the `shape()` wrapper, validates the optional fill-rule + the `from <coordinate-pair>` seed, then dispatches each comma-separated command on its name (`move`/`line`/`hline`/`vline`/`curve`/`smooth`/`arc`/`close`), checking per-command arity, the `by`/`to` direction keyword, the `with`/`of` slot keywords, and every coordinate's dimension. It is in the function-list-dispatch lineage of `transform-builder` / `clip-path-editor`, but the only registry component whose visual editor draws **Bézier control handles**, not just vertices.

It reuses `clip-path-editor`'s draggable-vertex canvas approach (leveled up with control handles + an arc gizmo) and `unit-input` for coordinate scrubbing.

### 1.1 Grammar (CSS Shapes L2 `shape()`)

```
shape()             = shape( <fill-rule>? from <coordinate-pair> , <shape-command># )
<fill-rule>         = nonzero | evenodd
<coordinate-pair>   = <length-percentage> <length-percentage>
<by-to>             = by | to
<shape-command> =
    move  <by-to> <coordinate-pair>
  | line  <by-to> <coordinate-pair>
  | hline <by-to> <length-percentage>
  | vline <by-to> <length-percentage>
  | curve <by-to> <coordinate-pair> with <coordinate-pair> [ / <coordinate-pair> ]?
  | smooth <by-to> <coordinate-pair> [ with <coordinate-pair> ]?
  | arc   <by-to> <coordinate-pair> of <length-percentage> [ <length-percentage> ]? <arc-flags>?
  | close
<arc-flags>         = [ cw | ccw ] || [ large | small ] || [ rotate <angle> ]
```

### 1.2 Examples (strict tier)

```ts
// accepted (coordinates are <length-percentage> — units required, like every
// ridiculous component; bare `0` is rejected, use `0px` / `0%`)
cssShape("shape(from 0px 0px, line to 100px 0px, close)")
cssShape("shape(from 0% 0%, curve to 100px 100px with 50px 0px, close)")
cssShape("shape(evenodd from 0px 0px, hline by 50px, vline by 50px, close)")
cssShape("shape(from 10px 10px, smooth to 90px 90px, close)")
cssShape("shape(from 0px 0px, arc to 100px 0px of 50px, close)")
// rejected (→ never)
cssShape("shape(from 0px 0px, wiggle to 10px 10px)")  // unknown command
cssShape("shape(from 0px 0px, line to 100px)")        // line needs a coordinate PAIR
cssShape("shape(from 0px 0px, curve to 10px 10px)")   // curve needs a `with` control point
cssShape("shape(from 0 0, close)")                     // bare 0 has no unit
cssShape("rotate(90deg)")                              // not shape()
```

---

## 2. Three-tier typing model
1. **Casual** — `value: string`. Runtime parser drives the canvas.
2. **IntelliSense** — `ShapeString` (`` `shape(${string})` `` | `(string & {})`); the `onChange` return.
3. **Strict** — `ShapeLiteral<S>` validator + `cssShape` helper.

---

## 3. Strict-tier design
```
ShapeLiteral<S> =
  ParseFunction<S> → { name: "shape"; args }              (else never)
  strip optional leading "nonzero"|"evenodd"
  require "from" <coordinate-pair> as the first comma segment
  SplitByComma rest → commands ; every command ValidateCommand → S, else never
ValidateCommand<C> =
  SplitBySpace<C> → [Name, ...Rest]
  dispatch on Name:
    "close"  → Rest empty
    "move"|"line"  → [by|to, lp, lp]
    "hline"|"vline"→ [by|to, lp]
    "curve"  → [by|to, lp, lp, "with", lp, lp]  (optional `/ lp lp` tail validated if present)
    "smooth" → [by|to, lp, lp]  (optional `with lp lp` tail)
    "arc"    → [by|to, lp, lp, "of", lp, (lp)?]  (trailing arc-flags accepted leniently)
  every <length-percentage> via Or<IsLength, IsPercentage>
```

### 3.1 Validated vs deferred
**Validates:** the `shape()` wrapper + fill-rule; the `from` seed; each command name; per-command arity; the `by`/`to`, `with`, `of` keyword slots; every coordinate dimension (`<length-percentage>`).
**Defers (lenient):**
1. **A4 — hline/vline keyword positions** (`left`/`center`/`right`/`top`/`bottom`/`x-start`…) accept only `<length-percentage>` strictly; the keyword forms are casual/runtime.
2. **A5 — arc flags** (`cw`/`ccw`/`large`/`small`/`rotate <angle>`) are accepted as a lenient trailing tail after `of <radii>` (order-free `||` grammar is undecidable cheaply); the runtime parser classifies them.
3. **A6 — `curve`'s second control point** after `/` is validated for dimension if present; its absence (quadratic) is fine.
4. **A7 — control points as `<position>`** (keyword positions) beyond a coordinate pair are casual/runtime.
5. **`calc()`/`var()` coordinates** → `never` in strict (undecidable); casual + runtime accept.
6. **Path closure / self-intersection / geometric validity** — never checked (out of scope).

---

## 4. Runtime helpers (`shape-path-editor.helpers.ts`)
- `parseShape(src): { fillRule: "nonzero" | "evenodd" | null; from: Point; commands: ShapeCommand[]; error: string | null }` — `Point = { x: string; y: string }`; `ShapeCommand` is a discriminated union by `kind` (`move`/`line`/`hline`/`vline`/`curve`/`smooth`/`arc`/`close`) carrying its `by`/`to`, endpoint, control point(s), radii, and arc flags.
- `formatShape(shape): string` — canonical re-serialization.
- `commandNames(): readonly string[]`; `defaultShape(): string`.
- Geometry helpers for the canvas: `shapeToPoints(shape)` (endpoints + control handles as `{ id, role, x, y }` in a normalized 0–100 space) and `updatePoint(shape, id, x, y)`; `commandArity(kind)`.

## 4.1 The path canvas
An SVG canvas (mirrors `clip-path-editor`'s draggable vertices) rendering: one node per command endpoint; a draggable Bézier control handle (with a connector line) per `curve`/`smooth` control point; an arc radius/sweep gizmo for `arc`. Dragging a node/handle calls `updatePoint` → re-serializes → `onChange`. The live `clip-path: shape(...)` (or `offset-path` in offset mode) is applied to a preview box. Coordinates are edited in a normalized px space (a configurable canvas size); `unit-input` provides numeric scrubbing in the per-command row editor beneath the canvas.

---

## 5. Component (`shape-path-editor.tsx`)
Controlled `value` + `onChange` + `mode?: "clip-path" | "offset-path"` (default `"clip-path"`; affects the PREVIEW only — both modes share the `shape()` grammar). `ShapePathEditor` (popover) + `ShapePathEditorPanel` (inline).

**Sub-components (named exports):**
- `ShapeCanvas` — the SVG draggable path canvas (nodes + Bézier handles + arc gizmo + live preview overlay). Modeled on `clip-path-editor`.
- `CommandRow` — one command's editor: command-kind `<select>`, `by`/`to` toggle, coordinate `unit-input`s, `with`/`of`/flag fields shown per kind. Add/remove/reorder commands.
- `MiniSelect` — local copy.
- `ShapePreview` — applies the produced `shape()` to a box via `clip-path` (or `offset-path` motion in offset mode), guarded by `CSS.supports("clip-path: shape(from 0 0)")`; degrades to the raw SVG path render + a support note (mirrors `if-function`).
- `LiveString` — the produced value.

**State:** the parsed `{ fillRule, from, commands }`; `commit` + `lastEmittedRef` resync. a11y: canvas nodes are labelled draggable handles with keyboard nudge (arrow keys) + `aria-label`; selects/inputs labelled.

---

## 6. Demo, registry, navigation
- **Page:** `src/pages/shape-path-editor/page.tsx`. Route auto-registers via NAV.
- **Examples** (`src/examples/shape-path-editor/`): `basic-usage`, `tier-casual`, `tier-intellisense`, `tier-strict`, `api-reference`, plus **`path-canvas`** (the hero: the draggable canvas with Bézier handles editing a curve, live clip-path preview).
- **Registry:** `shape-path-editor` item — `registryDependencies`: `ridiculous-type-kit`, `unit-input`, `button`, `popover`, `input`, `label`. Files = index + tsx + types + helpers + sub-component tsx. Append `.json` URL to `all`.
- **Coverage:** add `src/components/ui/shape-path-editor/**`. **Nav:** `pnpm nav:build`.

---

## 7. Testing (roadmap §5.5)
- **`tests/shape-path-editor-types.test-d.ts`** (gate): `ShapeLiteral` accept (move/line/hline/vline/curve/smooth/arc/close, fill-rule, by/to) + reject (unknown command, wrong arity, missing `with`, non-shape fn, bad coordinate); `cssShape` returns; `ShapeString`, `CommandsOf`/`CommandCountOf`.
- **`tests/shape-path-editor-parse.test.ts`** — `parseShape` (all command kinds, fill-rule, errors), `shapeToPoints`/`updatePoint`, `commandNames`, `defaultShape`.
- **`tests/shape-path-editor-format.test.ts`** — `formatShape` round-trips; canonical serialization.
- **`tests/shape-path-editor.test.tsx`** (jsdom) — canvas renders nodes; dragging a node (pointer events) emits updated coords; command add/remove/reorder; kind switch swaps the row fields; preview degrades when `CSS.supports` false.
- **Coverage:** 90/85/90/90.

---

## 8. File layout
```
src/components/ui/shape-path-editor/
  index.ts, shape-path-editor.tsx, shape-path-editor.types.ts,
  shape-path-editor.helpers.ts, shape-canvas.tsx, command-row.tsx,
  shape-preview.tsx, mini-select.tsx
src/pages/shape-path-editor/page.tsx
src/examples/shape-path-editor/{basic-usage,tier-casual,tier-intellisense,
  tier-strict,api-reference,path-canvas}.tsx
tests/{shape-path-editor-types.test-d.ts, -parse.test.ts, -format.test.ts, .test.tsx}
```
Modified: `registry.json`, `vitest.config.ts`, `@/generated/nav`.

---

## 9. Type surface (exports from `shape-path-editor.types.ts`)
- **Validator:** `ShapeLiteral<S>`. **Helper:** `cssShape`.
- **Suggestion:** `ShapeString`. **Util:** `CommandsOf<S>`, `CommandCountOf<S>`, `ShapeCommandName`.
- **State:** `ShapeCommand` (discriminated union), `Point`, `ShapeValue`.

---

## 10. Component API conventions
Controlled-only; `ShapePathEditor` + `ShapePathEditorPanel`; sub-components named-exported; keyboard nudge + a11y on canvas handles.

---

## 11. Assumptions (delegated — review checkpoint)
- **A1 — `mode` affects PREVIEW only** (`clip-path` box vs `offset-path` motion); the `shape()` grammar + validator are identical. Keeps one validator.
- **A2 — One validator `ShapeLiteral<S>` + `cssShape`.** No mode type-arg.
- **A3 — Per-command dispatch in the transform-builder lineage** (name → arity + slot keywords + coordinate dimensions).
- **A4 — hline/vline accept `<length-percentage>` only in strict;** keyword positions are casual/runtime.
- **A5 — arc flags (cw/ccw/large/small/rotate) are a lenient trailing tail** (order-free `||` is undecidable cheaply); runtime classifies.
- **A6 — curve's optional second control point validated if present;** quadratic (one control point) is fine.
- **A7 — control points are coordinate pairs in strict;** `<position>` keyword control points are casual/runtime.
- **A8 — coordinates edited in a normalized px canvas space;** `unit-input` for numeric scrubbing in rows. Canvas default 200×200.
- **A9 — Bézier control handles + arc gizmo are the novel UI;** built on `clip-path-editor`'s draggable-vertex SVG approach.
- **A10 — `CSS.supports` gates the live preview;** degrades to a raw SVG path render + support note (fresh browser support: Chrome 137 / Safari 18.4).
- **A11 — Each component owns its `mini-select.tsx` copy.**

---

## 12. Risks
- **Type budget.** Per-command dispatch × variadic command list. Bounded: flat `SplitByComma` command list, flat `SplitBySpace` per command, fixed per-command arity checks (no deep recursion); arc flags + hline keywords deferred (the variadic/undecidable parts). Watch `tsc`.
- **Canvas interaction is the most novel UI** (Bézier handles, arc gizmo) — no exact registry precedent beyond clip-path vertices. Mitigation: build incrementally (nodes first, then handles, then arc), each covered by a component test; pointer events mocked in jsdom.
- **Browser support freshest of the batch.** Preview guards + degrades; tests assert the degraded path.
