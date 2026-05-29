// =====================================================================
// query-builder.helpers.ts
//
// Pure runtime parse / format for CSS media + container queries. This is the
// SUPERSET of the strict type tier: it parses the structure (modifier/type or
// name, the boolean condition tree, the four feature-test shapes) but does NOT
// gate on the known-feature whitelist — it classifies and keeps the literal
// (mirrors if-function.helpers.ts). The single source of truth the UI drives off.
// =====================================================================

import type {
  FeatureOperator,
  FeatureTest,
  MediaModifier,
  MediaType,
  QueryMode,
  QueryNode,
  QueryState,
} from "./query-builder.types"

// ---------------------------------------------------------------------------
// Paren-aware low-level scanners (runtime mirrors of the type splitters)
// ---------------------------------------------------------------------------

/** Split `src` on the whole word ` ${word} ` only at bracket depth 0. */
function splitTopLevelWord(src: string, word: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ""
  let i = 0
  const token = ` ${word} `
  while (i < src.length) {
    const ch = src[i]
    if (ch === "(" || ch === "[") depth++
    else if (ch === ")" || ch === "]") depth--
    if (depth === 0 && src.startsWith(token, i)) {
      out.push(cur)
      cur = ""
      i += token.length
      continue
    }
    cur += ch
    i++
  }
  out.push(cur)
  return out.map((s) => s.trim()).filter((s) => s.length > 0)
}

/** Does the whole word ` ${word} ` occur at bracket depth 0? */
function hasTopLevelWord(src: string, word: string): boolean {
  let depth = 0
  const token = ` ${word} `
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (ch === "(" || ch === "[") depth++
    else if (ch === ")" || ch === "]") depth--
    if (depth === 0 && src.startsWith(token, i)) return true
  }
  return false
}

/** True iff every `(`/`[` is matched and depth never goes negative. */
function isBalanced(src: string): boolean {
  let depth = 0
  for (const ch of src) {
    if (ch === "(" || ch === "[") depth++
    else if (ch === ")" || ch === "]") {
      depth--
      if (depth < 0) return false
    }
  }
  return depth === 0
}

const OPS: readonly FeatureOperator[] = ["<=", ">=", "<", ">", "="]

/** Find the first operator at depth 0 → `{ index, op }`, or null. */
function firstOp(
  src: string,
): { index: number; op: FeatureOperator; len: number } | null {
  let depth = 0
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (ch === "(" || ch === "[") depth++
    else if (ch === ")" || ch === "]") depth--
    if (depth !== 0) continue
    for (const op of OPS) {
      if (src.startsWith(op, i)) return { index: i, op, len: op.length }
    }
  }
  return null
}

/** Index of the first `:` at depth 0, or -1. */
function firstTopLevelColon(src: string): number {
  let depth = 0
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (ch === "(" || ch === "[") depth++
    else if (ch === ")" || ch === "]") depth--
    else if (ch === ":" && depth === 0) return i
  }
  return -1
}

// ---------------------------------------------------------------------------
// Feature table — one row per KNOWN base feature (min-/max- stripped at lookup)
// ---------------------------------------------------------------------------

type FeatureKind = "length" | "resolution" | "ratio" | "integer" | "enum"

interface FeatureRow {
  modes: readonly QueryMode[]
  kind: FeatureKind
  enums?: readonly string[]
}

