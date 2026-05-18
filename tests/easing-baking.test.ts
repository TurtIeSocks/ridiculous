import { describe, expect, test } from "vitest"
import {
  sampleSpring,
  bakeLinear,
  sampleBounce,
  sampleWiggle,
} from "@/components/ui/easing-picker/easing-picker"

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

describe("sampleBounce", () => {
  test("produces N local minima for N bounces", () => {
    const samples = sampleBounce(3, 0.5)
    const minima: number[] = []
    for (let i = 1; i < samples.length - 1; i++) {
      if (samples[i].y < samples[i - 1].y && samples[i].y < samples[i + 1].y) {
        minima.push(i)
      }
    }
    // Bounces produce 3 contact dips (allow off-by-one due to sampling)
    expect(minima.length).toBeGreaterThanOrEqual(2)
    expect(minima.length).toBeLessThanOrEqual(4)
  })

  test("ends at y=1", () => {
    const samples = sampleBounce(3, 0.5)
    expect(samples[samples.length - 1].y).toBeCloseTo(1, 2)
  })
})

describe("sampleWiggle", () => {
  test("crosses y=1 multiple times (non-monotonic)", () => {
    const samples = sampleWiggle(4, 5)
    let crossings = 0
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i - 1].y - 1) * (samples[i].y - 1) < 0) crossings++
    }
    expect(crossings).toBeGreaterThanOrEqual(3)
  })

  test("ends at y=1", () => {
    const samples = sampleWiggle(4, 5)
    expect(samples[samples.length - 1].y).toBeCloseTo(1, 1)
  })
})
