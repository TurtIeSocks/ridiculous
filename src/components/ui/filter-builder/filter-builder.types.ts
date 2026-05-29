// =====================================================================
// filter-builder.types.ts
//
// The "ridiculous" tier: compile-time FUNCTION-LIST DISPATCH over a CSS
// `filter` / `backdrop-filter` value (a space-separated list of filter
// functions). Built on `ridiculous-type-kit` plus the color-picker's
// `ColorLiteral` for the drop-shadow color argument. The strict validator
// `FilterLiteral<S>` resolves to `S` when every function in the list
// validates (its arity and each argument's DIMENSION), `never` otherwise.
//
//   "blur(4px) brightness(1.2)"          →  the literal
//   "blur(45deg)"                         →  never (wants length)
//   "drop-shadow(2px 2px 4px #000)"       →  the literal
//   "drop-shadow(2px 2px 4px wrong)"      →  never (bad color)
//
// This REUSES the function-list dispatch pattern from
// transform-builder.types.ts (Phase 2) with a filter function table:
//   SplitBySpace → ParseFunction → ValidateFn signature table → flat folds.
// =====================================================================

import type { ColorLiteral } from "@/components/ui/color-picker/color-picker.types"
import type {
  And,
  IsAngle,
  IsLength,
  IsNonNegativeNumber,
  IsPercentage,
  Or,
  ParseFunction,
  SplitByComma,
  SplitBySpace,
  Trim,
} from "@/lib/ridiculous-type-kit"

// =====================================================================
// 1. PER-DIMENSION PREDICATE ALIASES
// =====================================================================

/** non-negative number OR percentage — the amount functions. */
type IsAmount<S extends string> = Or<
  IsNonNegativeNumber<Trim<S>>,
  IsPercentage<Trim<S>>
>

/** Collapse the literal-or-never color validator into a boolean. */
type IsColor<S extends string> =
  ColorLiteral<Trim<S>> extends never ? false : true

// =====================================================================
// 2. drop-shadow ARGUMENT VALIDATION
//
// drop-shadow args are SPACE-separated (offset-x offset-y blur? color?),
// unlike the comma-separated transform functions. The kit's SplitBySpace
// is paren-aware, so a functional color whose own body contains spaces
// and a slash — rgb(0 0 0 / 0.5) — stays a single token.
//
// Strict tier accepts color-LAST only:
//   [X, Y]          two lengths
//   [X, Y, Z]       three lengths, OR two lengths + a color in slot 3
//   [X, Y, Z, W]    three lengths + a color
// =====================================================================

type ValidateDropShadow<ArgStr extends string> =
  SplitBySpace<ArgStr> extends infer Parts extends string[]
    ? Parts extends [infer X extends string, infer Y extends string]
      ? And<IsLength<Trim<X>>, IsLength<Trim<Y>>>
      : Parts extends [
            infer X extends string,
            infer Y extends string,
            infer Z extends string,
          ]
        ? And<
            IsLength<Trim<X>>,
            And<IsLength<Trim<Y>>, Or<IsLength<Trim<Z>>, IsColor<Z>>>
          >
        : Parts extends [
              infer X extends string,
              infer Y extends string,
              infer Z extends string,
              infer W extends string,
            ]
          ? And<
              IsLength<Trim<X>>,
              And<IsLength<Trim<Y>>, And<IsLength<Trim<Z>>, IsColor<W>>>
            >
          : false
    : false

/** url(...) — accept any non-empty body. */
type ValidateUrl<ArgStr extends string> = Trim<ArgStr> extends "" ? false : true

// =====================================================================
// 3. DISPATCH TABLE — ValidateFn<Name, ArgStr> → true | false.
//    The namesake. Arity by tuple length; argument dimensions by the
//    folds above (drop-shadow / url get their own validators).
// =====================================================================

type ValidateFn<Name extends string, ArgStr extends string> =
  // --- blur (length) -------------------------------------------------
  Name extends "blur"
    ? SplitByComma<ArgStr> extends [infer L extends string]
      ? IsLength<Trim<L>>
      : false
    : // --- hue-rotate (angle) -----------------------------------------
      Name extends "hue-rotate"
      ? SplitByComma<ArgStr> extends [infer A extends string]
        ? IsAngle<Trim<A>>
        : false
      : // --- amount functions (non-neg number | percentage) -----------
        Name extends
            | "brightness"
            | "contrast"
            | "grayscale"
            | "invert"
            | "opacity"
            | "saturate"
            | "sepia"
        ? SplitByComma<ArgStr> extends [infer N extends string]
          ? IsAmount<N>
          : false
        : // --- drop-shadow (2-3 lengths + optional color) -------------
          Name extends "drop-shadow"
          ? ValidateDropShadow<ArgStr>
          : // --- url (non-empty body) ---------------------------------
            Name extends "url"
            ? ValidateUrl<ArgStr>
            : false // unknown function name

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
  : true // reached the end without a failure