const FEATURE_TABLE: Record<string, FeatureRow> = {
  // --- length ---
  width: { modes: ["media", "container"], kind: "length" },
  height: { modes: ["media", "container"], kind: "length" },
  "inline-size": { modes: ["container"], kind: "length" },
  "block-size": { modes: ["container"], kind: "length" },
  "device-width": { modes: ["media"], kind: "length" },
  "device-height": { modes: ["media"], kind: "length" },
  // --- ratio ---
  "aspect-ratio": { modes: ["media", "container"], kind: "ratio" },
  "device-aspect-ratio": { modes: ["media"], kind: "ratio" },
  // --- resolution ---
  resolution: { modes: ["media"], kind: "resolution" },
  // --- integer ---
  color: { modes: ["media"], kind: "integer" },
  "color-index": { modes: ["media"], kind: "integer" },
  monochrome: { modes: ["media"], kind: "integer" },
  "device-pixel-ratio": { modes: ["media"], kind: "integer" },
  grid: { modes: ["media"], kind: "integer" },
  // --- enum ---
  orientation: {
    modes: ["media", "container"],
    kind: "enum",
    enums: ["portrait", "landscape"],
  },
  "prefers-color-scheme": {
    modes: ["media"],
    kind: "enum",
    enums: ["light", "dark"],
  },
  "prefers-reduced-motion": {
    modes: ["media"],
    kind: "enum",
    enums: ["no-preference", "reduce"],
  },
  "prefers-reduced-transparency": {
    modes: ["media"],
    kind: "enum",
    enums: ["no-preference", "reduce"],
  },
  "prefers-contrast": {
    modes: ["media"],
    kind: "enum",
    enums: ["no-preference", "more", "less", "custom"],
  },
  "forced-colors": {
    modes: ["media"],
    kind: "enum",
    enums: ["none", "active"],
  },
  hover: { modes: ["media"], kind: "enum", enums: ["none", "hover"] },
  "any-hover": { modes: ["media"], kind: "enum", enums: ["none", "hover"] },
  pointer: {
    modes: ["media"],
    kind: "enum",
    enums: ["none", "coarse", "fine"],
  },
  "any-pointer": {
    modes: ["media"],
    kind: "enum",
    enums: ["none", "coarse", "fine"],
  },
  "color-gamut": {
    modes: ["media"],
    kind: "enum",
    enums: ["srgb", "p3", "rec2020"],
  },
  "dynamic-range": {
    modes: ["media"],
    kind: "enum",
    enums: ["standard", "high"],
  },
  "video-dynamic-range": {
    modes: ["media"],
    kind: "enum",
    enums: ["standard", "high"],
  },
  scripting: {
    modes: ["media"],
    kind: "enum",
    enums: ["none", "initial-only", "enabled"],
  },
  update: {
    modes: ["media"],
    kind: "enum",
    enums: ["none", "slow", "fast"],
  },
  "overflow-block": {
    modes: ["media"],
    kind: "enum",
    enums: ["none", "scroll", "paged"],
  },
  "overflow-inline": {
    modes: ["media"],
    kind: "enum",
    enums: ["none", "scroll"],
  },
  "display-mode": {
    modes: ["media"],
    kind: "enum",
    enums: [
      "fullscreen",
      "standalone",
      "minimal-ui",
      "browser",
      "window-controls-overlay",
    ],
  },
}

function stripMinMax(feature: string): string {
  if (feature.startsWith("min-")) return feature.slice(4)
  if (feature.startsWith("max-")) return feature.slice(4)
  return feature
}

function lookup(feature: string, mode: QueryMode): FeatureRow | null {
  const row = FEATURE_TABLE[stripMinMax(feature.trim())]
  if (row === undefined) return null
  return row.modes.includes(mode) ? row : null
}

/** Classify a feature for a mode, or "unknown". */
export function featureKind(
  feature: string,
  mode: QueryMode,
): FeatureKind | "unknown" {
  const row = lookup(feature, mode)
  return row === null ? "unknown" : row.kind
}

/**
 * The feature `<select>` options for a mode. Numerically-bounded features
 * (length / resolution / ratio / integer) also expose their legacy `min-` /
 * `max-` prefixed variants so the row select can hold e.g. `min-width`.
 */
export function featuresFor(mode: QueryMode): readonly string[] {
  const out: string[] = []
  for (const f of Object.keys(FEATURE_TABLE)) {
    const row = FEATURE_TABLE[f]
    if (!row.modes.includes(mode)) continue
    out.push(f)
    if (row.kind !== "enum") {
      out.push(`min-${f}`, `max-${f}`)
    }
  }
  return out.sort()
}

/** The enum keyword options for a feature, or null if it is not an enum. */
export function enumOptionsFor(feature: string): readonly string[] | null {
  const row = FEATURE_TABLE[stripMinMax(feature.trim())]
  if (row === undefined || row.kind !== "enum") return null
  return row.enums ?? null
}

