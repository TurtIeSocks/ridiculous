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
// 3. UTILITY TYPES
// =====================================================================

// =====================================================================
// 4. INTERNAL STOP REPRESENTATION
// =====================================================================
