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
      geometry: {
        type: "Point" as const,
        coordinates: [1, 2] as [number, number],
      },
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
    const v = {
      type: "FeatureCollection",
      features: [{ type: "Feature", geometry: null, properties: null }],
    }
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
    expect(
      closeRing([
        [0, 0],
        [1, 0],
        [1, 1],
      ]),
    ).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
    ])
  })
  it("reverseRing reverses point order", () => {
    expect(
      reverseRing([
        [0, 0],
        [1, 0],
        [0, 0],
      ]),
    ).toEqual(
      [
        [0, 0],
        [1, 0],
        [0, 0],
      ].reverse(),
    )
  })
})

describe("blankGeometry", () => {
  it("seeds a Point at origin", () => {
    expect(blankGeometry("Point")).toEqual({
      type: "Point",
      coordinates: [0, 0],
    })
  })
  it("seeds a closed Polygon", () => {
    const g = blankGeometry("Polygon") as { coordinates: number[][][] }
    expect(g.coordinates[0][0]).toEqual(
      g.coordinates[0][g.coordinates[0].length - 1],
    )
  })
})
