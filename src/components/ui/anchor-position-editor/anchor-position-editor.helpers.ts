// =====================================================================
// anchor-position-editor.helpers.ts
//
// Pure runtime parse / format for CSS anchor-positioning values. This is the
// SUPERSET of the strict type tier: it parses the structure (the position-area
// keyword pair, the anchor()/anchor-size() function, the position-try fallback
// chain) and surfaces the cross-axis verdict, but keeps literals the UI needs
// to round-trip (mirrors query-builder.helpers.ts). The single source the UI
// drives off.
//
// `KEYWORD_TABLE` below is the runtime twin of the type `AxisOf` in
// anchor-position-editor.types.ts — separately authored, reviewed together (the
// query-builder precedent). The same example keywords appear in both the type-
// test and the parse-test, so any drift fails a test.
// =====================================================================

import type {
  AnchorExpr,
  AnchorPositionMode,
  PositionAxis,
  TryFallback,
} from "./anchor-position-editor.types"

// ---------------------------------------------------------------------------
// KEYWORD_TABLE — the position-area keyword vocabulary, grouped by axis family.
// Runtime mirror of the PhysX / PhysY / LogBlock / LogInline / Neutral unions.
// ---------------------------------------------------------------------------

const PHYS_X: readonly string[] = [
  "left",
  "right",
  "x-start",
  "x-end",
  "x-self-start",
  "x-self-end",
  "span-left",
  "span-right",
  "span-x-start",
  "span-x-end",
  "span-x-self-start",
  "span-x-self-end",
]

const PHYS_Y: readonly string[] = [
  "top",
  "bottom",
  "y-start",
  "y-end",
  "y-self-start",
  "y-self-end",
  "span-top",
  "span-bottom",
  "span-y-start",
  "span-y-end",
  "span-y-self-start",
  "span-y-self-end",
]

const LOG_BLOCK: readonly string[] = [
  "block-start",
  "block-end",
  "self-block-start",
  "self-block-end",
  "span-block-start",
  "span-block-end",
  "span-self-block-start",
  "span-self-block-end",
]

const LOG_INLINE: readonly string[] = [
  "inline-start",
  "inline-end",
  "self-inline-start",
  "self-inline-end",
  "span-inline-start",
  "span-inline-end",
  "span-self-inline-start",
  "span-self-inline-end",
]

const NEUTRAL: readonly string[] = [
  "center",
  "span-all",
  "start",
  "end",
  "self-start",
  "self-end",
  "span-start",
  "span-end",
  "span-self-start",
  "span-self-end",
]

const KEYWORD_TABLE: Record<PositionAxis, readonly string[]> = {
  x: PHYS_X,
  y: PHYS_Y,
  block: LOG_BLOCK,
  inline: LOG_INLINE,
  neutral: NEUTRAL,
}

const ALL_PA_KEYWORDS: readonly string[] = [
  ...PHYS_X,
  ...PHYS_Y,
  ...LOG_BLOCK,
  ...LOG_INLINE,
  ...NEUTRAL,
]

const ANCHOR_SIDES: readonly string[] = [
  "top",
  "left",
  "right",
  "bottom",
  "start",
  "end",
  "self-start",
  "self-end",
  "center",
  "inside",
  "outside",
]

const ANCHOR_SIZES: readonly string[] = [
  "width",
  "height",
  "block",
  "inline",
  "self-block",
  "self-inline",
]

const TRY_TACTICS: readonly string[] = [
  "flip-block",
  "flip-inline",
  "flip-start",
]

// ---------------------------------------------------------------------------
// axisOf / areCompatible — runtime mirrors of the type AxisOf / Compatible
// ---------------------------------------------------------------------------

/**
 * The axis a `position-area` keyword binds to — runtime mirror of the type
 * `AxisOf`. An unrecognized keyword is `"unknown"` (the runtime escape hatch
 * the type expresses as `never`).
 */
export function axisOf(keyword: string): PositionAxis | "unknown" {
  const k = keyword.trim()
  for (const axis of ["x", "y", "block", "inline", "neutral"] as const) {
    if (KEYWORD_TABLE[axis].includes(k)) return axis
  }
  return "unknown"
}

/**
 * Whether two `position-area` keywords pair — runtime mirror of the type
 * `Compatible`. `neutral` pairs with anything; x↔y (physical) and block↔inline
 * (logical) pair; same-axis and physical↔logical are rejected; an unknown
 * keyword is incompatible.
 */
