import { expect, expectTypeOf, test } from "vitest"
import type {
  ColorLiteral,
  HexLiteral,
  HSLLiteral,
  HWBLiteral,
  OKLCHLiteral,
  OklabLiteral,
  RGBALiteral,
  RGBLiteral,
} from "@/components/ui/color-picker/color-picker.types"
import { color } from "@/components/ui/color-picker/color-picker.types"

// Type-only smoke test: ensure the file imports cleanly.
test("color-picker.types module imports", () => {
  expectTypeOf<string>().toBeString()
})

test("HexLiteral accepts valid hex", () => {
  expectTypeOf<HexLiteral<"#ff0000">>().toEqualTypeOf<"#ff0000">()
  expectTypeOf<HexLiteral<"#fff">>().toEqualTypeOf<"#fff">()
  expectTypeOf<HexLiteral<"#ff0000ff">>().toEqualTypeOf<"#ff0000ff">()
  expectTypeOf<HexLiteral<"#abcd">>().toEqualTypeOf<"#abcd">()
})

test("HexLiteral rejects invalid hex", () => {
  expectTypeOf<HexLiteral<"#zzz">>().toBeNever()
  expectTypeOf<HexLiteral<"#ff">>().toBeNever() // wrong length
  expectTypeOf<HexLiteral<"#fffff">>().toBeNever() // wrong length
  expectTypeOf<HexLiteral<"ff0000">>().toBeNever() // missing #
})

test("RGBLiteral accepts valid forms", () => {
  expectTypeOf<RGBLiteral<"rgb(255, 0, 0)">>().toEqualTypeOf<"rgb(255, 0, 0)">()
  expectTypeOf<RGBLiteral<"rgb(255 0 0)">>().toEqualTypeOf<"rgb(255 0 0)">()
  expectTypeOf<
    RGBLiteral<"rgb(100%, 0%, 0%)">
  >().toEqualTypeOf<"rgb(100%, 0%, 0%)">()
})

test("RGBLiteral rejects out-of-range bytes", () => {
  expectTypeOf<RGBLiteral<"rgb(256, 0, 0)">>().toBeNever()
  expectTypeOf<RGBLiteral<"rgb(255 0 999)">>().toBeNever()
})

test("RGBALiteral accepts alpha forms", () => {
  expectTypeOf<
    RGBALiteral<"rgba(255, 0, 0, 0.5)">
  >().toEqualTypeOf<"rgba(255, 0, 0, 0.5)">()
  expectTypeOf<
    RGBALiteral<"rgba(255 0 0 / 0.5)">
  >().toEqualTypeOf<"rgba(255 0 0 / 0.5)">()
  expectTypeOf<
    RGBALiteral<"rgb(255 0 0 / 0.5)">
  >().toEqualTypeOf<"rgb(255 0 0 / 0.5)">()
})

test("RGBALiteral rejects bad alpha", () => {
  expectTypeOf<RGBALiteral<"rgba(255, 0, 0, 2)">>().toBeNever()
})

test("HSLLiteral accepts valid forms", () => {
  expectTypeOf<
    HSLLiteral<"hsl(210 100% 50%)">
  >().toEqualTypeOf<"hsl(210 100% 50%)">()
  expectTypeOf<
    HSLLiteral<"hsl(210, 100%, 50%)">
  >().toEqualTypeOf<"hsl(210, 100%, 50%)">()
  expectTypeOf<
    HSLLiteral<"hsl(210 100% 50% / 0.5)">
  >().toEqualTypeOf<"hsl(210 100% 50% / 0.5)">()
})

test("HSLLiteral rejects out-of-range", () => {
  expectTypeOf<HSLLiteral<"hsl(400 100% 50%)">>().toBeNever()
  expectTypeOf<HSLLiteral<"hsl(210 200% 50%)">>().toBeNever()
})

test("OKLCHLiteral accepts valid forms", () => {
  expectTypeOf<
    OKLCHLiteral<"oklch(0.5 0.1 240)">
  >().toEqualTypeOf<"oklch(0.5 0.1 240)">()
  expectTypeOf<
    OKLCHLiteral<"oklch(50% 0.1 240deg)">
  >().toEqualTypeOf<"oklch(50% 0.1 240deg)">()
  expectTypeOf<
    OKLCHLiteral<"oklch(0.5 0.1 240 / 0.5)">
  >().toEqualTypeOf<"oklch(0.5 0.1 240 / 0.5)">()
})

test("OKLCHLiteral rejects bad L", () => {
  expectTypeOf<OKLCHLiteral<"oklch(2 0.1 240)">>().toBeNever()
})

test("OklabLiteral accepts valid forms", () => {
  expectTypeOf<
    OklabLiteral<"oklab(0.5 0.1 -0.05)">
  >().toEqualTypeOf<"oklab(0.5 0.1 -0.05)">()
  expectTypeOf<
    OklabLiteral<"oklab(50% 0.1 -0.05)">
  >().toEqualTypeOf<"oklab(50% 0.1 -0.05)">()
  expectTypeOf<
    OklabLiteral<"oklab(0.5 0.1 -0.05 / 0.5)">
  >().toEqualTypeOf<"oklab(0.5 0.1 -0.05 / 0.5)">()
})