// ---------------------------------------------------------------------------
// parseFeatureTest — classify one (unwrapped) feature test
// ---------------------------------------------------------------------------

/**
 * Classify the content of a `( … )` feature test into a discriminated record,
 * or `null` if it is empty / malformed (an empty value, a lone operator).
 */
export function parseFeatureTest(inner: string): FeatureTest | null {
  const s = inner.trim()
  if (s === "") return null

  // range: one or two top-level operators
  const op1 = firstOp(s)
  if (op1 !== null) {
    const left = s.slice(0, op1.index).trim()
    const afterOp1 = s.slice(op1.index + op1.len)
    const op2 = firstOp(afterOp1)
    if (op2 !== null) {
      // range3: left op1 mid op2 right
      const mid = afterOp1.slice(0, op2.index).trim()
      const right = afterOp1.slice(op2.index + op2.len).trim()
      if (left === "" || mid === "" || right === "") return null
      return {
        kind: "range3",
        feature: mid,
        op: op1.op,
        value: left,
        op2: op2.op,
        value2: right,
      }
    }
    // range2: left op1 right (left is the feature)
    const right = afterOp1.trim()
    if (left === "" || right === "") return null
    return { kind: "range2", feature: left, op: op1.op, value: right }
  }

  // plain `feature: value`
  const colon = firstTopLevelColon(s)
  if (colon !== -1) {
    const feature = s.slice(0, colon).trim()
    const value = s.slice(colon + 1).trim()
    if (feature === "" || value === "") return null
    return { kind: "plain", feature, value }
  }

  // boolean `feature`
  return { kind: "boolean", feature: s }
}

// ---------------------------------------------------------------------------
// parseQuery — string → QueryNode | null
// ---------------------------------------------------------------------------

const MEDIA_TYPES = new Set(["all", "screen", "print"])
const MODIFIERS = new Set(["only", "not"])

/** Parse a balanced `( … )` test or nested group into a QueryNode. */
function parseTestToken(token: string, mode: QueryMode): QueryNode | null {
  let s = token.trim()
  let not = false
  if (s.startsWith("not ")) {
    not = true
    s = s.slice(4).trim()
  }
  if (!s.startsWith("(") || !s.endsWith(")") || !isBalanced(s)) return null
  const inner = s.slice(1, -1).trim()
  // nested group? inner starts with `(` / `not ` or has a top-level joiner
  const nested =
    inner.startsWith("(") ||
    inner.startsWith("not ") ||
    hasTopLevelWord(inner, "and") ||
    hasTopLevelWord(inner, "or")
  if (nested) {
    const sub = parseCondition(inner, mode)
    if (sub === null) return null
    // mark the group's own negation
    return { ...sub, not: sub.not !== not }
  }
  const test = parseFeatureTest(inner)
  if (test === null) return null
  return { type: "test", not, test }
}

/** Parse a boolean condition (handles `not`, and/or splits) into a QueryNode. */
function parseCondition(src: string, mode: QueryMode): QueryNode | null {
  let s = src.trim()
  if (s === "") return null

  let not = false
  // a leading `not ` that negates the whole condition (a single test follows)
  if (
    s.startsWith("not ") &&
    !hasTopLevelWord(s, "and") &&
    !hasTopLevelWord(s, "or")
  ) {
    not = true
    s = s.slice(4).trim()
  }

  // pick the joiner present at top level
  const andParts = splitTopLevelWord(s, "and")
  const orParts = splitTopLevelWord(s, "or")
  let joiner: "and" | "or" = "and"
  let parts: string[]
  if (andParts.length > 1) {
    joiner = "and"
    parts = andParts
  } else if (orParts.length > 1) {
    joiner = "or"
    parts = orParts
  } else {
    // single test (possibly a parenthesized group)
    const node = parseTestToken(s, mode)
    if (node === null) return null
    if (node.type === "group") return { ...node, not: node.not !== not }
    return { type: "group", joiner: "and", not, tests: nodeTests(node) }
  }

  // flatten each part into its FeatureTest(s); a nested group becomes raw-ish —
  // for the flat editor we keep its tests if it is itself a simple group.
  const tests: FeatureTest[] = []
  for (const part of parts) {
    const node = parseTestToken(part, mode)
    if (node === null) return null
    tests.push(...nodeTests(node))
  }
  return { type: "group", joiner, not, tests }
}

