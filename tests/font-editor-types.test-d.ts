import { expectTypeOf, test } from "vitest"
import type { FontEditor } from "@/components/ui/font-editor"
import type {
  FamiliesOf,
  FontLiteral,
  FontParts,
  FontString,
  IsSystemFont,
  LineHeightOf,
  SizeOf,
  SystemFontKeyword,
} from "@/components/ui/font-editor/font-editor.types"
import { cssFont } from "@/components/ui/font-editor/font-editor.types"

// ---------------------------------------------------------------------------
// Strict tier — minimal + full forms
// ---------------------------------------------------------------------------

test("minimal size + family keeps the literal", () => {
  expectTypeOf<FontLiteral<"16px serif">>().toEqualTypeOf<"16px serif">()
  expectTypeOf<
    FontLiteral<"1.5rem sans-serif">
  >().toEqualTypeOf<"1.5rem sans-serif">()
  expectTypeOf<
    FontLiteral<"x-large monospace">
  >().toEqualTypeOf<"x-large monospace">()
  expectTypeOf<FontLiteral<"larger serif">>().toEqualTypeOf<"larger serif">()
})

test("full form with every prefix kind + line-height + multi-family", () => {
  expectTypeOf<
    FontLiteral<"italic small-caps bold ultra-condensed 16px/1.5 sans-serif">
  >().toEqualTypeOf<"italic small-caps bold ultra-condensed 16px/1.5 sans-serif">()
  expectTypeOf<
    FontLiteral<"italic bold 16px/1.5 serif">
  >().toEqualTypeOf<"italic bold 16px/1.5 serif">()
})

test("numeric weight + percentage stretch accepted", () => {
  expectTypeOf<
    FontLiteral<"350 90% 16px serif">
  >().toEqualTypeOf<"350 90% 16px serif">()
  expectTypeOf<
    FontLiteral<"700 14px monospace">
  >().toEqualTypeOf<"700 14px monospace">()
})

// ---------------------------------------------------------------------------
// Prefix order-freedom + the `normal` ambiguity
// ---------------------------------------------------------------------------

test("prefix tokens are order-free", () => {
  expectTypeOf<
    FontLiteral<"bold italic 16px serif">
  >().toEqualTypeOf<"bold italic 16px serif">()
  expectTypeOf<
    FontLiteral<"italic bold 16px serif">
  >().toEqualTypeOf<"italic bold 16px serif">()
})

test("leading normal consumes a free prefix kind (sound for acceptance)", () => {
  expectTypeOf<
    FontLiteral<"normal 16px serif">
  >().toEqualTypeOf<"normal 16px serif">()
  expectTypeOf<
    FontLiteral<"normal normal normal normal 16px serif">
  >().toEqualTypeOf<"normal normal normal normal 16px serif">()
})

// ---------------------------------------------------------------------------
// Line-height attachment — all four spacings
// ---------------------------------------------------------------------------

test("line-height accepts attached and spaced forms", () => {
  expectTypeOf<
    FontLiteral<"16px/1.5 serif">
  >().toEqualTypeOf<"16px/1.5 serif">()
  expectTypeOf<
    FontLiteral<"16px/ 1.5 serif">
  >().toEqualTypeOf<"16px/ 1.5 serif">()
  expectTypeOf<
    FontLiteral<"16px /1.5 serif">
  >().toEqualTypeOf<"16px /1.5 serif">()
  expectTypeOf<
    FontLiteral<"16px / 1.5 serif">
  >().toEqualTypeOf<"16px / 1.5 serif">()
  // line-height can be normal / length / percentage too
  expectTypeOf<
    FontLiteral<"16px/normal serif">
  >().toEqualTypeOf<"16px/normal serif">()
  expectTypeOf<
    FontLiteral<"16px/1.2rem serif">
  >().toEqualTypeOf<"16px/1.2rem serif">()
})

// ---------------------------------------------------------------------------
// Family lists — multi-word + quoted + generics
// ---------------------------------------------------------------------------

test("family list: multi-word, quoted, generic fallback", () => {
  expectTypeOf<
    FontLiteral<"16px Times New Roman, serif">
  >().toEqualTypeOf<"16px Times New Roman, serif">()
  expectTypeOf<
    FontLiteral<'16px "My Font", monospace'>
  >().toEqualTypeOf<'16px "My Font", monospace'>()
  expectTypeOf<
    FontLiteral<"16px system-ui, sans-serif">
  >().toEqualTypeOf<"16px system-ui, sans-serif">()
})

// ---------------------------------------------------------------------------
// System-font keywords as a whole value
// ---------------------------------------------------------------------------

test("each system-font keyword is a valid whole value", () => {
  expectTypeOf<FontLiteral<"caption">>().toEqualTypeOf<"caption">()
  expectTypeOf<FontLiteral<"icon">>().toEqualTypeOf<"icon">()
  expectTypeOf<FontLiteral<"menu">>().toEqualTypeOf<"menu">()
  expectTypeOf<FontLiteral<"message-box">>().toEqualTypeOf<"message-box">()
  expectTypeOf<FontLiteral<"small-caption">>().toEqualTypeOf<"small-caption">()
  expectTypeOf<FontLiteral<"status-bar">>().toEqualTypeOf<"status-bar">()
})

