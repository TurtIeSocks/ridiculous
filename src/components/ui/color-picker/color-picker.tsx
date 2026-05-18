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

export function parseHex(
  value: string,
): { r: number; g: number; b: number; a: number } | null {
  const match = value.match(/^#([0-9a-f]{3,8})$/i)
  if (!match) return null
  const body = match[1]
  const read = (hex: string) => parseInt(hex, 16) / 255
  if (body.length === 3) {
    return {
      r: read(body[0].repeat(2)),
      g: read(body[1].repeat(2)),
      b: read(body[2].repeat(2)),
      a: 1,
    }
  }
  if (body.length === 4) {
    return {
      r: read(body[0].repeat(2)),
      g: read(body[1].repeat(2)),
      b: read(body[2].repeat(2)),
      a: read(body[3].repeat(2)),
    }
  }
  if (body.length === 6) {
    return {
      r: read(body.slice(0, 2)),
      g: read(body.slice(2, 4)),
      b: read(body.slice(4, 6)),
      a: 1,
    }
  }
  if (body.length === 8) {
    return {
      r: read(body.slice(0, 2)),
      g: read(body.slice(2, 4)),
      b: read(body.slice(4, 6)),
      a: read(body.slice(6, 8)),
    }
  }
  return null
}

export function parseRgb(
  value: string,
): { r: number; g: number; b: number; a: number } | null {
  const match = value.match(
    /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/i,
  )
  if (!match) return null
  const channel = (raw: string) =>
    raw.endsWith("%") ? parseFloat(raw) / 100 : parseFloat(raw) / 255
  const r = channel(match[1])
  const g = channel(match[2])
  const b = channel(match[3])
  const a = match[4] != null ? parseAlphaToken(match[4]) : 1
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  return { r, g, b, a }
}

// ---------------------------------------------------------------------------
// Color space conversions
// ---------------------------------------------------------------------------

export function linearToSrgb(x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
}

export function srgbToLinear(x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
}
