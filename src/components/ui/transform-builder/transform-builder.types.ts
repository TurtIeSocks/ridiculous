// =====================================================================
// transform-builder.types.ts
//
// The "ridiculous" tier: compile-time FUNCTION-NAME DISPATCH over a CSS
// `transform` value (a space-separated list of transform functions).
// Built entirely on `ridiculous-type-kit`. The strict validator
// `TransformLiteral<S>` resolves to `S` when every function in the list
// validates (its arity and each argument's DIMENSION), `never` otherwise.
//
//   "translateX(10px) rotate(45deg) scale(1.5)"  →  the literal
//   "rotate(10px)"                               →  never (wants angle)
//   "translateX(45deg)"                          →  never (wants length-%)
//
// Structure mirrors calc-editor.types.ts:
//   kit imports → predicate aliases → arg folds → dispatch table →
//   list validator → TransformLiteral + cssTransform → suggestion strings
//   → utility types → internal discriminated-union state.
//
// This ESTABLISHES the function-list dispatch pattern Phase 3 (filter)
// reuses: SplitBySpace → ParseFunction → ValidateFn signature table →
// AllArgs* flat folds. Keep these pieces clean and self-contained.
// =====================================================================

import type {
  And,
  IsAngle,
  IsLength,
  IsNumber,
  IsPercentage,
  Or,
  ParseFunction,
  SplitByComma,
  SplitBySpace,
  Trim,
} from "@/lib/ridiculous-type-kit"

// =====================================================================
// 1. PER-DIMENSION PREDICATE ALIASES (Phase-3 reuse surface)
// =====================================================================

/** length OR percentage — translate axes. */
type IsLengthPct<S extends string> = Or<
  IsLength<Trim<S>>,
  IsPercentage<Trim<S>>
>

/** number OR percentage — scale factors. */
type IsNumberPct<S extends string> = Or<
  IsNumber<Trim<S>>,
  IsPercentage<Trim<S>>
>

// =====================================================================
// 2. FLAT ARG FOLDS — every element must satisfy one predicate.
//    Empty tuple → true (arity is validated separately by the caller).
//    TS has no higher-kinded type params, so one fold per predicate.
// =====================================================================

type AllLength<Args extends string[]> = Args extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? IsLength<Trim<H>> extends true
    ? AllLength<T>
    : false
  : true

type AllAngle<Args extends string[]> = Args extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? IsAngle<Trim<H>> extends true
    ? AllAngle<T>
    : false
  : true

type AllNumber<Args extends string[]> = Args extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? IsNumber<Trim<H>> extends true
    ? AllNumber<T>
    : false
  : true

type AllLengthPct<Args extends string[]> = Args extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? IsLengthPct<H> extends true
    ? AllLengthPct<T>
    : false
  : true

type AllNumberPct<Args extends string[]> = Args extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? IsNumberPct<H> extends true
    ? AllNumberPct<T>
    : false
  : true

// =====================================================================
// 3. DISPATCH TABLE — ValidateFn<Name, ArgStr> → true | false.
//    The namesake. Arity is checked by tuple length; argument dimensions
//    by the folds above (with positional special-cases for the 3d funcs).
// =====================================================================

