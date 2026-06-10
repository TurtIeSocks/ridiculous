# geojson-editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `geojson-editor` shadcn registry item — the raw GeoJSON (RFC 7946) editing experience with a headless core, presentational view parts, and three slim layout presets (drill-down / dual-pane / toggle), generic over the value type and map-ready via shared context.

**Architecture:** Mono registry item under `src/components/ui/geojson-editor/`. A headless core (`useGeojsonEditor`) owns the canonical GeoJSON model, a resilient raw-text buffer, selection, validation, and undo; it is exposed via React context so view parts and a future `<MapView>` read it without prop-drilling. View parts (`RawJsonPane`, `FeatureTree`, `GeometryFields`, `PropertiesGrid`, `ErrorRail`) are presentational. Presets arrange the parts around one provider. Types are defined in-package (no `@types/geojson` dep), mirroring its names + generics with a tuple `Position`; the strict tier type-parses **compact canonical** GeoJSON strings, geometry-deep, reusing `coordinate-input`'s `IsLongitude`/`IsLatitude` and the `ridiculous-type-kit` digit machinery.

**Tech Stack:** React 19, TypeScript, shadcn/ui (`Button`, `Input`, `Label`, `Select`, `Popover`), Tailwind v4, vitest + jsdom + @testing-library/react, biome.

**Spec:** `docs/superpowers/specs/2026-06-10-geojson-editor-design.md`

**Prerequisite:** the `coordinate-input` plan (`2026-06-10-coordinate-input.md`) is fully implemented and committed.

---

## Strict-tier scope note (refines spec §3.6)

Char-parsing a JSON string whose `properties` are arbitrary is intractable in the type system (a property value can contain any character). So the strict **string** tier (`geojson("...")`) is precisely:

- **Geometry strings** (`Point`/`Multi*`/`LineString`/`Polygon`/`GeometryCollection`): fully char-parsed — type tag, Position arity, lon/lat range, ring closure, min lengths. Requires **compact canonical** form (`{"type":"…","coordinates":…}`, no insignificant whitespace, as emitted by `JSON.stringify`).
- **Single `Feature`** in canonical key order (`type`,`geometry`,`properties`): its `geometry` is char-parsed; `properties` are accepted structurally.
- **`FeatureCollection`**: a shallow `"type":"FeatureCollection"` tag check; deep validation is the runtime validator's job (the always-available source of truth).

The IntelliSense tier (structural object types) and the runtime validator cover everything else. This is the honest geometry-deep boundary; the type tests below assert exactly this contract.

---

## File map

**Create (`src/components/ui/geojson-editor/`):**
- `index.ts` — barrel
- `geojson-editor.tsx` — `<GeojsonEditor<V>>` + `<GeojsonEditorProvider>` (component exports)
- `geojson-editor.types.ts` — structural union + strict string validators + `geojson()`
- `geojson-editor.helpers.ts` — parse / validate / format / path / fixes / blanks
- `geojson-editor.constants.ts` — geometry metadata
- `context.ts` — context + `useGeojsonEditorContext` (no JSX)
- `use-geojson-editor.ts` — headless core hook (no JSX)
- `views/{raw-json-pane,feature-tree,geometry-fields,properties-grid,error-rail}.tsx`
- `presets/{drill-down,dual-pane,toggle}.tsx`

**Create (tests):**
- `tests/geojson-editor-types.test-d.ts`
- `tests/geojson-editor-parse.test.ts`
- `tests/geojson-editor-format.test.ts`
- `tests/geojson-editor.test.tsx`

**Create (demo):**
- `src/examples/geojson-editor/{basic-usage,tier-casual,tier-intellisense,tier-strict,api-reference,live-preview}.tsx`
- `src/pages/geojson-editor/page.tsx`
- `pages/geojson-editor/{index.html,main.tsx}`

**Modify:** `registry.json`, `src/components/layout/component-icons.ts`, `vitest.config.ts`, `vite.config.ts`, `README.md`.

**MVP deferrals (seams left, noted at point of use):** drag-reorder vertices; nested/array property values (PropertiesGrid does string/number/boolean/null); large-feature virtualization; `⌘K` command palette (RawJsonPane is summoned by a button instead). These match the spec's "OUT v1 / seam left" list and are flagged inline.

---

## Phase 1 — Foundation

### Task 1: Install primitives + scaffold

**Files:** all `src/components/ui/geojson-editor/*` as placeholders.

- [ ] **Step 1: Ensure shadcn primitives exist**

Run:
```bash
ls src/components/ui/button.tsx src/components/ui/input.tsx src/components/ui/label.tsx src/components/ui/select.tsx src/components/ui/popover.tsx
```
Expected: all exist from prior components. For any missing, run `pnpm dlx shadcn@latest add <name>` and move into `src/components/ui/` if needed.

- [ ] **Step 2: Create placeholder modules**

Create each of these with the single line `export {}`:
`src/components/ui/geojson-editor/geojson-editor.types.ts`, `geojson-editor.helpers.ts`, `geojson-editor.constants.ts`, `context.ts`, `use-geojson-editor.ts`, `index.ts`.

Create each of these with `export {}`:
`geojson-editor.tsx`, `views/raw-json-pane.tsx`, `views/feature-tree.tsx`, `views/geometry-fields.tsx`, `views/properties-grid.tsx`, `views/error-rail.tsx`, `presets/drill-down.tsx`, `presets/dual-pane.tsx`, `presets/toggle.tsx`.

- [ ] **Step 3: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/geojson-editor/
git commit -m "Scaffold geojson-editor module placeholders"
```

---

## Phase 2 — Types

### Task 2: IntelliSense structural types

**Files:** Modify `geojson-editor.types.ts`, `index.ts`. Test `tests/geojson-editor-types.test-d.ts`.

- [ ] **Step 1: Write failing structural type tests**

Create `tests/geojson-editor-types.test-d.ts`:
```ts
import { expectTypeOf, test } from "vitest"
import type {
  Feature,
  FeatureCollection,
  GeoJSON,
  Geometry,
  GeojsonError,
  GeojsonPath,
  Point,
  Polygon,
  Position,
} from "@/components/ui/geojson-editor"

test("Position is a 2- or 3-number tuple", () => {
  expectTypeOf<[1, 2]>().toMatchTypeOf<Position>()
  expectTypeOf<[1, 2, 3]>().toMatchTypeOf<Position>()
})

test("Geometry is the 7-arm discriminated union", () => {
  expectTypeOf<Point>().toMatchTypeOf<Geometry>()
  expectTypeOf<Polygon>().toMatchTypeOf<Geometry>()
  const p: Point = { type: "Point", coordinates: [0, 0] }
  expectTypeOf(p.type).toEqualTypeOf<"Point">()
})

test("Feature is generic over geometry + properties", () => {
  const f: Feature<Polygon, { name: string }> = {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
    properties: { name: "x" },
  }
  expectTypeOf(f.geometry).toEqualTypeOf<Polygon>()
  expectTypeOf(f.properties.name).toEqualTypeOf<string>()
})

test("GeoJSON unions geometry, Feature, and FeatureCollection", () => {
  expectTypeOf<Polygon>().toMatchTypeOf<GeoJSON>()
  expectTypeOf<Feature>().toMatchTypeOf<GeoJSON>()
  expectTypeOf<FeatureCollection>().toMatchTypeOf<GeoJSON>()
})

test("GeojsonPath + GeojsonError shapes", () => {
  expectTypeOf<["features", 2, "geometry"]>().toMatchTypeOf<GeojsonPath>()
  expectTypeOf<GeojsonError["severity"]>().toEqualTypeOf<"error" | "warning">()
})
```

- [ ] **Step 2: Run typecheck to verify failure**

Run: `pnpm typecheck`
Expected: FAIL — members not exported.

- [ ] **Step 3: Implement structural types**

Replace `geojson-editor.types.ts`:
```ts
// =====================================================================
// geojson-editor.types.ts — in-package GeoJSON types (no @types/geojson).
// Mirrors official names + generics; tightens Position to a tuple.
// IntelliSense tier here; strict string validators added in Task 3.
// =====================================================================

export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json }

export type Position = [number, number] | [number, number, number]

export interface Point {
  type: "Point"
  coordinates: Position
  bbox?: number[]
}
export interface MultiPoint {
  type: "MultiPoint"
  coordinates: Position[]
  bbox?: number[]
}
export interface LineString {
  type: "LineString"
  coordinates: Position[]
  bbox?: number[]
}
export interface MultiLineString {
  type: "MultiLineString"
  coordinates: Position[][]
  bbox?: number[]
}
export interface Polygon {
  type: "Polygon"
  coordinates: Position[][]
  bbox?: number[]
}
export interface MultiPolygon {
  type: "MultiPolygon"
  coordinates: Position[][][]
  bbox?: number[]
}
export interface GeometryCollection {
  type: "GeometryCollection"
  geometries: Geometry[]
  bbox?: number[]
}

export type Geometry =
  | Point
  | MultiPoint
  | LineString
  | MultiLineString
  | Polygon
  | MultiPolygon
  | GeometryCollection

export type GeoJsonProperties = { [name: string]: Json } | null

export interface Feature<
  G extends Geometry | null = Geometry | null,
  P extends GeoJsonProperties = GeoJsonProperties,
> {
  type: "Feature"
  geometry: G
  properties: P
  id?: string | number
  bbox?: number[]
}

export interface FeatureCollection<
  G extends Geometry | null = Geometry | null,
  P extends GeoJsonProperties = GeoJsonProperties,
> {
  type: "FeatureCollection"
  features: Feature<G, P>[]
  bbox?: number[]
}

export type GeoJSON<
  G extends Geometry | null = Geometry | null,
  P extends GeoJsonProperties = GeoJsonProperties,
> = (G extends null ? never : G) | Feature<G, P> | FeatureCollection<G, P>

// --- editor state types ----------------------------------------------

export type GeojsonPath = ReadonlyArray<string | number>
export type GeojsonErrorSeverity = "error" | "warning"

export interface GeojsonError {
  path: GeojsonPath
  message: string
  severity: GeojsonErrorSeverity
  code: string
}
```

Replace `index.ts`:
```ts
export type {
  Feature,
  FeatureCollection,
  GeoJSON,
  GeoJsonProperties,
  Geometry,
  GeometryCollection,
  GeojsonError,
  GeojsonErrorSeverity,
  GeojsonPath,
  Json,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  Position,
} from "./geojson-editor.types"
```

- [ ] **Step 4: Run typecheck + type tests**

Run: `pnpm typecheck && pnpm test tests/geojson-editor-types.test-d.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/geojson-editor/geojson-editor.types.ts \
  src/components/ui/geojson-editor/index.ts \
  tests/geojson-editor-types.test-d.ts
