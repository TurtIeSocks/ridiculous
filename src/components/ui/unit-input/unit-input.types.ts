// =====================================================================
// 1. PRIMITIVES — private helpers, not exported
// =====================================================================

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

type WS = " " | "\n" | "\t"
type TrimLeft<S extends string> = S extends `${WS}${infer R}` ? TrimLeft<R> : S
type TrimRight<S extends string> = S extends `${infer R}${WS}`
  ? TrimRight<R>
  : S
type Trim<S extends string> = TrimLeft<TrimRight<S>>

type AllChars<S extends string, Allowed extends string> = S extends ""
  ? true
  : S extends `${infer C}${infer R}`
    ? C extends Allowed
      ? AllChars<R, Allowed>
      : false
    : false

type NonEmptyAllChars<S extends string, Allowed extends string> = S extends ""
  ? false
  : AllChars<S, Allowed>

type IsIntPart<S extends string> = S extends ""
  ? true
  : NonEmptyAllChars<S, Digit>

type IsNonNegativeNumber<S extends string> = S extends `${infer I}.${infer F}`
  ? IsIntPart<I> extends true
    ? NonEmptyAllChars<F, Digit>
    : false
  : NonEmptyAllChars<S, Digit>

type IsSignedDecimal<S extends string> = S extends `-${infer R}`
  ? IsNonNegativeNumber<R>
  : IsNonNegativeNumber<S>

type KeepIf<B extends boolean, S extends string> = B extends true ? S : never

// =====================================================================
// 2. STRICT VALIDATORS — exported, generic. Used by deg()/percent()/etc.
// =====================================================================

export type DegLiteral<S extends string> = S extends `${infer N}deg`
  ? KeepIf<IsSignedDecimal<Trim<N>>, S>
  : never

export type PercentLiteral<S extends string> = S extends `${infer N}%`
  ? KeepIf<IsSignedDecimal<Trim<N>>, S>
  : never

export type PxLiteral<S extends string> = S extends `${infer N}px`
  ? KeepIf<IsSignedDecimal<Trim<N>>, S>
  : never

export type RemLiteral<S extends string> = S extends `${infer N}rem`
  ? KeepIf<IsSignedDecimal<Trim<N>>, S>
  : never

export type EmLiteral<S extends string> = S extends `${infer N}em`
  ? KeepIf<IsSignedDecimal<Trim<N>>, S>
  : never

export type VwLiteral<S extends string> = S extends `${infer N}vw`
  ? KeepIf<IsSignedDecimal<Trim<N>>, S>
  : never

export type VhLiteral<S extends string> = S extends `${infer N}vh`
  ? KeepIf<IsSignedDecimal<Trim<N>>, S>
  : never

export type UnitLiteral<S extends string> =
  | DegLiteral<S>
  | PercentLiteral<S>
  | PxLiteral<S>
  | RemLiteral<S>
  | EmLiteral<S>
  | VwLiteral<S>
  | VhLiteral<S>
