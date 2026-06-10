# geojson-editor — Component Design Spec

**Date:** 2026-06-10
**Status:** Approved for implementation (brainstorming, participate mode — every section signed off)
**Ships:** TWO registry items — `coordinate-input` (atom) + `geojson-editor` (mono).
**Reuses:** `ridiculous-type-kit` (digit range machinery, char classes, combinators), shadcn bases (`button`, `input`, `popover`, `label`, `select`).
**New beyond the original 11-phase roadmap** — conforms to the same component contract (§2).

---

## 1. Overview

`geojson-editor` is the raw GeoJSON (RFC 7946) editing experience — no map required, but built so a map can mount alongside it later with zero coupling. It targets two audiences at once: noobs who find raw JSON overwhelming, and power users whom over-hand-holding slows down. It resolves that tension structurally rather than picking one UX: a **headless core** holds the value and all logic; **presentational view parts** render slices of it; **slim layout presets** (≈15–30 lines each) arrange those parts. The three layouts a brief would otherwise force a choice between — dual-pane, drill-down, toggle — are all thin wrappers over the same core.

The namesake "ridiculous" flex is the **strict tier**: it type-parses a GeoJSON **JSON string literal** and rejects malformed geometry to `never` at compile time — wrong `type` tag, Position arity, longitude/latitude out of range, an unclosed polygon ring, a ring with too few points. This is **geometry-deep** (§3.6): coordinates and geometry are char-parsed; arbitrary `properties` bags and very large FeatureCollections are typed structurally, with a depth cap and an escape hatch, so `tsserver` stays responsive.

Two value surfaces, deliberately distinct:

- **Component value** is a GeoJSON **object** (`value` / `onChange`) — the canonical, always-last-valid model. Natural in JS, and what a paired map consumes.
- **The strict authoring flex** validates a JSON **string** via the `geojson(...)` call-site helper and the runtime parser that powers the raw text pane.

```
geojson(...) call-site helper — strict tier (string literal):
  '{"type":"Point","coordinates":[-122.42,37.77]}'                          → the literal (validated S)
  '{"type":"Point","coordinates":[200,0]}'                                   → never (lon 200 > 180)
  '{"type":"Point","coordinates":[0]}'                                       → never (Position arity 1)
  '{"type":"Polygon","coordinates":[[[0,0],[1,0],[1,1],[0,0]]]}'             → the literal (ring closed, 4 pts)
  '{"type":"Polygon","coordinates":[[[0,0],[1,0],[1,1]]]}'                   → never (ring not closed / <4 pts)
  '{"type":"Wat","coordinates":[0,0]}'                                       → never (unknown geometry type)
  '{ not json '                                                              → never (JSON syntax)

casual tier (object):   geojson(myFeatureCollection)                        → structural accept (escape hatch)
intellisense tier:      { type: "Poin▏ }  → ▸ Point ▸ Polygon ▸ …           → literal type-tag + coords-shape narrowing
```

---

## 2. Contract conformance