git commit -m "$(cat <<'EOF'
Add geojson-editor structural types (IntelliSense tier)

In-package GeoJSON types mirroring @types/geojson names + generics
(Feature<G,P>, FeatureCollection<G,P>, GeoJSON<G,P>) with a tuple
Position. No external type dependency. Plus GeojsonPath / GeojsonError
editor-state types.
EOF
)"
```

---

### Task 3: Strict string validators + `geojson()`

**Files:** Modify `geojson-editor.types.ts`, `index.ts`, `tests/geojson-editor-types.test-d.ts`.

- [ ] **Step 1: Append failing strict type tests**

Append to `tests/geojson-editor-types.test-d.ts`:
```ts
import { geojson } from "@/components/ui/geojson-editor"
import type { GeometryLiteral, PositionLiteral } from "@/components/ui/geojson-editor"

test("PositionLiteral checks arity + lon/lat range", () => {
  expectTypeOf<PositionLiteral<"[-122.42,37.77]">>().toEqualTypeOf<"[-122.42,37.77]">()
  expectTypeOf<PositionLiteral<"[1,2,3]">>().toEqualTypeOf<"[1,2,3]">()
  expectTypeOf<PositionLiteral<"[200,0]">>().toBeNever()
  expectTypeOf<PositionLiteral<"[0,91]">>().toBeNever()
  expectTypeOf<PositionLiteral<"[0]">>().toBeNever()
})

test("GeometryLiteral validates type tag → coordinates shape", () => {
  expectTypeOf<GeometryLiteral<'{"type":"Point","coordinates":[1,2]}'>>().toEqualTypeOf<'{"type":"Point","coordinates":[1,2]}'>()
  expectTypeOf<GeometryLiteral<'{"type":"Polygon","coordinates":[[[0,0],[1,0],[1,1],[0,0]]]}'>>().not.toBeNever()
  // unclosed ring
  expectTypeOf<GeometryLiteral<'{"type":"Polygon","coordinates":[[[0,0],[1,0],[1,1]]]}'>>().toBeNever()
  // unknown type
  expectTypeOf<GeometryLiteral<'{"type":"Wat","coordinates":[0,0]}'>>().toBeNever()
})

test("geojson() accepts valid, rejects invalid (compact canonical)", () => {
  geojson('{"type":"Point","coordinates":[-122.42,37.77]}')
  // @ts-expect-error — longitude 200 > 180
  geojson('{"type":"Point","coordinates":[200,0]}')
  // @ts-expect-error — unclosed polygon ring
  geojson('{"type":"Polygon","coordinates":[[[0,0],[1,0],[1,1]]]}')
})

test("geojson() accepts an object (casual escape hatch)", () => {
  geojson({ type: "Point", coordinates: [0, 0] })
})
```

- [ ] **Step 2: Run typecheck to verify failure**

Run: `pnpm typecheck`
Expected: FAIL — `PositionLiteral`/`GeometryLiteral`/`geojson` not exported.

- [ ] **Step 3: Append the strict validators**

Append to `geojson-editor.types.ts`:
```ts
// =====================================================================
// STRICT STRING TIER — type-parse compact canonical GeoJSON. Geometry-deep
// (see plan "Strict-tier scope note"). Reuses coordinate-input lon/lat +
// kit digit machinery.
// =====================================================================

import type { And, IsNumber, KeepIf, Trim } from "@/lib/ridiculous-type-kit"
import type { IsLatitude, IsLongitude } from "@/components/ui/coordinate-input"

type And3<A extends boolean, B extends boolean, C extends boolean> = And<
  A,
  And<B, C>
>
type IsNever<T> = [T] extends [never] ? true : false

// Bracket-aware top-level comma split of an array's inner content.
type SplitTop<
  S extends string,
  Depth extends unknown[] = [],
  Cur extends string = "",
  Acc extends string[] = [],
> = S extends `${infer C}${infer Rest}`
  ? C extends "["
    ? SplitTop<Rest, [...Depth, 0], `${Cur}[`, Acc>
    : C extends "]"
      ? SplitTop<
          Rest,
          Depth extends [unknown, ...infer D] ? D : [],
          `${Cur}]`,
          Acc
        >
      : C extends ","
        ? Depth["length"] extends 0
          ? SplitTop<Rest, Depth, "", [...Acc, Cur]>
          : SplitTop<Rest, Depth, `${Cur},`, Acc>
        : SplitTop<Rest, Depth, `${Cur}${C}`, Acc>
  : [...Acc, Cur]

// "[lon,lat]" | "[lon,lat,alt]"
export type PositionLiteral<S extends string> = IsPositionStr<S> extends true
  ? S
  : never
type IsPositionStr<S extends string> = S extends `[${infer Inner}]`
  ? SplitTop<Inner> extends infer P extends string[]
    ? P extends [infer Lon extends string, infer Lat extends string]
      ? And<IsLongitude<Lon>, IsLatitude<Lat>>
      : P extends [
            infer Lon extends string,
            infer Lat extends string,
            infer Alt extends string,
          ]
        ? And3<IsLongitude<Lon>, IsLatitude<Lat>, IsNumber<Alt>>
        : false
    : false
  : false

type AllPositions<P extends string[]> = P extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? IsPositionStr<H> extends true
    ? AllPositions<T>
    : false
  : true

type HasMin2<P extends unknown[]> = P extends [unknown, unknown, ...unknown[]]
  ? true
  : false
type HasMin4<P extends unknown[]> = P extends [
  unknown,
  unknown,
  unknown,
  unknown,
  ...unknown[],
]
  ? true
  : false
type HasMin1<P extends unknown[]> = P extends [unknown, ...unknown[]]
  ? true
  : false

// array of positions; MinKind picks the cardinality rule
type PositionArray<S extends string, Min extends "any" | "2"> =
  S extends `[${infer Inner}]`
    ? SplitTop<Inner> extends infer P extends string[]
      ? Min extends "2"
        ? And<HasMin2<P>, AllPositions<P>>
        : AllPositions<P>
      : false
    : false

type FirstEqualsLast<P extends string[]> = P extends [
  infer F extends string,
  ...infer M extends string[],
]
  ? M extends [...string[], infer L extends string]
    ? F extends L
      ? L extends F
        ? true
        : false
      : false
    : false
  : false

type IsLinearRing<S extends string> = S extends `[${infer Inner}]`
  ? SplitTop<Inner> extends infer P extends string[]
    ? And3<HasMin4<P>, AllPositions<P>, FirstEqualsLast<P>>
    : false
  : false

type AllRings<P extends string[]> = P extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? IsLinearRing<H> extends true
    ? AllRings<T>
    : false
  : true
type IsPolygon<S extends string> = S extends `[${infer Inner}]`
  ? SplitTop<Inner> extends infer P extends string[]
    ? And<HasMin1<P>, AllRings<P>>
    : false
  : false

type AllLines<P extends string[]> = P extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? PositionArray<H, "2"> extends true
    ? AllLines<T>
    : false
  : true
type IsMultiLine<S extends string> = S extends `[${infer Inner}]`
  ? SplitTop<Inner> extends infer P extends string[]
    ? AllLines<P>
    : false
  : false

type AllPolys<P extends string[]> = P extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? IsPolygon<H> extends true
    ? AllPolys<T>
    : false
  : true
type IsMultiPolygon<S extends string> = S extends `[${infer Inner}]`
  ? SplitTop<Inner> extends infer P extends string[]
    ? AllPolys<P>
    : false
  : false

// Geometry: canonical compact {"type":"…","coordinates":…}
export type GeometryLiteral<S extends string> =
  Trim<S> extends `{"type":"${infer T}","coordinates":${infer C}}`
    ? T extends "Point"
      ? KeepIf<IsPositionStr<C>, S>
      : T extends "MultiPoint"
        ? KeepIf<PositionArray<C, "any">, S>
        : T extends "LineString"
          ? KeepIf<PositionArray<C, "2">, S>
          : T extends "Polygon"
            ? KeepIf<IsPolygon<C>, S>
            : T extends "MultiLineString"
              ? KeepIf<IsMultiLine<C>, S>
              : T extends "MultiPolygon"
                ? KeepIf<IsMultiPolygon<C>, S>
                : never
    : Trim<S> extends `{"type":"GeometryCollection","geometries":[${infer G}]}`
      ? KeepIf<AllGeometries<SplitTop<G>>, S>
      : never

type AllGeometries<P extends string[]> = P extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? IsNever<GeometryLiteral<H>> extends true
    ? false
    : AllGeometries<T>
  : true

// Top-level: geometry → char-parsed; Feature → geometry char-parsed
// (canonical order); FeatureCollection → shallow tag (runtime validates).
export type GeojsonLiteral<S extends string> =
  Trim<S> extends `{"type":"Feature","geometry":${infer Rest}`
    ? Rest extends `${infer G},"properties":${string}`
      ? G extends "null"
        ? S
        : IsNever<GeometryLiteral<G>> extends true
          ? never
          : S
      : never
    : Trim<S> extends `{"type":"FeatureCollection"${string}`
      ? S
      : GeometryLiteral<S>

// Call-site helper. String → strict parse; object → casual escape hatch.
// String overload FIRST so a string literal never falls into the object
// arm; the object arm is unconstrained (the casual tier accepts any object,
// avoiding the tuple-vs-number[] assignability trap on coordinates).
export function geojson<S extends string>(value: S & GeojsonLiteral<S>): S
export function geojson<T extends object>(value: T): T
export function geojson(value: unknown): unknown {
  return value
}
```

Append to `index.ts`:
```ts
export { geojson } from "./geojson-editor.types"
export type {
  GeojsonLiteral,
  GeometryLiteral,
  PositionLiteral,
} from "./geojson-editor.types"
```

- [ ] **Step 4: Run typecheck + type tests**

Run: `pnpm typecheck && pnpm test tests/geojson-editor-types.test-d.ts`
Expected: PASS. If a `SplitTop` recursion-depth error appears for a large literal, the test inputs are small enough to stay within budget; keep production literals compact (documented).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/geojson-editor/geojson-editor.types.ts \
  src/components/ui/geojson-editor/index.ts \
  tests/geojson-editor-types.test-d.ts
git commit -m "$(cat <<'EOF'
Add geojson-editor strict string tier (geometry-deep)

Type-parses compact canonical GeoJSON: bracket-aware SplitTop, Position
arity + lon/lat range (reusing coordinate-input validators), ring
closure + min length, type-tag → coordinates-shape dispatch. geojson()
overload accepts an object (casual) or validates a string literal
(strict). FeatureCollection is a shallow tag check; deep validation is
the runtime validator (see plan scope note).
EOF
)"
```

