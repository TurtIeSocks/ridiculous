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
