import { describe, expect, test } from "vitest"
import { formatEasing } from "@/components/ui/easing-picker/easing-picker"

describe("formatEasing", () => {
  test("formats bezier with comma form, 4 decimals, trailing zeros stripped", () => {
    expect(
      formatEasing({
        basis: "bezier",
        x1: 0.42,
        y1: 0,
        x2: 0.58,
        y2: 1,
        extraTop: 0.25,
        extraBottom: 0.25,
      }),
    ).toBe("cubic-bezier(0.42, 0, 0.58, 1)")
  })

  test("formats bezier preserving overshoot", () => {
    expect(
      formatEasing({
        basis: "bezier",
        x1: 0.5,
        y1: -0.5,
        x2: 0.5,
        y2: 1.5,
        extraTop: 0.5,
        extraBottom: 0.5,
      }),
    ).toBe("cubic-bezier(0.5, -0.5, 0.5, 1.5)")
  })

  test("formats steps with default position omits second arg", () => {
    expect(formatEasing({ basis: "steps", n: 3, position: "end" })).toBe(
      "steps(3)",
    )
  })

  test("formats steps with non-default position emits both", () => {
    expect(formatEasing({ basis: "steps", n: 4, position: "jump-end" })).toBe(
      "steps(4, jump-end)",
    )
  })

  test("rounds bezier coords to 4 decimals", () => {
    expect(
      formatEasing({
        basis: "bezier",
        x1: 0.123456789,
        y1: 0,
        x2: 0.987654321,
        y2: 1,
        extraTop: 0.25,
        extraBottom: 0.25,
      }),
    ).toBe("cubic-bezier(0.1235, 0, 0.9877, 1)")
  })

  test("formatEasing spring emits a linear() string", () => {
    const result = formatEasing({
      basis: "spring",
      stiffness: 100,
      damping: 10,
      mass: 1,
    })
    expect(result).toMatch(/^linear\(/)
    expect(result).toMatch(/\)$/)
  })

  test("formatEasing bounce emits a linear() string", () => {
    const result = formatEasing({ basis: "bounce", bounces: 3, stiffness: 0.5 })
    expect(result).toMatch(/^linear\(/)
  })

  test("formatEasing wiggle emits a linear() string", () => {
    const result = formatEasing({ basis: "wiggle", wiggles: 4, damping: 5 })
    expect(result).toMatch(/^linear\(/)
  })
})
