import { expectTypeOf, test } from "vitest"
import type {
  CubicBezierString,
  EasingBasis,
  EasingKeyword,
  EasingString,
  EasingStringMap,
  LinearString,
  StepPosition,
  StepsString,
} from "@/components/ui/easing-picker/easing-picker.types"

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
    | "start"
    | "end"
    | "jump-start"
    | "jump-end"
    | "jump-both"
    | "jump-none"
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
