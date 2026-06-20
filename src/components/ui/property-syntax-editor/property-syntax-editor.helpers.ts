// =====================================================================
// property-syntax-editor.helpers.ts
//
// Pure runtime parse / format / match for the CSS `@property` `syntax:`
// descriptor. This is the SUPERSET of the strict type tier: `parseSyntax`
// classifies the structure (universal `*`, the `|` alternation, each
// component's `<data-type>`-or-ident base + optional single `+`/`#`
// multiplier) and surfaces an `error`; `matchesSyntax` is the RUNTIME MIRROR
// of the dependent type `InitialValueLiteral` — it decides whether a candidate
// `initial-value` satisfies a syntax string (mirrors query-builder.helpers.ts).
//
// `DATA_TYPE_TABLE` below is the runtime twin of the type `SatisfiesBase` in
// property-syntax-editor.types.ts — separately authored, reviewed together (the
// query-builder precedent). The same example values appear in both the type-
// test and the format-test, so any drift fails a test.
//
// `<color>` defers to color-picker's `isColorString` (the runtime half of the
// `ColorLiteral` cross-component showcase) — so color-picker forms (hex / rgb /
// hsl / oklch / oklab / hwb) match, but a named color like `red` does not.
//
// Spec: docs/superpowers/specs/2026-06-19-property-syntax-editor-design.md §4
// =====================================================================

import { isColorString } from "@/components/ui/color-picker"
import type {
  DataTypeName,
  SyntaxComponent,
} from "./property-syntax-editor.types"

// ---------------------------------------------------------------------------
// DATA_TYPE_TABLE — one row per `<data-type>`. `test` is the runtime predicate
// twin of the type `SatisfiesBase` for that base. Idents and `*` are handled
// outside the table (exact-match / universal).
// ---------------------------------------------------------------------------

// Number grammar mirrored from the kit's `IsNumber`: an optional `+`/`-` sign,
// a required integer part, and an optional single `.`-fraction (digits both
// sides). No bare `.5`, no trailing `1.` — exactly what the type accepts.
const NUMBER_RE = /^[+-]?\d+(?:\.\d+)?$/

// Integer is the runtime-stricter `<integer>` check (spec A4): sign + digits,
// no fraction.
const INTEGER_RE = /^[+-]?\d+$/

// Unit suffixes, mirrored 1:1 from the kit's dimension unit lists.
const LENGTH_UNITS = [
  "cqmin",
  "cqmax",
  "vmin",
  "vmax",
  "svw",
  "svh",
  "svi",
  "svb",
  "lvw",
  "lvh",
  "lvi",
  "lvb",
  "dvw",
  "dvh",
  "dvi",
  "dvb",
  "cqw",
  "cqh",
  "cqi",
  "cqb",
  "rlh",
  "rem",
  "cap",
  "rex",
  "px",
  "em",
  "ex",
  "ch",
  "ic",
  "lh",
  "vw",
  "vh",
  "vi",
  "vb",
  "cm",
  "mm",
  "in",
  "pt",
  "pc",
  "Q",
] as const
const ANGLE_UNITS = ["turn", "grad", "deg", "rad"] as const
const TIME_UNITS = ["ms", "s"] as const
const RESOLUTION_UNITS = ["dpcm", "dppx", "dpi", "x"] as const

/** Number with one of the given unit suffixes (the kit's `HasUnit`). */
function hasUnit(value: string, units: readonly string[]): boolean {
  for (const u of units) {
    if (value.endsWith(u)) {
      const n = value.slice(0, value.length - u.length).trim()
      if (NUMBER_RE.test(n)) return true
    }
  }
  return false
}

const isNumber = (v: string): boolean => NUMBER_RE.test(v.trim())
const isInteger = (v: string): boolean => INTEGER_RE.test(v.trim())
const isLength = (v: string): boolean => hasUnit(v.trim(), LENGTH_UNITS)
const isAngle = (v: string): boolean => hasUnit(v.trim(), ANGLE_UNITS)
const isTime = (v: string): boolean => hasUnit(v.trim(), TIME_UNITS)
const isResolution = (v: string): boolean => hasUnit(v.trim(), RESOLUTION_UNITS)
const isPercentage = (v: string): boolean => {
  const t = v.trim()
  return t.endsWith("%") && NUMBER_RE.test(t.slice(0, -1).trim())
}

