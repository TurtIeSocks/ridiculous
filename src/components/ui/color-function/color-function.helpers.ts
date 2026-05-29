// =====================================================================
// color-function.helpers.ts
//
// Pure runtime parse / format for the three modern color-function
// families. This is the TOLERANT SUPERSET of the strict type tier: it
// keeps calc()/var() verbatim (opaque), accepts bare keyword colors
// (`red`) as color arguments (valid CSS even though not in ColorLiteral),
// and is lenient on channel magnitudes — exactly the relaxations the spec
// documents. Dispatch is on the leading function name (paren-aware), into
// a `ColorFunctionState` discriminated union the UI drives off.
// =====================================================================

import type {
  ColorFunctionMode,
  ColorFunctionState,
} from "./color-function.types"

// ---------------------------------------------------------------------------
// Constant tables — single source of truth, mirror the type-level unions.
// ---------------------------------------------------------------------------

/** The 14-member `color-mix` interpolation colorspace set. */
export const MIX_COLOR_SPACES = [
  "srgb",
  "srgb-linear",
  "display-p3",
  "a98-rgb",
  "prophoto-rgb",
  "rec2020",
  "lab",
  "oklab",
  "xyz",
  "xyz-d50",
  "xyz-d65",
  "hsl",
  "hwb",
  "lch",
  "oklch",
] as const

/** The four polar spaces that may carry a hue-interpolation method. */
export const CYLINDRICAL_SPACES = ["hsl", "hwb", "lch", "oklch"] as const

/** Hue-interpolation methods. */
export const HUE_METHODS = [
  "shorter",
  "longer",
  "increasing",
  "decreasing",
] as const

/** The eight relative-color function names. */
export const RELATIVE_FNS = [
  "rgb",
  "hsl",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "color",
] as const

/** Default mix weight (percent) — the midpoint a fresh ratio seeds to. */
export const DEFAULT_PCT = 50

/** Channel keywords per relative-color function (destination space). */
export const CHANNEL_KEYWORDS: Record<
  string,
  readonly [string, string, string]
> = {
  rgb: ["r", "g", "b"],
  hsl: ["h", "s", "l"],
  hwb: ["h", "w", "b"],
  lab: ["l", "a", "b"],
  lch: ["l", "c", "h"],
  oklab: ["l", "a", "b"],
  oklch: ["l", "c", "h"],
  color: ["r", "g", "b"],
}

const MIX_SPACE_SET = new Set<string>(MIX_COLOR_SPACES)
const CYLINDRICAL_SET = new Set<string>(CYLINDRICAL_SPACES)
const HUE_METHOD_SET = new Set<string>(HUE_METHODS)
const RELATIVE_FN_SET = new Set<string>(RELATIVE_FNS)

// ---------------------------------------------------------------------------
// Paren-aware splitters (runtime mirror of the kit combinators)
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

/** Split a comma list at depth 0, trimming each part (keeps empties). */
function splitCommas(src: string): string[] {
  return splitTopLevel(src, ",").map((s) => s.trim())
}

