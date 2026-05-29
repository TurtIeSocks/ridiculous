// =====================================================================
// transition-editor.helpers.ts
//
// Pure runtime parse / format for the CSS `transition` AND `animation`
// shorthands — each a COMMA-separated list of layers whose space-separated
// tokens are classified by KIND (largely order-independent within a layer).
// This is the SUPERSET of the strict type tier: it tolerates calc()/var()
// tokens (kept verbatim) and applies the SAME token-kind precedence the type
// tier uses (design §3). It is the single source of truth the UI drives off.
//
// Transition layer:  property? duration? delay? easing? allow-discrete?
//   (first <time> = duration, second = delay)
// Animation layer:   duration? delay? easing? iteration? direction? fill?
//   play-state? name?
// =====================================================================

import type {
  AnimationDirection,
  AnimationFillMode,
  AnimationLayer,
  AnimationPlayState,
  EditorMode,
  TransitionLayer,
} from "./transition-editor.types"

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

// ---------------------------------------------------------------------------
// Token classifiers (runtime mirrors of the type-tier predicates)
// ---------------------------------------------------------------------------

// A <time> token (Ns / Nms) OR an opaque math function kept verbatim.
const TIME_RE = /^-?[\d.]+(s|ms)$/i
const OPAQUE_FN_RE = /^(calc|var|min|max|clamp|env)\(/i

function isTimeish(token: string): boolean {
  return TIME_RE.test(token) || OPAQUE_FN_RE.test(token)
}

// A bare <number> (no unit) — iteration count.
const NUMBER_RE = /^[+-]?[\d.]+$/

function isNumberish(token: string): boolean {
  return NUMBER_RE.test(token)
}

// An <easing-function>: a CSS easing keyword or a known easing function call.
const EASING_KEYWORDS = new Set([
  "linear",
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "step-start",
  "step-end",
])
const EASING_FN_RE = /^(cubic-bezier|steps|linear)\(/i

function isEasingish(token: string): boolean {
  return EASING_KEYWORDS.has(token.toLowerCase()) || EASING_FN_RE.test(token)
}

// A weak <custom-ident>: non-empty, ident-safe chars, no leading digit.
const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/

function isIdent(token: string): boolean {
  return IDENT_RE.test(token)
}

const DIRECTIONS = new Set<AnimationDirection>([
  "normal",
  "reverse",
  "alternate",
  "alternate-reverse",
])
const FILL_MODES = new Set<AnimationFillMode>([
  "none",
  "forwards",
  "backwards",
  "both",
])
const PLAY_STATES = new Set<AnimationPlayState>(["running", "paused"])

// ---------------------------------------------------------------------------
// parseTransitionLayer — tokens → TransitionLayer | null
// ---------------------------------------------------------------------------

/**
 * Build one TransitionLayer from a layer's tokens, classified by kind with the
 * type-tier precedence: allow-discrete → <time> → easing → all/none → ident.
 * First <time> = duration, second = delay. Enforces per-kind caps.
 */
function parseTransitionLayer(tokens: string[]): TransitionLayer | null {
  if (tokens.length === 0) return null
  const layer: TransitionLayer = {}
  const times: string[] = []

  for (const token of tokens) {
    if (token.toLowerCase() === "allow-discrete") {
      if (layer.allowDiscrete) return null
      layer.allowDiscrete = true
    } else if (isTimeish(token)) {
      if (times.length === 2) return null
      times.push(token)
    } else if (isEasingish(token)) {
      if (layer.easing !== undefined) return null
      layer.easing = token
    } else if (token === "all" || token === "none") {
      if (layer.property !== undefined) return null
      layer.property = token
    } else if (isIdent(token)) {
      if (layer.property !== undefined) return null
      layer.property = token
    } else {
      return null // unknown token
    }
  }

  if (times[0] !== undefined) layer.duration = times[0]
  if (times[1] !== undefined) layer.delay = times[1]
  return layer
}

// ---------------------------------------------------------------------------
// parseAnimationLayer — tokens → AnimationLayer | null
// ---------------------------------------------------------------------------

/**
 * Build one AnimationLayer. Precedence: <time> → infinite/<number> →
 * direction → fill-mode → play-state → easing → ident name. First <time> =
 * duration, second = delay.
 */
function parseAnimationLayer(tokens: string[]): AnimationLayer | null {
  if (tokens.length === 0) return null
  const layer: AnimationLayer = {}
  const times: string[] = []

  for (const token of tokens) {
    const lower = token.toLowerCase()
    if (isTimeish(token)) {
      if (times.length === 2) return null
      times.push(token)
    } else if (lower === "infinite" || isNumberish(token)) {
      if (layer.iterationCount !== undefined) return null
      layer.iterationCount = token
    } else if (DIRECTIONS.has(lower as AnimationDirection)) {
      if (layer.direction !== undefined) return null
      layer.direction = lower as AnimationDirection
    } else if (FILL_MODES.has(lower as AnimationFillMode)) {
      if (layer.fillMode !== undefined) return null
      layer.fillMode = lower as AnimationFillMode
    } else if (PLAY_STATES.has(lower as AnimationPlayState)) {
      if (layer.playState !== undefined) return null
      layer.playState = lower as AnimationPlayState
    } else if (isEasingish(token)) {
      if (layer.easing !== undefined) return null
      layer.easing = token
    } else if (isIdent(token)) {
      if (layer.name !== undefined) return null
      layer.name = token
    } else {
      return null // unknown token
    }
  }

  if (times[0] !== undefined) layer.duration = times[0]
  if (times[1] !== undefined) layer.delay = times[1]
  return layer
}

// ---------------------------------------------------------------------------
// parseTransition / parseAnimation — string → layers | null
// ---------------------------------------------------------------------------

/**
 * Parse a CSS `transition` value into typed layers, or `null` on any
 * cardinality / unknown-token / syntax error. `none` / empty → `[]`. Tolerant:
 * keeps calc()/var() verbatim.
 */
export function parseTransition(src: string): TransitionLayer[] | null {
  const trimmed = src.trim()
  if (trimmed === "" || trimmed === "none") return []
  const layerStrings = splitLayers(trimmed)
  if (layerStrings.length === 0) return []
  const layers: TransitionLayer[] = []
  for (const layerStr of layerStrings) {
    const layer = parseTransitionLayer(splitTokens(layerStr))
    if (layer === null) return null
    layers.push(layer)
  }
  return layers
}

/**
 * Parse a CSS `animation` value into typed layers, or `null` on error.
 * `none` / empty → `[]`. Tolerant of calc()/var().
 */
export function parseAnimation(src: string): AnimationLayer[] | null {
  const trimmed = src.trim()
  if (trimmed === "" || trimmed === "none") return []
  const layerStrings = splitLayers(trimmed)
  if (layerStrings.length === 0) return []
  const layers: AnimationLayer[] = []
  for (const layerStr of layerStrings) {
    const layer = parseAnimationLayer(splitTokens(layerStr))
    if (layer === null) return null
    layers.push(layer)
  }
  return layers
}

/** Runtime mirror of `LayerCountOf` for either mode (invalid → 0). */
export function layerCount(mode: EditorMode, src: string): number {
  const layers =
    mode === "transition" ? parseTransition(src) : parseAnimation(src)
  return layers === null ? 0 : layers.length
}

// ---------------------------------------------------------------------------
// defaults — seed a fresh layer
// ---------------------------------------------------------------------------

/** A sensible default transition layer — animate all over 200ms ease. */
export function defaultTransitionLayer(): TransitionLayer {
  return { property: "all", duration: "200ms", easing: "ease" }
}

/** A sensible default animation layer — the `slide` keyframes over 1s ease. */
export function defaultAnimationLayer(): AnimationLayer {
  return { name: "slide", duration: "1s", easing: "ease", iterationCount: "1" }
}

// ---------------------------------------------------------------------------
// layerToCss / format — canonical serialization
// ---------------------------------------------------------------------------

/**
 * Serialize one transition layer in canonical order:
 * `property? duration? delay? easing? allow-discrete?` (absent tokens omitted).
 */
export function transitionLayerToCss(layer: TransitionLayer): string {
  const parts: string[] = []
  if (layer.property !== undefined) parts.push(layer.property)
  if (layer.duration !== undefined) parts.push(layer.duration)
  if (layer.delay !== undefined) parts.push(layer.delay)
  if (layer.easing !== undefined) parts.push(layer.easing)
  if (layer.allowDiscrete) parts.push("allow-discrete")
  return parts.join(" ")
}

/**
 * Serialize one animation layer in canonical order:
 * `duration? delay? easing? iteration? direction? fill-mode? play-state? name?`.
 */
export function animationLayerToCss(layer: AnimationLayer): string {
  const parts: string[] = []
  if (layer.duration !== undefined) parts.push(layer.duration)
  if (layer.delay !== undefined) parts.push(layer.delay)
  if (layer.easing !== undefined) parts.push(layer.easing)
  if (layer.iterationCount !== undefined) parts.push(layer.iterationCount)
  if (layer.direction !== undefined) parts.push(layer.direction)
  if (layer.fillMode !== undefined) parts.push(layer.fillMode)
  if (layer.playState !== undefined) parts.push(layer.playState)
  if (layer.name !== undefined) parts.push(layer.name)
  return parts.join(" ")
}

/** Canonical re-serialization of a transition layer list. Empty → `none`. */
export function formatTransition(layers: TransitionLayer[]): string {
  if (layers.length === 0) return "none"
  return layers.map(transitionLayerToCss).join(", ")
}

/** Canonical re-serialization of an animation layer list. Empty → `none`. */
export function formatAnimation(layers: AnimationLayer[]): string {
  if (layers.length === 0) return "none"
  return layers.map(animationLayerToCss).join(", ")
}

// ---------------------------------------------------------------------------
// ParseResult facade (mirrors box-shadow-editor)
// ---------------------------------------------------------------------------

export interface ParseResult {
  transition: TransitionLayer[] | null
  animation: AnimationLayer[] | null
  error: string | null
}
