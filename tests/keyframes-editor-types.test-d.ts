import { describe, expectTypeOf, it } from "vitest"
import {
  cssKeyframes,
  type KeyframesLiteral,
  type StopsOf,
} from "@/components/ui/keyframes-editor"

describe("KeyframesLiteral", () => {
  it("accepts well-formed bodies", () => {
    expectTypeOf<
      KeyframesLiteral<"from { opacity: 0 } to { opacity: 1 }">
    >().toEqualTypeOf<"from { opacity: 0 } to { opacity: 1 }">()
    expectTypeOf<
      KeyframesLiteral<"from { transform: translateX(0px) } to { transform: translateX(100px) }">
    >().toEqualTypeOf<"from { transform: translateX(0px) } to { transform: translateX(100px) }">()
    expectTypeOf<
      KeyframesLiteral<"0% { color: #f00 } 100% { color: #00f }">
    >().toEqualTypeOf<"0% { color: #f00 } 100% { color: #00f }">()
  })

  it("rejects malformed bodies", () => {
    // selector out of 0-100
    expectTypeOf<KeyframesLiteral<"150% { opacity: 1 }">>().toBeNever()
    // transform value is not a transform list
    expectTypeOf<KeyframesLiteral<"from { transform: 5 }">>().toBeNever()
    // opacity not 0-1
    expectTypeOf<KeyframesLiteral<"from { opacity: 2 }">>().toBeNever()
    // not a color
    expectTypeOf<KeyframesLiteral<"from { color: notacolor }">>().toBeNever()
    // no blocks
    expectTypeOf<KeyframesLiteral<"from to">>().toBeNever()
  })

  it("accepts unknown properties leniently", () => {
    expectTypeOf<
      KeyframesLiteral<"from { will-change: anything-goes }">
    >().toEqualTypeOf<"from { will-change: anything-goes }">()
  })

  it("cssKeyframes gates at the call site", () => {
    expectTypeOf(
      cssKeyframes("from { opacity: 0 } to { opacity: 1 }"),
    ).toEqualTypeOf<"from { opacity: 0 } to { opacity: 1 }">()
    // @ts-expect-error selector out of range
    cssKeyframes("150% { opacity: 1 }")
    // @ts-expect-error opacity not 0-1
    cssKeyframes("from { opacity: 2 }")
  })

  it("StopsOf counts blocks", () => {
    expectTypeOf<
      StopsOf<"from { opacity: 0 } 50% { opacity: 0.5 } to { opacity: 1 }">
    >().toEqualTypeOf<3>()
  })
})
