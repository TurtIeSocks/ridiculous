import { describe, expect, it } from "vitest"
import {
  formatGradient,
  formatInterpolation,
  formatStop,
  parseGradient,
} from "@/components/ui/gradient-editor/gradient-editor"

describe("formatStop", () => {
  it("emits color + integer percent", () => {
    expect(formatStop({ color: "#ff0000", position: 50 })).toBe("#ff0000 50%")
  })
  it("rounds fractional positions to integer", () => {
    expect(formatStop({ color: "#ff0000", position: 33.7 })).toBe("#ff0000 34%")
  })
})

describe("formatInterpolation", () => {
  it("returns empty string for default srgb (no hue method)", () => {
    expect(formatInterpolation({ space: "srgb" })).toBe("")
  })
  it("returns `in oklch, ` for non-default space", () => {
    expect(formatInterpolation({ space: "oklch" })).toBe("in oklch, ")
  })
  it("includes hue method for polar spaces", () => {
    expect(formatInterpolation({ space: "oklch", hueMethod: "longer" })).toBe(
      "in oklch longer hue, ",
    )
  })
  it("ignores hue method for cartesian (sRGB / oklab)", () => {
    expect(formatInterpolation({ space: "srgb", hueMethod: "longer" })).toBe("")
    expect(formatInterpolation({ space: "oklab", hueMethod: "longer" })).toBe(
      "in oklab, ",
    )
  })
})

describe("formatGradient", () => {
  it("emits linear with angle + stops", () => {
    expect(
      formatGradient({
        type: "linear",
        stops: [
          { color: "#ff0000", position: 0 },
          { color: "#0000ff", position: 100 },
        ],
        angle: 45,
        shape: "ellipse",
        size: "farthest-corner",
        position: { x: 50, y: 50 },
        fromAngle: 0,
        interpolation: { space: "srgb" },
      }),
    ).toBe("linear-gradient(45deg, #ff0000 0%, #0000ff 100%)")
  })

  it("emits radial with shape + size + position", () => {
    expect(
      formatGradient({
        type: "radial",
        stops: [
          { color: "#ff0000", position: 0 },
          { color: "#0000ff", position: 100 },
        ],
        angle: 180,
        shape: "circle",
        size: "closest-side",
        position: { x: 20, y: 30 },
        fromAngle: 0,
        interpolation: { space: "srgb" },
      }),
    ).toBe("radial-gradient(circle closest-side at 20% 30%, #ff0000 0%, #0000ff 100%)")
  })

  it("emits conic with from + at", () => {
    expect(
      formatGradient({
        type: "conic",
        stops: [
          { color: "#ff0000", position: 0 },
          { color: "#0000ff", position: 100 },
        ],
        angle: 180,
        shape: "ellipse",
        size: "farthest-corner",
        position: { x: 50, y: 50 },
        fromAngle: 90,
        interpolation: { space: "srgb" },
      }),
    ).toBe("conic-gradient(from 90deg at 50% 50%, #ff0000 0%, #0000ff 100%)")
  })

  it("prepends interpolation when not default srgb", () => {
    expect(
      formatGradient({
        type: "linear",
        stops: [
          { color: "#ff0000", position: 0 },
          { color: "#0000ff", position: 100 },
        ],
        angle: 90,
        shape: "ellipse",
        size: "farthest-corner",
        position: { x: 50, y: 50 },
        fromAngle: 0,
        interpolation: { space: "oklch" },
      }),
    ).toBe("linear-gradient(in oklch, 90deg, #ff0000 0%, #0000ff 100%)")
  })
})

describe("parseGradient + formatGradient round-trip", () => {
  it("round-trips a basic linear gradient", () => {
    const input = "linear-gradient(90deg, #ff0000 0%, #0000ff 100%)"
    const parsed = parseGradient(input)
    expect(parsed).not.toBeNull()
    expect(formatGradient(parsed!)).toBe(input)
  })

  it("round-trips with interpolation + hue method", () => {
    const input = "linear-gradient(in oklch longer hue, 90deg, #ff0000 0%, #0000ff 100%)"
    const parsed = parseGradient(input)
    expect(parsed).not.toBeNull()
    expect(formatGradient(parsed!)).toBe(input)
  })

  it("round-trips a radial", () => {
    const input = "radial-gradient(circle closest-side at 20% 30%, #ff0000 0%, #0000ff 100%)"
    const parsed = parseGradient(input)
    expect(parsed).not.toBeNull()
    expect(formatGradient(parsed!)).toBe(input)
  })
})
