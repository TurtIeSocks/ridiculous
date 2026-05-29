// =====================================================================
// transform-builder.constants.ts
//
// Shared, render-free constants and small types for the transform builder
// UI: the function option-groups, the unit lists, the number/unit split
// regex, the unitless-kind set, and the 3D-preview scrub descriptors.
// Kept in a non-component module so the .tsx files stay component-only
// (avoids react-refresh/only-export-components churn).
// =====================================================================

import type { ArgKind } from "./transform-builder.helpers"
import type { TransformFunctionName } from "./transform-builder.types"

// ---------------------------------------------------------------------------
// Function groups (for the <select> option-groups)
// ---------------------------------------------------------------------------

export const FUNCTION_GROUPS: ReadonlyArray<{
  label: string
  fns: readonly TransformFunctionName[]
}> = [
  {
    label: "translate",
    fns: ["translate", "translateX", "translateY", "translateZ", "translate3d"],
  },
  { label: "scale", fns: ["scale", "scaleX", "scaleY", "scaleZ", "scale3d"] },
  {
    label: "rotate",
    fns: ["rotate", "rotateX", "rotateY", "rotateZ", "rotate3d"],
  },
  { label: "skew", fns: ["skew", "skewX", "skewY"] },
  { label: "matrix", fns: ["matrix", "matrix3d"] },
  { label: "perspective", fns: ["perspective"] },
]

// ---------------------------------------------------------------------------
// Units + the number/unit split
// ---------------------------------------------------------------------------

export const LENGTH_UNITS = ["px", "rem", "em", "%", "vw", "vh"] as const
export const ANGLE_UNITS = ["deg", "grad", "rad", "turn"] as const

/**
 * Split a dimension like `10px` / `-1.5e3rem` / `50%` into [number, unit].
 * The number requires at least one digit (rejecting `""`, a lone `-`, and a
 * bare unit) and admits an optional sign, fraction, and exponent; the unit is
 * letters or `%`. Non-matches are treated as opaque (calc()/var(), raw text).
 */
export const NUMBER_UNIT_RE =
  /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([a-z%]*)$/i

/** Kinds with no unit picker — the value is edited as raw text. */
export const UNITLESS: ReadonlySet<ArgKind> = new Set<ArgKind>([
  "number",
  "number-percentage",
])

// ---------------------------------------------------------------------------
// 3D-preview scrubbers
// ---------------------------------------------------------------------------

export interface Scrub {
  fn: TransformFunctionName
  label: string
  min: number
  max: number
  step: number
  unit: string
}

export const SCRUBS: readonly Scrub[] = [
  {
    fn: "translateX",
    label: "translateX",
    min: -100,
    max: 100,
    step: 1,
    unit: "px",
  },
  {
    fn: "translateY",
    label: "translateY",
    min: -100,
    max: 100,
    step: 1,
    unit: "px",
  },
  { fn: "rotate", label: "rotate", min: -180, max: 180, step: 1, unit: "deg" },
  { fn: "scale", label: "scale", min: 0, max: 2, step: 0.05, unit: "" },
  { fn: "skewX", label: "skewX", min: -45, max: 45, step: 1, unit: "deg" },
]
