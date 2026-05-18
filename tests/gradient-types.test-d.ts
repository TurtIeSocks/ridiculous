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
