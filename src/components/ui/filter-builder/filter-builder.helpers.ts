// =====================================================================
// filter-builder.helpers.ts
//
// Pure runtime parse / format / spec for CSS `filter` / `backdrop-filter`
// values. This is the SUPERSET of the strict type tier: it tolerates
// calc()/var() inside arguments (kept verbatim, opaque), accepts a
// leading-color drop-shadow (normalizing it to color-last), validates
// arity, and drives the UI from a single ARG_SPEC dispatch table.
// =====================================================================

import type {
  AmountFn,
  FilterFunctionName,
  FilterItem,
} from "./filter-builder.types"

// ---------------------------------------------------------------------------
// ARG_SPEC — the runtime dispatch table (single source of truth)
// ---------------------------------------------------------------------------

/** Dimension family a function's argument(s) accept. */
export type ArgKind = "length" | "amount" | "angle" | "shadow" | "url"

export interface ArgSpec {
  /** Minimum token count. */
  min: number
  /** Maximum token count. */
  max: number
  /** The argument kind — drives both parsing and the UI. */
  kind: ArgKind
  /** Human label for the single-arg control (unused for shadow/url). */
  label: string
}

const AMOUNT_FNS: readonly AmountFn[] = [
  "brightness",
  "contrast",
  "grayscale",
  "invert",
  "opacity",
  "saturate",
  "sepia",
]

const ARG_SPEC: Record<FilterFunctionName, ArgSpec> = {
  blur: { min: 1, max: 1, kind: "length", label: "radius" },
  brightness: { min: 1, max: 1, kind: "amount", label: "amount" },
  contrast: { min: 1, max: 1, kind: "amount", label: "amount" },
  grayscale: { min: 1, max: 1, kind: "amount", label: "amount" },
  invert: { min: 1, max: 1, kind: "amount", label: "amount" },
  opacity: { min: 1, max: 1, kind: "amount", label: "amount" },
  saturate: { min: 1, max: 1, kind: "amount", label: "amount" },
  sepia: { min: 1, max: 1, kind: "amount", label: "amount" },
  "hue-rotate": { min: 1, max: 1, kind: "angle", label: "angle" },
  // 2-4 tokens: offset-x offset-y blur? color?
  "drop-shadow": { min: 2, max: 4, kind: "shadow", label: "shadow" },
  url: { min: 1, max: 1, kind: "url", label: "url" },
}

const FUNCTION_NAMES = new Set<string>(Object.keys(ARG_SPEC))

function isFunctionName(name: string): name is FilterFunctionName {
  return FUNCTION_NAMES.has(name)
}

/** The argument spec for a function — drives both parsing and the UI. */
export function argSpec(fn: FilterFunctionName): ArgSpec {
  return ARG_SPEC[fn]
}

/** Whether a function takes a single non-negative number | percentage arg. */
export function isAmountFn(fn: FilterFunctionName): fn is AmountFn {
  return (AMOUNT_FNS as readonly string[]).includes(fn)
}

// ---------------------------------------------------------------------------
// Top-level splitters (paren-aware, runtime mirror of the kit combinators)
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

