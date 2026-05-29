import type { ColorString } from "@/components/ui/color-picker"
import { parseColor } from "@/components/ui/color-picker/color-picker.helpers"
import type {
  ConicGradientString,
  GradientStop,
  GradientString,
  GradientType,
  InternalStop,
  InterpolationHueMethod,
  InterpolationSpace,
  LinearGradientString,
  PolarSpace,
  RadialGradientString,
} from "./gradient-editor.types"

let stopIdSeq = 0
/** Monotonic id for a freshly-born stop — a stable React key across re-sorts. */
export const nextStopId = (): string => `gs-${stopIdSeq++}`

export interface InternalState {
  type: GradientType
  stops: InternalStop[]
  /** Linear only. Degrees, 0 = to top, 90 = to right, 180 = to bottom (CSS default), 270 = to left. */
  angle: number
  /** Radial only. */
  shape: "circle" | "ellipse"
  /** Radial only. */
  size: "closest-side" | "closest-corner" | "farthest-side" | "farthest-corner"
  /** Radial + conic. Percentages 0..100. */
  position: { x: number; y: number }
  /** Conic only. Degrees. */
  fromAngle: number
  interpolation: {
    space: InterpolationSpace
    hueMethod?: InterpolationHueMethod
  }
}

export interface Interpolation {
  space: InterpolationSpace
  hueMethod?: InterpolationHueMethod
}

export const INTERPOLATION_SPACES = [
  "srgb",
  "oklch",
  "oklab",
  "hsl",
  "hwb",
] as const
export const POLAR_SPACES: readonly PolarSpace[] = ["oklch", "hsl", "hwb"]
export const GRADIENT_TYPES: readonly GradientType[] = [
  "linear",
  "radial",
  "conic",
]

export const toDeg = (n: number) => `${Math.round(n)}deg`
export const toPct = (n: number) => `${Math.round(n)}%`
export const fromUnitString = (s: string) => {
  const n = Number.parseFloat(s)
  return Number.isNaN(n) ? 0 : n
}

const SIDE_TO_ANGLE: Record<string, number> = {
  "to top": 0,
  "to top right": 45,
  "to right": 90,
  "to bottom right": 135,
  "to bottom": 180,
  "to bottom left": 225,
  "to left": 270,
  "to top left": 315,
}

const RADIAL_SHAPES = ["circle", "ellipse"] as const
const RADIAL_SIZES = [
  "closest-side",
  "closest-corner",
  "farthest-side",
  "farthest-corner",
] as const

// ---------------------------------------------------------------------------
// Parsing / formatting
// ---------------------------------------------------------------------------

/**
 * Split a string on commas, ignoring commas inside parens. Trims each segment.
 *
 * @example
 * splitTopLevelCommas("rgb(1, 2, 3), red") // ["rgb(1, 2, 3)", "red"]
 */
export function splitTopLevelCommas(input: string): string[] {
  const trimmed = input.trim()
  if (trimmed === "") return []
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i]
    if (ch === "(") depth++
    else if (ch === ")") depth--
    else if (ch === "," && depth === 0) {
      out.push(trimmed.slice(start, i).trim())
      start = i + 1
    }
  }
  out.push(trimmed.slice(start).trim())
  return out
}

/**
 * Parse a single gradient stop. The position is optional; when absent,
 * returns `position: null` so the caller can auto-distribute.
 *
 * @example
 * parseStop("#ff0000 50%") // { color: "#ff0000", position: 50 }
 * parseStop("oklch(0.5 0.1 240)") // { color: "oklch(0.5 0.1 240)", position: null }
 */
export function parseStop(
  input: string,
): { color: ColorString; position: number | null } | null {
  // The position (if present) is the LAST whitespace-separated token outside parens.
  // Walk backwards, find the split point.
  const trimmed = input.trim()
  let depth = 0
  let splitAt = -1
  for (let i = trimmed.length - 1; i >= 0; i--) {
    const ch = trimmed[i]
    if (ch === ")") depth++
    else if (ch === "(") depth--
    else if (ch === " " && depth === 0) {
      splitAt = i
      break
    }
  }

  let colorPart = trimmed
  let positionPart: string | null = null
  if (splitAt !== -1) {
    const tail = trimmed.slice(splitAt + 1).trim()
    if (tail.endsWith("%")) {
      const n = Number.parseFloat(tail.slice(0, -1))
      if (!Number.isNaN(n)) {
        colorPart = trimmed.slice(0, splitAt).trim()
        positionPart = tail
      }
    }
  }

  if (parseColor(colorPart) == null) return null
  return {
    color: colorPart as ColorString,
    position: positionPart == null ? null : Number.parseFloat(positionPart),
  }
}

