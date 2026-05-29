import { expectTypeOf, test } from "vitest"
import type { TransformBuilder } from "@/components/ui/transform-builder"
import type {
  FunctionCountOf,
  FunctionsOf,
  TransformFn,
  TransformFunctionName,
  TransformItem,
  TransformLiteral,
  TransformString,
  TransformStringMap,
} from "@/components/ui/transform-builder/transform-builder.types"
import { cssTransform } from "@/components/ui/transform-builder/transform-builder.types"

// ---------------------------------------------------------------------------
// Strict tier — translate family
// ---------------------------------------------------------------------------

test("translateX/Y accept length-percentage, reject angle and arity-0", () => {
  expectTypeOf<
    TransformLiteral<"translateX(10px)">
  >().toEqualTypeOf<"translateX(10px)">()
  expectTypeOf<
    TransformLiteral<"translateY(2rem)">
  >().toEqualTypeOf<"translateY(2rem)">()
  expectTypeOf<
    TransformLiteral<"translateX(50%)">
  >().toEqualTypeOf<"translateX(50%)">()
  expectTypeOf<TransformLiteral<"translateX(45deg)">>().toBeNever()
  expectTypeOf<TransformLiteral<"translateX()">>().toBeNever()
})

test("translate accepts 1-2 length-percentage args", () => {
  expectTypeOf<
    TransformLiteral<"translate(10px)">
  >().toEqualTypeOf<"translate(10px)">()
  expectTypeOf<
    TransformLiteral<"translate(10px, 20%)">
  >().toEqualTypeOf<"translate(10px, 20%)">()
  expectTypeOf<TransformLiteral<"translate(10px, 20%, 30px)">>().toBeNever()
  expectTypeOf<TransformLiteral<"translate(10px, 45deg)">>().toBeNever()
})

test("translateZ and perspective are length-only", () => {
  expectTypeOf<
    TransformLiteral<"translateZ(10px)">
  >().toEqualTypeOf<"translateZ(10px)">()
  expectTypeOf<
    TransformLiteral<"perspective(800px)">
  >().toEqualTypeOf<"perspective(800px)">()
  expectTypeOf<TransformLiteral<"translateZ(50%)">>().toBeNever()
  expectTypeOf<TransformLiteral<"perspective(45deg)">>().toBeNever()
})