| Repo component contract | This component | Divergence? |
|---|---|---|
| Per-component file layout (`.tsx` + `.types.ts` + `.helpers.ts` + `index.ts`, sub-parts in subdirs) | both items follow it; `geojson-editor` adds `use-geojson-editor.ts`, `context.ts`, `constants.ts`, `views/`, `presets/` | extended (mono editor) |
| 3-tier model (casual / IntelliSense / strict + call-site helper) | casual `GeoJSON`; IntelliSense discriminated union (literal `type` tags + Position tuples); strict `GeojsonLiteral<S>` string parse + `geojson` helper. Atom mirrors with `Position` / `CoordinateLiteral<S>` / `coordinate`. | on-contract |
| Strict validators | `GeojsonLiteral`, `GeometryLiteral`, `PositionLiteral`, `LinearRingLiteral`, `IsLongitude`, `IsLatitude` | on-contract |
| Call-site helpers | `geojson(...)`, `coordinate(...)` (mirror `color` / `easing` / `cssTransition`) | on-contract |
| Controlled-only | `<GeojsonEditor>` requires `value` + `onChange`. Headless `useGeojsonEditor` additionally supports `defaultValue` for standalone/uncontrolled use. | extended |
| Generic value↔onChange | `<GeojsonEditor<V extends GeoJSON = GeoJSON>>` / `useGeojsonEditor<V>` link `value: V` → `onChange(V)`. A narrowed `V` (e.g. `Feature<Polygon>`) disables the geometry-type switcher so the runtime value stays within `V`. | **deliberate** (§9.17) |
| Own types, no dep | `Geometry` / `Feature<G,P>` / `FeatureCollection<G,P>` / `GeoJSON<G,P>` defined in-package mirroring `@types/geojson` names + generics; `Position` tightened to a tuple. No external type dependency. | **deliberate** (§9.18) |
| Internal state types exported from `.types.ts` | `GeojsonEditorStore`, `GeojsonPath`, `GeojsonError`, `GeojsonErrorSeverity` | on-contract |
| Two top-level component exports (popover + inline panel) | `<GeojsonEditor variant>` (batteries) + `<GeojsonEditorProvider>` (composition). **No popover** — a full editor isn't a popover-sized control. | **deliberate** (§9.2) |
| Sub-components exported | `DrillDown`, `DualPane`, `Toggle`, `FeatureTree`, `GeometryFields`, `PropertiesGrid`, `RawJsonPane`, `ErrorRail`, `useGeojsonEditor`, `useGeojsonEditorContext` | on-contract |
| Reuse atoms | `coordinate-input` consumed by `GeometryFields` (mirrors `unit-input`→editors, `color-picker`→gradient) | on-contract |
| Testing (`-types.test-d.ts`, `-parse.test.ts`, `-format.test.ts`, `.test.tsx`) | both items, full split | on-contract |
| Coverage | add both dirs to `vitest.config.ts` `coverage.include`; thresholds unchanged | on-contract |
| Registry | two `registry:ui` items; `geojson-editor.registryDependencies` = `coordinate-input` + `ridiculous-type-kit` (+ shadcn bases); add both to the `all` bundle | on-contract |
| Demo / nav | MPA entry + `page.tsx` + examples per item + `pnpm nav:build`; `component-icons.ts` entries (`geojson-editor`→`Map`, `coordinate-input`→`MapPin`) | on-contract |

---

## 3. The type flex (the product)

The strict tier parses the GeoJSON **JSON string** in the type system. We reuse the kit's paren/bracket-aware combinators to tokenize JSON structure and the kit's digit range machinery (`IsNumberInClosedRange`, `IsSignedDecimal`, `IntRange`) to range-check coordinates. The boundary is **geometry-deep**: we char-parse `type` + `coordinates`; we do not char-parse `properties` values or recurse `FeatureCollection.features` past a cap.

### 3.1 `IsLongitude` / `IsLatitude` — signed capped ranges

The kit's `IsNumberInClosedRange` is non-negative. Longitude (−180..180) and latitude (−90..90) need a sign strip first, then a symmetric magnitude check:

```ts
// longitude: optional sign, then |value| ≤ 180 (decimals below 180 free; exactly 180 → .0… only)
export type IsLongitude<S extends string> = S extends `-${infer R}`
  ? IsMagnitude180<R>
  : IsMagnitude180<S>
// IsMagnitude180<S> = IsNumberInClosedRange<S, `${IntRange<0,181>}`, `${IntRange<0,180>}`, "180">
// IsLatitude analogous with 90 / IntRange<0,91> / IntRange<0,90> / "90".
```

Faithful extension of the existing `IsNumber0To360` / `IsNumber0To100` pattern — same engine, sign-aware wrapper. `IntRange<0,181>` is well within the kit's proven recursion budget (it already builds `IntRange<0,401>`).

### 3.2 `PositionLiteral<S>` — arity + ranges

A Position is a JSON array of 2 or 3 numbers: `[lon, lat]` or `[lon, lat, elevation]`. We split the bracketed, comma-separated numeric tokens (paren-aware split so nested structure is respected), require **2 or 3** elements, and check element 0 with `IsLongitude`, element 1 with `IsLatitude`, element 2 (if present) with `IsNumber` (elevation unbounded). Arity ≠ 2–3 → `never`.

