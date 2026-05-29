// =====================================================================
// transform-builder.helpers.ts
//
// Pure runtime parse / format / spec for CSS `transform` values. This is
// the SUPERSET of the strict type tier: it tolerates calc()/var() inside
// arguments (kept verbatim, opaque), validates arity, and drives the UI
// from a single ARG_SPEC dispatch table.
//
// ARG_SPEC is the SINGLE SOURCE OF TRUTH. Every per-function behavior —
// arity, slot kinds/labels, arg <-> item conversion, CSS serialization and
// the seed default — lives in one row. The five operations below
// (`buildItem`, `defaultItem`, `itemToCss`, `itemArgs`, `itemFromArgs`) are
// THIN readers of that table; adding a function = adding one row.
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
  /** Seed item for a freshly-added row. */
  default: TransformItem
  /** Pull the per-slot argument strings out of an item, for editing. */
  toArgs: (item: TransformItem) => string[]
  /** Rebuild an item from edited argument strings. */
  fromArgs: (args: string[]) => TransformItem
  /** Serialize an item to its CSS function string. */
  toCss: (item: TransformItem) => string
}

const LP: ArgKind = "length-percentage"
const LEN: ArgKind = "length"
const ANG: ArgKind = "angle"
const NUM: ArgKind = "number"
const NP: ArgKind = "number-percentage"

// ---------------------------------------------------------------------------
// Shape families — one set of {toArgs, fromArgs, toCss} per item shape.
//
// Each TransformItem variant is one of six shapes. Encoding the conversions
// per shape (rather than per function) is what collapses the five duplicated
// `switch(fn)` ladders into table lookups. The casts narrow the union to the
// shape the row is known to hold — `argSpec(item.fn)` is only ever called
// with an item whose `fn` selects a row of the matching shape.
// ---------------------------------------------------------------------------

interface Shape {
  toArgs: (item: TransformItem) => string[]
  fromArgs: (fn: TransformFunctionName, args: string[]) => TransformItem
  toCss: (item: TransformItem) => string
}

/** One `value` slot: translateX/Y/Z, perspective, scaleX/Y/Z. */
const valueShape: Shape = {
  toArgs: (item) => [(item as { value: string }).value],
  fromArgs: (fn, args) => ({ fn, value: args[0] }) as TransformItem,
  toCss: (item) => `${item.fn}(${(item as { value: string }).value})`,
}

/** One `angle` slot: rotate/X/Y/Z, skewX/Y. */
const angleShape: Shape = {
  toArgs: (item) => [(item as { angle: string }).angle],
  fromArgs: (fn, args) => ({ fn, angle: args[0] }) as TransformItem,
  toCss: (item) => `${item.fn}(${(item as { angle: string }).angle})`,
}

/** One required `x`, optional `y`: translate, scale, skew. */
const xyOptionalShape: Shape = {
  toArgs: (item) => {
    const it = item as { x: string; y?: string }
    return it.y === undefined ? [it.x] : [it.x, it.y]
  },
  fromArgs: (fn, args) =>
    (args.length > 1 && args[1] !== undefined
      ? { fn, x: args[0], y: args[1] }
      : { fn, x: args[0] }) as TransformItem,
  toCss: (item) => {
    const it = item as { x: string; y?: string }
    return it.y === undefined
      ? `${item.fn}(${it.x})`
      : `${item.fn}(${it.x}, ${it.y})`
  },
}

/** Three slots x,y,z: translate3d, scale3d. */
const xyzShape: Shape = {
  toArgs: (item) => {
    const it = item as { x: string; y: string; z: string }
    return [it.x, it.y, it.z]
  },
  fromArgs: (fn, args) =>
    ({ fn, x: args[0], y: args[1], z: args[2] }) as TransformItem,
  toCss: (item) => {
    const it = item as { x: string; y: string; z: string }
    return `${item.fn}(${it.x}, ${it.y}, ${it.z})`
  },
}

/** Axis vector + angle: rotate3d. */
const xyzAngleShape: Shape = {
  toArgs: (item) => {
    const it = item as { x: string; y: string; z: string; angle: string }
    return [it.x, it.y, it.z, it.angle]
  },
  fromArgs: (fn, args) =>
    ({
      fn,
      x: args[0],
      y: args[1],
      z: args[2],
      angle: args[3],
    }) as TransformItem,
  toCss: (item) => {
    const it = item as { x: string; y: string; z: string; angle: string }
    return `${item.fn}(${it.x}, ${it.y}, ${it.z}, ${it.angle})`
  },
}

/** N-tuple of numbers: matrix, matrix3d. */
const valuesShape: Shape = {
  toArgs: (item) => (item as { values: string[] }).values,
  fromArgs: (fn, args) => ({ fn, values: args }) as TransformItem,
  toCss: (item) =>
    `${item.fn}(${(item as { values: string[] }).values.join(", ")})`,
}

/**
 * Build one ARG_SPEC row. Binds a shape's conversions to a concrete `fn`
 * (so `fromArgs` needs no argument) and carries the row's arity + UI metadata.
 */
function row(
  fn: TransformFunctionName,
  shape: Shape,
  spec: {
    min: number
    max: number
    kinds: ArgKind[]
    labels: string[]
    default: TransformItem
  },
): ArgSpec {
  return {
    min: spec.min,
    max: spec.max,
    kinds: spec.kinds,
    labels: spec.labels,
    default: spec.default,
    toArgs: shape.toArgs,
    fromArgs: (args) => shape.fromArgs(fn, args),
    toCss: shape.toCss,
  }
}

const M3D_DEFAULT: string[] = [
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
]

