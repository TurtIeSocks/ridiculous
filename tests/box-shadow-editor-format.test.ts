import { describe, expect, test } from "vitest"
import {
  formatBoxShadow,
  layerToCss,
  parseBoxShadow,
} from "@/components/ui/box-shadow-editor/box-shadow-editor.helpers"
import type { ShadowLayer } from "@/components/ui/box-shadow-editor/box-shadow-editor.types"

describe("layerToCss", () => {
  test("serializes x y only", () => {
    expect(layerToCss({ inset: false, offsetX: "0px", offsetY: "4px" })).toBe(
      "0px 4px",
    )
  })

  test("serializes inset leading and color last", () => {
    expect(
      layerToCss({
        inset: true,
        offsetX: "0px",
        offsetY: "0px",
        blur: "2px",
        color: "#000",
      }),
    ).toBe("inset 0px 0px 2px #000")
  })

  test("includes spread between blur and color", () => {
    expect(
      layerToCss({
        inset: false,
        offsetX: "0px",
        offsetY: "4px",
        blur: "8px",
        spread: "1px",
        color: "rgb(0 0 0 / 0.2)",
      }),
    ).toBe("0px 4px 8px 1px rgb(0 0 0 / 0.2)")
  })
})

describe("formatBoxShadow", () => {
  test("joins layers with a comma+space", () => {
    const layers: ShadowLayer[] = [
      {
        inset: false,
        offsetX: "0px",
        offsetY: "1px",
        blur: "2px",
        color: "#000",
      },
      { inset: true, offsetX: "0px", offsetY: "0px", blur: "2px" },
    ]
    expect(formatBoxShadow(layers)).toBe("0px 1px 2px #000, inset 0px 0px 2px")
  })

  test("empty list serializes to none", () => {
    expect(formatBoxShadow([])).toBe("none")
  })
})

describe("round-trip (canonical form is stable)", () => {
  test("parse → format → parse is idempotent on the canonical string", () => {
    const canonical = "inset 0px 0px 2px #000, 0px 4px 8px 1px rgb(0 0 0 / 0.2)"
    const once = parseBoxShadow(canonical)
    expect(once).not.toBeNull()
    if (once === null) return
    const formatted = formatBoxShadow(once)
    expect(formatted).toBe(canonical)
    // a second pass parses to the same layers
    expect(parseBoxShadow(formatted)).toEqual(once)
  })

  test("a leading-color input normalizes to color-last on format", () => {
    const parsed = parseBoxShadow("#000 0px 4px")
    expect(parsed).not.toBeNull()
    if (parsed === null) return
    expect(formatBoxShadow(parsed)).toBe("0px 4px #000")
  })

  test("a trailing-inset input normalizes to inset-leading on format", () => {
    const parsed = parseBoxShadow("0px 4px 8px #000 inset")
    expect(parsed).not.toBeNull()
    if (parsed === null) return
    expect(formatBoxShadow(parsed)).toBe("inset 0px 4px 8px #000")
  })
})
