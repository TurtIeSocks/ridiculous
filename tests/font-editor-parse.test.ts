import { describe, expect, test } from "vitest"
import {
  classifyFamilyToken,
  classifySize,
  classifyWeight,
  defaultParts,
  fontFamilies,
  parseFont,
} from "@/components/ui/font-editor/font-editor.helpers"
import type { FontParts } from "@/components/ui/font-editor/font-editor.types"

/** Parse and assert non-null — keeps the suite free of `!` assertions. */
function mustParse(src: string): FontParts {
  const parts = parseFont(src)
  if (parts === null) throw new Error(`expected "${src}" to parse`)
  return parts
}

describe("parseFont", () => {
  test("parses a full shorthand into typed parts", () => {
    expect(
      mustParse("italic small-caps bold ultra-condensed 16px/1.5 serif"),
    ).toEqual({
      kind: "shorthand",
      style: "italic",
      variant: "small-caps",
      weight: "bold",
      stretch: "ultra-condensed",
      size: "16px",
      lineHeight: "1.5",
      family: ["serif"],
    })
  })

  test("parses a minimal size + family", () => {
    expect(mustParse("16px serif")).toEqual({
      kind: "shorthand",
      size: "16px",
      family: ["serif"],
    })
  })

  test("parses a system-font keyword", () => {
    expect(mustParse("caption")).toEqual({ kind: "system", keyword: "caption" })
    expect(mustParse("status-bar")).toEqual({
      kind: "system",
      keyword: "status-bar",
    })
  })

  test("parses a multi-word + quoted family list", () => {
    expect(mustParse("16px 'Times New Roman', Arial, serif")).toEqual({
      kind: "shorthand",
      size: "16px",
      family: ["'Times New Roman'", "Arial", "serif"],
    })
    expect(mustParse('16px "My Font", monospace')).toEqual({
      kind: "shorthand",
      size: "16px",
      family: ['"My Font"', "monospace"],
    })
  })

  test("accepts all four line-height spacings to the same value", () => {
    for (const src of [
      "16px/1.5 serif",
      "16px/ 1.5 serif",
      "16px /1.5 serif",
      "16px / 1.5 serif",
    ]) {
      const parts = mustParse(src)
      if (parts.kind !== "shorthand") throw new Error("expected shorthand")
      expect(parts.size).toBe("16px")
      expect(parts.lineHeight).toBe("1.5")
      expect(parts.family).toEqual(["serif"])
    }
  })

  test("prefix tokens are order-free", () => {
    const a = mustParse("bold italic 16px serif")
    const b = mustParse("italic bold 16px serif")
    expect(a).toEqual(b)
  })

  test("missing size rejects (null)", () => {
    expect(parseFont("italic bold serif")).toBeNull()
  })

  test("missing family rejects (null)", () => {
    expect(parseFont("16px")).toBeNull()
    expect(parseFont("italic bold 16px")).toBeNull()
  })

  test("duplicate prefix kind rejects (null)", () => {
    expect(parseFont("italic oblique 16px serif")).toBeNull()
    expect(parseFont("bold 700 16px serif")).toBeNull()
    expect(parseFont("condensed expanded 16px serif")).toBeNull()
  })

  test("empty input rejects (null)", () => {
    expect(parseFont("")).toBeNull()
    expect(parseFont("   ")).toBeNull()
  })

  test("keeps var() family tokens verbatim (runtime is tolerant)", () => {
    expect(mustParse("16px var(--stack)")).toEqual({
      kind: "shorthand",
      size: "16px",
      family: ["var(--stack)"],
    })
  })

  test("does not split inside a var() fallback list", () => {
    const parts = mustParse("16px var(--a, Arial, serif)")
    if (parts.kind !== "shorthand") throw new Error("expected shorthand")
    expect(parts.family).toEqual(["var(--a, Arial, serif)"])
  })

  test("numeric weight + percentage stretch parse", () => {
    expect(mustParse("350 90% 16px serif")).toEqual({
      kind: "shorthand",
      weight: "350",
      stretch: "90%",
      size: "16px",
      family: ["serif"],
    })
  })

  test("leading normal consumes a prefix slot without blocking later tokens", () => {
    expect(mustParse("normal bold 16px serif")).toEqual({
      kind: "shorthand",
      style: "normal",
      weight: "bold",
      size: "16px",
      family: ["serif"],
    })
  })
})

describe("fontFamilies", () => {
  test("lists the comma-separated families in order", () => {
    expect(fontFamilies("16px 'Times New Roman', serif")).toEqual([
      "'Times New Roman'",
      "serif",
    ])
    expect(fontFamilies("caption")).toEqual([])
    expect(fontFamilies("16px")).toEqual([])
  })
})

describe("defaultParts", () => {
  test("seeds a sensible shorthand", () => {
    expect(defaultParts()).toEqual({
      kind: "shorthand",
      size: "16px",
      family: ["sans-serif"],
    })
  })
})

describe("classifiers", () => {
  test("classifySize accepts keywords, length, percentage; rejects junk", () => {
    expect(classifySize("16px")).toBe(true)
    expect(classifySize("x-large")).toBe(true)
    expect(classifySize("50%")).toBe(true)
    expect(classifySize("serif")).toBe(false)
  })

  test("classifyWeight accepts keywords and numbers", () => {
    expect(classifyWeight("bold")).toBe(true)
    expect(classifyWeight("350")).toBe(true)
    expect(classifyWeight("italic")).toBe(false)
  })

  test("classifyFamilyToken accepts generics, quoted, idents; rejects leading-digit", () => {
    expect(classifyFamilyToken("serif")).toBe(true)
    expect(classifyFamilyToken("'My Font'")).toBe(true)
    expect(classifyFamilyToken("Times New Roman")).toBe(true)
    expect(classifyFamilyToken("var(--x)")).toBe(true)
    expect(classifyFamilyToken("")).toBe(false)
  })
})