test("translate3d: x,y length-%, z length-only", () => {
  expectTypeOf<
    TransformLiteral<"translate3d(1px, 2%, 3px)">
  >().toEqualTypeOf<"translate3d(1px, 2%, 3px)">()
  expectTypeOf<TransformLiteral<"translate3d(1px, 2px, 3%)">>().toBeNever()
  expectTypeOf<TransformLiteral<"translate3d(1px, 2px)">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — rotate family
// ---------------------------------------------------------------------------

test("rotate family accepts a single angle", () => {
  expectTypeOf<
    TransformLiteral<"rotate(45deg)">
  >().toEqualTypeOf<"rotate(45deg)">()
  expectTypeOf<
    TransformLiteral<"rotateX(1turn)">
  >().toEqualTypeOf<"rotateX(1turn)">()
  expectTypeOf<
    TransformLiteral<"rotateZ(0.5rad)">
  >().toEqualTypeOf<"rotateZ(0.5rad)">()
  expectTypeOf<TransformLiteral<"rotate(10px)">>().toBeNever()
})

test("rotate3d: 3 numbers + 1 angle", () => {
  expectTypeOf<
    TransformLiteral<"rotate3d(1, 1, 1, 45deg)">
  >().toEqualTypeOf<"rotate3d(1, 1, 1, 45deg)">()
  expectTypeOf<TransformLiteral<"rotate3d(1, 1, 1, 1)">>().toBeNever()
  expectTypeOf<TransformLiteral<"rotate3d(1, 1, 45deg)">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — scale family
// ---------------------------------------------------------------------------

test("scale family accepts number or percentage", () => {
  expectTypeOf<TransformLiteral<"scale(1.5)">>().toEqualTypeOf<"scale(1.5)">()
  expectTypeOf<TransformLiteral<"scale(50%)">>().toEqualTypeOf<"scale(50%)">()
  expectTypeOf<TransformLiteral<"scale(1, 2)">>().toEqualTypeOf<"scale(1, 2)">()
  expectTypeOf<TransformLiteral<"scaleX(2)">>().toEqualTypeOf<"scaleX(2)">()
  expectTypeOf<
    TransformLiteral<"scale3d(1, 2, 3)">
  >().toEqualTypeOf<"scale3d(1, 2, 3)">()
  expectTypeOf<TransformLiteral<"scale(45deg)">>().toBeNever()
  expectTypeOf<TransformLiteral<"scaleX(10px)">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — skew family
// ---------------------------------------------------------------------------

test("skew family accepts angles", () => {
  expectTypeOf<TransformLiteral<"skew(10deg)">>().toEqualTypeOf<"skew(10deg)">()
  expectTypeOf<
    TransformLiteral<"skew(10deg, 20deg)">
  >().toEqualTypeOf<"skew(10deg, 20deg)">()
  expectTypeOf<
    TransformLiteral<"skewX(10deg)">
  >().toEqualTypeOf<"skewX(10deg)">()
  expectTypeOf<TransformLiteral<"skew(1px)">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — matrix family
// ---------------------------------------------------------------------------

test("matrix wants exactly 6 numbers", () => {
  expectTypeOf<
    TransformLiteral<"matrix(1, 0, 0, 1, 0, 0)">
  >().toEqualTypeOf<"matrix(1, 0, 0, 1, 0, 0)">()
  expectTypeOf<TransformLiteral<"matrix(1, 0, 0, 1, 0)">>().toBeNever()
  expectTypeOf<TransformLiteral<"matrix(1, 0, 0, 1, 0, 0px)">>().toBeNever()
})

test("matrix3d wants exactly 16 numbers", () => {
  expectTypeOf<
    TransformLiteral<"matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)">
  >().toEqualTypeOf<"matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)">()
  // 15 args — arity violation
  expectTypeOf<
    TransformLiteral<"matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0)">
  >().toBeNever()
})

// ---------------------------------------------------------------------------
// Strict tier — multi-function list + none + garbage
// ---------------------------------------------------------------------------

test("a valid space-separated list keeps the literal", () => {
  expectTypeOf<
    TransformLiteral<"translateX(10px) rotate(45deg) scale(1.5)">
  >().toEqualTypeOf<"translateX(10px) rotate(45deg) scale(1.5)">()
})

test("a list with any invalid function is never", () => {
  expectTypeOf<TransformLiteral<"translateX(10px) rotate(10px)">>().toBeNever()
})

test("none is valid; garbage and empty are never", () => {
  expectTypeOf<TransformLiteral<"none">>().toEqualTypeOf<"none">()
  expectTypeOf<TransformLiteral<"">>().toBeNever()
  expectTypeOf<TransformLiteral<"wobble(3)">>().toBeNever()
  expectTypeOf<TransformLiteral<"rotate">>().toBeNever()
})

// ---------------------------------------------------------------------------
// Call-site helper
// ---------------------------------------------------------------------------

test("cssTransform validates at the call site", () => {
  const a = cssTransform("translateX(10px) rotate(45deg) scale(1.5)")
  expectTypeOf(a).toEqualTypeOf<"translateX(10px) rotate(45deg) scale(1.5)">()

  // @ts-expect-error rotate wants an angle, not a length
  cssTransform("rotate(10px)")
  // @ts-expect-error translateX wants a length-%, not an angle
  cssTransform("translateX(45deg)")
  // @ts-expect-error matrix needs exactly 6 numbers
  cssTransform("matrix(1, 0, 0, 1, 0)")
  // @ts-expect-error unknown function
  cssTransform("wobble(3)")
  // @ts-expect-error calc() is undecidable at the strict tier
  cssTransform("translateX(calc(1px + 2px))")
})

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

test("FunctionsOf lists the function names in order", () => {
  expectTypeOf<FunctionsOf<"translateX(1px) rotate(45deg)">>().toEqualTypeOf<
    ["translateX", "rotate"]
  >()
  expectTypeOf<FunctionsOf<"scale(1.5)">>().toEqualTypeOf<["scale"]>()
  expectTypeOf<FunctionsOf<"none">>().toEqualTypeOf<[]>()
})

test("FunctionCountOf counts the functions", () => {
  expectTypeOf<
    FunctionCountOf<"translateX(1px) rotate(45deg) scale(1.5)">
  >().toEqualTypeOf<3>()
  expectTypeOf<FunctionCountOf<"rotate(45deg)">>().toEqualTypeOf<1>()
  expectTypeOf<FunctionCountOf<"none">>().toEqualTypeOf<0>()
})

// ---------------------------------------------------------------------------
// Suggestion strings + map
// ---------------------------------------------------------------------------

test("TransformString suggestion union + map + keys", () => {
  expectTypeOf<"translate(1px, 2px)">().toMatchTypeOf<TransformString>()
  expectTypeOf<"rotate(45deg)">().toMatchTypeOf<TransformString>()
  expectTypeOf<"none">().toMatchTypeOf<TransformString>()
  expectTypeOf<"translateX(10px) rotate(45deg)">().toMatchTypeOf<TransformString>()
  expectTypeOf<
    TransformStringMap["rotate"]
  >().toEqualTypeOf<`rotate(${string})`>()
  expectTypeOf<
    TransformStringMap["matrix"]
  >().toEqualTypeOf<`matrix(${string})`>()
})

test("TransformFn and TransformFunctionName cover the full set", () => {
  expectTypeOf<TransformFn>().toEqualTypeOf<TransformFunctionName>()
  expectTypeOf<"translate3d">().toMatchTypeOf<TransformFunctionName>()
  expectTypeOf<"matrix3d">().toMatchTypeOf<TransformFunctionName>()
  expectTypeOf<"perspective">().toMatchTypeOf<TransformFunctionName>()
})

// ---------------------------------------------------------------------------
// Internal state — discriminated union
// ---------------------------------------------------------------------------

test("TransformItem discriminates by fn", () => {
  const translate: TransformItem = { fn: "translate", x: "10px", y: "20%" }
  const rotate: TransformItem = { fn: "rotate", angle: "45deg" }
  const scale3d: TransformItem = { fn: "scale3d", x: "1", y: "2", z: "3" }
  const matrix: TransformItem = {
    fn: "matrix",
    values: ["1", "0", "0", "1", "0", "0"],
  }
  expectTypeOf(translate).toMatchTypeOf<TransformItem>()
  expectTypeOf(rotate).toMatchTypeOf<TransformItem>()
  expectTypeOf(scale3d).toMatchTypeOf<TransformItem>()
  expectTypeOf(matrix).toMatchTypeOf<TransformItem>()
})

// ---------------------------------------------------------------------------
// Component onChange — no fn narrowing (transform is a list)
// ---------------------------------------------------------------------------

test("TransformBuilder onChange returns the open TransformString", () => {
  type P = Parameters<typeof TransformBuilder>[0]
  expectTypeOf<P["onChange"]>().parameter(0).toEqualTypeOf<TransformString>()
})
