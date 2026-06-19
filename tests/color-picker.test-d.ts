import { describe, expectTypeOf, it } from "vitest"
import type {
  ColorString,
  ColorValue,
  HexString,
} from "@/components/ui/color-picker/color-picker.types"

describe("ColorValue<TMode>", () => {
  it("resolves to the mode-specific string when TMode is set", () => {
    expectTypeOf<ColorValue<"hex">>().toEqualTypeOf<HexString>()
  })
  it("resolves to the broad union when TMode is undefined", () => {
    expectTypeOf<ColorValue<undefined>>().toEqualTypeOf<ColorString>()
    expectTypeOf<ColorValue>().toEqualTypeOf<ColorString>()
  })
})
