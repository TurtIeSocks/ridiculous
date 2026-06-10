import { describe, expect, it } from "vitest"
import {
  clampLat,
  clampLon,
  formatCoordinate,
  parseCoordinate,
} from "@/components/ui/coordinate-input"

describe("parseCoordinate", () => {
  it("parses a 2-axis string", () => {
    expect(parseCoordinate("-122.42, 37.77")).toEqual([-122.42, 37.77])
  })
  it("parses a 3-axis string", () => {
    expect(parseCoordinate("1, 2, 3")).toEqual([1, 2, 3])
  })
  it("returns null on non-numeric parts", () => {
    expect(parseCoordinate("a, 2")).toBeNull()
  })
  it("returns null on wrong arity", () => {
    expect(parseCoordinate("1")).toBeNull()
    expect(parseCoordinate("1, 2, 3, 4")).toBeNull()
  })
})

describe("formatCoordinate", () => {
  it("joins with comma-space", () => {
    expect(formatCoordinate([-122.42, 37.77])).toBe("-122.42, 37.77")
  })
})

describe("clamp", () => {
  it("clamps longitude to ±180", () => {
    expect(clampLon(200)).toBe(180)
    expect(clampLon(-200)).toBe(-180)
    expect(clampLon(45)).toBe(45)
  })
  it("clamps latitude to ±90", () => {
    expect(clampLat(91)).toBe(90)
    expect(clampLat(-91)).toBe(-90)
  })
})
