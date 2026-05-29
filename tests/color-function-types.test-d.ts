import { expectTypeOf, test } from "vitest"
import type {
  ColorFunctionLiteral,
  ColorFunctionMode,
  ColorFunctionString,
  ColorFunctionStringMap,
  ColorMixLiteral,
  ColorsOf,
  KindOf,
  LightDarkLiteral,
  MixSpaceOf,
  RelativeColorLiteral,
  RelativeFnOf,
} from "@/components/ui/color-function/color-function.types"
import { cssColorFn } from "@/components/ui/color-function/color-function.types"

// ===========================================================================
// color-mix — FULL validation
// ===========================================================================

test("color-mix accepts a basic in-space + two hex colors", () => {
  expectTypeOf<
    ColorMixLiteral<"color-mix(in srgb, #f00, #00f)">
  >().toEqualTypeOf<"color-mix(in srgb, #f00, #00f)">()
})

test("color-mix accepts percentages on both colors", () => {
  expectTypeOf<
    ColorMixLiteral<"color-mix(in oklch, #f00 30%, oklch(0.5 0.1 240) 70%)">
  >().toEqualTypeOf<"color-mix(in oklch, #f00 30%, oklch(0.5 0.1 240) 70%)">()
})

test("color-mix accepts a single percentage", () => {
  expectTypeOf<
    ColorMixLiteral<"color-mix(in display-p3, #f00 25%, #00f)">
  >().toEqualTypeOf<"color-mix(in display-p3, #f00 25%, #00f)">()
})

test("color-mix accepts a hue method on a cylindrical space", () => {
  expectTypeOf<
    ColorMixLiteral<"color-mix(in oklch shorter hue, #f00, #00f)">
  >().toEqualTypeOf<"color-mix(in oklch shorter hue, #f00, #00f)">()
  expectTypeOf<
    ColorMixLiteral<"color-mix(in hsl longer hue, #f00, #00f)">
  >().toEqualTypeOf<"color-mix(in hsl longer hue, #f00, #00f)">()
})

test("color-mix accepts var() colors", () => {
  expectTypeOf<
    ColorMixLiteral<"color-mix(in srgb, var(--a), var(--b))">
  >().toEqualTypeOf<"color-mix(in srgb, var(--a), var(--b))">()
})

test("color-mix rejects an unknown colorspace", () => {
  expectTypeOf<ColorMixLiteral<"color-mix(in foo, #f00, #00f)">>().toBeNever()
})

test("color-mix rejects a hue method on a rectangular space", () => {
  expectTypeOf<
    ColorMixLiteral<"color-mix(in srgb shorter hue, #f00, #00f)">
  >().toBeNever()
})

test("color-mix rejects a hue method missing the 'hue' keyword", () => {
  expectTypeOf<
    ColorMixLiteral<"color-mix(in oklch shorter, #f00, #00f)">
  >().toBeNever()
})

test("color-mix rejects wrong arity", () => {
  expectTypeOf<ColorMixLiteral<"color-mix(in srgb, #f00)">>().toBeNever()
  expectTypeOf<
    ColorMixLiteral<"color-mix(in srgb, #f00, #00f, #0f0)">
  >().toBeNever()
})

test("color-mix rejects a missing 'in' keyword", () => {
  expectTypeOf<ColorMixLiteral<"color-mix(srgb, #f00, #00f)">>().toBeNever()
})

test("color-mix rejects a bare keyword color (strict tier)", () => {
  expectTypeOf<
    ColorMixLiteral<"color-mix(in srgb, notacolor, #00f)">
  >().toBeNever()
})

test("color-mix rejects a non-percentage weight", () => {
  expectTypeOf<
    ColorMixLiteral<"color-mix(in srgb, #f00 30, #00f)">
  >().toBeNever()
})

// ===========================================================================
// light-dark — FULL validation
// ===========================================================================

test("light-dark accepts exactly two colors", () => {
  expectTypeOf<
    LightDarkLiteral<"light-dark(#fff, #000)">
  >().toEqualTypeOf<"light-dark(#fff, #000)">()
  expectTypeOf<
    LightDarkLiteral<"light-dark(var(--l), oklch(0.2 0 0))">
  >().toEqualTypeOf<"light-dark(var(--l), oklch(0.2 0 0))">()
})

test("light-dark rejects wrong arity", () => {
  expectTypeOf<LightDarkLiteral<"light-dark(#fff)">>().toBeNever()
  expectTypeOf<LightDarkLiteral<"light-dark(#fff, #000, #ccc)">>().toBeNever()
})

