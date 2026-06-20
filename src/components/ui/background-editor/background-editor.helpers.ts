// =====================================================================
// background-editor.helpers.ts
//
// Pure runtime parse / format / classify for the CSS `background` shorthand —
// a comma-stacked list of layers painted back-to-front, each carrying an image
// (gradient / url / image-set / none), a position with an optional `/ <size>`,
// and repeat / attachment / origin / clip keywords; ONLY the final layer may
// carry a <color>. This is the SUPERSET of the strict type tier in
// background-editor.types.ts: it splits the structure (paren-aware comma split
// into layers, then per-layer space-token slotting) and surfaces a verdict as
// `error`, but keeps the literals the UI needs to round-trip (mirrors
// query-builder.helpers.ts / gradient-editor.helpers.ts).
//
// `classifyToken` is the runtime twin of the type `IsBgToken` — separately
// authored, reviewed together (the query-builder precedent). The same example
// tokens appear in both the type-test and the parse-test, so any drift fails a
// test. <color> defers to color-picker's `isColorString` (hex / functional
// forms — #fff / oklch(...), not named colors; spec §3.1 A7).
//
// Per-layer token slotting is order-free (the `||` ordering / cardinality is
// the spec §3.1 A4 deferral): tokens are classified by membership, in any
// order, and slotted by kind; a size token is the one that follows `/`.
//
// Spec: docs/superpowers/specs/2026-06-19-background-editor-design.md §4 / §4.1
// =====================================================================

import { isColorString } from "@/components/ui/color-picker"
import type { BgLayer } from "./background-editor.types"

// ---------------------------------------------------------------------------
// per-layer token vocabulary — runtime mirror of the type's keyword unions
// ---------------------------------------------------------------------------

const POSITION_KEYWORDS = ["left", "center", "right", "top", "bottom"] as const
const SIZE_KEYWORDS = ["cover", "contain", "auto"] as const
const REPEAT_KEYWORDS = [
  "repeat",
  "repeat-x",
  "repeat-y",
  "space",
  "round",
  "no-repeat",
] as const
const ATTACHMENT_KEYWORDS = ["scroll", "fixed", "local"] as const
const BOX_KEYWORDS = ["border-box", "padding-box", "content-box"] as const

const POSITION_SET = new Set<string>(POSITION_KEYWORDS)
const SIZE_SET = new Set<string>(SIZE_KEYWORDS)
const REPEAT_SET = new Set<string>(REPEAT_KEYWORDS)
const ATTACHMENT_SET = new Set<string>(ATTACHMENT_KEYWORDS)
const BOX_SET = new Set<string>(BOX_KEYWORDS)

// A <length-percentage> token: an optional sign, digits/dot, optional unit or %.
// Mirror of box-shadow-editor's LENGTHISH_RE.
const LENGTHISH_RE = /^-?[\d.]+[a-z%]*$/i

/** The kind a single background space-token classifies as. */
export type BgTokenKind =
  | "image"
  | "position"
  | "size"
  | "repeat"
  | "attachment"
  | "box"
  | "length"
  | "color"
  | "slash"
  | "unknown"

// ---------------------------------------------------------------------------
// classifyToken — runtime mirror of the type IsBgToken
// ---------------------------------------------------------------------------

/**
 * Classify a single background space-token — the runtime mirror of the type
 * `IsBgToken`. The position/size keyword overlap (`auto` etc. never collide)
 * resolves by checked order: slash, then keyword sets, then a length /
 * percentage, then a color (hex / functional, via color-picker's
 * `isColorString`) — checked BEFORE image so a functional color like
 * `oklch(...)` wins over the parenthesized-function image rule — then an image
 * (`none` or any other parenthesized function: gradient / url / image-set),
 * else `"unknown"`. Note: a color token is classified regardless of layer index —
 * the last-layer-only invariant is enforced by `parseBackground`, not here.
 */