/** Split a filter list into function tokens, dropping empty runs. */
function splitFunctions(src: string): string[] {
  return splitTopLevel(src, " ")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/** Split a function's comma argument string into trimmed args (drops empty). */
function splitCommaArgs(argStr: string): string[] {
  const trimmed = argStr.trim()
  if (trimmed === "") return []
  return splitTopLevel(trimmed, ",").map((s) => s.trim())
}

/** Split a drop-shadow's space argument string into tokens (drops empty). */
function splitSpaceArgs(argStr: string): string[] {
  return splitTopLevel(argStr, " ")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

// Name regex allows the hyphen so `hue-rotate` / `drop-shadow` match.
const CALL_RE = /^([a-zA-Z][a-zA-Z-]*)\((.*)\)$/s

// A token that looks like a CSS length / numeric value (possibly opaque
// calc()/var()) — NOT a color. Used to classify drop-shadow tokens.
const LENGTHISH_RE = /^-?[\d.]+[a-z%]*$/i

function isLengthish(token: string): boolean {
  if (LENGTHISH_RE.test(token)) return true
  // calc()/var()/min()/max()/clamp() length expressions are opaque lengths.
  return /^(calc|var|min|max|clamp|env)\(/i.test(token)
}

// ---------------------------------------------------------------------------
// parseFilter — string → FilterItem[] | null
// ---------------------------------------------------------------------------

/**
 * Build a drop-shadow item from its space-separated tokens. Accepts color
 * before or after the offsets (CSS allows either); normalizes to color-last.
 * Requires exactly 2 or 3 length tokens (x, y, blur?) and at most 1 color.
 */
function buildDropShadow(tokens: string[]): FilterItem | null {
  const lengths: string[] = []
  let color: string | undefined
  for (const token of tokens) {
    if (isLengthish(token)) {
      lengths.push(token)
    } else if (color === undefined) {
      color = token
    } else {
      return null // a second non-length token — invalid
    }
  }
  if (lengths.length < 2 || lengths.length > 3) return null
  const [x, y, blur] = lengths
  const item: FilterItem = { fn: "drop-shadow", x, y }
  if (blur !== undefined) item.blur = blur
  if (color !== undefined) item.color = color
  return item
}

function buildItem(fn: FilterFunctionName, argStr: string): FilterItem | null {
  if (fn === "drop-shadow") {
    const tokens = splitSpaceArgs(argStr)
    if (tokens.length < ARG_SPEC[fn].min || tokens.length > ARG_SPEC[fn].max) {
      return null
    }
    return buildDropShadow(tokens)
  }

  if (fn === "url") {
    const body = argStr.trim()
    if (body === "") return null
    return { fn: "url", url: body }
  }

  // single-arg families (length / angle / amount)
  const args = splitCommaArgs(argStr)
  if (args.length !== 1) return null
  if (fn === "hue-rotate") return { fn, value: args[0] }
  if (fn === "blur") return { fn, value: args[0] }
  // amount family
  return { fn, value: args[0] }
}

/**
 * Parse a CSS `filter` / `backdrop-filter` value into typed items, or `null`
 * on any syntax, unknown-function, or arity error. `none` / empty → `[]`.
 */
export function parseFilter(src: string): FilterItem[] | null {
  const trimmed = src.trim()
  if (trimmed === "" || trimmed === "none") return []

  const tokens = splitFunctions(trimmed)
  if (tokens.length === 0) return []

  const items: FilterItem[] = []
  for (const token of tokens) {
    const m = token.match(CALL_RE)
    if (!m) return null
    const name = m[1]
    if (!isFunctionName(name)) return null
    const item = buildItem(name, m[2])
    if (item === null) return null
    items.push(item)
  }
  return items
}

/** Runtime mirror of `FunctionsOf` — list the function names in order. */
export function filterFunctions(src: string): string[] {
  const items = parseFilter(src)
  if (items === null) return []
  return items.map((it) => it.fn)
}

// ---------------------------------------------------------------------------
// defaultItem — seed a fresh row
// ---------------------------------------------------------------------------

/** A sensible default item for a freshly-added function row. */
export function defaultItem(fn: FilterFunctionName): FilterItem {
  switch (fn) {
    case "blur":
      return { fn, value: "4px" }
    case "hue-rotate":
      return { fn, value: "90deg" }
    case "drop-shadow":
      return {
        fn,
        x: "4px",
        y: "4px",
        blur: "8px",
        color: "rgb(0 0 0 / 0.5)",
      }
    case "url":
      return { fn, url: "#filter" }
    default:
      // amount family — opacity/brightness/contrast/saturate default 1,
      // grayscale/invert/sepia default 0; use 1 as the neutral identity for
      // the multiplier-style functions, 0 for the additive ones.
      return {
        fn,
        value:
          fn === "grayscale" || fn === "invert" || fn === "sepia" ? "0" : "1",
      }
  }
}

// ---------------------------------------------------------------------------
// itemToCss / formatFilter — canonical serialization
// ---------------------------------------------------------------------------

/** Serialize one item to its CSS function string. */
export function itemToCss(item: FilterItem): string {
  switch (item.fn) {
    case "blur":
    case "hue-rotate":
      return `${item.fn}(${item.value})`
    case "url":
      return `url(${item.url})`
    case "drop-shadow": {
      const parts = [item.x, item.y]
      if (item.blur !== undefined) parts.push(item.blur)
      if (item.color !== undefined) parts.push(item.color)
      return `drop-shadow(${parts.join(" ")})`
    }
    default:
      // amount family
      return `${item.fn}(${item.value})`
  }
}

/** Canonical re-serialization of a filter list. Empty → `none`. */
export function formatFilter(items: FilterItem[]): string {
  if (items.length === 0) return "none"
  return items.map(itemToCss).join(" ")
}
