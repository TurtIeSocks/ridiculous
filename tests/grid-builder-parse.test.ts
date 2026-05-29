import { describe, expect, it } from "vitest"
import {
  areaNames,
  gridAreaFor,
  parseAreas,
  parseTracks,
  validateAreasRectangles,
} from "@/components/ui/grid-builder/grid-builder.helpers"

describe("parseTracks", () => {
  it("tokenizes plain track sizes", () => {
    expect(parseTracks("1fr 2fr auto 100px")).toEqual([
      { kind: "size", value: "1fr" },
      { kind: "size", value: "2fr" },
      { kind: "size", value: "auto" },
      { kind: "size", value: "100px" },
    ])
  })

  it("keeps minmax / repeat / fit-content as single function tokens", () => {
    expect(
      parseTracks("repeat(3, 1fr) minmax(100px, 1fr) fit-content(200px)"),
    ).toEqual([
      { kind: "fn", name: "repeat", value: "repeat(3, 1fr)" },
      { kind: "fn", name: "minmax", value: "minmax(100px, 1fr)" },
      { kind: "fn", name: "fit-content", value: "fit-content(200px)" },
    ])
  })

  it("captures [named-line] brackets as line tokens", () => {
    expect(parseTracks("[sidebar] 1fr [main] 2fr [end]")).toEqual([
      { kind: "line", names: ["sidebar"], value: "[sidebar]" },
      { kind: "size", value: "1fr" },
      { kind: "line", names: ["main"], value: "[main]" },
      { kind: "size", value: "2fr" },
      { kind: "line", names: ["end"], value: "[end]" },
    ])
  })

  it("tolerates calc()/var() as opaque function tokens (round-trippable)", () => {
    expect(parseTracks("calc(100px + 2rem) var(--x)")).toEqual([
      { kind: "fn", name: "calc", value: "calc(100px + 2rem)" },
      { kind: "fn", name: "var", value: "var(--x)" },
    ])
  })

  it("none / empty → empty token list", () => {
    expect(parseTracks("none")).toEqual([])
    expect(parseTracks("")).toEqual([])
    expect(parseTracks("   ")).toEqual([])
  })

  it("rejects an unbalanced bracket / malformed token", () => {
    expect(parseTracks("[unclosed 1fr")).toBeNull()
  })
})

describe("parseAreas", () => {
  it("parses quoted rows into a matrix", () => {
    expect(parseAreas('"a a" "b b"')).toEqual([
      ["a", "a"],
      ["b", "b"],
    ])
  })

  it("accepts dot null cells (single + runs)", () => {
    expect(parseAreas('"a ." ". a"')).toEqual([
      ["a", "."],
      [".", "a"],
    ])
    expect(parseAreas('"a .." ".. a"')).toEqual([
      ["a", ".."],
      ["..", "a"],
    ])
  })

  it("none / empty → empty matrix", () => {
    expect(parseAreas("none")).toEqual([])
    expect(parseAreas("")).toEqual([])
  })

  it("rejects unequal column counts", () => {
    expect(parseAreas('"a a" "b"')).toBeNull()
    expect(parseAreas('"a a a" "b b"')).toBeNull()
  })

  it("rejects a non-quoted segment", () => {
    expect(parseAreas("a a")).toBeNull()
    expect(parseAreas('"a a" b')).toBeNull()
  })

  it("rejects a cell ident that starts with a digit", () => {
    expect(parseAreas('"a 1b"')).toBeNull()
  })

  it("rejects a NON-RECTANGULAR area (the type-tier punt)", () => {
    // "a" forms an L-shape — not a rectangle.
    expect(parseAreas('"a a" "a ."')).toEqual([
      ["a", "a"],
      ["a", "."],
    ])
    // ...but the rectangle-aware parser rejects it:
    expect(parseAreas('"a a" "a ."', { rectangles: true })).toBeNull()
  })

  it("accepts a rectangular area under the rectangle check", () => {
    expect(
      parseAreas('"head head" "nav main" "nav foot"', { rectangles: true }),
    ).toEqual([
      ["head", "head"],
      ["nav", "main"],
      ["nav", "foot"],
    ])
  })
})

describe("validateAreasRectangles", () => {
  it("returns true for contiguous rectangles", () => {
    expect(
      validateAreasRectangles([
        ["head", "head"],
        ["nav", "main"],
        ["nav", "foot"],
      ]),
    ).toBe(true)
  })

  it("returns false for an L-shaped (non-rectangular) area", () => {
    expect(
      validateAreasRectangles([
        ["a", "a"],
        ["a", "."],
      ]),
    ).toBe(false)
  })

  it("returns false for a split (non-contiguous) area", () => {
    // two separate "a" blocks with the same name
    expect(
      validateAreasRectangles([
        ["a", "."],
        [".", "a"],
      ]),
    ).toBe(false)
  })

  it("ignores dot null cells", () => {
    expect(
      validateAreasRectangles([
        [".", "."],
        [".", "."],
      ]),
    ).toBe(true)
  })
})

describe("areaNames / gridAreaFor", () => {
  it("lists distinct area names in first-seen order, excluding dots", () => {
    expect(
      areaNames([
        ["head", "head"],
        ["nav", "main"],
        ["nav", "."],
      ]),
    ).toEqual(["head", "nav", "main"])
  })

  it("gridAreaFor returns the CSS grid-area row/col span for a name", () => {
    const matrix = [
      ["head", "head"],
      ["nav", "main"],
      ["nav", "foot"],
    ]
    // head: rows 1..1, cols 1..2  → "1 / 1 / 2 / 3"
    expect(gridAreaFor(matrix, "head")).toBe("1 / 1 / 2 / 3")
    // nav: rows 2..3, cols 1..1   → "2 / 1 / 4 / 2"
    expect(gridAreaFor(matrix, "nav")).toBe("2 / 1 / 4 / 2")
  })

  it("gridAreaFor returns null for a missing name", () => {
    expect(gridAreaFor([["a"]], "missing")).toBeNull()
  })
})
