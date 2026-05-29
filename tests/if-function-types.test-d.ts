import { expectTypeOf, test } from "vitest"
import type { IfFunction } from "@/components/ui/if-function"
import type {
  BranchCountOf,
  BranchesOf,
  ConditionKind,
  ConditionKindsOf,
  ConditionString,
  IfBranch,
  IfFunctionState,
  IfFunctionString,
} from "@/components/ui/if-function/if-function.types"
import { cssIf } from "@/components/ui/if-function/if-function.types"

// ===========================================================================
// IfFunctionLiteral — accept (each condition kind)
// ===========================================================================

test("if: a media() branch keeps the literal", () => {
  expectTypeOf<typeof cssIf<"if(media(width >= 800px): red)">>().toBeFunction()
  const a = cssIf("if(media(width >= 800px): red)")
  expectTypeOf(a).toEqualTypeOf<"if(media(width >= 800px): red)">()
})

test("if: a supports() branch keeps the literal", () => {
  const a = cssIf("if(supports(display: grid): grid)")
  expectTypeOf(a).toEqualTypeOf<"if(supports(display: grid): grid)">()
})

test("if: a style() branch keeps the literal (colon inside style is not a split)", () => {
  const a = cssIf("if(style(--x: 1): 2px)")
  expectTypeOf(a).toEqualTypeOf<"if(style(--x: 1): 2px)">()
})

test("if: else as the LAST branch keeps the literal", () => {
  const a = cssIf("if(media(width >= 800px): red; else: blue)")
  expectTypeOf(a).toEqualTypeOf<"if(media(width >= 800px): red; else: blue)">()
})

test("if: a three-branch list with a trailing else keeps the literal", () => {
  const a = cssIf(
    "if(media(width >= 800px): red; supports(color: oklch(0 0 0)): green; else: blue)",
  )
  expectTypeOf(
    a,
  ).toEqualTypeOf<"if(media(width >= 800px): red; supports(color: oklch(0 0 0)): green; else: blue)">()
})

test("if: a value containing parens keeps the literal", () => {
  const a = cssIf("if(media(width >= 800px): rgb(1 2 3))")
  expectTypeOf(a).toEqualTypeOf<"if(media(width >= 800px): rgb(1 2 3))">()
})

test("if: a trailing semicolon is tolerated", () => {
  const a = cssIf("if(else: red;)")
  expectTypeOf(a).toEqualTypeOf<"if(else: red;)">()
})

// ===========================================================================
// IfFunctionLiteral — reject (→ never)
// ===========================================================================

test("if: an unknown condition kind is never", () => {
  // @ts-expect-error foo() is not media/supports/style
  cssIf("if(foo(x): 1)")
})

test("if: else not last is never", () => {
  // @ts-expect-error else may only be the final branch
  cssIf("if(else: a; media(width >= 1px): b)")
})

test("if: a branch with no colon is never", () => {
  // @ts-expect-error missing the condition:value colon
  cssIf("if(media(width >= 1px) red)")
})

test("if: an empty value is never", () => {
  // @ts-expect-error the value after the colon is empty
  cssIf("if(media(width >= 1px): )")
})

test("if: an unbalanced wrapper is never", () => {
  // @ts-expect-error the if() wrapper is not closed / unbalanced
  cssIf("if(media(width >= 1px: red")
})

test("if: a non-if function name is never", () => {
  // @ts-expect-error calc is not if
  cssIf("calc(1px + 2px)")
})

test("if: an empty body is never", () => {
  // @ts-expect-error if() needs at least one branch
  cssIf("if()")
})

test("if: an unbalanced condition body is never", () => {
  // @ts-expect-error the media() body parens do not balance
  cssIf("if(media(calc(1px): red)")
})

// ===========================================================================
// Call-site helper return type
// ===========================================================================

test("cssIf returns the input literal type", () => {
  const v = cssIf("if(supports(display: grid): grid; else: block)")
  expectTypeOf(
    v,
  ).toEqualTypeOf<"if(supports(display: grid): grid; else: block)">()
})

// ===========================================================================
// Utility types
// ===========================================================================

test("BranchesOf splits the raw per-branch strings", () => {
  expectTypeOf<
    BranchesOf<"if(media(width >= 1px): a; else: b)">
  >().toEqualTypeOf<["media(width >= 1px): a", "else: b"]>()
  expectTypeOf<BranchesOf<"if(style(--x: 1): 2px)">>().toEqualTypeOf<
    ["style(--x: 1): 2px"]
  >()
  expectTypeOf<BranchesOf<"not-an-if">>().toEqualTypeOf<[]>()
})

test("BranchCountOf counts the branches", () => {
  expectTypeOf<
    BranchCountOf<"if(media(a >= 1px): a; supports(b: c): b; else: d)">
  >().toEqualTypeOf<3>()
  expectTypeOf<BranchCountOf<"if(style(--x: 1): 2px)">>().toEqualTypeOf<1>()
  expectTypeOf<BranchCountOf<"nope">>().toEqualTypeOf<0>()
})

test("ConditionKindsOf maps each branch to its kind", () => {
  expectTypeOf<
    ConditionKindsOf<"if(media(a >= 1px): a; supports(b: c): b; else: d)">
  >().toEqualTypeOf<["media", "supports", "else"]>()
  expectTypeOf<ConditionKindsOf<"if(style(--x: 1): 2px)">>().toEqualTypeOf<
    ["style"]
  >()
})

// ===========================================================================
// Suggestion strings
// ===========================================================================

test("suggestion unions", () => {
  expectTypeOf<"if(media(x): a)">().toMatchTypeOf<IfFunctionString>()
  expectTypeOf<"media(width >= 1px)">().toMatchTypeOf<ConditionString>()
  expectTypeOf<"supports(display: grid)">().toMatchTypeOf<ConditionString>()
  expectTypeOf<"style(--x: 1)">().toMatchTypeOf<ConditionString>()
  expectTypeOf<"else">().toMatchTypeOf<ConditionString>()
  expectTypeOf<ConditionKind>().toEqualTypeOf<
    "media" | "supports" | "style" | "else"
  >()
})

// ===========================================================================
// Internal state
// ===========================================================================

test("IfBranch / IfFunctionState records", () => {
  const b: IfBranch = {
    kind: "media",
    condition: "width >= 800px",
    value: "red",
  }
  const e: IfBranch = { kind: "else", condition: "", value: "blue" }
  const s: IfFunctionState = { branches: [b, e] }
  expectTypeOf(b).toMatchTypeOf<IfBranch>()
  expectTypeOf(e).toMatchTypeOf<IfBranch>()
  expectTypeOf(s).toMatchTypeOf<IfFunctionState>()
  expectTypeOf<IfBranch["kind"]>().toEqualTypeOf<ConditionKind>()
})

// ===========================================================================
// Component onChange — returns the open suggestion union
// ===========================================================================

test("IfFunction onChange returns a string union", () => {
  type P = Parameters<typeof IfFunction>[0]
  expectTypeOf<P["onChange"]>().toMatchTypeOf<
    (value: IfFunctionString) => void
  >()
})
