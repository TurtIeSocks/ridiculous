import { describe, expect, test } from "vitest"
import {
  anchorSides,
  anchorSizes,
  areCompatible,
  axisOf,
  cellToKeywords,
  defaultFor,
  keywordsToCell,
  parseAnchor,
  parsePositionArea,
  parsePositionTry,
  positionAreaKeywords,
  tryTactics,
} from "@/components/ui/anchor-position-editor/anchor-position-editor.helpers"

// ===========================================================================
// parsePositionArea — keyword tokenization + cross-axis error surfacing
// ===========================================================================

describe("parsePositionArea", () => {
  test("single keyword", () => {
    expect(parsePositionArea("center")).toEqual({
      keywords: ["center"],
      error: null,
    })
  })

  test("a physical pair", () => {
    expect(parsePositionArea("top left")).toEqual({
      keywords: ["top", "left"],
      error: null,
    })
  })

  test("a logical pair", () => {
    expect(parsePositionArea("block-start span-inline-end")).toEqual({
      keywords: ["block-start", "span-inline-end"],
      error: null,
    })
  })

  test("collapses extra whitespace", () => {
    expect(parsePositionArea("  top    left  ")).toEqual({
      keywords: ["top", "left"],
      error: null,
    })
  })

  test("empty string is an error", () => {
    const r = parsePositionArea("   ")
    expect(r.keywords).toEqual([])
    expect(r.error).not.toBeNull()
  })

  test("more than two tokens is an error", () => {
    const r = parsePositionArea("top left center")
    expect(r.error).not.toBeNull()
  })

  test("an unknown keyword is an error (keeps the tokens)", () => {
    const r = parsePositionArea("nowhere")
    expect(r.keywords).toEqual(["nowhere"])
    expect(r.error).not.toBeNull()
  })

  test("same-axis pair is an error", () => {
    const r = parsePositionArea("top bottom")
    expect(r.keywords).toEqual(["top", "bottom"])
    expect(r.error).not.toBeNull()
  })

  test("physical + logical mix is an error", () => {
    const r = parsePositionArea("left block-start")
    expect(r.keywords).toEqual(["left", "block-start"])
    expect(r.error).not.toBeNull()
  })

  test("span-all center pair accepted (neutral)", () => {
    expect(parsePositionArea("span-all center")).toEqual({
      keywords: ["span-all", "center"],
      error: null,
    })
  })
})

// ===========================================================================
// axisOf — runtime mirror of the type AxisOf (must agree with spec examples)
// ===========================================================================

describe("axisOf", () => {
  test("physical x keywords", () => {
    expect(axisOf("left")).toBe("x")
    expect(axisOf("right")).toBe("x")
    expect(axisOf("span-left")).toBe("x")
    expect(axisOf("x-start")).toBe("x")
    expect(axisOf("x-self-end")).toBe("x")
  })

  test("physical y keywords", () => {
    expect(axisOf("top")).toBe("y")
    expect(axisOf("bottom")).toBe("y")
    expect(axisOf("span-bottom")).toBe("y")
    expect(axisOf("y-start")).toBe("y")
  })

  test("logical block keywords", () => {
    expect(axisOf("block-start")).toBe("block")
    expect(axisOf("block-end")).toBe("block")
    expect(axisOf("span-block-start")).toBe("block")
    expect(axisOf("self-block-end")).toBe("block")
  })

  test("logical inline keywords", () => {
    expect(axisOf("inline-start")).toBe("inline")
    expect(axisOf("span-inline-end")).toBe("inline")
    expect(axisOf("self-inline-start")).toBe("inline")
  })

  test("neutral keywords", () => {
    expect(axisOf("center")).toBe("neutral")
    expect(axisOf("span-all")).toBe("neutral")
    expect(axisOf("start")).toBe("neutral")
    expect(axisOf("end")).toBe("neutral")
    expect(axisOf("self-start")).toBe("neutral")
  })

  test("unknown keyword", () => {
    expect(axisOf("nowhere")).toBe("unknown")
  })
})

// ===========================================================================
// areCompatible — runtime mirror of the type Compatible
// ===========================================================================

