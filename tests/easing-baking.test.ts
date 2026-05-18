import { describe, expect, test } from "vitest"
import { sampleSpring, bakeLinear } from "@/components/ui/easing-picker/easing-picker"

describe("sampleSpring", () => {
  test("default params produce a monotonic-approaching curve ending near 1", () => {
    const samples = sampleSpring(100, 10, 1, 60)
    expect(samples.length).toBeGreaterThan(10)
    expect(samples[0].y).toBeCloseTo(0, 1)
    expect(samples[samples.length - 1].y).toBeCloseTo(1, 2)
  })

  test("underdamped (low damping) overshoots y=1", () => {
    const samples = sampleSpring(200, 3, 1, 60)
    const maxY = Math.max(...samples.map((s) => s.y))
    expect(maxY).toBeGreaterThan(1)
  })

  test("overdamped (high damping) approaches monotonically without overshoot", () => {
    const samples = sampleSpring(50, 50, 1, 60)
    const maxY = Math.max(...samples.map((s) => s.y))
    expect(maxY).toBeLessThanOrEqual(1.001)
  })
})

describe("bakeLinear", () => {
  test("emits valid linear() with comma-separated stops + percentage anchors", () => {
    const result = bakeLinear([
      { y: 0, t: 0 },
      { y: 0.5, t: 0.5 },
      { y: 1, t: 1 },
    ])
    expect(result).toBe("linear(0, 0.5 50%, 1)")
  })

  test("first and last stops omit percentage anchors", () => {
    const result = bakeLinear([
      { y: 0, t: 0 },
      { y: 1, t: 1 },
    ])
    expect(result).toBe("linear(0, 1)")
  })

  test("prunes collinear stops within tolerance", () => {
    const result = bakeLinear([
      { y: 0, t: 0 },
      { y: 0.5, t: 0.5 },
      { y: 0.5001, t: 0.5001 },
      { y: 1, t: 1 },
    ])
    // 0.5 and 0.5001 are collinear with 0→1; the middle one stays as the
    // hinge, the redundant one is dropped.
    expect(result.split(",").length).toBeLessThanOrEqual(3)
  })
})
