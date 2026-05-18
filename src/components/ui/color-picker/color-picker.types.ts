// =====================================================================
// 1. PRIMITIVES — private helpers, not exported
// =====================================================================

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

type HexDigit =
  | Digit
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"

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

type Length<
  S extends string,
  A extends unknown[] = [],
> = S extends `${string}${infer R}` ? Length<R, [...A, unknown]> : A["length"]

type And<A extends boolean, B extends boolean> = A extends true
  ? B extends true
    ? true
    : false
  : false

type Or<A extends boolean, B extends boolean> = A extends true
  ? true
  : B extends true
    ? true
    : false

type Enumerate<
  N extends number,
  A extends number[] = [],
> = A["length"] extends N ? A[number] : Enumerate<N, [...A, A["length"]]>

type IntRange<From extends number, To extends number> = Exclude<
  Enumerate<To>,
  Enumerate<From>
>

type StripLeadingZeros<S extends string> = S extends `0${infer R}`
  ? R extends ""
    ? "0"
    : StripLeadingZeros<R>
  : S

type NormalizeInt<S extends string> = S extends "" ? "0" : StripLeadingZeros<S>

type IsIntPart<S extends string> = S extends ""
  ? true
  : NonEmptyAllChars<S, Digit>

type IsByte<S extends string> =
  NonEmptyAllChars<S, Digit> extends true
    ? NormalizeInt<S> extends `${IntRange<0, 256>}`
      ? true
      : false
    : false

type IsNumber0To1<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>> extends true
    ? NormalizeInt<I> extends "0"
      ? true
      : NormalizeInt<I> extends "1"
        ? AllChars<F, "0">
        : false
    : false
  : NonEmptyAllChars<S, Digit> extends true
    ? NormalizeInt<S> extends "0" | "1"
      ? true
      : false
    : false

type IsNumber0To100<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>> extends true
    ? NormalizeInt<I> extends `${IntRange<0, 100>}`
      ? true
      : NormalizeInt<I> extends "100"
        ? AllChars<F, "0">
        : false
    : false
  : NonEmptyAllChars<S, Digit> extends true
    ? NormalizeInt<S> extends `${IntRange<0, 101>}`
      ? true
      : false
    : false

type IsNumber0To360<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>> extends true
    ? NormalizeInt<I> extends `${IntRange<0, 360>}`
      ? true
      : NormalizeInt<I> extends "360"
        ? AllChars<F, "0">
        : false
    : false
  : NonEmptyAllChars<S, Digit> extends true
    ? NormalizeInt<S> extends `${IntRange<0, 361>}`
      ? true
      : false
    : false

type IsNumber0To400<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>> extends true
    ? NormalizeInt<I> extends `${IntRange<0, 400>}`
      ? true
      : NormalizeInt<I> extends "400"
        ? AllChars<F, "0">
        : false
    : false
  : NonEmptyAllChars<S, Digit> extends true
    ? NormalizeInt<S> extends `${IntRange<0, 401>}`
      ? true
      : false
    : false

type IsPercent0To100<S extends string> = S extends `${infer N}%`
  ? IsNumber0To100<N>
  : false

type IsAlpha<S extends string> = Or<IsNumber0To1<S>, IsPercent0To100<S>>

type IsRgbChannel<S extends string> = Or<IsByte<S>, IsPercent0To100<S>>

type IsHue<S extends string> = S extends `${infer N}deg`
  ? IsNumber0To360<N>
  : S extends `${infer N}turn`
    ? IsNumber0To1<N>
    : S extends `${infer N}grad`
      ? IsNumber0To400<N>
      : IsNumber0To360<S>

type IsNonNegativeNumber<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>>
  : NonEmptyAllChars<S, Digit>

type KeepIf<B extends boolean, S extends string> = B extends true ? S : never

// Compile-time anchor for primitives not yet consumed by an exported
// validator. tsc's `noUnusedLocals` flags top-level type aliases (TS6196),
// so each unconsumed primitive is referenced here. Entries are removed as
// subsequent tasks introduce validators that consume them. Erased at
// compile time; intentionally exported so the anchor itself isn't flagged.
export type __PrimitivesAnchor__ = [
  HexDigit,
  Trim<"">,
  Length<"">,
  IsAlpha<"">,
  IsRgbChannel<"">,
  IsHue<"">,
  IsNonNegativeNumber<"">,
  KeepIf<true, "">,
]
