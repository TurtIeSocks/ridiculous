// =====================================================================
// primitives.ts — char classes, trim, boolean logic, char-count.
// Extracted from the inlined copies in color-picker / easing-picker /
// unit-input types. Boolean predicates return true | false.
// =====================================================================

export type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

export type HexDigit =
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

export type WS = " " | "\n" | "\t"

export type TrimLeft<S extends string> = S extends `${WS}${infer R}`
  ? TrimLeft<R>
  : S
export type TrimRight<S extends string> = S extends `${infer R}${WS}`
  ? TrimRight<R>
  : S
export type Trim<S extends string> = TrimLeft<TrimRight<S>>

// Every char of `S` must be a member of the `Allowed` union (e.g. `Digit`).
// Faithful extraction from the shipped components — callers pass a char union.
export type AllChars<S extends string, Allowed extends string> = S extends ""
  ? true
  : S extends `${infer C}${infer R}`
    ? C extends Allowed
      ? AllChars<R, Allowed>
      : false
    : false

export type NonEmptyAllChars<
  S extends string,
  Allowed extends string,
> = S extends "" ? false : AllChars<S, Allowed>

export type And<A extends boolean, B extends boolean> = A extends true
  ? B extends true
    ? true
    : false
  : false

export type Or<A extends boolean, B extends boolean> = A extends true
  ? true
  : B extends true
    ? true
    : false

export type Not<A extends boolean> = A extends true ? false : true

export type KeepIf<B extends boolean, S extends string> = B extends true
  ? S
  : never

export type Length<
  S extends string,
  A extends unknown[] = [],
> = S extends `${string}${infer R}` ? Length<R, [...A, unknown]> : A["length"]

// --- integer range machinery -----------------------------------------

type Enumerate<
  N extends number,
  A extends number[] = [],
> = A["length"] extends N ? A[number] : Enumerate<N, [...A, A["length"]]>

export type IntRange<From extends number, To extends number> = Exclude<
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

// --- number shape predicates -----------------------------------------

export type IsNonNegativeNumber<S extends string> =
  S extends `${infer I}.${infer F}`
    ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>>
    : NonEmptyAllChars<S, Digit>

export type IsSignedDecimal<S extends string> = S extends `-${infer R}`
  ? IsNonNegativeNumber<R>
  : IsNonNegativeNumber<S>

export type IsNumber<S extends string> = S extends `+${infer R}`
  ? IsNonNegativeNumber<R>
  : IsSignedDecimal<S>

export type IsPositiveInt<S extends string> = S extends "0"
  ? false
  : S extends "" | "-"
    ? false
    : NonEmptyAllChars<S, Digit>

// --- bounded-number predicates ---------------------------------------

export type IsByte<S extends string> =
  NonEmptyAllChars<S, Digit> extends true
    ? NormalizeInt<S> extends `${IntRange<0, 256>}`
      ? true
      : false
    : false

export type IsNumber0To1<S extends string> = S extends `${infer I}.${infer F}`
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

export type IsNumber0To100<S extends string> = S extends `${infer I}.${infer F}`
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

export type IsNumber0To360<S extends string> = S extends `${infer I}.${infer F}`
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

export type IsNumber0To400<S extends string> = S extends `${infer I}.${infer F}`
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

export type IsPercent0To100<S extends string> = S extends `${infer N}%`
  ? IsNumber0To100<N>
  : false