---

## Phase 3 — Runtime helpers

### Task 4: parse + validate (errors + warnings)

**Files:** Modify `geojson-editor.helpers.ts`, `geojson-editor.constants.ts`, `index.ts`. Test `tests/geojson-editor-parse.test.ts`.

- [ ] **Step 1: Write failing parse/validate tests**

Create `tests/geojson-editor-parse.test.ts`:
```ts
import { describe, expect, it } from "vitest"
import { parseGeojson, validateGeojson } from "@/components/ui/geojson-editor"

describe("parseGeojson", () => {
  it("parses valid GeoJSON to a value with no errors", () => {
    const r = parseGeojson('{"type":"Point","coordinates":[0,0]}')
    expect(r.value).toEqual({ type: "Point", coordinates: [0, 0] })
    expect(r.errors.filter((e) => e.severity === "error")).toHaveLength(0)
  })
  it("reports a JSON syntax error with a path of []", () => {
    const r = parseGeojson("{ not json ")
    expect(r.value).toBeNull()
    expect(r.errors[0].code).toBe("json-syntax")
    expect(r.errors[0].path).toEqual([])
  })
})

describe("validateGeojson errors", () => {
  it("flags out-of-range longitude", () => {
    const errs = validateGeojson({ type: "Point", coordinates: [200, 0] })
    expect(errs.some((e) => e.code === "lon-out-of-range")).toBe(true)
  })
  it("flags wrong Position arity", () => {
    const errs = validateGeojson({ type: "Point", coordinates: [0] })
    expect(errs.some((e) => e.code === "position-arity")).toBe(true)
  })
  it("flags an unclosed polygon ring with a path", () => {
    const errs = validateGeojson({
      type: "Polygon",
      coordinates: [[[0, 0], [1, 0], [1, 1]]],
    })
    const ring = errs.find((e) => e.code === "ring-not-closed")
    expect(ring).toBeTruthy()
    expect(ring?.path).toEqual(["coordinates", 0])
  })
  it("flags an unknown geometry type", () => {
    const errs = validateGeojson({ type: "Nope", coordinates: [0, 0] })
    expect(errs.some((e) => e.code === "unknown-type")).toBe(true)
  })
})

describe("validateGeojson warnings", () => {
  it("warns on a clockwise outer ring (right-hand rule)", () => {
    const errs = validateGeojson({
      type: "Polygon",
      coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]], // clockwise
    })
    const w = errs.find((e) => e.code === "winding-order")
    expect(w?.severity).toBe("warning")
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm test tests/geojson-editor-parse.test.ts`
Expected: FAIL — exports not found.

- [ ] **Step 3: Implement constants + parse + validate**

Replace `geojson-editor.constants.ts`:
```ts
import type { Geometry } from "./geojson-editor.types"

export type GeometryType = Geometry["type"]

export const GEOMETRY_TYPES: GeometryType[] = [
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
  "GeometryCollection",
]

// Nesting depth of `coordinates` for each non-collection geometry:
// 1 = Position, 2 = Position[], 3 = Position[][], 4 = Position[][][].
export const COORD_DEPTH: Record<Exclude<GeometryType, "GeometryCollection">, number> = {
  Point: 1,
  MultiPoint: 2,
  LineString: 2,
  MultiLineString: 3,
  Polygon: 3,
  MultiPolygon: 4,
}
```

Replace `geojson-editor.helpers.ts`:
```ts
import { COORD_DEPTH, GEOMETRY_TYPES } from "./geojson-editor.constants"
import type {
  GeoJSON,
  GeojsonError,
  GeojsonPath,
  Geometry,
  Json,
  Position,
} from "./geojson-editor.types"

interface ParseResult {
  value: GeoJSON | null
  errors: GeojsonError[]
}

export function parseGeojson(src: string): ParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(src)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid JSON"
    return {
      value: null,
      errors: [{ path: [], message, severity: "error", code: "json-syntax" }],
    }
  }
  const errors = validateGeojson(parsed)
  const blocking = errors.some((x) => x.severity === "error")
  return { value: blocking ? null : (parsed as GeoJSON), errors }
}

const err = (
  path: GeojsonPath,
  message: string,
  code: string,
): GeojsonError => ({ path, message, severity: "error", code })
const warn = (
  path: GeojsonPath,
  message: string,
  code: string,
): GeojsonError => ({ path, message, severity: "warning", code })

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function validatePosition(v: unknown, path: GeojsonPath, out: GeojsonError[]) {
  if (!Array.isArray(v) || (v.length !== 2 && v.length !== 3)) {
    out.push(err(path, "A position must be [lon, lat] or [lon, lat, elevation].", "position-arity"))
    return
  }
  const [lon, lat] = v
  if (typeof lon !== "number" || lon < -180 || lon > 180)
    out.push(err([...path, 0], `Longitude ${String(lon)} must be between -180 and 180.`, "lon-out-of-range"))
  if (typeof lat !== "number" || lat < -90 || lat > 90)
    out.push(err([...path, 1], `Latitude ${String(lat)} must be between -90 and 90.`, "lat-out-of-range"))
}

function eachPosition(arr: unknown, path: GeojsonPath, out: GeojsonError[]) {
  if (!Array.isArray(arr)) {
    out.push(err(path, "Expected an array of positions.", "coords-shape"))
    return
  }
  arr.forEach((p, i) => validatePosition(p, [...path, i], out))
}

function validateRing(ring: unknown, path: GeojsonPath, out: GeojsonError[]) {
  if (!Array.isArray(ring) || ring.length < 4) {
    out.push(err(path, "A polygon ring needs at least 4 positions.", "ring-too-short"))
    return
  }
  ring.forEach((p, i) => validatePosition(p, [...path, i], out))
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (JSON.stringify(first) !== JSON.stringify(last))
    out.push(err(path, "Polygon ring isn't closed — the first and last point must match.", "ring-not-closed"))
  else if (signedArea(ring as Position[]) < 0)
    out.push(warn(path, "Ring winds clockwise; GeoJSON prefers counter-clockwise (right-hand rule).", "winding-order"))
}

// Shoelace signed area; >0 = counter-clockwise, <0 = clockwise.
function signedArea(ring: Position[]): number {
  let sum = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[i + 1]
    sum += x1 * y2 - x2 * y1
  }
  return sum / 2
}

function validateGeometry(g: unknown, path: GeojsonPath, out: GeojsonError[]) {
  if (!isObject(g)) {
    out.push(err(path, "A geometry must be an object.", "not-object"))
    return
  }
  const type = g.type
  if (typeof type !== "string" || !GEOMETRY_TYPES.includes(type as never)) {
    out.push(err([...path, "type"], `Unknown geometry type "${String(type)}".`, "unknown-type"))
    return
  }
  if (type === "GeometryCollection") {
    if (!Array.isArray(g.geometries))
      out.push(err([...path, "geometries"], "GeometryCollection needs a geometries array.", "coords-shape"))
    else g.geometries.forEach((sub, i) => validateGeometry(sub, [...path, "geometries", i], out))
    return
  }
  const coords = g.coordinates
  const cp: GeojsonPath = [...path, "coordinates"]
  const depth = COORD_DEPTH[type as keyof typeof COORD_DEPTH]
  if (type === "Point") validatePosition(coords, cp, out)
  else if (depth === 2) eachPosition(coords, cp, out)
  else if (type === "Polygon") {
    if (!Array.isArray(coords)) out.push(err(cp, "Expected an array of rings.", "coords-shape"))
    else coords.forEach((ring, i) => validateRing(ring, [...cp, i], out))
  } else if (type === "MultiLineString") {
    if (!Array.isArray(coords)) out.push(err(cp, "Expected an array of lines.", "coords-shape"))
    else coords.forEach((line, i) => eachPosition(line, [...cp, i], out))
  } else if (type === "MultiPolygon") {
    if (!Array.isArray(coords)) out.push(err(cp, "Expected an array of polygons.", "coords-shape"))
    else coords.forEach((poly, i) => {
      if (!Array.isArray(poly)) out.push(err([...cp, i], "Expected an array of rings.", "coords-shape"))
      else poly.forEach((ring, j) => validateRing(ring, [...cp, i, j], out))
    })
  }
}

export function validateGeojson(value: unknown): GeojsonError[] {
  const out: GeojsonError[] = []
  if (!isObject(value)) {
    out.push(err([], "GeoJSON must be an object.", "not-object"))
    return out
  }
  if (value.crs !== undefined)
    out.push(warn(["crs"], "The crs member is deprecated; GeoJSON is always WGS84.", "crs-deprecated"))
  const type = value.type
  if (type === "FeatureCollection") {
    if (!Array.isArray(value.features))
      out.push(err(["features"], "FeatureCollection needs a features array.", "coords-shape"))
    else value.features.forEach((f, i) => validateFeature(f, ["features", i], out))
  } else if (type === "Feature") {
    validateFeature(value, [], out)
  } else {
    validateGeometry(value, [], out)
  }
  return out
}

function validateFeature(f: unknown, path: GeojsonPath, out: GeojsonError[]) {
  if (!isObject(f) || f.type !== "Feature") {
    out.push(err(path, "Expected a Feature object.", "not-feature"))
    return
  }
  if (f.geometry !== null) validateGeometry(f.geometry, [...path, "geometry"], out)
  if (f.properties !== null && !isObject(f.properties))
    out.push(err([...path, "properties"], "Feature properties must be an object or null.", "bad-properties"))
}
```

Append to `index.ts`:
```ts
export { parseGeojson, validateGeojson } from "./geojson-editor.helpers"
export { COORD_DEPTH, GEOMETRY_TYPES } from "./geojson-editor.constants"
export type { GeometryType } from "./geojson-editor.constants"
```

- [ ] **Step 4: Run tests + typecheck**

Run: `pnpm test tests/geojson-editor-parse.test.ts && pnpm typecheck`
Expected: PASS. The winding test ring `[[0,0],[0,1],[1,1],[1,0],[0,0]]` is clockwise (signed area < 0) → warning.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/geojson-editor/geojson-editor.helpers.ts \
  src/components/ui/geojson-editor/geojson-editor.constants.ts \
  src/components/ui/geojson-editor/index.ts \
  tests/geojson-editor-parse.test.ts
git commit -m "$(cat <<'EOF'
Add geojson-editor runtime parse + validate

