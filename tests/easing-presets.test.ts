import { describe, expect, test } from "vitest"
import {
  bezierFromPreset,
  matchPreset,
  PRESETS,
} from "@/components/ui/easing-picker/easing-picker"

describe("PRESETS table", () => {
  test("contains the 5 CSS keyword entries with canonical coefficients", () => {
    expect(PRESETS.find((p) => p.name === "linear")?.bezier).toEqual([
      0, 0, 1, 1,
    ])
    expect(PRESETS.find((p) => p.name === "ease")?.bezier).toEqual([
      0.25, 0.1, 0.25, 1,
    ])
    expect(PRESETS.find((p) => p.name === "ease-in")?.bezier).toEqual([
      0.42, 0, 1, 1,
    ])
    expect(PRESETS.find((p) => p.name === "ease-out")?.bezier).toEqual([
      0, 0, 0.58, 1,
    ])
    expect(PRESETS.find((p) => p.name === "ease-in-out")?.bezier).toEqual([
      0.42, 0, 0.58, 1,
    ])
  })

  test("has no duplicate names", () => {
    const names = PRESETS.map((p) => p.name)
    expect(new Set(names).size).toBe(names.length)
  })

  test("every preset has x1, x2 in [0, 1]", () => {
    for (const p of PRESETS) {
      expect(p.bezier[0]).toBeGreaterThanOrEqual(0)
      expect(p.bezier[0]).toBeLessThanOrEqual(1)
      expect(p.bezier[2]).toBeGreaterThanOrEqual(0)
      expect(p.bezier[2]).toBeLessThanOrEqual(1)
    }
  })

  test("polynomial set covers 8 families × 4 directions = 32 entries", () => {
    const polyCount = PRESETS.filter((p) => p.family && p.direction).length
    expect(polyCount).toBe(32)
  })
})

describe("bezierFromPreset", () => {
  test("returns the underlying cubic-bezier literal", () => {
    expect(bezierFromPreset("ease")).toBe("cubic-bezier(0.25, 0.1, 0.25, 1)")
    expect(bezierFromPreset("easeOutQuart")).toMatch(/^cubic-bezier\(/)
  })
})

describe("matchPreset", () => {
  test("matches exact coefficients", () => {
    expect(matchPreset(0.25, 0.1, 0.25, 1)).toBe("ease")
    expect(matchPreset(0.42, 0, 1, 1)).toBe("ease-in")
  })

  test("matches within 0.005 tolerance", () => {
    expect(matchPreset(0.252, 0.099, 0.249, 1.001)).toBe("ease")
  })

  test("returns null when no preset within tolerance", () => {
    expect(matchPreset(0.7, 0.3, 0.4, 0.8)).toBeNull()
  })
})
