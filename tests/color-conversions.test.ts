import { describe, expect, it } from "vitest"
import {
  clamp01,
  parseAlphaToken,
  trimNumber,
} from "@/components/ui/color-picker/color-picker"

describe("clamp01", () => {
  it("returns 0 for negatives", () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(-0.0001)).toBe(0)
  })
  it("returns 1 for > 1", () => {
    expect(clamp01(1.5)).toBe(1)
    expect(clamp01(2)).toBe(1)
  })
  it("passes through 0..1", () => {
    expect(clamp01(0)).toBe(0)
    expect(clamp01(0.5)).toBe(0.5)
    expect(clamp01(1)).toBe(1)
  })
})

describe("trimNumber", () => {
  it("rounds to 4 decimals", () => {
    expect(trimNumber(0.123456789)).toBe(0.1235)
    expect(trimNumber(1)).toBe(1)
    expect(trimNumber(0)).toBe(0)
  })
})

describe("parseAlphaToken", () => {
  it("parses fractional 0..1", () => {
    expect(parseAlphaToken("0.5")).toBe(0.5)
    expect(parseAlphaToken("1")).toBe(1)
    expect(parseAlphaToken("0")).toBe(0)
  })
  it("parses percentages 0..100", () => {
    expect(parseAlphaToken("50%")).toBe(0.5)
    expect(parseAlphaToken("100%")).toBe(1)
    expect(parseAlphaToken("0%")).toBe(0)
  })
})

import {
  linearToSrgb,
  srgbToLinear,
} from "@/components/ui/color-picker/color-picker"

describe("linearToSrgb / srgbToLinear", () => {
  it("clamps below 0 and above 1", () => {
    expect(linearToSrgb(-0.5)).toBe(0)
    expect(linearToSrgb(1.5)).toBe(1)
    expect(srgbToLinear(-0.5)).toBe(0)
    expect(srgbToLinear(1.5)).toBe(1)
  })
  it("round-trips arbitrary values", () => {
    for (const v of [0.05, 0.1, 0.25, 0.5, 0.75, 0.9]) {
      expect(linearToSrgb(srgbToLinear(v))).toBeCloseTo(v, 6)
      expect(srgbToLinear(linearToSrgb(v))).toBeCloseTo(v, 6)
    }
  })
  it("matches IEC 61966-2-1 anchors", () => {
    expect(linearToSrgb(0.0031308)).toBeCloseTo(0.04045, 4)
    expect(srgbToLinear(0.04045)).toBeCloseTo(0.0031308, 6)
  })
})

import {
  hslToSrgb,
  srgbToHsl,
} from "@/components/ui/color-picker/color-picker"

describe("hslToSrgb / srgbToHsl", () => {
  it("round-trips pure red", () => {
    const rgb = hslToSrgb(0, 1, 0.5)
    expect(rgb.r).toBeCloseTo(1, 6)
    expect(rgb.g).toBeCloseTo(0, 6)
    expect(rgb.b).toBeCloseTo(0, 6)
    const hsl = srgbToHsl(rgb.r, rgb.g, rgb.b)
    expect(hsl.h).toBeCloseTo(0, 4)
    expect(hsl.s).toBeCloseTo(1, 4)
    expect(hsl.l).toBeCloseTo(0.5, 4)
  })
  it("handles grayscale (saturation = 0)", () => {
    const rgb = hslToSrgb(0, 0, 0.5)
    expect(rgb.r).toBeCloseTo(0.5, 6)
    expect(rgb.g).toBeCloseTo(0.5, 6)
    expect(rgb.b).toBeCloseTo(0.5, 6)
    const hsl = srgbToHsl(0.5, 0.5, 0.5)
    expect(hsl.h).toBe(0)
    expect(hsl.s).toBe(0)
    expect(hsl.l).toBe(0.5)
  })
  it("wraps hue 360 to 0", () => {
    const rgb = hslToSrgb(360, 1, 0.5)
    expect(rgb.r).toBeCloseTo(1, 6)
    expect(rgb.g).toBeCloseTo(0, 6)
    expect(rgb.b).toBeCloseTo(0, 6)
  })
})