test("light-dark rejects a bare keyword color", () => {
  expectTypeOf<LightDarkLiteral<"light-dark(white, #000)">>().toBeNever()
})

// ===========================================================================
// relative color — per-space channel-keyword strictness + relaxations
// ===========================================================================

test("relative accepts correct per-space channel keywords", () => {
  expectTypeOf<
    RelativeColorLiteral<"oklch(from #f00 l c h)">
  >().toEqualTypeOf<"oklch(from #f00 l c h)">()
  expectTypeOf<
    RelativeColorLiteral<"rgb(from #f00 r g b)">
  >().toEqualTypeOf<"rgb(from #f00 r g b)">()
  expectTypeOf<
    RelativeColorLiteral<"lab(from #f00 l a b)">
  >().toEqualTypeOf<"lab(from #f00 l a b)">()
  expectTypeOf<
    RelativeColorLiteral<"hsl(from #f00 h s l)">
  >().toEqualTypeOf<"hsl(from #f00 h s l)">()
  expectTypeOf<
    RelativeColorLiteral<"hwb(from #f00 h w b)">
  >().toEqualTypeOf<"hwb(from #f00 h w b)">()
  expectTypeOf<
    RelativeColorLiteral<"lch(from #f00 l c h)">
  >().toEqualTypeOf<"lch(from #f00 l c h)">()
  expectTypeOf<
    RelativeColorLiteral<"oklab(from #f00 l a b)">
  >().toEqualTypeOf<"oklab(from #f00 l a b)">()
})

test("relative accepts var() source colors", () => {
  expectTypeOf<
    RelativeColorLiteral<"rgb(from var(--c) r g b)">
  >().toEqualTypeOf<"rgb(from var(--c) r g b)">()
})

test("relative accepts numeric / percentage channels", () => {
  expectTypeOf<
    RelativeColorLiteral<"oklch(from #f00 0.5 0.1 240)">
  >().toEqualTypeOf<"oklch(from #f00 0.5 0.1 240)">()
  expectTypeOf<
    RelativeColorLiteral<"rgb(from #f00 50% 100 0)">
  >().toEqualTypeOf<"rgb(from #f00 50% 100 0)">()
})

test("relative accepts an optional / alpha", () => {
  expectTypeOf<
    RelativeColorLiteral<"oklch(from #f00 l c h / 50%)">
  >().toEqualTypeOf<"oklch(from #f00 l c h / 50%)">()
  expectTypeOf<
    RelativeColorLiteral<"lab(from #f00 l a b / none)">
  >().toEqualTypeOf<"lab(from #f00 l a b / none)">()
})

test("relative accepts none channels (CSS allows none)", () => {
  expectTypeOf<
    RelativeColorLiteral<"rgb(from #f00 none g b)">
  >().toEqualTypeOf<"rgb(from #f00 none g b)">()
})

test("relative accepts lenient calc() channels (body not parsed)", () => {
  expectTypeOf<
    RelativeColorLiteral<"oklch(from #f00 calc(l * 2) c h)">
  >().toEqualTypeOf<"oklch(from #f00 calc(l * 2) c h)">()
})

test("relative accepts the color() form with a colorspace ident", () => {
  expectTypeOf<
    RelativeColorLiteral<"color(from #f00 srgb r g b)">
  >().toEqualTypeOf<"color(from #f00 srgb r g b)">()
})

test("relative rejects wrong channel keywords for the space", () => {
  expectTypeOf<RelativeColorLiteral<"oklch(from #f00 r g b)">>().toBeNever()
})

test("relative rejects a missing 'from' keyword", () => {
  expectTypeOf<RelativeColorLiteral<"oklch(#f00 l c h)">>().toBeNever()
})

test("relative rejects a bad source color", () => {
  expectTypeOf<
    RelativeColorLiteral<"oklch(from notacolor l c h)">
  >().toBeNever()
})

test("relative rejects the wrong channel count", () => {
  expectTypeOf<RelativeColorLiteral<"oklch(from #f00 l c)">>().toBeNever()
  expectTypeOf<RelativeColorLiteral<"oklch(from #f00 l c h x)">>().toBeNever()
})

// ===========================================================================
// Top-level dispatch
// ===========================================================================

test("ColorFunctionLiteral routes each family", () => {
  expectTypeOf<
    ColorFunctionLiteral<"color-mix(in srgb, #f00, #00f)">
  >().toEqualTypeOf<"color-mix(in srgb, #f00, #00f)">()
  expectTypeOf<
    ColorFunctionLiteral<"light-dark(#fff, #000)">
  >().toEqualTypeOf<"light-dark(#fff, #000)">()
  expectTypeOf<
    ColorFunctionLiteral<"oklch(from #f00 l c h)">
  >().toEqualTypeOf<"oklch(from #f00 l c h)">()
})

