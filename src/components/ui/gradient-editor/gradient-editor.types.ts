// =====================================================================
// 1. SUGGESTION STRINGS — IntelliSense surface + onChange return types.
// =====================================================================

export type LinearGradientString =
  | `linear-gradient(${string})`
  | `linear-gradient(in ${string}, ${string})`

export type RadialGradientString =
  | `radial-gradient(${string})`
  | `radial-gradient(in ${string}, ${string})`

export type ConicGradientString =
  | `conic-gradient(${string})`
  | `conic-gradient(in ${string}, ${string})`

export type GradientString =
  | LinearGradientString
  | RadialGradientString
  | ConicGradientString

export interface GradientStringMap {
  linear: LinearGradientString
  radial: RadialGradientString
  conic: ConicGradientString
}

export type GradientType = keyof GradientStringMap

// =====================================================================
// 2. INTERPOLATION
// =====================================================================

export type InterpolationSpace = "srgb" | "oklch" | "oklab" | "hsl" | "hwb"
export type InterpolationHueMethod = "shorter" | "longer"

/** Polar spaces support hue interpolation method. Cartesian (srgb, oklab) don't. */
export type PolarSpace = Extract<InterpolationSpace, "oklch" | "hsl" | "hwb">

// =====================================================================
// 3. UTILITY TYPES — extract structural info at the type level.
// =====================================================================

/**
 * Extract gradient type from a literal.
 * @example
 * type T = GradientTypeOf<"linear-gradient(red, blue)">  // "linear"
 */
export type GradientTypeOf<S extends string> =
  S extends `linear-gradient(${string}`
    ? "linear"
    : S extends `radial-gradient(${string}`
      ? "radial"
      : S extends `conic-gradient(${string}`
        ? "conic"
        : never

/**
 * Extract interpolation space from a literal, if declared.
 * @example
 * type T = InterpolationOf<"linear-gradient(in oklch, red, blue)">  // "oklch"
 */
export type InterpolationOf<S extends string> =
  S extends `${string}-gradient(in ${infer Space}, ${string}`
    ? Space extends `${infer Pure} longer hue` | `${infer Pure} shorter hue`
      ? Pure
      : Space
    : never

// =====================================================================
// 4. INTERNAL STOP REPRESENTATION (exported for advanced use)
// =====================================================================

import type { ColorString } from "@/components/ui/color-picker"

/**
 * A single color stop in the editor's internal representation.
 * Reuses ColorString from the color-picker registry item.
 */
export interface GradientStop {
  /** Color in any of the 6 supported color modes. */
  color: ColorString
  /** Position 0..100. */
  position: number
}
