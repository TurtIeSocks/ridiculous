import { describe, expect, it } from "vitest"
import {
  parseColor,
  parseHex,
  parseHsl,
  parseHwb,
  parseOklab,
  parseOklch,
  parseRgb,
} from "@/components/ui/color-picker/color-picker"

describe("parseHex", () => {
  it("parses 6-digit hex", () => {
    expect(parseHex("#ff0000")).toEqual({ r: 1, g: 0, b: 0, a: 1 })
    expect(parseHex("#00ff00")).toEqual({ r: 0, g: 1, b: 0, a: 1 })
    expect(parseHex("#0000ff")).toEqual({ r: 0, g: 0, b: 1, a: 1 })
  })
  it("parses 3-digit hex by doubling chars", () => {
    expect(parseHex("#f00")).toEqual({ r: 1, g: 0, b: 0, a: 1 })
    expect(parseHex("#0f0")).toEqual({ r: 0, g: 1, b: 0, a: 1 })
  })
  it("parses 8-digit hex with alpha", () => {
    expect(parseHex("#ff000080")).toEqual({
      r: 1,
      g: 0,
      b: 0,
      a: expect.closeTo(0.5019, 3),
    })
  })
  it("parses 4-digit hex with alpha", () => {
    expect(parseHex("#f008")).toEqual({
      r: 1,
      g: 0,
      b: 0,
      a: expect.closeTo(0.5333, 3),
    })
  })
  it("returns null for invalid", () => {
    expect(parseHex("#zzz")).toBeNull()
    expect(parseHex("ff0000")).toBeNull()
    expect(parseHex("#ff")).toBeNull()
    expect(parseHex("")).toBeNull()
  })
})

describe("parseRgb", () => {
  it("parses comma-separated rgb()", () => {
    expect(parseRgb("rgb(255, 0, 0)")).toEqual({ r: 1, g: 0, b: 0, a: 1 })
  })
  it("parses space-separated rgb()", () => {
    expect(parseRgb("rgb(255 0 0)")).toEqual({ r: 1, g: 0, b: 0, a: 1 })
  })
  it("parses percentage channels", () => {
    expect(parseRgb("rgb(100% 0% 0%)")).toEqual({ r: 1, g: 0, b: 0, a: 1 })
  })
  it("parses rgba with alpha slash", () => {
    expect(parseRgb("rgba(255 0 0 / 0.5)")).toEqual({
      r: 1,
      g: 0,
      b: 0,
      a: 0.5,
    })
  })
  it("parses rgba with comma alpha", () => {
    expect(parseRgb("rgba(255, 0, 0, 0.5)")).toEqual({
      r: 1,
      g: 0,
      b: 0,
      a: 0.5,
    })
  })
  it("returns null for invalid", () => {
    expect(parseRgb("rgb()")).toBeNull()
    expect(parseRgb("not-rgb")).toBeNull()
  })
})

describe("parseHsl", () => {
  it("parses space-separated", () => {
    expect(parseHsl("hsl(0 100% 50%)")).toEqual({
      h: 0,
      s: 1,
      l: 0.5,
      a: 1,
    })
  })
  it("parses comma-separated", () => {
    expect(parseHsl("hsl(120, 100%, 50%)")).toEqual({
      h: 120,
      s: 1,
      l: 0.5,
      a: 1,
    })
  })
  it("parses alpha", () => {
    expect(parseHsl("hsl(240 50% 50% / 0.5)")).toEqual({
      h: 240,
      s: 0.5,
      l: 0.5,
      a: 0.5,
    })
  })
  it("returns null for invalid", () => {
    expect(parseHsl("hsl(garbage)")).toBeNull()
  })
})

describe("parseOklch", () => {
  it("parses bare numeric form", () => {
    expect(parseOklch("oklch(0.5 0.1 240)")).toEqual({
      l: 0.5,
      c: 0.1,
      h: 240,
      a: 1,
    })
  })
  it("parses percentage L (relative to 1)", () => {
    expect(parseOklch("oklch(50% 0.1 240)")).toMatchObject({ l: 0.5 })
  })
  it("parses percentage C (relative to 0.4)", () => {
    expect(parseOklch("oklch(0.5 50% 240)")).toMatchObject({ c: 0.2 })
  })
  it("parses alpha", () => {
    expect(parseOklch("oklch(0.5 0.1 240 / 50%)")).toEqual({
      l: 0.5,
      c: 0.1,
      h: 240,
      a: 0.5,
    })
  })
})

describe("parseOklab", () => {
  it("parses bare oklab(L a b)", () => {
    expect(parseOklab("oklab(0.5 0.1 -0.05)")).toEqual({
      l: 0.5,
      a: 0.1,
      b: -0.05,
      alpha: 1,
    })
  })
  it("parses percentage L", () => {
    expect(parseOklab("oklab(50% 0.1 0.05)")).toMatchObject({ l: 0.5 })
  })
  it("parses alpha", () => {
    expect(parseOklab("oklab(0.5 0.1 -0.05 / 0.5)")).toEqual({
      l: 0.5,
      a: 0.1,
      b: -0.05,
      alpha: 0.5,
    })
  })
})

describe("parseHwb", () => {
  it("parses hwb(H W% B%)", () => {
    expect(parseHwb("hwb(0 0% 0%)")).toEqual({
      h: 0,
      w: 0,
      b: 0,
      a: 1,
    })
  })
  it("parses alpha", () => {
    expect(parseHwb("hwb(240 20% 30% / 0.5)")).toEqual({
      h: 240,
      w: 0.2,
      b: 0.3,
      a: 0.5,
    })
  })
  it("returns null for invalid", () => {
    expect(parseHwb("hwb(garbage)")).toBeNull()
  })
})

describe("parseColor", () => {
  it("detects oklch", () => {
    expect(parseColor("oklch(0.5 0.1 240)")?.mode).toBe("oklch")
  })
  it("detects oklab", () => {
    expect(parseColor("oklab(0.5 0.1 -0.05)")?.mode).toBe("oklab")
  })
  it("detects hex", () => {
    expect(parseColor("#ff0000")?.mode).toBe("hex")
  })
  it("detects rgb", () => {
    expect(parseColor("rgb(255 0 0)")?.mode).toBe("rgb")
  })
  it("detects hsl", () => {
    expect(parseColor("hsl(0 100% 50%)")?.mode).toBe("hsl")
  })
  it("detects hwb", () => {
    expect(parseColor("hwb(0 0% 0%)")?.mode).toBe("hwb")
  })
  it("trims whitespace", () => {
    expect(parseColor("  #ff0000  ")?.mode).toBe("hex")
  })
  it("returns null for unrecognized", () => {
    expect(parseColor("not a color")).toBeNull()
  })
})
