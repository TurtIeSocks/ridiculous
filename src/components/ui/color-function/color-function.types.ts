// =====================================================================
// color-function.types.ts
//
// The "ridiculous" tier: compile-time validation of MODERN CSS COLOR
// FUNCTIONS, dispatched on the LEADING FUNCTION NAME into three
// independent grammars:
//
//   color-mix(in <space> [<hue> hue]?, <color> <pct>?, <color> <pct>?)
//   light-dark(<color>, <color>)
//   <fn>(from <color> <c1> <c2> <c3> [/ <alpha>]?)   fn ∈ relative set
//
// Built on `ridiculous-type-kit` plus the color-picker's `ColorLiteral`
// for every nested <color> argument (bare keyword colors like `red` are
// NOT in ColorLiteral — the strict tier rejects them; the runtime parser
// accepts them). `var(...)` is accepted anywhere a <color> is expected.
//
//   "color-mix(in oklch shorter hue, #f00, #00f)"  →  the literal
//   "light-dark(#fff, #000)"                        →  the literal
//   "oklch(from #f00 l c h / 50%)"                  →  the literal
//   "oklch(from #f00 r g b)"                        →  never (wrong kw)
//   "rgb(255 0 0)"                                   →  never (no `from`)
// =====================================================================

import type { ColorLiteral } from "@/components/ui/color-picker/color-picker.types"
import type {
  And,
  IsNumber,
  IsPercentage,
  ParseFunction,
  SplitByComma,
  SplitBySpace,
  StartsWith,
  Trim,
} from "@/lib/ridiculous-type-kit"

// =====================================================================
// 1. CONSTANT UNIONS (exported where useful for advanced composition)
// =====================================================================

/** The 14-member CSS Color 5 `color-mix` interpolation colorspace set. */
export type MixColorSpace =
  | "srgb"
  | "srgb-linear"
  | "display-p3"
  | "a98-rgb"
  | "prophoto-rgb"
  | "rec2020"
  | "lab"
  | "oklab"
  | "xyz"
  | "xyz-d50"
  | "xyz-d65"
  | "hsl"
  | "hwb"
  | "lch"
  | "oklch"

/** The four polar spaces that carry a hue component. */
type CylindricalSpace = "hsl" | "hwb" | "lch" | "oklch"

/** Hue-interpolation methods (precede the literal `hue` keyword). */
export type HueMethod = "shorter" | "longer" | "increasing" | "decreasing"

/** The eight relative-color function names. */
export type RelativeFn =
  | "rgb"
  | "hsl"
  | "hwb"
  | "lab"
  | "lch"
  | "oklab"
  | "oklch"
  | "color"

// =====================================================================
// 2. PER-TOKEN PREDICATE ALIASES
// =====================================================================

/** True when `S` is a `var(...)` reference. */
type IsVar<S extends string> = Trim<S> extends `var(${string})` ? true : false

/** A <color> argument: a ColorLiteral OR a var() reference. */
type IsColorArg<S extends string> =
  ColorLiteral<Trim<S>> extends never ? IsVar<S> : true

/** A lenient `calc(...)` token (body NOT parsed — documented relaxation). */
type IsCalc<S extends string> = Trim<S> extends `calc(${string})` ? true : false

// =====================================================================
// 3. color-mix — FULL validation
// =====================================================================

// Part 1: the interpolation spec. `in <space>` or `in <space> <method> hue`.
type ValidInterp<Tokens extends string[]> = Tokens extends ["in", infer Sp]
  ? Sp extends MixColorSpace
    ? true
    : false
  : Tokens extends ["in", infer Sp, infer M, "hue"]
    ? Sp extends CylindricalSpace
      ? M extends HueMethod
        ? true
        : false
      : false
    : false

// Parts 2 & 3: a <color> with an optional trailing <percentage>.
type ValidMixColor<Tokens extends string[]> = Tokens extends [
  infer C extends string,
]
  ? IsColorArg<C>
  : Tokens extends [infer C extends string, infer P extends string]
    ? And<IsColorArg<C>, IsPercentage<Trim<P>>>
    : false

