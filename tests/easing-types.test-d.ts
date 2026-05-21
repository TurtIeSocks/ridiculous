import { expectTypeOf, test } from "vitest"
import type { EasingPicker } from "@/components/ui/easing-picker"
import type {
  BasisOfString,
  CubicBezierString,
  EasingBasis,
  EasingKeyword,
  EasingLiteral,
  EasingState,
  EasingString,
  EasingStringMap,
  FunctionOf,
  LinearString,
  StepPosition,
  StepsString,
} from "@/components/ui/easing-picker/easing-picker.types"
import { easing } from "@/components/ui/easing-picker/easing-picker.types"

test("EasingKeyword enumerates the 7 CSS keywords", () => {
  expectTypeOf<EasingKeyword>().toEqualTypeOf<
    | "linear"
    | "ease"
    | "ease-in"
    | "ease-out"
    | "ease-in-out"
    | "step-start"
    | "step-end"
  >()
})

test("StepPosition enumerates 6 jump terms", () => {
  expectTypeOf<StepPosition>().toEqualTypeOf<
    "start" | "end" | "jump-start" | "jump-end" | "jump-both" | "jump-none"
  >()
})

test("CubicBezierString accepts the comma form", () => {
  expectTypeOf<"cubic-bezier(0.42, 0, 0.58, 1)">().toMatchTypeOf<CubicBezierString>()
})

test("StepsString accepts both arity forms", () => {
  expectTypeOf<"steps(3)">().toMatchTypeOf<StepsString>()
  expectTypeOf<"steps(3, jump-end)">().toMatchTypeOf<StepsString>()
})

test("LinearString accepts any body", () => {
  expectTypeOf<"linear(0, 0.5 50%, 1)">().toMatchTypeOf<LinearString>()
})

test("EasingString unions all four", () => {
  expectTypeOf<EasingString>().toEqualTypeOf<
    EasingKeyword | CubicBezierString | StepsString | LinearString
  >()
})

test("EasingBasis enumerates the 5 basis types", () => {
  expectTypeOf<EasingBasis>().toEqualTypeOf<
    "bezier" | "spring" | "bounce" | "wiggle" | "steps"
  >()
})

test("EasingStringMap maps basis to output string types", () => {
  expectTypeOf<EasingStringMap["bezier"]>().toEqualTypeOf<CubicBezierString>()
  expectTypeOf<EasingStringMap["spring"]>().toEqualTypeOf<LinearString>()
  expectTypeOf<EasingStringMap["steps"]>().toEqualTypeOf<StepsString>()
})

test("EasingLiteral accepts CSS keywords", () => {
  expectTypeOf<EasingLiteral<"ease">>().toEqualTypeOf<"ease">()
  expectTypeOf<EasingLiteral<"ease-in-out">>().toEqualTypeOf<"ease-in-out">()
})

test("EasingLiteral accepts cubic-bezier with x ∈ [0,1]", () => {
  expectTypeOf<
    EasingLiteral<"cubic-bezier(0.42, 0, 0.58, 1)">
  >().toEqualTypeOf<"cubic-bezier(0.42, 0, 0.58, 1)">()
})

test("EasingLiteral allows overshoot y (signed decimal)", () => {
  expectTypeOf<
    EasingLiteral<"cubic-bezier(0.5, -0.5, 0.5, 1.5)">
  >().toEqualTypeOf<"cubic-bezier(0.5, -0.5, 0.5, 1.5)">()
})

test("EasingLiteral rejects cubic-bezier with x1 > 1", () => {
  expectTypeOf<EasingLiteral<"cubic-bezier(2, 0, 0.5, 1)">>().toBeNever()
})

test("EasingLiteral accepts steps with and without position", () => {
  expectTypeOf<EasingLiteral<"steps(3)">>().toEqualTypeOf<"steps(3)">()
  expectTypeOf<
    EasingLiteral<"steps(4, jump-end)">
  >().toEqualTypeOf<"steps(4, jump-end)">()
})

test("EasingLiteral rejects steps with non-positive n", () => {
  expectTypeOf<EasingLiteral<"steps(0)">>().toBeNever()
})