/** Extract the flat FeatureTest list from a node (for the flat editor model). */
function nodeTests(node: QueryNode): FeatureTest[] {
  if (node.type === "test") return [node.test]
  if (node.type === "group") return node.tests
  return []
}

/**
 * Parse a media / container query string into a QueryNode, or an error.
 * Strips the optional leading media-type + modifier (media) or container name
 * (container), then parses the condition.
 */
export function parseQuery(
  src: string,
  mode: QueryMode,
): { node: QueryNode | null; error: string | null } {
  const trimmed = src.trim()
  if (trimmed === "") return { node: null, error: "empty query" }
  if (!isBalanced(trimmed)) return { node: null, error: "unbalanced parens" }

  let rest = trimmed

  if (mode === "media") {
    // optional modifier + media type, possibly followed by `and <cond>`
    const tokens = rest.split(/\s+/)
    let consumed = 0
    if (MODIFIERS.has(tokens[0]) && MEDIA_TYPES.has(tokens[1] ?? "")) {
      consumed = 2
    } else if (MEDIA_TYPES.has(tokens[0])) {
      consumed = 1
    }
    if (consumed > 0) {
      const after = tokens.slice(consumed)
      if (after.length === 0) {
        // a bare (modified) media type — no condition
        return {
          node: { type: "group", joiner: "and", not: false, tests: [] },
          error: null,
        }
      }
      // expect `and <condition>`
      if (after[0] !== "and") {
        return { node: null, error: "expected `and` after media type" }
      }
      rest = after.slice(1).join(" ")
    }
  } else {
    // container: optional leading name ident (head not `(` and not `not`)
    if (!rest.startsWith("(") && !rest.startsWith("not ")) {
      const space = rest.indexOf(" ")
      if (space !== -1) rest = rest.slice(space + 1).trim()
    }
  }

  const node = parseCondition(rest, mode)
  if (node === null) return { node: null, error: "could not parse condition" }
  return { node, error: null }
}

// ---------------------------------------------------------------------------
// parseQueryState — string → flat QueryState | null (drives the row editor)
// ---------------------------------------------------------------------------

/**
 * Parse a query string into the flat editor state: the leading modifier/type
 * (media) or name (container), the single joiner, the top-level `not`, and the
 * flat feature-test list. Returns `null` if the string does not parse. Nested
 * groups collapse to their flat tests (design A8); the casual tier preserves
 * arbitrary strings, but the row editor edits this flat shape.
 */
export function parseQueryState(
  src: string,
  mode: QueryMode,
): QueryState | null {
  const trimmed = src.trim()
  if (trimmed === "") return null
  if (!isBalanced(trimmed)) return null

  let modifier: MediaModifier | undefined
  let mediaType: MediaType | undefined
  let containerName: string | undefined
  let rest = trimmed
  let leadNot = false

  if (mode === "media") {
    const tokens = rest.split(/\s+/)
    let consumed = 0
    if (MODIFIERS.has(tokens[0]) && MEDIA_TYPES.has(tokens[1] ?? "")) {
      modifier = tokens[0] as MediaModifier
      mediaType = tokens[1] as MediaType
      consumed = 2
    } else if (MEDIA_TYPES.has(tokens[0])) {
      mediaType = tokens[0] as MediaType
      consumed = 1
    }
    if (consumed > 0) {
      const after = tokens.slice(consumed)
      if (after.length === 0) {
        return {
          mode,
          modifier,
          mediaType,
          joiner: "and",
          not: false,
          tests: [],
        }
      }
      if (after[0] !== "and") return null
      rest = after.slice(1).join(" ")
    }
  } else if (!rest.startsWith("(") && !rest.startsWith("not ")) {
    const space = rest.indexOf(" ")
    if (space !== -1) {
      containerName = rest.slice(0, space).trim()
      rest = rest.slice(space + 1).trim()
    }
  }

  const node = parseCondition(rest, mode)
  if (node === null || node.type === "raw") return null
  if (node.type === "test") {
    leadNot = node.not
    return {
      mode,
      modifier,
      mediaType,
      containerName,
      joiner: "and",
      not: leadNot,
      tests: [node.test],
    }
  }
  return {
    mode,
    modifier,
    mediaType,
    containerName,
    joiner: node.joiner,
    not: node.not,
    tests: node.tests,
  }
}