type ValidMixParts<Parts extends string[]> = Parts extends [
  infer I extends string,
  infer A extends string,
  infer B extends string,
]
  ? And<
      ValidInterp<SplitBySpace<I>>,
      And<ValidMixColor<SplitBySpace<A>>, ValidMixColor<SplitBySpace<B>>>
    >
  : false

/**
 * Strict `color-mix()` validator. Resolves to `S` when `S` is a fully
 * valid color-mix (`in <space>` with an optional `<method> hue` on a
 * cylindrical space, then exactly two `<color> <pct>?` arguments), else
 * `never`.
 */
export type ColorMixLiteral<S extends string> =
  ParseFunction<Trim<S>> extends {
    name: "color-mix"
    args: infer Args extends string
  }
    ? ValidMixParts<SplitByComma<Args>> extends true
      ? S
      : never
    : never

// =====================================================================
// 4. light-dark — FULL validation
// =====================================================================

type ValidLightDark<Parts extends string[]> = Parts extends [
  infer L extends string,
  infer D extends string,
]
  ? And<IsColorArg<L>, IsColorArg<D>>
  : false

/**
 * Strict `light-dark()` validator. Resolves to `S` for exactly two valid
 * `<color>` arguments, else `never`.
 */
export type LightDarkLiteral<S extends string> =
  ParseFunction<Trim<S>> extends {
    name: "light-dark"
    args: infer Args extends string
  }
    ? ValidLightDark<SplitByComma<Args>> extends true
      ? S
      : never
    : never

// =====================================================================
// 5. relative color — per-space channel-keyword strictness + relaxations
// =====================================================================

// Per-fn channel keyword sets. Validated against the DESTINATION fn's
// space (CSS resolves the `from` color into it), not the source color.
type ChannelKw<Fn extends RelativeFn> = Fn extends "rgb"
  ? "r" | "g" | "b"
  : Fn extends "hsl"
    ? "h" | "s" | "l"
    : Fn extends "hwb"
      ? "h" | "w" | "b"
      : Fn extends "lab" | "oklab"
        ? "l" | "a" | "b"
        : Fn extends "lch" | "oklch"
          ? "l" | "c" | "h"
          : // color() — predefined-rgb channels
            "r" | "g" | "b"

// A channel token: a channel keyword for the fn, `none`, a number, a
// percentage, or a lenient calc(). Angles for hue are subsumed by the
// keyword/number cases (CSS permits a bare number for hue).
type IsChannelTok<Fn extends RelativeFn, T extends string> =
  Trim<T> extends ChannelKw<Fn> | "none"
    ? true
    : IsNumber<Trim<T>> extends true
      ? true
      : IsPercentage<Trim<T>> extends true
        ? true
        : IsCalc<T>

// The alpha after `/`: number | percentage | the `alpha` keyword | none | calc.
type IsAlphaTok<T extends string> =
  Trim<T> extends "none" | "alpha"
    ? true
    : IsNumber<Trim<T>> extends true
      ? true
      : IsPercentage<Trim<T>> extends true
        ? true
        : IsCalc<T>

// Validate the three channel tokens + optional `/ alpha`. The body has
// ALREADY had `from <color>` (and, for color(), the space ident) peeled.
type ValidChannels<
  Fn extends RelativeFn,
  Tokens extends string[],
> = Tokens extends [
  infer C1 extends string,
  infer C2 extends string,
  infer C3 extends string,
]
  ? And<IsChannelTok<Fn, C1>, And<IsChannelTok<Fn, C2>, IsChannelTok<Fn, C3>>>
  : Tokens extends [
        infer C1 extends string,
        infer C2 extends string,
        infer C3 extends string,
        "/",
        infer A extends string,
      ]
    ? And<
        IsChannelTok<Fn, C1>,
        And<IsChannelTok<Fn, C2>, And<IsChannelTok<Fn, C3>, IsAlphaTok<A>>>
      >
    : false

// After `from`, the rest is `<color> <channels…>`. For color() the
// channels may be preceded by a colorspace ident (peeled leniently).
type ValidFromBody<
  Fn extends RelativeFn,
  Tokens extends string[],
