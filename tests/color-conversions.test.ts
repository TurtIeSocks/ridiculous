import { describe, it, expect } from "vitest"
import {
  clamp01,
  trimNumber,
  parseAlphaToken,
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
