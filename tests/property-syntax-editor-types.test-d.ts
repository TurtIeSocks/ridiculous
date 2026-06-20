import { describe, expectTypeOf, it } from "vitest"
import {
  type ComponentsOf,
  cssProperty,
  cssSyntax,
  type DataTypeName,
  type InitialValueLiteral,
  type SyntaxLiteral,
} from "@/components/ui/property-syntax-editor"

// ---------------------------------------------------------------------------
// SyntaxLiteral — the <syntax> meta-grammar
// ---------------------------------------------------------------------------

describe("SyntaxLiteral", () => {
  it("accepts well-formed syntax descriptors", () => {
    expectTypeOf<SyntaxLiteral<"<length>">>().toEqualTypeOf<"<length>">()
    expectTypeOf<SyntaxLiteral<"<length>+">>().toEqualTypeOf<"<length>+">()
    expectTypeOf<SyntaxLiteral<"<color>#">>().toEqualTypeOf<"<color>#">()
    expectTypeOf<
      SyntaxLiteral<"<length> | auto">
    >().toEqualTypeOf<"<length> | auto">()
    expectTypeOf<SyntaxLiteral<"*">>().toEqualTypeOf<"*">()
  })

  it("rejects malformed descriptors", () => {
    expectTypeOf<SyntaxLiteral<"<length>++">>().toBeNever()
    expectTypeOf<SyntaxLiteral<"<bogus>">>().toBeNever()
    expectTypeOf<SyntaxLiteral<"<length> |">>().toBeNever()
    expectTypeOf<SyntaxLiteral<"">>().toBeNever()
  })

  it("cssSyntax gates at the call site", () => {
    expectTypeOf(cssSyntax("<length>+")).toEqualTypeOf<"<length>+">()
    // @ts-expect-error double multiplier
    cssSyntax("<length>++")
    // @ts-expect-error unknown data type
    cssSyntax("<bogus>")
  })
})

// ---------------------------------------------------------------------------
// InitialValueLiteral / cssProperty — one string typing another
// ---------------------------------------------------------------------------

describe("InitialValueLiteral (dependent)", () => {
  it("accepts initial values that satisfy the syntax", () => {
    expectTypeOf<
      InitialValueLiteral<"<length>", "0px">
    >().toEqualTypeOf<"0px">()
    expectTypeOf<
      InitialValueLiteral<"<length>+", "0px 4px 8px">
    >().toEqualTypeOf<"0px 4px 8px">()
    expectTypeOf<
      InitialValueLiteral<"<color>", "#ff0000">
    >().toEqualTypeOf<"#ff0000">()
    expectTypeOf<
      InitialValueLiteral<"<length> | auto", "auto">
    >().toEqualTypeOf<"auto">()
    expectTypeOf<
      InitialValueLiteral<"*", "anything">
    >().toEqualTypeOf<"anything">()
  })

  it("rejects initial values that violate the syntax", () => {
    expectTypeOf<InitialValueLiteral<"<length>", "red">>().toBeNever()
    expectTypeOf<InitialValueLiteral<"<length>+", "0px red">>().toBeNever()
    expectTypeOf<InitialValueLiteral<"<color>", "notacolor">>().toBeNever()
    expectTypeOf<InitialValueLiteral<"<length> | auto", "none">>().toBeNever()
  })

  it("cssProperty type-checks syntax AND initial-value together", () => {
    const p = cssProperty("<length>", "0px")
    expectTypeOf(p).toEqualTypeOf<{ syntax: "<length>"; initialValue: "0px" }>()
    cssProperty("<length>+", "0px 4px 8px")
    cssProperty("<color>", "#ff0000")
    cssProperty("<length> | auto", "auto")
    // @ts-expect-error "red" is not a <length>
    cssProperty("<length>", "red")
    // @ts-expect-error second token is not a <length>
    cssProperty("<length>+", "0px red")
    // @ts-expect-error not a color
    cssProperty("<color>", "notacolor")
  })
})

// ---------------------------------------------------------------------------
// surface
// ---------------------------------------------------------------------------

describe("type surface", () => {
  it("DataTypeName includes the core types", () => {
    expectTypeOf<"length">().toMatchTypeOf<DataTypeName>()
    expectTypeOf<"color">().toMatchTypeOf<DataTypeName>()
  })

  it("ComponentsOf splits on the pipe", () => {
    expectTypeOf<ComponentsOf<"<length> | auto">>().toEqualTypeOf<
      ["<length>", "auto"]
    >()
  })
})