parseGeojson wraps JSON.parse (syntax error → path []) then validates.
validateGeojson walks RFC 7946 emitting path-addressed errors (arity,
lon/lat range, ring closure/length, unknown type, coords shape) and
warnings (clockwise winding via shoelace, deprecated crs). Single pass,
consumed by the core and every view.
EOF
)"
```

---

### Task 5: format (foreign-member preserving) + path utils + fixes + blanks

**Files:** Modify `geojson-editor.helpers.ts`, `geojson-editor.constants.ts`, `index.ts`. Test `tests/geojson-editor-format.test.ts`.

- [ ] **Step 1: Write failing format/util tests**

Create `tests/geojson-editor-format.test.ts`:
```ts
import { describe, expect, it } from "vitest"
import {
  blankGeometry,
  closeRing,
  formatGeojson,
  getAtPath,
  reverseRing,
  setAtPath,
} from "@/components/ui/geojson-editor"

describe("formatGeojson", () => {
  it("round-trips and preserves foreign members", () => {
    const value = {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [1, 2] as [number, number] },
      properties: { name: "x" },
      id: "abc",
      customField: 42,
    }
    const text = formatGeojson(value)
    expect(JSON.parse(text)).toEqual(value)
    expect(text).toContain('"customField"')
  })
})

describe("path utils", () => {
  it("getAtPath reads a nested value", () => {
    const v = { type: "FeatureCollection", features: [{ type: "Feature", geometry: null, properties: null }] }
    expect(getAtPath(v, ["features", 0, "type"])).toBe("Feature")
  })
  it("setAtPath returns a new object with the value replaced", () => {
    const v = { a: { b: 1 } }
    const next = setAtPath(v, ["a", "b"], 2)
    expect(next).toEqual({ a: { b: 2 } })
    expect(v.a.b).toBe(1) // immutable
  })
})

describe("ring fixes", () => {
  it("closeRing appends the first point", () => {
    expect(closeRing([[0, 0], [1, 0], [1, 1]])).toEqual([[0, 0], [1, 0], [1, 1], [0, 0]])
  })
  it("reverseRing reverses point order", () => {
    expect(reverseRing([[0, 0], [1, 0], [0, 0]])).toEqual([[0, 0], [1, 0], [0, 0]].reverse())
  })
})

describe("blankGeometry", () => {
  it("seeds a Point at origin", () => {
    expect(blankGeometry("Point")).toEqual({ type: "Point", coordinates: [0, 0] })
  })
  it("seeds a closed Polygon", () => {
    const g = blankGeometry("Polygon") as { coordinates: number[][][] }
    expect(g.coordinates[0][0]).toEqual(g.coordinates[0][g.coordinates[0].length - 1])
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm test tests/geojson-editor-format.test.ts`
Expected: FAIL — exports not found.

- [ ] **Step 3: Implement format, path utils, fixes, blanks**

Append to `geojson-editor.helpers.ts`:
```ts
import type { GeometryType } from "./geojson-editor.constants"

// JSON.stringify already preserves unknown keys; indent is the only knob.
// (Key ordering follows insertion order, which keeps known + foreign keys.)
export function formatGeojson(value: GeoJSON, opts?: { indent?: number }): string {
  return JSON.stringify(value, null, opts?.indent ?? 2)
}

export function getAtPath(value: unknown, path: GeojsonPath): unknown {
  let cur: unknown = value
  for (const key of path) {
    if (cur == null) return undefined
    cur = (cur as Record<string | number, unknown>)[key]
  }
  return cur
}

export function setAtPath<T>(value: T, path: GeojsonPath, next: unknown): T {
  if (path.length === 0) return next as T
  const [head, ...rest] = path
  const clone: Record<string | number, unknown> = Array.isArray(value)
    ? [...(value as unknown[])]
    : { ...(value as Record<string, unknown>) }
  clone[head] = setAtPath(clone[head], rest, next)
  return clone as T
}

export function closeRing(ring: Position[]): Position[] {
  if (ring.length === 0) return ring
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (JSON.stringify(first) === JSON.stringify(last)) return ring
  return [...ring, first]
}

export function reverseRing(ring: Position[]): Position[] {
  return [...ring].reverse()
}

export function blankGeometry(type: GeometryType): Geometry {
  switch (type) {
    case "Point":
      return { type, coordinates: [0, 0] }
    case "MultiPoint":
      return { type, coordinates: [[0, 0]] }
    case "LineString":
      return { type, coordinates: [[0, 0], [1, 1]] }
    case "MultiLineString":
      return { type, coordinates: [[[0, 0], [1, 1]]] }
    case "Polygon":
      return { type, coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] }
    case "MultiPolygon":
      return { type, coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]]] }
    case "GeometryCollection":
      return { type, geometries: [] }
  }
}

export function blankFeature(): GeoJSON {
  return { type: "Feature", geometry: blankGeometry("Point"), properties: {} }
}
```

Append to `index.ts`:
```ts
export {
  blankFeature,
  blankGeometry,
  closeRing,
  formatGeojson,
  getAtPath,
  reverseRing,
  setAtPath,
} from "./geojson-editor.helpers"
```

- [ ] **Step 4: Run tests + typecheck**

Run: `pnpm test tests/geojson-editor-format.test.ts && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/geojson-editor/geojson-editor.helpers.ts \
  src/components/ui/geojson-editor/index.ts \
  tests/geojson-editor-format.test.ts
git commit -m "$(cat <<'EOF'
Add geojson-editor format, path utils, ring fixes, blanks

formatGeojson (JSON.stringify preserves foreign members), immutable
getAtPath/setAtPath powering selection + structural edits, closeRing/
reverseRing fix implementations, and blankGeometry/blankFeature seeds.
EOF
)"
```

---

## Phase 4 — Headless core

### Task 6: context + useGeojsonEditor + provider

**Files:** Modify `context.ts`, `use-geojson-editor.ts`, `geojson-editor.tsx`, `index.ts`. Test `tests/geojson-editor.test.tsx`.

- [ ] **Step 1: Write failing core tests**

Create `tests/geojson-editor.test.tsx`:
```tsx
import { act, render, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useGeojsonEditor } from "@/components/ui/geojson-editor"
import type { GeoJSON } from "@/components/ui/geojson-editor"

const point: GeoJSON = { type: "Point", coordinates: [0, 0] }

describe("useGeojsonEditor", () => {
  it("exposes the value and a formatted rawText", () => {
    const { result } = renderHook(() => useGeojsonEditor({ value: point, onChange: () => {} }))
    expect(result.current.value).toEqual(point)
    expect(JSON.parse(result.current.rawText)).toEqual(point)
    expect(result.current.isValid).toBe(true)
  })

  it("commits valid rawText to value via onChange", () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useGeojsonEditor({ value: point, onChange }))
    act(() => result.current.setRawText('{"type":"Point","coordinates":[3,4]}'))
    expect(onChange).toHaveBeenCalledWith({ type: "Point", coordinates: [3, 4] })
  })

  it("keeps invalid rawText, surfaces errors, leaves value last-valid", () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useGeojsonEditor({ value: point, onChange }))
    act(() => result.current.setRawText("{ broken "))
    expect(onChange).not.toHaveBeenCalled()
    expect(result.current.rawText).toBe("{ broken ")
    expect(result.current.isValid).toBe(false)
    expect(result.current.value).toEqual(point) // last-valid
  })

  it("undo/redo step the value history", () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useGeojsonEditor({ defaultValue: point, onChange }))
    act(() => result.current.setValue({ type: "Point", coordinates: [9, 9] }))
    expect(result.current.canUndo).toBe(true)
    act(() => result.current.undo())
    expect(result.current.value).toEqual(point)
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm test tests/geojson-editor.test.tsx`
Expected: FAIL — `useGeojsonEditor` not exported.

- [ ] **Step 3: Implement context + core hook + provider**

Replace `context.ts`:
```ts
import * as React from "react"
import type { GeoJSON, GeojsonError, GeojsonPath, Geometry, Json } from "./geojson-editor.types"

export interface GeojsonEditorStore {
  value: GeoJSON
  rawText: string
  selection: GeojsonPath | null
  errors: GeojsonError[]
  isValid: boolean
  setValue(next: GeoJSON): void
  setRawText(next: string): void
  select(path: GeojsonPath | null): void
  updateGeometry(path: GeojsonPath, geometry: Geometry): void
  addFeature(feature?: GeoJSON): void
  removeFeature(index: number): void
  setProperty(featurePath: GeojsonPath, key: string, value: Json): void
  undo(): void
  redo(): void
  canUndo: boolean
  canRedo: boolean
}

export const GeojsonEditorContext = React.createContext<GeojsonEditorStore | null>(null)

export function useGeojsonEditorContext(): GeojsonEditorStore {
  const ctx = React.useContext(GeojsonEditorContext)
  if (!ctx)
    throw new Error("useGeojsonEditorContext must be used inside <GeojsonEditorProvider>.")
  return ctx
}
```

Replace `use-geojson-editor.ts`:
```ts
import * as React from "react"
import type { GeojsonEditorStore } from "./context"
import {
  blankFeature,
  formatGeojson,
  parseGeojson,
  setAtPath,
  validateGeojson,
} from "./geojson-editor.helpers"
import type { GeoJSON, GeojsonPath, Geometry, Json } from "./geojson-editor.types"

interface UseGeojsonEditorOptions<V extends GeoJSON = GeoJSON> {
  value?: V
  defaultValue?: V
  onChange?: (value: V) => void
  selection?: GeojsonPath
  onSelectionChange?: (path: GeojsonPath | null) => void
}

const HISTORY_CAP = 100

