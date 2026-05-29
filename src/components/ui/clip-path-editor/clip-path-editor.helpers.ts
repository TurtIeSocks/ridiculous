// =====================================================================
// clip-path-editor.helpers.ts
//
// Pure runtime parse / format / spec for CSS `clip-path` / `shape-outside`
// values. This is the SUPERSET of the strict type tier: it tolerates
// calc()/var() inside coordinates (kept verbatim, opaque), accepts a
// leading OR trailing geometry box, validates arity, and drives the UI
// from a single shape-spec dispatch.
// =====================================================================

import type {
  BasicShapeName,
  ClipPathShapeState,
  ClipPathState,
  GeometryBox,
} from "./clip-path-editor.types"

// ---------------------------------------------------------------------------
// Constants — geometry boxes, shape names, fill rules
// ---------------------------------------------------------------------------

const GEOMETRY_BOXES: readonly GeometryBox[] = [
  "margin-box",
  "border-box",
  "padding-box",
  "content-box",
  "fill-box",
  "stroke-box",
  "view-box",
]

const GEOMETRY_BOX_SET = new Set<string>(GEOMETRY_BOXES)
const SHAPE_NAMES = new Set<string>(["inset", "circle", "ellipse", "polygon"])

function isGeometryBox(token: string): token is GeometryBox {
  return GEOMETRY_BOX_SET.has(token)
}

