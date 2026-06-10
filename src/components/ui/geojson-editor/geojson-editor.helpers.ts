import type { GeometryType } from "./geojson-editor.constants"
import { COORD_DEPTH, GEOMETRY_TYPES } from "./geojson-editor.constants"
import type {
  Feature,
  GeoJSON,
  GeojsonError,
  GeojsonPath,
  Geometry,
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
    out.push(
      err(
        path,
        "A position must be [lon, lat] or [lon, lat, elevation].",
        "position-arity",
      ),
    )
    return
  }
  const [lon, lat] = v
  if (typeof lon !== "number" || lon < -180 || lon > 180)
    out.push(
      err(
        [...path, 0],
        `Longitude ${String(lon)} must be between -180 and 180.`,
        "lon-out-of-range",
      ),
    )
  if (typeof lat !== "number" || lat < -90 || lat > 90)
    out.push(
      err(
        [...path, 1],
        `Latitude ${String(lat)} must be between -90 and 90.`,
        "lat-out-of-range",
      ),
    )
}

function eachPosition(arr: unknown, path: GeojsonPath, out: GeojsonError[]) {
  if (!Array.isArray(arr)) {
    out.push(err(path, "Expected an array of positions.", "coords-shape"))
    return
  }
  for (let i = 0; i < arr.length; i++) {
    validatePosition(arr[i], [...path, i], out)
  }
}

function validateRing(ring: unknown, path: GeojsonPath, out: GeojsonError[]) {
  if (!Array.isArray(ring)) {
    out.push(
      err(path, "A polygon ring needs at least 4 positions.", "ring-too-short"),
    )
    return
  }
  for (let i = 0; i < ring.length; i++) {
    validatePosition(ring[i], [...path, i], out)
  }
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (ring.length < 2 || JSON.stringify(first) !== JSON.stringify(last)) {
    out.push(
      err(
        path,
        "Polygon ring isn't closed — the first and last point must match.",
        "ring-not-closed",
      ),
    )
    return
  }
  if (ring.length < 4)
    out.push(
      err(path, "A polygon ring needs at least 4 positions.", "ring-too-short"),
    )
  else if (signedArea(ring as Position[]) < 0)
    out.push(
      warn(
        path,
        "Ring winds clockwise; GeoJSON prefers counter-clockwise (right-hand rule).",
        "winding-order",
      ),
    )
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
    out.push(
      err(
        [...path, "type"],
        `Unknown geometry type "${String(type)}".`,
        "unknown-type",
      ),
    )
    return
  }
  if (type === "GeometryCollection") {
    if (!Array.isArray(g.geometries))
      out.push(
        err(
          [...path, "geometries"],
          "GeometryCollection needs a geometries array.",
          "coords-shape",
        ),
      )
    else {
      for (let i = 0; i < g.geometries.length; i++) {
        validateGeometry(g.geometries[i], [...path, "geometries", i], out)
      }
    }
    return
  }
  const coords = g.coordinates
  const cp: GeojsonPath = [...path, "coordinates"]
  const depth = COORD_DEPTH[type as keyof typeof COORD_DEPTH]
  if (type === "Point") validatePosition(coords, cp, out)
  else if (depth === 2) eachPosition(coords, cp, out)
  else if (type === "Polygon") {
    if (!Array.isArray(coords))
      out.push(err(cp, "Expected an array of rings.", "coords-shape"))
    else {
      for (let i = 0; i < coords.length; i++) {
        validateRing(coords[i], [...cp, i], out)
      }
    }
  } else if (type === "MultiLineString") {
    if (!Array.isArray(coords))
      out.push(err(cp, "Expected an array of lines.", "coords-shape"))
    else {
      for (let i = 0; i < coords.length; i++) {
        eachPosition(coords[i], [...cp, i], out)
      }
    }
  } else if (type === "MultiPolygon") {
    if (!Array.isArray(coords))
      out.push(err(cp, "Expected an array of polygons.", "coords-shape"))
    else {
      for (let i = 0; i < coords.length; i++) {
        const poly = coords[i]
        if (!Array.isArray(poly))
          out.push(
            err([...cp, i], "Expected an array of rings.", "coords-shape"),
          )
        else {
          for (let j = 0; j < poly.length; j++) {
            validateRing(poly[j], [...cp, i, j], out)
          }
        }
      }
    }
  }
}

export function validateGeojson(value: unknown): GeojsonError[] {
  const out: GeojsonError[] = []
  if (!isObject(value)) {
    out.push(err([], "GeoJSON must be an object.", "not-object"))
    return out
  }
  if (value.crs !== undefined)
    out.push(
      warn(
        ["crs"],
        "The crs member is deprecated; GeoJSON is always WGS84.",
        "crs-deprecated",
      ),
    )
  const type = value.type
  if (type === "FeatureCollection") {
    if (!Array.isArray(value.features))
      out.push(
        err(
          ["features"],
          "FeatureCollection needs a features array.",
          "coords-shape",
        ),
      )
    else {
      for (let i = 0; i < value.features.length; i++) {
        validateFeature(value.features[i], ["features", i], out)
      }
    }
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
  if (f.geometry !== null)
    validateGeometry(f.geometry, [...path, "geometry"], out)
  if (f.properties !== null && !isObject(f.properties))
    out.push(
      err(
        [...path, "properties"],
        "Feature properties must be an object or null.",
        "bad-properties",
      ),
    )
}

// JSON.stringify already preserves unknown keys; indent is the only knob.
// (Key ordering follows insertion order, which keeps known + foreign keys.)
export function formatGeojson(
  value: GeoJSON,
  opts?: { indent?: number },
): string {
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
  const clone = (
    Array.isArray(value)
      ? [...(value as unknown[])]
      : { ...(value as Record<string, unknown>) }
  ) as Record<string | number, unknown>
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
      return {
        type,
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      }
    case "MultiLineString":
      return {
        type,
        coordinates: [
          [
            [0, 0],
            [1, 1],
          ],
        ],
      }
    case "Polygon":
      return {
        type,
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 0],
          ],
        ],
      }
    case "MultiPolygon":
      return {
        type,
        coordinates: [
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 0],
            ],
          ],
        ],
      }
    case "GeometryCollection":
      return { type, geometries: [] }
  }
}

export function blankFeature(): Feature {
  return { type: "Feature", geometry: blankGeometry("Point"), properties: {} }
}