export function useGeojsonEditor<V extends GeoJSON = GeoJSON>(
  options: UseGeojsonEditorOptions<V>,
): GeojsonEditorStore {
  const isControlled = options.value !== undefined
  const [internal, setInternal] = React.useState<GeoJSON>(
    options.value ?? options.defaultValue ?? blankFeature(),
  )
  const value = (options.value ?? internal) as GeoJSON

  // Raw buffer: owns its own string while the user edits it.
  const [rawDraft, setRawDraft] = React.useState<string | null>(null)
  const rawText = rawDraft ?? formatGeojson(value)
  const errors = React.useMemo(
    () => (rawDraft !== null ? parseGeojson(rawDraft).errors : validateGeojson(value)),
    [rawDraft, value],
  )
  const isValid = !errors.some((e) => e.severity === "error")

  // Selection (controlled or internal).
  const [selInternal, setSelInternal] = React.useState<GeojsonPath | null>(
    options.selection ?? null,
  )
  const selection = options.selection ?? selInternal

  // Undo/redo stacks of committed values.
  const past = React.useRef<GeoJSON[]>([])
  const future = React.useRef<GeoJSON[]>([])
  const [, forceRender] = React.useReducer((n: number) => n + 1, 0)

  const commitValue = React.useCallback(
    (next: GeoJSON, pushHistory = true) => {
      if (pushHistory) {
        past.current = [...past.current, value].slice(-HISTORY_CAP)
        future.current = []
      }
      setRawDraft(null)
      if (!isControlled) setInternal(next)
      options.onChange?.(next as V)
    },
    [isControlled, options, value],
  )

  const setValue = React.useCallback((next: GeoJSON) => commitValue(next), [commitValue])

  const setRawText = React.useCallback(
    (next: string) => {
      setRawDraft(next)
      const parsed = parseGeojson(next)
      if (parsed.value !== null) {
        past.current = [...past.current, value].slice(-HISTORY_CAP)
        future.current = []
        if (!isControlled) setInternal(parsed.value)
        options.onChange?.(parsed.value as V)
        setRawDraft(null) // commit clears the draft; projection re-derives
      }
    },
    [isControlled, options, value],
  )

  const select = React.useCallback(
    (path: GeojsonPath | null) => {
      setSelInternal(path)
      options.onSelectionChange?.(path)
    },
    [options],
  )

  const updateGeometry = React.useCallback(
    (path: GeojsonPath, geometry: Geometry) => commitValue(setAtPath(value, path, geometry)),
    [commitValue, value],
  )

  const addFeature = React.useCallback(
    (feature?: GeoJSON) => {
      if (value.type !== "FeatureCollection") return
      const next = setAtPath(value, ["features"], [...value.features, feature ?? blankFeature()])
      commitValue(next as GeoJSON)
    },
    [commitValue, value],
  )

  const removeFeature = React.useCallback(
    (index: number) => {
      if (value.type !== "FeatureCollection") return
      const next = setAtPath(value, ["features"], value.features.filter((_, i) => i !== index))
      commitValue(next as GeoJSON)
    },
    [commitValue, value],
  )

  const setProperty = React.useCallback(
    (featurePath: GeojsonPath, key: string, propValue: Json) =>
      commitValue(setAtPath(value, [...featurePath, "properties", key], propValue)),
    [commitValue, value],
  )

  const undo = React.useCallback(() => {
    const prev = past.current[past.current.length - 1]
    if (prev === undefined) return
    past.current = past.current.slice(0, -1)
    future.current = [value, ...future.current]
    setRawDraft(null)
    if (!isControlled) setInternal(prev)
    options.onChange?.(prev as V)
    forceRender()
  }, [isControlled, options, value])

  const redo = React.useCallback(() => {
    const next = future.current[0]
    if (next === undefined) return
    future.current = future.current.slice(1)
    past.current = [...past.current, value]
    setRawDraft(null)
    if (!isControlled) setInternal(next)
    options.onChange?.(next as V)
    forceRender()
  }, [isControlled, options, value])

  return {
    value,
    rawText,
    selection,
    errors,
    isValid,
    setValue,
    setRawText,
    select,
    updateGeometry,
    addFeature,
    removeFeature,
    setProperty,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  }
}
```

Replace `geojson-editor.tsx`:
```tsx
"use client"

import * as React from "react"
import { GeojsonEditorContext } from "./context"
import { useGeojsonEditor } from "./use-geojson-editor"
import type { GeoJSON, GeojsonPath } from "./geojson-editor.types"

export interface GeojsonEditorProviderProps<V extends GeoJSON = GeoJSON> {
  value?: V
  defaultValue?: V
  onChange?: (value: V) => void
  selection?: GeojsonPath
  onSelectionChange?: (path: GeojsonPath | null) => void
  children: React.ReactNode
}

export function GeojsonEditorProvider<V extends GeoJSON = GeoJSON>({
  children,
  ...options
}: GeojsonEditorProviderProps<V>) {
  const store = useGeojsonEditor<V>(options)
  return (
    <GeojsonEditorContext.Provider value={store}>
      {children}
    </GeojsonEditorContext.Provider>
  )
}
```

Append to `index.ts`:
```ts
export { GeojsonEditorContext, useGeojsonEditorContext } from "./context"
export type { GeojsonEditorStore } from "./context"
export { useGeojsonEditor } from "./use-geojson-editor"
export { GeojsonEditorProvider } from "./geojson-editor"
export type { GeojsonEditorProviderProps } from "./geojson-editor"
```

- [ ] **Step 4: Run tests + typecheck**

Run: `pnpm test tests/geojson-editor.test.tsx && pnpm typecheck`
Expected: PASS — 4 core tests. The "keeps invalid rawText" test is the §4.3 guarantee: `setRawText` stores the draft, parse fails, value stays last-valid.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/geojson-editor/context.ts \
  src/components/ui/geojson-editor/use-geojson-editor.ts \
  src/components/ui/geojson-editor/geojson-editor.tsx \
  src/components/ui/geojson-editor/index.ts \
  tests/geojson-editor.test.tsx
git commit -m "$(cat <<'EOF'
Add geojson-editor headless core + provider

useGeojsonEditor owns the canonical value, a resilient raw buffer
(invalid text is kept, value stays last-valid), selection, derived
errors/isValid, structural actions (updateGeometry/addFeature/
removeFeature/setProperty), and a bounded undo/redo history. Exposed
via GeojsonEditorContext / GeojsonEditorProvider for prop-drill-free
view + map consumption. Generic over V at the boundary.
EOF
)"
```

---

## Phase 5 — View parts

> Each view is presentational and reads the store via `useGeojsonEditorContext()`. Tests wrap the view in `<GeojsonEditorProvider>`. Views are MVP (deferrals listed in the file map); each is < 120 lines.

### Task 7: ErrorRail

**Files:** Modify `views/error-rail.tsx`, `index.ts`. Modify `tests/geojson-editor.test.tsx`.

- [ ] **Step 1: Write failing test**

Append to `tests/geojson-editor.test.tsx`:
```tsx
import { GeojsonEditorProvider, ErrorRail } from "@/components/ui/geojson-editor"

describe("ErrorRail", () => {
  it("lists errors and selects the node on click", () => {
    const onSelectionChange = vi.fn()
    const bad: GeoJSON = { type: "Point", coordinates: [200, 0] }
    const { getByText } = render(
      <GeojsonEditorProvider value={bad} onChange={() => {}} onSelectionChange={onSelectionChange}>
        <ErrorRail />
      </GeojsonEditorProvider>,
    )
    const item = getByText(/between -180 and 180/i)
    item.click()
    expect(onSelectionChange).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm test tests/geojson-editor.test.tsx -t ErrorRail`
Expected: FAIL — `ErrorRail` not exported.

- [ ] **Step 3: Implement ErrorRail**

Replace `views/error-rail.tsx`:
```tsx
"use client"

import { cn } from "@/lib/utils"
import { useGeojsonEditorContext } from "../context"

export function ErrorRail({ className }: { className?: string }) {
  const { errors, select } = useGeojsonEditorContext()
  if (errors.length === 0) return null
  return (
    <ul data-slot="error-rail" className={cn("flex flex-col gap-1 p-2 text-sm", className)}>
      {errors.map((e, i) => (
        <li key={`${e.code}-${i}`}>
          <button
            type="button"
            onClick={() => select(e.path)}
            className={cn(
              "w-full text-left flex flex-col gap-0.5 rounded-md px-2 py-1 hover:bg-muted/50",
              e.severity === "error" ? "text-destructive" : "text-amber-600 dark:text-amber-400",
            )}
          >
            <span>{e.message}</span>
            <span className="text-xs font-mono text-muted-foreground">
              {e.path.length ? e.path.join(".") : "document"}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
```

Append to `index.ts`:
```ts
export { ErrorRail } from "./views/error-rail"
```

- [ ] **Step 4: Run test + typecheck**

Run: `pnpm test tests/geojson-editor.test.tsx -t ErrorRail && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/geojson-editor/views/error-rail.tsx \
  src/components/ui/geojson-editor/index.ts tests/geojson-editor.test.tsx
git commit -m "Add ErrorRail view (plain-language errors + jump-to-node)"
```

---

### Task 8: RawJsonPane

**Files:** Modify `views/raw-json-pane.tsx`, `index.ts`. Modify `tests/geojson-editor.test.tsx`.

- [ ] **Step 1: Write failing test**

Append to `tests/geojson-editor.test.tsx`:
```tsx
import { RawJsonPane } from "@/components/ui/geojson-editor"
import { fireEvent } from "@testing-library/react"

describe("RawJsonPane", () => {
  it("shows the formatted value and commits valid edits", () => {
    const onChange = vi.fn()
    const { container } = render(
      <GeojsonEditorProvider value={point} onChange={onChange}>
        <RawJsonPane />
      </GeojsonEditorProvider>,
    )
    const ta = container.querySelector("textarea") as HTMLTextAreaElement
    expect(JSON.parse(ta.value)).toEqual(point)
    fireEvent.change(ta, { target: { value: '{"type":"Point","coordinates":[5,6]}' } })
    expect(onChange).toHaveBeenCalledWith({ type: "Point", coordinates: [5, 6] })
  })

  it("keeps invalid text in the textarea without emitting", () => {
    const onChange = vi.fn()
    const { container } = render(
      <GeojsonEditorProvider value={point} onChange={onChange}>
        <RawJsonPane />
      </GeojsonEditorProvider>,
    )
    const ta = container.querySelector("textarea") as HTMLTextAreaElement
    fireEvent.change(ta, { target: { value: "{ oops" } })
    expect(ta.value).toBe("{ oops")
    expect(onChange).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm test tests/geojson-editor.test.tsx -t RawJsonPane`
Expected: FAIL — `RawJsonPane` not exported.

- [ ] **Step 3: Implement RawJsonPane**

Replace `views/raw-json-pane.tsx`:
```tsx
"use client"

import { cn } from "@/lib/utils"
import { useGeojsonEditorContext } from "../context"

// MVP: textarea (NOT monaco — per the spec's premise). Line numbers +
// bracket-match are a follow-up seam; the resilient buffer is in the core.
export function RawJsonPane({ className }: { className?: string }) {
  const { rawText, setRawText, isValid } = useGeojsonEditorContext()
  return (
    <textarea
      data-slot="raw-json-pane"
      spellCheck={false}
      value={rawText}
      onChange={(e) => setRawText(e.target.value)}
      aria-invalid={!isValid || undefined}
      className={cn(
        "w-full h-full min-h-48 font-mono text-xs p-3 bg-background border border-input rounded-md resize-none focus-visible:ring-2 focus-visible:ring-ring outline-none",
        !isValid && "border-destructive",
        className,
      )}
    />
  )
}
```

Append to `index.ts`:
```ts
export { RawJsonPane } from "./views/raw-json-pane"
```

