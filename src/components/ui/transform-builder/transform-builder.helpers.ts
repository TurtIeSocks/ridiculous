// =====================================================================
// transform-builder.helpers.ts
//
// Pure runtime parse / format / spec for CSS `transform` values. This is
// the SUPERSET of the strict type tier: it tolerates calc()/var() inside
// arguments (kept verbatim, opaque), validates arity, and drives the UI
// from a single ARG_SPEC dispatch table.
// =====================================================================

import type {
  TransformFunctionName,
  TransformItem,
} from "./transform-builder.types"

// ---------------------------------------------------------------------------
// ARG_SPEC — the runtime dispatch table (single source of truth)
// ---------------------------------------------------------------------------

/** Dimension family an argument slot accepts. Mirrors the type predicates. */
export type ArgKind =
  | "length-percentage"
  | "length"
  | "angle"
  | "number"
  | "number-percentage"

export interface ArgSpec {
  /** Minimum argument count. */
  min: number
  /** Maximum argument count. */
  max: number
  /** Per-slot dimension kinds (length === max for fixed-arity functions). */
  kinds: ArgKind[]
  /** Axis / slot labels for the UI. */
  labels: string[]
}

const LP: ArgKind = "length-percentage"
const LEN: ArgKind = "length"
const ANG: ArgKind = "angle"
const NUM: ArgKind = "number"
const NP: ArgKind = "number-percentage"

const ARG_SPEC: Record<TransformFunctionName, ArgSpec> = {
  translate: { min: 1, max: 2, kinds: [LP, LP], labels: ["x", "y"] },
  translateX: { min: 1, max: 1, kinds: [LP], labels: ["x"] },
  translateY: { min: 1, max: 1, kinds: [LP], labels: ["y"] },
  translateZ: { min: 1, max: 1, kinds: [LEN], labels: ["z"] },
  translate3d: {
    min: 3,
    max: 3,
    kinds: [LP, LP, LEN],
    labels: ["x", "y", "z"],
  },
  scale: { min: 1, max: 2, kinds: [NP, NP], labels: ["x", "y"] },
  scaleX: { min: 1, max: 1, kinds: [NP], labels: ["x"] },
  scaleY: { min: 1, max: 1, kinds: [NP], labels: ["y"] },
  scaleZ: { min: 1, max: 1, kinds: [NP], labels: ["z"] },
  scale3d: { min: 3, max: 3, kinds: [NP, NP, NP], labels: ["x", "y", "z"] },
  rotate: { min: 1, max: 1, kinds: [ANG], labels: ["angle"] },
  rotateX: { min: 1, max: 1, kinds: [ANG], labels: ["angle"] },
  rotateY: { min: 1, max: 1, kinds: [ANG], labels: ["angle"] },
  rotateZ: { min: 1, max: 1, kinds: [ANG], labels: ["angle"] },
  rotate3d: {
    min: 4,
    max: 4,
    kinds: [NUM, NUM, NUM, ANG],
    labels: ["x", "y", "z", "angle"],
  },
  skew: { min: 1, max: 2, kinds: [ANG, ANG], labels: ["x", "y"] },
  skewX: { min: 1, max: 1, kinds: [ANG], labels: ["x"] },
  skewY: { min: 1, max: 1, kinds: [ANG], labels: ["y"] },
  matrix: {
    min: 6,
    max: 6,
    kinds: [NUM, NUM, NUM, NUM, NUM, NUM],
    labels: ["a", "b", "c", "d", "e", "f"],
  },
  matrix3d: {
    min: 16,
    max: 16,
    kinds: Array.from({ length: 16 }, () => NUM),
    labels: Array.from({ length: 16 }, (_, i) => `m${i + 1}`),
  },
  perspective: { min: 1, max: 1, kinds: [LEN], labels: ["depth"] },
}

const FUNCTION_NAMES = new Set<string>(Object.keys(ARG_SPEC))

function isFunctionName(name: string): name is TransformFunctionName {
  return FUNCTION_NAMES.has(name)
}