> = Tokens extends [
  "from",
  infer Src extends string,
  ...infer Rest extends string[],
]
  ? IsColorArg<Src> extends true
    ? Fn extends "color"
      ? // color(from <c> <space> <c1> <c2> <c3> …): peel the space ident.
        Rest extends [string, ...infer Ch extends string[]]
        ? ValidChannels<Fn, Ch>
        : false
      : ValidChannels<Fn, Rest>
    : false
  : false

/**
 * Strict relative-color validator. Resolves to `S` for `<fn>(from <color>
 * <c1> <c2> <c3> [/ <alpha>]?)` with per-space channel keywords enforced,
 * else `never`. Lenient on calc() bodies and channel magnitudes
 * (documented relaxation).
 */
export type RelativeColorLiteral<S extends string> =
  ParseFunction<Trim<S>> extends {
    name: infer N extends string
    args: infer Args extends string
  }
    ? N extends RelativeFn
      ? ValidFromBody<N, SplitBySpace<Args>> extends true
        ? S
        : never
      : never
    : never

// =====================================================================
// 6. TOP-LEVEL DISPATCH + CALL-SITE HELPER
// =====================================================================

/**
 * Strict literal validator for the three modern color-function families,
 * dispatched on the leading function name. Resolves to `S` on success,
 * `never` otherwise. A bare color literal (`rgb(255 0 0)` with no `from`)
 * is NOT in scope — that is `color-picker`'s domain.
 *
 * @example
 * type A = ColorFunctionLiteral<"color-mix(in srgb, #f00, #00f)"> // the literal
 * type B = ColorFunctionLiteral<"rgb(255 0 0)">                    // never
 */
export type ColorFunctionLiteral<S extends string> =
  ParseFunction<Trim<S>> extends {
    name: infer N extends string
    args: infer Args extends string
  }
    ? N extends "color-mix"
      ? ColorMixLiteral<S>
      : N extends "light-dark"
        ? LightDarkLiteral<S>
        : N extends RelativeFn
          ? StartsWith<Trim<Args>, "from "> extends true
            ? RelativeColorLiteral<S>
            : never
          : never
    : never

/**
 * Call-site validator helper. Mirrors `cssBoxShadow()` / `cssFilter()` /
 * `color()`. An invalid color function becomes a type error at the
 * argument.
 */
export const cssColorFn = <S extends string>(
  value: S & ColorFunctionLiteral<S>,
): S => value

// =====================================================================
// 7. SUGGESTION STRINGS — IntelliSense + onChange return types
// =====================================================================

/** Suggestion union for `color-mix(...)`. The STRICT tier is the gate. */
export type ColorMixString = `color-mix(in ${string}, ${string}, ${string})`

/** Suggestion union for a relative color. */
export type RelativeColorString = `${RelativeFn}(from ${string})`

/** Suggestion union for `light-dark(...)`. */
export type LightDarkString = `light-dark(${string}, ${string})`

/** Any color-function suggestion string. */
export type ColorFunctionString =
  | ColorMixString
  | RelativeColorString
  | LightDarkString

/** Mode → output-string map. Narrows `onChange` when `mode` is set. */
export interface ColorFunctionStringMap {
  "color-mix": ColorMixString
  relative: RelativeColorString
  "light-dark": LightDarkString
}

/** The `mode` prop key type. */
export type ColorFunctionMode = keyof ColorFunctionStringMap

// =====================================================================
// 8. UTILITY TYPES — operate on color-function literals at the type level
// =====================================================================

/**
 * Which family a literal is, or `never`.
 *
 * @example
 * type A = KindOf<"oklch(from #f00 l c h)"> // "relative"
 */
export type KindOf<S extends string> =
  ParseFunction<Trim<S>> extends {
    name: infer N extends string
    args: infer Args extends string
  }
    ? N extends "color-mix"
      ? "color-mix"
      : N extends "light-dark"
        ? "light-dark"
        : N extends RelativeFn
          ? StartsWith<Trim<Args>, "from "> extends true
            ? "relative"
            : never
          : never
    : never