function isShapeName(name: string): name is BasicShapeName {
  return SHAPE_NAMES.has(name)
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

// Name regex allows nothing but letters (inset/circle/ellipse/polygon).
const CALL_RE = /^([a-z]+)\((.*)\)$/is

// ---------------------------------------------------------------------------
// Geometry-box peel (mirror of the type-level PeelBox)
// ---------------------------------------------------------------------------

interface BoxPeel {
  box?: GeometryBox
  boxPosition?: "leading" | "trailing"
  rest: string
  /** true when a box appears at BOTH ends — caller treats as invalid. */
  doubleBox: boolean
}

/** Peel at most one geometry box (trailing preferred, then leading). */
function peelBox(src: string): BoxPeel {
  const tokens = splitSpace(src)
  if (tokens.length === 0) return { rest: src, doubleBox: false }

  const first = tokens[0]
  const last = tokens[tokens.length - 1]
  const leading = tokens.length > 1 && isGeometryBox(first)
  const trailing = tokens.length > 1 && isGeometryBox(last)

  if (leading && trailing) return { rest: src, doubleBox: true }
  if (trailing) {
    return {
      box: last as GeometryBox,
      boxPosition: "trailing",
      rest: tokens.slice(0, -1).join(" "),
      doubleBox: false,
    }
  }
  if (leading) {
    return {
      box: first as GeometryBox,
      boxPosition: "leading",
      rest: tokens.slice(1).join(" "),
      doubleBox: false,
    }
  }
  return { rest: src, doubleBox: false }
}

// ---------------------------------------------------------------------------
// Per-shape builders — string args → ClipPathShapeState | null
// ---------------------------------------------------------------------------

function buildInset(argStr: string): ClipPathShapeState | null {
  const tokens = splitSpace(argStr)
  if (tokens.length === 0) return null
  const roundIdx = tokens.indexOf("round")
  const box = roundIdx === -1 ? tokens : tokens.slice(0, roundIdx)
  const round = roundIdx === -1 ? undefined : tokens.slice(roundIdx + 1)
  if (box.length < 1 || box.length > 4) return null
  if (round !== undefined && round.length === 0) return null
  const [top, right, bottom, left] = box
  const state: Extract<ClipPathShapeState, { shape: "inset" }> = {
    shape: "inset",
    top,
  }
  if (right !== undefined) state.right = right
  if (bottom !== undefined) state.bottom = bottom
  if (left !== undefined) state.left = left
  if (round !== undefined) state.round = round.join(" ")
  return state
}

function buildCircle(argStr: string): ClipPathShapeState | null {
  if (argStr.trim() === "") return { shape: "circle" }
  const tokens = splitSpace(argStr)
  const state: Extract<ClipPathShapeState, { shape: "circle" }> = {
    shape: "circle",
  }
  const atIdx = tokens.indexOf("at")
  const radiusTokens = atIdx === -1 ? tokens : tokens.slice(0, atIdx)
  if (radiusTokens.length > 1) return null // a circle has one radius
  if (radiusTokens.length === 1) state.radius = radiusTokens[0]
  if (atIdx !== -1) {
    const pos = readPosition(tokens.slice(atIdx + 1))
    if (pos === null) return null
    state.atX = pos.x
    state.atY = pos.y
  }
  return state
}

function buildEllipse(argStr: string): ClipPathShapeState | null {
  if (argStr.trim() === "") return { shape: "ellipse" }
  const tokens = splitSpace(argStr)
  const state: Extract<ClipPathShapeState, { shape: "ellipse" }> = {
    shape: "ellipse",
  }
  const atIdx = tokens.indexOf("at")
  const radiusTokens = atIdx === -1 ? tokens : tokens.slice(0, atIdx)
  if (radiusTokens.length !== 2) return null // ellipse needs exactly two radii
  state.rx = radiusTokens[0]
  state.ry = radiusTokens[1]
  if (atIdx !== -1) {
    const pos = readPosition(tokens.slice(atIdx + 1))
    if (pos === null) return null
    state.atX = pos.x
    state.atY = pos.y
  }
  return state
}

function buildPolygon(argStr: string): ClipPathShapeState | null {
  const parts = splitComma(argStr)
  if (parts.length === 0) return null
  const state: Extract<ClipPathShapeState, { shape: "polygon" }> = {
    shape: "polygon",
    vertices: [],
  }
  let vertexParts = parts
  if (parts[0] === "nonzero" || parts[0] === "evenodd") {
    state.fillRule = parts[0]
    vertexParts = parts.slice(1)
  }
  if (vertexParts.length === 0) return null
  for (const part of vertexParts) {
    const coords = splitSpace(part)
    if (coords.length !== 2) return null
    state.vertices.push({ x: coords[0], y: coords[1] })
  }
  return state
}

/**
 * Best-effort `<position>` reader. Handles the 1- and 2-token forms the
 * editor produces; for 3/4-token edge-offset forms it keeps the two values
 * it can represent (dropping edge keywords it cannot — documented).
 */
function readPosition(tokens: string[]): { x: string; y: string } | null {
  if (tokens.length === 0) return null
  if (tokens.length === 1) return { x: tokens[0], y: tokens[0] }
  if (tokens.length === 2) return { x: tokens[0], y: tokens[1] }
  // 3/4-token edge-offset form: best-effort — take the numeric/keyword values
  // that are not edge anchors. Fall back to first + last.
  const values = tokens.filter(
    (t) => t !== "left" && t !== "right" && t !== "top" && t !== "bottom",
  )
  if (values.length >= 2) return { x: values[0], y: values[1] }
  return { x: tokens[0], y: tokens[tokens.length - 1] }
}

function buildShape(
  name: BasicShapeName,
  argStr: string,
): ClipPathShapeState | null {
  switch (name) {
    case "inset":
      return buildInset(argStr)
    case "circle":
      return buildCircle(argStr)
    case "ellipse":
      return buildEllipse(argStr)
    case "polygon":
      return buildPolygon(argStr)
  }
}

// ---------------------------------------------------------------------------
// parseClipPath — string → ClipPathState | null
// ---------------------------------------------------------------------------

/**
 * Parse a CSS `clip-path` / `shape-outside` value into typed state, or `null`
 * on any syntax, unknown-shape, arity, or double-box error. `none` / empty →
 * `{ shape: null }`. A bare geometry box → `{ box, shape: null }`.
 */
export function parseClipPath(src: string): ClipPathState | null {
  const trimmed = src.trim()
  if (trimmed === "" || trimmed === "none") return { shape: null }

  // A bare geometry box on its own (single token, no shape).
  if (isGeometryBox(trimmed)) return { box: trimmed, shape: null }

  const peel = peelBox(trimmed)
  if (peel.doubleBox) return null

  const rest = peel.rest.trim()
  const boxFields =
    peel.box !== undefined
      ? { box: peel.box, boxPosition: peel.boxPosition }
      : {}

  // A bare geometry box with no shape.
  if (rest === "") {
    if (peel.box === undefined) return null
    return { box: peel.box, shape: null }
  }

  const m = rest.match(CALL_RE)
  if (m === null) return null
  const name = m[1].toLowerCase()
  if (!isShapeName(name)) return null
  const shape = buildShape(name, m[2])
  if (shape === null) return null
  return { ...boxFields, shape }
}

// ---------------------------------------------------------------------------
// formatClipPath — ClipPathState → canonical string
// ---------------------------------------------------------------------------

function insetToCss(
  s: Extract<ClipPathShapeState, { shape: "inset" }>,
): string {
  const box = [s.top, s.right, s.bottom, s.left].filter(
    (v): v is string => v !== undefined,
  )
  const round = s.round !== undefined ? ` round ${s.round}` : ""
  return `inset(${box.join(" ")}${round})`
}

function circleToCss(
  s: Extract<ClipPathShapeState, { shape: "circle" }>,
): string {
  const parts: string[] = []
  if (s.radius !== undefined) parts.push(s.radius)
  if (s.atX !== undefined && s.atY !== undefined) {
    parts.push("at", s.atX, s.atY)
  }
  return `circle(${parts.join(" ")})`
}

function ellipseToCss(
  s: Extract<ClipPathShapeState, { shape: "ellipse" }>,
): string {
  const parts: string[] = []
  if (s.rx !== undefined && s.ry !== undefined) parts.push(s.rx, s.ry)
  if (s.atX !== undefined && s.atY !== undefined) {
    parts.push("at", s.atX, s.atY)
  }
  return `ellipse(${parts.join(" ")})`
}

function polygonToCss(
  s: Extract<ClipPathShapeState, { shape: "polygon" }>,
): string {
  const verts = s.vertices.map((v) => `${v.x} ${v.y}`)
  const body =
    s.fillRule !== undefined
      ? [s.fillRule, ...verts].join(", ")
      : verts.join(", ")
  return `polygon(${body})`
}

/** Serialize one shape to its CSS function string. */
export function shapeToCss(shape: ClipPathShapeState): string {
  switch (shape.shape) {
    case "inset":
      return insetToCss(shape)
    case "circle":
      return circleToCss(shape)
    case "ellipse":
      return ellipseToCss(shape)
    case "polygon":
      return polygonToCss(shape)
  }
}

/**
 * Canonical re-serialization of a clip-path value. A `null` shape with no box
 * → `none`; a bare box → the keyword; a shape with a box places it per
 * `boxPosition` (default trailing).
 */
export function formatClipPath(state: ClipPathState): string {
  if (state.shape === null) {
    return state.box ?? "none"
  }
  const shapeCss = shapeToCss(state.shape)
  if (state.box === undefined) return shapeCss
  return state.boxPosition === "leading"
    ? `${state.box} ${shapeCss}`
    : `${shapeCss} ${state.box}`
}

// ---------------------------------------------------------------------------
// defaultShape / shapeName / polygonVertices
// ---------------------------------------------------------------------------

/** A sensible default state for a freshly-selected shape. */
export function defaultShape(shape: BasicShapeName): ClipPathShapeState {
  switch (shape) {
    case "inset":
      return {
        shape: "inset",
        top: "10%",
        right: "10%",
        bottom: "10%",
        left: "10%",
      }
    case "circle":
      return { shape: "circle", radius: "50%", atX: "50%", atY: "50%" }
    case "ellipse":
      return { shape: "ellipse", rx: "50%", ry: "35%", atX: "50%", atY: "50%" }
    case "polygon":
      return {
        shape: "polygon",
        vertices: [
          { x: "50%", y: "0%" },
          { x: "0%", y: "100%" },
          { x: "100%", y: "100%" },
        ],
      }
  }
}

/** Runtime mirror of `ShapeOf` — the shape name, `"box"`, or `"none"`. */
export function shapeName(src: string): string {
  const state = parseClipPath(src)
  if (state === null) return "none"
  if (state.shape === null) return state.box !== undefined ? "box" : "none"
  return state.shape.shape
}

/** Runtime mirror of the polygon vertex extraction — `[]` if not a polygon. */
export function polygonVertices(src: string): Array<{ x: string; y: string }> {
  const state = parseClipPath(src)
  if (
    state === null ||
    state.shape === null ||
    state.shape.shape !== "polygon"
  ) {
    return []
  }
  return state.shape.vertices
}
