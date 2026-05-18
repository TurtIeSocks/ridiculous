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

type And<A extends boolean, B extends boolean> = A extends true
  ? B extends true
    ? true
    : false
  : false

type IsIntPart<S extends string> = S extends ""
  ? true
  : NonEmptyAllChars<S, Digit>

type IsNonNegativeNumber<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>> extends true
    ? true
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

// =====================================================================
// 3. SUGGESTION STRINGS — non-generic, for IntelliSense + onChange returns.
// =====================================================================

export type DegString = `${number}deg`
export type PercentString = `${number}%`
export type PxString = `${number}px`
export type RemString = `${number}rem`
export type EmString = `${number}em`
export type VwString = `${number}vw`
export type VhString = `${number}vh`

export interface UnitStringMap {
  deg: DegString
  "%": PercentString
  px: PxString
  rem: RemString
  em: EmString
  vw: VwString
  vh: VhString
}

export type KnownUnit = keyof UnitStringMap
export type UnitString =
  | DegString
  | PercentString
  | PxString
  | RemString
  | EmString
  | VwString
  | VhString

// =====================================================================
// 4. STRICT HELPERS — validate at the call site, return the literal back.
// =====================================================================

export const deg = <S extends string>(value: S & DegLiteral<S>): S => value
export const percent = <S extends string>(
  value: S & PercentLiteral<S>,
): S => value
export const px = <S extends string>(value: S & PxLiteral<S>): S => value
export const rem = <S extends string>(value: S & RemLiteral<S>): S => value
export const em = <S extends string>(value: S & EmLiteral<S>): S => value
export const vw = <S extends string>(value: S & VwLiteral<S>): S => value
export const vh = <S extends string>(value: S & VhLiteral<S>): S => value
