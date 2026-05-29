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

// `Allowed` may be either a union of single chars (e.g. `Digit`) or a single
// concatenated char-set literal (e.g. `"0123456789"`). The `[C] extends
// [Allowed]` branch (wrapped to suppress distribution) handles the union
// form; the substring-containment fallback handles the concatenated form.
export type AllChars<S extends string, Allowed extends string> = S extends ""
  ? true
  : S extends `${infer C}${infer R}`
    ? [C] extends [Allowed]
      ? AllChars<R, Allowed>
      : Allowed extends `${string}${C}${string}`
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
