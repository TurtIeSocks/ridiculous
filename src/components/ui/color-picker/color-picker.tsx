"use client"

// ---------------------------------------------------------------------------
// Component (top of file — filled in Phase 5)
// ---------------------------------------------------------------------------

export function ColorPicker() {
  return null
}

// ---------------------------------------------------------------------------
// Parsing / formatting (filled below)
// ---------------------------------------------------------------------------

export function parseAlphaToken(raw: string): number {
  return raw.endsWith("%") ? parseFloat(raw) / 100 : parseFloat(raw)
}

export function trimNumber(n: number): number {
  return parseFloat(n.toFixed(4))
}

export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n
}

// ---------------------------------------------------------------------------
// Color space conversions
// ---------------------------------------------------------------------------
