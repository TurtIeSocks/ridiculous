import { expectTypeOf, test } from "vitest"
import type {
  EndsWith,
  ParseFunction,
  SplitByComma,
  SplitBySpace,
  StartsWith,
} from "@/lib/ridiculous-type-kit"

test("StartsWith / EndsWith", () => {
  expectTypeOf<StartsWith<"calc(1px)", "calc(">>().toEqualTypeOf<true>()
  expectTypeOf<StartsWith<"min(1px)", "calc(">>().toEqualTypeOf<false>()
  expectTypeOf<EndsWith<"10px", "px">>().toEqualTypeOf<true>()
  expectTypeOf<EndsWith<"10em", "px">>().toEqualTypeOf<false>()
})

test("SplitByComma respects nested parens", () => {
  expectTypeOf<SplitByComma<"a, b(c, d), e">>().toEqualTypeOf<
    ["a", "b(c, d)", "e"]
  >()
  expectTypeOf<SplitByComma<"red 40%, blue">>().toEqualTypeOf<
    ["red 40%", "blue"]
  >()
})

test("SplitBySpace respects nested parens and collapses whitespace", () => {
  expectTypeOf<SplitBySpace<"translateX(1px) rotate(45deg)">>().toEqualTypeOf<
    ["translateX(1px)", "rotate(45deg)"]
  >()
  expectTypeOf<SplitBySpace<"rgb(255 0 0)">>().toEqualTypeOf<["rgb(255 0 0)"]>()
})

test("ParseFunction extracts name + args of the outer call", () => {
  expectTypeOf<ParseFunction<"minmax(0, 1fr)">>().toEqualTypeOf<{
    name: "minmax"
    args: "0, 1fr"
  }>()
  expectTypeOf<ParseFunction<"calc((1 + 2) * 3)">>().toEqualTypeOf<{
    name: "calc"
    args: "(1 + 2) * 3"
  }>()
  expectTypeOf<ParseFunction<"scale()">>().toEqualTypeOf<{
    name: "scale"
    args: ""
  }>()
  expectTypeOf<ParseFunction<"not-a-call">>().toBeNever()
})
