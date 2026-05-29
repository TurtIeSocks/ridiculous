// =====================================================================
// font-editor.helpers.ts
//
// Pure runtime parse / format for the CSS `font` shorthand. This is the
// SUPERSET of the strict type tier: it tolerates var() inside the family
// list (kept verbatim, opaque), accepts arbitrary whitespace, and runs the
// full ordered parse — order-free prefix (≤1 of each kind) → mandatory
// size → optional `/line-height` → mandatory comma-separated family list.
//
// The classifier helpers + option-list constants are the single source of
// truth for both parsing and the UI (mirroring transform-builder's
// ARG_SPEC table).
// =====================================================================

import type {
  FontGenericFamily,
  FontParts,
  SystemFontKeyword,
} from "./font-editor.types"

// ---------------------------------------------------------------------------
// Option lists (drive the UI selects + the classifiers)
// ---------------------------------------------------------------------------

export const SYSTEM_FONTS: readonly SystemFontKeyword[] = [
  "caption",
  "icon",
  "menu",
  "message-box",
  "small-caption",
  "status-bar",
]

export const FONT_STYLES = ["normal", "italic", "oblique"] as const
export const FONT_VARIANTS = ["normal", "small-caps"] as const
export const FONT_WEIGHT_KEYWORDS = [
  "normal",
  "bold",
  "bolder",
  "lighter",
] as const
export const FONT_STRETCHES = [
  "ultra-condensed",
  "extra-condensed",
  "condensed",
  "semi-condensed",
  "normal",
  "semi-expanded",
  "expanded",
  "extra-expanded",
  "ultra-expanded",
] as const
export const ABSOLUTE_SIZES = [
  "xx-small",
  "x-small",
  "small",
  "medium",
  "large",
  "x-large",
  "xx-large",
  "xxx-large",
  "larger",
  "smaller",
] as const

export const GENERIC_FAMILIES: readonly FontGenericFamily[] = [
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
]

/** A small web-safe family list for the UI family picker. */
export const WEB_SAFE_FAMILIES: readonly string[] = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Inter",
  "Roboto",
  "JetBrains Mono",
]

// ---------------------------------------------------------------------------
// Numeric / dimension predicates (runtime mirror of the kit primitives)
// ---------------------------------------------------------------------------

const NUMBER_RE = /^[+-]?(\d+\.?\d*|\.\d+)$/
const LENGTH_UNIT_RE =
  /^[+-]?(\d+\.?\d*|\.\d+)(px|rem|em|ex|ch|cap|ic|lh|rlh|vw|vh|vi|vb|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax|cm|mm|in|pt|pc|Q)$/i
const PERCENT_RE = /^[+-]?(\d+\.?\d*|\.\d+)%$/

function isNumber(s: string): boolean {
  return NUMBER_RE.test(s)
}
function isLength(s: string): boolean {
  return LENGTH_UNIT_RE.test(s)
}
function isPercentage(s: string): boolean {
  return PERCENT_RE.test(s)
}

// ---------------------------------------------------------------------------
// Token classifiers — exported, mirror the type predicates
// ---------------------------------------------------------------------------

export function classifyStyle(t: string): boolean {
  return (FONT_STYLES as readonly string[]).includes(t)
}
export function classifyVariant(t: string): boolean {
  return (FONT_VARIANTS as readonly string[]).includes(t)
}
export function classifyWeight(t: string): boolean {
  return (FONT_WEIGHT_KEYWORDS as readonly string[]).includes(t) || isNumber(t)
}
export function classifyStretch(t: string): boolean {
  return (FONT_STRETCHES as readonly string[]).includes(t) || isPercentage(t)
}
export function classifySize(t: string): boolean {
  return (
    (ABSOLUTE_SIZES as readonly string[]).includes(t) ||
    isLength(t) ||
    isPercentage(t)
  )
}
export function classifyLineHeight(t: string): boolean {
  return t === "normal" || isNumber(t) || isLength(t) || isPercentage(t)
}

const IDENT_RE = /^[A-Za-z_-][A-Za-z0-9_\- ]*$/

/**
 * One family token: a generic keyword, a quoted string, a bare ident-safe
 * name, OR a `var()` reference (runtime-tolerant; not validated strictly).
 */
export function classifyFamilyToken(t: string): boolean {
  if (t === "") return false
  if ((GENERIC_FAMILIES as readonly string[]).includes(t)) return true
  if (
    (t.startsWith('"') && t.endsWith('"') && t.length >= 2) ||
    (t.startsWith("'") && t.endsWith("'") && t.length >= 2)
  ) {
    return true
  }
  if (t.startsWith("var(") && t.endsWith(")")) return true
  return IDENT_RE.test(t)
}

// ---------------------------------------------------------------------------
// Paren-aware top-level splitters (runtime mirror of the kit combinators)
// ---------------------------------------------------------------------------

