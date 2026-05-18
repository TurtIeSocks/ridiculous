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

type StripLeadingZeros<S extends string> = S extends `0${infer R}`
  ? R extends ""
    ? "0"
    : StripLeadingZeros<R>
  : S

type NormalizeInt<S extends string> = S extends "" ? "0" : StripLeadingZeros<S>

type IsIntPart<S extends string> = S extends ""
  ? true
  : NonEmptyAllChars<S, Digit>

type And<A extends boolean, B extends boolean> = A extends true
  ? B extends true
    ? true
    : false
  : false

type KeepIf<B extends boolean, S extends string> = B extends true ? S : never

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

type IsNonNegativeNumber<S extends string> = S extends `${infer I}.${infer F}`
  ? And<IsIntPart<I>, NonEmptyAllChars<F, Digit>>
  : NonEmptyAllChars<S, Digit>

type IsSignedDecimal<S extends string> = S extends `-${infer R}`
  ? IsNonNegativeNumber<R>
  : IsNonNegativeNumber<S>

type IsPositiveInt<S extends string> = S extends "0"
  ? false
  : S extends "" | "-"
    ? false
    : NonEmptyAllChars<S, Digit>

// =====================================================================
// 2. STRICT VALIDATORS — exported, generic. Used by easing() helper.
// =====================================================================

/** Named CSS Easing L1 keyword. */
export type EasingKeywordLiteral<S extends string> = S extends EasingKeyword
  ? S
  : never

/** `cubic-bezier(x1, y1, x2, y2)` — x ∈ [0,1], y signed (overshoot OK). */
export type CubicBezierLiteral<S extends string> =
  S extends `cubic-bezier(${infer X1}, ${infer Y1}, ${infer X2}, ${infer Y2})`
    ? KeepIf<
        And<
          IsNumber0To1<Trim<X1>>,
          And<
            IsSignedDecimal<Trim<Y1>>,
            And<IsNumber0To1<Trim<X2>>, IsSignedDecimal<Trim<Y2>>>
          >
        >,
        S
      >
    : S extends `cubic-bezier(${infer X1} ${infer Y1} ${infer X2} ${infer Y2})`
      ? KeepIf<
          And<
            IsNumber0To1<Trim<X1>>,
            And<
              IsSignedDecimal<Trim<Y1>>,
              And<IsNumber0To1<Trim<X2>>, IsSignedDecimal<Trim<Y2>>>
            >
          >,
          S
        >
      : never

/** `steps(n)` or `steps(n, position)` — n positive integer. */
export type StepsLiteral<S extends string> =
  S extends `steps(${infer N}, ${infer P})`
    ? P extends StepPosition
      ? KeepIf<IsPositiveInt<Trim<N>>, S>
      : never
    : S extends `steps(${infer N})`
      ? KeepIf<IsPositiveInt<Trim<N>>, S>
      : never

/**
 * `linear()` — weak validation. Variadic stop range-checking at the type
 * level would blow up compile time. Runtime parser does real validation.
 */
export type LinearLiteral<S extends string> = S extends `linear(${infer Body})`
  ? Trim<Body> extends ""
    ? never
    : S
  : never

/** Union — accepts any valid CSS easing function or keyword. */
export type EasingLiteral<S extends string> =
  | EasingKeywordLiteral<S>
  | CubicBezierLiteral<S>
  | StepsLiteral<S>
  | LinearLiteral<S>

/** Call-site validator helper. Mirrors `color()` from color-picker. */
export const easing = <S extends string>(value: S & EasingLiteral<S>): S => value

// =====================================================================
// 3. SUGGESTION STRINGS — non-generic, for IntelliSense + onChange returns
// =====================================================================

/** CSS Easing L1 named keywords. */
export type EasingKeyword =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "step-start"
  | "step-end"

/** `cubic-bezier(x1, y1, x2, y2)` — both comma and space forms. */
export type CubicBezierString =
  | `cubic-bezier(${number}, ${number}, ${number}, ${number})`
  | `cubic-bezier(${number} ${number} ${number} ${number})`

export type StepPosition =
  | "start"
  | "end"
  | "jump-start"
  | "jump-end"
  | "jump-both"
  | "jump-none"

export type StepsString =
  | `steps(${number})`
  | `steps(${number}, ${StepPosition})`

/** `linear()` multi-stop — variadic, weakly suggested. */
export type LinearString = `linear(${string})`

/** Union of every valid easing output. */
export type EasingString =
  | EasingKeyword
  | CubicBezierString
  | StepsString
  | LinearString

/** Basis → output-string type map. Used by `basis?` prop to narrow onChange. */
export interface EasingStringMap {
  bezier: CubicBezierString
  spring: LinearString
  bounce: LinearString
  wiggle: LinearString
  steps: StepsString
}

export type EasingBasis = keyof EasingStringMap

export type PolynomialFamily =
  | "Sine"
  | "Quad"
  | "Cubic"
  | "Quart"
  | "Quint"
  | "Expo"
  | "Circ"
  | "Back"

export type Direction = "In" | "Out" | "InOut" | "OutIn"

export type PresetName =
  | EasingKeyword
  | `ease${Direction}${PolynomialFamily}`
  | "anticipate"
  | "smoothStep"

// =====================================================================
// 4. UTILITY TYPES — operate on easing literals at the type level.
// =====================================================================

/**
 * Extract CSS function type from a literal at the type level.
 *
 * @example
 * type T1 = FunctionOf<"cubic-bezier(0,0,1,1)">  // "bezier"
 * type T2 = FunctionOf<"steps(3)">                // "steps"
 * type T3 = FunctionOf<"ease-in">                 // "bezier"
 * type T4 = FunctionOf<"step-start">              // "steps"
 */
export type FunctionOf<S extends string> = S extends `cubic-bezier(${string}`
  ? "bezier"
  : S extends `steps(${string}`
    ? "steps"
    : S extends `linear(${string}`
      ? "linear"
      : S extends "step-start" | "step-end"
        ? "steps"
        : S extends EasingKeyword
          ? "bezier"
          : never

/**
 * Extract basis from a literal. Note: `linear()` output is ambiguous —
 * baking erases the physics type, so spring/bounce/wiggle all collapse.
 */
export type BasisOfString<S extends string> = S extends LinearString
  ? "spring" | "bounce" | "wiggle"
  : S extends CubicBezierString | EasingKeyword
    ? "bezier"
    : S extends StepsString
      ? "steps"
      : never

// =====================================================================
// 5. INTERNAL STATE — discriminated union, source of truth in the editor.
//    Exported for advanced use cases (custom serialization, dehydration).
// =====================================================================

export type EasingState =
  | {
      basis: "bezier"
      x1: number
      y1: number
      x2: number
      y2: number
      extraTop: number
      extraBottom: number
    }
  | { basis: "spring"; stiffness: number; damping: number; mass: number }
  | { basis: "bounce"; bounces: number; stiffness: number }
  | { basis: "wiggle"; wiggles: number; damping: number }
  | { basis: "steps"; n: number; position: StepPosition }
