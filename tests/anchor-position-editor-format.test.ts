import { describe, expect, test } from "vitest"
import {
  formatAnchor,
  formatPositionArea,
  formatPositionTry,
  parseAnchor,
  parsePositionArea,
  parsePositionTry,
} from "@/components/ui/anchor-position-editor/anchor-position-editor.helpers"

// ===========================================================================
// formatPositionArea — canonical serialization
// ===========================================================================

describe("formatPositionArea", () => {
  test("a single keyword stays single", () => {
    expect(formatPositionArea(["center"])).toBe("center")
  })

  test("a pair joins with one space", () => {
    expect(formatPositionArea(["top", "left"])).toBe("top left")
  })

  test("a duplicate `center` pair collapses to a single `center`", () => {
    expect(formatPositionArea(["center", "center"])).toBe("center")
  })

  test("a logical pair", () => {
    expect(formatPositionArea(["block-start", "inline-start"])).toBe(
      "block-start inline-start",
    )
  })

  test("an empty list serializes to the empty string", () => {
    expect(formatPositionArea([])).toBe("")
  })

  test("round-trips through parsePositionArea", () => {
    for (const src of ["center", "top left", "block-start span-inline-end"]) {
      const { keywords } = parsePositionArea(src)
      expect(formatPositionArea(keywords)).toBe(src)
    }
  })
})

// ===========================================================================
// formatAnchor — canonical serialization
// ===========================================================================

describe("formatAnchor", () => {
  test("named side", () => {
    expect(formatAnchor({ fn: "anchor", name: "--btn", side: "bottom" })).toBe(
      "anchor(--btn bottom)",
    )
  })

  test("side only", () => {
    expect(formatAnchor({ fn: "anchor", side: "top" })).toBe("anchor(top)")
  })

  test("named side with a fallback", () => {
    expect(
      formatAnchor({
        fn: "anchor",
        name: "--btn",
        side: "bottom",
        fallback: "8px",
      }),
    ).toBe("anchor(--btn bottom, 8px)")
  })

  test("side with a fallback, no name", () => {
    expect(formatAnchor({ fn: "anchor", side: "top", fallback: "8px" })).toBe(
      "anchor(top, 8px)",
    )
  })

  test("anchor-size", () => {
    expect(
      formatAnchor({ fn: "anchor-size", name: "--btn", side: "width" }),
    ).toBe("anchor-size(--btn width)")
  })

  test("round-trips through parseAnchor", () => {
    for (const src of [
      "anchor(--btn bottom)",
      "anchor(top, 8px)",
      "anchor-size(--btn width)",
      "anchor(--btn bottom, 8px)",
    ]) {
      const expr = parseAnchor(src)
      expect(expr && formatAnchor(expr)).toBe(src)
    }
  })
})

// ===========================================================================
// formatPositionTry — canonical serialization
// ===========================================================================

describe("formatPositionTry", () => {
  test("none", () => {
    expect(formatPositionTry([{ kind: "none" }])).toBe("none")
  })

  test("a single position-area fallback", () => {
    expect(formatPositionTry([{ kind: "area", area: "top left" }])).toBe(
      "top left",
    )
  })

  test("an ident + tactic fallback", () => {
    expect(
      formatPositionTry([
        { kind: "tactics", idents: ["--a"], tactics: ["flip-block"] },
      ]),
    ).toBe("--a flip-block")
  })

  test("a comma chain", () => {
    expect(
      formatPositionTry([
        { kind: "tactics", idents: ["--a"], tactics: ["flip-block"] },
        { kind: "none" },
      ]),
    ).toBe("--a flip-block, none")
  })

  test("a tactic-only fallback", () => {
    expect(
      formatPositionTry([
        { kind: "tactics", idents: [], tactics: ["flip-inline"] },
      ]),
    ).toBe("flip-inline")
  })

  test("round-trips through parsePositionTry", () => {
    for (const src of [
      "--fallback, flip-block",
      "flip-block flip-inline",
      "top, none, --a flip-start",
      "--a flip-block, none",
    ]) {
      expect(formatPositionTry(parsePositionTry(src))).toBe(src)
    }
  })
})
