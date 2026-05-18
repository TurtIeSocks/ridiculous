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