describe("areCompatible", () => {
  test("neutral pairs with anything", () => {
    expect(areCompatible("center", "top")).toBe(true)
    expect(areCompatible("span-all", "center")).toBe(true)
    expect(areCompatible("left", "center")).toBe(true)
    expect(areCompatible("start", "end")).toBe(true)
  })

  test("physical x with physical y ok", () => {
    expect(areCompatible("top", "left")).toBe(true)
    expect(areCompatible("left", "bottom")).toBe(true)
  })

  test("logical block with logical inline ok", () => {
    expect(areCompatible("block-start", "inline-end")).toBe(true)
    expect(areCompatible("span-inline-start", "block-end")).toBe(true)
  })

  test("same axis rejected", () => {
    expect(areCompatible("top", "bottom")).toBe(false)
    expect(areCompatible("left", "right")).toBe(false)
    expect(areCompatible("block-start", "block-end")).toBe(false)
    expect(areCompatible("inline-start", "inline-end")).toBe(false)
  })

  test("physical with logical rejected (system mix)", () => {
    expect(areCompatible("left", "block-start")).toBe(false)
    expect(areCompatible("top", "inline-end")).toBe(false)
  })

  test("an unknown keyword is incompatible", () => {
    expect(areCompatible("nowhere", "top")).toBe(false)
  })
})

// ===========================================================================
// parseAnchor
// ===========================================================================

describe("parseAnchor", () => {
  test("named side", () => {
    expect(parseAnchor("anchor(--btn bottom)")).toEqual({
      fn: "anchor",
      name: "--btn",
      side: "bottom",
    })
  })

  test("side only with a fallback length", () => {
    expect(parseAnchor("anchor(top, 8px)")).toEqual({
      fn: "anchor",
      side: "top",
      fallback: "8px",
    })
  })

  test("anchor-size with a name + dimension", () => {
    expect(parseAnchor("anchor-size(--btn width)")).toEqual({
      fn: "anchor-size",
      name: "--btn",
      side: "width",
    })
  })

  test("a bare percentage side", () => {
    expect(parseAnchor("anchor(50%)")).toEqual({
      fn: "anchor",
      side: "50%",
    })
  })

  test("named side with a fallback", () => {
    expect(parseAnchor("anchor(--btn bottom, 8px)")).toEqual({
      fn: "anchor",
      name: "--btn",
      side: "bottom",
      fallback: "8px",
    })
  })

  test("not a function returns null", () => {
    expect(parseAnchor("bottom")).toBeNull()
  })

  test("an unknown function name returns null", () => {
    expect(parseAnchor("calc(--btn bottom)")).toBeNull()
  })

  test("empty args returns null", () => {
    expect(parseAnchor("anchor()")).toBeNull()
  })
})

// ===========================================================================
// parsePositionTry
// ===========================================================================

describe("parsePositionTry", () => {
  test("a dashed-ident + tactic fallback", () => {
    expect(parsePositionTry("--fallback, flip-block")).toEqual([
      { kind: "tactics", idents: ["--fallback"], tactics: [] },
      { kind: "tactics", idents: [], tactics: ["flip-block"] },
    ])
  })

  test("two tactics in one fallback", () => {
    expect(parsePositionTry("flip-block flip-inline")).toEqual([
      { kind: "tactics", idents: [], tactics: ["flip-block", "flip-inline"] },
    ])
  })

  test("none + ident-tactic + position-area mix", () => {
    expect(parsePositionTry("top, none, --a flip-start")).toEqual([
      { kind: "area", area: "top" },
      { kind: "none" },
      { kind: "tactics", idents: ["--a"], tactics: ["flip-start"] },
    ])
  })

  test("a position-area fallback", () => {
    expect(parsePositionTry("top left")).toEqual([
      { kind: "area", area: "top left" },
    ])
  })

  test("empty string yields an empty list", () => {
    expect(parsePositionTry("   ")).toEqual([])
  })
})

// ===========================================================================
// cellToKeywords / keywordsToCell — the 3×3 grid mapping (physical)
// ===========================================================================

