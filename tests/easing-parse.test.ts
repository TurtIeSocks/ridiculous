import { describe, expect, test } from "vitest"
import { parseEasing } from "@/components/ui/easing-picker/easing-picker"
import type { EasingState } from "@/components/ui/easing-picker/easing-picker.types"

describe("parseEasing", () => {
  test("parses all 7 CSS keywords", () => {
    expect(parseEasing("linear")).toEqual<EasingState>({
      basis: "bezier",
      x1: 0,
      y1: 0,
      x2: 1,
      y2: 1,
      extraTop: 0.25,
      extraBottom: 0.25,
    })
    expect(parseEasing("ease")).toMatchObject({ basis: "bezier", x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 })
    expect(parseEasing("ease-in")).toMatchObject({ basis: "bezier", x1: 0.42, y1: 0, x2: 1, y2: 1 })
    expect(parseEasing("ease-out")).toMatchObject({ basis: "bezier", x1: 0, y1: 0, x2: 0.58, y2: 1 })
    expect(parseEasing("ease-in-out")).toMatchObject({ basis: "bezier", x1: 0.42, y1: 0, x2: 0.58, y2: 1 })
    expect(parseEasing("step-start")).toEqual<EasingState>({ basis: "steps", n: 1, position: "jump-start" })
    expect(parseEasing("step-end")).toEqual<EasingState>({ basis: "steps", n: 1, position: "jump-end" })
  })

  test("parses cubic-bezier in comma form", () => {
    expect(parseEasing("cubic-bezier(0.42, 0, 0.58, 1)")).toMatchObject({
      basis: "bezier",
      x1: 0.42,
      y1: 0,
      x2: 0.58,
      y2: 1,
    })
  })

  test("parses cubic-bezier in space form", () => {
    expect(parseEasing("cubic-bezier(0.42 0 0.58 1)")).toMatchObject({
      basis: "bezier",
      x1: 0.42,
      y1: 0,
      x2: 0.58,
      y2: 1,
    })
  })

  test("parses overshoot bezier (y > 1, y < 0)", () => {
    expect(parseEasing("cubic-bezier(0.5, -0.5, 0.5, 1.5)")).toMatchObject({
      basis: "bezier",
      x1: 0.5,
      y1: -0.5,
      x2: 0.5,
      y2: 1.5,
    })
  })

  test("parses steps with position", () => {
    expect(parseEasing("steps(4, jump-end)")).toEqual<EasingState>({
      basis: "steps",
      n: 4,
      position: "jump-end",
    })
  })

  test("parses steps without position (defaults to end)", () => {
    expect(parseEasing("steps(3)")).toEqual<EasingState>({
      basis: "steps",
      n: 3,
      position: "end",
    })
  })

  test("parses linear() as a degenerate spring state", () => {
    // linear() output cannot recover physics params; we restore default spring
    // params and flag the raw string so the OutputPanel can re-emit it as-is.
    const result = parseEasing("linear(0, 0.5 50%, 1)")
    expect(result).not.toBeNull()
    expect(result?.basis).toBe("spring")
  })

  test("returns null for garbage", () => {
    expect(parseEasing("garbage")).toBeNull()
    expect(parseEasing("")).toBeNull()
    expect(parseEasing("cubic-bezier(abc)")).toBeNull()
    expect(parseEasing("steps()")).toBeNull()
  })
})
