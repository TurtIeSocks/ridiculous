"use client"

import { parseColor } from "@/components/ui/color-picker/color-picker"
import type {
  ColorString,
  GradientStop,
  InterpolationHueMethod,
  InterpolationSpace,
  PolarSpace,
} from "./gradient-editor.types"

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

// ---------------------------------------------------------------------------
// Sub-components (filled in Phase 4)
// ---------------------------------------------------------------------------
