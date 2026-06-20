import { describe, expectTypeOf, it } from "vitest"
import {
  type AnchorLiteral,
  type AnchorPositionMode,
  type AnchorStringMap,
  type AxisOf,
  cssAnchor,
  cssPositionArea,
  cssPositionTry,
  type KeywordsOf,
  type PositionAreaLiteral,
  type PositionTryLiteral,
} from "@/components/ui/anchor-position-editor"

// ---------------------------------------------------------------------------
// position-area — the cross-axis rule
// ---------------------------------------------------------------------------

describe("PositionAreaLiteral", () => {
  it("accepts a single keyword", () => {
    expectTypeOf<PositionAreaLiteral<"center">>().toEqualTypeOf<"center">()
    expectTypeOf<PositionAreaLiteral<"top">>().toEqualTypeOf<"top">()
    expectTypeOf<PositionAreaLiteral<"span-all">>().toEqualTypeOf<"span-all">()
  })

  it("accepts a cross-axis pair in the same coordinate system", () => {
    expectTypeOf<PositionAreaLiteral<"top left">>().toEqualTypeOf<"top left">()
    expectTypeOf<
      PositionAreaLiteral<"block-start span-inline-end">
    >().toEqualTypeOf<"block-start span-inline-end">()
    expectTypeOf<
      PositionAreaLiteral<"span-all center">
    >().toEqualTypeOf<"span-all center">()
    expectTypeOf<
      PositionAreaLiteral<"bottom center">
    >().toEqualTypeOf<"bottom center">()
  })

  it("rejects two keywords on the same axis", () => {
    expectTypeOf<PositionAreaLiteral<"top bottom">>().toBeNever()
    expectTypeOf<PositionAreaLiteral<"left right">>().toBeNever()
    expectTypeOf<PositionAreaLiteral<"block-start block-end">>().toBeNever()
  })

  it("rejects mixing physical and logical systems", () => {
    expectTypeOf<PositionAreaLiteral<"left block-start">>().toBeNever()
    expectTypeOf<PositionAreaLiteral<"top inline-start">>().toBeNever()
  })

  it("rejects unknown keywords and >2 tokens", () => {
    expectTypeOf<PositionAreaLiteral<"nowhere">>().toBeNever()
    expectTypeOf<PositionAreaLiteral<"top left right">>().toBeNever()
    expectTypeOf<PositionAreaLiteral<"">>().toBeNever()
  })

  it("classifies axes", () => {
    expectTypeOf<AxisOf<"left">>().toEqualTypeOf<"x">()
    expectTypeOf<AxisOf<"top">>().toEqualTypeOf<"y">()
    expectTypeOf<AxisOf<"block-start">>().toEqualTypeOf<"block">()
    expectTypeOf<AxisOf<"inline-end">>().toEqualTypeOf<"inline">()
    expectTypeOf<AxisOf<"center">>().toEqualTypeOf<"neutral">()
  })

  it("cssPositionArea returns the literal for valid input", () => {
    const v = cssPositionArea("top left")
    expectTypeOf(v).toEqualTypeOf<"top left">()
    // @ts-expect-error both keywords on the y axis
    cssPositionArea("top bottom")
    // @ts-expect-error physical + logical mix
    cssPositionArea("left block-start")
    // @ts-expect-error unknown keyword
    cssPositionArea("nowhere")
  })
})

// ---------------------------------------------------------------------------
// anchor() / anchor-size()
// ---------------------------------------------------------------------------

describe("AnchorLiteral", () => {
  it("accepts anchor() / anchor-size() forms", () => {
    expectTypeOf<
      AnchorLiteral<"anchor(--btn bottom)">
    >().toEqualTypeOf<"anchor(--btn bottom)">()
    expectTypeOf<
      AnchorLiteral<"anchor(top, 8px)">
    >().toEqualTypeOf<"anchor(top, 8px)">()
    expectTypeOf<
      AnchorLiteral<"anchor-size(--btn width)">
    >().toEqualTypeOf<"anchor-size(--btn width)">()
    expectTypeOf<AnchorLiteral<"anchor(50%)">>().toEqualTypeOf<"anchor(50%)">()
  })

  it("rejects bad sides / sizes / fallbacks / names", () => {
    expectTypeOf<AnchorLiteral<"anchor(--btn diagonal)">>().toBeNever()
    expectTypeOf<AnchorLiteral<"anchor-size(--btn red)">>().toBeNever()
    expectTypeOf<AnchorLiteral<"anchor(top, red)">>().toBeNever()
    expectTypeOf<AnchorLiteral<"rotate(90deg)">>().toBeNever()
  })

  it("cssAnchor gates at the call site", () => {
    expectTypeOf(
      cssAnchor("anchor(--btn bottom)"),
    ).toEqualTypeOf<"anchor(--btn bottom)">()
    // @ts-expect-error diagonal is not an anchor-side keyword
    cssAnchor("anchor(--btn diagonal)")
    // @ts-expect-error fallback must be a <length-percentage>
    cssAnchor("anchor(top, red)")
  })
})

// ---------------------------------------------------------------------------
// position-try-fallbacks
// ---------------------------------------------------------------------------

describe("PositionTryLiteral", () => {
  it("accepts well-formed fallback chains", () => {
    expectTypeOf<
      PositionTryLiteral<"--fallback, flip-block">
    >().toEqualTypeOf<"--fallback, flip-block">()
    expectTypeOf<
      PositionTryLiteral<"flip-block flip-inline">
    >().toEqualTypeOf<"flip-block flip-inline">()
    expectTypeOf<
      PositionTryLiteral<"top, none, --a flip-start">
    >().toEqualTypeOf<"top, none, --a flip-start">()
  })

  it("rejects bad tactics and axis-sharing embedded areas", () => {
    expectTypeOf<PositionTryLiteral<"flip-diagonal">>().toBeNever()
    expectTypeOf<PositionTryLiteral<"top bottom">>().toBeNever()
    expectTypeOf<PositionTryLiteral<"">>().toBeNever()
  })

  it("cssPositionTry gates at the call site", () => {
    expectTypeOf(
      cssPositionTry("--a, flip-block"),
    ).toEqualTypeOf<"--a, flip-block">()
    // @ts-expect-error flip-diagonal is not a try-tactic
    cssPositionTry("flip-diagonal")
    // @ts-expect-error embedded position-area shares an axis
    cssPositionTry("top bottom")
  })
})

// ---------------------------------------------------------------------------
// suggestion strings + utility types
// ---------------------------------------------------------------------------

describe("type surface", () => {
  it("exposes the mode union", () => {
    expectTypeOf<AnchorPositionMode>().toEqualTypeOf<
      "position-area" | "anchor" | "position-try"
    >()
  })

  it("AnchorStringMap is keyed by mode", () => {
    expectTypeOf<keyof AnchorStringMap>().toEqualTypeOf<AnchorPositionMode>()
  })

  it("KeywordsOf splits the pair", () => {
    expectTypeOf<KeywordsOf<"top left">>().toEqualTypeOf<["top", "left"]>()
  })
})