const ARG_SPEC: Record<TransformFunctionName, ArgSpec> = {
  translate: row("translate", xyOptionalShape, {
    min: 1,
    max: 2,
    kinds: [LP, LP],
    labels: ["x", "y"],
    default: { fn: "translate", x: "0px", y: "0px" },
  }),
  translateX: row("translateX", valueShape, {
    min: 1,
    max: 1,
    kinds: [LP],
    labels: ["x"],
    default: { fn: "translateX", value: "0px" },
  }),
  translateY: row("translateY", valueShape, {
    min: 1,
    max: 1,
    kinds: [LP],
    labels: ["y"],
    default: { fn: "translateY", value: "0px" },
  }),
  translateZ: row("translateZ", valueShape, {
    min: 1,
    max: 1,
    kinds: [LEN],
    labels: ["z"],
    default: { fn: "translateZ", value: "0px" },
  }),
  translate3d: row("translate3d", xyzShape, {
    min: 3,
    max: 3,
    kinds: [LP, LP, LEN],
    labels: ["x", "y", "z"],
    default: { fn: "translate3d", x: "0px", y: "0px", z: "0px" },
  }),
  scale: row("scale", xyOptionalShape, {
    min: 1,
    max: 2,
    kinds: [NP, NP],
    labels: ["x", "y"],
    default: { fn: "scale", x: "1" },
  }),
  scaleX: row("scaleX", valueShape, {
    min: 1,
    max: 1,
    kinds: [NP],
    labels: ["x"],
    default: { fn: "scaleX", value: "1" },
  }),
  scaleY: row("scaleY", valueShape, {
    min: 1,
    max: 1,
    kinds: [NP],
    labels: ["y"],
    default: { fn: "scaleY", value: "1" },
  }),
  scaleZ: row("scaleZ", valueShape, {
    min: 1,
    max: 1,
    kinds: [NP],
    labels: ["z"],
    default: { fn: "scaleZ", value: "1" },
  }),
  scale3d: row("scale3d", xyzShape, {
    min: 3,
    max: 3,
    kinds: [NP, NP, NP],
    labels: ["x", "y", "z"],
    default: { fn: "scale3d", x: "1", y: "1", z: "1" },
  }),
  rotate: row("rotate", angleShape, {
    min: 1,
    max: 1,
    kinds: [ANG],
    labels: ["angle"],
    default: { fn: "rotate", angle: "0deg" },
  }),
  rotateX: row("rotateX", angleShape, {
    min: 1,
    max: 1,
    kinds: [ANG],
    labels: ["angle"],
    default: { fn: "rotateX", angle: "0deg" },
  }),
  rotateY: row("rotateY", angleShape, {
    min: 1,
    max: 1,
    kinds: [ANG],
    labels: ["angle"],
    default: { fn: "rotateY", angle: "0deg" },
  }),
  rotateZ: row("rotateZ", angleShape, {
    min: 1,
    max: 1,
    kinds: [ANG],
    labels: ["angle"],
    default: { fn: "rotateZ", angle: "0deg" },
  }),
  rotate3d: row("rotate3d", xyzAngleShape, {
    min: 4,
    max: 4,
    kinds: [NUM, NUM, NUM, ANG],
    labels: ["x", "y", "z", "angle"],
    default: { fn: "rotate3d", x: "1", y: "1", z: "1", angle: "0deg" },
  }),
  skew: row("skew", xyOptionalShape, {
    min: 1,
    max: 2,
    kinds: [ANG, ANG],
    labels: ["x", "y"],
    default: { fn: "skew", x: "0deg", y: "0deg" },
  }),
  skewX: row("skewX", angleShape, {
    min: 1,
    max: 1,
    kinds: [ANG],
    labels: ["x"],
    default: { fn: "skewX", angle: "0deg" },
  }),
  skewY: row("skewY", angleShape, {
    min: 1,
    max: 1,
    kinds: [ANG],
    labels: ["y"],
    default: { fn: "skewY", angle: "0deg" },
  }),
  matrix: row("matrix", valuesShape, {
    min: 6,
    max: 6,
    kinds: [NUM, NUM, NUM, NUM, NUM, NUM],
    labels: ["a", "b", "c", "d", "e", "f"],
    default: { fn: "matrix", values: ["1", "0", "0", "1", "0", "0"] },
  }),
  matrix3d: row("matrix3d", valuesShape, {
    min: 16,
    max: 16,
    kinds: Array.from({ length: 16 }, () => NUM),
    labels: Array.from({ length: 16 }, (_, i) => `m${i + 1}`),
    default: { fn: "matrix3d", values: M3D_DEFAULT },
  }),
  perspective: row("perspective", valueShape, {
    min: 1,
    max: 1,
    kinds: [LEN],
    labels: ["depth"],
    default: { fn: "perspective", value: "800px" },
  }),
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
  return spec.fromArgs(args)
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
  return ARG_SPEC[fn].default
}

// ---------------------------------------------------------------------------
// item ↔ args — per-slot editing surface for the UI
// ---------------------------------------------------------------------------

/** Pull the per-slot argument strings out of an item, for editing. */
export function itemArgs(item: TransformItem): string[] {
  return ARG_SPEC[item.fn].toArgs(item)
}

/** Rebuild an item from edited argument strings. */
export function itemFromArgs(
  fn: TransformFunctionName,
  args: string[],
): TransformItem {
  return ARG_SPEC[fn].fromArgs(args)
}

// ---------------------------------------------------------------------------
// itemToCss / formatTransform — canonical serialization
// ---------------------------------------------------------------------------

/** Serialize one item to its CSS function string. */
export function itemToCss(item: TransformItem): string {
  return ARG_SPEC[item.fn].toCss(item)
}

/** Canonical re-serialization of a transform list. Empty → `none`. */
export function formatTransform(items: TransformItem[]): string {
  if (items.length === 0) return "none"
  return items.map(itemToCss).join(" ")
}