- [ ] **Step 4: Run test + typecheck**

Run: `pnpm test tests/geojson-editor.test.tsx -t RawJsonPane && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/geojson-editor/views/raw-json-pane.tsx \
  src/components/ui/geojson-editor/index.ts tests/geojson-editor.test.tsx
git commit -m "Add RawJsonPane view (textarea, resilient buffer wired to core)"
```

---

### Task 9: FeatureTree

**Files:** Modify `views/feature-tree.tsx`, `index.ts`. Modify `tests/geojson-editor.test.tsx`.

- [ ] **Step 1: Write failing test**

Append to `tests/geojson-editor.test.tsx`:
```tsx
import { FeatureTree } from "@/components/ui/geojson-editor"

const fc: GeoJSON = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", geometry: { type: "Point", coordinates: [0, 0] }, properties: { name: "A" } },
    { type: "Feature", geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] }, properties: null },
  ],
}

describe("FeatureTree", () => {
  it("renders a row per feature and selects on click", () => {
    const onSelectionChange = vi.fn()
    const { getAllByRole } = render(
      <GeojsonEditorProvider value={fc} onChange={() => {}} onSelectionChange={onSelectionChange}>
        <FeatureTree />
      </GeojsonEditorProvider>,
    )
    const rows = getAllByRole("button").filter((b) => b.textContent?.includes("Feature"))
    expect(rows.length).toBeGreaterThanOrEqual(2)
    rows[0].click()
    expect(onSelectionChange).toHaveBeenCalledWith(["features", 0])
  })

  it("adds a feature via the add button", () => {
    const onChange = vi.fn()
    const { getByText } = render(
      <GeojsonEditorProvider value={fc} onChange={onChange}>
        <FeatureTree />
      </GeojsonEditorProvider>,
    )
    getByText(/add feature/i).click()
    expect(onChange).toHaveBeenCalled()
    const next = onChange.mock.calls[0][0] as typeof fc
    expect(next.type === "FeatureCollection" && next.features).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm test tests/geojson-editor.test.tsx -t FeatureTree`
Expected: FAIL — `FeatureTree` not exported.

- [ ] **Step 3: Implement FeatureTree**

Replace `views/feature-tree.tsx`:
```tsx
"use client"

import { cn } from "@/lib/utils"
import { useGeojsonEditorContext } from "../context"
import type { Feature, GeojsonPath } from "../geojson-editor.types"

function geomLabel(f: Feature): string {
  return f.geometry ? f.geometry.type : "null"
}

export function FeatureTree({ className }: { className?: string }) {
  const { value, selection, select, addFeature, removeFeature, errors } =
    useGeojsonEditorContext()

  const features: Feature[] =
    value.type === "FeatureCollection"
      ? value.features
      : value.type === "Feature"
        ? [value]
        : []

  const isFC = value.type === "FeatureCollection"
  const pathFor = (i: number): GeojsonPath => (isFC ? ["features", i] : [])
  const hasError = (i: number) =>
    errors.some(
      (e) => e.severity === "error" && (isFC ? e.path[0] === "features" && e.path[1] === i : true),
    )
  const isSelected = (p: GeojsonPath) =>
    selection !== null && selection.join(".").startsWith(p.join("."))

  return (
    <div data-slot="feature-tree" className={cn("flex flex-col gap-1 text-sm", className)}>
      {features.map((f, i) => {
        const p = pathFor(i)
        return (
          <div key={i} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => select(p)}
              className={cn(
                "flex-1 text-left flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50",
                isSelected(p) && "bg-muted",
              )}
            >
              <span>Feature</span>
              <span className="text-xs text-muted-foreground">· {geomLabel(f)}</span>
              {hasError(i) && <span className="ml-auto size-1.5 rounded-full bg-destructive" />}
            </button>
            {isFC && (
              <button
                type="button"
                aria-label={`Remove feature ${i + 1}`}
                onClick={() => removeFeature(i)}
                className="px-2 py-1 text-muted-foreground hover:text-destructive"
              >
                ✕
              </button>
            )}
          </div>
        )
      })}
      {isFC && (
        <button
          type="button"
          onClick={() => addFeature()}
          className="text-left rounded-md border border-dashed border-input px-2 py-1 text-muted-foreground hover:bg-muted/50"
        >
          + add feature
        </button>
      )}
    </div>
  )
}
```

Append to `index.ts`:
```ts
export { FeatureTree } from "./views/feature-tree"
```

- [ ] **Step 4: Run test + typecheck**

Run: `pnpm test tests/geojson-editor.test.tsx -t FeatureTree && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/geojson-editor/views/feature-tree.tsx \
  src/components/ui/geojson-editor/index.ts tests/geojson-editor.test.tsx
git commit -m "Add FeatureTree view (select, error dot, add/remove feature)"
```

---

### Task 10: GeometryFields (consumes CoordinateInput)

**Files:** Modify `views/geometry-fields.tsx`, `index.ts`. Modify `tests/geojson-editor.test.tsx`.

- [ ] **Step 1: Write failing test**

Append to `tests/geojson-editor.test.tsx`:
```tsx
import { GeometryFields } from "@/components/ui/geojson-editor"

describe("GeometryFields", () => {
  it("edits a selected Point's coordinate", () => {
    const onChange = vi.fn()
    const sel: GeoJSON = { type: "Feature", geometry: { type: "Point", coordinates: [0, 0] }, properties: null }
    const { container } = render(
      <GeojsonEditorProvider value={sel} selection={["geometry"]} onChange={onChange}>
        <GeometryFields />
      </GeojsonEditorProvider>,
    )
    const lon = container.querySelectorAll("input")[0] as HTMLInputElement
    fireEvent.change(lon, { target: { value: "12" } })
    fireEvent.blur(lon)
    expect(onChange).toHaveBeenCalled()
    const next = onChange.mock.calls[0][0] as typeof sel
    expect(next.type === "Feature" && next.geometry?.type === "Point" && next.geometry.coordinates[0]).toBe(12)
  })

  it("disables the geometry-type select when lockGeometryType is set", () => {
    const sel: GeoJSON = { type: "Feature", geometry: { type: "Point", coordinates: [0, 0] }, properties: null }
    const { container } = render(
      <GeojsonEditorProvider value={sel} selection={["geometry"]} onChange={() => {}}>
        <GeometryFields lockGeometryType />
      </GeojsonEditorProvider>,
    )
    expect((container.querySelector("select") as HTMLSelectElement)?.disabled).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm test tests/geojson-editor.test.tsx -t GeometryFields`
Expected: FAIL — `GeometryFields` not exported.

- [ ] **Step 3: Implement GeometryFields**

Replace `views/geometry-fields.tsx`:
```tsx
"use client"

import { CoordinateInput } from "@/components/ui/coordinate-input"
import type { Position } from "@/components/ui/coordinate-input"
import { cn } from "@/lib/utils"
import { GEOMETRY_TYPES } from "../geojson-editor.constants"
import { blankGeometry, getAtPath } from "../geojson-editor.helpers"
import { useGeojsonEditorContext } from "../context"
import type { GeojsonPath, Geometry, Point } from "../geojson-editor.types"

// Resolve the selected geometry path: selection may point at a feature
// (append "geometry") or directly at a geometry.
function geometryPath(selection: GeojsonPath | null, value: unknown): GeojsonPath | null {
  if (selection === null) {
    if ((value as Geometry)?.type && (value as Geometry).type !== "GeometryCollection") return []
    return null
  }
  const at = getAtPath(value, selection) as { type?: string } | undefined
  if (at?.type === "Feature") return [...selection, "geometry"]
  return selection
}

export interface GeometryFieldsProps {
  className?: string
  // When the editor's value type is narrowed (e.g. Feature<Polygon>), the
  // host passes this so the user can't switch geometry type (soundness).
  lockGeometryType?: boolean
}

export function GeometryFields({ className, lockGeometryType }: GeometryFieldsProps) {
  const { value, selection, updateGeometry } = useGeojsonEditorContext()
  const gPath = geometryPath(selection, value)
  if (gPath === null) return <p className="p-2 text-sm text-muted-foreground">Select a feature.</p>
  const geometry = getAtPath(value, gPath) as Geometry | null
  if (!geometry) return <p className="p-2 text-sm text-muted-foreground">No geometry.</p>

  const onTypeChange = (next: string) =>
    updateGeometry(gPath, blankGeometry(next as Geometry["type"]))

  return (
    <div data-slot="geometry-fields" className={cn("flex flex-col gap-2 p-2", className)}>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">geometry</span>
        <select
          value={geometry.type}
          disabled={lockGeometryType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="h-7 rounded-md border border-input bg-background px-2 text-xs"
        >
          {GEOMETRY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      {geometry.type === "Point" ? (
        <CoordinateInput
          value={(geometry as Point).coordinates}
          onChange={(next: Position) =>
            updateGeometry(gPath, { type: "Point", coordinates: next })
          }
          aria-label="Point coordinates"
        />
      ) : (
        // MVP: ring/part vertex grids land as a follow-up; non-Point
        // geometries fall back to the RawJsonPane in the presets.
        <p className="text-xs text-muted-foreground">
          Edit {geometry.type} coordinates in the raw pane (vertex grid is a
          follow-up).
        </p>
      )}
    </div>
  )
}
```

> MVP note: only `Point` gets the coordinate-grid UI here; multi-vertex geometries are editable via the raw pane (the preset always exposes one). The vertex/ring grid is the first post-MVP enhancement and is a clean addition (map over `coordinates` with `CoordinateInput` rows).

Append to `index.ts`:
```ts
export { GeometryFields } from "./views/geometry-fields"
export type { GeometryFieldsProps } from "./views/geometry-fields"
```

- [ ] **Step 4: Run test + typecheck**

Run: `pnpm test tests/geojson-editor.test.tsx -t GeometryFields && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/geojson-editor/views/geometry-fields.tsx \
  src/components/ui/geojson-editor/index.ts tests/geojson-editor.test.tsx
git commit -m "$(cat <<'EOF'
Add GeometryFields view (type select + Point CoordinateInput)

Resolves the selected geometry (feature → geometry), renders a type
select (disabled when lockGeometryType for narrowed-value soundness),
and edits Point coordinates via CoordinateInput. Multi-vertex grids
defer to the raw pane (MVP; vertex grid is the first follow-up).
EOF
)"
```

---

### Task 11: PropertiesGrid

**Files:** Modify `views/properties-grid.tsx`, `index.ts`. Modify `tests/geojson-editor.test.tsx`.

- [ ] **Step 1: Write failing test**

