import { describe, expect, test } from "vitest"
import {
  defaultShape,
  parseClipPath,
  polygonVertices,
  shapeName,
} from "@/components/ui/clip-path-editor/clip-path-editor.helpers"
import type { ClipPathState } from "@/components/ui/clip-path-editor/clip-path-editor.types"

/** Parse and assert non-null — keeps the suite free of `!` assertions. */
function mustParse(src: string): ClipPathState {
  const state = parseClipPath(src)
  if (state === null) throw new Error(`expected "${src}" to parse`)
  return state
}

describe("parseClipPath — inset", () => {
  test("parses 1-4 length-percentages into the box", () => {
    expect(mustParse("inset(10px)")).toEqual({
      shape: { shape: "inset", top: "10px" },
    })
    expect(mustParse("inset(10px 20px 30px 40px)")).toEqual({
      shape: {
        shape: "inset",
        top: "10px",
        right: "20px",
        bottom: "30px",
        left: "40px",
      },
    })
  })

  test("captures the round tail verbatim", () => {
    expect(mustParse("inset(10% 20% round 8px)")).toEqual({
      shape: { shape: "inset", top: "10%", right: "20%", round: "8px" },
    })
  })

  test("null on zero args or arity > 4", () => {
    expect(parseClipPath("inset()")).toBeNull()
    expect(parseClipPath("inset(1px 2px 3px 4px 5px)")).toBeNull()
  })
})

describe("parseClipPath — circle", () => {
  test("parses empty / radius / radius + at", () => {
    expect(mustParse("circle()")).toEqual({ shape: { shape: "circle" } })
    expect(mustParse("circle(50%)")).toEqual({
      shape: { shape: "circle", radius: "50%" },
    })
    expect(mustParse("circle(50% at 25% 75%)")).toEqual({
      shape: { shape: "circle", radius: "50%", atX: "25%", atY: "75%" },
    })
  })

  test("parses a keyword radius and an `at` with no radius", () => {
    expect(mustParse("circle(closest-side)")).toEqual({
      shape: { shape: "circle", radius: "closest-side" },
    })
    expect(mustParse("circle(at center)")).toEqual({
      shape: { shape: "circle", atX: "center", atY: "center" },
    })
  })
})

describe("parseClipPath — ellipse", () => {
  test("parses two radii, optionally with at", () => {
    expect(mustParse("ellipse(50% 35%)")).toEqual({
      shape: { shape: "ellipse", rx: "50%", ry: "35%" },
    })
    expect(mustParse("ellipse(10px 20px at left top)")).toEqual({
      shape: {
        shape: "ellipse",
        rx: "10px",
        ry: "20px",
        atX: "left",
        atY: "top",
      },
    })
  })

  test("null on a single radius", () => {
    expect(parseClipPath("ellipse(50%)")).toBeNull()
  })
})

describe("parseClipPath — polygon", () => {
  test("parses a vertex list", () => {
    expect(mustParse("polygon(0% 0%, 100% 0%, 50% 100%)")).toEqual({
      shape: {
        shape: "polygon",
        vertices: [
          { x: "0%", y: "0%" },
          { x: "100%", y: "0%" },
          { x: "50%", y: "100%" },
        ],
      },
    })
  })

  test("captures a leading fill-rule", () => {
    expect(mustParse("polygon(evenodd, 0% 0%, 100% 100%)")).toEqual({
      shape: {
        shape: "polygon",
        fillRule: "evenodd",
        vertices: [
          { x: "0%", y: "0%" },
          { x: "100%", y: "100%" },
        ],
      },
    })
  })

  test("null on an odd-token vertex or empty list", () => {
    expect(parseClipPath("polygon(0% 0%, 100% 0%, 50%)")).toBeNull()
    expect(parseClipPath("polygon()")).toBeNull()
  })
})

describe("parseClipPath — geometry box", () => {
  test("parses a trailing box", () => {
    expect(mustParse("circle(50%) border-box")).toEqual({
      box: "border-box",
      boxPosition: "trailing",
      shape: { shape: "circle", radius: "50%" },
    })
  })

  test("parses a leading box", () => {
    expect(mustParse("padding-box ellipse(50% 60%)")).toEqual({
      box: "padding-box",
      boxPosition: "leading",
      shape: { shape: "ellipse", rx: "50%", ry: "60%" },
    })
  })

  test("parses a bare box (no shape)", () => {
    expect(mustParse("margin-box")).toEqual({
      box: "margin-box",
      shape: null,
    })
  })

  test("null on a double box", () => {
    expect(parseClipPath("border-box circle() padding-box")).toBeNull()
  })
})

describe("parseClipPath — tolerant + edge cases", () => {
  test("none / empty → a null shape", () => {
    expect(mustParse("none")).toEqual({ shape: null })
    expect(mustParse("")).toEqual({ shape: null })
    expect(mustParse("  ")).toEqual({ shape: null })
  })

  test("keeps calc()/var() coordinates verbatim (one whole token)", () => {
    expect(mustParse("circle(calc(50% + 10px))")).toEqual({
      shape: { shape: "circle", radius: "calc(50% + 10px)" },
    })
    expect(
      mustParse("polygon(0% 0%, calc(100% - 5px) var(--y), 50% 100%)"),
    ).toEqual({
      shape: {
        shape: "polygon",
        vertices: [
          { x: "0%", y: "0%" },
          { x: "calc(100% - 5px)", y: "var(--y)" },
          { x: "50%", y: "100%" },
        ],
      },
    })
  })

  test("null on an unknown shape or malformed call", () => {
    expect(parseClipPath("wobble(0% 0%)")).toBeNull()
    expect(parseClipPath("circle 50%")).toBeNull()
  })
})

describe("shapeName", () => {
  test("mirrors ShapeOf at runtime", () => {
    expect(shapeName("circle(50%)")).toBe("circle")
    expect(shapeName("polygon(0% 0%, 1px 1px, 2px 2px)")).toBe("polygon")
    expect(shapeName("ellipse(1px 2px) border-box")).toBe("ellipse")
    expect(shapeName("border-box")).toBe("box")
    expect(shapeName("none")).toBe("none")
    expect(shapeName("garbage")).toBe("none")
  })
})

describe("polygonVertices", () => {
  test("lists vertices for a polygon, [] otherwise", () => {
    expect(polygonVertices("polygon(0% 0%, 100% 0%, 50% 100%)")).toEqual([
      { x: "0%", y: "0%" },
      { x: "100%", y: "0%" },
      { x: "50%", y: "100%" },
    ])
    expect(polygonVertices("circle(50%)")).toEqual([])
    expect(polygonVertices("none")).toEqual([])
  })
})

describe("defaultShape", () => {
  test("seeds a sensible default per shape", () => {
    expect(defaultShape("inset")).toEqual({
      shape: "inset",
      top: "10%",
      right: "10%",
      bottom: "10%",
      left: "10%",
    })
    expect(defaultShape("circle")).toEqual({
      shape: "circle",
      radius: "50%",
      atX: "50%",
      atY: "50%",
    })
    expect(defaultShape("ellipse")).toEqual({
      shape: "ellipse",
      rx: "50%",
      ry: "35%",
      atX: "50%",
      atY: "50%",
    })
    expect(defaultShape("polygon")).toEqual({
      shape: "polygon",
      vertices: [
        { x: "50%", y: "0%" },
        { x: "0%", y: "100%" },
        { x: "100%", y: "100%" },
      ],
    })
  })
})
