import { describe, expect, it } from "vitest"
import {
  parseGradient,
  parseInterpolation,
  parseStop,
  splitTopLevelCommas,
} from "@/components/ui/gradient-editor/gradient-editor.helpers"

describe("splitTopLevelCommas", () => {
  it("splits a flat list", () => {
    expect(splitTopLevelCommas("a, b, c")).toEqual(["a", "b", "c"])
  })
  it("does NOT split commas inside parens", () => {
    expect(
      splitTopLevelCommas("rgb(1, 2, 3), oklch(0.5 0.1 240 / 50%)"),
    ).toEqual(["rgb(1, 2, 3)", "oklch(0.5 0.1 240 / 50%)"])
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

describe("parseGradient — linear", () => {
  it("parses basic linear-gradient with two stops", () => {
    const parsed = parseGradient("linear-gradient(#ff0000, #0000ff)")
    expect(parsed?.type).toBe("linear")
    expect(parsed?.stops).toHaveLength(2)
    expect(parsed?.angle).toBe(180) // CSS default = to bottom = 180deg
    expect(parsed?.interpolation.space).toBe("srgb")
  })
  it("parses linear-gradient with angle", () => {
    const parsed = parseGradient("linear-gradient(45deg, #ff0000, #0000ff)")
    expect(parsed?.angle).toBe(45)
  })
  it("parses linear-gradient with `to right`", () => {
    const parsed = parseGradient("linear-gradient(to right, #ff0000, #0000ff)")
    expect(parsed?.angle).toBe(90)
  })
  it("parses linear-gradient with interpolation clause", () => {
    const parsed = parseGradient("linear-gradient(in oklch, #ff0000, #0000ff)")
    expect(parsed?.interpolation).toEqual({
      space: "oklch",
      hueMethod: undefined,
    })
  })
  it("parses linear-gradient with hue method", () => {
    const parsed = parseGradient(
      "linear-gradient(in oklch longer hue, #ff0000, #0000ff)",
    )
    expect(parsed?.interpolation).toEqual({
      space: "oklch",
      hueMethod: "longer",
    })
  })
  it("auto-distributes positions when stops omit them", () => {
    const parsed = parseGradient("linear-gradient(#ff0000, #00ff00, #0000ff)")
    expect(parsed?.stops.map((s) => s.position)).toEqual([0, 50, 100])
  })
  it("handles balanced-paren stops (oklch with alpha)", () => {
    const parsed = parseGradient(
      "linear-gradient(rgb(255, 0, 0), oklch(0.5 0.1 240 / 50%))",
    )
    expect(parsed?.stops).toHaveLength(2)
    expect(parsed?.stops[0].color).toBe("rgb(255, 0, 0)")
    expect(parsed?.stops[1].color).toBe("oklch(0.5 0.1 240 / 50%)")
  })
})

describe("parseGradient — radial", () => {
  it("parses basic radial-gradient", () => {
    const parsed = parseGradient("radial-gradient(#ff0000, #0000ff)")
    expect(parsed?.type).toBe("radial")
    expect(parsed?.shape).toBe("ellipse") // CSS default
    expect(parsed?.size).toBe("farthest-corner")
    expect(parsed?.position).toEqual({ x: 50, y: 50 })
  })
  it("parses radial-gradient with shape + size + position", () => {
    const parsed = parseGradient(
      "radial-gradient(circle closest-side at 20% 30%, #ff0000, #0000ff)",
    )
    expect(parsed?.shape).toBe("circle")
    expect(parsed?.size).toBe("closest-side")
    expect(parsed?.position).toEqual({ x: 20, y: 30 })
  })
})

describe("parseGradient — conic", () => {
  it("parses basic conic-gradient", () => {
    const parsed = parseGradient("conic-gradient(#ff0000, #0000ff)")
    expect(parsed?.type).toBe("conic")
    expect(parsed?.fromAngle).toBe(0)
    expect(parsed?.position).toEqual({ x: 50, y: 50 })
  })
  it("parses conic-gradient with from + at", () => {
    const parsed = parseGradient(
      "conic-gradient(from 90deg at 25% 75%, #ff0000, #0000ff)",
    )
    expect(parsed?.fromAngle).toBe(90)
    expect(parsed?.position).toEqual({ x: 25, y: 75 })
  })
})

describe("parseGradient — edge cases", () => {
  it("returns null for unrecognized prefix", () => {
    expect(parseGradient("not-a-gradient(#ff0000, #0000ff)")).toBeNull()
  })
  it("returns null for single-stop gradient", () => {
    expect(parseGradient("linear-gradient(red)")).toBeNull()
  })
  it("returns null when a stop fails to parse", () => {
    expect(parseGradient("linear-gradient(not-a-color, blue)")).toBeNull()
  })
})