/** Split on `sep` only at bracket depth 0, ignoring quoted runs. */
function splitTopLevel(src: string, sep: string): string[] {
  const out: string[] = []
  let depth = 0
  let quote: '"' | "'" | null = null
  let cur = ""
  for (const ch of src) {
    if (quote) {
      cur += ch
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      cur += ch
      continue
    }
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

/** Split on top-level whitespace runs, dropping empties. */
function splitSpace(src: string): string[] {
  // Normalize a standalone or attached `/` so the slash never glues tokens
  // in a way the walker can't see — but keep `16px/1.5` attached. We split on
  // spaces only; the parser handles `/` placement.
  return splitTopLevel(src, " ")
    .flatMap((s) => splitTopLevel(s, "\t"))
    .flatMap((s) => splitTopLevel(s, "\n"))
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/** Split a comma-separated family string at depth 0; trim, drop empties. */
function splitFamily(src: string): string[] {
  return splitTopLevel(src, ",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function isSystemKeyword(s: string): s is SystemFontKeyword {
  return (SYSTEM_FONTS as readonly string[]).includes(s)
}

// ---------------------------------------------------------------------------
// parseFont — string → FontParts | null
// ---------------------------------------------------------------------------

interface PrefixAcc {
  style?: string
  variant?: string
  weight?: string
  stretch?: string
}

/** Consume `t` as the first still-free prefix kind. Returns true on success. */
function consumePrefix(t: string, acc: PrefixAcc): boolean {
  if (classifyStyle(t) && acc.style === undefined) {
    acc.style = t
    return true
  }
  if (classifyVariant(t) && acc.variant === undefined) {
    acc.variant = t
    return true
  }
  if (classifyWeight(t) && acc.weight === undefined) {
    acc.weight = t
    return true
  }
  if (classifyStretch(t) && acc.stretch === undefined) {
    acc.stretch = t
    return true
  }
  return false
}

/**
 * Parse a CSS `font` shorthand into typed parts, or `null` on any structural
 * error (missing size, missing family, duplicate prefix kind, junk). A
 * system-font keyword → `{ kind: "system", … }`. Tolerates `var()` family
 * tokens and arbitrary whitespace.
 */
export function parseFont(src: string): FontParts | null {
  const trimmed = src.trim()
  if (trimmed === "") return null
  if (isSystemKeyword(trimmed)) return { kind: "system", keyword: trimmed }

  const tokens = splitSpace(trimmed)
  if (tokens.length === 0) return null

  const acc: PrefixAcc = {}
  let i = 0
  // 1. Order-free prefix.
  while (i < tokens.length && consumePrefix(tokens[i], acc)) {
    i++
  }
  if (i >= tokens.length) return null // never reached a size

  // 2. Mandatory size, with optional `/line-height` in attached/spaced forms.
  let size: string
  let lineHeight: string | undefined
  const head = tokens[i]

  const slashIdx = head.indexOf("/")
  if (slashIdx >= 0) {
    // attached forms: "16px/1.5" or trailing-slash "16px/"
    const sz = head.slice(0, slashIdx)
    const lh = head.slice(slashIdx + 1)
    if (!classifySize(sz)) return null
    size = sz
    i++
    if (lh !== "") {
      if (!classifyLineHeight(lh)) return null
      lineHeight = lh
    } else {
      // line-height is the next token
      if (i >= tokens.length || !classifyLineHeight(tokens[i])) return null
      lineHeight = tokens[i]
      i++
    }
  } else {
    if (!classifySize(head)) return null
    size = head
    i++
    // half-spaced "16px /1.5" or fully spaced "16px / 1.5"
    if (i < tokens.length && tokens[i].startsWith("/")) {
      const after = tokens[i].slice(1)
      i++
      if (after !== "") {
        if (!classifyLineHeight(after)) return null
        lineHeight = after
      } else {
        if (i >= tokens.length || !classifyLineHeight(tokens[i])) return null
        lineHeight = tokens[i]
        i++
      }
    }
  }

  // 3. Mandatory family list (rejoin remaining tokens, split on commas).
  const familySrc = tokens.slice(i).join(" ")
  const family = splitFamily(familySrc)
  if (family.length === 0) return null
  for (const f of family) {
    if (!classifyFamilyToken(f)) return null
  }

  return {
    kind: "shorthand",
    ...(acc.style !== undefined ? { style: acc.style } : {}),
    ...(acc.variant !== undefined ? { variant: acc.variant } : {}),
    ...(acc.weight !== undefined ? { weight: acc.weight } : {}),
    ...(acc.stretch !== undefined ? { stretch: acc.stretch } : {}),
    size,
    ...(lineHeight !== undefined ? { lineHeight } : {}),
    family,
  }
}

// ---------------------------------------------------------------------------
// formatFont — canonical serialization
// ---------------------------------------------------------------------------

/**
 * Canonical re-serialization of font parts. Order:
 * `style variant weight stretch size[/lh] family`. System keyword → itself.
 * Omitted prefix fields are dropped; family joined with `, `.
 */
export function formatFont(parts: FontParts): string {
  if (parts.kind === "system") return parts.keyword
  const prefix = [parts.style, parts.variant, parts.weight, parts.stretch]
    .filter((p): p is string => p !== undefined)
    .join(" ")
  const sizeLh =
    parts.lineHeight !== undefined
      ? `${parts.size}/${parts.lineHeight}`
      : parts.size
  const family = parts.family.join(", ")
  return [prefix, `${sizeLh} ${family}`].filter((s) => s !== "").join(" ")
}

// ---------------------------------------------------------------------------
// fontFamilies / defaultParts — UI conveniences
// ---------------------------------------------------------------------------

/** Runtime mirror of `FamiliesOf` — the family tokens in order, or `[]`. */
export function fontFamilies(src: string): string[] {
  const parts = parseFont(src)
  if (parts === null || parts.kind === "system") return []
  return parts.family
}

/** A sensible default for a freshly-initialized editor. */
export function defaultParts(): FontParts {
  return { kind: "shorthand", size: "16px", family: ["sans-serif"] }
}
