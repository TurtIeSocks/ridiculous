import { expectTypeOf, test } from "vitest"
import type { BoxShadowEditor } from "@/components/ui/box-shadow-editor"
import type {
  BoxShadowKind,
  BoxShadowLiteral,
  BoxShadowString,
  BoxShadowStringMap,
  HasInset,
  IsInsetLayer,
  LayerCountOf,
  LayersOf,
  ShadowLayer,
  ShadowLayerLiteral,
} from "@/components/ui/box-shadow-editor/box-shadow-editor.types"
import { cssBoxShadow } from "@/components/ui/box-shadow-editor/box-shadow-editor.types"

// ---------------------------------------------------------------------------
// Strict tier — single layer arity (2-4 lengths)
// ---------------------------------------------------------------------------

test("a layer accepts 2, 3, or 4 lengths", () => {
  expectTypeOf<BoxShadowLiteral<"0px 4px">>().toEqualTypeOf<"0px 4px">()
  expectTypeOf<BoxShadowLiteral<"0px 4px 8px">>().toEqualTypeOf<"0px 4px 8px">()
  expectTypeOf<
    BoxShadowLiteral<"0px 4px 8px 1px">
  >().toEqualTypeOf<"0px 4px 8px 1px">()
  // signed offsets / spread are fine
  expectTypeOf<
    BoxShadowLiteral<"-2px -4px 8px -1px">
  >().toEqualTypeOf<"-2px -4px 8px -1px">()
})

test("a layer with fewer than 2 or more than 4 lengths is never", () => {
  expectTypeOf<BoxShadowLiteral<"0px">>().toBeNever()
  expectTypeOf<BoxShadowLiteral<"0px 1px 2px 3px 4px">>().toBeNever()
})

test("bare zero is not a length at the strict tier (use 0px)", () => {
  expectTypeOf<BoxShadowLiteral<"0 4px">>().toBeNever()
  expectTypeOf<BoxShadowLiteral<"0px 0">>().toBeNever()
})

test("blur radius must be non-negative; spread may be signed", () => {
  expectTypeOf<BoxShadowLiteral<"0px 4px -8px">>().toBeNever()
  // negative spread (4th token) is allowed
  expectTypeOf<
    BoxShadowLiteral<"0px 4px 8px -2px">
  >().toEqualTypeOf<"0px 4px 8px -2px">()
})

// ---------------------------------------------------------------------------
// Strict tier — inset placement (leading OR trailing, never mid / double)
// ---------------------------------------------------------------------------

test("inset is accepted leading or trailing", () => {
  expectTypeOf<
    BoxShadowLiteral<"inset 0px 4px 8px #000">
  >().toEqualTypeOf<"inset 0px 4px 8px #000">()
  expectTypeOf<
    BoxShadowLiteral<"0px 4px 8px #000 inset">
  >().toEqualTypeOf<"0px 4px 8px #000 inset">()
  expectTypeOf<
    BoxShadowLiteral<"inset 0px 4px">
  >().toEqualTypeOf<"inset 0px 4px">()
})

