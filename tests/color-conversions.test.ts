import { describe, expect, it } from "vitest"
import {
  clamp01,
  parseAlphaToken,
  trimNumber,
} from "@/components/ui/color-picker/color-picker.helpers"

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
} from "@/components/ui/color-picker/color-picker.helpers"

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

import { hslToSrgb, srgbToHsl } from "@/components/ui/color-picker/color-picker.helpers"

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

import {
  oklchToSrgb,
  srgbToOklch,
} from "@/components/ui/color-picker/color-picker.helpers"

describe("oklchToSrgb / srgbToOklch", () => {
  it("round-trips a few sRGB colors", () => {
    const samples = [
      { r: 1, g: 0, b: 0 },
      { r: 0, g: 1, b: 0 },
      { r: 0, g: 0, b: 1 },
      { r: 0.5, g: 0.25, b: 0.75 },
    ]
    for (const { r, g, b } of samples) {
      const oklch = srgbToOklch(r, g, b, 1)
      const [r2, g2, b2] = oklchToSrgb(oklch.l, oklch.c, oklch.h)
      expect(r2).toBeCloseTo(r, 3)
      expect(g2).toBeCloseTo(g, 3)
      expect(b2).toBeCloseTo(b, 3)
    }
  })
  it("returns gray for desaturated input (C ≈ 0)", () => {
    const oklch = srgbToOklch(0.5, 0.5, 0.5, 1)
    expect(oklch.c).toBeCloseTo(0, 3)
  })
})

import {
  oklabToOklch,
  oklchToOklab,
} from "@/components/ui/color-picker/color-picker.helpers"

describe("oklch ↔ oklab", () => {
  it("round-trips polar/cartesian", () => {
    const oklab = oklchToOklab(0.5, 0.18, 240)
    const back = oklabToOklch(oklab.l, oklab.a, oklab.b)
    expect(back.l).toBeCloseTo(0.5, 6)
    expect(back.c).toBeCloseTo(0.18, 6)
    expect(back.h).toBeCloseTo(240, 4)
  })
  it("h=0 → a=c, b=0", () => {
    const oklab = oklchToOklab(0.5, 0.1, 0)
    expect(oklab.a).toBeCloseTo(0.1, 6)
    expect(oklab.b).toBeCloseTo(0, 6)
  })
})

import { hwbToSrgb, srgbToHwb } from "@/components/ui/color-picker/color-picker.helpers"

describe("hwbToSrgb / srgbToHwb", () => {
  it("round-trips pure red", () => {
    const srgb = hwbToSrgb(0, 0, 0)
    expect(srgb.r).toBeCloseTo(1, 6)
    expect(srgb.g).toBeCloseTo(0, 6)
    expect(srgb.b).toBeCloseTo(0, 6)
    const hwb = srgbToHwb(srgb.r, srgb.g, srgb.b)
    expect(hwb.h).toBeCloseTo(0, 4)
    expect(hwb.w).toBeCloseTo(0, 4)
    expect(hwb.b).toBeCloseTo(0, 4)
  })
  it("W=1 yields white regardless of hue", () => {
    const srgb = hwbToSrgb(240, 1, 0)
    expect(srgb.r).toBeCloseTo(1, 4)
    expect(srgb.g).toBeCloseTo(1, 4)
    expect(srgb.b).toBeCloseTo(1, 4)
  })
  it("B=1 yields black regardless of hue", () => {
    const srgb = hwbToSrgb(240, 0, 1)
    expect(srgb.r).toBeCloseTo(0, 4)
    expect(srgb.g).toBeCloseTo(0, 4)
    expect(srgb.b).toBeCloseTo(0, 4)
  })
})
