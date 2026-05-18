import { describe, expect, it } from "vitest"
import {
  formatInterpolation,
  formatStop,
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