interface DataTypeRow {
  /** A representative default `initial-value` for this type. */
  sample: string
  /** Runtime predicate; mirror of the type `SatisfiesBase` for this base. */
  test: (token: string) => boolean
}

/**
 * The data-type table — the palette vocabulary + the per-type runtime
 * predicate. `image` / `url` / `transform-function` / `transform-list` are
 * lenient (any non-empty token), mirroring the type tier (spec A5).
 */
const DATA_TYPE_TABLE: Record<DataTypeName, DataTypeRow> = {
  length: { sample: "0px", test: isLength },
  number: { sample: "0", test: isNumber },
  percentage: { sample: "0%", test: isPercentage },
  "length-percentage": {
    sample: "0px",
    test: (t) => isLength(t) || isPercentage(t),
  },
  color: { sample: "#000000", test: (t) => isColorString(t.trim()) },
  integer: { sample: "0", test: isInteger },
  angle: { sample: "0deg", test: isAngle },
  time: { sample: "0s", test: isTime },
  resolution: { sample: "1dppx", test: isResolution },
  image: { sample: "url(image.png)", test: (t) => t.trim().length > 0 },
  url: { sample: "url(image.png)", test: (t) => t.trim().length > 0 },
  "transform-function": {
    sample: "translateX(0px)",
    test: (t) => t.trim().length > 0,
  },
  "transform-list": {
    sample: "translateX(0px)",
    test: (t) => t.trim().length > 0,
  },
  "custom-ident": { sample: "none", test: (t) => t.trim().length > 0 },
}

const DATA_TYPE_ORDER: readonly DataTypeName[] = [
  "length",
  "number",
  "percentage",
  "length-percentage",
  "color",
  "integer",
  "angle",
  "time",
  "resolution",
  "image",
  "url",
  "transform-function",
  "transform-list",
  "custom-ident",
]

/** The palette options — every known `<data-type>` name. */
export function dataTypeNames(): readonly string[] {
  return DATA_TYPE_ORDER
}

function isKnownDataType(name: string): name is DataTypeName {
  return Object.hasOwn(DATA_TYPE_TABLE, name)
}

const IDENT_RE = /^[A-Za-z0-9_-]+$/

// ---------------------------------------------------------------------------
// parseSyntax — string → { universal, components, error }
// ---------------------------------------------------------------------------

/** Peel a single trailing `+`/`#` multiplier; a second one is an error. */
function parseComponent(
  raw: string,
): { component: SyntaxComponent; error: null } | { error: string } {
  const c = raw.trim()
  if (c === "") return { error: "empty component" }

  let multiplier: SyntaxComponent["multiplier"] = ""
  let base = c
  const last = c[c.length - 1]
  if (last === "+" || last === "#") {
    multiplier = last
    base = c.slice(0, -1).trim()
  }
  if (base === "") return { error: "a multiplier needs a base" }
  // a second trailing multiplier (e.g. `<length>++`)
  if (base.endsWith("+") || base.endsWith("#")) {
    return { error: `double multiplier: ${c}` }
  }

  // a `<data-type>` base
  if (base.startsWith("<") || base.endsWith(">")) {
    const m = /^<([^<>]*)>$/.exec(base)
    if (m === null) return { error: `malformed type: ${base}` }
    const name = m[1].trim()
    if (name === "") return { error: "empty data type `<>`" }
    if (!isKnownDataType(name)) return { error: `unknown data type: ${name}` }
    return {
      component: { base, isType: true, multiplier },
      error: null,
    }
  }

  // a literal ident base
  if (!IDENT_RE.test(base)) return { error: `invalid ident: ${base}` }
  return { component: { base, isType: false, multiplier }, error: null }
}

/**
 * Parse a `@property` `syntax:` descriptor into `{ universal, components,
 * error }`. The universal `*` yields `{ universal: true, components: [] }`;
 * otherwise the `|`-separated components are each classified as a known
 * `<data-type>` or a literal ident, with an optional single `+`/`#`
 * multiplier. Components parsed before an error are kept (so the UI can show
 * what was typed); `error` is `null` only on a fully valid descriptor.
 */