### 3.3 `LinearRingLiteral<S>` — closure + min length

A linear ring (Polygon / MultiPolygon ring) is an array of ≥ 4 Positions where the **first equals the last** (closed). We fold the positions (each via `PositionLiteral`), count them (≥ 4 or `never`), and string-compare the first and last position tokens for equality. Unequal or < 4 → `never`.

### 3.4 `GeometryLiteral<S>` — type-tag → coordinates shape

Discriminate on the `"type"` value and require the matching `coordinates` nesting depth:

| `type` | `coordinates` shape | validator |
|---|---|---|
| `Point` | Position | `PositionLiteral` |
| `MultiPoint` / `LineString` | Position[] | array of `PositionLiteral` |
| `MultiLineString` / `Polygon` | Position[][] | `Polygon` rings via `LinearRingLiteral`; `MultiLineString` via `PositionLiteral` rows |
| `MultiPolygon` | Position[][][] | array of `LinearRingLiteral` arrays |
| `GeometryCollection` | `geometries: Geometry[]` | array of `GeometryLiteral` (recursion, depth-capped §3.6) |

Unknown `type` or a coordinates shape that doesn't match the tag → `never`.

### 3.5 `GeojsonLiteral<S>` — the top type

Dispatch on `type`: a geometry type → `GeometryLiteral`; `Feature` → validate `geometry` (a `GeometryLiteral` or `null`), accept any `properties` object structurally (§3.6), preserve foreign members; `FeatureCollection` → validate `features` as an array of `Feature` (depth-capped). Invalid JSON shape at any char-parsed position → `never`. The `geojson<S>(src: S & GeojsonLiteral<S>): S` call-site helper keeps `S` on success, `never` on failure (mirrors `cssTransition`).

### 3.6 The geometry-deep boundary (what strict does NOT char-parse)

- **`properties`** — arbitrary JSON by spec; char-parsing buys no safety. Typed structurally as `Json`. (Strict still requires it to be an object or `null`.)
- **`FeatureCollection.features`** recursion is **depth-capped at 32 features** (box-shadow/transition precedent). Past the cap, the tail is weak-validated (each entry is an object with a `type`); the runtime parser validates fully regardless of count.
- **`GeometryCollection.geometries`** nesting capped at depth 4 (collections of collections are vanishingly rare; deeper → weak-validated).
- **Numbers inside `properties`**, `bbox` array contents, and elevation magnitudes are not range-checked.
- **Whitespace / key order** in the source string is irrelevant to the type result (we trim and key-match, not byte-match) — except §3.3's first==last position comparison, which compares **canonicalized** position tokens (trimmed, whitespace-collapsed) so `[0, 0]` closes `[0,0]`.

All deferrals are documented in the `.types.ts` JSDoc and the api-reference example. Escape hatch: the casual tier (`geojson(obj: GeoJSON)`) accepts any structurally-valid object with no char-parse.

### 3.7 Optional numeric-literal coordinates (`coordinate()` tier)

The §3.1–3.5 flex validates JSON **text**. A complementary **opt-in** tier validates a numeric-literal tuple directly — stringify each number literal, reuse the same digit machinery:

```ts
type Latitude<N extends number> = `${N}` extends infer S extends string
  ? IsLatitude<S> extends true ? N : never
  : never
// coordinate([200, 0])          → never            (lon 200 > 180)
// coordinate([-122.42, 37.77])  → [-122.42, 37.77] (kept)
```

**Why this is an authoring helper, NOT the structural `Position`:** the bound only holds for *literal* number types. `` `${number}` `` widens to `string`, so `Latitude<number>` = `never`. The editor's runtime value is `number`s from React state — never literals — so a bounded `Position` would reject every real value. `Position` therefore stays the plain tuple (the value type), and the range-bounded form is the `coordinate(...)` call-site helper for inline literals, mirroring how `geojson("...")` is opt-in for string literals. (This is the answer to "can `Position` be tightened with Min/Max?": yes for hand-written literals, no as the value type.)