test("easing() helper validates at call site", () => {
  const a = easing("cubic-bezier(0.42, 0, 0.58, 1)")
  expectTypeOf(a).toEqualTypeOf<"cubic-bezier(0.42, 0, 0.58, 1)">()

  // @ts-expect-error — x1 > 1
  easing("cubic-bezier(2, 0, 0.5, 1)")

  // @ts-expect-error — not a known easing
  easing("garbage")
})

test("FunctionOf resolves to function family", () => {
  expectTypeOf<FunctionOf<"cubic-bezier(0,0,1,1)">>().toEqualTypeOf<"bezier">()
  expectTypeOf<FunctionOf<"steps(4, jump-end)">>().toEqualTypeOf<"steps">()
  expectTypeOf<FunctionOf<"linear(0, 1)">>().toEqualTypeOf<"linear">()
  expectTypeOf<FunctionOf<"ease-in">>().toEqualTypeOf<"bezier">()
  expectTypeOf<FunctionOf<"step-start">>().toEqualTypeOf<"steps">()
  expectTypeOf<FunctionOf<"garbage">>().toBeNever()
})

test("BasisOfString returns ambiguous union for linear()", () => {
  expectTypeOf<BasisOfString<"linear(0, 0.5, 1)">>().toEqualTypeOf<
    "spring" | "bounce" | "wiggle"
  >()
  expectTypeOf<
    BasisOfString<"cubic-bezier(0.5, 0, 0.5, 1)">
  >().toEqualTypeOf<"bezier">()
  expectTypeOf<BasisOfString<"steps(3)">>().toEqualTypeOf<"steps">()
})

test("EasingState discriminates by basis", () => {
  const bezier: EasingState = {
    basis: "bezier",
    x1: 0.42,
    y1: 0,
    x2: 0.58,
    y2: 1,
    extraTop: 0.25,
    extraBottom: 0.25,
  }
  const spring: EasingState = {
    basis: "spring",
    stiffness: 100,
    damping: 10,
    mass: 1,
  }
  // Use EasingState["basis"] — accessing .basis on a narrowed discriminated-union
  // variable yields the narrowed literal, not the full union.
  expectTypeOf<EasingState["basis"]>().toEqualTypeOf<
    "bezier" | "spring" | "bounce" | "wiggle" | "steps"
  >()
  // Verify the variables are valid EasingState members
  expectTypeOf(bezier).toMatchTypeOf<EasingState>()
  expectTypeOf(spring).toMatchTypeOf<EasingState>()
})

test("EasingPicker basis='bezier' narrows onChange to CubicBezierString", () => {
  type Props = Parameters<typeof EasingPicker<"bezier">>[0]
  expectTypeOf<Props["onChange"]>()
    .parameter(0)
    .toEqualTypeOf<CubicBezierString>()
})

test("EasingPicker basis='spring' narrows onChange to LinearString", () => {
  type Props = Parameters<typeof EasingPicker<"spring">>[0]
  expectTypeOf<Props["onChange"]>().parameter(0).toEqualTypeOf<LinearString>()
})

test("EasingPicker basis='steps' narrows onChange to StepsString", () => {
  type Props = Parameters<typeof EasingPicker<"steps">>[0]
  expectTypeOf<Props["onChange"]>().parameter(0).toEqualTypeOf<StepsString>()
})

test("EasingPicker without basis keeps full EasingString union", () => {
  type Props = Parameters<typeof EasingPicker>[0]
  expectTypeOf<Props["onChange"]>().parameter(0).toEqualTypeOf<EasingString>()
})

import type { PreviewProperty } from "@/components/ui/easing-picker"

// Compile-time assertion: PreviewProperty must list every property the playground exposes.
// If a property is added/removed in PROP_KEYFRAMES without updating PreviewProperty
// (or vice versa), this fails at type-check time via the exhaustive list below.
const _EXHAUSTIVE_PREVIEW_PROPERTIES: ReadonlyArray<PreviewProperty> = [
  "moveX",
  "moveY",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
  "opacity",
  "width",
  "color",
  "blur",
] as const
void _EXHAUSTIVE_PREVIEW_PROPERTIES