type ValidateFn<Name extends string, ArgStr extends string> =
  SplitByComma<ArgStr> extends infer Args extends string[]
    ? // --- translate family ---------------------------------------------
      Name extends "translateX" | "translateY"
      ? Args extends [string]
        ? AllLengthPct<Args>
        : false
      : Name extends "translateZ" | "perspective"
        ? Args extends [string]
          ? AllLength<Args>
          : false
        : Name extends "translate"
          ? Args extends [string] | [string, string]
            ? AllLengthPct<Args>
            : false
          : Name extends "translate3d"
            ? Args extends [
                infer X extends string,
                infer Y extends string,
                infer Z extends string,
              ]
              ? And<IsLengthPct<X>, And<IsLengthPct<Y>, IsLength<Trim<Z>>>>
              : false
            : // --- rotate family --------------------------------------------
              Name extends "rotate" | "rotateX" | "rotateY" | "rotateZ"
              ? Args extends [string]
                ? AllAngle<Args>
                : false
              : Name extends "rotate3d"
                ? Args extends [
                    infer A extends string,
                    infer B extends string,
                    infer C extends string,
                    infer D extends string,
                  ]
                  ? And<
                      IsNumber<Trim<A>>,
                      And<
                        IsNumber<Trim<B>>,
                        And<IsNumber<Trim<C>>, IsAngle<Trim<D>>>
                      >
                    >
                  : false
                : // --- scale family -------------------------------------------
                  Name extends "scaleX" | "scaleY" | "scaleZ"
                  ? Args extends [string]
                    ? AllNumberPct<Args>
                    : false
                  : Name extends "scale"
                    ? Args extends [string] | [string, string]
                      ? AllNumberPct<Args>
                      : false
                    : Name extends "scale3d"
                      ? Args extends [string, string, string]
                        ? AllNumberPct<Args>
                        : false
                      : // --- skew family ------------------------------------------
                        Name extends "skewX" | "skewY"
                        ? Args extends [string]
                          ? AllAngle<Args>
                          : false
                        : Name extends "skew"
                          ? Args extends [string] | [string, string]
                            ? AllAngle<Args>
                            : false
                          : // --- matrix family --------------------------------------
                            Name extends "matrix"
                            ? Args extends [
                                string,
                                string,
                                string,
                                string,
                                string,
                                string,
                              ]
                              ? AllNumber<Args>
                              : false
                            : Name extends "matrix3d"
                              ? Args["length"] extends 16
                                ? AllNumber<Args>
                                : false
                              : false // unknown function name
    : false

// Validate one space-separated token (`name(args)`), or false.
type ValidateToken<Token extends string> =
  ParseFunction<Token> extends {
    name: infer Name extends string
    args: infer ArgStr extends string
  }
    ? ValidateFn<Name, ArgStr>
    : false

// Fold the space-separated function list; every token must validate.
type ValidateList<Tokens extends string[]> = Tokens extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? ValidateToken<H> extends true
    ? ValidateList<T>
    : false
  : true // empty list reached the end without a failure

// =====================================================================
// 4. STRICT VALIDATOR + CALL-SITE HELPER
// =====================================================================

/**
 * Strict literal validator. Resolves to `S` when `S` is a dimensionally-
 * and arity-valid CSS `transform` value (or the `none` keyword), `never`
 * otherwise. `calc()` / `var()` inside an argument resolve to `never` here
 * (undecidable at compile time) — use the casual / IntelliSense tier for
 * those; the runtime parser accepts them.
 *
 * @example
 * type A = TransformLiteral<"translateX(10px) rotate(45deg)"> // the literal
 * type B = TransformLiteral<"rotate(10px)">                   // never
 * type C = TransformLiteral<"none">                           // "none"
 */
export type TransformLiteral<S extends string> =
  Trim<S> extends "none"
    ? S
    : Trim<S> extends ""
      ? never
      : SplitBySpace<Trim<S>> extends infer Tokens extends string[]
        ? Tokens extends []
          ? never
          : ValidateList<Tokens> extends true
            ? S
            : never
        : never

/**
 * Call-site validator helper. Mirrors `cssCalc()` / `color()` / `easing()`.
 * An invalid transform becomes a type error at the argument.
 */
export const cssTransform = <S extends string>(
  value: S & TransformLiteral<S>,
): S => value

// =====================================================================
// 5. SUGGESTION STRINGS — IntelliSense + onChange return types
// =====================================================================

/** Every supported transform function name. */
export type TransformFunctionName =
  | "translate"
  | "translateX"
  | "translateY"
  | "translateZ"
  | "translate3d"
  | "scale"
  | "scaleX"
  | "scaleY"
  | "scaleZ"
  | "scale3d"
  | "rotate"
  | "rotateX"
  | "rotateY"
  | "rotateZ"
  | "rotate3d"
  | "skew"
  | "skewX"
  | "skewY"
  | "matrix"
  | "matrix3d"
  | "perspective"

