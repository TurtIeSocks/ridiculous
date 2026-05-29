import { expectTypeOf, test } from "vitest"
import type { QueryBuilder } from "@/components/ui/query-builder"
import type {
  ContainerQueryString,
  FeatureCountOf,
  FeatureOperator,
  FeaturesOf,
  FeatureTest,
  MediaModifier,
  MediaQueryString,
  MediaType,
  Orientation,
  Pointer,
  PrefersColorScheme,
  QueryMode,
  QueryState,
  QueryString,
  QueryStringMap,
} from "@/components/ui/query-builder/query-builder.types"
import {
  cssContainerQuery,
  cssMediaQuery,
} from "@/components/ui/query-builder/query-builder.types"

// ===========================================================================
// MediaQueryLiteral — accept (length features: plain / range2 / range3)
// ===========================================================================

test("media: a plain length feature keeps the literal", () => {
  expectTypeOf<typeof cssMediaQuery<"(min-width: 600px)">>().toBeFunction()
  const a = cssMediaQuery("(min-width: 600px)")
  expectTypeOf(a).toEqualTypeOf<"(min-width: 600px)">()
})

test("media: a 2-part range length feature keeps the literal", () => {
  const a = cssMediaQuery("(width >= 600px)")
  expectTypeOf(a).toEqualTypeOf<"(width >= 600px)">()
})

test("media: a 3-part range length feature keeps the literal", () => {
  const a = cssMediaQuery("(400px <= width <= 700px)")
  expectTypeOf(a).toEqualTypeOf<"(400px <= width <= 700px)">()
})

// ===========================================================================
// MediaQueryLiteral — accept (ratio / resolution / enum / boolean)
// ===========================================================================

test("media: an aspect-ratio feature with a ratio value keeps the literal", () => {
  const a = cssMediaQuery("(aspect-ratio: 16/9)")
  expectTypeOf(a).toEqualTypeOf<"(aspect-ratio: 16/9)">()
})

test("media: a resolution feature with a dppx value keeps the literal", () => {
  const a = cssMediaQuery("(min-resolution: 2dppx)")
  expectTypeOf(a).toEqualTypeOf<"(min-resolution: 2dppx)">()
})

test("media: an enum feature with a valid keyword keeps the literal", () => {
  const a = cssMediaQuery("(orientation: landscape)")
  expectTypeOf(a).toEqualTypeOf<"(orientation: landscape)">()
  const b = cssMediaQuery("(prefers-color-scheme: dark)")
  expectTypeOf(b).toEqualTypeOf<"(prefers-color-scheme: dark)">()
  const c = cssMediaQuery("(pointer: fine)")
  expectTypeOf(c).toEqualTypeOf<"(pointer: fine)">()
})

test("media: a boolean feature keeps the literal", () => {
  const a = cssMediaQuery("(hover)")
  expectTypeOf(a).toEqualTypeOf<"(hover)">()
  const b = cssMediaQuery("(color)")
  expectTypeOf(b).toEqualTypeOf<"(color)">()
})

// ===========================================================================
// MediaQueryLiteral — accept (media type + modifier + not)
// ===========================================================================

test("media: a bare media type keeps the literal", () => {
  const a = cssMediaQuery("only screen")
  expectTypeOf(a).toEqualTypeOf<"only screen">()
})

test("media: media-type and condition keeps the literal", () => {
  const a = cssMediaQuery("screen and (min-width: 600px)")
  expectTypeOf(a).toEqualTypeOf<"screen and (min-width: 600px)">()
})

test("media: a top-level not keeps the literal", () => {
  const a = cssMediaQuery("not (monochrome)")
  expectTypeOf(a).toEqualTypeOf<"not (monochrome)">()
})

// ===========================================================================
// MediaQueryLiteral — accept (and/or no-mix rule)
// ===========================================================================

