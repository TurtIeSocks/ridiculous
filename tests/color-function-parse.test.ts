import { describe, expect, test } from "vitest"
import {
  colorFunctionKind,
  defaultState,
  parseColorFunction,
} from "@/components/ui/color-function/color-function.helpers"
import type { ColorFunctionState } from "@/components/ui/color-function/color-function.types"

/** Parse and assert non-null — keeps the suite free of `!` assertions. */
function mustParse(src: string): ColorFunctionState {
  const state = parseColorFunction(src)
  if (state === null) throw new Error(`expected "${src}" to parse`)
  return state
}

describe("parseColorFunction — color-mix", () => {
  test("parses an interpolation space + two weighted colors", () => {
    expect(mustParse("color-mix(in oklch, #f00 30%, #00f 70%)")).toEqual({
      kind: "color-mix",
      space: "oklch",
      colorA: "#f00",
      pctA: "30%",
      colorB: "#00f",
      pctB: "70%",
    })
  })

  test("parses a hue method on a cylindrical space and keeps keyword colors", () => {
    expect(mustParse("color-mix(in hsl shorter hue, red, blue)")).toEqual({
      kind: "color-mix",
      space: "hsl",
      hue: "shorter",
      colorA: "red",
      colorB: "blue",
    })
  })

  test("parses a single percentage", () => {
    expect(mustParse("color-mix(in srgb, #f00 25%, #00f)")).toEqual({
      kind: "color-mix",
      space: "srgb",
      colorA: "#f00",
      pctA: "25%",
      colorB: "#00f",
    })
  })

  test("keeps functional colors whole (paren-aware)", () => {
    expect(
      mustParse("color-mix(in oklch, oklch(0.5 0.1 240), rgb(0 0 255))"),
    ).toEqual({
      kind: "color-mix",
      space: "oklch",
      colorA: "oklch(0.5 0.1 240)",
      colorB: "rgb(0 0 255)",
    })
  })

  test("returns null on wrong arity / missing in", () => {
    expect(parseColorFunction("color-mix(in srgb, #f00)")).toBeNull()
    expect(
      parseColorFunction("color-mix(in srgb, #f00, #00f, #0f0)"),
    ).toBeNull()
    expect(parseColorFunction("color-mix(srgb, #f00, #00f)")).toBeNull()
  })

  test("returns null on an unknown colorspace", () => {
    expect(parseColorFunction("color-mix(in bogus, #f00, #00f)")).toBeNull()
  })
})

describe("parseColorFunction — light-dark", () => {
  test("parses exactly two colors", () => {
    expect(mustParse("light-dark(#fff, #000)")).toEqual({
      kind: "light-dark",
      light: "#fff",
      dark: "#000",
    })
  })

  test("keeps var() / functional colors whole", () => {
    expect(mustParse("light-dark(var(--l), oklch(0.2 0 0))")).toEqual({
      kind: "light-dark",
      light: "var(--l)",
      dark: "oklch(0.2 0 0)",
    })
  })

  test("returns null on wrong arity", () => {
    expect(parseColorFunction("light-dark(#fff)")).toBeNull()
    expect(parseColorFunction("light-dark(#fff, #000, #ccc)")).toBeNull()
  })
})

describe("parseColorFunction — relative", () => {
  test("parses from-color + channels + alpha", () => {
    expect(mustParse("oklch(from red l c h / 50%)")).toEqual({
      kind: "relative",
      fn: "oklch",
      from: "red",
      c1: "l",
      c2: "c",
      c3: "h",
      alpha: "50%",
    })
  })

  test("parses a var() source color", () => {
    expect(mustParse("rgb(from var(--c) r g b)")).toEqual({
      kind: "relative",
      fn: "rgb",
      from: "var(--c)",
      c1: "r",
      c2: "g",
      c3: "b",
    })
  })

  test("keeps a calc() channel verbatim (paren-aware)", () => {
    expect(mustParse("oklch(from #f00 calc(l * 2) c h)")).toEqual({
      kind: "relative",
      fn: "oklch",
      from: "#f00",
      c1: "calc(l * 2)",
      c2: "c",
      c3: "h",
    })
  })

  test("parses the color() form with a colorspace ident", () => {
    expect(mustParse("color(from #f00 srgb r g b)")).toEqual({
      kind: "relative",
      fn: "color",
      from: "#f00",
      space: "srgb",
      c1: "r",
      c2: "g",
      c3: "b",
    })
  })

  test("returns null without a from keyword or with a wrong channel count", () => {
    expect(parseColorFunction("rgb(255 0 0)")).toBeNull()
    expect(parseColorFunction("oklch(from #f00 l c)")).toBeNull()
    expect(parseColorFunction("oklch(from #f00 l c h x)")).toBeNull()
  })
})

describe("parseColorFunction — dispatch errors", () => {
  test("returns null on an unknown function / empty", () => {
    expect(parseColorFunction("rotate(90deg)")).toBeNull()
    expect(parseColorFunction("")).toBeNull()
    expect(parseColorFunction("#f00")).toBeNull()
  })
})

describe("colorFunctionKind", () => {
  test("mirrors KindOf for each family and null otherwise", () => {
    expect(colorFunctionKind("color-mix(in srgb, #f00, #00f)")).toBe(
      "color-mix",
    )
    expect(colorFunctionKind("oklch(from #f00 l c h)")).toBe("relative")
    expect(colorFunctionKind("light-dark(#fff, #000)")).toBe("light-dark")
    expect(colorFunctionKind("rgb(255 0 0)")).toBeNull()
  })
})

describe("defaultState", () => {
  test("seeds a valid state per mode that round-trips", () => {
    const mix = defaultState("color-mix")
    expect(mix.kind).toBe("color-mix")
    const rel = defaultState("relative")
    expect(rel.kind).toBe("relative")
    const ld = defaultState("light-dark")
    expect(ld.kind).toBe("light-dark")
  })
})