export function formatStop(stop: GradientStop): string {
  return `${stop.color} ${Math.round(stop.position)}%`
}

/**
 * Parse a CSS interpolation clause like `in oklch longer hue`.
 * Returns null if the prefix is missing or the space is unrecognized.
 */
export function parseInterpolation(input: string): Interpolation | null {
  const trimmed = input.trim()
  if (!trimmed.startsWith("in ")) return null
  const body = trimmed.slice(3).trim()
  // Possible forms: "<space>", "<space> longer hue", "<space> shorter hue"
  const huePartMatch = body.match(/^(\S+)\s+(longer|shorter)\s+hue$/)
  if (huePartMatch) {
    const space = huePartMatch[1] as InterpolationSpace
    if (!INTERPOLATION_SPACES.includes(space)) return null
    return { space, hueMethod: huePartMatch[2] as InterpolationHueMethod }
  }
  const space = body as InterpolationSpace
  if (!INTERPOLATION_SPACES.includes(space)) return null
  return { space, hueMethod: undefined }
}

/**
 * Format an interpolation as a token for inclusion in a gradient prelude.
 * Returns the bare token (e.g. `"in oklch"` or `"in oklch longer hue"`) with
 * NO comma — the caller decides how to join it with the rest of the prelude.
 * Returns empty string when the space is `srgb` with no hue method
 * (CSS default — keep output clean).
 *
 * Important: the `in <space>` clause must be adjacent to the prelude (no
 * comma separating them). Browsers reject e.g.
 * `radial-gradient(in oklch, ellipse at 50% 50%, …)` as invalid CSS — the
 * `in oklch` must instead sit next to the shape/at-position prelude:
 * `radial-gradient(ellipse at 50% 50% in oklch, …)`.
 */
export function formatInterpolation(interp: Interpolation): string {
  // srgb is CSS default — omit unless hue method is set (which is N/A for cartesian).
  if (interp.space === "srgb") return ""
  const isPolar = POLAR_SPACES.includes(interp.space as PolarSpace)
  if (isPolar && interp.hueMethod) {
    return `in ${interp.space} ${interp.hueMethod} hue`
  }
  return `in ${interp.space}`
}

/**
 * Parse a CSS gradient string into the editor's internal state.
 * Returns null on parse failure or when the gradient has fewer than 2 stops.
 */
