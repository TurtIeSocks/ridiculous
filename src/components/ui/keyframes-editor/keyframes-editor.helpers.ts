// =====================================================================
// keyframes-editor.helpers.ts
//
// Pure runtime parse / format / dispatch for the body of a CSS `@keyframes`
// rule. This is the SUPERSET of the strict type tier in
// keyframes-editor.types.ts: it splits the block list (`sel { decls }`),
// splits selectors on commas and declarations on `;` then the FIRST `:`, and
// surfaces `propertyEditorKind` — the runtime twin of the type's
// `DispatchValue` table that tells the UI which embedded editor a declaration
// opens. The single source the timeline UI parses from and serializes to.
//
// The component edits the @keyframes BODY (block list), not the
// `@keyframes name { }` wrapper (spec §1, A1). Stops are sorted on format:
// from=0 < % < to=100 (spec §4, A7).
//
// Spec: docs/superpowers/specs/2026-06-19-keyframes-editor-design.md §4 / §4.1
// =====================================================================

import type {
  Declaration,
  KeyframeBlock,
  KeyframePropertyKind,
} from "./keyframes-editor.types"

// ---------------------------------------------------------------------------
// dispatch vocabulary — runtime mirror of the type's ColorProp / LengthProp
// unions + DispatchValue ladder.
// ---------------------------------------------------------------------------

const COLOR_PROPS = new Set<string>([
  "color",
  "background-color",
  "border-color",
  "outline-color",
  "caret-color",
  "text-decoration-color",
  "fill",
  "stroke",
])

const LENGTH_PROPS = new Set<string>([
  "width",
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "top",
  "left",
  "right",
  "bottom",
  "inset",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "gap",
  "row-gap",
  "column-gap",
  "font-size",
  "line-height",
  "border-radius",
  "border-width",
])

const FILTER_PROPS = new Set<string>(["filter", "backdrop-filter"])

const EASING_PROPS = new Set<string>([
  "animation-timing-function",
  "transition-timing-function",
])

/**
 * Which embedded editor a declaration opens — the runtime mirror of the type
 * `DispatchValue`. `transform`→transform, `filter`/`backdrop-filter`→filter,
 * the color-ish properties→color, `*-timing-function`→easing, `opacity`→
 * opacity, the length properties→length. `background`/`background-image` are
 * `plain` here (the type defers them; the UI routes them to a gradient editor
 * separately — spec §3.2, A4); every other property is `plain`.
 */
export function propertyEditorKind(property: string): KeyframePropertyKind {
  const p = property.trim()
  if (p === "transform") return "transform"
  if (FILTER_PROPS.has(p)) return "filter"
  if (COLOR_PROPS.has(p)) return "color"
  if (EASING_PROPS.has(p)) return "easing"
  if (p === "opacity") return "opacity"
  if (LENGTH_PROPS.has(p)) return "length"
  return "plain"
}

// ---------------------------------------------------------------------------
// parseKeyframes — string → { blocks, error }
// ---------------------------------------------------------------------------

/**
 * Split a declaration list (the inside of a `{ }`) into typed declarations.
 * Declarations split on `;`; each is split on its FIRST `:` so a value half
 * may carry a colon (`url(http://x)`). Empty segments (a trailing `;`) are
 * dropped. A segment with no `:` is skipped.
 */
function parseDeclarations(body: string): Declaration[] {
  const out: Declaration[] = []
  for (const seg of body.split(";")) {
    const s = seg.trim()
    if (s === "") continue
    const colon = s.indexOf(":")
    if (colon === -1) continue
    const property = s.slice(0, colon).trim()
    const value = s.slice(colon + 1).trim()
    if (property === "") continue
    out.push({ property, value })
  }
  return out
}

/**
 * Parse a `@keyframes` body into its block list. `error` is `null` on success
 * and a message otherwise; on error `blocks` holds whatever parsed so far.
 * Each block is `<selector-list> { <declaration-list> }`: selectors split on
 * commas, declarations split on `;` then the first `:`. Rejects an empty body,
 * a body with no blocks, an unclosed block, and a block with no selector. CSS
 * values carry no top-level `{ }`, so a flat `{`/`}` scan is sufficient.
 */
export function parseKeyframes(src: string): {
  blocks: KeyframeBlock[]
  error: string | null
} {
  const trimmed = src.trim()
  if (trimmed === "") {
    return { blocks: [], error: "empty keyframes body" }
  }

  const blocks: KeyframeBlock[] = []
  let rest = trimmed
  while (rest.trim() !== "") {
    const open = rest.indexOf("{")
    if (open === -1) {
      return { blocks, error: `expected a block: ${rest.trim()}` }
    }
    const close = rest.indexOf("}", open)
    if (close === -1) {
      return { blocks, error: "unclosed keyframe block" }
    }
    const header = rest.slice(0, open).trim()
    if (header === "") {
      return { blocks, error: "a keyframe block needs a selector" }
    }
    const selectors = header
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    if (selectors.length === 0) {
      return { blocks, error: "a keyframe block needs a selector" }
    }
    const declarations = parseDeclarations(rest.slice(open + 1, close))
    blocks.push({ selectors, declarations })
    rest = rest.slice(close + 1)
  }

  if (blocks.length === 0) {
    return { blocks, error: "no keyframe blocks found" }
  }
  return { blocks, error: null }
}

// ---------------------------------------------------------------------------
// selectorToPercent / percentToSelector — the timeline coordinate map (§4.1)
// ---------------------------------------------------------------------------

/**
 * Map a `<keyframe-selector>` to its timeline percent: `from`→0, `to`→100, an
 * `N%` selector→its numeric part. A non-numeric/unknown selector yields `0`.
 */
export function selectorToPercent(sel: string): number {
  const s = sel.trim()
  if (s === "from") return 0
  if (s === "to") return 100
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

/**
 * Map a timeline percent back to a canonical `<keyframe-selector>`: 0→`from`,
 * 100→`to`, anything in between→`N%`.
 */
export function percentToSelector(n: number): string {
  if (n === 0) return "from"
  if (n === 100) return "to"
  return `${n}%`
}

// ---------------------------------------------------------------------------
// formatKeyframes — KeyframeBlock[] → canonical string (sorted)
// ---------------------------------------------------------------------------

function declarationToCss(d: Declaration): string {
  return `${d.property}: ${d.value}`
}

function blockToCss(block: KeyframeBlock): string {
  const head = block.selectors.join(", ")
  const body = block.declarations.map(declarationToCss).join("; ")
  return `${head} { ${body} }`
}

/**
 * Canonical re-serialization of a `@keyframes` body. Stops are sorted by their
 * FIRST selector's percent (`from`=0 < `N%` < `to`=100; spec §4, A7); within a
 * block, selectors join with `, ` and declarations with `; `. An empty
 * declaration list serializes as `sel {  }`.
 */
export function formatKeyframes(blocks: KeyframeBlock[]): string {
  const sorted = [...blocks].sort(
    (a, b) =>
      selectorToPercent(a.selectors[0] ?? "from") -
      selectorToPercent(b.selectors[0] ?? "from"),
  )
  return sorted.map(blockToCss).join(" ")
}

// ---------------------------------------------------------------------------
// defaultKeyframes
// ---------------------------------------------------------------------------

/** A valid, parseable two-stop seed for a freshly-created editor. */
export function defaultKeyframes(): string {
  return "from { opacity: 0 } to { opacity: 1 }"
}