Caveats (JSDoc'd): **literals only** (`number`-typed values pass structurally — runtime validates); **exponential notation** — `` `${1e-7}` `` === `"1e-7"` breaks the digit parse, so magnitudes below ~1e-6 fall back to runtime (real coords like `-122.4194155` stringify normally); **per-literal `tsserver` cost**, bounded by the §3.6 depth caps.

---

## 4. Architecture — the headless core

### 4.1 `useGeojsonEditor` (`use-geojson-editor.ts`, no JSX)

The engine. Pure logic, layout-agnostic, usable standalone (a map can drive it without rendering any view part).

```ts
type Json = null | boolean | number | string | Json[] | { [k: string]: Json }
type GeojsonPath = ReadonlyArray<string | number>          // ["features", 2, "geometry"] — map-highlight seam
type GeojsonErrorSeverity = "error" | "warning"

interface GeojsonError {
  path: GeojsonPath                  // node address; [] for whole-document/syntax errors
  message: string                    // plain-language ("Polygon ring isn't closed — first and last point must match.")
  severity: GeojsonErrorSeverity
  code: string                       // stable id: "ring-not-closed", "lon-out-of-range", "json-syntax", …
  fix?: { label: string; apply(): void }   // optional one-click repair ("close ring", "reverse")
}

interface GeojsonEditorStore {
  value: GeoJSON                     // canonical, always last-valid
  rawText: string                    // raw-pane editing surface; may be transiently invalid
  selection: GeojsonPath | null
  errors: GeojsonError[]             // unified syntax + semantic, one validate pass
  isValid: boolean                   // no severity:"error" entries
  setValue(next: GeoJSON): void
  setRawText(next: string): void     // raw onChange → debounced parse → commit-if-valid (§4.3)
  select(path: GeojsonPath | null): void
  updateGeometry(path: GeojsonPath, geometry: Geometry): void
  addFeature(feature?: Feature): void
  removeFeature(index: number): void
  setProperty(featurePath: GeojsonPath, key: string, value: Json): void
  undo(): void; redo(): void
  canUndo: boolean; canRedo: boolean
}

function useGeojsonEditor<V extends GeoJSON = GeoJSON>(options: {
  value?: V; defaultValue?: V; onChange?(v: V): void          // V links in↔out
  selection?: GeojsonPath; onSelectionChange?(p: GeojsonPath | null): void
  tier?: "casual" | "strict"         // runtime parse strictness (default "strict")
}): GeojsonEditorStore                // store.value stays broad GeoJSON internally; V is the boundary
```

### 4.2 `context.ts` (no JSX) + `<GeojsonEditorProvider>`

`context.ts` exports `GeojsonEditorContext` (a `createContext`) and `useGeojsonEditorContext()`. The Provider component lives in `geojson-editor.tsx` (JSX) and calls `useGeojsonEditor`, putting the store on context. View parts and a future `<MapView>` read it via `useGeojsonEditorContext()` — no prop-drilling. The hook/context split keeps `react-refresh/only-export-components` quiet (repo convention).

### 4.3 Sync model — structured canonical + resilient raw buffer

- **`value` (the model) is canonical.** It is always valid; it drives `FeatureTree`, `GeometryFields`, and any paired map.
- **`rawText` is the raw pane's own buffer** while focused. It is free to be transiently invalid.
- **raw → model:** on edit, debounce, then parse. On valid parse, commit to `value` (+ `onChange`). On invalid, **keep the user's exact text**, populate `errors`, leave `value` at last-valid. No snap-back, no lost keystrokes.
- **model → raw:** a structural edit (tree/geometry/property) reformats and projects into `rawText` — but only when the raw pane is **not** the active edit origin, so it never fights the user's cursor. An `editOrigin` ref (`"raw" | "structured"`) gates projection.
- This holds for all three presets and guarantees a paired map always renders the last-valid `value`.

### 4.4 Undo / redo

A bounded value-history stack in the core (cap ~100). Structural edits and committed raw parses push; `undo`/`redo` move the pointer and re-project `rawText`. Cheap, high-value, and uniform across presets.

---

## 5. Runtime helpers (`geojson-editor.helpers.ts`)

The tolerant superset of the strict tier — single source of truth the UI drives off.

- `parseGeojson(src: string, tier?): { value: GeoJSON; errors: GeojsonError[] } | { value: null; errors: GeojsonError[] }` — `JSON.parse` first (syntax errors → one `json-syntax` error with line/col), then `validateGeojson`.
- `validateGeojson(value: unknown): GeojsonError[]` — full RFC 7946 walk producing **errors** (block validity) and **warnings** (advisory). Path-addressed.
  - **errors:** missing/unknown `type`; Position arity ≠ 2–3; `IsLongitude`/`IsLatitude` runtime mirrors out of range; `coordinates` shape ≠ type; ring not closed; ring < 4 positions; `Feature.geometry` not a geometry-or-null; `FeatureCollection.features` not an array.
  - **warnings:** clockwise outer ring winding (RFC 7946 §3.1.6 right-hand rule, a SHOULD); duplicate consecutive vertices; deprecated `crs` member present; `bbox` inconsistent with computed extent.
- `formatGeojson(value: GeoJSON, opts?: { indent?: number }): string` — canonical re-serialization, **foreign-member preserving** (unknown keys on Feature/geometry round-trip verbatim; §9.7). Default 2-space indent.
- `getAtPath(value, path)` / `setAtPath(value, path, next)` — immutable JSON-path get/set powering selection + structural edits.
- `closeRing(ring)` / `reverseRing(ring)` — the `fix` implementations for `ring-not-closed` / winding warnings.
- `blankFeature()` / `blankGeometry(type)` — seeds for `addFeature` / geometry-type switch (Point at `[0, 0]`, etc.).
- `coordinatesShapeFor(type)` — geometry-type → nesting metadata (drives `GeometryFields` + validation), in `geojson-editor.constants.ts`.

`Geometry`, `Feature<G, P>`, `FeatureCollection<G, P>`, `GeoJSON<G, P>`, `Position` types are **defined in-package** (no `@types/geojson` dependency), mirroring the official names + generic parameters for structural interop but tightening `Position` to a tuple `[number, number] | [number, number, number]`. This is the IntelliSense tier — discriminated union, literal `type` tags. (Interop caveat: our tuple `Position` is assignable to the official `number[]`; the reverse — an external `number[]`-typed value into our editor — uses the casual tier or a cast.)

---

## 6. Components

### 6.1 `coordinate-input` (atom)

```
src/components/ui/coordinate-input/
  coordinate-input.tsx · coordinate-input.types.ts · coordinate-input.helpers.ts · index.ts
```

- **`<CoordinateInput value onChange axes? className? aria-label? />`** — value is a `Position` tuple. Renders `lon` + `lat` (+ `alt` when `axes="3d"`) numeric fields with **pointer-locked drag-scrub** (mirrors `unit-input`: Shift = ×10, Alt = ×0.1), range-clamped (lon ±180, lat ±90), and per-field validation surfacing out-of-range inline.
- **Types:** casual `Position`; IntelliSense `Position` tuple; strict `CoordinateLiteral<P>` — a numeric-literal tuple validated by stringify + digit range-check (§3.7) — via the `coordinate([lon, lat])` call-site helper reusing `IsLongitude`/`IsLatitude`.
- **Helpers:** `parseCoordinate(src): Position | null`, `formatCoordinate(pos): string`, `clampLon`/`clampLat`.

### 6.2 `geojson-editor` view parts (`views/`, presentational, read context)

- **`<FeatureTree>`** — expandable outline of the FeatureCollection → features → geometry/properties. Selection highlight, inline error dot on offending nodes, add/remove feature, keyboard nav (↑↓ move, → expand, ← collapse, Enter select).
- **`<GeometryFields>`** — edits the selected geometry: a type `<select>` (switching reshapes coordinates via `blankGeometry`), coordinate rows built from `<CoordinateInput>`, ring/part grouping for Polygon/Multi*, drag-reorder vertices, add/remove point, add/remove ring.
- **`<PropertiesGrid>`** — key/value editor for the selected Feature's `properties` (arbitrary `Json`: string/number/boolean/null + nested via raw chip).
- **`<RawJsonPane>`** — lightweight textarea-based JSON editor (NO monaco): line numbers, error-line gutter, bracket-match, `setRawText` on input. Owns its buffer per §4.3.
- **`<ErrorRail>`** — unified `errors` list: severity icon, plain-language message, JSON path, jump-to-node (calls `select`), and `fix` button when present.

### 6.3 Presets (`presets/`, slim wrappers)

- **`<DrillDown>`** (≈30 lines) — single column: `FeatureTree` with the selected node expanding inline into `GeometryFields` + `PropertiesGrid`, `ErrorRail` docked at the bottom, a `⌘K`-summonable `RawJsonPane` overlay. Map-friendly default.
- **`<DualPane>`** (≈20 lines) — `FeatureTree`+`GeometryFields` left, `RawJsonPane` right, `ErrorRail` spanning the bottom. Both representations live, synced.
- **`<Toggle>`** (≈15 lines) — a segmented control flips the body between a Guided view (`FeatureTree`+`GeometryFields`) and `RawJsonPane`; `ErrorRail` persists.

### 6.4 Top-level exports (`geojson-editor.tsx`)

- **`<GeojsonEditor<V extends GeoJSON = GeoJSON> value onChange variant? selection? onSelectionChange? tier? className? aria-label? />`** — batteries-included; `value: V` → `onChange(value: V)`; `variant` ∈ `"drill-down" | "dual-pane" | "toggle"` (default `"drill-down"`). Wraps `<GeojsonEditorProvider>` + the chosen preset. When `V` is narrower than the full geometry palette (e.g. `Feature<Polygon>`), `GeometryFields`' geometry-type `<select>` is disabled — edits stay within `V`, keeping `onChange(V)` sound; a broad `V` enables the full palette. The context store is created once at broad `GeoJSON`; the `V` narrowing lives only at this props boundary.
- **`<GeojsonEditorProvider>`** — for hand-composition; exposes the store to children + a future `<MapView>`.
- Plus the view parts, presets, `useGeojsonEditor`, `useGeojsonEditorContext` re-exported from `index.ts`. `"use client"` at the top of component files.

### 6.5 Map-ready seam (contract, zero map deps)

- Controlled `value`/`onChange` = canonical GeoJSON; `selection`/`onSelectionChange` via `GeojsonPath` (map highlights it, map-click sets it).
- A `<MapView>` mounts inside `<GeojsonEditorProvider>` and calls `useGeojsonEditorContext()` — same store, no prop-drill, no map library in this package.
- Per §4.3, `value` is always last-valid → a map never sees a broken state.

---

## 7. Demo, registry, nav

- **MPA entries:** `pages/coordinate-input/{index.html,main.tsx}` + `pages/geojson-editor/{index.html,main.tsx}` (copy an existing pair; titles "Coordinate Input — ridiculous" / "GeoJSON Editor — ridiculous").
- **Pages:** `src/pages/{coordinate-input,geojson-editor}/page.tsx` (Layout + SectionHeaders + examples + `InstallCta`).
- **Examples** per item (`src/examples/<name>/`): `basic-usage`, `tier-casual`, `tier-intellisense`, `tier-strict` (`@ts-expect-error` on the rejects), `api-reference`, `live-preview`. The `geojson-editor` live-preview shows all three presets editing one shared value, with a paste-to-import demo; a commented seam where a `<MapView>` would mount.
- **`vite.config.ts`:** add both MPA inputs (append-only).
- **`registry.json`:** add `coordinate-input` (`registry:ui`; deps `ridiculous-type-kit`, `input`, `label`) and `geojson-editor` (`registry:ui`; deps `coordinate-input`, `ridiculous-type-kit`, `button`, `input`, `label`, `select`, `popover`). Add both `.json` URLs to the `all` bundle and refresh its description. `pnpm registry:build` regenerates `public/r/*.json` (gitignored — do not commit).
- **`component-icons.ts`:** `"geojson-editor": Map`, `"coordinate-input": MapPin` (verify both free — they are).
- **`pnpm nav:build`** picks up the pages from registry.json.

---

## 8. Testing

- **`tests/coordinate-input-types.test-d.ts`** — `CoordinateLiteral` accept (`"0,0"`, `"-122.42, 37.77"`, 3-axis) / reject (`"200,0"`, `"0,91"`, arity 1/4, non-numeric); `coordinate(...)` `@ts-expect-error` rejects; `Position` tuple shape.
- **`tests/coordinate-input.test.tsx`** — jsdom: renders lon/lat (+alt), edit emits tuple, drag-scrub via pointer events, range clamp, out-of-range inline error.
- **`tests/geojson-editor-types.test-d.ts`** — `GeojsonLiteral` / `GeometryLiteral` / `PositionLiteral` / `LinearRingLiteral`: accept every geometry type + Feature + FeatureCollection; reject lon 200, lat 91, arity 1/4, unknown type, coords-shape≠type, unclosed ring, <4-pt ring, bad JSON; `IsLongitude`/`IsLatitude` boundaries (±180/±90, 180.0 ok, 180.1 never); depth-cap weak-validation past 32 features; casual accepts any object; IntelliSense `type`-tag narrows the coordinates shape; `geojson(...)` `@ts-expect-error` rejects.
- **`tests/geojson-editor-parse.test.ts`** — `parseGeojson` syntax error (line/col), `validateGeojson` error + warning catalogue (closure, winding, arity, range, shape, `crs`, bbox, dup vertices), path correctness, `tier:"casual"` leniency.
- **`tests/geojson-editor-format.test.ts`** — `formatGeojson` canonical output, **round-trip** parse∘format, **foreign-member preservation** (unknown keys survive), `getAtPath`/`setAtPath` immutability, `closeRing`/`reverseRing`.
- **`tests/geojson-editor.test.tsx`** — jsdom: each preset renders; tree select → `GeometryFields` shows the geometry; editing a coordinate emits updated `value`; add/remove feature/point/ring; geometry-type switch reshapes; `RawJsonPane` invalid input keeps text + shows error + leaves `value` last-valid (the §4.3 guarantee); `ErrorRail` jump selects the node; `fix` button repairs; undo/redo; `selection`/`onSelectionChange` round-trip (the map seam).
- **`vitest.config.ts`:** add `src/components/ui/coordinate-input/**` and `src/components/ui/geojson-editor/**` to `coverage.include`. Thresholds unchanged.

---

## 9. Assumptions (every call made on the user's behalf)

1. **Two registry items:** `geojson-editor` (mono, internal `views/` + `presets/` subdirs) + `coordinate-input` (reusable atom). Chosen in brainstorming over fully-mono and max-decomposition.
2. **No popover export.** The repo's "popover trigger + inline panel" two-export convention is dropped — a full GeoJSON editor is not a popover-sized control. Top-level exports are `<GeojsonEditor variant>` + `<GeojsonEditorProvider>`. Deliberate, documented divergence.
3. **Component value is a GeoJSON object**, not a string (the other editors edit CSS strings). The strict string-parse flex lives in the `geojson(...)` call-site helper and the raw-pane runtime parser. Two surfaces, §1.
4. **Strict is geometry-deep** (§3.6): char-parse `type`+`coordinates`; structural-type `properties`; cap `features` recursion at 32 and `GeometryCollection` nesting at 4; no range-check on property/bbox/elevation numbers. Keeps `tsserver` responsive while delivering the flex where it's meaningful.
5. **lon/lat range-checking** reuses the kit's `IsNumberInClosedRange` engine via sign-aware `IsLongitude`/`IsLatitude` wrappers (±180 / ±90; the cap literal accepts only an all-zero fraction). Faithful extension of `IsNumber0To360` et al.
6. **Sync = structured canonical + resilient raw buffer** (§4.3): model always valid; raw buffer keeps invalid text + errors, never snaps back; `editOrigin` ref gates model→raw projection so the cursor is never fought.
7. **Foreign members are preserved** through parse→edit→format (RFC 7946 allows extra members; round-trip fidelity is required). Verified by a format test.
8. **Undo/redo included** — bounded value-history stack (cap ~100) in the core.
9. **Validation severity:** RFC "MUST" violations are `error` (block `isValid`); RFC "SHOULD" / advisories (right-hand-rule winding, duplicate vertices, deprecated `crs`, bbox mismatch) are `warning` (stay valid). Errors carry plain-language messages + JSON path + optional one-click `fix`.
10. **WGS84 only.** No CRS/projection math; a `crs` member emits a warning, isn't transformed (matches RFC 7946, which removed `crs`).
11. **Controlled `<GeojsonEditor>`** (`value`+`onChange` required), but `useGeojsonEditor` also supports `defaultValue` for standalone/uncontrolled use (idiomatic for a headless hook; a map host may want it).
12. **Default `variant` = `"drill-down"`** (single-column, map-friendly, progressive disclosure for noobs).
13. **`RawJsonPane` is textarea-based** (line numbers + error gutter + bracket-match), explicitly NOT monaco/codemirror — the brief's whole premise is avoiding overkill editors. No new heavy dependency.
14. **Map integration is a seam, not a feature** (§6.5): shared context + `GeojsonPath` selection + always-last-valid `value`. No map library enters this package in v1.
15. **OUT of v1** (seams left, no deps): map rendering, drawing tools, large-file virtualization, upload/download chrome, TopoJSON/WKT/KML import. **IN:** all 7 geometry types incl. GeometryCollection + Multi*, optional bbox display/edit, paste-to-import, copy-out.
16. **`coordinate-input` strict tier validates a numeric-literal tuple** via `coordinate([lon, lat])` (stringify + digit range-check, §3.7); its runtime value is a numeric `Position` tuple. Authoring-time literal validation, runtime tuple value.
17. **Generic, narrowing-locked component.** `<GeojsonEditor<V extends GeoJSON = GeoJSON>>` / `useGeojsonEditor<V>` link `value: V` → `onChange(V)`. A narrowed `V` disables the geometry-type switcher so the runtime value provably stays within `V`; a broad `V` enables the full palette. React context is created once, so the shared store types at broad `GeoJSON`; the `V` narrowing is confined to the props boundary, and a `<MapView>` reading context narrows itself.
18. **Range-bounded coordinates are opt-in, not baked into `Position`** (§3.7) — the structural `Position` must accept runtime `number`s, which a bounded type rejects; the bound lives in the `coordinate(...)` literal helper, as `geojson("...")` is the opt-in string flex. **`@types/geojson` is not a dependency** — types are defined in-package, mirroring its names + generics (`Feature<G,P>` etc.) for structural interop.

---

## 10. Risks

- **`tsserver` budget from type-parsing JSON strings.** Bracket-aware recursion + per-position digit range-checks across nested coordinate arrays is the heaviest type work in the repo. Mitigations: the geometry-deep boundary (no `properties` parse), depth caps (32 features / depth-4 collections), cheap-checks-first classification, and reusing the kit's already-tuned `IntRange`/`IsNumberInClosedRange`. **Measure `tsc` wall-time after the type tests land; if it spikes, lower the feature cap and document.** The runtime parser is the tolerant source of truth regardless, so the UI is never blocked on type performance.
- **Sync edge cases** (the classic dual-representation trap): cursor jumps, snap-backs, lost keystrokes. The `editOrigin` gate + "keep invalid text" rule (§4.3) are pinned by an explicit `.test.tsx` case asserting invalid raw input preserves the buffer and leaves `value` last-valid.
- **Winding-rule correctness** (right-hand rule, RFC 7946 §3.1.6): a warning, not an error (many real-world files violate it), with a `reverse` fix. Signed-area computation tested against known CW/CCW rings.
- **Large documents** in v1 render the tree without virtualization. Stable keys (feature index / path) leave the windowing seam; flagged as the first follow-up if profiling shows jank past a few hundred features. Logged, not silently capped.
- **Foreign-member preservation vs canonical formatting** can conflict (where do unknown keys sit in the emit?). Resolution: unknown keys are appended after the known keys at their level, order-stable; tested.
- **Numeric-literal coordinate bound is literal-only + notation-sensitive** (§3.7): it validates hand-written literals, never `number`-typed values, and exponential stringification (`1e-7`) escapes the digit parse. Mitigation: it's an opt-in authoring helper, never the value type or the structural `Position`; the runtime validator is the source of truth for all real (non-literal) values.