test("ColorFunctionLiteral rejects a bare color literal and unknown fns", () => {
  expectTypeOf<ColorFunctionLiteral<"rgb(255 0 0)">>().toBeNever()
  expectTypeOf<ColorFunctionLiteral<"rotate(90deg)">>().toBeNever()
  expectTypeOf<ColorFunctionLiteral<"#f00">>().toBeNever()
})

// ===========================================================================
// Utility types
// ===========================================================================

test("KindOf reports the family", () => {
  expectTypeOf<
    KindOf<"color-mix(in srgb, #f00, #00f)">
  >().toEqualTypeOf<"color-mix">()
  expectTypeOf<KindOf<"oklch(from #f00 l c h)">>().toEqualTypeOf<"relative">()
  expectTypeOf<KindOf<"light-dark(#f, #0)">>().toEqualTypeOf<"light-dark">()
  expectTypeOf<KindOf<"rgb(255 0 0)">>().toBeNever()
})

test("MixSpaceOf extracts the interpolation space", () => {
  expectTypeOf<
    MixSpaceOf<"color-mix(in oklch, #f00, #00f)">
  >().toEqualTypeOf<"oklch">()
  expectTypeOf<
    MixSpaceOf<"color-mix(in display-p3 , #f00, #00f)">
  >().toEqualTypeOf<"display-p3">()
  expectTypeOf<MixSpaceOf<"light-dark(#f, #0)">>().toBeNever()
})

test("RelativeFnOf extracts the relative function name", () => {
  expectTypeOf<
    RelativeFnOf<"oklch(from #f00 l c h)">
  >().toEqualTypeOf<"oklch">()
  expectTypeOf<RelativeFnOf<"color-mix(in srgb, #f00, #00f)">>().toBeNever()
})

test("ColorsOf extracts the raw color arguments", () => {
  expectTypeOf<ColorsOf<"light-dark(#fff, #000)">>().toEqualTypeOf<
    ["#fff", "#000"]
  >()
  expectTypeOf<ColorsOf<"color-mix(in srgb, #f00 30%, #00f)">>().toEqualTypeOf<
    ["#f00", "#00f"]
  >()
  expectTypeOf<ColorsOf<"oklch(from #f00 l c h)">>().toEqualTypeOf<["#f00"]>()
})

// ===========================================================================
// Suggestion strings, map, and the call-site helper
// ===========================================================================

test("the string map keys are the modes", () => {
  expectTypeOf<ColorFunctionMode>().toEqualTypeOf<
    "color-mix" | "relative" | "light-dark"
  >()
  expectTypeOf<"color-mix(in srgb, #f00, #00f)">().toMatchTypeOf<
    ColorFunctionStringMap["color-mix"]
  >()
  expectTypeOf<"oklch(from #f00 l c h)">().toMatchTypeOf<
    ColorFunctionStringMap["relative"]
  >()
  expectTypeOf<"light-dark(#fff, #000)">().toMatchTypeOf<
    ColorFunctionStringMap["light-dark"]
  >()
})

test("ColorFunctionString accepts each family shape", () => {
  expectTypeOf<"color-mix(in srgb, #f00, #00f)">().toMatchTypeOf<ColorFunctionString>()
  expectTypeOf<"light-dark(#fff, #000)">().toMatchTypeOf<ColorFunctionString>()
})

test("cssColorFn accepts valid color functions", () => {
  expectTypeOf(
    cssColorFn("color-mix(in srgb, #f00, #00f)"),
  ).toEqualTypeOf<"color-mix(in srgb, #f00, #00f)">()
  expectTypeOf(
    cssColorFn("light-dark(#fff, #000)"),
  ).toEqualTypeOf<"light-dark(#fff, #000)">()
  expectTypeOf(
    cssColorFn("oklch(from #f00 l c h)"),
  ).toEqualTypeOf<"oklch(from #f00 l c h)">()
})

test("cssColorFn rejects invalid color functions", () => {
  // @ts-expect-error unknown colorspace
  cssColorFn("color-mix(in foo, #f00, #00f)")
  // @ts-expect-error bare color literal (not in scope)
  cssColorFn("rgb(255 0 0)")
  // @ts-expect-error wrong channel keywords for the space
  cssColorFn("oklch(from #f00 r g b)")
  // @ts-expect-error missing from
  cssColorFn("oklch(#f00 l c h)")
})
