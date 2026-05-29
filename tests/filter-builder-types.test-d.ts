import { expectTypeOf, test } from "vitest"
import type { FilterBuilder } from "@/components/ui/filter-builder"
import type {
  FilterFn,
  FilterFunctionName,
  FilterItem,
  FilterLiteral,
  FilterString,
  FilterStringMap,
  FunctionCountOf,
  FunctionsOf,
  HasDropShadow,
} from "@/components/ui/filter-builder/filter-builder.types"
import { cssFilter } from "@/components/ui/filter-builder/filter-builder.types"

// ---------------------------------------------------------------------------
// Strict tier — blur (length-only)
// ---------------------------------------------------------------------------

test("blur accepts a length, rejects angle / bare-number / arity-0", () => {
  expectTypeOf<FilterLiteral<"blur(4px)">>().toEqualTypeOf<"blur(4px)">()
  expectTypeOf<FilterLiteral<"blur(2rem)">>().toEqualTypeOf<"blur(2rem)">()
  expectTypeOf<FilterLiteral<"blur(45deg)">>().toBeNever()
  // bare number (no unit) is not a length per the kit's IsLength
  expectTypeOf<FilterLiteral<"blur(0)">>().toBeNever()
  expectTypeOf<FilterLiteral<"blur()">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — hue-rotate (angle-only, kebab name)
// ---------------------------------------------------------------------------

test("hue-rotate accepts an angle, rejects length", () => {
  expectTypeOf<
    FilterLiteral<"hue-rotate(90deg)">
  >().toEqualTypeOf<"hue-rotate(90deg)">()
  expectTypeOf<
    FilterLiteral<"hue-rotate(0.5turn)">
  >().toEqualTypeOf<"hue-rotate(0.5turn)">()
  expectTypeOf<
    FilterLiteral<"hue-rotate(1rad)">
  >().toEqualTypeOf<"hue-rotate(1rad)">()
  expectTypeOf<FilterLiteral<"hue-rotate(10px)">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — amount functions (non-negative number | percentage)
// ---------------------------------------------------------------------------

test("amount functions accept non-negative number or percentage", () => {
  expectTypeOf<
    FilterLiteral<"brightness(1.2)">
  >().toEqualTypeOf<"brightness(1.2)">()
  expectTypeOf<
    FilterLiteral<"contrast(200%)">
  >().toEqualTypeOf<"contrast(200%)">()
  expectTypeOf<FilterLiteral<"saturate(0)">>().toEqualTypeOf<"saturate(0)">()
  expectTypeOf<FilterLiteral<"opacity(50%)">>().toEqualTypeOf<"opacity(50%)">()
  expectTypeOf<
    FilterLiteral<"grayscale(0.5)">
  >().toEqualTypeOf<"grayscale(0.5)">()
  expectTypeOf<FilterLiteral<"invert(100%)">>().toEqualTypeOf<"invert(100%)">()
  expectTypeOf<FilterLiteral<"sepia(0.3)">>().toEqualTypeOf<"sepia(0.3)">()
  // negative bare number rejected (CSS forbids negatives here)
  expectTypeOf<FilterLiteral<"brightness(-1)">>().toBeNever()
  expectTypeOf<FilterLiteral<"grayscale(45deg)">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — drop-shadow (2-3 lengths + optional trailing color)
// ---------------------------------------------------------------------------

test("drop-shadow: x y, x y blur, with an optional trailing color", () => {
  expectTypeOf<
    FilterLiteral<"drop-shadow(2px 2px)">
  >().toEqualTypeOf<"drop-shadow(2px 2px)">()
  expectTypeOf<
    FilterLiteral<"drop-shadow(2px 2px 4px)">
  >().toEqualTypeOf<"drop-shadow(2px 2px 4px)">()
  expectTypeOf<
    FilterLiteral<"drop-shadow(2px 2px #f00)">
  >().toEqualTypeOf<"drop-shadow(2px 2px #f00)">()
  expectTypeOf<
    FilterLiteral<"drop-shadow(2px 2px 4px #000)">
  >().toEqualTypeOf<"drop-shadow(2px 2px 4px #000)">()
  // a functional color whose own body contains spaces and a slash stays whole
  expectTypeOf<
    FilterLiteral<"drop-shadow(2px 2px 4px rgb(0 0 0 / 0.5))">
  >().toEqualTypeOf<"drop-shadow(2px 2px 4px rgb(0 0 0 / 0.5))">()
})

test("drop-shadow: bad color, keyword color, leading color, arity all reject", () => {
  expectTypeOf<FilterLiteral<"drop-shadow(2px 2px 4px wrong)">>().toBeNever()
  // bare CSS keyword colors are not in ColorLiteral — use hex / functional
  expectTypeOf<FilterLiteral<"drop-shadow(2px 2px red)">>().toBeNever()
  // strict tier is color-LAST only; leading color resolves to never
  expectTypeOf<FilterLiteral<"drop-shadow(red 2px 2px)">>().toBeNever()
  expectTypeOf<FilterLiteral<"drop-shadow(2px)">>().toBeNever()
  expectTypeOf<FilterLiteral<"drop-shadow(2px 2px 3px 4px 5px)">>().toBeNever()
  // angle where a length is wanted
  expectTypeOf<FilterLiteral<"drop-shadow(2px 45deg)">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — url (non-empty body)
// ---------------------------------------------------------------------------

test("url accepts any non-empty body, rejects empty", () => {
  expectTypeOf<FilterLiteral<"url(#f)">>().toEqualTypeOf<"url(#f)">()
  expectTypeOf<
    FilterLiteral<'url("filters.svg#blur")'>
  >().toEqualTypeOf<'url("filters.svg#blur")'>()
  expectTypeOf<
    FilterLiteral<"url(filter.svg)">
  >().toEqualTypeOf<"url(filter.svg)">()
  expectTypeOf<FilterLiteral<"url()">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — multi-function list + none + garbage
// ---------------------------------------------------------------------------

test("a valid space-separated list keeps the literal", () => {
  expectTypeOf<
    FilterLiteral<"blur(4px) brightness(1.2) drop-shadow(2px 2px 4px #000)">
  >().toEqualTypeOf<"blur(4px) brightness(1.2) drop-shadow(2px 2px 4px #000)">()
  expectTypeOf<
    FilterLiteral<"blur(4px) hue-rotate(90deg) saturate(150%)">
  >().toEqualTypeOf<"blur(4px) hue-rotate(90deg) saturate(150%)">()
})

test("a list with any invalid function is never", () => {
  expectTypeOf<FilterLiteral<"blur(4px) brightness(45deg)">>().toBeNever()
})

test("none is valid; garbage and empty are never", () => {
  expectTypeOf<FilterLiteral<"none">>().toEqualTypeOf<"none">()
  expectTypeOf<FilterLiteral<"">>().toBeNever()
  expectTypeOf<FilterLiteral<"wobble(3)">>().toBeNever()
  expectTypeOf<FilterLiteral<"blur">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Call-site helper
// ---------------------------------------------------------------------------

test("cssFilter validates at the call site", () => {
  const a = cssFilter("blur(4px) brightness(1.2) drop-shadow(2px 2px 4px #000)")
  expectTypeOf(
    a,
  ).toEqualTypeOf<"blur(4px) brightness(1.2) drop-shadow(2px 2px 4px #000)">()

  // @ts-expect-error blur wants a length, not an angle
  cssFilter("blur(45deg)")
  // @ts-expect-error hue-rotate wants an angle, not a length
  cssFilter("hue-rotate(10px)")
  // @ts-expect-error drop-shadow trailing color is invalid
  cssFilter("drop-shadow(2px 2px 4px wrong)")
  // @ts-expect-error url body must be non-empty
  cssFilter("url()")
  // @ts-expect-error unknown function
  cssFilter("wobble(3)")
  // @ts-expect-error calc() is undecidable at the strict tier
  cssFilter("blur(calc(1px + 2px))")
})

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

test("FunctionsOf lists the function names in order", () => {
  expectTypeOf<FunctionsOf<"blur(4px) brightness(1.2)">>().toEqualTypeOf<
    ["blur", "brightness"]
  >()
  expectTypeOf<FunctionsOf<"drop-shadow(2px 2px)">>().toEqualTypeOf<
    ["drop-shadow"]
  >()
  expectTypeOf<FunctionsOf<"none">>().toEqualTypeOf<[]>()
})

test("FunctionCountOf counts the functions", () => {
  expectTypeOf<
    FunctionCountOf<"blur(4px) hue-rotate(90deg) saturate(150%)">
  >().toEqualTypeOf<3>()
  expectTypeOf<FunctionCountOf<"blur(4px)">>().toEqualTypeOf<1>()
  expectTypeOf<FunctionCountOf<"none">>().toEqualTypeOf<0>()
})

test("HasDropShadow reports whether the list contains a drop-shadow", () => {
  expectTypeOf<
    HasDropShadow<"blur(4px) drop-shadow(1px 1px #000)">
  >().toEqualTypeOf<true>()
  expectTypeOf<HasDropShadow<"drop-shadow(2px 2px)">>().toEqualTypeOf<true>()
  expectTypeOf<
    HasDropShadow<"blur(4px) brightness(1.2)">
  >().toEqualTypeOf<false>()
  expectTypeOf<HasDropShadow<"none">>().toEqualTypeOf<false>()
})

// ---------------------------------------------------------------------------
// Suggestion strings + map
// ---------------------------------------------------------------------------

test("FilterString suggestion union + map + keys", () => {
  expectTypeOf<"blur(4px)">().toMatchTypeOf<FilterString>()
  expectTypeOf<"hue-rotate(90deg)">().toMatchTypeOf<FilterString>()
  expectTypeOf<"none">().toMatchTypeOf<FilterString>()
  expectTypeOf<"blur(4px) brightness(1.2)">().toMatchTypeOf<FilterString>()
  expectTypeOf<FilterStringMap["blur"]>().toEqualTypeOf<`blur(${string})`>()
  expectTypeOf<
    FilterStringMap["hue-rotate"]
  >().toEqualTypeOf<`hue-rotate(${string})`>()
  expectTypeOf<
    FilterStringMap["drop-shadow"]
  >().toEqualTypeOf<`drop-shadow(${string})`>()
})

test("FilterFn and FilterFunctionName cover the full set", () => {
  expectTypeOf<FilterFn>().toEqualTypeOf<FilterFunctionName>()
  expectTypeOf<"blur">().toMatchTypeOf<FilterFunctionName>()
  expectTypeOf<"hue-rotate">().toMatchTypeOf<FilterFunctionName>()
  expectTypeOf<"drop-shadow">().toMatchTypeOf<FilterFunctionName>()
  expectTypeOf<"url">().toMatchTypeOf<FilterFunctionName>()
})

// ---------------------------------------------------------------------------
// Internal state — discriminated union
// ---------------------------------------------------------------------------

test("FilterItem discriminates by fn", () => {
  const blur: FilterItem = { fn: "blur", value: "4px" }
  const hue: FilterItem = { fn: "hue-rotate", value: "90deg" }
  const amount: FilterItem = { fn: "brightness", value: "1.2" }
  const shadowFull: FilterItem = {
    fn: "drop-shadow",
    x: "2px",
    y: "2px",
    blur: "4px",
    color: "#000",
  }
  const shadowMin: FilterItem = { fn: "drop-shadow", x: "2px", y: "2px" }
  const url: FilterItem = { fn: "url", url: "#f" }
  expectTypeOf(blur).toMatchTypeOf<FilterItem>()
  expectTypeOf(hue).toMatchTypeOf<FilterItem>()
  expectTypeOf(amount).toMatchTypeOf<FilterItem>()
  expectTypeOf(shadowFull).toMatchTypeOf<FilterItem>()
  expectTypeOf(shadowMin).toMatchTypeOf<FilterItem>()
  expectTypeOf(url).toMatchTypeOf<FilterItem>()
})

// ---------------------------------------------------------------------------
// Component onChange — no fn narrowing (filter is a list)
// ---------------------------------------------------------------------------

test("FilterBuilder onChange returns the open FilterString", () => {
  type P = Parameters<typeof FilterBuilder>[0]
  expectTypeOf<P["onChange"]>().parameter(0).toEqualTypeOf<FilterString>()
})
