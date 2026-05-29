import type { BasicShapeName, GeometryBox } from "./clip-path-editor.types"

// ---------------------------------------------------------------------------
// Shared constants for the clip-path editor UI
// ---------------------------------------------------------------------------

export const SHAPES: readonly BasicShapeName[] = [
  "inset",
  "circle",
  "ellipse",
  "polygon",
]

export const GEOMETRY_BOXES: readonly GeometryBox[] = [
  "margin-box",
  "border-box",
  "padding-box",
  "content-box",
  "fill-box",
  "stroke-box",
  "view-box",
]

export const LP_UNITS = ["%", "px", "rem", "em", "vw", "vh"] as const

export const RADIUS_KEYWORDS = ["closest-side", "farthest-side"] as const

/**
 * Which CSS property the live preview targets. Both `clip-path` and
 * `shape-outside` share the identical basic-shape grammar.
 */
export type ClipMode = "clip-path" | "shape-outside"
