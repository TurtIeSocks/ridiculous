import { expectTypeOf, test } from "vitest"
import type {
  ConicGradientString,
  GradientString,
  GradientStringMap,
  GradientType,
  LinearGradientString,
  RadialGradientString,
} from "@/components/ui/gradient-editor/gradient-editor.types"

test("GradientType enumerates the three gradient flavors", () => {
  expectTypeOf<GradientType>().toEqualTypeOf<"linear" | "radial" | "conic">()
})

test("GradientStringMap keys match GradientType", () => {
  expectTypeOf<keyof GradientStringMap>().toEqualTypeOf<GradientType>()
})

test("GradientString unions the three flavors", () => {
  expectTypeOf<
    LinearGradientString | RadialGradientString | ConicGradientString
  >().toEqualTypeOf<GradientString>()
})

import type {
  InterpolationHueMethod,
  InterpolationSpace,
  PolarSpace,
} from "@/components/ui/gradient-editor/gradient-editor.types"

test("InterpolationSpace lists the 5 supported spaces", () => {
  expectTypeOf<InterpolationSpace>().toEqualTypeOf<
    "srgb" | "oklch" | "oklab" | "hsl" | "hwb"
  >()
})

test("InterpolationHueMethod is shorter | longer", () => {
  expectTypeOf<InterpolationHueMethod>().toEqualTypeOf<"shorter" | "longer">()
})

test("PolarSpace is the polar subset of InterpolationSpace", () => {
  expectTypeOf<PolarSpace>().toEqualTypeOf<"oklch" | "hsl" | "hwb">()
})

import type {
  GradientTypeOf,
  InterpolationOf,
} from "@/components/ui/gradient-editor/gradient-editor.types"

test("GradientTypeOf extracts the type from a literal", () => {
  expectTypeOf<
    GradientTypeOf<"linear-gradient(red, blue)">
  >().toEqualTypeOf<"linear">()
  expectTypeOf<
    GradientTypeOf<"radial-gradient(red, blue)">
  >().toEqualTypeOf<"radial">()
  expectTypeOf<
    GradientTypeOf<"conic-gradient(red, blue)">
  >().toEqualTypeOf<"conic">()
  expectTypeOf<GradientTypeOf<"not a gradient">>().toBeNever()
})

test("InterpolationOf extracts the interpolation space", () => {
  expectTypeOf<
    InterpolationOf<"linear-gradient(in oklch, red, blue)">
  >().toEqualTypeOf<"oklch">()
  expectTypeOf<
    InterpolationOf<"linear-gradient(in oklch longer hue, red, blue)">
  >().toEqualTypeOf<"oklch">()
  expectTypeOf<
    InterpolationOf<"linear-gradient(in oklch shorter hue, red, blue)">
  >().toEqualTypeOf<"oklch">()
  expectTypeOf<InterpolationOf<"linear-gradient(red, blue)">>().toBeNever()
})

import { expect } from "vitest"
import { isGradientString } from "@/components/ui/gradient-editor/gradient-editor.helpers"

test("isGradientString accepts valid gradients", () => {
  expect(isGradientString("linear-gradient(#ff0000, #0000ff)")).toBe(true)
  expect(isGradientString("radial-gradient(#ff0000, #0000ff)")).toBe(true)
  expect(isGradientString("conic-gradient(#ff0000, #0000ff)")).toBe(true)
  expect(isGradientString("linear-gradient(in oklch, #ff0000, #0000ff)")).toBe(
    true,
  )
})

test("isGradientString rejects non-gradient strings", () => {
  expect(isGradientString("not a gradient")).toBe(false)
  expect(isGradientString("")).toBe(false)
  expect(isGradientString("#ff0000")).toBe(false)
  expect(isGradientString("linear-gradient(#ff0000)")).toBe(false) // single stop
})
