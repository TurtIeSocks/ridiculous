"use client"

// ---------------------------------------------------------------------------
// Component (top of file — filled in Phase 9)
// ---------------------------------------------------------------------------

export function EasingPicker() {
  return null
}

// ---------------------------------------------------------------------------
// Composed: EasingPanel (filled in Phase 8)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sub-components (filled in Phases 3-7)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Parsing / formatting (Phase 2)
// ---------------------------------------------------------------------------

import type {
  Direction,
  EasingState,
  EasingString,
  PolynomialFamily,
  PresetName,
  StepPosition,
} from "./easing-picker.types"

const KEYWORD_BEZIER: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
}

const STEP_POSITIONS: ReadonlySet<StepPosition> = new Set([
  "start",
  "end",
  "jump-start",
  "jump-end",
  "jump-both",
  "jump-none",
])

const DEFAULT_EXTRA = 0.25

const DEFAULT_SPRING = { stiffness: 100, damping: 10, mass: 1 } as const

function parseNumber(s: string): number | null {
  const t = s.trim()
  if (t === "" || t === "-") return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function parseEasing(value: string): EasingState | null {
  const v = value.trim()

  // Keywords
  if (v in KEYWORD_BEZIER) {
    const [x1, y1, x2, y2] = KEYWORD_BEZIER[v]
    return {
      basis: "bezier",
      x1,
      y1,
      x2,
      y2,
      extraTop: DEFAULT_EXTRA,
      extraBottom: DEFAULT_EXTRA,
    }
  }
  if (v === "step-start") return { basis: "steps", n: 1, position: "jump-start" }
  if (v === "step-end") return { basis: "steps", n: 1, position: "jump-end" }

  // cubic-bezier(...)
  const cb = v.match(/^cubic-bezier\((.+)\)$/)
  if (cb) {
    const body = cb[1]
    const parts = body.includes(",")
      ? body.split(",").map((p) => p.trim())
      : body.split(/\s+/).filter(Boolean)
    if (parts.length !== 4) return null
    const nums = parts.map(parseNumber)
    if (nums.some((n) => n === null)) return null
    const [x1, y1, x2, y2] = nums as [number, number, number, number]
    if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) return null
    return {
      basis: "bezier",
      x1,
      y1,
      x2,
      y2,
      extraTop: DEFAULT_EXTRA,
      extraBottom: DEFAULT_EXTRA,
    }
  }

  // steps(...)
  const st = v.match(/^steps\((.+)\)$/)
  if (st) {
    const body = st[1]
    const parts = body.split(",").map((p) => p.trim())
    if (parts.length < 1 || parts.length > 2) return null
    const n = parseNumber(parts[0])
    if (n === null || !Number.isInteger(n) || n < 1) return null
    if (parts.length === 1) return { basis: "steps", n, position: "end" }
    const pos = parts[1] as StepPosition
    if (!STEP_POSITIONS.has(pos)) return null
    return { basis: "steps", n, position: pos }
  }

  // linear(...)
  const ln = v.match(/^linear\((.+)\)$/)
  if (ln) {
    const body = ln[1].trim()
    if (body === "") return null
    return { basis: "spring", ...DEFAULT_SPRING }
  }

  return null
}

/** Round to up to 4 decimal places, strip trailing zeros + bare decimal point. */
function fmtNum(n: number): string {
  const rounded = Math.round(n * 10000) / 10000
  return rounded.toString()
}

export function formatEasing(state: EasingState): EasingString {
  switch (state.basis) {
    case "bezier": {
      const { x1, y1, x2, y2 } = state
      return `cubic-bezier(${fmtNum(x1)}, ${fmtNum(y1)}, ${fmtNum(x2)}, ${fmtNum(y2)})` as EasingString
    }
    case "steps": {
      const { n, position } = state
      return position === "end" ? `steps(${n})` : `steps(${n}, ${position})`
    }
    case "spring":
    case "bounce":
    case "wiggle": {
      // Filled in Phase 5 (Task 13/14/15)
      return "linear(0, 1)" as const
    }
  }
}

// ---------------------------------------------------------------------------
// Physics samplers + baking (Phase 5)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Preset table (Phase 3)
// ---------------------------------------------------------------------------

interface PresetEntry {
  readonly name: PresetName
  readonly bezier: readonly [number, number, number, number]
  readonly family?: PolynomialFamily
  readonly direction?: Direction
}

