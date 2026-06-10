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
export const COORD_DEPTH: Record<
  Exclude<GeometryType, "GeometryCollection">,
  number
> = {
  Point: 1,
  MultiPoint: 2,
  LineString: 2,
  MultiLineString: 3,
  Polygon: 3,
  MultiPolygon: 4,
}