export function classifyToken(token: string): BgTokenKind {
  const t = token.trim()
  if (t === "/") return "slash"
  if (POSITION_SET.has(t)) return "position"
  if (SIZE_SET.has(t)) return "size"
  if (REPEAT_SET.has(t)) return "repeat"
  if (ATTACHMENT_SET.has(t)) return "attachment"
  if (BOX_SET.has(t)) return "box"
  if (LENGTHISH_RE.test(t)) return "length"
  // A functional color (oklch(...) / rgb(...)) is also a parenthesized
  // function, so color must be checked BEFORE image — otherwise it would slot
  // as an image. Gradients / url() are not colors, so they fall through to
  // image. (A hex token like #fff is not parenthesized, so order is moot for it.)
  if (isColorString(t)) return "color"
  if (isImage(t)) return "image"
  return "unknown"
}

/** An image is `none` or any parenthesized function (gradient / url / image-set). */
function isImage(token: string): boolean {
  if (token === "none") return true
  return /^[a-z-]+\([\s\S]*\)$/i.test(token)
}

// ---------------------------------------------------------------------------
// paren-aware splitters
// ---------------------------------------------------------------------------

/**
 * Split a string on commas, ignoring commas inside parens. Trims each segment.
 * The top-level layer split — a gradient's inner commas stay intact.
 */
function splitTopLevelCommas(input: string): string[] {
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
 * Split a layer on whitespace, ignoring whitespace inside parens (so a gradient
 * / color function arrives as one token) and keeping a bare `/` as its own
 * token even when it abuts another token.
 */
function splitTopLevelSpaces(input: string): string[] {
  const trimmed = input.trim()
  if (trimmed === "") return []
  const out: string[] = []
  let depth = 0
  let buf = ""
  const flush = () => {
    if (buf !== "") {
      out.push(buf)
      buf = ""
    }
  }
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i]
    if (ch === "(") {
      depth++
      buf += ch
    } else if (ch === ")") {
      depth--
      buf += ch
    } else if (depth === 0 && /\s/.test(ch)) {
      flush()
    } else if (depth === 0 && ch === "/") {
      flush()
      out.push("/")
    } else {
      buf += ch
    }
  }
  flush()
  return out
}

// ---------------------------------------------------------------------------
// parseBackground — string → { layers, error }
// ---------------------------------------------------------------------------

function emptyLayer(): BgLayer {
  return {
    image: "",
    position: "",
    size: "",
    repeat: "",
    attachment: "",
    origin: "",
    clip: "",
  }
}

/**
 * Slot one layer's space-tokens into a `BgLayer`. Membership-based + order-free
 * (spec §3.1 A4): position keywords and lengths/percentages accumulate into
 * `position` until a `/` flips into `size`; the first box keyword is `origin`,
 * the second is `clip`; a color is allowed only when `allowColor` (the final
 * layer). Returns an error message string on an unrecognized / misplaced token,
 * else `null`.
 */
function parseLayer(
  src: string,
  allowColor: boolean,
): { layer: BgLayer; error: string | null } {
  const layer = emptyLayer()
  const tokens = splitTopLevelSpaces(src)
  if (tokens.length === 0) {
    return { layer, error: "an empty background layer" }
  }
  const positionParts: string[] = []
  const sizeParts: string[] = []
  let afterSlash = false

  for (const tok of tokens) {
    const kind = classifyToken(tok)
    switch (kind) {
      case "slash":
        afterSlash = true
        break
      case "position":
      case "length":
        if (afterSlash) sizeParts.push(tok)
        else positionParts.push(tok)
        break
      case "size":
        sizeParts.push(tok)
        break
      case "image":
        layer.image = tok
        break
      case "repeat":
        layer.repeat = tok
        break
      case "attachment":
        layer.attachment = tok
        break
      case "box":
        if (layer.origin === "") layer.origin = tok
        else layer.clip = tok
        break
      case "color":
        if (!allowColor) {
          return {
            layer,
            error: `a color is only allowed on the final layer: ${tok}`,
          }
        }
        layer.color = tok
        break
      default:
        return { layer, error: `unrecognized token: ${tok}` }
    }
  }

  if (positionParts.length > 0) layer.position = positionParts.join(" ")
  if (sizeParts.length > 0) layer.size = sizeParts.join(" ")
  return { layer, error: null }
}