export function parseGradient(value: string): InternalState | null {
  const trimmed = value.trim()
  const prefixMatch = trimmed.match(/^(linear|radial|conic)-gradient\((.*)\)$/s)
  if (!prefixMatch) return null
  const type = prefixMatch[1] as GradientType
  const body = prefixMatch[2]

  const segments = splitTopLevelCommas(body)
  if (segments.length === 0) return null

  // Try to extract interpolation. Two forms accepted:
  //   Form A — first segment is the bare `in <space>[ <method> hue]?` clause
  //            (e.g. `linear-gradient(in oklch, red, blue)` when no prelude).
  //   Form B — interpolation token is suffixed onto the prelude, separated by
  //            whitespace (e.g. `radial-gradient(ellipse at 50% 50% in oklch, …)`).
  //            This is the canonical CSS-valid form for radial/conic.
  let interpolation: {
    space: InterpolationSpace
    hueMethod?: InterpolationHueMethod
  } = {
    space: "srgb",
  }
  let preludeAndStops = segments
  const interpFromFirst = parseInterpolation(segments[0])
  if (interpFromFirst) {
    interpolation = interpFromFirst
    preludeAndStops = segments.slice(1)
  } else {
    // Try Form B: extract trailing `in <space>[ <method> hue]?` from segment 0.
    const suffixMatch = segments[0].match(
      /\s+(in\s+(?:srgb|oklch|oklab|hsl|hwb)(?:\s+(?:shorter|longer)\s+hue)?)$/i,
    )
    if (suffixMatch) {
      const parsed = parseInterpolation(suffixMatch[1])
      if (parsed) {
        interpolation = parsed
        preludeAndStops = [
          segments[0].slice(0, suffixMatch.index ?? 0).trim(),
          ...segments.slice(1),
        ]
      }
    }
  }

  // Determine if the next segment is a prelude (angle/shape/from) or a stop.
  let preludeIndex = 0
  const first = preludeAndStops[0] ?? ""
  const looksLikePrelude =
    /^(-?\d+(\.\d+)?deg|to )/.test(first) || // linear angle (signed)
    /^(circle|ellipse|closest|farthest)/.test(first) || // radial shape/size
    first.startsWith("at ") || // radial position alone
    first.startsWith("from ") // conic

  // Type-specific prelude extraction
  let angle = 180 // linear default = to bottom
  let shape: InternalState["shape"] = "ellipse"
  let size: InternalState["size"] = "farthest-corner"
  let position = { x: 50, y: 50 }
  let fromAngle = 0

  if (looksLikePrelude && type === "linear") {
    const prelude = preludeAndStops[0]
    if (SIDE_TO_ANGLE[prelude] != null) {
      angle = SIDE_TO_ANGLE[prelude]
    } else {
      const m = prelude.match(/^(-?\d+(?:\.\d+)?)deg$/)
      if (m) angle = Number.parseFloat(m[1])
      else return null
    }
    preludeIndex = 1
  } else if (looksLikePrelude && type === "radial") {
    const prelude = preludeAndStops[0]
    // Tokens: [shape] [size] [at <pos>]
    const tokens = prelude.split(/\s+/)
    let i = 0
    if (RADIAL_SHAPES.includes(tokens[i] as (typeof RADIAL_SHAPES)[number])) {
      shape = tokens[i] as InternalState["shape"]
      i++
    }
    if (RADIAL_SIZES.includes(tokens[i] as (typeof RADIAL_SIZES)[number])) {
      size = tokens[i] as InternalState["size"]
      i++
    }
    if (tokens[i] === "at") {
      i++
      const x = parsePercent(tokens[i++])
      const y = parsePercent(tokens[i++])
      if (x == null || y == null) return null
      position = { x, y }
    }
    preludeIndex = 1
  } else if (looksLikePrelude && type === "conic") {
    const prelude = preludeAndStops[0]
    // Tokens: [from <angle>] [at <pos>]
    const tokens = prelude.split(/\s+/)
    let i = 0
    if (tokens[i] === "from") {
      i++
      const m = tokens[i++].match(/^(-?\d+(?:\.\d+)?)deg$/)
      if (!m) return null
      fromAngle = Number.parseFloat(m[1])
    }
    if (tokens[i] === "at") {
      i++
      const x = parsePercent(tokens[i++])
      const y = parsePercent(tokens[i++])
      if (x == null || y == null) return null
      position = { x, y }
    }
    preludeIndex = 1
  }

  // Remaining segments are stops.
  const stopSegments = preludeAndStops.slice(preludeIndex)
  if (stopSegments.length < 2) return null

  const rawStops = stopSegments.map(parseStop)
  const validStops: NonNullable<(typeof rawStops)[number]>[] = []
  for (const raw of rawStops) {
    if (raw == null) return null
    validStops.push(raw)
  }

  // Auto-distribute positions when null.
  const count = validStops.length
  const stops: InternalStop[] = validStops.map((raw, i) => ({
    id: nextStopId(),
    color: raw.color,
    position: raw.position != null ? raw.position : (i / (count - 1)) * 100,
  }))

  return {
    type,
    stops,
    angle,
    shape,
    size,
    position,
    fromAngle,
    interpolation,
  }
}

function parsePercent(input: string | undefined): number | null {
  if (!input) return null
  if (!input.endsWith("%")) return null
  const n = Number.parseFloat(input.slice(0, -1))
  return Number.isNaN(n) ? null : n
}

/**
 * Runtime type guard. Narrows wide `string` to `GradientString`.
 *
 * @example
 * const v: string = userInput
 * if (isGradientString(v)) {
 *   // v is now GradientString
 * }
 */
export function isGradientString(value: string): value is GradientString
export function isGradientString<S extends string>(
  value: S,
): value is S &
  (LinearGradientString | RadialGradientString | ConicGradientString)
export function isGradientString(value: string): boolean {
  return parseGradient(value) !== null
}

/**
 * Serialize internal state to a CSS gradient string.
 *
 * Emission rule: the interpolation `in <space>` clause sits adjacent to the
 * prelude with a space separator, NOT comma-separated. Browsers reject
 * `radial-gradient(in oklch, ellipse at 50% 50%, …)` as invalid syntax;
 * the correct form is `radial-gradient(ellipse at 50% 50% in oklch, …)`.
 */
export function formatGradient(
  state: Omit<InternalState, "stops"> & { stops: GradientStop[] },
): string {
  const interpToken = formatInterpolation(state.interpolation)
  const stops = state.stops.map(formatStop).join(", ")
  const joinInterp = (positional: string) =>
    interpToken ? `${positional} ${interpToken}` : positional
  switch (state.type) {
    case "linear":
      return `linear-gradient(${joinInterp(`${state.angle}deg`)}, ${stops})`
    case "radial":
      return `radial-gradient(${joinInterp(
        `${state.shape} ${state.size} at ${Math.round(state.position.x)}% ${Math.round(state.position.y)}%`,
      )}, ${stops})`
    case "conic":
      return `conic-gradient(${joinInterp(
        `from ${state.fromAngle}deg at ${Math.round(state.position.x)}% ${Math.round(state.position.y)}%`,
      )}, ${stops})`
  }
}
