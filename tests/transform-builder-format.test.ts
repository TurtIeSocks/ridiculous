import { describe, expect, test } from "vitest"
import {
  formatTransform,
  itemToCss,
  parseTransform,
} from "@/components/ui/transform-builder/transform-builder.helpers"
import type { TransformItem } from "@/components/ui/transform-builder/transform-builder.types"

function mustParse(src: string): TransformItem[] {
  const items = parseTransform(src)
  if (items === null) throw new Error(`expected "${src}" to parse`)
  return items
}

describe("formatTransform", () => {
  test("normalizes inter-function whitespace to single spaces", () => {
    expect(formatTransform(mustParse("translateX(10px)   rotate(45deg)"))).toBe(
      "translateX(10px) rotate(45deg)",
    )
  })

  test("empty list serializes to none", () => {
    expect(formatTransform([])).toBe("none")
  })

  test("round-trips every function group", () => {
    const sources = [
      "translate(10px, 20%)",
      "translateZ(5px)",
      "translate3d(1px, 2%, 3px)",
      "rotate(45deg)",
      "rotate3d(1, 1, 1, 45deg)",
      "scale(1.5)",
      "scale(1, 2)",
      "scale3d(1, 2, 3)",
      "skew(10deg, 20deg)",
      "skewX(10deg)",
      "matrix(1, 0, 0, 1, 0, 0)",
      "perspective(800px)",
    ]
    for (const src of sources) {
      expect(formatTransform(mustParse(src))).toBe(src)
    }
  })

  test("omits the optional y when absent", () => {
    expect(formatTransform([{ fn: "translate", x: "10px" }])).toBe(
      "translate(10px)",
    )
    expect(formatTransform([{ fn: "scale", x: "2" }])).toBe("scale(2)")
  })
})

describe("itemToCss", () => {
  test("serializes a single item", () => {
    expect(itemToCss({ fn: "rotate", angle: "45deg" })).toBe("rotate(45deg)")
    expect(itemToCss({ fn: "translate", x: "1px", y: "2px" })).toBe(
      "translate(1px, 2px)",
    )
    expect(
      itemToCss({ fn: "matrix", values: ["1", "0", "0", "1", "0", "0"] }),
    ).toBe("matrix(1, 0, 0, 1, 0, 0)")
  })
})