/**
 * The interpolation colorspace of a `color-mix` literal, or `never`.
 *
 * @example
 * type A = MixSpaceOf<"color-mix(in oklch, #f00, #00f)"> // "oklch"
 */
export type MixSpaceOf<S extends string> =
  ParseFunction<Trim<S>> extends {
    name: "color-mix"
    args: infer Args extends string
  }
    ? SplitByComma<Args> extends [infer I extends string, ...string[]]
      ? SplitBySpace<I> extends ["in", infer Sp, ...string[]]
        ? Sp extends MixColorSpace
          ? Sp
          : never
        : never
      : never
    : never

/**
 * The function name of a relative-color literal, or `never`.
 *
 * @example
 * type A = RelativeFnOf<"oklch(from #f00 l c h)"> // "oklch"
 */
export type RelativeFnOf<S extends string> =
  ParseFunction<Trim<S>> extends {
    name: infer N extends string
    args: infer Args extends string
  }
    ? N extends RelativeFn
      ? StartsWith<Trim<Args>, "from "> extends true
        ? N
        : never
      : never
    : never

// Strip an optional trailing `<percentage>` token off a color-mix arg,
// keeping just the color string.
type MixColorOf<Tokens extends string[]> = Tokens extends [
  infer C extends string,
  ...string[],
]
  ? C
  : never

/**
 * The raw color-argument strings of a literal.
 *
 * @example
 * type A = ColorsOf<"light-dark(#fff, #000)">              // ["#fff", "#000"]
 * type B = ColorsOf<"color-mix(in srgb, #f00 30%, #00f)">  // ["#f00", "#00f"]
 * type C = ColorsOf<"oklch(from #f00 l c h)">              // ["#f00"]
 */
export type ColorsOf<S extends string> =
  KindOf<S> extends "light-dark"
    ? ParseFunction<Trim<S>> extends { args: infer Args extends string }
      ? SplitByComma<Args>
      : never
    : KindOf<S> extends "color-mix"
      ? ParseFunction<Trim<S>> extends { args: infer Args extends string }
        ? SplitByComma<Args> extends [
            string,
            infer A extends string,
            infer B extends string,
          ]
          ? [MixColorOf<SplitBySpace<A>>, MixColorOf<SplitBySpace<B>>]
          : never
        : never
      : KindOf<S> extends "relative"
        ? ParseFunction<Trim<S>> extends { args: infer Args extends string }
          ? SplitBySpace<Args> extends [
              "from",
              infer Src extends string,
              ...string[],
            ]
            ? [Src]
            : never
          : never
        : never

// =====================================================================
// 9. INTERNAL STATE — exported discriminated union, keyed by `kind`
//
// The tolerant superset the editor drives off. Values are kept as strings
// (they carry units / colors / calc), mirroring how the literal preserves
// raw text. Exported for advanced use (custom serialization).
// =====================================================================

export interface ColorMixState {
  kind: "color-mix"
  /** Interpolation colorspace. */
  space: string
  /** Optional hue-interpolation method (cylindrical spaces only). */
  hue?: string
  /** First color. */
  colorA: string
  /** Optional weight for the first color. */
  pctA?: string
  /** Second color. */
  colorB: string
  /** Optional weight for the second color. */
  pctB?: string
}

export interface RelativeColorState {
  kind: "relative"
  /** Relative-color function name. */
  fn: string
  /** Source color (after `from`). */
  from: string
  /** Optional colorspace ident (color() form only). */
  space?: string
  /** First channel token. */
  c1: string
  /** Second channel token. */
  c2: string
  /** Third channel token. */
  c3: string
  /** Optional alpha (after `/`). */
  alpha?: string
}

export interface LightDarkState {
  kind: "light-dark"
  /** Color used in a light color-scheme. */
  light: string
  /** Color used in a dark color-scheme. */
  dark: string
}

/** The editor's internal state — a discriminated union keyed by `kind`. */
export type ColorFunctionState =
  | ColorMixState
  | RelativeColorState
  | LightDarkState
