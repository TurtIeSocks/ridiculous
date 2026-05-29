import { describe, expect, test } from "vitest"
import {
  argSpec,
  defaultItem,
  filterFunctions,
  parseFilter,
} from "@/components/ui/filter-builder/filter-builder.helpers"
import type { FilterItem } from "@/components/ui/filter-builder/filter-builder.types"

/** Parse and assert non-null — keeps the suite free of `!` assertions. */
function mustParse(src: string): FilterItem[] {
  const items = parseFilter(src)
  if (items === null) throw new Error(`expected "${src}" to parse`)
  return items
}

describe("parseFilter", () => {
  test("parses a multi-function list into typed items", () => {
    expect(mustParse("blur(4px) brightness(1.2) hue-rotate(90deg)")).toEqual([
      { fn: "blur", value: "4px" },
      { fn: "brightness", value: "1.2" },
      { fn: "hue-rotate", value: "90deg" },
    ])
  })

  test("parses every amount function", () => {
    expect(mustParse("contrast(200%)")).toEqual([
      { fn: "contrast", value: "200%" },
    ])
    expect(mustParse("grayscale(0.5)")).toEqual([
      { fn: "grayscale", value: "0.5" },
    ])
    expect(
      mustParse("invert(100%) opacity(0.8) saturate(150%) sepia(0.3)"),
    ).toEqual([
      { fn: "invert", value: "100%" },
      { fn: "opacity", value: "0.8" },
      { fn: "saturate", value: "150%" },
      { fn: "sepia", value: "0.3" },
    ])
  })

  test("parses drop-shadow with blur and a functional color (kept whole)", () => {
    expect(mustParse("drop-shadow(2px 2px 4px rgb(0 0 0 / 0.5))")).toEqual([
      {
        fn: "drop-shadow",
        x: "2px",
        y: "2px",
        blur: "4px",
        color: "rgb(0 0 0 / 0.5)",
      },
    ])
  })

  test("parses drop-shadow without blur and without color", () => {
    expect(mustParse("drop-shadow(2px 2px)")).toEqual([
      { fn: "drop-shadow", x: "2px", y: "2px" },
    ])
    expect(mustParse("drop-shadow(2px 2px #000)")).toEqual([
      { fn: "drop-shadow", x: "2px", y: "2px", color: "#000" },
    ])
    expect(mustParse("drop-shadow(2px 2px 4px)")).toEqual([
      { fn: "drop-shadow", x: "2px", y: "2px", blur: "4px" },
    ])
  })

  test("normalizes a leading-color drop-shadow to color-last (runtime tolerant)", () => {
    expect(mustParse("drop-shadow(red 2px 2px)")).toEqual([
      { fn: "drop-shadow", x: "2px", y: "2px", color: "red" },
    ])
    expect(mustParse("drop-shadow(#000 2px 2px 4px)")).toEqual([
      { fn: "drop-shadow", x: "2px", y: "2px", blur: "4px", color: "#000" },
    ])
  })

  test("parses url variants", () => {
    expect(mustParse("url(#f)")).toEqual([{ fn: "url", url: "#f" }])
    expect(mustParse('url("filters.svg#blur")')).toEqual([
      { fn: "url", url: '"filters.svg#blur"' },
    ])
    expect(mustParse("url(filter.svg)")).toEqual([
      { fn: "url", url: "filter.svg" },
    ])
  })

  test("none and empty parse to an empty list", () => {
    expect(parseFilter("none")).toEqual([])
    expect(parseFilter("")).toEqual([])
    expect(parseFilter("   ")).toEqual([])
  })

  test("arity violations and unknown functions reject (null)", () => {
    expect(parseFilter("blur(1px, 2px)")).toBeNull()
    expect(parseFilter("drop-shadow(2px)")).toBeNull()
    expect(parseFilter("drop-shadow(2px 2px 3px 4px 5px)")).toBeNull()
    expect(parseFilter("url()")).toBeNull()
    expect(parseFilter("wobble(3)")).toBeNull()
    expect(parseFilter("blur")).toBeNull()
  })

  test("keeps calc()/var() arguments verbatim (runtime is tolerant)", () => {
    expect(mustParse("blur(calc(4px + 1px))")).toEqual([
      { fn: "blur", value: "calc(4px + 1px)" },
    ])
    expect(mustParse("brightness(var(--b))")).toEqual([
      { fn: "brightness", value: "var(--b)" },
    ])
  })

  test("tolerates extra whitespace between functions", () => {
    expect(mustParse("blur(4px)   brightness(1.2)")).toEqual([
      { fn: "blur", value: "4px" },
      { fn: "brightness", value: "1.2" },
    ])
  })
})

describe("filterFunctions", () => {
  test("lists function names in order", () => {
    expect(filterFunctions("blur(4px) brightness(1.2)")).toEqual([
      "blur",
      "brightness",
    ])
    expect(filterFunctions("none")).toEqual([])
  })
})

describe("defaultItem", () => {
  test("seeds sensible defaults per function", () => {
    expect(defaultItem("blur")).toEqual({ fn: "blur", value: "4px" })
    expect(defaultItem("brightness")).toEqual({
      fn: "brightness",
      value: "1",
    })
    expect(defaultItem("hue-rotate")).toEqual({
      fn: "hue-rotate",
      value: "90deg",
    })
    expect(defaultItem("drop-shadow")).toEqual({
      fn: "drop-shadow",
      x: "4px",
      y: "4px",
      blur: "8px",
      color: "rgb(0 0 0 / 0.5)",
    })
    expect(defaultItem("url")).toEqual({ fn: "url", url: "#filter" })
  })
})

describe("argSpec", () => {
  test("describes arity and argument kinds", () => {
    expect(argSpec("blur")).toMatchObject({ min: 1, max: 1, kind: "length" })
    expect(argSpec("hue-rotate")).toMatchObject({
      min: 1,
      max: 1,
      kind: "angle",
    })
    expect(argSpec("brightness")).toMatchObject({
      min: 1,
      max: 1,
      kind: "amount",
    })
    expect(argSpec("drop-shadow")).toMatchObject({
      min: 2,
      max: 4,
      kind: "shadow",
    })
    expect(argSpec("url")).toMatchObject({ min: 1, max: 1, kind: "url" })
  })
})