export function areCompatible(a: string, b: string): boolean {
  const ax = axisOf(a)
  const bx = axisOf(b)
  if (ax === "unknown" || bx === "unknown") return false
  if (ax === "neutral" || bx === "neutral") return true
  if (ax === "x") return bx === "y"
  if (ax === "y") return bx === "x"
  if (ax === "block") return bx === "inline"
  if (ax === "inline") return bx === "block"
  return false
}

// ---------------------------------------------------------------------------
// parsePositionArea — string → keyword tokens + cross-axis verdict
// ---------------------------------------------------------------------------

/**
 * Tokenize a `position-area` value into its keyword(s) and surface the verdict
 * as `error` (`null` when valid). Keeps the raw tokens even on error so the UI
 * can show what was typed. Rejects empty input, more than two tokens, an
 * unknown keyword, and an incompatible pair (same axis / physical↔logical).
 */
export function parsePositionArea(src: string): {
  keywords: string[]
  error: string | null
} {
  const keywords = src
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
  if (keywords.length === 0) {
    return { keywords: [], error: "empty position-area" }
  }
  if (keywords.length > 2) {
    return { keywords, error: "a position-area takes one or two keywords" }
  }
  for (const k of keywords) {
    if (axisOf(k) === "unknown") {
      return { keywords, error: `unknown keyword: ${k}` }
    }
  }
  if (keywords.length === 2 && !areCompatible(keywords[0], keywords[1])) {
    return {
      keywords,
      error: "the two keywords must be on different axes of the same system",
    }
  }
  return { keywords, error: null }
}

// ---------------------------------------------------------------------------
// parseAnchor — string → AnchorExpr | null
// ---------------------------------------------------------------------------

function splitFunction(src: string): { name: string; args: string } | null {
  const s = src.trim()
  const open = s.indexOf("(")
  if (open === -1 || !s.endsWith(")")) return null
  const name = s.slice(0, open).trim()
  if (name === "") return null
  const args = s.slice(open + 1, -1).trim()
  return { name, args }
}

/**
 * Parse an `anchor()` / `anchor-size()` value into an `AnchorExpr`, or `null`
 * if it is not one of those functions / has empty args. The optional leading
 * `--name` ident, the side/size keyword (or a bare percentage), and the
 * optional `<length-percentage>` fallback are split structurally — keyword
 * gating is the strict tier's job, not the parser's.
 */
export function parseAnchor(src: string): AnchorExpr | null {
  const fn = splitFunction(src)
  if (fn === null) return null
  if (fn.name !== "anchor" && fn.name !== "anchor-size") return null
  if (fn.args === "") return null

  const parts = fn.args.split(",").map((p) => p.trim())
  if (parts.length > 2) return null
  const head = parts[0]
  const fallback = parts[1]
  if (head === "") return null
  if (parts.length === 2 && (fallback === undefined || fallback === "")) {
    return null
  }

  const headTokens = head.split(/\s+/).filter((t) => t.length > 0)
  let name: string | undefined
  let side: string
  if (headTokens.length === 1) {
    side = headTokens[0]
  } else if (headTokens.length === 2) {
    name = headTokens[0]
    side = headTokens[1]
  } else {
    return null
  }

  const expr: AnchorExpr = { fn: fn.name, side }
  if (name !== undefined) expr.name = name
  if (fallback !== undefined && fallback !== "") expr.fallback = fallback
  return expr
}

// ---------------------------------------------------------------------------
// parsePositionTry — string → TryFallback[]
// ---------------------------------------------------------------------------

function classifyFallback(raw: string): TryFallback {
  const f = raw.trim()
  if (f === "none") return { kind: "none" }

  const tokens = f.split(/\s+/).filter((t) => t.length > 0)
  const idents = tokens.filter((t) => t.startsWith("--"))
  const tactics = tokens.filter((t) => TRY_TACTICS.includes(t))
  // The `<dashed-ident> || <try-tactic>` arm — every token is an ident or a
  // tactic.
  if (idents.length + tactics.length === tokens.length && tokens.length > 0) {
    return { kind: "tactics", idents, tactics }
  }
  // Otherwise interpret the whole fallback as a <position-area>.
  return { kind: "area", area: f }
}

/**
 * Parse a `position-try-fallbacks` value into its fallback chain. Each comma-
 * separated fallback is `none`, a `<dashed-ident> || <try-tactic>` arm
 * (`tactics`), or a `<position-area>` (`area`). An empty string yields `[]`.
 */
export function parsePositionTry(src: string): TryFallback[] {
  const trimmed = src.trim()
  if (trimmed === "") return []
  return trimmed
    .split(",")
    .map((f) => f.trim())
    .filter((f) => f.length > 0)
    .map(classifyFallback)
}

// ---------------------------------------------------------------------------
// format* — canonical re-serialization
// ---------------------------------------------------------------------------

