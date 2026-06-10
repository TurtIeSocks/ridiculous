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
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
        ],
      ],
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
      coordinates: [
        [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
      ], // clockwise
    })
    const w = errs.find((e) => e.code === "winding-order")
    expect(w?.severity).toBe("warning")
  })
})
