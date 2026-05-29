import { describe, expect, test } from "vitest"
import {
  formatFilter,
  itemToCss,
  parseFilter,
} from "@/components/ui/filter-builder/filter-builder.helpers"
import type { FilterItem } from "@/components/ui/filter-builder/filter-builder.types"

function mustParse(src: string): FilterItem[] {
  const items = parseFilter(src)
  if (items === null) throw new Error(`expected "${src}" to parse`)
  return items
}

describe("formatFilter", () => {
  test("normalizes inter-function whitespace to single spaces", () => {
    expect(formatFilter(mustParse("blur(4px)   brightness(1.2)"))).toBe(
      "blur(4px) brightness(1.2)",
    )
  })

  test("empty list serializes to none", () => {
    expect(formatFilter([])).toBe("none")
  })

  test("round-trips every function group", () => {
    const sources = [
      "blur(4px)",
      "brightness(1.2)",
      "contrast(200%)",
      "grayscale(0.5)",
      "hue-rotate(90deg)",
      "invert(100%)",
      "opacity(0.8)",
      "saturate(150%)",
      "sepia(0.3)",
      "drop-shadow(2px 2px 4px #000)",
      "url(#filter)",
    ]
    for (const src of sources) {
      expect(formatFilter(mustParse(src))).toBe(src)
    }
  })

  test("drop-shadow serializes color-last with optional blur/color", () => {
    expect(
      formatFilter([
        { fn: "drop-shadow", x: "2px", y: "2px", blur: "4px", color: "#000" },
      ]),
    ).toBe("drop-shadow(2px 2px 4px #000)")
    expect(
      formatFilter([{ fn: "drop-shadow", x: "2px", y: "2px", color: "#000" }]),
    ).toBe("drop-shadow(2px 2px #000)")
    expect(
      formatFilter([{ fn: "drop-shadow", x: "2px", y: "2px", blur: "4px" }]),
    ).toBe("drop-shadow(2px 2px 4px)")
    expect(formatFilter([{ fn: "drop-shadow", x: "2px", y: "2px" }])).toBe(
      "drop-shadow(2px 2px)",
    )
  })

  test("normalizes a leading-color drop-shadow to color-last via round-trip", () => {
    expect(formatFilter(mustParse("drop-shadow(red 2px 2px)"))).toBe(
      "drop-shadow(2px 2px red)",
    )
  })
})

describe("itemToCss", () => {
  test("serializes a single item per kind", () => {
    expect(itemToCss({ fn: "blur", value: "4px" })).toBe("blur(4px)")
    expect(itemToCss({ fn: "hue-rotate", value: "90deg" })).toBe(
      "hue-rotate(90deg)",
    )
    expect(itemToCss({ fn: "saturate", value: "150%" })).toBe("saturate(150%)")
    expect(itemToCss({ fn: "url", url: "#f" })).toBe("url(#f)")
    expect(
      itemToCss({
        fn: "drop-shadow",
        x: "1px",
        y: "2px",
        blur: "3px",
        color: "rgb(0 0 0 / 0.5)",
      }),
    ).toBe("drop-shadow(1px 2px 3px rgb(0 0 0 / 0.5))")
  })
})
