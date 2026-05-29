# Clip Path Editor — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-05-29-clip-path-editor-design.md`
**Approach:** TDD, type-level tests first (the validator is the product). Commit per
logical unit. Biome: no semicolons, double quotes, 2-space indent.

Kit imports available from `@/lib/ridiculous-type-kit`:
`ParseFunction, SplitByComma, SplitBySpace, IsLength, IsPercentage, IsNumber,
And, Or, Not, Trim, KeepIf, StartsWith, EndsWith, DimensionOf`.

---

## Task 1 — Strict type tier + type-tests (the product)

**Files:** `src/components/ui/clip-path-editor/clip-path-editor.types.ts`,
`tests/clip-path-editor-types.test-d.ts`.

### 1a. Write the type-tests FIRST (`*.test-d.ts`)

Mirror `filter-builder-types.test-d.ts` structure. Use `expectTypeOf` /
`toEqualTypeOf` / `toBeNever` / `toMatchTypeOf`. Cover:

- **inset:** `inset(10px)`, `inset(10px 20px)`, `inset(1px 2px 3px 4px)`,
  `inset(10% 20%)` accept; `inset(10px round 8px)` accept (round tail weak);
  `inset()` → never (needs ≥1 lp); `inset(45deg)` → never; `inset(1px 2px 3px 4px 5px)`
  → never (arity > 4).
- **circle:** `circle()`, `circle(50%)`, `circle(10px)`, `circle(closest-side)`,
  `circle(farthest-side)`, `circle(50% at center)`, `circle(5rem at 10px 20px)`
  accept; `circle(45deg)` → never; `circle(50% 60%)` → never (two radii is ellipse).
- **ellipse:** `ellipse()`, `ellipse(50% 60%)`, `ellipse(10px 20px at center)`,
  `ellipse(closest-side farthest-side)` accept; `ellipse(50%)` → never (needs 0 or 2);
  `ellipse(45deg 50%)` → never.
- **polygon:** `polygon(0 0, 100% 0, 50% 100%)` accept; `polygon(nonzero, 0 0, 1px 1px)`
  and `polygon(evenodd, 0 0, 100% 100%)` accept; `polygon(0 0, 100% 0, 50%)` → never
  (odd token count in a vertex); `polygon(0)` → never; `polygon(45deg 0, 1px 1px)` →
  never (bad coordinate). Add a "weak past cap" assertion: a 33+-vertex polygon still
  resolves to the literal (tail weak-validated) — build it with a long literal.
- **geometry box:** `border-box` accept (bare box); `circle() border-box` accept;
  `padding-box ellipse(50% 60%)` accept; `border-box circle() padding-box` → never
  (double box); `wobble-box` → never (unknown box, and not a shape).
- **edge cases:** `none` → `"none"`; `""` → never; `wobble(0 0)` → never (unknown
  shape); `circle(calc(50% + 10px))` → never (calc undecidable).
- **cssClipPath:** valid call returns the literal; `@ts-expect-error` for each reject
  case above (bad dimension, arity, double box, unknown shape, calc).
- **suggestion strings:** members of `ClipPathString`; `ClipPathStringMap["circle"]`
  equals `` `circle(${string})` ``; `ClipPathShape` equals `BasicShapeName`.
- **utility types:** `ShapeOf<"circle(50%)">` = `"circle"`,
  `ShapeOf<"border-box">` = `"box"`, `ShapeOf<"none">` = `"none"`;
  `VertexCountOf<"polygon(0 0, 1px 1px, 2px 2px)">` = `3`,
  `VertexCountOf<"circle(50%)">` = `0`;
  `GeometryBoxOf<"circle() border-box">` = `"border-box"`,
  `GeometryBoxOf<"circle()">` = `"none"`.
- **discriminated union:** construct each `ClipPathShapeState` variant + a
  `ClipPathState` with a box; assert `toMatchTypeOf`.
- **onChange param:** `Parameters<typeof ClipPathEditor>[0]["onChange"]` parameter 0
  equals `ClipPathString` (import the component type-only).

### 1b. Implement `clip-path-editor.types.ts` to pass

Build the validator pipeline:

```ts
import type {
  And, IsLength, IsPercentage, Or, ParseFunction,
  SplitByComma, SplitBySpace, Trim,
} from "@/lib/ridiculous-type-kit"

type IsLengthPct<S extends string> = Or<IsLength<Trim<S>>, IsPercentage<Trim<S>>>

// --- inset: 1-4 lp, optional `round <tail>` (tail weak) -------------------
type AllLengthPct<A extends string[]> = A extends [infer H extends string, ...infer T extends string[]]
  ? IsLengthPct<H> extends true ? AllLengthPct<T> : false : true
type ValidateInset<Args extends string> =
  // peel optional `round <tail>` first
  SplitBySpace<Args> extends infer Toks extends string[]
    ? RoundSplit<Toks> extends { box: infer Box extends string[]; round: infer R extends boolean }
      ? Box["length"] extends 1 | 2 | 3 | 4
        ? And<AllLengthPct<Box>, R extends true ? RoundTailOk : true>
        : false
      : false
    : false
// RoundSplit walks Toks; when it hits "round", everything before is the box,
// everything after is the (non-empty → ok) radius tail. No "round" → round:false.
```