/**
 * Suggestion union — "this is a transform string". A head-anchored
 * `` `${fn}(${string})` `` per function also matches multi-function lists
 * (the list starts with a function name and ends in `)`), plus `none`.
 */
export type TransformString = `${TransformFunctionName}(${string})` | "none"

/** Function → output-string map. Backs the per-function suggestion shapes. */
export interface TransformStringMap {
  translate: `translate(${string})`
  translateX: `translateX(${string})`
  translateY: `translateY(${string})`
  translateZ: `translateZ(${string})`
  translate3d: `translate3d(${string})`
  scale: `scale(${string})`
  scaleX: `scaleX(${string})`
  scaleY: `scaleY(${string})`
  scaleZ: `scaleZ(${string})`
  scale3d: `scale3d(${string})`
  rotate: `rotate(${string})`
  rotateX: `rotateX(${string})`
  rotateY: `rotateY(${string})`
  rotateZ: `rotateZ(${string})`
  rotate3d: `rotate3d(${string})`
  skew: `skew(${string})`
  skewX: `skewX(${string})`
  skewY: `skewY(${string})`
  matrix: `matrix(${string})`
  matrix3d: `matrix3d(${string})`
  perspective: `perspective(${string})`
}

export type TransformFn = keyof TransformStringMap

// =====================================================================
// 6. UTILITY TYPES — operate on transform literals at the type level
// =====================================================================

/**
 * The ordered tuple of function names in a transform string.
 *
 * @example
 * type T = FunctionsOf<"translateX(1px) rotate(45deg)"> // ["translateX","rotate"]
 * type N = FunctionsOf<"none">                          // []
 */
export type FunctionsOf<S extends string> =
  Trim<S> extends "none" | "" ? [] : NamesOf<SplitBySpace<Trim<S>>>

type NamesOf<Tokens extends string[]> = Tokens extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? ParseFunction<H> extends { name: infer Name extends string }
    ? [Name, ...NamesOf<T>]
    : NamesOf<T>
  : []

/**
 * The number of transform functions in the list.
 *
 * @example
 * type C = FunctionCountOf<"translateX(1px) rotate(45deg)"> // 2
 */
export type FunctionCountOf<S extends string> = FunctionsOf<S>["length"]

// =====================================================================
// 7. INTERNAL STATE — discriminated union (exported)
//
// The editor's state is `TransformItem[]`. Each item is one function,
// discriminated by `fn`. Exported for advanced use (custom serialization,
// programmatic build). Argument values are kept as strings (they may carry
// units), mirroring how the literal preserves the raw text.
// =====================================================================

export type TransformItem =
  // one length-percentage axis
  | { fn: "translateX" | "translateY"; value: string }
  // one length axis
  | { fn: "translateZ" | "perspective"; value: string }
  // two length-percentage axes (y optional in CSS; stored explicitly)
  | { fn: "translate"; x: string; y?: string }
  // three: x,y length-%, z length
  | { fn: "translate3d"; x: string; y: string; z: string }
  // one angle
  | { fn: "rotate" | "rotateX" | "rotateY" | "rotateZ"; angle: string }
  // axis vector + angle
  | { fn: "rotate3d"; x: string; y: string; z: string; angle: string }
  // one number-or-percentage factor
  | { fn: "scaleX" | "scaleY" | "scaleZ"; value: string }
  // two factors (y optional in CSS)
  | { fn: "scale"; x: string; y?: string }
  // three factors
  | { fn: "scale3d"; x: string; y: string; z: string }
  // one angle
  | { fn: "skewX" | "skewY"; angle: string }
  // two angles (y optional in CSS)
  | { fn: "skew"; x: string; y?: string }
  // 6-number 2D matrix
  | { fn: "matrix"; values: string[] }
  // 16-number 3D matrix
  | { fn: "matrix3d"; values: string[] }

// Re-export the kit's Dimension for convenience.
export type { Dimension } from "@/lib/ridiculous-type-kit"
