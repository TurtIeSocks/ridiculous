"use client"

import type { ColorString } from "@/components/ui/color-picker"
import { parseColor } from "@/components/ui/color-picker/color-picker"
import type {
  GradientStop,
  GradientType,
  InterpolationHueMethod,
  InterpolationSpace,
  PolarSpace,
} from "./gradient-editor.types"

export interface InternalState {
  type: GradientType
  stops: GradientStop[]
  /** Linear only. Degrees, 0 = to top, 90 = to right, 180 = to bottom (CSS default), 270 = to left. */
  angle: number
  /** Radial only. */
  shape: "circle" | "ellipse"
  /** Radial only. */
  size: "closest-side" | "closest-corner" | "farthest-side" | "farthest-corner"
  /** Radial + conic. Percentages 0..100. */
  position: { x: number; y: number }
  /** Conic only. Degrees. */
  fromAngle: number
  interpolation: {
    space: InterpolationSpace
    hueMethod?: InterpolationHueMethod
  }
}

// ---------------------------------------------------------------------------
// Component (top of file)
// ---------------------------------------------------------------------------

export function GradientEditor() {
  return null
}

// ---------------------------------------------------------------------------
// Parsing / formatting
// ---------------------------------------------------------------------------

/**
 * Split a string on commas, ignoring commas inside parens. Trims each segment.
 *
 * @example
 * splitTopLevelCommas("rgb(1, 2, 3), red") // ["rgb(1, 2, 3)", "red"]
 */
export function splitTopLevelCommas(input: string): string[] {
  const trimmed = input.trim()
  if (trimmed === "") return []
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i]
    if (ch === "(") depth++
    else if (ch === ")") depth--
    else if (ch === "," && depth === 0) {
      out.push(trimmed.slice(start, i).trim())
      start = i + 1
    }
  }
  out.push(trimmed.slice(start).trim())
  return out
}

/**
 * Parse a single gradient stop. The position is optional; when absent,
 * returns `position: null` so the caller can auto-distribute.
 *
 * @example
 * parseStop("#ff0000 50%") // { color: "#ff0000", position: 50 }
 * parseStop("oklch(0.5 0.1 240)") // { color: "oklch(0.5 0.1 240)", position: null }
 */
export function parseStop(
  input: string,
): { color: ColorString; position: number | null } | null {
  // The position (if present) is the LAST whitespace-separated token outside parens.
  // Walk backwards, find the split point.
  const trimmed = input.trim()
  let depth = 0
  let splitAt = -1
  for (let i = trimmed.length - 1; i >= 0; i--) {
    const ch = trimmed[i]
    if (ch === ")") depth++
    else if (ch === "(") depth--
    else if (ch === " " && depth === 0) {
      splitAt = i
      break
    }
  }

  let colorPart = trimmed
  let positionPart: string | null = null
  if (splitAt !== -1) {
    const tail = trimmed.slice(splitAt + 1).trim()
    if (tail.endsWith("%")) {
      const n = parseFloat(tail.slice(0, -1))
      if (!Number.isNaN(n)) {
        colorPart = trimmed.slice(0, splitAt).trim()
        positionPart = tail
      }
    }
  }

  if (parseColor(colorPart) == null) return null
  return {
    color: colorPart as ColorString,
    position: positionPart == null ? null : parseFloat(positionPart),
  }
}

export function formatStop(stop: GradientStop): string {
  return `${stop.color} ${Math.round(stop.position)}%`
}

const INTERPOLATION_SPACES = ["srgb", "oklch", "oklab", "hsl", "hwb"] as const
const POLAR_SPACES: readonly PolarSpace[] = ["oklch", "hsl", "hwb"]

interface Interpolation {
  space: InterpolationSpace
  hueMethod?: InterpolationHueMethod
}

/**
 * Parse a CSS interpolation clause like `in oklch longer hue`.
 * Returns null if the prefix is missing or the space is unrecognized.
 */
export function parseInterpolation(input: string): Interpolation | null {
  const trimmed = input.trim()
  if (!trimmed.startsWith("in ")) return null
  const body = trimmed.slice(3).trim()
  // Possible forms: "<space>", "<space> longer hue", "<space> shorter hue"
  const huePartMatch = body.match(/^(\S+)\s+(longer|shorter)\s+hue$/)
  if (huePartMatch) {
    const space = huePartMatch[1] as InterpolationSpace
    if (!INTERPOLATION_SPACES.includes(space)) return null
    return { space, hueMethod: huePartMatch[2] as InterpolationHueMethod }
  }
  const space = body as InterpolationSpace
  if (!INTERPOLATION_SPACES.includes(space)) return null
  return { space, hueMethod: undefined }
}

/**
 * Format an interpolation as a clause for inclusion in a gradient string,
 * including the trailing comma. Returns empty string when the space is `srgb`
 * with no hue method (CSS default — keep output clean).
 */
export function formatInterpolation(interp: Interpolation): string {
  // srgb is CSS default — omit unless hue method is set (which is N/A for cartesian).
  if (interp.space === "srgb") return ""
  const isPolar = POLAR_SPACES.includes(interp.space as PolarSpace)
  if (isPolar && interp.hueMethod) {
    return `in ${interp.space} ${interp.hueMethod} hue, `
  }
  return `in ${interp.space}, `
}