test("a mid-token or doubled inset is never", () => {
  expectTypeOf<BoxShadowLiteral<"0px inset 4px">>().toBeNever()
  expectTypeOf<BoxShadowLiteral<"inset 0px 4px inset">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — color (trailing only; hex / functional; not bare keyword)
// ---------------------------------------------------------------------------

test("a trailing hex / functional color is accepted; functional stays whole", () => {
  expectTypeOf<
    BoxShadowLiteral<"0px 2px 4px #000">
  >().toEqualTypeOf<"0px 2px 4px #000">()
  expectTypeOf<
    BoxShadowLiteral<"0px 2px #f00">
  >().toEqualTypeOf<"0px 2px #f00">()
  // a functional color whose own body has spaces and a slash is one token
  expectTypeOf<
    BoxShadowLiteral<"0px 2px 4px rgb(0 0 0 / 0.2)">
  >().toEqualTypeOf<"0px 2px 4px rgb(0 0 0 / 0.2)">()
  expectTypeOf<
    BoxShadowLiteral<"0px 0px 0px 0px oklch(0.5 0.1 240)">
  >().toEqualTypeOf<"0px 0px 0px 0px oklch(0.5 0.1 240)">()
})

test("bad / bare-keyword / leading / doubled colors are never", () => {
  // bare CSS keyword colors are not in ColorLiteral — use hex / functional
  expectTypeOf<BoxShadowLiteral<"0px 4px red">>().toBeNever()
  expectTypeOf<BoxShadowLiteral<"0px 4px wrong">>().toBeNever()
  // strict tier is color-LAST only; a leading color resolves to never
  expectTypeOf<BoxShadowLiteral<"#000 0px 4px">>().toBeNever()
  // two colors
  expectTypeOf<BoxShadowLiteral<"0px 4px #000 #fff">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — calc / var undecidable
// ---------------------------------------------------------------------------

test("calc() / var() inside a token is never at the strict tier", () => {
  expectTypeOf<BoxShadowLiteral<"0px calc(4px + 1px)">>().toBeNever()
  expectTypeOf<BoxShadowLiteral<"0px 4px var(--blur)">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — multi-layer comma list + none + garbage
// ---------------------------------------------------------------------------

test("a comma-separated list of valid layers keeps the literal", () => {
  expectTypeOf<
    BoxShadowLiteral<"0px 1px 2px #000, 0px 4px 8px rgb(0 0 0 / 0.2)">
  >().toEqualTypeOf<"0px 1px 2px #000, 0px 4px 8px rgb(0 0 0 / 0.2)">()
  expectTypeOf<
    BoxShadowLiteral<"inset 0px 0px 2px #000, 0px 4px 8px #0008">
  >().toEqualTypeOf<"inset 0px 0px 2px #000, 0px 4px 8px #0008">()
})

test("a list with any invalid layer is never", () => {
  expectTypeOf<BoxShadowLiteral<"0px 4px #000, 0px 4px red">>().toBeNever()
  expectTypeOf<BoxShadowLiteral<"0px 4px, 0px">>().toBeNever()
})

test("none is valid; empty and garbage are never", () => {
  expectTypeOf<BoxShadowLiteral<"none">>().toEqualTypeOf<"none">()
  expectTypeOf<BoxShadowLiteral<"">>().toBeNever()
  expectTypeOf<BoxShadowLiteral<"wobble">>().toBeNever()
  expectTypeOf<BoxShadowLiteral<"inset">>().toBeNever()
})

// ---------------------------------------------------------------------------
// ShadowLayerLiteral — the single-layer validator (exported)
// ---------------------------------------------------------------------------

test("ShadowLayerLiteral validates one layer", () => {
  expectTypeOf<
    ShadowLayerLiteral<"inset 0px 4px 8px #000">
  >().toEqualTypeOf<"inset 0px 4px 8px #000">()
  expectTypeOf<ShadowLayerLiteral<"0px 4px red">>().toBeNever()
  // a comma-list is not a single layer
  expectTypeOf<ShadowLayerLiteral<"0px 4px, 0px 8px">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Call-site helper
// ---------------------------------------------------------------------------

test("cssBoxShadow validates at the call site", () => {
  const a = cssBoxShadow("0px 4px 8px #000")
  expectTypeOf(a).toEqualTypeOf<"0px 4px 8px #000">()

  const b = cssBoxShadow("inset 0px 0px 10px 2px #000, 0px 4px 8px #0008")
  expectTypeOf(
    b,
  ).toEqualTypeOf<"inset 0px 0px 10px 2px #000, 0px 4px 8px #0008">()

  // @ts-expect-error bare keyword color is not in ColorLiteral
  cssBoxShadow("0px 4px red")
  // @ts-expect-error a single offset is too few lengths
  cssBoxShadow("0px")
  // @ts-expect-error blur must be non-negative
  cssBoxShadow("0px 4px -8px")
  // @ts-expect-error leading color is rejected at the strict tier
  cssBoxShadow("#000 0px 4px")
  // @ts-expect-error calc() is undecidable at the strict tier
  cssBoxShadow("0px calc(4px + 1px)")
  // @ts-expect-error one bad layer fails the whole list
  cssBoxShadow("0px 4px #000, 0px 4px red")
})

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

test("LayersOf splits the raw per-layer strings", () => {
  expectTypeOf<LayersOf<"0px 4px #000, inset 0px 0px 2px">>().toEqualTypeOf<
    ["0px 4px #000", "inset 0px 0px 2px"]
  >()
  expectTypeOf<LayersOf<"0px 4px">>().toEqualTypeOf<["0px 4px"]>()
  expectTypeOf<LayersOf<"none">>().toEqualTypeOf<[]>()
})

test("LayerCountOf counts the layers", () => {
  expectTypeOf<
    LayerCountOf<"0px 1px, 0px 4px, inset 0px 0px 2px">
  >().toEqualTypeOf<3>()
  expectTypeOf<LayerCountOf<"0px 4px">>().toEqualTypeOf<1>()
  expectTypeOf<LayerCountOf<"none">>().toEqualTypeOf<0>()
})

test("HasInset reports whether any layer is inset", () => {
  expectTypeOf<HasInset<"0px 4px, inset 0px 0px 2px">>().toEqualTypeOf<true>()
  expectTypeOf<HasInset<"0px 4px 8px #000 inset">>().toEqualTypeOf<true>()
  expectTypeOf<HasInset<"0px 4px #000">>().toEqualTypeOf<false>()
  expectTypeOf<HasInset<"none">>().toEqualTypeOf<false>()
})

test("IsInsetLayer discriminates a single inset layer", () => {
  expectTypeOf<IsInsetLayer<"inset 0px 0px 2px">>().toEqualTypeOf<true>()
  expectTypeOf<IsInsetLayer<"0px 0px 2px #000 inset">>().toEqualTypeOf<true>()
  expectTypeOf<IsInsetLayer<"0px 4px">>().toEqualTypeOf<false>()
})

// ---------------------------------------------------------------------------
// Suggestion strings + map + keys
// ---------------------------------------------------------------------------

test("BoxShadowString suggestion union + map + keys", () => {
  expectTypeOf<"0px 4px 8px #000">().toMatchTypeOf<BoxShadowString>()
  expectTypeOf<"none">().toMatchTypeOf<BoxShadowString>()
  expectTypeOf<"inset 0px 0px 2px #000">().toMatchTypeOf<BoxShadowString>()
  expectTypeOf<"0px 1px 2px #000, 0px 4px 8px #0008">().toMatchTypeOf<BoxShadowString>()
  expectTypeOf<BoxShadowStringMap["inset"]>().toMatchTypeOf<`inset ${string}`>()
  expectTypeOf<BoxShadowKind>().toEqualTypeOf<keyof BoxShadowStringMap>()
})

// ---------------------------------------------------------------------------
// Internal state — the per-layer record
// ---------------------------------------------------------------------------

test("ShadowLayer is a flat record with a boolean inset discriminant", () => {
  const minimal: ShadowLayer = { inset: false, offsetX: "0px", offsetY: "4px" }
  const full: ShadowLayer = {
    inset: true,
    offsetX: "0px",
    offsetY: "0px",
    blur: "10px",
    spread: "2px",
    color: "rgb(0 0 0 / 0.5)",
  }
  expectTypeOf(minimal).toMatchTypeOf<ShadowLayer>()
  expectTypeOf(full).toMatchTypeOf<ShadowLayer>()
  expectTypeOf<ShadowLayer["inset"]>().toEqualTypeOf<boolean>()
})

// ---------------------------------------------------------------------------
// Component onChange — returns the open BoxShadowString (a list, no narrowing)
// ---------------------------------------------------------------------------

test("BoxShadowEditor onChange returns BoxShadowString", () => {
  type P = Parameters<typeof BoxShadowEditor>[0]
  expectTypeOf<P["onChange"]>().parameter(0).toEqualTypeOf<BoxShadowString>()
})