// =====================================================================
// 4. STRICT VALIDATOR + CALL-SITE HELPER
// =====================================================================

/**
 * Strict literal validator. Resolves to `S` when `S` is a dimensionally-
 * and arity-valid CSS `filter` / `backdrop-filter` value (or the `none`
 * keyword), `never` otherwise. `calc()` / `var()` inside an argument
 * resolve to `never` here (undecidable at compile time) — use the casual /
 * IntelliSense tier for those; the runtime parser accepts them.
 *
 * @example
 * type A = FilterLiteral<"blur(4px) brightness(1.2)"> // the literal
 * type B = FilterLiteral<"blur(45deg)">               // never
 * type C = FilterLiteral<"none">                       // "none"
 */
export type FilterLiteral<S extends string> =
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
 * Call-site validator helper. Mirrors `cssTransform()` / `cssCalc()` /
 * `color()` / `easing()`. An invalid filter becomes a type error at the
 * argument.
 */
export const cssFilter = <S extends string>(value: S & FilterLiteral<S>): S =>
  value

// =====================================================================
// 5. SUGGESTION STRINGS — IntelliSense + onChange return types
// =====================================================================

/** Every supported filter function name. */
export type FilterFunctionName =
  | "blur"
  | "brightness"
  | "contrast"
  | "grayscale"
  | "hue-rotate"
  | "invert"
  | "opacity"
  | "saturate"
  | "sepia"
  | "drop-shadow"
  | "url"

/** The amount functions — single non-negative number | percentage arg. */
export type AmountFn =
  | "brightness"
  | "contrast"
  | "grayscale"
  | "invert"
  | "opacity"
  | "saturate"
  | "sepia"

/**
 * Suggestion union — "this is a filter string". A head-anchored
 * `` `${fn}(${string})` `` per function also matches multi-function lists
 * (the list starts with a function name and ends in `)`), plus `none`.
 */
export type FilterString = `${FilterFunctionName}(${string})` | "none"

/** Function → output-string map. Backs the per-function suggestion shapes. */
export interface FilterStringMap {
  blur: `blur(${string})`
  brightness: `brightness(${string})`
  contrast: `contrast(${string})`
  grayscale: `grayscale(${string})`
  "hue-rotate": `hue-rotate(${string})`
  invert: `invert(${string})`
  opacity: `opacity(${string})`
  saturate: `saturate(${string})`
  sepia: `sepia(${string})`
  "drop-shadow": `drop-shadow(${string})`
  url: `url(${string})`
}

export type FilterFn = keyof FilterStringMap

// =====================================================================
// 6. UTILITY TYPES — operate on filter literals at the type level
// =====================================================================

type NamesOf<Tokens extends string[]> = Tokens extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? ParseFunction<H> extends { name: infer Name extends string }
    ? [Name, ...NamesOf<T>]
    : NamesOf<T>
  : []

/**
 * The ordered tuple of function names in a filter string.
 *
 * @example
 * type T = FunctionsOf<"blur(4px) brightness(1.2)"> // ["blur","brightness"]
 * type N = FunctionsOf<"none">                       // []
 */
export type FunctionsOf<S extends string> =
  Trim<S> extends "none" | "" ? [] : NamesOf<SplitBySpace<Trim<S>>>

/**
 * The number of filter functions in the list.
 *
 * @example
 * type C = FunctionCountOf<"blur(4px) brightness(1.2)"> // 2
 */
export type FunctionCountOf<S extends string> = FunctionsOf<S>["length"]

type IncludesDropShadow<Names extends string[]> = Names extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? H extends "drop-shadow"
    ? true
    : IncludesDropShadow<T>
  : false

/**
 * Whether the filter list contains a `drop-shadow` — the one function with
 * a color argument.
 *
 * @example
 * type A = HasDropShadow<"blur(4px) drop-shadow(1px 1px #000)"> // true
 * type B = HasDropShadow<"blur(4px)">                            // false
 */
export type HasDropShadow<S extends string> = IncludesDropShadow<FunctionsOf<S>>

// =====================================================================
// 7. INTERNAL STATE — discriminated union (exported)
//
// The editor's state is `FilterItem[]`. Each item is one function,
// discriminated by `fn`. Exported for advanced use (custom serialization,
// programmatic build). Argument values are kept as strings (they carry
// units/colors), mirroring how the literal preserves the raw text.
// =====================================================================

export type FilterItem =
  // one length
  | { fn: "blur"; value: string }
  // one angle
  | { fn: "hue-rotate"; value: string }
  // one non-negative number | percentage
  | { fn: AmountFn; value: string }
  // 2-3 lengths + optional trailing color
  | { fn: "drop-shadow"; x: string; y: string; blur?: string; color?: string }
  // opaque non-empty body
  | { fn: "url"; url: string }

// Re-export the kit's Dimension for convenience.
export type { Dimension } from "@/lib/ridiculous-type-kit"
