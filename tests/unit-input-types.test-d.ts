import { expectTypeOf, test } from "vitest"
import type {
  DegLiteral,
  PercentLiteral,
  PxLiteral,
  RemLiteral,
  EmLiteral,
  VwLiteral,
  VhLiteral,
  UnitLiteral,
} from "@/components/ui/unit-input"

test("DegLiteral accepts valid, rejects invalid", () => {
  expectTypeOf<DegLiteral<"45deg">>().toEqualTypeOf<"45deg">()
  expectTypeOf<DegLiteral<"-12.5deg">>().toEqualTypeOf<"-12.5deg">()
  expectTypeOf<DegLiteral<"45px">>().toBeNever()
  expectTypeOf<DegLiteral<"abcdeg">>().toBeNever()
  expectTypeOf<DegLiteral<"deg">>().toBeNever()
})

test("PercentLiteral accepts valid, rejects invalid", () => {
  expectTypeOf<PercentLiteral<"50%">>().toEqualTypeOf<"50%">()
  expectTypeOf<PercentLiteral<"-3.14%">>().toEqualTypeOf<"-3.14%">()
  expectTypeOf<PercentLiteral<"50">>().toBeNever()
  expectTypeOf<PercentLiteral<"50px">>().toBeNever()
})

test("Px/Rem/Em/Vw/Vh literals shape-check their suffix", () => {
  expectTypeOf<PxLiteral<"16px">>().toEqualTypeOf<"16px">()
  expectTypeOf<RemLiteral<"1.5rem">>().toEqualTypeOf<"1.5rem">()
  expectTypeOf<EmLiteral<"2em">>().toEqualTypeOf<"2em">()
  expectTypeOf<VwLiteral<"100vw">>().toEqualTypeOf<"100vw">()
  expectTypeOf<VhLiteral<"50vh">>().toEqualTypeOf<"50vh">()
  expectTypeOf<PxLiteral<"16em">>().toBeNever()
})

test("UnitLiteral is the union across all 7 unit literal types", () => {
  expectTypeOf<UnitLiteral<"45deg">>().toEqualTypeOf<"45deg">()
  expectTypeOf<UnitLiteral<"50%">>().toEqualTypeOf<"50%">()
  expectTypeOf<UnitLiteral<"16px">>().toEqualTypeOf<"16px">()
  expectTypeOf<UnitLiteral<"45">>().toBeNever()
})
