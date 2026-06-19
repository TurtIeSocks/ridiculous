// =====================================================================
// shape-path-editor.helpers.ts
//
// Pure runtime parse / format / geometry for CSS `shape()` values
// (CSS Shapes L2; for clip-path / offset-path). This is the SUPERSET of the
// strict type tier in shape-path-editor.types.ts: it dispatches each comma-
// separated command on its name (move/line/hline/vline/curve/smooth/arc/
// close) into the discriminated `ShapeCommand` union, tolerates a lenient arc
// flags tail (spec A5), and drives the draggable canvas via shapeToPoints /
// updatePoint. The single source the UI parses from and serializes to.
// =====================================================================

import type {
  Point,
  ShapeCommand,
  ShapeCommandName,
  ShapeValue,
} from "./shape-path-editor.types"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMMAND_NAMES: readonly ShapeCommandName[] = [
  "move",
  "line",
  "hline",
  "vline",
  "curve",
  "smooth",
  "arc",
  "close",
]

const COMMAND_NAME_SET = new Set<string>(COMMAND_NAMES)
const FILL_RULES = new Set<string>(["nonzero", "evenodd"])

const CALL_RE = /^([a-z-]+)\((.*)\)$/is

// ---------------------------------------------------------------------------
// Splitters (paren-aware; runtime mirror of the kit combinators)
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