test("media: an all-and condition keeps the literal", () => {
  const a = cssMediaQuery("(hover) and (pointer: fine)")
  expectTypeOf(a).toEqualTypeOf<"(hover) and (pointer: fine)">()
  const b = cssMediaQuery(
    "screen and (min-width: 600px) and (max-width: 900px)",
  )
  expectTypeOf(
    b,
  ).toEqualTypeOf<"screen and (min-width: 600px) and (max-width: 900px)">()
})

test("media: an all-or condition keeps the literal", () => {
  const a = cssMediaQuery("(hover) or (pointer: coarse)")
  expectTypeOf(a).toEqualTypeOf<"(hover) or (pointer: coarse)">()
})

test("media: a nested group lets and/or coexist with parens", () => {
  const a = cssMediaQuery(
    "((min-width: 600px) and (max-width: 900px)) or (hover)",
  )
  expectTypeOf(
    a,
  ).toEqualTypeOf<"((min-width: 600px) and (max-width: 900px)) or (hover)">()
})

// ===========================================================================
// MediaQueryLiteral — reject (→ never)
// ===========================================================================

test("media: a length feature with a ratio value is never", () => {
  // @ts-expect-error width wants a length, not a ratio
  cssMediaQuery("(width: 16/9)")
})

test("media: a resolution feature with a length value is never", () => {
  // @ts-expect-error min-resolution wants a resolution, not a length
  cssMediaQuery("(min-resolution: 600px)")
})

test("media: a length feature with a keyword value is never", () => {
  // @ts-expect-error width wants a length, not a keyword
  cssMediaQuery("(width: red)")
})

test("media: an enum feature with an invalid keyword is never", () => {
  // @ts-expect-error sideways is not a valid orientation
  cssMediaQuery("(orientation: sideways)")
})

test("media: mixing and and or at one level is never", () => {
  // @ts-expect-error CSS forbids mixing and/or without parens
  cssMediaQuery("(min-width: 600px) and (max-width: 900px) or (hover)")
})

test("media: mixing or then and at one level is never", () => {
  // @ts-expect-error CSS forbids mixing and/or without parens
  cssMediaQuery("(width >= 600px) or (height <= 900px) and (hover)")
})

test("media: an unknown feature is never", () => {
  // @ts-expect-error not a known media feature
  cssMediaQuery("(flux-capacitor: 88mph)")
})

test("media: an unbalanced query is never", () => {
  // @ts-expect-error the parens do not balance
  cssMediaQuery("(min-width: 600px")
})

test("media: a calc() value is never (undecidable dimension)", () => {
  // @ts-expect-error calc() is deferred to the casual tier
  cssMediaQuery("(width: calc(50vw + 10px))")
})

// ===========================================================================
// ContainerQueryLiteral — accept
// ===========================================================================

test("container: a plain length feature keeps the literal", () => {
  const a = cssContainerQuery("(min-width: 400px)")
  expectTypeOf(a).toEqualTypeOf<"(min-width: 400px)">()
})

test("container: a named container keeps the literal", () => {
  const a = cssContainerQuery("sidebar (width > 400px)")
  expectTypeOf(a).toEqualTypeOf<"sidebar (width > 400px)">()
})

test("container: inline-size + aspect-ratio anded keeps the literal", () => {
  const a = cssContainerQuery("(inline-size > 30rem) and (aspect-ratio: 1/1)")
  expectTypeOf(
    a,
  ).toEqualTypeOf<"(inline-size > 30rem) and (aspect-ratio: 1/1)">()
})

test("container: orientation enum keeps the literal", () => {
  const a = cssContainerQuery("(orientation: portrait)")
  expectTypeOf(a).toEqualTypeOf<"(orientation: portrait)">()
})

// ===========================================================================
// ContainerQueryLiteral — reject (subset enforcement)
// ===========================================================================

test("container: a resolution feature is never (media-only)", () => {
  // @ts-expect-error resolution is not a container feature
  cssContainerQuery("(min-resolution: 2dppx)")
})

