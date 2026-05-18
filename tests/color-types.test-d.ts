import { expectTypeOf, test } from "vitest"
import type { HexLiteral } from "@/components/ui/color-picker/color-picker.types"

// Type-only smoke test: ensure the file imports cleanly.
test("color-picker.types module imports", () => {
  expectTypeOf<string>().toBeString()
})

test("HexLiteral accepts valid hex", () => {
  expectTypeOf<HexLiteral<"#ff0000">>().toEqualTypeOf<"#ff0000">()
  expectTypeOf<HexLiteral<"#fff">>().toEqualTypeOf<"#fff">()
  expectTypeOf<HexLiteral<"#ff0000ff">>().toEqualTypeOf<"#ff0000ff">()
  expectTypeOf<HexLiteral<"#abcd">>().toEqualTypeOf<"#abcd">()
})

test("HexLiteral rejects invalid hex", () => {
  expectTypeOf<HexLiteral<"#zzz">>().toBeNever()
  expectTypeOf<HexLiteral<"#ff">>().toBeNever() // wrong length
  expectTypeOf<HexLiteral<"#fffff">>().toBeNever() // wrong length
  expectTypeOf<HexLiteral<"ff0000">>().toBeNever() // missing #
})