/**
 * Parse a CSS `background` shorthand into its layer stack. The value is split
 * paren-aware on top-level commas into layers (a gradient's inner commas stay
 * intact); each layer's space-tokens are slotted into a `BgLayer`. A `<color>`
 * is permitted ONLY on the final layer (the index-aware invariant — spec §3):
 * a color in any non-final layer is an error. `error` is `null` on success and
 * a message otherwise; on error `layers` holds whatever parsed so far. Empty
 * input is an error.
 */
export function parseBackground(src: string): {
  layers: BgLayer[]
  error: string | null
} {
  const segments = splitTopLevelCommas(src)
  if (segments.length === 0) {
    return { layers: [], error: "empty background" }
  }

  const layers: BgLayer[] = []
  for (let i = 0; i < segments.length; i++) {
    const isFinal = i === segments.length - 1
    const { layer, error } = parseLayer(segments[i], isFinal)
    layers.push(layer)
    if (error !== null) return { layers, error }
  }
  return { layers, error: null }
}

// ---------------------------------------------------------------------------
// formatBackground — BgLayer[] → canonical string
// ---------------------------------------------------------------------------

/**
 * Serialize one layer in canonical token order: image, then `position` (with a
 * space-separated `/ size` when a size is present), then repeat, attachment,
 * origin, clip, and — only when `allowColor` (the final layer) — the color.
 */
function formatLayer(layer: BgLayer, allowColor: boolean): string {
  const parts: string[] = []
  if (layer.image !== "") parts.push(layer.image)
  if (layer.position !== "") {
    parts.push(
      layer.size !== "" ? `${layer.position} / ${layer.size}` : layer.position,
    )
  } else if (layer.size !== "") {
    parts.push(`/ ${layer.size}`)
  }
  if (layer.repeat !== "") parts.push(layer.repeat)
  if (layer.attachment !== "") parts.push(layer.attachment)
  if (layer.origin !== "") parts.push(layer.origin)
  if (layer.clip !== "") parts.push(layer.clip)
  if (allowColor && layer.color !== undefined && layer.color !== "") {
    parts.push(layer.color)
  }
  return parts.join(" ")
}

/**
 * Canonical re-serialization of a layer stack to a `background` value. Layers
 * join with `, `; within a layer, `position / size` uses a space-separated
 * slash; the `<color>` is emitted ONLY on the final layer (spec §3). An empty
 * list serializes to the empty string.
 */
export function formatBackground(layers: BgLayer[]): string {
  return layers
    .map((layer, i) => formatLayer(layer, i === layers.length - 1))
    .join(", ")
}

// ---------------------------------------------------------------------------
// option sources (<select> data) + defaults
// ---------------------------------------------------------------------------

/** The `<repeat>` keywords. */
export function repeatOptions(): readonly string[] {
  return REPEAT_KEYWORDS
}

/** The `<attachment>` keywords. */
export function attachmentOptions(): readonly string[] {
  return ATTACHMENT_KEYWORDS
}

/** The `<box>` keywords (origin / clip). */
export function boxOptions(): readonly string[] {
  return BOX_KEYWORDS
}

/** The `<size>` keywords (a length / percentage is also valid). */
export function sizeKeywords(): readonly string[] {
  return SIZE_KEYWORDS
}

/** A valid, parseable single-layer seed for a freshly-created editor. */
export function defaultBackground(): string {
  return "linear-gradient(#3b82f6, #8b5cf6) center / cover no-repeat"
}
