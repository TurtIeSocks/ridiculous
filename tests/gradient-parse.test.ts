import { describe, expect, it } from "vitest"
import {
  parseInterpolation,
  parseStop,
  splitTopLevelCommas,
} from "@/components/ui/gradient-editor/gradient-editor"

describe("splitTopLevelCommas", () => {
  it("splits a flat list", () => {
    expect(splitTopLevelCommas("a, b, c")).toEqual(["a", "b", "c"])
  })
  it("does NOT split commas inside parens", () => {
    expect(splitTopLevelCommas("rgb(1, 2, 3), oklch(0.5 0.1 240 / 50%)")).toEqual([
      "rgb(1, 2, 3)",
      "oklch(0.5 0.1 240 / 50%)",
    ])
  })
  it("handles nested parens", () => {
    expect(splitTopLevelCommas("calc(min(1px, 2px) + 3px), foo")).toEqual([
      "calc(min(1px, 2px) + 3px)",
      "foo",
    ])
  })
  it("trims whitespace around segments", () => {
    expect(splitTopLevelCommas("  a  ,  b  ")).toEqual(["a", "b"])
  })
  it("returns a single segment when no commas at top level", () => {
    expect(splitTopLevelCommas("rgb(1, 2, 3)")).toEqual(["rgb(1, 2, 3)"])
  })
  it("handles empty input", () => {
    expect(splitTopLevelCommas("")).toEqual([])
  })
})

describe("parseStop", () => {
  it("parses a hex stop without position", () => {
    expect(parseStop("#ff0000")).toEqual({ color: "#ff0000", position: null })
  })
  it("parses an rgb stop with position", () => {
    expect(parseStop("rgb(255 0 0) 50%")).toEqual({
      color: "rgb(255 0 0)",
      position: 50,
    })
  })
  it("parses an oklch stop with position", () => {
    expect(parseStop("oklch(0.5 0.1 240) 25%")).toEqual({
      color: "oklch(0.5 0.1 240)",
      position: 25,
    })
  })
  it("parses oklch with comma inside, treating last token as position", () => {
    expect(parseStop("oklch(0.5 0.1 240 / 50%) 75%")).toEqual({
      color: "oklch(0.5 0.1 240 / 50%)",
      position: 75,
    })
  })
  it("returns null for invalid stop", () => {
    expect(parseStop("not-a-color 50%")).toBeNull()
  })
})

describe("parseInterpolation", () => {
  it("parses `in oklch`", () => {
    expect(parseInterpolation("in oklch")).toEqual({
      space: "oklch",
      hueMethod: undefined,
    })
  })
  it("parses `in oklch longer hue`", () => {
    expect(parseInterpolation("in oklch longer hue")).toEqual({
      space: "oklch",
      hueMethod: "longer",
    })
  })
  it("parses `in srgb` (cartesian, no hue method)", () => {
    expect(parseInterpolation("in srgb")).toEqual({
      space: "srgb",
      hueMethod: undefined,
    })
  })
  it("returns null when prefix is missing", () => {
    expect(parseInterpolation("oklch")).toBeNull()
  })
  it("returns null for unknown space", () => {
    expect(parseInterpolation("in mystery")).toBeNull()
  })
})