/** Split a space list at depth 0, trimming and dropping empty runs. */
function splitSpaces(src: string): string[] {
  return splitTopLevel(src, " ")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

// Name regex allows the hyphen so `color-mix` / `light-dark` match.
const CALL_RE = /^([a-zA-Z][a-zA-Z-]*)\((.*)\)$/s

// ---------------------------------------------------------------------------
// Per-family parsers — return their state variant or null on a structural
// / arity / unknown-token error.
// ---------------------------------------------------------------------------

function parseColorMix(args: string): ColorFunctionState | null {
  const parts = splitCommas(args)
  if (parts.length !== 3) return null

  // Part 1: `in <space>` or `in <space> <method> hue`.
  const interp = splitSpaces(parts[0])
  if (interp[0] !== "in") return null
  const space = interp[1]
  if (space === undefined || !MIX_SPACE_SET.has(space)) return null

  let hue: string | undefined
  if (interp.length === 4) {
    const method = interp[2]
    if (!CYLINDRICAL_SET.has(space)) return null
    if (!HUE_METHOD_SET.has(method) || interp[3] !== "hue") return null
    hue = method
  } else if (interp.length !== 2) {
    return null
  }

  // Parts 2 & 3: `<color> <pct>?`.
  const a = parseColorWithPct(parts[1])
  const b = parseColorWithPct(parts[2])
  if (a === null || b === null) return null

  const state: ColorFunctionState = {
    kind: "color-mix",
    space,
    colorA: a.color,
    colorB: b.color,
  }
  if (hue !== undefined) state.hue = hue
  if (a.pct !== undefined) state.pctA = a.pct
  if (b.pct !== undefined) state.pctB = b.pct
  return state
}

/** A `<color> <pct>?` argument. Tolerant: any non-empty head is a color. */
function parseColorWithPct(
  part: string,
): { color: string; pct?: string } | null {
  const tokens = splitSpaces(part)
  if (tokens.length === 0) return null
  const last = tokens[tokens.length - 1]
  if (tokens.length >= 2 && last.endsWith("%")) {
    return { color: tokens.slice(0, -1).join(" "), pct: last }
  }
  return { color: tokens.join(" ") }
}

function parseLightDark(args: string): ColorFunctionState | null {
  const parts = splitCommas(args)
  if (parts.length !== 2) return null
  const light = parts[0]
  const dark = parts[1]
  if (light === "" || dark === "") return null
  return { kind: "light-dark", light, dark }
}

function parseRelative(fn: string, args: string): ColorFunctionState | null {
  const tokens = splitSpaces(args)
  if (tokens[0] !== "from") return null
  const from = tokens[1]
  if (from === undefined) return null

  // color() carries a colorspace ident between the source color and the
  // channels: `color(from <c> <space> r g b ...)`.
  let rest = tokens.slice(2)
  let space: string | undefined
  if (fn === "color") {
    space = rest[0]
    if (space === undefined) return null
    rest = rest.slice(1)
  }

  // Exactly 3 channels, then an optional `/ alpha`.
  let channels = rest
  let alpha: string | undefined
  const slash = rest.indexOf("/")
  if (slash !== -1) {
    channels = rest.slice(0, slash)
    const alphaTokens = rest.slice(slash + 1)
    if (alphaTokens.length !== 1) return null
    alpha = alphaTokens[0]
  }
  if (channels.length !== 3) return null

  const state: ColorFunctionState = {
    kind: "relative",
    fn,
    from,
    c1: channels[0],
    c2: channels[1],
    c3: channels[2],
  }
  if (space !== undefined) state.space = space
  if (alpha !== undefined) state.alpha = alpha
  return state
}

/**
 * Parse a modern CSS color function into typed state, or `null` on any
 * syntax / unknown-function / arity error. Tolerant of calc()/var() and
 * bare keyword colors, lenient on channel magnitudes.
 */
export function parseColorFunction(src: string): ColorFunctionState | null {
  const trimmed = src.trim()
  if (trimmed === "") return null
  const m = trimmed.match(CALL_RE)
  if (!m) return null
  const name = m[1]
  const args = m[2]

  if (name === "color-mix") return parseColorMix(args)
  if (name === "light-dark") return parseLightDark(args)
  if (RELATIVE_FN_SET.has(name)) {
    // Only the `from`-prefixed relative form is in scope.
    if (splitSpaces(args)[0] !== "from") return null
    return parseRelative(name, args)
  }
  return null
}

/** Runtime mirror of `KindOf` — the family of a value, or null. */
export function colorFunctionKind(
  src: string,
): ColorFunctionState["kind"] | null {
  const state = parseColorFunction(src)
  return state === null ? null : state.kind
}

// ---------------------------------------------------------------------------
// formatColorFunction — canonical re-serialization
// ---------------------------------------------------------------------------

/** Canonical re-serialization of a color-function state. */
export function formatColorFunction(state: ColorFunctionState): string {
  switch (state.kind) {
    case "color-mix": {
      const interp = state.hue
        ? `in ${state.space} ${state.hue} hue`
        : `in ${state.space}`
      const a = state.pctA ? `${state.colorA} ${state.pctA}` : state.colorA
      const b = state.pctB ? `${state.colorB} ${state.pctB}` : state.colorB
      return `color-mix(${interp}, ${a}, ${b})`
    }
    case "light-dark":
      return `light-dark(${state.light}, ${state.dark})`
    case "relative": {
      const head = state.space
        ? `from ${state.from} ${state.space}`
        : `from ${state.from}`
      const channels = `${state.c1} ${state.c2} ${state.c3}`
      const alpha = state.alpha ? ` / ${state.alpha}` : ""
      return `${state.fn}(${head} ${channels}${alpha})`
    }
  }
}

// ---------------------------------------------------------------------------
// defaultState — seed a fresh value per mode (each round-trips)
// ---------------------------------------------------------------------------

/** A sensible default state for a freshly-selected mode. */
export function defaultState(mode: ColorFunctionMode): ColorFunctionState {
  switch (mode) {
    case "color-mix":
      return {
        kind: "color-mix",
        space: "oklch",
        colorA: "#ff0000",
        pctA: "50%",
        colorB: "#0000ff",
        pctB: "50%",
      }
    case "relative":
      return {
        kind: "relative",
        fn: "oklch",
        from: "#ff0000",
        c1: "l",
        c2: "c",
        c3: "h",
      }
    case "light-dark":
      return { kind: "light-dark", light: "#ffffff", dark: "#000000" }
  }
}
