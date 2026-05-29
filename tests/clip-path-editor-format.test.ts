import { describe, expect, test } from "vitest"
import {
  formatClipPath,
  parseClipPath,
} from "@/components/ui/clip-path-editor/clip-path-editor.helpers"
import type { ClipPathState } from "@/components/ui/clip-path-editor/clip-path-editor.types"

describe("formatClipPath", () => {
  test("inset: emits 1-4 box values + optional round", () => {
    expect(formatClipPath({ shape: { shape: "inset", top: "10px" } })).toBe(
      "inset(10px)",
    )
    expect(
      formatClipPath({
        shape: {
          shape: "inset",
          top: "10px",
          right: "20px",
          bottom: "30px",
          left: "40px",
          round: "8px",
        },
      }),
    ).toBe("inset(10px 20px 30px 40px round 8px)")
  })

  test("circle: radius + at", () => {
    expect(formatClipPath({ shape: { shape: "circle", radius: "50%" } })).toBe(
      "circle(50%)",
    )
    expect(
      formatClipPath({
        shape: { shape: "circle", radius: "50%", atX: "25%", atY: "75%" },
      }),
    ).toBe("circle(50% at 25% 75%)")
    expect(formatClipPath({ shape: { shape: "circle" } })).toBe("circle()")
  })

  test("ellipse: two radii + at", () => {
    expect(
      formatClipPath({ shape: { shape: "ellipse", rx: "50%", ry: "35%" } }),
    ).toBe("ellipse(50% 35%)")
    expect(
      formatClipPath({
        shape: {
          shape: "ellipse",
          rx: "10px",
          ry: "20px",
          atX: "left",
          atY: "top",
        },
      }),
    ).toBe("ellipse(10px 20px at left top)")
  })

  test("polygon: vertex list, fill-rule first", () => {
    expect(
      formatClipPath({
        shape: {
          shape: "polygon",
          vertices: [
            { x: "0%", y: "0%" },
            { x: "100%", y: "0%" },
            { x: "50%", y: "100%" },
          ],
        },
      }),
    ).toBe("polygon(0% 0%, 100% 0%, 50% 100%)")
    expect(
      formatClipPath({
        shape: {
          shape: "polygon",
          fillRule: "evenodd",
          vertices: [
            { x: "0%", y: "0%" },
            { x: "100%", y: "100%" },
          ],
        },
      }),
    ).toBe("polygon(evenodd, 0% 0%, 100% 100%)")
  })

  test("geometry box: leading and trailing placement", () => {
    expect(
      formatClipPath({
        box: "border-box",
        boxPosition: "trailing",
        shape: { shape: "circle", radius: "50%" },
      }),
    ).toBe("circle(50%) border-box")
    expect(
      formatClipPath({
        box: "padding-box",
        boxPosition: "leading",
        shape: { shape: "ellipse", rx: "50%", ry: "60%" },
      }),
    ).toBe("padding-box ellipse(50% 60%)")
  })

  test("bare box → the keyword; null shape + no box → none", () => {
    expect(formatClipPath({ box: "margin-box", shape: null })).toBe(
      "margin-box",
    )
    expect(formatClipPath({ shape: null })).toBe("none")
  })

  test("round-trips through parse for each shape", () => {
    const samples = [
      "inset(10% 20% round 4px)",
      "circle(50% at 25% 75%)",
      "ellipse(50% 35% at center center)",
      "polygon(evenodd, 0% 0%, 100% 0%, 50% 100%)",
      "circle(50%) border-box",
      "padding-box polygon(0% 0%, 100% 100%)",
      "none",
    ]
    for (const src of samples) {
      const state = parseClipPath(src) as ClipPathState
      expect(formatClipPath(state)).toBe(src)
    }
  })
})
