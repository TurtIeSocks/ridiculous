import { expectTypeOf, test } from "vitest"
import type {
  AllChars,
  And,
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

test("AllChars checks membership", () => {
  expectTypeOf<AllChars<"123", "0123456789">>().toEqualTypeOf<true>()
  expectTypeOf<AllChars<"12a", "0123456789">>().toEqualTypeOf<false>()
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
