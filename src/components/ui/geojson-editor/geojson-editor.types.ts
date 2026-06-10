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

// =====================================================================
// STRICT STRING TIER — type-parse compact canonical GeoJSON. Geometry-deep
// (see plan "Strict-tier scope note"). Reuses coordinate-input lon/lat +
// kit digit machinery.
// =====================================================================

import type { IsLatitude, IsLongitude } from "@/components/ui/coordinate-input"
import type { And, IsNumber, KeepIf, Trim } from "@/lib/ridiculous-type-kit"

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
export type PositionLiteral<S extends string> =
  IsPositionStr<S> extends true ? S : never
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
type PositionArray<
  S extends string,
  Min extends "any" | "2",
> = S extends `[${infer Inner}]`
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