Append to `tests/geojson-editor.test.tsx`:
```tsx
import { PropertiesGrid } from "@/components/ui/geojson-editor"

describe("PropertiesGrid", () => {
  it("renders existing properties and edits a value", () => {
    const onChange = vi.fn()
    const sel: GeoJSON = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { name: "Park" },
    }
    const { container } = render(
      <GeojsonEditorProvider value={sel} selection={[]} onChange={onChange}>
        <PropertiesGrid />
      </GeojsonEditorProvider>,
    )
    const valueInput = container.querySelectorAll("input")[1] as HTMLInputElement
    fireEvent.change(valueInput, { target: { value: "Plaza" } })
    fireEvent.blur(valueInput)
    expect(onChange).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm test tests/geojson-editor.test.tsx -t PropertiesGrid`
Expected: FAIL — `PropertiesGrid` not exported.

- [ ] **Step 3: Implement PropertiesGrid**

Replace `views/properties-grid.tsx`:
```tsx
"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getAtPath } from "../geojson-editor.helpers"
import { useGeojsonEditorContext } from "../context"
import type { GeojsonPath, Json } from "../geojson-editor.types"

// Coerce a raw input string to a JSON scalar (number / boolean / null / string).
function coerce(raw: string): Json {
  if (raw === "true") return true
  if (raw === "false") return false
  if (raw === "null") return null
  if (raw.trim() !== "" && !Number.isNaN(Number(raw))) return Number(raw)
  return raw
}

function featurePath(selection: GeojsonPath | null, value: unknown): GeojsonPath | null {
  if (selection === null) return (value as { type?: string })?.type === "Feature" ? [] : null
  const at = getAtPath(value, selection) as { type?: string } | undefined
  return at?.type === "Feature" ? selection : null
}

export function PropertiesGrid({ className }: { className?: string }) {
  const { value, selection, setProperty } = useGeojsonEditorContext()
  const fPath = featurePath(selection, value)
  if (fPath === null) return null
  const props = (getAtPath(value, [...fPath, "properties"]) as Record<string, Json> | null) ?? {}
  const entries = Object.entries(props)

  return (
    <div data-slot="properties-grid" className={cn("flex flex-col gap-1 p-2", className)}>
      <span className="text-xs text-muted-foreground">properties</span>
      {entries.map(([key, val]) => (
        <div key={key} className="flex gap-1.5">
          <Input readOnly value={key} aria-label={`property ${key} key`} className="w-28 h-7 font-mono text-xs" />
          <PropValue
            initial={String(val)}
            label={`property ${key} value`}
            onCommit={(next) => setProperty(fPath, key, coerce(next))}
          />
        </div>
      ))}
      <AddProperty onAdd={(key) => setProperty(fPath, key, "")} />
    </div>
  )
}

function PropValue({
  initial,
  label,
  onCommit,
}: {
  initial: string
  label: string
  onCommit: (next: string) => void
}) {
  const [draft, setDraft] = React.useState<string | null>(null)
  return (
    <Input
      aria-label={label}
      value={draft ?? initial}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={(e) => {
        setDraft(null)
        if (e.target.value !== initial) onCommit(e.target.value)
      }}
      className="flex-1 h-7 font-mono text-xs"
    />
  )
}

function AddProperty({ onAdd }: { onAdd: (key: string) => void }) {
  const [key, setKey] = React.useState("")
  return (
    <form
      className="flex gap-1.5"
      onSubmit={(e) => {
        e.preventDefault()
        if (key.trim()) {
          onAdd(key.trim())
          setKey("")
        }
      }}
    >
      <Input
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="+ add property"
        aria-label="new property key"
        className="w-28 h-7 font-mono text-xs"
      />
    </form>
  )
}
```

> MVP note: values are scalar (string/number/boolean/null) via `coerce`. Nested object/array property editing is a follow-up (edit those in the raw pane).

Append to `index.ts`:
```ts
export { PropertiesGrid } from "./views/properties-grid"
```

- [ ] **Step 4: Run test + typecheck**

Run: `pnpm test tests/geojson-editor.test.tsx -t PropertiesGrid && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/geojson-editor/views/properties-grid.tsx \
  src/components/ui/geojson-editor/index.ts tests/geojson-editor.test.tsx
git commit -m "Add PropertiesGrid view (scalar key/value editor + add)"
```

---

## Phase 6 — Presets + top-level component

### Task 12: Presets + generic GeojsonEditor

**Files:** Modify `presets/{drill-down,dual-pane,toggle}.tsx`, `geojson-editor.tsx`, `index.ts`. Modify `tests/geojson-editor.test.tsx`.

- [ ] **Step 1: Write failing test**

Append to `tests/geojson-editor.test.tsx`:
```tsx
import { GeojsonEditor } from "@/components/ui/geojson-editor"

describe("GeojsonEditor presets", () => {
  it("renders the drill-down preset by default with a feature tree + raw pane", () => {
    const { container } = render(<GeojsonEditor value={fc} onChange={() => {}} />)
    expect(container.querySelector('[data-slot="feature-tree"]')).toBeTruthy()
    expect(container.querySelector('[data-slot="raw-json-pane"]')).toBeTruthy()
  })

  it("renders the dual-pane preset", () => {
    const { container } = render(<GeojsonEditor value={fc} variant="dual-pane" onChange={() => {}} />)
    expect(container.querySelector('[data-slot="raw-json-pane"]')).toBeTruthy()
  })

  it("toggle preset switches between guided and raw", () => {
    const { getByText, container } = render(
      <GeojsonEditor value={fc} variant="toggle" onChange={() => {}} />,
    )
    getByText("Raw").click()
    expect(container.querySelector('[data-slot="raw-json-pane"]')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm test tests/geojson-editor.test.tsx -t presets`
Expected: FAIL — `GeojsonEditor` not exported.

- [ ] **Step 3: Implement the three presets**

Replace `presets/drill-down.tsx`:
```tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ErrorRail } from "../views/error-rail"
import { FeatureTree } from "../views/feature-tree"
import { GeometryFields } from "../views/geometry-fields"
import { PropertiesGrid } from "../views/properties-grid"
import { RawJsonPane } from "../views/raw-json-pane"

export function DrillDown({ className, lockGeometryType }: { className?: string; lockGeometryType?: boolean }) {
  const [rawOpen, setRawOpen] = React.useState(false)
  return (
    <div data-slot="preset-drill-down" className={cn("flex flex-col gap-2 rounded-lg border border-input p-2", className)}>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setRawOpen((o) => !o)}
          className="text-xs rounded-md border border-input px-2 py-1 text-muted-foreground hover:bg-muted/50"
        >
          {rawOpen ? "Hide raw" : "Raw"}
        </button>
      </div>
      <FeatureTree />
      <GeometryFields lockGeometryType={lockGeometryType} />
      <PropertiesGrid />
      {rawOpen && <RawJsonPane />}
      <ErrorRail />
    </div>
  )
}
```

Replace `presets/dual-pane.tsx`:
```tsx
"use client"

import { cn } from "@/lib/utils"
import { ErrorRail } from "../views/error-rail"
import { FeatureTree } from "../views/feature-tree"
import { GeometryFields } from "../views/geometry-fields"
import { PropertiesGrid } from "../views/properties-grid"
import { RawJsonPane } from "../views/raw-json-pane"

export function DualPane({ className, lockGeometryType }: { className?: string; lockGeometryType?: boolean }) {
  return (
    <div data-slot="preset-dual-pane" className={cn("flex flex-col gap-2 rounded-lg border border-input p-2", className)}>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          <FeatureTree />
          <GeometryFields lockGeometryType={lockGeometryType} />
          <PropertiesGrid />
        </div>
        <RawJsonPane />
      </div>
      <ErrorRail />
    </div>
  )
}
```

Replace `presets/toggle.tsx`:
```tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ErrorRail } from "../views/error-rail"
import { FeatureTree } from "../views/feature-tree"
import { GeometryFields } from "../views/geometry-fields"
import { PropertiesGrid } from "../views/properties-grid"
import { RawJsonPane } from "../views/raw-json-pane"

export function Toggle({ className, lockGeometryType }: { className?: string; lockGeometryType?: boolean }) {
  const [mode, setMode] = React.useState<"guided" | "raw">("guided")
  return (
    <div data-slot="preset-toggle" className={cn("flex flex-col gap-2 rounded-lg border border-input p-2", className)}>
      <div className="inline-flex self-start rounded-md border border-input overflow-hidden text-xs">
        {(["guided", "raw"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn("px-3 py-1 capitalize", mode === m ? "bg-muted" : "text-muted-foreground")}
          >
            {m === "guided" ? "Guided" : "Raw"}
          </button>
        ))}
      </div>
      {mode === "guided" ? (
        <>
          <FeatureTree />
          <GeometryFields lockGeometryType={lockGeometryType} />
          <PropertiesGrid />
        </>
      ) : (
        <RawJsonPane />
      )}
      <ErrorRail />
    </div>
  )
}
```

- [ ] **Step 4: Add the generic top-level component**

Append to `geojson-editor.tsx`:
```tsx
import { DrillDown } from "./presets/drill-down"
import { DualPane } from "./presets/dual-pane"
import { Toggle } from "./presets/toggle"

export type GeojsonEditorVariant = "drill-down" | "dual-pane" | "toggle"

export interface GeojsonEditorProps<V extends GeoJSON = GeoJSON> {
  value: V
  onChange: (value: V) => void
  variant?: GeojsonEditorVariant
  selection?: GeojsonPath
  onSelectionChange?: (path: GeojsonPath | null) => void
  // Lock the geometry-type switcher (set when V is narrowed, e.g.
  // Feature<Polygon>, so onChange(V) stays sound). Defaults false.
  lockGeometryType?: boolean
  className?: string
}

export function GeojsonEditor<V extends GeoJSON = GeoJSON>({
  value,
  onChange,
  variant = "drill-down",
  selection,
  onSelectionChange,
  lockGeometryType,
  className,
}: GeojsonEditorProps<V>) {
  const Preset = variant === "dual-pane" ? DualPane : variant === "toggle" ? Toggle : DrillDown
  return (
    <GeojsonEditorProvider
      value={value}
      onChange={onChange}
      selection={selection}
      onSelectionChange={onSelectionChange}
    >
      <Preset className={className} lockGeometryType={lockGeometryType} />
    </GeojsonEditorProvider>
  )
}
```

Append to `index.ts`:
```ts
export { DrillDown } from "./presets/drill-down"
export { DualPane } from "./presets/dual-pane"
export { Toggle } from "./presets/toggle"
export { GeojsonEditor } from "./geojson-editor"
export type { GeojsonEditorProps, GeojsonEditorVariant } from "./geojson-editor"
```

