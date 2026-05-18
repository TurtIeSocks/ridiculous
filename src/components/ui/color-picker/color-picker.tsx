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

export function parseHsl(
  value: string,
): { h: number; s: number; l: number; a: number } | null {
  const match = value.match(
    /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/i,
  )
  if (!match) return null
  const h = parseFloat(match[1])
  const s = parseFloat(match[2]) / 100
  const l = parseFloat(match[3]) / 100
  const a = match[4] != null ? parseAlphaToken(match[4]) : 1
  if ([h, s, l].some((n) => Number.isNaN(n))) return null
  return { h, s, l, a }
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

export function hslToSrgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  const chroma = (1 - Math.abs(2 * l - 1)) * s
  const hh = (((h % 360) + 360) % 360) / 60
  const x = chroma * (1 - Math.abs((hh % 2) - 1))
  let r1 = 0
  let g1 = 0
  let b1 = 0
  if (hh < 1) [r1, g1, b1] = [chroma, x, 0]
  else if (hh < 2) [r1, g1, b1] = [x, chroma, 0]
  else if (hh < 3) [r1, g1, b1] = [0, chroma, x]
  else if (hh < 4) [r1, g1, b1] = [0, x, chroma]
  else if (hh < 5) [r1, g1, b1] = [x, 0, chroma]
  else [r1, g1, b1] = [chroma, 0, x]
  const m = l - chroma / 2
  return { r: r1 + m, g: g1 + m, b: b1 + m }
}

export function srgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h *= 60
  if (h < 0) h += 360
  return { h, s, l }
}
