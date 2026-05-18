import { expectTypeOf, test } from "vitest"
import type {
  HexLiteral,
  HSLLiteral,
  HWBLiteral,
  OKLCHLiteral,
  OklabLiteral,
  RGBALiteral,
  RGBLiteral,
} from "@/components/ui/color-picker/color-picker.types"

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

test("RGBLiteral accepts valid forms", () => {
  expectTypeOf<RGBLiteral<"rgb(255, 0, 0)">>().toEqualTypeOf<"rgb(255, 0, 0)">()
  expectTypeOf<RGBLiteral<"rgb(255 0 0)">>().toEqualTypeOf<"rgb(255 0 0)">()
  expectTypeOf<
    RGBLiteral<"rgb(100%, 0%, 0%)">
  >().toEqualTypeOf<"rgb(100%, 0%, 0%)">()
})

test("RGBLiteral rejects out-of-range bytes", () => {
  expectTypeOf<RGBLiteral<"rgb(256, 0, 0)">>().toBeNever()
  expectTypeOf<RGBLiteral<"rgb(255 0 999)">>().toBeNever()
})

test("RGBALiteral accepts alpha forms", () => {
  expectTypeOf<
    RGBALiteral<"rgba(255, 0, 0, 0.5)">
  >().toEqualTypeOf<"rgba(255, 0, 0, 0.5)">()
  expectTypeOf<
    RGBALiteral<"rgba(255 0 0 / 0.5)">
  >().toEqualTypeOf<"rgba(255 0 0 / 0.5)">()
  expectTypeOf<
    RGBALiteral<"rgb(255 0 0 / 0.5)">
  >().toEqualTypeOf<"rgb(255 0 0 / 0.5)">()
})

test("RGBALiteral rejects bad alpha", () => {
  expectTypeOf<RGBALiteral<"rgba(255, 0, 0, 2)">>().toBeNever()
})

test("HSLLiteral accepts valid forms", () => {
  expectTypeOf<
    HSLLiteral<"hsl(210 100% 50%)">
  >().toEqualTypeOf<"hsl(210 100% 50%)">()
  expectTypeOf<
    HSLLiteral<"hsl(210, 100%, 50%)">
  >().toEqualTypeOf<"hsl(210, 100%, 50%)">()
  expectTypeOf<
    HSLLiteral<"hsl(210 100% 50% / 0.5)">
  >().toEqualTypeOf<"hsl(210 100% 50% / 0.5)">()
})

test("HSLLiteral rejects out-of-range", () => {
  expectTypeOf<HSLLiteral<"hsl(400 100% 50%)">>().toBeNever()
  expectTypeOf<HSLLiteral<"hsl(210 200% 50%)">>().toBeNever()
})

test("OKLCHLiteral accepts valid forms", () => {
  expectTypeOf<
    OKLCHLiteral<"oklch(0.5 0.1 240)">
  >().toEqualTypeOf<"oklch(0.5 0.1 240)">()
  expectTypeOf<
    OKLCHLiteral<"oklch(50% 0.1 240deg)">
  >().toEqualTypeOf<"oklch(50% 0.1 240deg)">()
  expectTypeOf<
    OKLCHLiteral<"oklch(0.5 0.1 240 / 0.5)">
  >().toEqualTypeOf<"oklch(0.5 0.1 240 / 0.5)">()
})

test("OKLCHLiteral rejects bad L", () => {
  expectTypeOf<OKLCHLiteral<"oklch(2 0.1 240)">>().toBeNever()
})

test("OklabLiteral accepts valid forms", () => {
  expectTypeOf<
    OklabLiteral<"oklab(0.5 0.1 -0.05)">
  >().toEqualTypeOf<"oklab(0.5 0.1 -0.05)">()
  expectTypeOf<
    OklabLiteral<"oklab(50% 0.1 -0.05)">
  >().toEqualTypeOf<"oklab(50% 0.1 -0.05)">()
  expectTypeOf<
    OklabLiteral<"oklab(0.5 0.1 -0.05 / 0.5)">
  >().toEqualTypeOf<"oklab(0.5 0.1 -0.05 / 0.5)">()
})

test("OklabLiteral rejects bad L", () => {
  expectTypeOf<OklabLiteral<"oklab(2 0.1 0.1)">>().toBeNever()
})

test("HWBLiteral accepts valid forms", () => {
  expectTypeOf<HWBLiteral<"hwb(0 0% 0%)">>().toEqualTypeOf<"hwb(0 0% 0%)">()
  expectTypeOf<
    HWBLiteral<"hwb(240 20% 30%)">
  >().toEqualTypeOf<"hwb(240 20% 30%)">()
  expectTypeOf<
    HWBLiteral<"hwb(240 20% 30% / 0.5)">
  >().toEqualTypeOf<"hwb(240 20% 30% / 0.5)">()
})

test("HWBLiteral rejects bad hue/percent", () => {
  expectTypeOf<HWBLiteral<"hwb(400 0% 0%)">>().toBeNever()
  expectTypeOf<HWBLiteral<"hwb(0 200% 0%)">>().toBeNever()
})
