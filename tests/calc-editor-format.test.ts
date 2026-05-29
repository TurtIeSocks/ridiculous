import { describe, expect, test } from "vitest"
import {
  computeCalc,
  formatCalc,
  parseCalc,
} from "@/components/ui/calc-editor/calc-editor.helpers"
import type { CalcNode } from "@/components/ui/calc-editor/calc-editor.types"

function mustParse(src: string): CalcNode {
  const node = parseCalc(src)
  if (node === null) throw new Error(`expected "${src}" to parse`)
  return node
}

describe("formatCalc", () => {
  test("canonical spacing for calc", () => {
    expect(formatCalc(mustParse("calc(10px+2rem)"))).toBe("calc(10px + 2rem)")
    expect(formatCalc(mustParse("calc(  10px   *   3 )"))).toBe(
      "calc(10px * 3)",
    )
  })

  test("canonical spacing for clamp / min / max", () => {
    expect(formatCalc(mustParse("clamp( 1rem ,2vw, 3rem )"))).toBe(
      "clamp(1rem, 2vw, 3rem)",
    )
    expect(formatCalc(mustParse("min(1px,2px,3px)"))).toBe("min(1px, 2px, 3px)")
  })

  test("preserves grouping parens and nesting", () => {
    expect(formatCalc(mustParse("calc((10px+2px)*3)"))).toBe(
      "calc((10px + 2px) * 3)",
    )
    expect(formatCalc(mustParse("calc(min(10px,2rem)+1rem)"))).toBe(
      "calc(min(10px, 2rem) + 1rem)",
    )
  })

  test("preserves var()", () => {
    expect(formatCalc(mustParse("calc(100% - var(--gap))"))).toBe(
      "calc(100% - var(--gap))",
    )
  })
})

describe("computeCalc", () => {
  const ctx = { viewport: 1000 } // 1vw = 10px

  test("resolves px / rem / vw to px", () => {
    expect(computeCalc(mustParse("calc(1rem + 2vw)"), ctx)).toBeCloseTo(36) // 16 + 20
    expect(computeCalc(mustParse("calc(10px * 3)"), ctx)).toBeCloseTo(30)
    expect(computeCalc(mustParse("calc(100px / 4)"), ctx)).toBeCloseTo(25)
  })

  test("respects operator precedence in the computed value", () => {
    // 10 + 2 * 5 = 20 (not 60)
    expect(computeCalc(mustParse("calc(10px + 2 * 5px)"), ctx)).toBeCloseTo(20)
  })

  test("clamp clamps to the preferred / min / max", () => {
    const expr = "clamp(16px, calc(0.5rem + 2vw), 48px)"
    // preferred @1000 = 8 + 20 = 28 → within [16,48]
    expect(computeCalc(mustParse(expr), ctx)).toBeCloseTo(28)
    // @100 → preferred = 8 + 2 = 10 → clamped up to 16
    expect(computeCalc(mustParse(expr), { viewport: 100 })).toBeCloseTo(16)
    // @5000 → preferred = 8 + 100 = 108 → clamped down to 48
    expect(computeCalc(mustParse(expr), { viewport: 5000 })).toBeCloseTo(48)
  })

  test("min / max reduce", () => {
    expect(computeCalc(mustParse("min(10px, 2rem)"), ctx)).toBe(10) // 10 vs 32
    expect(computeCalc(mustParse("max(10px, 2rem)"), ctx)).toBe(32)
  })

  test("percent resolves against a basis when provided", () => {
    expect(
      computeCalc(mustParse("calc(50% + 10px)"), {
        viewport: 1000,
        basis: 200,
      }),
    ).toBeCloseTo(110) // 100 + 10
  })

  test("null when var() blocks computation", () => {
    expect(computeCalc(mustParse("calc(10px + var(--x))"), ctx)).toBeNull()
  })

  test("custom rootFontSize changes rem resolution", () => {
    expect(
      computeCalc(mustParse("calc(1rem * 2)"), {
        viewport: 1000,
        rootFontSize: 10,
      }),
    ).toBeCloseTo(20)
  })
})