export const PRESETS: readonly PresetEntry[] = [
  // CSS keywords (5)
  { name: "linear", bezier: [0, 0, 1, 1] },
  { name: "ease", bezier: [0.25, 0.1, 0.25, 1] },
  { name: "ease-in", bezier: [0.42, 0, 1, 1] },
  { name: "ease-out", bezier: [0, 0, 0.58, 1] },
  { name: "ease-in-out", bezier: [0.42, 0, 0.58, 1] },

  // Sine
  { name: "easeInSine", bezier: [0.12, 0, 0.39, 0], family: "Sine", direction: "In" },
  { name: "easeOutSine", bezier: [0.61, 1, 0.88, 1], family: "Sine", direction: "Out" },
  { name: "easeInOutSine", bezier: [0.37, 0, 0.63, 1], family: "Sine", direction: "InOut" },
  { name: "easeOutInSine", bezier: [0.45, 1, 0.55, 0], family: "Sine", direction: "OutIn" },

  // Quad
  { name: "easeInQuad", bezier: [0.11, 0, 0.5, 0], family: "Quad", direction: "In" },
  { name: "easeOutQuad", bezier: [0.5, 1, 0.89, 1], family: "Quad", direction: "Out" },
  { name: "easeInOutQuad", bezier: [0.45, 0, 0.55, 1], family: "Quad", direction: "InOut" },
  { name: "easeOutInQuad", bezier: [0.5, 1, 0.5, 0], family: "Quad", direction: "OutIn" },

  // Cubic
  { name: "easeInCubic", bezier: [0.32, 0, 0.67, 0], family: "Cubic", direction: "In" },
  { name: "easeOutCubic", bezier: [0.33, 1, 0.68, 1], family: "Cubic", direction: "Out" },
  { name: "easeInOutCubic", bezier: [0.65, 0, 0.35, 1], family: "Cubic", direction: "InOut" },
  { name: "easeOutInCubic", bezier: [0.5, 1, 0.5, 0], family: "Cubic", direction: "OutIn" },

  // Quart
  { name: "easeInQuart", bezier: [0.5, 0, 0.75, 0], family: "Quart", direction: "In" },
  { name: "easeOutQuart", bezier: [0.25, 1, 0.5, 1], family: "Quart", direction: "Out" },
  { name: "easeInOutQuart", bezier: [0.76, 0, 0.24, 1], family: "Quart", direction: "InOut" },
  { name: "easeOutInQuart", bezier: [0.5, 1, 0.5, 0], family: "Quart", direction: "OutIn" },

  // Quint
  { name: "easeInQuint", bezier: [0.64, 0, 0.78, 0], family: "Quint", direction: "In" },
  { name: "easeOutQuint", bezier: [0.22, 1, 0.36, 1], family: "Quint", direction: "Out" },
  { name: "easeInOutQuint", bezier: [0.83, 0, 0.17, 1], family: "Quint", direction: "InOut" },
  { name: "easeOutInQuint", bezier: [0.5, 1, 0.5, 0], family: "Quint", direction: "OutIn" },

  // Expo
  { name: "easeInExpo", bezier: [0.7, 0, 0.84, 0], family: "Expo", direction: "In" },
  { name: "easeOutExpo", bezier: [0.16, 1, 0.3, 1], family: "Expo", direction: "Out" },
  { name: "easeInOutExpo", bezier: [0.87, 0, 0.13, 1], family: "Expo", direction: "InOut" },
  { name: "easeOutInExpo", bezier: [0.5, 1, 0.5, 0], family: "Expo", direction: "OutIn" },

  // Circ
  { name: "easeInCirc", bezier: [0.55, 0, 1, 0.45], family: "Circ", direction: "In" },
  { name: "easeOutCirc", bezier: [0, 0.55, 0.45, 1], family: "Circ", direction: "Out" },
  { name: "easeInOutCirc", bezier: [0.85, 0, 0.15, 1], family: "Circ", direction: "InOut" },
  { name: "easeOutInCirc", bezier: [0.5, 1, 0.5, 0], family: "Circ", direction: "OutIn" },

  // Back (overshoot)
  { name: "easeInBack", bezier: [0.36, 0, 0.66, -0.56], family: "Back", direction: "In" },
  { name: "easeOutBack", bezier: [0.34, 1.56, 0.64, 1], family: "Back", direction: "Out" },
  { name: "easeInOutBack", bezier: [0.68, -0.6, 0.32, 1.6], family: "Back", direction: "InOut" },
  { name: "easeOutInBack", bezier: [0.5, 1.6, 0.5, -0.6], family: "Back", direction: "OutIn" },

  // Special
  { name: "anticipate", bezier: [0.45, -0.5, 0.55, 1] },
  { name: "smoothStep", bezier: [0.45, 0, 0.55, 1] },
] as const

export function bezierFromPreset(name: PresetName): string {
  const preset = PRESETS.find((p) => p.name === name)
  if (!preset) throw new Error(`Unknown preset: ${name}`)
  const [x1, y1, x2, y2] = preset.bezier
  return `cubic-bezier(${fmtNum(x1)}, ${fmtNum(y1)}, ${fmtNum(x2)}, ${fmtNum(y2)})`
}

const PRESET_MATCH_TOLERANCE = 0.005

export function matchPreset(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): PresetName | null {
  for (const p of PRESETS) {
    const [px1, py1, px2, py2] = p.bezier
    if (
      Math.abs(x1 - px1) < PRESET_MATCH_TOLERANCE &&
      Math.abs(y1 - py1) < PRESET_MATCH_TOLERANCE &&
      Math.abs(x2 - px2) < PRESET_MATCH_TOLERANCE &&
      Math.abs(y2 - py2) < PRESET_MATCH_TOLERANCE
    ) {
      return p.name
    }
  }
  return null
}