test("OklabLiteral rejects bad L", () => {
  expectTypeOf<OklabLiteral<"oklab(2 0.1 0.1)">>().toBeNever()
})

test("HWBLiteral accepts valid forms", () => {
  expectTypeOf<HWBLiteral<"hwb(0 0% 0%)">>().toEqualTypeOf<"hwb(0 0% 0%)">()
  expectTypeOf<
    HWBLiteral<"hwb(240 20% 30%)">
  >().toEqualTypeOf<"hwb(240 20% 30%)">()
  expectTypeOf<
    HWBLiteral<"hwb(240 20% 30% / 0.5)">
  >().toEqualTypeOf<"hwb(240 20% 30% / 0.5)">()
})

test("HWBLiteral rejects bad hue/percent", () => {
  expectTypeOf<HWBLiteral<"hwb(400 0% 0%)">>().toBeNever()
  expectTypeOf<HWBLiteral<"hwb(0 200% 0%)">>().toBeNever()
})

test("ColorLiteral accepts any valid color string", () => {
  expectTypeOf<ColorLiteral<"#ff0000">>().toEqualTypeOf<"#ff0000">()
  expectTypeOf<ColorLiteral<"rgb(255 0 0)">>().toEqualTypeOf<"rgb(255 0 0)">()
  expectTypeOf<
    ColorLiteral<"hsl(0 100% 50%)">
  >().toEqualTypeOf<"hsl(0 100% 50%)">()
  expectTypeOf<
    ColorLiteral<"oklch(0.5 0.1 240)">
  >().toEqualTypeOf<"oklch(0.5 0.1 240)">()
  expectTypeOf<
    ColorLiteral<"oklab(0.5 0.1 -0.05)">
  >().toEqualTypeOf<"oklab(0.5 0.1 -0.05)">()
  expectTypeOf<ColorLiteral<"hwb(0 0% 0%)">>().toEqualTypeOf<"hwb(0 0% 0%)">()
})

test("color() accepts valid literals at runtime", () => {
  expect(color("#ff0000")).toBe("#ff0000")
  expect(color("rgb(255 0 0)")).toBe("rgb(255 0 0)")
  expect(color("oklch(0.5 0.1 240)")).toBe("oklch(0.5 0.1 240)")
})

test("color() rejects invalid at type level", () => {
  // @ts-expect-error 256 > 255
  color("rgb(256 0 0)")
  // @ts-expect-error wrong hex length
  color("#ff")
  // @ts-expect-error oklch L out of range
  color("oklch(2 0.1 240)")
})

import { isColorString } from "@/components/ui/color-picker/color-picker"
import type {
  ModeOf,
  WithAlpha,
  WithoutAlpha,
} from "@/components/ui/color-picker/color-picker.types"

test("ModeOf extracts the mode from a color literal", () => {
  expectTypeOf<ModeOf<"#ff0000">>().toEqualTypeOf<"hex">()
  expectTypeOf<ModeOf<"oklch(0.5 0.1 240)">>().toEqualTypeOf<"oklch">()
  expectTypeOf<ModeOf<"oklab(0.5 0.1 -0.05)">>().toEqualTypeOf<"oklab">()
  expectTypeOf<ModeOf<"rgb(255 0 0)">>().toEqualTypeOf<"rgb">()
  expectTypeOf<ModeOf<"rgba(255 0 0 / 0.5)">>().toEqualTypeOf<"rgb">()
  expectTypeOf<ModeOf<"hsl(0 100% 50%)">>().toEqualTypeOf<"hsl">()
  expectTypeOf<ModeOf<"hwb(0 0% 0%)">>().toEqualTypeOf<"hwb">()
  expectTypeOf<ModeOf<"not a color">>().toBeNever()
})

test("WithAlpha replaces or adds alpha tag", () => {
  expectTypeOf<
    WithAlpha<"oklch(0.5 0.1 240)", 50>
  >().toEqualTypeOf<"oklch(0.5 0.1 240 / 50%)">()
  expectTypeOf<
    WithAlpha<"oklch(0.5 0.1 240 / 100%)", 50>
  >().toEqualTypeOf<"oklch(0.5 0.1 240 / 50%)">()
  expectTypeOf<
    WithAlpha<"rgb(255 0 0)", 25>
  >().toEqualTypeOf<"rgb(255 0 0 / 25%)">()
})

test("WithoutAlpha strips alpha tag", () => {
  expectTypeOf<
    WithoutAlpha<"oklch(0.5 0.1 240 / 50%)">
  >().toEqualTypeOf<"oklch(0.5 0.1 240)">()
  expectTypeOf<
    WithoutAlpha<"oklch(0.5 0.1 240)">
  >().toEqualTypeOf<"oklch(0.5 0.1 240)">()
  expectTypeOf<
    WithoutAlpha<"rgb(255 0 0 / 50%)">
  >().toEqualTypeOf<"rgb(255 0 0)">()
})

test("isColorString narrows + validates at runtime", () => {
  expect(isColorString("#ff0000")).toBe(true)
  expect(isColorString("rgb(255 0 0)")).toBe(true)
  expect(isColorString("oklch(0.5 0.1 240)")).toBe(true)
  expect(isColorString("hwb(0 0% 0%)")).toBe(true)
  expect(isColorString("not a color")).toBe(false)
  expect(isColorString("")).toBe(false)
})
