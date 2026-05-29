// =====================================================================
// grid-builder.helpers.ts
//
// Pure runtime parse / format for CSS grid templates. This is the SUPERSET
// of the strict type tier:
//   - parseTracks tolerates calc()/var() (kept verbatim, opaque) and
//     classifies each top-level token as a size / function / [named-line].
//   - parseAreas validates quoting + equal column count + cell idents, and
//     OPTIONALLY enforces the contiguous-RECTANGLE invariant that the type
//     tier punts (spec §7) via validateAreasRectangles.
// =====================================================================

// ---------------------------------------------------------------------------
// Track tokens
// ---------------------------------------------------------------------------

export type TrackToken =
  | { kind: "size"; value: string }
  | { kind: "fn"; name: string; value: string }
  | { kind: "line"; names: string[]; value: string }

const TRACK_FN_RE = /^([a-zA-Z][a-zA-Z-]*)\((.*)\)$/s
const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/

function isIdent(s: string): boolean {
  return IDENT_RE.test(s)
}

// ---------------------------------------------------------------------------
// Top-level splitter (paren/bracket-aware; runtime mirror of the kit)
// ---------------------------------------------------------------------------

/** Split on `sep` only at bracket depth 0. Returns `null` if depth never
 * returns to 0 (unbalanced) at the end. */
function splitTopLevel(src: string, sep: string): string[] | null {
  const out: string[] = []
  let depth = 0
  let cur = ""
  for (const ch of src) {
    if (ch === "(" || ch === "[") depth++
    else if (ch === ")" || ch === "]") depth--
    if (depth < 0) return null
    if (ch === sep && depth === 0) {
      out.push(cur)
      cur = ""
    } else {
      cur += ch
    }
  }
  if (depth !== 0) return null
  out.push(cur)
  return out
}

/** Space-split at top level, dropping empty runs. `null` on unbalanced. */
function splitSpaceTokens(src: string): string[] | null {
  const parts = splitTopLevel(src, " ")
  if (parts === null) return null
  return parts.map((s) => s.trim()).filter((s) => s.length > 0)
}

// ---------------------------------------------------------------------------
// parseTracks — string → TrackToken[] | null
// ---------------------------------------------------------------------------

/**
 * Parse a `grid-template-columns` / `grid-template-rows` value into tokens, or
 * `null` on a malformed token (unbalanced bracket, empty `[]`, bad line ident).
 * `none` / empty → `[]`. calc()/var() are kept verbatim as opaque size tokens.
 */
export function parseTracks(src: string): TrackToken[] | null {
  const trimmed = src.trim()
  if (trimmed === "" || trimmed === "none") return []

  const tokens = splitSpaceTokens(trimmed)
  if (tokens === null) return null

  const out: TrackToken[] = []
  for (const token of tokens) {
    if (token.startsWith("[")) {
      if (!token.endsWith("]")) return null
      const body = token.slice(1, -1).trim()
      const names = body.length === 0 ? [] : body.split(/\s+/)
      if (names.length === 0) return null
      if (!names.every(isIdent)) return null
      out.push({ kind: "line", names, value: token })
      continue
    }
    const m = token.match(TRACK_FN_RE)
    if (m) {
      out.push({ kind: "fn", name: m[1], value: token })
      continue
    }
    // a bare size (length / percentage / flex / keyword / calc()/var() opaque)
    out.push({ kind: "size", value: token })
  }
  return out
}

/** Re-serialize a track-token list. Empty → `none`. */
export function formatTracks(tokens: TrackToken[]): string {
  if (tokens.length === 0) return "none"
  return tokens.map((t) => t.value).join(" ")
}

/** A sensible default token for a freshly-added track. */
export function defaultTrack(kind: TrackToken["kind"] = "size"): TrackToken {
  switch (kind) {
    case "fn":
      return { kind: "fn", name: "minmax", value: "minmax(100px, 1fr)" }
    case "line":
      return { kind: "line", names: ["line"], value: "[line]" }
    default:
      return { kind: "size", value: "1fr" }
  }
}

// ---------------------------------------------------------------------------
// parseAreas — string → string[][] | null
// ---------------------------------------------------------------------------

export interface ParseAreasOptions {
  /** Also enforce the contiguous-rectangle invariant (the type-tier punt). */
  rectangles?: boolean
}