test("container: an interaction feature is never (media-only)", () => {
  // @ts-expect-error hover is not a container feature
  cssContainerQuery("(hover: hover)")
})

test("container: a length feature with a ratio value is never", () => {
  // @ts-expect-error inline-size wants a length
  cssContainerQuery("(inline-size: 16/9)")
})

// ===========================================================================
// Call-site helper return types
// ===========================================================================

test("cssMediaQuery returns the input literal type", () => {
  const v = cssMediaQuery("screen and (min-width: 600px)")
  expectTypeOf(v).toEqualTypeOf<"screen and (min-width: 600px)">()
})

test("cssContainerQuery returns the input literal type", () => {
  const v = cssContainerQuery("(width > 400px)")
  expectTypeOf(v).toEqualTypeOf<"(width > 400px)">()
})

// ===========================================================================
// Utility types
// ===========================================================================

test("FeaturesOf extracts the feature names", () => {
  expectTypeOf<
    FeaturesOf<"(min-width: 600px) and (orientation: landscape)">
  >().toEqualTypeOf<["min-width", "orientation"]>()
  expectTypeOf<FeaturesOf<"(hover)">>().toEqualTypeOf<["hover"]>()
})

test("FeatureCountOf counts the feature tests", () => {
  expectTypeOf<
    FeatureCountOf<"(min-width: 600px) and (max-width: 900px)">
  >().toEqualTypeOf<2>()
  expectTypeOf<FeatureCountOf<"(hover)">>().toEqualTypeOf<1>()
})

// ===========================================================================
// Suggestion strings + maps
// ===========================================================================

test("suggestion unions", () => {
  expectTypeOf<"(min-width: 600px)">().toMatchTypeOf<MediaQueryString>()
  expectTypeOf<"(width > 400px)">().toMatchTypeOf<ContainerQueryString>()
  expectTypeOf<"(min-width: 600px)">().toMatchTypeOf<QueryString>()
  expectTypeOf<QueryMode>().toEqualTypeOf<"media" | "container">()
  expectTypeOf<FeatureOperator>().toEqualTypeOf<"<" | "<=" | ">" | ">=" | "=">()
  expectTypeOf<MediaType>().toEqualTypeOf<"all" | "screen" | "print">()
  expectTypeOf<MediaModifier>().toEqualTypeOf<"only" | "not">()
})

test("QueryStringMap is keyed by mode", () => {
  expectTypeOf<QueryStringMap["media"]>().toEqualTypeOf<MediaQueryString>()
  expectTypeOf<
    QueryStringMap["container"]
  >().toEqualTypeOf<ContainerQueryString>()
})

test("enum keyword unions", () => {
  expectTypeOf<Orientation>().toEqualTypeOf<"portrait" | "landscape">()
  expectTypeOf<PrefersColorScheme>().toEqualTypeOf<"light" | "dark">()
  expectTypeOf<Pointer>().toEqualTypeOf<"none" | "coarse" | "fine">()
})

// ===========================================================================
// Internal state
// ===========================================================================

test("FeatureTest / QueryState records", () => {
  const t: FeatureTest = {
    kind: "range2",
    feature: "width",
    op: ">=",
    value: "600px",
  }
  const s: QueryState = {
    mode: "media",
    joiner: "and",
    not: false,
    tests: [t],
  }
  expectTypeOf(t).toMatchTypeOf<FeatureTest>()
  expectTypeOf(s).toMatchTypeOf<QueryState>()
  expectTypeOf<QueryState["mode"]>().toEqualTypeOf<QueryMode>()
})

// ===========================================================================
// Component onChange — returns the open suggestion union
// ===========================================================================

test("QueryBuilder onChange returns a string union", () => {
  type P = Parameters<typeof QueryBuilder>[0]
  expectTypeOf<P["onChange"]>().toMatchTypeOf<(value: QueryString) => void>()
})
