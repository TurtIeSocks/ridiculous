import { describe, expectTypeOf, it } from "vitest"
import {
  type CommandCountOf,
  cssShape,
  type ShapeLiteral,
} from "@/components/ui/shape-path-editor"

describe("ShapeLiteral", () => {
  it("accepts well-formed shape() values", () => {
    expectTypeOf<
      ShapeLiteral<"shape(from 0px 0px, line to 100px 0px, close)">
    >().toEqualTypeOf<"shape(from 0px 0px, line to 100px 0px, close)">()
    expectTypeOf<
      ShapeLiteral<"shape(from 0% 0%, curve to 100px 100px with 50px 0px, close)">
    >().toEqualTypeOf<"shape(from 0% 0%, curve to 100px 100px with 50px 0px, close)">()
    expectTypeOf<
      ShapeLiteral<"shape(evenodd from 0px 0px, hline by 50px, vline by 50px, close)">
    >().toEqualTypeOf<"shape(evenodd from 0px 0px, hline by 50px, vline by 50px, close)">()
    expectTypeOf<
      ShapeLiteral<"shape(from 10px 10px, smooth to 90px 90px, close)">
    >().toEqualTypeOf<"shape(from 10px 10px, smooth to 90px 90px, close)">()
    expectTypeOf<
      ShapeLiteral<"shape(from 0px 0px, arc to 100px 0px of 50px, close)">
    >().toEqualTypeOf<"shape(from 0px 0px, arc to 100px 0px of 50px, close)">()
  })

  it("rejects malformed shape() values", () => {
    // unknown command
    expectTypeOf<
      ShapeLiteral<"shape(from 0px 0px, wiggle to 10px 10px)">
    >().toBeNever()
    // line needs a coordinate PAIR
    expectTypeOf<
      ShapeLiteral<"shape(from 0px 0px, line to 100px)">
    >().toBeNever()
    // curve needs a `with` control point
    expectTypeOf<
      ShapeLiteral<"shape(from 0px 0px, curve to 10px 10px)">
    >().toBeNever()
    // not shape()
    expectTypeOf<ShapeLiteral<"rotate(90deg)">>().toBeNever()
    // bare 0 has no unit
    expectTypeOf<ShapeLiteral<"shape(from 0 0, close)">>().toBeNever()
  })

  it("cssShape gates at the call site", () => {
    expectTypeOf(
      cssShape("shape(from 0px 0px, line to 100px 0px, close)"),
    ).toEqualTypeOf<"shape(from 0px 0px, line to 100px 0px, close)">()
    // @ts-expect-error unknown command
    cssShape("shape(from 0px 0px, wiggle to 10px 10px)")
    // @ts-expect-error line needs a coordinate pair
    cssShape("shape(from 0px 0px, line to 100px)")
    // @ts-expect-error curve needs a with control point
    cssShape("shape(from 0px 0px, curve to 10px 10px)")
  })

  it("CommandCountOf counts the commands", () => {
    expectTypeOf<
      CommandCountOf<"shape(from 0px 0px, line to 100px 0px, close)">
    >().toEqualTypeOf<2>()
  })
})