/** Match each `"..."` quoted row, in order. `null` if any non-quoted text. */
function splitQuotedRows(src: string): string[] | null {
  const rows: string[] = []
  let rest = src.trim()
  while (rest.length > 0) {
    if (rest[0] !== '"') return null
    const end = rest.indexOf('"', 1)
    if (end === -1) return null
    rows.push(rest.slice(1, end))
    rest = rest.slice(end + 1).trim()
  }
  return rows
}

/** A cell is a valid ident OR a run of one or more dots (a null cell). */
function isAreaCell(cell: string): boolean {
  if (/^\.+$/.test(cell)) return true
  return isIdent(cell)
}

/**
 * Parse a `grid-template-areas` value into a row-major matrix of cell strings,
 * or `null` on any violation: a non-quoted segment, an empty row, unequal
 * column counts, or a bad cell ident. `none` / empty → `[]`.
 *
 * With `{ rectangles: true }` it additionally enforces that every named area
 * forms a single contiguous rectangle — the invariant the strict TYPE tier
 * punts (spec §7).
 */
export function parseAreas(
  src: string,
  options: ParseAreasOptions = {},
): string[][] | null {
  const trimmed = src.trim()
  if (trimmed === "" || trimmed === "none") return []

  const rowStrings = splitQuotedRows(trimmed)
  if (rowStrings === null) return null

  const matrix: string[][] = []
  let cols = -1
  for (const rowStr of rowStrings) {
    const cells = rowStr
      .trim()
      .split(/\s+/)
      .filter((c) => c.length > 0)
    if (cells.length === 0) return null
    if (cols === -1) cols = cells.length
    else if (cells.length !== cols) return null
    if (!cells.every(isAreaCell)) return null
    matrix.push(cells)
  }
  if (matrix.length === 0) return null

  if (options.rectangles && !validateAreasRectangles(matrix)) return null
  return matrix
}

/** Join a matrix back into a quoted-row areas string. Empty → `none`. */
export function formatAreas(matrix: string[][]): string {
  if (matrix.length === 0) return "none"
  return matrix.map((row) => `"${row.join(" ")}"`).join(" ")
}

// ---------------------------------------------------------------------------
// validateAreasRectangles — the type-tier punt, done at runtime
// ---------------------------------------------------------------------------

/**
 * Whether every named area in the matrix forms a single contiguous rectangle.
 * For each name, compute the bounding box (min/max row + col) and assert every
 * cell inside it carries that name (which also rules out a split / L-shape).
 * Dot null cells are ignored.
 */
export function validateAreasRectangles(matrix: string[][]): boolean {
  const seen = new Set<string>()
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      const name = matrix[r][c]
      if (name === "" || /^\.+$/.test(name)) continue
      if (seen.has(name)) continue
      seen.add(name)

      let minR = r
      let maxR = r
      let minC = c
      let maxC = c
      let count = 0
      for (let rr = 0; rr < matrix.length; rr++) {
        for (let cc = 0; cc < matrix[rr].length; cc++) {
          if (matrix[rr][cc] === name) {
            minR = Math.min(minR, rr)
            maxR = Math.max(maxR, rr)
            minC = Math.min(minC, cc)
            maxC = Math.max(maxC, cc)
            count++
          }
        }
      }
      const boxArea = (maxR - minR + 1) * (maxC - minC + 1)
      if (count !== boxArea) return false
    }
  }
  return true
}

// ---------------------------------------------------------------------------
// areaNames / gridAreaFor — drive the preview + painter
// ---------------------------------------------------------------------------

/** Distinct area names in first-seen (row-major) order, excluding dot cells. */
export function areaNames(matrix: string[][]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const row of matrix) {
    for (const cell of row) {
      if (cell === "" || /^\.+$/.test(cell)) continue
      if (seen.has(cell)) continue
      seen.add(cell)
      out.push(cell)
    }
  }
  return out
}

/**
 * The CSS `grid-area` value (`row-start / col-start / row-end / col-end`, all
 * 1-based, end-exclusive) for a name's bounding box, or `null` if absent.
 */
export function gridAreaFor(matrix: string[][], name: string): string | null {
  let minR = Number.POSITIVE_INFINITY
  let maxR = -1
  let minC = Number.POSITIVE_INFINITY
  let maxC = -1
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === name) {
        minR = Math.min(minR, r)
        maxR = Math.max(maxR, r)
        minC = Math.min(minC, c)
        maxC = Math.max(maxC, c)
      }
    }
  }
  if (maxR === -1) return null
  return `${minR + 1} / ${minC + 1} / ${maxR + 2} / ${maxC + 2}`
}
