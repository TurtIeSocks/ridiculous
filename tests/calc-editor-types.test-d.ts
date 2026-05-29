import { expectTypeOf, test } from "vitest"
import type { CalcEditor } from "@/components/ui/calc-editor"
import type {
  ArgCountOf,
  CalcFn,
  CalcFunctionName,
  CalcLiteral,
  CalcNode,
  CalcString,
  CalcStringMap,
  DimensionOfCalc,
  FunctionOf,
} from "@/components/ui/calc-editor/calc-editor.types"
import { cssCalc } from "@/components/ui/calc-editor/calc-editor.types"

// ---------------------------------------------------------------------------
// Strict tier — acceptance AND rejection (the primary correctness gate)
// ---------------------------------------------------------------------------

test("calc add/sub same dimension resolves to the literal", () => {
  expectTypeOf<
    CalcLiteral<"calc(10px + 2rem)">
  >().toEqualTypeOf<"calc(10px + 2rem)">()
  expectTypeOf<
    CalcLiteral<"calc(50% + 10%)">
  >().toEqualTypeOf<"calc(50% + 10%)">()
})

test("calc + with mismatched dimensions is never", () => {
  // % is its own dimension — not length
  expectTypeOf<CalcLiteral<"calc(100% - 10px)">>().toBeNever()
  expectTypeOf<CalcLiteral<"calc(10px + 45deg)">>().toBeNever()
})

test("calc * requires a number operand", () => {
  expectTypeOf<
    CalcLiteral<"calc(10px * 3)">
  >().toEqualTypeOf<"calc(10px * 3)">()
  expectTypeOf<
    CalcLiteral<"calc(2 * 10px)">
  >().toEqualTypeOf<"calc(2 * 10px)">()
  expectTypeOf<CalcLiteral<"calc(10px * 2px)">>().toBeNever()
})

test("calc / requires a number divisor", () => {
  expectTypeOf<
    CalcLiteral<"calc(10px / 2)">
  >().toEqualTypeOf<"calc(10px / 2)">()
  expectTypeOf<CalcLiteral<"calc(10px / 2px)">>().toBeNever()
  expectTypeOf<CalcLiteral<"calc(2 / 10px)">>().toBeNever()
})

test("nested parens, dimension-correct regardless of precedence", () => {
  expectTypeOf<
    CalcLiteral<"calc((10px + 2px) * 3)">
  >().toEqualTypeOf<"calc((10px + 2px) * 3)">()
  expectTypeOf<
    CalcLiteral<"calc(10px + 2 * 5px)">
  >().toEqualTypeOf<"calc(10px + 2 * 5px)">()
})

test("clamp requires exactly 3 same-dimension args", () => {
  expectTypeOf<
    CalcLiteral<"clamp(1rem, 2vw, 3rem)">
  >().toEqualTypeOf<"clamp(1rem, 2vw, 3rem)">()
  expectTypeOf<CalcLiteral<"clamp(1rem, 2vw)">>().toBeNever()
  expectTypeOf<CalcLiteral<"clamp(1rem, 2vw, 3deg)">>().toBeNever()
})

test("min/max require >=1 same-dimension args", () => {
  expectTypeOf<
    CalcLiteral<"min(10px, 2rem, 5vw)">
  >().toEqualTypeOf<"min(10px, 2rem, 5vw)">()
  expectTypeOf<CalcLiteral<"max(50%)">>().toEqualTypeOf<"max(50%)">()
  expectTypeOf<CalcLiteral<"min(10px, 45deg)">>().toBeNever()
})

test("nested functions propagate dimensions", () => {
  expectTypeOf<
    CalcLiteral<"calc(min(10px, 2rem) + 1rem)">
  >().toEqualTypeOf<"calc(min(10px, 2rem) + 1rem)">()
  expectTypeOf<
    CalcLiteral<"clamp(1rem, calc(1rem + 2vw), 3rem)">
  >().toEqualTypeOf<"clamp(1rem, calc(1rem + 2vw), 3rem)">()
})

test("var() is rejected by the strict tier (L6)", () => {
  expectTypeOf<CalcLiteral<"calc(100% - var(--gap))">>().toBeNever()
})

test("cssCalc validates at call site", () => {
  const a = cssCalc("calc(10px + 2rem)")
  expectTypeOf(a).toEqualTypeOf<"calc(10px + 2rem)">()

  // @ts-expect-error length + angle
  cssCalc("calc(10px + 45deg)")
  // @ts-expect-error length * length
  cssCalc("calc(10px * 2px)")
  // @ts-expect-error clamp arity
  cssCalc("clamp(1rem, 2vw)")
  // @ts-expect-error not a calc-family function
  cssCalc("rgb(1, 2, 3)")
})

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

