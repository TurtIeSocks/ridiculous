import { expectTypeOf, test } from "vitest"
import type {
  AllChars,
  And,
  Digit,
  IsByte,
  IsNonNegativeNumber,
  IsNumber,
  IsNumber0To1,
  IsNumber0To100,
  IsNumber0To360,
  IsPercent0To100,
  IsPositiveInt,
  IsSignedDecimal,
  KeepIf,
  Length,
  Not,
  Or,
  Trim,
} from "@/lib/ridiculous-type-kit"

test("Trim strips surrounding whitespace", () => {
  expectTypeOf<Trim<"  hi ">>().toEqualTypeOf<"hi">()
  expectTypeOf<Trim<"none">>().toEqualTypeOf<"none">()
})

test("AllChars checks membership against a char union", () => {
  expectTypeOf<AllChars<"123", Digit>>().toEqualTypeOf<true>()
  expectTypeOf<AllChars<"12a", Digit>>().toEqualTypeOf<false>()
})

test("boolean logic", () => {
  expectTypeOf<And<true, true>>().toEqualTypeOf<true>()
  expectTypeOf<And<true, false>>().toEqualTypeOf<false>()
  expectTypeOf<Or<false, true>>().toEqualTypeOf<true>()
  expectTypeOf<Or<false, false>>().toEqualTypeOf<false>()
  expectTypeOf<Not<true>>().toEqualTypeOf<false>()
})

test("KeepIf gates a literal", () => {
  expectTypeOf<KeepIf<true, "x">>().toEqualTypeOf<"x">()
  expectTypeOf<KeepIf<false, "x">>().toBeNever()
})

test("Length counts characters", () => {
  expectTypeOf<Length<"abc">>().toEqualTypeOf<3>()
  expectTypeOf<Length<"">>().toEqualTypeOf<0>()
})

test("IsByte range-checks 0-255", () => {
  expectTypeOf<IsByte<"0">>().toEqualTypeOf<true>()
  expectTypeOf<IsByte<"255">>().toEqualTypeOf<true>()
  expectTypeOf<IsByte<"256">>().toEqualTypeOf<false>()
  expectTypeOf<IsByte<"-1">>().toEqualTypeOf<false>()
})

test("bounded number validators", () => {
  expectTypeOf<IsNumber0To1<"0.5">>().toEqualTypeOf<true>()
  expectTypeOf<IsNumber0To1<"1.1">>().toEqualTypeOf<false>()
  expectTypeOf<IsNumber0To100<"100">>().toEqualTypeOf<true>()
  expectTypeOf<IsNumber0To100<"101">>().toEqualTypeOf<false>()
  expectTypeOf<IsNumber0To360<"360">>().toEqualTypeOf<true>()
  expectTypeOf<IsPercent0To100<"50%">>().toEqualTypeOf<true>()
  expectTypeOf<IsPercent0To100<"150%">>().toEqualTypeOf<false>()
  // Whitespace policy matches IsPercentage (dimensions): the inner number is
  // trimmed, so a leading-space percent is accepted by both.
  expectTypeOf<IsPercent0To100<" 50%">>().toEqualTypeOf<true>()
})

test("number shape predicates", () => {
  expectTypeOf<IsNonNegativeNumber<"3.14">>().toEqualTypeOf<true>()
  expectTypeOf<IsSignedDecimal<"-0.05">>().toEqualTypeOf<true>()
  expectTypeOf<IsNumber<"+2">>().toEqualTypeOf<true>()
  expectTypeOf<IsNumber<"2px">>().toEqualTypeOf<false>()
  expectTypeOf<IsPositiveInt<"3">>().toEqualTypeOf<true>()
  expectTypeOf<IsPositiveInt<"0">>().toEqualTypeOf<false>()
})
