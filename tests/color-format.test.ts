import { describe, expect, it } from "vitest"
import {
  formatColor,
  formatHex,
  formatHsl,
  formatHwb,
  formatOklab,
  formatRgb,
} from "@/components/ui/color-picker/color-picker.helpers"

describe("formatHex", () => {
  it("emits 6-digit hex without alpha", () => {
    const oklch = { l: 0.628, c: 0.258, h: 29.234, a: 1 } // red-ish
    const hex = formatHex(oklch, false)
    expect(hex).toMatch(/^#[0-9a-f]{6}$/)
  })
  it("emits 8-digit hex with alpha", () => {
    const oklch = { l: 0.628, c: 0.258, h: 29.234, a: 0.5 }
    const hex = formatHex(oklch, true)
    expect(hex).toMatch(/^#[0-9a-f]{8}$/)
  })
})

describe("formatRgb", () => {
  it("emits rgb(...) without alpha when a >= 1", () => {
    expect(formatRgb({ l: 0.628, c: 0.258, h: 29.234, a: 1 })).toMatch(
      /^rgb\(\d+ \d+ \d+\)$/,
    )
  })
  it("emits rgb(... / x%) with alpha < 1", () => {
    expect(formatRgb({ l: 0.628, c: 0.258, h: 29.234, a: 0.5 })).toMatch(
      /^rgb\(\d+ \d+ \d+ \/ \d+%\)$/,
    )
  })
})

describe("formatHsl", () => {
  it("emits hsl(h s% l%)", () => {
    expect(formatHsl({ l: 0.5, c: 0.18, h: 0, a: 1 })).toMatch(
      /^hsl\(\d+ \d+% \d+%\)$/,
    )
  })
  it("emits alpha when a < 1", () => {
    expect(formatHsl({ l: 0.5, c: 0.18, h: 0, a: 0.5 })).toMatch(
      /^hsl\(\d+ \d+% \d+% \/ \d+%\)$/,
    )
  })
})

describe("formatOklab", () => {
  it("emits oklab(L a b)", () => {
    expect(formatOklab({ l: 0.5, c: 0.1, h: 0, a: 1 })).toMatch(
      /^oklab\(\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?\)$/,
    )
  })
  it("emits negative b for cool colors", () => {
    // h=240 → roughly negative b (blueward in oklab)
    expect(formatOklab({ l: 0.5, c: 0.18, h: 240, a: 1 })).toMatch(/-/)
  })
  it("emits alpha < 1", () => {
    expect(formatOklab({ l: 0.5, c: 0.1, h: 0, a: 0.5 })).toMatch(
      / \/ \d+(?:\.\d+)?%\)$/,
    )
  })
  it("emits fractional alpha for non-integer percent (precision preserved)", () => {
    expect(formatOklab({ l: 0.5, c: 0.1, h: 0, a: 0.5025 })).toMatch(
      /50\.25%\)$/,
    )
  })
})

describe("formatHwb", () => {
  it("emits hwb(H W% B%)", () => {
    expect(formatHwb({ l: 0.628, c: 0.258, h: 29.234, a: 1 })).toMatch(
      /^hwb\(\d+ \d+% \d+%\)$/,
    )
  })
  it("emits alpha", () => {
    expect(formatHwb({ l: 0.5, c: 0.18, h: 240, a: 0.5 })).toMatch(
      / \/ \d+%\)$/,
    )
  })
  it("rounds fractional alpha to integer percent (byte-quantized space)", () => {
    expect(formatHwb({ l: 0.5, c: 0.18, h: 240, a: 0.5025 })).toMatch(/50%\)$/)
  })
})

describe("formatColor dispatcher", () => {
  const sample = { l: 0.628, c: 0.258, h: 29.234, a: 1 }
  it("dispatches each mode", () => {
    expect(formatColor(sample, "hex")).toMatch(/^#/)
    expect(formatColor(sample, "rgb")).toMatch(/^rgb\(/)
    expect(formatColor(sample, "hsl")).toMatch(/^hsl\(/)
    expect(formatColor(sample, "oklch")).toMatch(/^oklch\(/)
    expect(formatColor(sample, "oklab")).toMatch(/^oklab\(/)
    expect(formatColor(sample, "hwb")).toMatch(/^hwb\(/)
  })
  it("includes alpha branch for hex when a < 1", () => {
    const withAlpha = { ...sample, a: 0.5 }
    expect(formatColor(withAlpha, "hex")).toMatch(/^#[0-9a-f]{8}$/)
  })
})