- [ ] **Step 5: Run the full geojson-editor suite + typecheck + lint**

Run: `pnpm test tests/geojson-editor.test.tsx && pnpm typecheck && pnpm check`
Expected: PASS for all.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/geojson-editor/presets/ \
  src/components/ui/geojson-editor/geojson-editor.tsx \
  src/components/ui/geojson-editor/index.ts tests/geojson-editor.test.tsx
git commit -m "$(cat <<'EOF'
Add geojson-editor presets + generic top-level component

DrillDown / DualPane / Toggle arrange the view parts around one
provider (each < 35 lines). Generic <GeojsonEditor<V>> picks a preset
by variant and threads lockGeometryType for narrowed-value soundness.
EOF
)"
```

---

## Phase 7 — Demo, registry, nav

### Task 13: Examples + page + MPA

**Files:** Create `src/examples/geojson-editor/*`, `src/pages/geojson-editor/page.tsx`, `pages/geojson-editor/*`. Modify `vite.config.ts`.

- [ ] **Step 1: Create examples**

Create `src/examples/geojson-editor/basic-usage.tsx`:
```tsx
import * as React from "react"
import { GeojsonEditor } from "@/components/ui/geojson-editor"
import type { GeoJSON } from "@/components/ui/geojson-editor"

const seed: GeoJSON = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", geometry: { type: "Point", coordinates: [-122.42, 37.77] }, properties: { name: "SF" } },
  ],
}

export function BasicUsage() {
  const [value, setValue] = React.useState<GeoJSON>(seed)
  return <GeojsonEditor value={value} onChange={setValue} />
}
```

Create `src/examples/geojson-editor/tier-casual.tsx`:
```tsx
import * as React from "react"
import { GeojsonEditor } from "@/components/ui/geojson-editor"
import type { GeoJSON } from "@/components/ui/geojson-editor"

export function TierCasual() {
  const [value, setValue] = React.useState<GeoJSON>({ type: "Point", coordinates: [0, 0] })
  return <GeojsonEditor value={value} onChange={setValue} variant="toggle" />
}
```

Create `src/examples/geojson-editor/tier-intellisense.tsx`:
```tsx
import type { Feature, Polygon } from "@/components/ui/geojson-editor"

// The discriminated union narrows coordinates by the `type` tag.
const park: Feature<Polygon, { name: string }> = {
  type: "Feature",
  geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
  properties: { name: "Park" },
}

export function TierIntellisense() {
  return <pre className="text-xs">{JSON.stringify(park, null, 2)}</pre>
}
```

Create `src/examples/geojson-editor/tier-strict.tsx`:
```tsx
import { geojson } from "@/components/ui/geojson-editor"

const valid = geojson('{"type":"Point","coordinates":[-122.42,37.77]}')

export function TierStrict() {
  // @ts-expect-error — longitude 200 is out of range (caught at compile time)
  const invalid = geojson('{"type":"Point","coordinates":[200,0]}')
  void invalid
  return <pre className="text-xs">{valid}</pre>
}
```

Create `src/examples/geojson-editor/api-reference.tsx`:
```tsx
export function ApiReference() {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <h3>{"<GeojsonEditor<V> />"}</h3>
      <ul>
        <li><code>value: V</code> / <code>onChange(value: V)</code> — controlled, generic.</li>
        <li><code>variant?: "drill-down" | "dual-pane" | "toggle"</code> (default drill-down).</li>
        <li><code>selection?</code> / <code>onSelectionChange?</code> — <code>GeojsonPath</code> (map seam).</li>
        <li><code>lockGeometryType?</code> — disable the type switcher for a narrowed <code>V</code>.</li>
      </ul>
      <h3>Composition</h3>
      <p>
        Wrap <code>{"<GeojsonEditorProvider>"}</code> and drop in{" "}
        <code>FeatureTree</code>, <code>GeometryFields</code>,{" "}
        <code>PropertiesGrid</code>, <code>RawJsonPane</code>,{" "}
        <code>ErrorRail</code> — or a <code>{"<MapView>"}</code> reading{" "}
        <code>useGeojsonEditorContext()</code>.
      </p>
      <h3>Strict helper</h3>
      <p><code>geojson("…")</code> validates compact canonical GeoJSON geometry strings at the type level.</p>
    </div>
  )
}
```

Create `src/examples/geojson-editor/live-preview.tsx`:
```tsx
import * as React from "react"
import { GeojsonEditor } from "@/components/ui/geojson-editor"
import type { GeoJSON } from "@/components/ui/geojson-editor"

const seed: GeoJSON = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", geometry: { type: "Polygon", coordinates: [[[-122.43, 37.76], [-122.40, 37.76], [-122.40, 37.78], [-122.43, 37.76]]] }, properties: { name: "Dolores Park" } },
  ],
}

export function LivePreview() {
  const [value, setValue] = React.useState<GeoJSON>(seed)
  const [variant, setVariant] = React.useState<"drill-down" | "dual-pane" | "toggle">("drill-down")
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 text-xs">
        {(["drill-down", "dual-pane", "toggle"] as const).map((v) => (
          <button key={v} type="button" onClick={() => setVariant(v)} className="rounded-md border border-input px-2 py-1">
            {v}
          </button>
        ))}
      </div>
      <GeojsonEditor value={value} onChange={setValue} variant={variant} />
      {/* Map seam: a <MapView> reading useGeojsonEditorContext() would mount here. */}
    </div>
  )
}
```

- [ ] **Step 2: Create the page + MPA entry**

Mirror `src/pages/coordinate-input/page.tsx` (built in the coordinate-input plan): a `SectionHeader` per example, mount all six examples, `InstallCta args="add https://turtiesocks.github.io/ridiculous/r/geojson-editor.json"`, default export. Copy the MPA pair:
```bash
mkdir -p pages/geojson-editor
cp pages/coordinate-input/main.tsx pages/geojson-editor/main.tsx
cp pages/coordinate-input/index.html pages/geojson-editor/index.html
```
Edit `pages/geojson-editor/main.tsx` to import `@/pages/geojson-editor/page`; set the `index.html` title to `GeoJSON Editor — ridiculous`.

- [ ] **Step 3: Register the MPA input**

In `vite.config.ts`, add `"geojson-editor"` to the MPA inputs map.

- [ ] **Step 4: Verify in the browser**

Run `pnpm dev`, open `http://localhost:5173/ridiculous/geojson-editor/`. Confirm all three presets render, editing a coordinate updates the raw pane, invalid raw text shows an error and keeps the text, and the strict example compiles. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/examples/geojson-editor/ src/pages/geojson-editor/ \
  pages/geojson-editor/ vite.config.ts
git commit -m "Add geojson-editor examples, page, and MPA entry"
```

---

### Task 14: registry, icon, coverage, README, final verification

**Files:** Modify `registry.json`, `src/components/layout/component-icons.ts`, `vitest.config.ts`, `README.md`.

- [ ] **Step 1: Add the registry item**

In `registry.json`, add a `geojson-editor` `registry:ui` item:
- `title: "GeoJSON Editor"`, a 1–2 sentence `description`.
- `registryDependencies`: `["https://turtiesocks.github.io/ridiculous/r/coordinate-input.json", "https://turtiesocks.github.io/ridiculous/r/ridiculous-type-kit.json", "button", "input", "label", "select", "popover"]`.
- `files`: every file under `src/components/ui/geojson-editor/**` (types, helpers, constants, context, use-geojson-editor, geojson-editor, the 5 `views/*`, the 3 `presets/*`, index) each `type: "registry:ui"` with the matching `target`.

Add `geojson-editor.json` to the `all` bundle and refresh its description.

- [ ] **Step 2: Add the icon**

In `src/components/layout/component-icons.ts`, import `Map` from `lucide-react` (alphabetical) and add `"geojson-editor": Map` to `COMPONENT_ICONS`.

- [ ] **Step 3: Extend coverage**

In `vitest.config.ts`, add `"src/components/ui/geojson-editor/**"` to `coverage.include`.

- [ ] **Step 4: Update README**

Add a GeoJSON Editor bullet to the README Components list.

- [ ] **Step 5: Build + full verification**

Run:
```bash
pnpm nav:build
pnpm registry:build
pnpm typecheck && pnpm check && pnpm test
```
Expected: nav + `public/r/geojson-editor.json` generated (gitignored — do not commit); typecheck, lint, and the full test suite PASS. The icon-map test passes with both new entries.

- [ ] **Step 6: Commit**

```bash
git add registry.json src/components/layout/component-icons.ts \
  vitest.config.ts README.md
git commit -m "$(cat <<'EOF'
Register geojson-editor (registry, icon, coverage, README)

Adds the geojson-editor registry:ui item (deps: coordinate-input,
ridiculous-type-kit, shadcn bases) + the all-bundle entry, a Map icon
mapping, the coverage include glob, and the README Components bullet.
EOF
)"
```

---

## Self-review checklist (run before handoff)

- [ ] **Spec coverage:** structural types + generics (§4.1, §9.17–18) ✓ T2; strict geometry-deep parser (§3) ✓ T3; runtime parse/validate errors+warnings (§5) ✓ T4; format + foreign-member preservation + path/fixes/blanks (§5) ✓ T5; headless core + sync + undo + context (§4) ✓ T6; ErrorRail/RawJsonPane/FeatureTree/GeometryFields/PropertiesGrid (§6.2) ✓ T7–11; presets + generic component + lockGeometryType (§6.3–6.4, §9.17) ✓ T12; map seam (§6.5) ✓ provider + selection + live-preview note; examples/page (§7) ✓ T13; registry/icon/coverage (§7) ✓ T14.
- [ ] **Deferrals are explicit, not silent:** vertex/ring grid, nested property values, line-numbers/⌘K, virtualization — each flagged inline + in the file map (matches spec "OUT v1 / seam left").
- [ ] **Type consistency:** `GeojsonEditorStore`, `GeojsonPath`, `GeojsonError`, `useGeojsonEditor`, `useGeojsonEditorContext`, `GeojsonEditorProvider`, `GeojsonEditor`, `parseGeojson`, `validateGeojson`, `formatGeojson`, `getAtPath`, `setAtPath`, `closeRing`, `reverseRing`, `blankGeometry`, `blankFeature`, `GEOMETRY_TYPES`, `COORD_DEPTH`, view names — identical across all tasks + `index.ts`.
- [ ] **No placeholders:** every code step is complete; page steps reference the concrete coordinate-input page to mirror (no invented layout imports).
- [ ] **Strict-tier honesty:** the scope note + type tests agree (geometry-deep; FeatureCollection tag-only; runtime is source of truth).