test("FunctionOf resolves the outer function family", () => {
  expectTypeOf<FunctionOf<"clamp(1rem, 2vw, 3rem)">>().toEqualTypeOf<"clamp">()
  expectTypeOf<FunctionOf<"calc(1px)">>().toEqualTypeOf<"calc">()
  expectTypeOf<FunctionOf<"min(1px, 2px)">>().toEqualTypeOf<"min">()
  expectTypeOf<FunctionOf<"max(1px)">>().toEqualTypeOf<"max">()
  expectTypeOf<FunctionOf<"rgb(1, 2, 3)">>().toBeNever()
})

test("DimensionOfCalc reports the resolved dimension", () => {
  expectTypeOf<DimensionOfCalc<"calc(10px + 2rem)">>().toEqualTypeOf<"length">()
  expectTypeOf<DimensionOfCalc<"calc(50% + 10%)">>().toEqualTypeOf<"percent">()
  expectTypeOf<DimensionOfCalc<"clamp(1s, 2s, 3s)">>().toEqualTypeOf<"time">()
  expectTypeOf<DimensionOfCalc<"calc(10px + 45deg)">>().toBeNever()
})

test("ArgCountOf counts top-level comma args of the outer function", () => {
  expectTypeOf<ArgCountOf<"clamp(1rem, 2vw, 3rem)">>().toEqualTypeOf<3>()
  expectTypeOf<ArgCountOf<"min(1px, 2px)">>().toEqualTypeOf<2>()
  expectTypeOf<ArgCountOf<"calc(1px + 2px)">>().toEqualTypeOf<1>()
})

// ---------------------------------------------------------------------------
// Suggestion strings + map
// ---------------------------------------------------------------------------

test("CalcString suggestion union + map + keys", () => {
  expectTypeOf<"calc(1px + 1px)">().toMatchTypeOf<CalcString>()
  expectTypeOf<"clamp(1rem, 2vw, 3rem)">().toMatchTypeOf<CalcString>()
  expectTypeOf<CalcStringMap["clamp"]>().toEqualTypeOf<`clamp(${string})`>()
  expectTypeOf<CalcStringMap["calc"]>().toEqualTypeOf<`calc(${string})`>()
  expectTypeOf<CalcFn>().toEqualTypeOf<"calc" | "clamp" | "min" | "max">()
  expectTypeOf<CalcFunctionName>().toEqualTypeOf<
    "calc" | "clamp" | "min" | "max"
  >()
})

// ---------------------------------------------------------------------------
// Internal state — discriminated union
// ---------------------------------------------------------------------------

test("CalcNode discriminates by kind", () => {
  const n: CalcNode = {
    kind: "binary",
    op: "+",
    left: { kind: "literal", value: "10px", dimension: "length" },
    right: { kind: "literal", value: "2rem", dimension: "length" },
  }
  const fn: CalcNode = {
    kind: "fn",
    name: "clamp",
    args: [
      { kind: "literal", value: "1rem", dimension: "length" },
      { kind: "var", name: "--x", raw: "var(--x)" },
      {
        kind: "group",
        inner: { kind: "literal", value: "3rem", dimension: "length" },
      },
    ],
  }
  expectTypeOf(n).toMatchTypeOf<CalcNode>()
  expectTypeOf(fn).toMatchTypeOf<CalcNode>()
})

// ---------------------------------------------------------------------------
// Component onChange narrowing via fn?
// ---------------------------------------------------------------------------

test("CalcEditor fn='clamp' narrows onChange", () => {
  type P = Parameters<typeof CalcEditor<"clamp">>[0]
  expectTypeOf<P["onChange"]>().parameter(0).toEqualTypeOf<`clamp(${string})`>()
})

test("CalcEditor fn='min' narrows onChange", () => {
  type P = Parameters<typeof CalcEditor<"min">>[0]
  expectTypeOf<P["onChange"]>().parameter(0).toEqualTypeOf<`min(${string})`>()
})

test("CalcEditor without fn keeps the CalcString union", () => {
  type P = Parameters<typeof CalcEditor>[0]
  expectTypeOf<P["onChange"]>().parameter(0).toEqualTypeOf<CalcString>()
})

// ---------------------------------------------------------------------------
// Depth cap (L2) — weak-accept beyond 8 nested levels, never crash to `never`
// ---------------------------------------------------------------------------

test("deep nesting within budget still validates", () => {
  expectTypeOf<
    CalcLiteral<"calc(((((1px + 2px))))) ">
  >().toEqualTypeOf<"calc(((((1px + 2px))))) ">()
})

test("depth beyond the cap weak-accepts (not never)", () => {
  // 9+ levels of nested parens — should NOT collapse to never
  expectTypeOf<CalcLiteral<"calc((((((((((1px)))))))))) ">>().not.toBeNever()
})
