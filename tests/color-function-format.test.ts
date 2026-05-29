import { describe, expect, test } from "vitest"
import {
  formatColorFunction,
  parseColorFunction,
} from "@/components/ui/color-function/color-function.helpers"
import type { ColorFunctionState } from "@/components/ui/color-function/color-function.types"

describe("formatColorFunction", () => {
  test("serializes a color-mix with hue method + weights", () => {
    const state: ColorFunctionState = {
      kind: "color-mix",
      space: "oklch",
      hue: "shorter",
      colorA: "#f00",
      pctA: "30%",
      colorB: "#00f",
      pctB: "70%",
    }
    expect(formatColorFunction(state)).toBe(
      "color-mix(in oklch shorter hue, #f00 30%, #00f 70%)",
    )
  })

  test("omits the hue clause and optional weights when absent", () => {
    expect(
      formatColorFunction({
        kind: "color-mix",
        space: "srgb",
        colorA: "#f00",
        colorB: "#00f",
      }),
    ).toBe("color-mix(in srgb, #f00, #00f)")
  })

  test("serializes light-dark", () => {
    expect(
      formatColorFunction({ kind: "light-dark", light: "#fff", dark: "#000" }),
    ).toBe("light-dark(#fff, #000)")
  })

  test("serializes a relative color with alpha", () => {
    expect(
      formatColorFunction({
        kind: "relative",
        fn: "oklch",
        from: "red",
        c1: "l",
        c2: "c",
        c3: "h",
        alpha: "50%",
      }),
    ).toBe("oklch(from red l c h / 50%)")
  })

  test("serializes the color() form with a colorspace ident", () => {
    expect(
      formatColorFunction({
        kind: "relative",
        fn: "color",
        from: "#f00",
        space: "srgb",
        c1: "r",
        c2: "g",
        c3: "b",
      }),
    ).toBe("color(from #f00 srgb r g b)")
  })
})

describe("parse ∘ format idempotence", () => {
  const samples = [
    "color-mix(in oklch shorter hue, #f00 30%, #00f 70%)",
    "color-mix(in srgb, #f00, #00f)",
    "light-dark(#fff, #000)",
    "oklch(from red l c h / 50%)",
    "rgb(from var(--c) r g b)",
    "color(from #f00 srgb r g b)",
  ]

  for (const src of samples) {
    test(`round-trips ${src}`, () => {
      const state = parseColorFunction(src)
      if (state === null) throw new Error(`expected "${src}" to parse`)
      expect(formatColorFunction(state)).toBe(src)
    })
  }
})