describe("cellToKeywords (physical)", () => {
  test("the 8 ring cells emit a pair", () => {
    expect(cellToKeywords(0, 0)).toEqual(["top", "left"])
    expect(cellToKeywords(0, 1)).toEqual(["top", "center"])
    expect(cellToKeywords(0, 2)).toEqual(["top", "right"])
    expect(cellToKeywords(1, 0)).toEqual(["center", "left"])
    expect(cellToKeywords(1, 2)).toEqual(["center", "right"])
    expect(cellToKeywords(2, 0)).toEqual(["bottom", "left"])
    expect(cellToKeywords(2, 1)).toEqual(["bottom", "center"])
    expect(cellToKeywords(2, 2)).toEqual(["bottom", "right"])
  })

  test("the center cell emits the single `center` keyword pair", () => {
    expect(cellToKeywords(1, 1)).toEqual(["center", "center"])
  })
})

describe("keywordsToCell (physical)", () => {
  test("a physical pair round-trips back to its cell", () => {
    expect(keywordsToCell(["top", "left"])).toEqual({ row: 0, col: 0 })
    expect(keywordsToCell(["bottom", "right"])).toEqual({ row: 2, col: 2 })
    expect(keywordsToCell(["center", "right"])).toEqual({ row: 1, col: 2 })
    expect(keywordsToCell(["top", "center"])).toEqual({ row: 0, col: 1 })
  })

  test("order-insensitive (left top == top left)", () => {
    expect(keywordsToCell(["left", "top"])).toEqual({ row: 0, col: 0 })
  })

  test("single `center` maps to the middle cell", () => {
    expect(keywordsToCell(["center"])).toEqual({ row: 1, col: 1 })
  })

  test("logical pairs map onto the same cells", () => {
    expect(keywordsToCell(["block-start", "inline-start"])).toEqual({
      row: 0,
      col: 0,
    })
    expect(keywordsToCell(["block-end", "inline-end"])).toEqual({
      row: 2,
      col: 2,
    })
  })

  test("an unmappable pair returns null", () => {
    expect(keywordsToCell(["nowhere", "top"])).toBeNull()
  })
})

describe("cellToKeywords round-trips through keywordsToCell", () => {
  test("every cell", () => {
    for (let row = 0 as 0 | 1 | 2; row <= 2; row = (row + 1) as 0 | 1 | 2) {
      for (let col = 0 as 0 | 1 | 2; col <= 2; col = (col + 1) as 0 | 1 | 2) {
        const kws = cellToKeywords(row, col)
        expect(keywordsToCell(kws)).toEqual({ row, col })
      }
    }
  })
})

// ===========================================================================
// option sources
// ===========================================================================

describe("option sources", () => {
  test("positionAreaKeywords includes the common set", () => {
    const kws = positionAreaKeywords()
    expect(kws).toContain("top")
    expect(kws).toContain("center")
    expect(kws).toContain("block-start")
    expect(kws).toContain("span-all")
    expect(kws).toContain("span-inline-end")
  })

  test("anchorSides are the anchor() side keywords", () => {
    const sides = anchorSides()
    expect(sides).toContain("top")
    expect(sides).toContain("center")
    expect(sides).toContain("inside")
    expect(sides).toContain("outside")
    expect(sides).not.toContain("width")
  })

  test("anchorSizes are the anchor-size() dimension keywords", () => {
    const sizes = anchorSizes()
    expect(sizes).toContain("width")
    expect(sizes).toContain("height")
    expect(sizes).toContain("self-inline")
    expect(sizes).not.toContain("top")
  })

  test("tryTactics are the three flip tactics", () => {
    expect(tryTactics()).toEqual(["flip-block", "flip-inline", "flip-start"])
  })
})

// ===========================================================================
// defaultFor
// ===========================================================================

describe("defaultFor", () => {
  test("position-area seeds a valid single keyword", () => {
    const seed = defaultFor("position-area")
    expect(parsePositionArea(seed).error).toBeNull()
  })

  test("anchor seeds a valid anchor() value", () => {
    const seed = defaultFor("anchor")
    expect(parseAnchor(seed)).not.toBeNull()
  })

  test("position-try seeds a non-empty fallback chain", () => {
    const seed = defaultFor("position-try")
    expect(parsePositionTry(seed).length).toBeGreaterThan(0)
  })
})
