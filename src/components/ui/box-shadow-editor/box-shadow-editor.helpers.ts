// =====================================================================
// box-shadow-editor.helpers.ts
//
// Pure runtime parse / format for the CSS `box-shadow` property — a
// COMMA-separated list of shadow layers. This is the SUPERSET of the
// strict type tier: it tolerates calc()/var() tokens (kept verbatim),
// bare keyword colors (`red`), and a LEADING color (normalizing it to
// color-last), validates per-layer arity, and is the single source of
// truth the UI drives off.
//
// Each layer:  [inset?] <offset-x> <offset-y> <blur>? <spread>? <color>?
// =====================================================================

import type { ShadowLayer } from "./box-shadow-editor.types"

// ---------------------------------------------------------------------------
// Top-level splitter (paren-aware, runtime mirror of the kit combinator)
// ---------------------------------------------------------------------------

/** Split on `sep` only at bracket depth 0. */
function splitTopLevel(src: string, sep: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ""
  for (const ch of src) {
    if (ch === "(" || ch === "[") depth++
    else if (ch === ")" || ch === "]") depth--
    if (ch === sep && depth === 0) {
      out.push(cur)
      cur = ""
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

/** Split the comma layer list into trimmed layer strings (drops empties). */
function splitLayers(src: string): string[] {
  return splitTopLevel(src, ",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/** Split a layer into space-separated tokens (drops empty runs). */
function splitTokens(layer: string): string[] {
  return splitTopLevel(layer, " ")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

// A token that looks like a CSS length / numeric value (possibly an opaque
// calc()/var()) — NOT a color and NOT the `inset` keyword.
const LENGTHISH_RE = /^-?[\d.]+[a-z%]*$/i

function isLengthish(token: string): boolean {
  if (LENGTHISH_RE.test(token)) return true
  // calc()/var()/min()/max()/clamp()/env() length expressions are opaque.
  return /^(calc|var|min|max|clamp|env)\(/i.test(token)
}

// ---------------------------------------------------------------------------
// parseLayer — tokens → ShadowLayer | null
// ---------------------------------------------------------------------------

/**
 * Build one ShadowLayer from a layer's tokens. Accepts `inset` leading or
 * trailing, and a color before OR after the lengths (CSS allows either);
 * normalizes to inset-leading + color-last. Requires 2-4 length tokens,
 * at most one color, at most one inset.
 */
function parseLayer(tokens: string[]): ShadowLayer | null {
  let inset = false
  let insetSeen = false
  const lengths: string[] = []
  let color: string | undefined

  for (const token of tokens) {
    if (token.toLowerCase() === "inset") {
      if (insetSeen) return null // a second inset — invalid
      insetSeen = true
      inset = true
    } else if (isLengthish(token)) {
      lengths.push(token)
    } else if (color === undefined) {
      color = token
    } else {
      return null // a second non-length, non-inset token — invalid
    }
  }

  if (lengths.length < 2 || lengths.length > 4) return null

  const [offsetX, offsetY, blur, spread] = lengths
  const layer: ShadowLayer = { inset, offsetX, offsetY }
  if (blur !== undefined) layer.blur = blur
  if (spread !== undefined) layer.spread = spread
  if (color !== undefined) layer.color = color
  return layer
}

// ---------------------------------------------------------------------------
// parseBoxShadow — string → ShadowLayer[] | null
// ---------------------------------------------------------------------------

/**
 * Parse a CSS `box-shadow` value into typed layers, or `null` on any
 * syntax / arity error. `none` / empty → `[]`. Tolerant: keeps calc()/var()
 * verbatim, accepts bare keyword colors and a leading color (normalized to
 * color-last).
 */
export function parseBoxShadow(src: string): ShadowLayer[] | null {
  const trimmed = src.trim()
  if (trimmed === "" || trimmed === "none") return []

  const layerStrings = splitLayers(trimmed)
  if (layerStrings.length === 0) return []

  const layers: ShadowLayer[] = []
  for (const layerStr of layerStrings) {
    const tokens = splitTokens(layerStr)
    const layer = parseLayer(tokens)
    if (layer === null) return null
    layers.push(layer)
  }
  return layers
}

/** Runtime mirror of `LayerCountOf` — the number of layers. */
export function boxShadowLayerCount(src: string): number {
  const layers = parseBoxShadow(src)
  if (layers === null) return 0
  return layers.length
}

// ---------------------------------------------------------------------------
// defaultLayer — seed a fresh layer
// ---------------------------------------------------------------------------

/** A sensible default layer — a soft drop shadow. */
export function defaultLayer(): ShadowLayer {
  return {
    inset: false,
    offsetX: "0px",
    offsetY: "4px",
    blur: "8px",
    color: "rgb(0 0 0 / 0.25)",
  }
}

// ---------------------------------------------------------------------------
// layerToCss / formatBoxShadow — canonical serialization
// ---------------------------------------------------------------------------

/**
 * Serialize one layer to its CSS string: `[inset ]x y[ blur][ spread][ color]`
 * — inset leading, color last.
 */
export function layerToCss(layer: ShadowLayer): string {
  const parts: string[] = []
  if (layer.inset) parts.push("inset")
  parts.push(layer.offsetX, layer.offsetY)
  if (layer.blur !== undefined) parts.push(layer.blur)
  if (layer.spread !== undefined) parts.push(layer.spread)
  if (layer.color !== undefined) parts.push(layer.color)
  return parts.join(" ")
}

/** Canonical re-serialization of a layer list. Empty → `none`. */
export function formatBoxShadow(layers: ShadowLayer[]): string {
  if (layers.length === 0) return "none"
  return layers.map(layerToCss).join(", ")
}

// ---------------------------------------------------------------------------
// ParseResult facade
// ---------------------------------------------------------------------------

export interface ParseResult {
  layers: ShadowLayer[] | null
  error: string | null
}
