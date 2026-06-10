import { expectTypeOf, test } from "vitest"
import type {
  IsLatitude,
  IsLongitude,
  Position,
} from "@/components/ui/coordinate-input"
import { coordinate } from "@/components/ui/coordinate-input"

test("IsLongitude bounds magnitude at 180, sign-aware", () => {
  expectTypeOf<IsLongitude<"0">>().toEqualTypeOf<true>()
  expectTypeOf<IsLongitude<"180">>().toEqualTypeOf<true>()
  expectTypeOf<IsLongitude<"-180">>().toEqualTypeOf<true>()
  expectTypeOf<IsLongitude<"122.42">>().toEqualTypeOf<true>()
  expectTypeOf<IsLongitude<"180.0">>().toEqualTypeOf<true>()
  expectTypeOf<IsLongitude<"180.1">>().toEqualTypeOf<false>()
  expectTypeOf<IsLongitude<"200">>().toEqualTypeOf<false>()
  expectTypeOf<IsLongitude<"-181">>().toEqualTypeOf<false>()
  expectTypeOf<IsLongitude<"abc">>().toEqualTypeOf<false>()
})

test("IsLatitude bounds magnitude at 90, sign-aware", () => {
  expectTypeOf<IsLatitude<"90">>().toEqualTypeOf<true>()
  expectTypeOf<IsLatitude<"-90">>().toEqualTypeOf<true>()
  expectTypeOf<IsLatitude<"37.77">>().toEqualTypeOf<true>()
  expectTypeOf<IsLatitude<"91">>().toEqualTypeOf<false>()
  expectTypeOf<IsLatitude<"90.1">>().toEqualTypeOf<false>()
})

test("Position is a 2- or 3-number tuple", () => {
  expectTypeOf<[1, 2]>().toMatchTypeOf<Position>()
  expectTypeOf<[1, 2, 3]>().toMatchTypeOf<Position>()
})

test("coordinate() validates numeric-literal tuples", () => {
  expectTypeOf(coordinate([-122.42, 37.77])).toEqualTypeOf<
    readonly [-122.42, 37.77]
  >()
  expectTypeOf(coordinate([0, 0, 12])).toEqualTypeOf<readonly [0, 0, 12]>()
})

test("coordinate() rejects out-of-range / wrong-arity literals", () => {
  // @ts-expect-error — longitude 200 > 180
  coordinate([200, 0])
  // @ts-expect-error — latitude 91 > 90
  coordinate([0, 91])
  // @ts-expect-error — arity 1
  coordinate([0])
  // @ts-expect-error — arity 4
  coordinate([0, 0, 0, 0])
})
