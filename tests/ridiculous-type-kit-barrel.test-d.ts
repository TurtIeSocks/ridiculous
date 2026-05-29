import { expectTypeOf, test } from "vitest"
import type {
  // primitives
  AllChars,
  And,
  Digit,
  // dimensions
  Dimension,
  DimensionOf,
  // combinators
  EndsWith,
  HexDigit,
  IsAngle,
  IsByte,
  IsFlex,
  IsLength,
  IsNumber,
  IsNumber0To1,
  IsPercent0To100,
  IsPercentage,
  IsPositiveInt,
  IsResolution,
  IsSignedDecimal,
  IsTime,
  KeepIf,
  Length,
  Not,
  Or,
  ParseFunction,
  SplitByComma,
  SplitBySpace,
  StartsWith,
  Trim,
} from "@/lib/ridiculous-type-kit"

// Every public type must be reachable through the barrel. Referencing each
// in a no-op position fails compilation if an export is missing or renamed.
test("ridiculous-type-kit public surface is reachable via the barrel", () => {
  expectTypeOf<Trim<"  x ">>().toEqualTypeOf<"x">()
  expectTypeOf<DimensionOf<"10px">>().toEqualTypeOf<"length">()
  expectTypeOf<SplitByComma<"a, b">>().toEqualTypeOf<["a", "b"]>()
  expectTypeOf<ParseFunction<"min(0, 1)">>().toEqualTypeOf<{
    name: "min"
    args: "0, 1"
  }>()
  // Compile-time reachability for the remainder (no assertion needed):
  type _Reach = [
    AllChars<"1", "1">,
    And<true, true>,
    Or<true, false>,
    Not<true>,
    KeepIf<true, "x">,
    Length<"ab">,
    Digit,
    HexDigit,
    IsByte<"1">,
    IsNumber<"1">,
    IsNumber0To1<"1">,
    IsPercent0To100<"1%">,
    IsPositiveInt<"1">,
    IsSignedDecimal<"-1">,
    Dimension,
    IsAngle<"1deg">,
    IsFlex<"1fr">,
    IsLength<"1px">,
    IsPercentage<"1%">,
    IsResolution<"1x">,
    IsTime<"1s">,
    EndsWith<"ab", "b">,
    SplitBySpace<"a b">,
    StartsWith<"ab", "a">,
  ]
  expectTypeOf<_Reach["length"]>().toEqualTypeOf<24>()
})