- `circle`: `SplitBySpace<Args>` → handle empty (`[]` ok); first token is radius
  (lp | `closest-side` | `farthest-side`) unless it's `at`; if an `at` keyword
  appears, the rest is a `<position>` validated by `ValidatePosition`.
- `ellipse`: like circle but **two** radii before an optional `at` (0 radii ok, 2 ok,
  1 → false). Reuse `IsRadius<S> = Or<IsLengthPct<S>, S extends "closest-side" | "farthest-side" ? true : false>`.
- `ValidatePosition<Toks>`: `[]` → true; 1 token → keyword | lp; 2 tokens → each
  keyword | lp; ≥3 → false (strict subset). Keyword union =
  `"left"|"right"|"center"|"top"|"bottom"`.
- `polygon`: `SplitByComma<Args>` → optional leading `nonzero`/`evenodd` (drop it),
  then fold vertices with a **count-capped** recursion:

```ts
type ValidateVertices<V extends string[], Depth extends unknown[] = []> =
  V extends [infer H extends string, ...infer T extends string[]]
    ? Depth["length"] extends 32
      ? true                                   // cap: weak-validate the tail
      : ValidateVertex<H> extends true
        ? ValidateVertices<T, [...Depth, unknown]>
        : false
    : V extends [] ? false : true              // empty list → false (need ≥1)
type ValidateVertex<S extends string> =
  SplitBySpace<Trim<S>> extends [infer X extends string, infer Y extends string]
    ? And<IsLengthPct<X>, IsLengthPct<Y>> : false
```

- **Shape dispatch + box peel** in `ClipPathLiteral<S>`:
  1. `Trim<S>` is `"none"` → `S`; `""` → never.
  2. Try leading box: `` `${B} ${infer Rest}` `` where `B extends GeometryBox` →
     validate `Rest` as a shape (and `Rest` must be a function, not another box).
  3. Try trailing box: `` `${infer Rest} ${B}` `` → same.
  4. Bare box: `Trim<S> extends GeometryBox` → `S`.
  5. Otherwise validate `Trim<S>` directly as a shape via `ParseFunction` + dispatch.
  - Guard double box by requiring the peeled `Rest` to itself NOT start/end with a box
    (or simply: validate `Rest` only via the shape path, which rejects a bare box).
- `cssClipPath = <S extends string>(v: S & ClipPathLiteral<S>): S => v`.
- Suggestion strings, `ClipPathStringMap`, `ClipPathShape`, utility types
  (`ShapeOf` via `ParseFunction`/box-peel, `VertexCountOf` via `SplitByComma` minus
  fill-rule, `GeometryBoxOf` via the same peel), and the exported discriminated union
  exactly as §3.4.

**Verify:** `pnpm exec vitest run tests/clip-path-editor-types.test-d.ts`
(typecheck project). Measure `tsc` wall-time; if the polygon fold strains, drop the
cap 32→16 and note it here + in the spec. **Commit.**

---

## Task 2 — Runtime helpers + parse/format tests

**Files:** `clip-path-editor.helpers.ts`, `tests/clip-path-editor-parse.test.ts`,
`tests/clip-path-editor-format.test.ts`.

### 2a. Tests first

- `parseClipPath`: each shape round-trips to the right `ClipPathState`; `none`/`""`
  → `{ shape: null }`; leading & trailing box parsed with correct `boxPosition`;
  fill-rule captured; calc/var kept verbatim; bad arity / unknown shape → `null`;
  3/4-token position best-effort (assert the documented normalization).
- `formatClipPath`: canonical output for each shape; `{ shape: null }` → `none`;
  bare box → the box keyword; fill-rule emitted first; box in stored position.
- `defaultShape`, `shapeName`, `polygonVertices` behavior.

### 2b. Implement

Mirror `filter-builder.helpers.ts`:
- `splitTopLevel(src, sep)` paren-aware (runtime mirror of the kit).
- `CALL_RE = /^([a-z]+)\((.*)\)$/is`; geometry-box `Set`.
- `parseClipPath`: peel a leading/trailing box token, then match the shape call,
  dispatch on name to a per-shape builder (`buildInset`/`buildCircle`/`buildEllipse`/
  `buildPolygon`). Polygon: `splitTopLevel(args, ",")`, drop a leading fill-rule,
  map each vertex via `splitTopLevel(v, " ")` → `{x,y}` (need exactly 2 tokens else
  null). Tolerate `calc()`/`var()` as opaque tokens.
- `formatClipPath`: inverse, single-spaced canonical form.
- `defaultShape(shape)`: `inset` → `inset(10% 10% 10% 10%)`-equiv state;
  `circle` → `circle(50% at 50% 50%)`; `ellipse` → `ellipse(50% 35% at 50% 50%)`;
  `polygon` → a triangle `[{x:"50%",y:"0%"},{x:"0%",y:"100%"},{x:"100%",y:"100%"}]`.

**Verify:** run both test files. **Commit.**

---

## Task 3 — `index.ts` barrel

