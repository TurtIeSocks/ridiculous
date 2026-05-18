import { expectTypeOf, test } from "vitest"
import type {
  DegLiteral,
  EmLiteral,
  PercentLiteral,
  PxLiteral,
  RemLiteral,
  UnitLiteral,
  VhLiteral,
  VwLiteral,
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

import type {
  DegString,
  EmString,
  KnownUnit,
  PercentString,
  PxString,
  RemString,
  UnitString,
  UnitStringMap,
  VhString,
  VwString,
} from "@/components/ui/unit-input"
import { deg, em, percent, px, rem, vh, vw } from "@/components/ui/unit-input"

test("Suggestion strings extend their template shape", () => {
  expectTypeOf<DegString>().toExtend<`${number}deg`>()
  expectTypeOf<PercentString>().toExtend<`${number}%`>()
  expectTypeOf<PxString>().toExtend<`${number}px`>()
  expectTypeOf<RemString>().toExtend<`${number}rem`>()
  expectTypeOf<EmString>().toExtend<`${number}em`>()
  expectTypeOf<VwString>().toExtend<`${number}vw`>()
  expectTypeOf<VhString>().toExtend<`${number}vh`>()
})

test("UnitStringMap keys are KnownUnit, values are correct strings", () => {
  expectTypeOf<KnownUnit>().toEqualTypeOf<keyof UnitStringMap>()
  expectTypeOf<UnitStringMap["deg"]>().toEqualTypeOf<DegString>()
  expectTypeOf<UnitStringMap["%"]>().toEqualTypeOf<PercentString>()
  expectTypeOf<UnitString>().toEqualTypeOf<UnitStringMap[KnownUnit]>()
})

test("Strict helpers return the literal back, error on shape mismatch", () => {
  expectTypeOf(deg("45deg")).toEqualTypeOf<"45deg">()
  expectTypeOf(percent("50%")).toEqualTypeOf<"50%">()
  expectTypeOf(px("16px")).toEqualTypeOf<"16px">()
  expectTypeOf(rem("1.5rem")).toEqualTypeOf<"1.5rem">()
  expectTypeOf(em("2em")).toEqualTypeOf<"2em">()
  expectTypeOf(vw("100vw")).toEqualTypeOf<"100vw">()
  expectTypeOf(vh("50vh")).toEqualTypeOf<"50vh">()
})

test("Strict helpers reject wrong suffix or missing suffix", () => {
  // @ts-expect-error — wrong suffix
  deg("45px")
  // @ts-expect-error — missing suffix
  deg("45")
  // @ts-expect-error — bare number
  percent("50")
})

test("Cross-suffix rejection for all strict helpers", () => {
  // @ts-expect-error — wrong suffix
  percent("50px")
  // @ts-expect-error — wrong suffix
  px("16em")
  // @ts-expect-error — wrong suffix
  rem("1.5em")
  // @ts-expect-error — wrong suffix
  em("2rem")
  // @ts-expect-error — wrong suffix
  vw("100vh")
  // @ts-expect-error — wrong suffix
  vh("50vw")
})

test("Suffix substring overlap (em/rem) does not cross-match", () => {
  // RemLiteral matches `${N}rem`, not `${N}em` — so "1em" must fail
  expectTypeOf<RemLiteral<"1em">>().toBeNever()
  // EmLiteral matches `${N}em` — "1rem" would infer N="1r" which is not a
  // valid signed decimal, so it falls through to never
  expectTypeOf<EmLiteral<"1rem">>().toBeNever()
})
