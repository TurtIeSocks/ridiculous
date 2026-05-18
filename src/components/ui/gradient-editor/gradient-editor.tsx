"use client"

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

// ---------------------------------------------------------------------------
// Sub-components (filled in Phase 4)
// ---------------------------------------------------------------------------