// ---------------------------------------------------------------------------
// format — canonical serialization
// ---------------------------------------------------------------------------

/** Serialize one feature test to its `feature[: value | op value | …]` body. */
export function formatFeatureTest(test: FeatureTest): string {
  switch (test.kind) {
    case "boolean":
      return test.feature
    case "plain":
      return `${test.feature}: ${test.value}`
    case "range2":
      return `${test.feature} ${test.op} ${test.value}`
    case "range3":
      return `${test.value} ${test.op} ${test.feature} ${test.op2} ${test.value2}`
  }
}

/** Wrap a feature test in its parens. */
function testToCss(test: FeatureTest): string {
  return `(${formatFeatureTest(test)})`
}

/** Canonical re-serialization of a parsed node. */
export function formatQuery(node: QueryNode, _mode: QueryMode): string {
  if (node.type === "raw") {
    return node.not ? `not ${node.text}` : node.text
  }
  if (node.type === "test") {
    const body = testToCss(node.test)
    return node.not ? `not ${body}` : body
  }
  const body = node.tests.map(testToCss).join(` ${node.joiner} `)
  if (!node.not) return body
  // not binds one operand → wrap multi-test conditions
  return node.tests.length > 1 ? `not (${body})` : `not ${body}`
}

// ---------------------------------------------------------------------------
// queryToString — from the flat editor state
// ---------------------------------------------------------------------------

/** Serialize the flat editor state into a query string. */
export function queryToString(state: QueryState): string {
  const condition = state.tests.map(testToCss).join(` ${state.joiner} `)

  if (state.mode === "media") {
    const lead = [state.modifier, state.mediaType].filter(Boolean).join(" ")
    if (state.tests.length === 0) return lead
    const negated = applyNot(condition, state.tests.length, state.not)
    return lead === "" ? negated : `${lead} and ${negated}`
  }

  // container
  const negated = applyNot(condition, state.tests.length, state.not)
  return state.containerName ? `${state.containerName} ${negated}` : negated
}

function applyNot(condition: string, count: number, not: boolean): string {
  if (!not) return condition
  return count > 1 ? `not (${condition})` : `not ${condition}`
}

// ---------------------------------------------------------------------------
// defaults
// ---------------------------------------------------------------------------

/** A sensible default feature test for a mode. */
export function defaultFeatureTest(mode: QueryMode): FeatureTest {
  return mode === "container"
    ? { kind: "range2", feature: "inline-size", op: ">", value: "400px" }
    : { kind: "range2", feature: "width", op: ">=", value: "600px" }
}

/** A default flat query state (one test). */
export function defaultQuery(mode: QueryMode): QueryState {
  return {
    mode,
    mediaType: mode === "media" ? "screen" : undefined,
    joiner: "and",
    not: false,
    tests: [defaultFeatureTest(mode)],
  }
}

// ---------------------------------------------------------------------------
// matchesNow — media only, guarded
// ---------------------------------------------------------------------------

/**
 * Whether a media query matches right now via `window.matchMedia`. Returns
 * `null` for container mode (no standard live-match API) or when `matchMedia`
 * is unavailable (SSR / older jsdom).
 */
export function matchesNow(query: string, mode: QueryMode): boolean | null {
  if (mode !== "media") return null
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return null
  }
  try {
    return window.matchMedia(query).matches
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// ParseResult facade (mirrors if-function / box-shadow editors)
// ---------------------------------------------------------------------------

export interface ParseResult {
  node: QueryNode | null
  error: string | null
}