/** The argument spec for a function — drives both parsing and the UI. */
export function argSpec(fn: TransformFunctionName): ArgSpec {
  return ARG_SPEC[fn]
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

/** Split a transform list into function tokens, dropping empty runs. */
function splitFunctions(src: string): string[] {
  return splitTopLevel(src, " ")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/** Split a function's argument string into trimmed args (drops empty). */
function splitArgs(argStr: string): string[] {
  const trimmed = argStr.trim()
  if (trimmed === "") return []
  return splitTopLevel(trimmed, ",").map((s) => s.trim())
}

const CALL_RE = /^([a-zA-Z][a-zA-Z0-9]*)\((.*)\)$/s

// ---------------------------------------------------------------------------
// parseTransform — string → TransformItem[] | null
// ---------------------------------------------------------------------------

function buildItem(
  fn: TransformFunctionName,
  args: string[],
): TransformItem | null {
  const spec = ARG_SPEC[fn]
  if (args.length < spec.min || args.length > spec.max) return null

  switch (fn) {
    case "translateX":
    case "translateY":
    case "translateZ":
    case "perspective":
    case "scaleX":
    case "scaleY":
    case "scaleZ":
      return { fn, value: args[0] }
    case "rotate":
    case "rotateX":
    case "rotateY":
    case "rotateZ":
    case "skewX":
    case "skewY":
      return { fn, angle: args[0] }
    case "translate":
    case "scale":
    case "skew":
      return args.length === 1
        ? { fn, x: args[0] }
        : { fn, x: args[0], y: args[1] }
    case "translate3d":
      return { fn, x: args[0], y: args[1], z: args[2] }
    case "scale3d":
      return { fn, x: args[0], y: args[1], z: args[2] }
    case "rotate3d":
      return { fn, x: args[0], y: args[1], z: args[2], angle: args[3] }
    case "matrix":
    case "matrix3d":
      return { fn, values: args }
  }
}

/**
 * Parse a CSS `transform` value into typed items, or `null` on any syntax,
 * unknown-function, or arity error. `none` / empty → `[]`.
 */
export function parseTransform(src: string): TransformItem[] | null {
  const trimmed = src.trim()
  if (trimmed === "" || trimmed === "none") return []

  const tokens = splitFunctions(trimmed)
  if (tokens.length === 0) return []

  const items: TransformItem[] = []
  for (const token of tokens) {
    const m = token.match(CALL_RE)
    if (!m) return null
    const name = m[1]
    if (!isFunctionName(name)) return null
    const args = splitArgs(m[2])
    const item = buildItem(name, args)
    if (item === null) return null
    items.push(item)
  }
  return items
}

/** Runtime mirror of `FunctionsOf` — list the function names in order. */
export function transformFunctions(src: string): string[] {
  const items = parseTransform(src)
  if (items === null) return []
  return items.map((it) => it.fn)
}

// ---------------------------------------------------------------------------
// defaultItem — seed a fresh row
// ---------------------------------------------------------------------------

/** A sensible default item for a freshly-added function row. */
export function defaultItem(fn: TransformFunctionName): TransformItem {
  switch (fn) {
    case "translateX":
    case "translateY":
    case "translateZ":
      return { fn, value: "0px" }
    case "perspective":
      return { fn, value: "800px" }
    case "scaleX":
    case "scaleY":
    case "scaleZ":
      return { fn, value: "1" }
    case "rotate":
    case "rotateX":
    case "rotateY":
    case "rotateZ":
      return { fn, angle: "0deg" }
    case "skewX":
    case "skewY":
      return { fn, angle: "0deg" }
    case "translate":
      return { fn, x: "0px", y: "0px" }
    case "scale":
      return { fn, x: "1" }
    case "skew":
      return { fn, x: "0deg", y: "0deg" }
    case "translate3d":
      return { fn, x: "0px", y: "0px", z: "0px" }
    case "scale3d":
      return { fn, x: "1", y: "1", z: "1" }
    case "rotate3d":
      return { fn, x: "1", y: "1", z: "1", angle: "0deg" }
    case "matrix":
      return { fn, values: ["1", "0", "0", "1", "0", "0"] }
    case "matrix3d":
      return {
        fn,
        values: [
          "1",
          "0",
          "0",
          "0",
          "0",
          "1",
          "0",
          "0",
          "0",
          "0",
          "1",
          "0",
          "0",
          "0",
          "0",
          "1",
        ],
      }
  }
}

// ---------------------------------------------------------------------------
// itemToCss / formatTransform — canonical serialization
// ---------------------------------------------------------------------------

/** Serialize one item to its CSS function string. */
export function itemToCss(item: TransformItem): string {
  switch (item.fn) {
    case "translateX":
    case "translateY":
    case "translateZ":
    case "perspective":
    case "scaleX":
    case "scaleY":
    case "scaleZ":
      return `${item.fn}(${item.value})`
    case "rotate":
    case "rotateX":
    case "rotateY":
    case "rotateZ":
    case "skewX":
    case "skewY":
      return `${item.fn}(${item.angle})`
    case "translate":
    case "scale":
    case "skew":
      return item.y === undefined
        ? `${item.fn}(${item.x})`
        : `${item.fn}(${item.x}, ${item.y})`
    case "translate3d":
    case "scale3d":
      return `${item.fn}(${item.x}, ${item.y}, ${item.z})`
    case "rotate3d":
      return `rotate3d(${item.x}, ${item.y}, ${item.z}, ${item.angle})`
    case "matrix":
    case "matrix3d":
      return `${item.fn}(${item.values.join(", ")})`
  }
}

/** Canonical re-serialization of a transform list. Empty → `none`. */
export function formatTransform(items: TransformItem[]): string {
  if (items.length === 0) return "none"
  return items.map(itemToCss).join(" ")
}

// ---------------------------------------------------------------------------
// ParseResult facade
// ---------------------------------------------------------------------------

export interface ParseResult {
  items: TransformItem[] | null
  error: string | null
}
