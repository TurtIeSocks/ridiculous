// =====================================================================
// calc-editor.types.ts
//
// The "ridiculous" tier: compile-time DIMENSIONAL ANALYSIS of a CSS math
// expression. Built entirely on `ridiculous-type-kit`. The strict
// validator `CalcLiteral<S>` resolves to `S` when the expression is
// dimensionally valid (length ± length ✓, length ± angle ✗,
// length × length ✗, ÷ by non-number ✗) and to `never` otherwise.
//
// Structure mirrors easing-picker.types.ts:
//   kit imports → evaluator → CalcLiteral + cssCalc → suggestion strings
//   → utility types → internal discriminated-union state.
// =====================================================================

import type {
  Dimension,
  DimensionOf,
  SplitByComma,
  SplitBySpace,
  Trim,
} from "@/lib/ridiculous-type-kit"

// =====================================================================
// 1. DIMENSIONAL EVALUATOR (the engine)
// =====================================================================

/** Combine two dimensions under one binary operator → Dimension | never. */
type CombineDim<
  A extends Dimension,
  Op extends string,
  B extends Dimension,
> = Op extends "+" | "-"
  ? A extends B
    ? A
    : never
  : Op extends "*"
    ? A extends "number"
      ? B
      : B extends "number"
        ? A
        : never
    : Op extends "/"
      ? B extends "number"
        ? A
        : never
      : never

// Math constants are number-dimension leaves (L3).
type MathConstant = "pi" | "e" | "infinity" | "-infinity" | "NaN"

/**
 * Evaluate a single leaf to a Dimension:
 *  - math constant → "number"
 *  - `(...)` → recurse on the inner expression (consumes one Depth unit;
 *    on exhaustion weak-accepts as "number" per L2)
 *  - `name(...)` → dispatch to EvalFn (nested calc/min/max/clamp)
 *  - otherwise → DimensionOf (a plain value like 10px / 2 / 50%)
 */
type EvalLeaf<S extends string, Depth extends unknown[]> =
  Trim<S> extends MathConstant
    ? "number"
    : Trim<S> extends `(${infer Inner})`
      ? Depth extends [unknown, ...infer Rest]
        ? EvalExpr<SplitBySpace<Trim<Inner>>, Rest>
        : "number" // L2: depth budget exhausted → weak-accept
      : Trim<S> extends `${infer Name}(${infer Args})`
        ? Depth extends [unknown, ...infer Rest]
          ? EvalFn<Trim<Name>, Args, Rest>
          : "number" // L2
        : DimensionOf<Trim<S>>

/**
 * Evaluate a space-separated token list (operand op operand op ...).
 * Right-associative (L1) — dimensionally lossless for these operator rules.
 */
type EvalExpr<
  Tokens extends string[],
  Depth extends unknown[],
> = Tokens extends [infer Only extends string]
  ? EvalLeaf<Only, Depth>
  : Tokens extends [
        infer First extends string,
        infer Op extends string,
        ...infer Rest extends string[],
      ]
    ? EvalLeaf<First, Depth> extends infer A
      ? A extends Dimension
        ? EvalExpr<Rest, Depth> extends infer B
          ? B extends Dimension
            ? CombineDim<A, Op, B>
            : never
          : never
        : never
      : never
    : never

/** Fold a comma-separated arg list requiring every arg to share one dimension. */
type EvalVariadicSame<
  Args extends string[],
  Depth extends unknown[],
  Acc extends Dimension | "init" = "init",
> = Args extends [infer Head extends string, ...infer Tail extends string[]]
  ? EvalExpr<SplitBySpace<Trim<Head>>, Depth> extends infer D
    ? D extends Dimension
      ? Acc extends "init"
        ? EvalVariadicSame<Tail, Depth, D>
        : Acc extends D
          ? EvalVariadicSame<Tail, Depth, Acc>
          : never
      : never
    : never
  : Acc extends Dimension
    ? Acc
    : never // empty list → never (min/max need ≥1)

/** clamp(min, preferred, max): exactly 3 args, all the same dimension. */
type EvalClamp<Args extends string[], Depth extends unknown[]> = Args extends [
  string,
  string,
  string,
]
  ? EvalVariadicSame<Args, Depth>
  : never

/** Dispatch a function call by name. */
type EvalFn<
  Name extends string,
  Args extends string,
  Depth extends unknown[],