export function parseSyntax(src: string): {
  universal: boolean
  components: SyntaxComponent[]
  error: string | null
} {
  const trimmed = src.trim()
  if (trimmed === "") {
    return { universal: false, components: [], error: "empty syntax" }
  }
  if (trimmed === "*") {
    return { universal: true, components: [], error: null }
  }

  const parts = trimmed.split("|")
  const components: SyntaxComponent[] = []
  let error: string | null = null
  for (const part of parts) {
    const result = parseComponent(part)
    if (result.error !== null) {
      error = result.error
      break
    }
    components.push(result.component)
  }
  return { universal: false, components, error }
}

// ---------------------------------------------------------------------------
// formatSyntax — (universal, components) → string
// ---------------------------------------------------------------------------

/** Serialize one component back to `base[+|#]`. */
function formatComponent(c: SyntaxComponent): string {
  return `${c.base}${c.multiplier}`
}

/**
 * Serialize the editor state to a syntax string. The universal `*` ignores the
 * components; otherwise the components join with ` | `. No components yields
 * the empty string.
 */
export function formatSyntax(
  universal: boolean,
  components: SyntaxComponent[],
): string {
  if (universal) return "*"
  return components.map(formatComponent).join(" | ")
}

// ---------------------------------------------------------------------------
// matchesSyntax — the runtime mirror of InitialValueLiteral
// ---------------------------------------------------------------------------

/** Does a single token satisfy a single (multiplier-stripped) base? */
function satisfiesBase(token: string, base: string): boolean {
  const m = /^<([^<>]*)>$/.exec(base)
  if (m !== null) {
    const name = m[1].trim()
    if (!isKnownDataType(name)) return false
    return DATA_TYPE_TABLE[name].test(token)
  }
  // literal ident → exact match
  return token.trim() === base
}

/** Does a value satisfy a single component (honoring its multiplier)? */
function satisfiesComponent(value: string, c: SyntaxComponent): boolean {
  if (c.multiplier === "+") {
    const tokens = value
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 0)
    if (tokens.length === 0) return false
    return tokens.every((t) => satisfiesBase(t, c.base))
  }
  if (c.multiplier === "#") {
    const tokens = value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
    if (tokens.length === 0) return false
    return tokens.every((t) => satisfiesBase(t, c.base))
  }
  return satisfiesBase(value.trim(), c.base)
}

/**
 * Whether a candidate `initial-value` satisfies a `syntax` descriptor — the
 * runtime mirror of the dependent type `InitialValueLiteral`. The universal
 * `*` accepts anything; otherwise the value must satisfy ANY `|` alternative.
 * An unparseable / errored syntax never matches.
 */
export function matchesSyntax(syntax: string, value: string): boolean {
  const parsed = parseSyntax(syntax)
  if (parsed.error !== null) return false
  if (parsed.universal) return true
  return parsed.components.some((c) => satisfiesComponent(value, c))
}

// ---------------------------------------------------------------------------
// defaults
// ---------------------------------------------------------------------------

/** A sensible seed syntax descriptor. */
export function defaultSyntax(): string {
  return "<length>"
}

/**
 * A representative `initial-value` for a syntax string — the sample of the
 * first component's data type, the ident itself for a literal, or `0` for the
 * universal `*` / an unparseable syntax. Always a value the runtime accepts
 * (when the syntax is valid).
 */
export function defaultInitialValue(syntax: string): string {
  const parsed = parseSyntax(syntax)
  if (parsed.universal) return "0"
  const first = parsed.components[0]
  if (first === undefined) return "0"
  if (!first.isType) return first.base
  const m = /^<([^<>]*)>$/.exec(first.base)
  const name = m?.[1]?.trim() ?? ""
  if (isKnownDataType(name)) {
    const { sample } = DATA_TYPE_TABLE[name]
    // a `#` (comma) or `+` (space) multiplier still satisfies with one token
    return sample
  }
  return "0"
}