/** Split into space-separated tokens, dropping empty runs. */
function splitSpace(src: string): string[] {
  return splitTopLevel(src, " ")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/** Split into comma-separated parts, dropping empty parts. */
function splitComma(src: string): string[] {
  return splitTopLevel(src, ",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

// ---------------------------------------------------------------------------
// Coordinate dimension check (runtime mirror of LP<S> — needs a unit)
// ---------------------------------------------------------------------------

const LP_RE =
  /^[+-]?(\d+\.?\d*|\.\d+)(%|px|rem|em|vw|vh|vmin|vmax|ch|ex|cm|mm|in|pt|pc|q)$/i

/** A `<length-percentage>` token — a number with a unit (bare `0` rejected). */
function isLP(token: string): boolean {
  return LP_RE.test(token.trim())
}

function isByTo(token: string): token is "by" | "to" {
  return token === "by" || token === "to"
}

// ---------------------------------------------------------------------------
// from seed
// ---------------------------------------------------------------------------

interface FromSeed {
  fillRule: "nonzero" | "evenodd" | null
  from: Point
}

function parseFromSeg(seg: string): FromSeed | null {
  let tokens = splitSpace(seg)
  let fillRule: "nonzero" | "evenodd" | null = null
  if (tokens.length > 0 && FILL_RULES.has(tokens[0])) {
    fillRule = tokens[0] as "nonzero" | "evenodd"
    tokens = tokens.slice(1)
  }
  if (tokens.length !== 3 || tokens[0] !== "from") return null
  const [, x, y] = tokens
  if (!isLP(x) || !isLP(y)) return null
  return { fillRule, from: { x, y } }
}

// ---------------------------------------------------------------------------
// per-command builders — tokens → ShapeCommand | null
// ---------------------------------------------------------------------------

function buildLineLike(
  kind: "move" | "line",
  rest: string[],
): ShapeCommand | null {
  if (rest.length !== 3) return null
  const [dir, x, y] = rest
  if (!isByTo(dir) || !isLP(x) || !isLP(y)) return null
  return { kind, by: dir === "by", to: { x, y } }
}

function buildHV(kind: "hline" | "vline", rest: string[]): ShapeCommand | null {
  if (rest.length !== 2) return null
  const [dir, value] = rest
  if (!isByTo(dir) || !isLP(value)) return null
  return { kind, by: dir === "by", value }
}

function buildCurve(rest: string[]): ShapeCommand | null {
  // <by|to> <x> <y> with <cx> <cy> [ / <cx2> <cy2> ]
  if (rest.length < 6) return null
  const [dir, x, y, withKw, ...ctrl] = rest
  if (!isByTo(dir) || !isLP(x) || !isLP(y) || withKw !== "with") return null
  const to: Point = { x, y }
  if (ctrl.length === 2) {
    if (!isLP(ctrl[0]) || !isLP(ctrl[1])) return null
    return {
      kind: "curve",
      by: dir === "by",
      to,
      control: { x: ctrl[0], y: ctrl[1] },
    }
  }
  if (ctrl.length === 5 && ctrl[2] === "/") {
    const [cx1, cy1, , cx2, cy2] = ctrl
    if (!isLP(cx1) || !isLP(cy1) || !isLP(cx2) || !isLP(cy2)) return null
    return {
      kind: "curve",
      by: dir === "by",
      to,
      control: { x: cx1, y: cy1 },
      control2: { x: cx2, y: cy2 },
    }
  }
  return null
}

function buildSmooth(rest: string[]): ShapeCommand | null {
  // <by|to> <x> <y> [ with <cx> <cy> ]
  const [dir, x, y, withKw, cx, cy] = rest
  if (rest.length === 3) {
    if (!isByTo(dir) || !isLP(x) || !isLP(y)) return null
    return { kind: "smooth", by: dir === "by", to: { x, y } }
  }
  if (rest.length === 6) {
    if (
      !isByTo(dir) ||
      !isLP(x) ||
      !isLP(y) ||
      withKw !== "with" ||
      !isLP(cx) ||
      !isLP(cy)
    ) {
      return null
    }
    return {
      kind: "smooth",
      by: dir === "by",
      to: { x, y },
      control: { x: cx, y: cy },
    }
  }
  return null
}

function buildArc(rest: string[]): ShapeCommand | null {
  // <by|to> <x> <y> of <rx> [ <ry> ] [ flags… ]  (flags lenient — A5)
  if (rest.length < 5) return null
  const [dir, x, y, ofKw, rx, ...tail] = rest
  if (!isByTo(dir) || !isLP(x) || !isLP(y) || ofKw !== "of" || !isLP(rx)) {
    return null
  }
  // A second radius is present iff the next token is also a <length-percentage>.
  let ry = rx
  let flagsTokens = tail
  if (tail.length > 0 && isLP(tail[0])) {
    ry = tail[0]
    flagsTokens = tail.slice(1)
  }
  const cmd: Extract<ShapeCommand, { kind: "arc" }> = {
    kind: "arc",
    by: dir === "by",
    to: { x, y },
    radius: { x: rx, y: ry },
  }
  if (flagsTokens.length > 0) cmd.flags = flagsTokens.join(" ")
  return cmd
}

function buildCommand(seg: string): ShapeCommand | null {
  const tokens = splitSpace(seg)
  if (tokens.length === 0) return null
  const name = tokens[0]
  const rest = tokens.slice(1)
  switch (name) {
    case "close":
      return rest.length === 0 ? { kind: "close" } : null
    case "move":
    case "line":
      return buildLineLike(name, rest)
    case "hline":
    case "vline":
      return buildHV(name, rest)
    case "curve":
      return buildCurve(rest)
    case "smooth":
      return buildSmooth(rest)
    case "arc":
      return buildArc(rest)
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// parseShape — string → { fillRule, from, commands, error }
// ---------------------------------------------------------------------------

const EMPTY_FROM: Point = { x: "0px", y: "0px" }

/**
 * Parse a CSS `shape()` value into typed state. `error` is `null` on success
 * and a message otherwise; on error `from`/`commands` hold whatever was parsed
 * so far (empty when the wrapper itself is malformed). Rejects a non-`shape()`
 * function, a missing `from` seed, an unknown command, wrong arity, a missing
 * `by`/`to` direction, and any coordinate without a unit.
 */
export function parseShape(src: string): ShapeValue & { error: string | null } {
  const trimmed = src.trim()
  const m = trimmed.match(CALL_RE)
  if (m === null || m[1].toLowerCase() !== "shape") {
    return {
      fillRule: null,
      from: EMPTY_FROM,
      commands: [],
      error: "not a shape() function",
    }
  }
  const segs = splitComma(m[2])
  if (segs.length === 0) {
    return {
      fillRule: null,
      from: EMPTY_FROM,
      commands: [],
      error: "empty shape()",
    }
  }
  const seed = parseFromSeg(segs[0])
  if (seed === null) {
    return {
      fillRule: null,
      from: EMPTY_FROM,
      commands: [],
      error: "a shape() must begin with a `from <x> <y>` seed",
    }
  }
  const commands: ShapeCommand[] = []
  for (const seg of segs.slice(1)) {
    const cmd = buildCommand(seg)
    if (cmd === null) {
      return {
        fillRule: seed.fillRule,
        from: seed.from,
        commands,
        error: `invalid command: ${seg}`,
      }
    }
    commands.push(cmd)
  }
  return { fillRule: seed.fillRule, from: seed.from, commands, error: null }
}

// ---------------------------------------------------------------------------
// formatShape — ShapeValue → canonical string
// ---------------------------------------------------------------------------

function dir(by: boolean): string {
  return by ? "by" : "to"
}

function commandToCss(cmd: ShapeCommand): string {
  switch (cmd.kind) {
    case "close":
      return "close"
    case "move":
    case "line":
      return `${cmd.kind} ${dir(cmd.by)} ${cmd.to.x} ${cmd.to.y}`
    case "hline":
    case "vline":
      return `${cmd.kind} ${dir(cmd.by)} ${cmd.value}`
    case "curve": {
      const tail =
        cmd.control2 !== undefined
          ? `${cmd.control.x} ${cmd.control.y} / ${cmd.control2.x} ${cmd.control2.y}`
          : `${cmd.control.x} ${cmd.control.y}`
      return `curve ${dir(cmd.by)} ${cmd.to.x} ${cmd.to.y} with ${tail}`
    }
    case "smooth": {
      const tail =
        cmd.control !== undefined
          ? ` with ${cmd.control.x} ${cmd.control.y}`
          : ""
      return `smooth ${dir(cmd.by)} ${cmd.to.x} ${cmd.to.y}${tail}`
    }
    case "arc": {
      const radius =
        cmd.radius.x === cmd.radius.y
          ? cmd.radius.x
          : `${cmd.radius.x} ${cmd.radius.y}`
      const flags = cmd.flags !== undefined ? ` ${cmd.flags}` : ""
      return `arc ${dir(cmd.by)} ${cmd.to.x} ${cmd.to.y} of ${radius}${flags}`
    }
  }
}

/** Canonical re-serialization of a `shape()` value (units preserved). */
export function formatShape(shape: ShapeValue): string {
  const lead = shape.fillRule !== null ? `${shape.fillRule} ` : ""
  const head = `${lead}from ${shape.from.x} ${shape.from.y}`
  const body = shape.commands.map(commandToCss)
  return `shape(${[head, ...body].join(", ")})`
}

// ---------------------------------------------------------------------------
// commandNames / commandArity / defaultShape
// ---------------------------------------------------------------------------

/** The eight `<shape-command>` names, in canonical order. */
export function commandNames(): readonly ShapeCommandName[] {
  return COMMAND_NAMES
}

/** Whether `name` is one of the eight command kinds. */
export function isCommandName(name: string): name is ShapeCommandName {
  return COMMAND_NAME_SET.has(name)
}

/**
 * The number of draggable coordinate pairs a command kind carries on the
 * canvas: its endpoint plus any control point(s). `hline`/`vline` (a single
 * scalar, no canvas point) and `close` carry none.
 */
export function commandArity(kind: ShapeCommandName): number {
  switch (kind) {
    case "move":
    case "line":
    case "smooth":
    case "arc":
      return 1
    case "curve":
      return 2
    case "hline":
    case "vline":
    case "close":
      return 0
  }
}

/** A valid, parseable seed value for a freshly-created editor. */
export function defaultShape(): string {
  return "shape(from 0px 0px, line to 100px 0px, close)"
}

// ---------------------------------------------------------------------------
// shapeToPoints / updatePoint — the canvas geometry (normalized 0..200 px)
// ---------------------------------------------------------------------------

export type PointRole = "endpoint" | "control" | "control2"

export interface CanvasPoint {
  /** Stable id derived from cmdIndex + role (survives a re-derive). */
  id: string
  role: PointRole
  /** The owning command index; `-1` is the `from` seed. */
  cmdIndex: number
  x: number
  y: number
}

/** Strip the unit off a `<length-percentage>`, returning its numeric part. */
function toNumber(value: string): number {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

function pointId(cmdIndex: number, role: PointRole): string {
  return `${cmdIndex}:${role}`
}

/**
 * Project a shape's endpoints and Bézier control handles into a flat list of
 * draggable canvas points in a normalized 0..200 px space (units stripped).
 * The `from` seed is `cmdIndex: -1`. `hline`/`vline`/`close` contribute no
 * points (a single scalar / no geometry). `curve` contributes its endpoint, a
 * `control`, and — when cubic — a `control2`; `smooth` contributes its
 * endpoint (its optional control is left to the row editor, not the canvas).
 */
export function shapeToPoints(shape: ShapeValue): CanvasPoint[] {
  const out: CanvasPoint[] = [
    {
      id: pointId(-1, "endpoint"),
      role: "endpoint",
      cmdIndex: -1,
      x: toNumber(shape.from.x),
      y: toNumber(shape.from.y),
    },
  ]
  shape.commands.forEach((cmd, i) => {
    switch (cmd.kind) {
      case "move":
      case "line":
      case "smooth":
      case "arc":
        out.push({
          id: pointId(i, "endpoint"),
          role: "endpoint",
          cmdIndex: i,
          x: toNumber(cmd.to.x),
          y: toNumber(cmd.to.y),
        })
        break
      case "curve":
        out.push({
          id: pointId(i, "endpoint"),
          role: "endpoint",
          cmdIndex: i,
          x: toNumber(cmd.to.x),
          y: toNumber(cmd.to.y),
        })
        out.push({
          id: pointId(i, "control"),
          role: "control",
          cmdIndex: i,
          x: toNumber(cmd.control.x),
          y: toNumber(cmd.control.y),
        })
        if (cmd.control2 !== undefined) {
          out.push({
            id: pointId(i, "control2"),
            role: "control2",
            cmdIndex: i,
            x: toNumber(cmd.control2.x),
            y: toNumber(cmd.control2.y),
          })
        }
        break
      // hline / vline / close contribute no draggable canvas point.
    }
  })
  return out
}

function px(n: number): string {
  return `${n}px`
}

/**
 * Write a dragged canvas point's `(x, y)` (in px space) back into the matching
 * slot, returning a new `ShapeValue`. An unrecognized id is a no-op. Coordinates
 * are written with `px` units.
 */
export function updatePoint(
  shape: ShapeValue,
  id: string,
  x: number,
  y: number,
): ShapeValue {
  if (id === pointId(-1, "endpoint")) {
    return { ...shape, from: { x: px(x), y: px(y) } }
  }
  const sep = id.indexOf(":")
  if (sep === -1) return shape
  const cmdIndex = Number.parseInt(id.slice(0, sep), 10)
  const role = id.slice(sep + 1) as PointRole
  if (!Number.isInteger(cmdIndex) || cmdIndex < 0) return shape
  if (cmdIndex >= shape.commands.length) return shape

  const next = px(x)
  const nextY = px(y)
  const commands = shape.commands.map((cmd, i) => {
    if (i !== cmdIndex) return cmd
    switch (cmd.kind) {
      case "move":
      case "line":
      case "smooth":
      case "arc":
        return role === "endpoint" ? { ...cmd, to: { x: next, y: nextY } } : cmd
      case "curve":
        if (role === "endpoint") return { ...cmd, to: { x: next, y: nextY } }
        if (role === "control") {
          return { ...cmd, control: { x: next, y: nextY } }
        }
        if (role === "control2" && cmd.control2 !== undefined) {
          return { ...cmd, control2: { x: next, y: nextY } }
        }
        return cmd
      default:
        return cmd
    }
  })
  return { ...shape, commands }
}