> = Name extends "calc"
  ? EvalExpr<SplitBySpace<Trim<Args>>, Depth>
  : Name extends "min" | "max"
    ? EvalVariadicSame<SplitByComma<Args>, Depth>
    : Name extends "clamp"
      ? EvalClamp<SplitByComma<Args>, Depth>
      : never // unknown fn (var/env/attr/rgb/...) → never at strict tier (L6)

// Nesting budget (L2): 8 levels of parens / function calls.
type Depth8 = [
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
]

/** Evaluate a whole calc-family expression to its dimension (or never). */
type EvalTop<S extends string> =
  Trim<S> extends `${infer Name}(${infer Args})`
    ? EvalFn<Trim<Name>, Args, Depth8>
    : never

// `never extends X` is vacuously true, so a plain `extends Dimension` check
// would WRONGLY accept failed evaluations. Test for `never` explicitly.
type IsNever<T> = [T] extends [never] ? true : false

// =====================================================================
// 2. STRICT VALIDATOR + CALL-SITE HELPER
// =====================================================================

/**
 * Strict literal validator. Resolves to `S` when the expression is a
 * dimensionally-valid CSS math value, `never` otherwise.
 *
 * @example
 * type A = CalcLiteral<"calc(10px + 2rem)">     // "calc(10px + 2rem)"
 * type B = CalcLiteral<"calc(10px + 45deg)">    // never (length ≠ angle)
 * type C = CalcLiteral<"clamp(1rem, 2vw, 3rem)">// "clamp(1rem, 2vw, 3rem)"
 */
export type CalcLiteral<S extends string> =
  IsNever<EvalTop<Trim<S>>> extends true ? never : S

/**
 * Call-site validator helper. Mirrors `color()` / `easing()`.
 * Out-of-dimension expressions become a type error at the argument.
 */
export const cssCalc = <S extends string>(value: S & CalcLiteral<S>): S => value

// =====================================================================
// 3. SUGGESTION STRINGS — IntelliSense + onChange return types
// =====================================================================

export type CalcFunctionName = "calc" | "clamp" | "min" | "max"

/** Suggestion union — "this is a calc-family string". */
export type CalcString =
  | `calc(${string})`
  | `clamp(${string})`
  | `min(${string})`
  | `max(${string})`

/** Function → output-string map. Used by the `fn?` prop to narrow onChange. */
export interface CalcStringMap {
  calc: `calc(${string})`
  clamp: `clamp(${string})`
  min: `min(${string})`
  max: `max(${string})`
}

export type CalcFn = keyof CalcStringMap

// =====================================================================
// 4. UTILITY TYPES — operate on calc literals at the type level
// =====================================================================

/**
 * The CSS function family of a literal.
 *
 * @example
 * type T = FunctionOf<"clamp(1rem, 2vw, 3rem)">  // "clamp"
 */
export type FunctionOf<S extends string> =
  Trim<S> extends `calc(${string}`
    ? "calc"
    : Trim<S> extends `clamp(${string}`
      ? "clamp"
      : Trim<S> extends `min(${string}`
        ? "min"
        : Trim<S> extends `max(${string}`
          ? "max"
          : never

/**
 * The resolved dimension of a calc literal, or `never` if invalid.
 *
 * @example
 * type T = DimensionOfCalc<"calc(10px + 2rem)">  // "length"
 */
export type DimensionOfCalc<S extends string> =
  EvalTop<Trim<S>> extends infer D extends Dimension ? D : never

/** Length of a tuple — counts the outer function's comma args. */
type TupleLength<T extends readonly unknown[]> = T["length"]

/**
 * Argument count of the outer function (clamp ⇒ 3, min(a,b) ⇒ 2, calc ⇒ 1).
 */
export type ArgCountOf<S extends string> =
  Trim<S> extends `${string}(${infer Args})`
    ? TupleLength<SplitByComma<Args>>
    : never

// =====================================================================
// 5. INTERNAL STATE — parse-tree discriminated union (exported)
//
// The editor's React state is the raw expression text (a calc string is
// its own best serialization). `CalcNode` is the parse OUTPUT — exported
// for advanced consumers (custom serialization, programmatic build).
// =====================================================================

export type CalcNode =
  | { kind: "literal"; value: string; dimension: Dimension | null }
  | { kind: "var"; name: string; raw: string }
  | {
      kind: "binary"
      op: "+" | "-" | "*" | "/"
      left: CalcNode
      right: CalcNode
    }
  | { kind: "fn"; name: CalcFunctionName; args: CalcNode[] }
  | { kind: "group"; inner: CalcNode }

// Re-export the kit's Dimension for convenience (consumers need it for CalcNode).
export type { Dimension } from "@/lib/ridiculous-type-kit"