**File:** `clip-path-editor/index.ts`. Export every public type + helper + the
`cssClipPath` value + (added in Task 4) the components & their props. Mirror
`filter-builder/index.ts`. (Initial commit may export only types/helpers; extend in
Task 4.) **Commit** can fold into Task 4.

---

## Task 4 — Component + jsdom tests

**Files:** `clip-path-editor.tsx`, `tests/clip-path-editor.test.tsx`, finish
`index.ts`.

### 4a. Tests first (jsdom)

Mirror `filter-builder.test.tsx`:
- `cssClipPath` returns its arg at runtime.
- `<ClipPathEditorPanel value="circle(50% at center)">` renders a shape select set
  to `circle` and the circle controls.
- Switching the shape select reseeds (`onChange` emits a string starting with the
  new shape).
- Editing a length-pct slot emits `onChange` with the updated string.
- Polygon: adding a vertex emits a longer vertex list; removing emits a shorter one;
  enforce min-3.
- **Drag:** stub `getBoundingClientRect` on the preview to `{left:0,top:0,width:200,
  height:200,...}`; `fireEvent.pointerDown`/`pointerMove` on a vertex handle →
  `onChange` with the recomputed percentage. (jsdom has no real layout; the stub
  drives the math.) Stub `setPointerCapture`/`releasePointerCapture` in
  `tests/setup.ts` if needed — check first; add only if missing.
- `value="none"` renders an empty/placeholder state with a shape picker.

### 4b. Implement

- `ClipPathEditor` (popover) + `ClipPathEditorPanel` (inline) per filter-builder shape:
  parse `value` → state, `useState` + `lastEmittedRef` resync, `commit` formats &
  emits as `ClipPathString`.
- `ShapeSelect`, `GeometryBoxSelect`, `InsetControls`, `CircleControls`,
  `EllipseControls`, `PolygonControls`, `LengthPctEditor`, `ClipPathPreview` per §5.2.
- `LengthPctEditor`: number `<input>` + unit `<select>` (px/%/rem/em/vw/vh); opaque
  `calc()`/`var()` → raw text passthrough (regex split like `FilterArgEditor`).
- `ClipPathPreview`: a 200-square box with a background image/gradient, `style={{
  [mode === "clip-path" ? "clipPath" : "shapeOutside"]: applied }}`. For polygon,
  overlay an absolutely-positioned SVG (or div handles) at each vertex %; each handle
  is a focusable `<button>` with pointer + keyboard handlers writing percentage
  vertices back through `onChange`. Reuse `UnitInput` for the circle/ellipse radius %
  scrub.

**Verify:** `pnpm exec vitest run tests/clip-path-editor.test.tsx`. **Commit.**

---

## Task 5 — Demo page + examples + MPA + nav

**Files:** `pages/clip-path-editor/{index.html,main.tsx}`,
`src/pages/clip-path-editor/page.tsx`,
`src/examples/clip-path-editor/{basic-usage,tier-casual,tier-intellisense,
tier-strict,api-reference,polygon-playground}.tsx`, edit `vite.config.ts`.

- Copy `index.html` (retitle), `main.tsx` (point at `ClipPathEditorPage`).
- `page.tsx`: `Layout` + `SectionHeader`s + the examples + `InstallCta args="add
  https://turtiesocks.github.io/ridiculous/r/clip-path-editor.json"`.
- Examples mirror filter-builder's; `polygon-playground.tsx` is the draggable-vertex
  showcase over an image.
- Add the MPA `input` entry `"clip-path-editor": path.resolve(__dirname,
  "pages/clip-path-editor/index.html")` to `vite.config.ts`.
- Run `pnpm nav:build` after Task 6 (nav reads registry.json).

**Verify:** `pnpm exec biome check` on the new files. **Commit.**

---

## Task 6 — Registry + coverage + nav regen

**Files:** `registry.json` (append item + extend `all`), `vitest.config.ts`
(`coverage.include`).

- Append the `clip-path-editor` item (type `registry:ui`; all four files; registry
  deps `ridiculous-type-kit, unit-input, button, popover, input, label, select`).
- Add `clip-path-editor.json` to `all`'s `registryDependencies`; update its
  description.
- Add `"src/components/ui/clip-path-editor/**"` to `coverage.include`.
- `pnpm nav:build` (regenerates `src/generated/nav.ts`).
- `pnpm registry:build` (regenerates `public/r/*.json` — GITIGNORED, do NOT commit).

**Verify + Commit** registry.json + vitest.config.ts + generated nav.

---

## Task 7 — Full `pnpm pr:check` green

Run in parallel where possible: `pnpm run typecheck`, `pnpm run check`,
`pnpm run test`. Fix any fallout (Biome formatting, coverage thresholds — add tests
if a branch is uncovered). If vitest errors on `@/generated/nav`, run `pnpm nav:build`
first. Final commit leaves the tree typecheck-clean.

---

## Commit cadence

1. types + type-tests
2. helpers + parse/format tests
3. component + jsdom tests + barrel
4. demo page + examples + MPA entry
5. registry + coverage + nav regen
6. any pr:check fixups
