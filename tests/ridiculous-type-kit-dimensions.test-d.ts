import { expectTypeOf, test } from "vitest"
import type {
  Dimension,
  DimensionOf,
  IsAngle,
  IsFlex,
  IsLength,
  IsPercentage,
  IsResolution,
  IsTime,
} from "@/lib/ridiculous-type-kit"

test("IsLength accepts length units, rejects others", () => {
  expectTypeOf<IsLength<"10px">>().toEqualTypeOf<true>()
  expectTypeOf<IsLength<"1.5rem">>().toEqualTypeOf<true>()
  expectTypeOf<IsLength<"100dvh">>().toEqualTypeOf<true>()
  expectTypeOf<IsLength<"-2em">>().toEqualTypeOf<true>()
  expectTypeOf<IsLength<"50cqmin">>().toEqualTypeOf<true>()
  expectTypeOf<IsLength<"45deg">>().toEqualTypeOf<false>()
  expectTypeOf<IsLength<"10">>().toEqualTypeOf<false>()
})

test("IsAngle / IsTime / IsResolution / IsFlex / IsPercentage", () => {
  expectTypeOf<IsAngle<"45deg">>().toEqualTypeOf<true>()
  expectTypeOf<IsAngle<"0.25turn">>().toEqualTypeOf<true>()
  expectTypeOf<IsAngle<"100grad">>().toEqualTypeOf<true>()
  expectTypeOf<IsTime<"200ms">>().toEqualTypeOf<true>()
  expectTypeOf<IsTime<"1.5s">>().toEqualTypeOf<true>()
  expectTypeOf<IsResolution<"2dppx">>().toEqualTypeOf<true>()
  expectTypeOf<IsResolution<"96dpi">>().toEqualTypeOf<true>()
  expectTypeOf<IsFlex<"1fr">>().toEqualTypeOf<true>()
  expectTypeOf<IsFlex<"-1fr">>().toEqualTypeOf<false>()
  expectTypeOf<IsPercentage<"50%">>().toEqualTypeOf<true>()
})

test("DimensionOf classifies a value literal", () => {
  expectTypeOf<DimensionOf<"10px">>().toEqualTypeOf<"length">()
  expectTypeOf<DimensionOf<"45deg">>().toEqualTypeOf<"angle">()
  expectTypeOf<DimensionOf<"200ms">>().toEqualTypeOf<"time">()
  expectTypeOf<DimensionOf<"2dppx">>().toEqualTypeOf<"resolution">()
  expectTypeOf<DimensionOf<"1fr">>().toEqualTypeOf<"flex">()
  expectTypeOf<DimensionOf<"50%">>().toEqualTypeOf<"percent">()
  expectTypeOf<DimensionOf<"3">>().toEqualTypeOf<"number">()
  expectTypeOf<DimensionOf<"  12.5px  ">>().toEqualTypeOf<"length">()
  expectTypeOf<DimensionOf<"nonsense">>().toBeNever()
})

test("Dimension is the tag union", () => {
  expectTypeOf<Dimension>().toEqualTypeOf<
    "length" | "angle" | "time" | "percent" | "number" | "flex" | "resolution"
  >()
})
