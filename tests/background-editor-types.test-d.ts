import { describe, expectTypeOf, it } from "vitest"
import {
  type BackgroundLiteral,
  cssBackground,
  type LayerCountOf,
} from "@/components/ui/background-editor"

describe("BackgroundLiteral", () => {
  it("accepts well-formed layer stacks", () => {
    expectTypeOf<
      BackgroundLiteral<"linear-gradient(#f00, #00f) center / cover no-repeat, #fff">
    >().toEqualTypeOf<"linear-gradient(#f00, #00f) center / cover no-repeat, #fff">()
    expectTypeOf<
      BackgroundLiteral<"url(x.png) left top / 50% repeat-x">
    >().toEqualTypeOf<"url(x.png) left top / 50% repeat-x">()
    expectTypeOf<
      BackgroundLiteral<"none, radial-gradient(#000, #fff) center">
    >().toEqualTypeOf<"none, radial-gradient(#000, #fff) center">()
    expectTypeOf<BackgroundLiteral<"#fff">>().toEqualTypeOf<"#fff">()
  })

  it("rejects a color in a non-final layer (the invariant)", () => {
    expectTypeOf<BackgroundLiteral<"#f00 center, url(x.png)">>().toBeNever()
  })

  it("rejects unknown tokens", () => {
    expectTypeOf<BackgroundLiteral<"center / wibble">>().toBeNever()
    expectTypeOf<BackgroundLiteral<"url(x.png) bogus-keyword">>().toBeNever()
    expectTypeOf<BackgroundLiteral<"">>().toBeNever()
  })

  it("cssBackground gates at the call site", () => {
    expectTypeOf(
      cssBackground("url(x.png) center / cover no-repeat, #fff"),
    ).toEqualTypeOf<"url(x.png) center / cover no-repeat, #fff">()
    // @ts-expect-error color in a non-final layer
    cssBackground("#f00 center, url(x.png)")
    // @ts-expect-error unknown token
    cssBackground("url(x.png) bogus-keyword")
  })

  it("LayerCountOf counts comma-split layers", () => {
    expectTypeOf<
      LayerCountOf<"url(a.png), url(b.png), #fff">
    >().toEqualTypeOf<3>()
  })
})