const SIDE_TO_ANGLE: Record<string, number> = {
  "to top": 0,
  "to top right": 45,
  "to right": 90,
  "to bottom right": 135,
  "to bottom": 180,
  "to bottom left": 225,
  "to left": 270,
  "to top left": 315,
}

const RADIAL_SHAPES = ["circle", "ellipse"] as const
const RADIAL_SIZES = [
  "closest-side",
  "closest-corner",
  "farthest-side",
  "farthest-corner",
] as const

/**
 * Parse a CSS gradient string into the editor's internal state.
 * Returns null on parse failure or when the gradient has fewer than 2 stops.
 */
export function parseGradient(value: string): InternalState | null {
  const trimmed = value.trim()
  const prefixMatch = trimmed.match(/^(linear|radial|conic)-gradient\((.*)\)$/s)
  if (!prefixMatch) return null
  const type = prefixMatch[1] as GradientType
  const body = prefixMatch[2]

  const segments = splitTopLevelCommas(body)
  if (segments.length === 0) return null

  // Try to extract interpolation from first segment.
  let interpolation: {
    space: InterpolationSpace
    hueMethod?: InterpolationHueMethod
  } = {
    space: "srgb",
  }
  let preludeAndStops = segments
  const interpFromFirst = parseInterpolation(segments[0])
  if (interpFromFirst) {
    interpolation = interpFromFirst
    preludeAndStops = segments.slice(1)
  }

  // Determine if the next segment is a prelude (angle/shape/from) or a stop.
  let preludeIndex = 0
  const first = preludeAndStops[0] ?? ""
  const looksLikePrelude =
    /^(\d+(\.\d+)?deg|to )/.test(first) || // linear angle
    /^(circle|ellipse|closest|farthest)/.test(first) || // radial shape/size
    first.startsWith("at ") || // radial position alone
    first.startsWith("from ") // conic

  // Type-specific prelude extraction
  let angle = 180 // linear default = to bottom
  let shape: InternalState["shape"] = "ellipse"
  let size: InternalState["size"] = "farthest-corner"
  let position = { x: 50, y: 50 }
  let fromAngle = 0

  if (looksLikePrelude && type === "linear") {
    const prelude = preludeAndStops[0]
    if (SIDE_TO_ANGLE[prelude] != null) {
      angle = SIDE_TO_ANGLE[prelude]
    } else {
      const m = prelude.match(/^(\d+(?:\.\d+)?)deg$/)
      if (m) angle = parseFloat(m[1])
      else return null
    }
    preludeIndex = 1
  } else if (looksLikePrelude && type === "radial") {
    const prelude = preludeAndStops[0]
    // Tokens: [shape] [size] [at <pos>]
    const tokens = prelude.split(/\s+/)
    let i = 0
    if (RADIAL_SHAPES.includes(tokens[i] as (typeof RADIAL_SHAPES)[number])) {
      shape = tokens[i] as InternalState["shape"]
      i++
    }
    if (RADIAL_SIZES.includes(tokens[i] as (typeof RADIAL_SIZES)[number])) {
      size = tokens[i] as InternalState["size"]
      i++
    }
    if (tokens[i] === "at") {
      i++
      const x = parsePercent(tokens[i++])
      const y = parsePercent(tokens[i++])
      if (x == null || y == null) return null
      position = { x, y }
    }
    preludeIndex = 1
  } else if (looksLikePrelude && type === "conic") {
    const prelude = preludeAndStops[0]
    // Tokens: [from <angle>] [at <pos>]
    const tokens = prelude.split(/\s+/)
    let i = 0
    if (tokens[i] === "from") {
      i++
      const m = tokens[i++].match(/^(-?\d+(?:\.\d+)?)deg$/)
      if (!m) return null
      fromAngle = parseFloat(m[1])
    }
    if (tokens[i] === "at") {
      i++
      const x = parsePercent(tokens[i++])
      const y = parsePercent(tokens[i++])
      if (x == null || y == null) return null
      position = { x, y }
    }
    preludeIndex = 1
  }

  // Remaining segments are stops.
  const stopSegments = preludeAndStops.slice(preludeIndex)
  if (stopSegments.length < 2) return null

  const rawStops = stopSegments.map(parseStop)
  if (rawStops.some((s) => s == null)) return null

  // Auto-distribute positions when null.
  const count = rawStops.length
  const stops: GradientStop[] = rawStops.map((raw, i) => ({
    color: raw!.color,
    position: raw!.position != null ? raw!.position : (i / (count - 1)) * 100,
  }))

  return {
    type,
    stops,
    angle,
    shape,
    size,
    position,
    fromAngle,
    interpolation,
  }
}

function parsePercent(input: string | undefined): number | null {
  if (!input) return null
  if (!input.endsWith("%")) return null
  const n = parseFloat(input.slice(0, -1))
  return Number.isNaN(n) ? null : n
}

// ---------------------------------------------------------------------------
// Sub-components (filled in Phase 4)
// ---------------------------------------------------------------------------
