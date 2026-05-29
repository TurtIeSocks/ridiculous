import { describe, expect, test } from "vitest"
import {
  boxShadowLayerCount,
  defaultLayer,
  parseBoxShadow,
} from "@/components/ui/box-shadow-editor/box-shadow-editor.helpers"
import type { ShadowLayer } from "@/components/ui/box-shadow-editor/box-shadow-editor.types"

/** Parse and assert non-null — keeps the suite free of `!` assertions. */
function mustParse(src: string): ShadowLayer[] {
  const layers = parseBoxShadow(src)
  if (layers === null) throw new Error(`expected "${src}" to parse`)
  return layers
}

describe("parseBoxShadow", () => {
  test("parses a single layer with blur and a functional color (kept whole)", () => {
    expect(mustParse("0px 4px 8px rgb(0 0 0 / 0.2)")).toEqual([
      {
        inset: false,
        offsetX: "0px",
        offsetY: "4px",
        blur: "8px",
        color: "rgb(0 0 0 / 0.2)",
      },
    ])
  })

  test("parses the minimal two-length layer", () => {
    expect(mustParse("0px 4px")).toEqual([
      { inset: false, offsetX: "0px", offsetY: "4px" },
    ])
  })

  test("parses a four-length layer with spread", () => {
    expect(mustParse("0px 4px 8px 1px")).toEqual([
      {
        inset: false,
        offsetX: "0px",
        offsetY: "4px",
        blur: "8px",
        spread: "1px",
      },
    ])
  })

  test("parses a leading inset shadow", () => {
    expect(mustParse("inset 0px 0px 4px #000")).toEqual([
      {
        inset: true,
        offsetX: "0px",
        offsetY: "0px",
        blur: "4px",
        color: "#000",
      },
    ])
  })

  test("parses a trailing inset shadow (normalized into the record)", () => {
    expect(mustParse("0px 4px 8px #000 inset")).toEqual([
      {
        inset: true,
        offsetX: "0px",
        offsetY: "4px",
        blur: "8px",
        color: "#000",
      },
    ])
  })

  test("normalizes a leading color to color-last (runtime tolerant)", () => {
    expect(mustParse("#000 0px 4px")).toEqual([
      { inset: false, offsetX: "0px", offsetY: "4px", color: "#000" },
    ])
    expect(mustParse("red 2px 2px 4px")).toEqual([
      {
        inset: false,
        offsetX: "2px",
        offsetY: "2px",
        blur: "4px",
        color: "red",
      },
    ])
  })

  test("parses a multi-layer comma list", () => {
    expect(mustParse("0px 1px 2px #000, inset 0px 0px 2px")).toEqual([
      {
        inset: false,
        offsetX: "0px",
        offsetY: "1px",
        blur: "2px",
        color: "#000",
      },
      { inset: true, offsetX: "0px", offsetY: "0px", blur: "2px" },
    ])
  })

  test("none and empty parse to an empty list", () => {
    expect(parseBoxShadow("none")).toEqual([])
    expect(parseBoxShadow("")).toEqual([])
    expect(parseBoxShadow("   ")).toEqual([])
  })

  test("arity violations and duplicates reject (null)", () => {
    expect(parseBoxShadow("0px")).toBeNull()
    expect(parseBoxShadow("0px 1px 2px 3px 4px")).toBeNull()
    expect(parseBoxShadow("0px 4px #000 #fff")).toBeNull()
    expect(parseBoxShadow("inset 0px 4px inset")).toBeNull()
    expect(parseBoxShadow("inset")).toBeNull()
  })

  test("a layer with only one length rejects (null)", () => {
    expect(parseBoxShadow("2px #000")).toBeNull()
  })

  test("keeps calc()/var() tokens verbatim (runtime is tolerant)", () => {
    expect(mustParse("calc(0px + 1px) 4px")).toEqual([
      { inset: false, offsetX: "calc(0px + 1px)", offsetY: "4px" },
    ])
    expect(mustParse("0px 4px var(--blur)")).toEqual([
      { inset: false, offsetX: "0px", offsetY: "4px", blur: "var(--blur)" },
    ])
  })

  test("tolerates extra whitespace within and between layers", () => {
    expect(mustParse("0px   4px,   0px 8px")).toEqual([
      { inset: false, offsetX: "0px", offsetY: "4px" },
      { inset: false, offsetX: "0px", offsetY: "8px" },
    ])
  })

  test("inset with the keyword in any case is recognized", () => {
    expect(mustParse("INSET 0px 4px")).toEqual([
      { inset: true, offsetX: "0px", offsetY: "4px" },
    ])
  })
})

describe("boxShadowLayerCount", () => {
  test("counts layers; none → 0; invalid → 0", () => {
    expect(boxShadowLayerCount("0px 4px, 0px 8px")).toBe(2)
    expect(boxShadowLayerCount("0px 4px")).toBe(1)
    expect(boxShadowLayerCount("none")).toBe(0)
    expect(boxShadowLayerCount("0px")).toBe(0)
  })
})

describe("defaultLayer", () => {
  test("seeds a soft drop shadow", () => {
    expect(defaultLayer()).toEqual({
      inset: false,
      offsetX: "0px",
      offsetY: "4px",
      blur: "8px",
      color: "rgb(0 0 0 / 0.25)",
    })
  })
})
