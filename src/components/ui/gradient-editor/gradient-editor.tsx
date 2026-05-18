"use client"

import { parseColor } from "@/components/ui/color-picker/color-picker"
import type { ColorString, GradientStop } from "./gradient-editor.types"

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

// ---------------------------------------------------------------------------
// Sub-components (filled in Phase 4)
// ---------------------------------------------------------------------------