/**
 * Serialize a `position-area` keyword list. A duplicate `center` pair collapses
 * to the single keyword `center` (the middle-cell convention); an empty list
 * is the empty string.
 */
export function formatPositionArea(keywords: string[]): string {
  if (keywords.length === 0) return ""
  if (
    keywords.length === 2 &&
    keywords[0] === "center" &&
    keywords[1] === "center"
  ) {
    return "center"
  }
  return keywords.join(" ")
}

/** Serialize an `AnchorExpr` back to its `anchor(...)` / `anchor-size(...)`. */
export function formatAnchor(expr: AnchorExpr): string {
  const head = expr.name ? `${expr.name} ${expr.side}` : expr.side
  const args = expr.fallback ? `${head}, ${expr.fallback}` : head
  return `${expr.fn}(${args})`
}

function formatFallback(f: TryFallback): string {
  if (f.kind === "none") return "none"
  if (f.kind === "area") return f.area ?? ""
  const idents = f.idents ?? []
  const tactics = f.tactics ?? []
  return [...idents, ...tactics].join(" ")
}

/** Serialize a `position-try-fallbacks` chain to its comma list. */
export function formatPositionTry(fallbacks: TryFallback[]): string {
  return fallbacks.map(formatFallback).join(", ")
}

// ---------------------------------------------------------------------------
// option sources (<select> data)
// ---------------------------------------------------------------------------

/** Every known `position-area` keyword (the strict whitelist). */
export function positionAreaKeywords(): readonly string[] {
  return ALL_PA_KEYWORDS
}

/** The `anchor()` side keywords. */
export function anchorSides(): readonly string[] {
  return ANCHOR_SIDES
}

/** The `anchor-size()` dimension keywords. */
export function anchorSizes(): readonly string[] {
  return ANCHOR_SIZES
}

/** The three `<try-tactic>` keywords. */
export function tryTactics(): readonly string[] {
  return TRY_TACTICS
}

// ---------------------------------------------------------------------------
// The 3×3 grid ⇄ keyword-pair mapping (physical default; §4.1)
// ---------------------------------------------------------------------------

const ROW_KEYWORDS = ["top", "center", "bottom"] as const
const COL_KEYWORDS = ["left", "center", "right"] as const

type Cell = 0 | 1 | 2

/**
 * The physical keyword pair for a grid cell. The `[row, col]` keywords are the
 * y-axis (top/center/bottom) and x-axis (left/center/right) of the cell. The
 * center cell (`1,1`) yields the `[center, center]` pair, which
 * `formatPositionArea` collapses to the single keyword `center`.
 */
export function cellToKeywords(row: Cell, col: Cell): [string, string] {
  return [ROW_KEYWORDS[row], COL_KEYWORDS[col]]
}

/** Map a keyword to its grid row (0..2), via the y / block axis, or null. */
function rowOf(keyword: string): Cell | null {
  switch (keyword) {
    case "top":
    case "block-start":
      return 0
    case "center":
      return 1
    case "bottom":
    case "block-end":
      return 2
    default:
      return null
  }
}

/** Map a keyword to its grid column (0..2), via the x / inline axis, or null. */
function colOf(keyword: string): Cell | null {
  switch (keyword) {
    case "left":
    case "inline-start":
      return 0
    case "center":
      return 1
    case "right":
    case "inline-end":
      return 2
    default:
      return null
  }
}

/**
 * Map a `position-area` keyword pair (or the single `center`) back to its grid
 * cell. Order-insensitive: the row keyword and the column keyword may appear in
 * either order. Logical pairs (`block-*` / `inline-*`) map onto the same cells
 * as their physical counterparts. Returns `null` for an unmappable pair.
 */
export function keywordsToCell(
  keywords: string[],
): { row: Cell; col: Cell } | null {
  if (keywords.length === 1) {
    if (keywords[0] === "center") return { row: 1, col: 1 }
    return null
  }
  if (keywords.length !== 2) return null
  const [a, b] = keywords
  // Try (a = row, b = col), then the swapped order.
  for (const [rowKw, colKw] of [
    [a, b],
    [b, a],
  ] as const) {
    const row = rowOf(rowKw)
    const col = colOf(colKw)
    if (row !== null && col !== null) return { row, col }
  }
  return null
}

// ---------------------------------------------------------------------------
// defaults
// ---------------------------------------------------------------------------

/** A sensible seed value per mode. */
export function defaultFor(mode: AnchorPositionMode): string {
  switch (mode) {
    case "position-area":
      return "center"
    case "anchor":
      return "anchor(--anchor bottom)"
    case "position-try":
      return "flip-block"
  }
}