// ---------------------------------------------------------------------------
// Rejections — the ordered grammar enforced
// ---------------------------------------------------------------------------

test("missing family is never", () => {
  expectTypeOf<FontLiteral<"16px">>().toBeNever()
  expectTypeOf<FontLiteral<"italic bold 16px">>().toBeNever()
})

test("missing size is never", () => {
  // `serif` lands in the size position (it is not a free prefix kind) and is
  // not a valid size → never.
  expectTypeOf<FontLiteral<"italic bold serif">>().toBeNever()
})

test("duplicate prefix kind is never", () => {
  expectTypeOf<FontLiteral<"italic oblique 16px serif">>().toBeNever() // two styles
  expectTypeOf<FontLiteral<"bold 700 16px serif">>().toBeNever() // two weights
  expectTypeOf<FontLiteral<"condensed expanded 16px serif">>().toBeNever() // two stretches
})

test("empty / garbage / lh-without-size are never", () => {
  expectTypeOf<FontLiteral<"">>().toBeNever()
  expectTypeOf<FontLiteral<"wat 16px serif">>().toBeNever() // `wat` in size slot
  expectTypeOf<FontLiteral<"/1.5 serif">>().toBeNever() // line-height, no size
})

// ---------------------------------------------------------------------------
// Call-site helper
// ---------------------------------------------------------------------------

test("cssFont validates at the call site", () => {
  const a = cssFont("italic bold 16px/1.5 'Times New Roman', serif")
  expectTypeOf(
    a,
  ).toEqualTypeOf<"italic bold 16px/1.5 'Times New Roman', serif">()
  const b = cssFont("caption")
  expectTypeOf(b).toEqualTypeOf<"caption">()

  // @ts-expect-error missing the mandatory family
  cssFont("16px")
  // @ts-expect-error two style tokens (duplicate prefix kind)
  cssFont("italic oblique 16px serif")
  // @ts-expect-error no size precedes the family
  cssFont("italic serif")
  // @ts-expect-error var() is undecidable at the strict tier
  cssFont("var(--font)")
})

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

test("IsSystemFont detects system keywords", () => {
  expectTypeOf<IsSystemFont<"caption">>().toEqualTypeOf<true>()
  expectTypeOf<IsSystemFont<"16px serif">>().toEqualTypeOf<false>()
})

test("FamiliesOf lists the comma-separated families", () => {
  expectTypeOf<FamiliesOf<"16px Times New Roman, serif">>().toEqualTypeOf<
    ["Times New Roman", "serif"]
  >()
  expectTypeOf<FamiliesOf<"16px serif">>().toEqualTypeOf<["serif"]>()
  expectTypeOf<FamiliesOf<"caption">>().toEqualTypeOf<[]>()
})

test("SizeOf and LineHeightOf extract the size + line-height tokens", () => {
  expectTypeOf<SizeOf<"italic 16px/1.5 serif">>().toEqualTypeOf<"16px">()
  expectTypeOf<SizeOf<"x-large serif">>().toEqualTypeOf<"x-large">()
  expectTypeOf<LineHeightOf<"16px/1.5 serif">>().toEqualTypeOf<"1.5">()
  expectTypeOf<LineHeightOf<"16px serif">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Suggestion strings
// ---------------------------------------------------------------------------

test("FontString suggestion union accepts system keywords + shorthand shapes", () => {
  expectTypeOf<"caption">().toMatchTypeOf<FontString>()
  expectTypeOf<"16px serif">().toMatchTypeOf<FontString>()
  expectTypeOf<"italic bold 16px/1.5 serif">().toMatchTypeOf<FontString>()
  expectTypeOf<SystemFontKeyword>().toMatchTypeOf<FontString>()
})

// ---------------------------------------------------------------------------
// Internal state — discriminated union
// ---------------------------------------------------------------------------

test("FontParts discriminates by kind", () => {
  const system: FontParts = { kind: "system", keyword: "caption" }
  const shorthand: FontParts = {
    kind: "shorthand",
    style: "italic",
    weight: "bold",
    size: "16px",
    lineHeight: "1.5",
    family: ["Times New Roman", "serif"],
  }
  expectTypeOf(system).toMatchTypeOf<FontParts>()
  expectTypeOf(shorthand).toMatchTypeOf<FontParts>()
})

// ---------------------------------------------------------------------------
// Component onChange — returns the open FontString
// ---------------------------------------------------------------------------

test("FontEditor onChange returns FontString", () => {
  type P = Parameters<typeof FontEditor>[0]
  expectTypeOf<P["onChange"]>().parameter(0).toEqualTypeOf<FontString>()
})
