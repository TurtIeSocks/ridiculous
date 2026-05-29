import { describe, expect, test } from "vitest"
import {
  formatFont,
  parseFont,
} from "@/components/ui/font-editor/font-editor.helpers"
import type { FontParts } from "@/components/ui/font-editor/font-editor.types"

describe("formatFont", () => {
  test("serializes a full shorthand in canonical order", () => {
    const parts: FontParts = {
      kind: "shorthand",
      style: "italic",
      variant: "small-caps",
      weight: "bold",
      stretch: "condensed",
      size: "16px",
      lineHeight: "1.5",
      family: ["Times New Roman", "serif"],
    }
    expect(formatFont(parts)).toBe(
      "italic small-caps bold condensed 16px/1.5 Times New Roman, serif",
    )
  })

  test("drops omitted prefix fields and line-height", () => {
    expect(
      formatFont({ kind: "shorthand", size: "16px", family: ["serif"] }),
    ).toBe("16px serif")
    expect(
      formatFont({
        kind: "shorthand",
        weight: "bold",
        size: "1.5rem",
        family: ["sans-serif"],
      }),
    ).toBe("bold 1.5rem sans-serif")
  })

  test("joins a multi-family list with comma-space", () => {
    expect(
      formatFont({
        kind: "shorthand",
        size: "16px",
        family: ["'My Font'", "Arial", "monospace"],
      }),
    ).toBe("16px 'My Font', Arial, monospace")
  })

  test("serializes a system-font keyword to itself", () => {
    expect(formatFont({ kind: "system", keyword: "caption" })).toBe("caption")
  })

  test("round-trips a parsed value to canonical form", () => {
    const round = (s: string) => {
      const parts = parseFont(s)
      if (parts === null) throw new Error(`expected "${s}" to parse`)
      return formatFont(parts)
    }
    expect(round("italic   bold   16px/1.5   serif")).toBe(
      "italic bold 16px/1.5 serif",
    )
    expect(round("16px / 1.5 serif")).toBe("16px/1.5 serif")
    expect(round("caption")).toBe("caption")
    expect(round("16px 'Times New Roman' , serif")).toBe(
      "16px 'Times New Roman', serif",
    )
  })
})
