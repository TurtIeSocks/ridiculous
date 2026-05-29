// =====================================================================
// easing-picker.helpers.ts
//
// Pure runtime logic for the easing picker — no React, no DOM. Covers:
//   - parse / format between an `EasingString` and the internal
//     `EasingState` discriminated union,
//   - the physics samplers (spring / bounce / wiggle) and the
//     `linear()` baker that turns sample arrays into a CSS string,
//   - the preset accessors `bezierFromPreset` / `matchPreset` (the
//     PRESETS data table itself lives in easing-picker.presets.ts),
//   - small numeric utils (fmtNum / parseNumber / clamp).
//
// Behaviour here is pinned by the easing-parse / easing-format /
// easing-presets / easing-baking specs — keep it a pure move.
// =====================================================================

import { PRESETS } from "./easing-picker.presets"
import type {
  CubicBezierString,
  EasingState,
  EasingString,
  PresetName,
  StepPosition,
} from "./easing-picker.types"

export type { PresetEntry } from "./easing-picker.presets"
// Re-export the preset data so the public barrel surface is unchanged.
export { PRESETS } from "./easing-picker.presets"

// ---------------------------------------------------------------------------
// Numeric utils
// ---------------------------------------------------------------------------

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

/** Round to up to 4 decimal places, strip trailing zeros + bare decimal point. */
export function fmtNum(n: number): string {
  const rounded = Math.round(n * 10000) / 10000
  return rounded.toString()
}

function parseNumber(s: string): number | null {
  const t = s.trim()
  if (t === "" || t === "-") return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

// ---------------------------------------------------------------------------
// Parsing / formatting
// ---------------------------------------------------------------------------

export const KEYWORD_BEZIER: Record<string, [number, number, number, number]> =
  {
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
  if (v === "step-start")
    return { basis: "steps", n: 1, position: "jump-start" }
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
    case "spring": {
      const { stiffness, damping, mass } = state
      return bakeLinear(
        sampleSpring(stiffness, damping, mass, 60),
      ) as EasingString
    }
    case "bounce": {
      const { bounces, stiffness } = state
      return bakeLinear(sampleBounce(bounces, stiffness)) as EasingString
    }
    case "wiggle": {
      const { wiggles, damping } = state
      return bakeLinear(sampleWiggle(wiggles, damping)) as EasingString
    }
  }
}

// ---------------------------------------------------------------------------
// Physics samplers + baking
// ---------------------------------------------------------------------------

export interface Sample {
  y: number
  t: number
}

const SETTLE_EPSILON = 0.001

export function sampleSpring(
  stiffness: number,
  damping: number,
  mass: number,
  samples: number,
): Sample[] {
  const k = stiffness
  const c = damping
  const m = mass
  const w0 = Math.sqrt(k / m)
  const zeta = c / (2 * Math.sqrt(k * m))

  // Total simulation time scales inversely with natural frequency.
  // Pick a window long enough for the curve to settle.
  const tMax = Math.max(3 / (zeta * w0), 5) // seconds-equivalent; normalized below
  const dt = tMax / samples

  const out: Sample[] = []
  for (let i = 0; i < samples; i++) {
    const t = i * dt
    let y: number
    if (zeta < 1) {
      // Underdamped
      const wd = w0 * Math.sqrt(1 - zeta * zeta)
      y =
        1 -
        Math.exp(-zeta * w0 * t) *
          (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
    } else if (zeta === 1) {
      // Critically damped
      y = 1 - Math.exp(-w0 * t) * (1 + w0 * t)
    } else {
      // Overdamped
      const r1 = -w0 * (zeta - Math.sqrt(zeta * zeta - 1))
      const r2 = -w0 * (zeta + Math.sqrt(zeta * zeta - 1))
      y = 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1)
    }
    out.push({ y, t: i / (samples - 1) })
    // Early-exit once settled within epsilon for several consecutive samples
    if (
      i > samples / 4 &&
      Math.abs(y - 1) < SETTLE_EPSILON &&
      out.slice(-3).every((s) => Math.abs(s.y - 1) < SETTLE_EPSILON)
    ) {
      // Force last sample to exactly 1, t=1
      out[out.length - 1] = { y: 1, t: 1 }
      break
    }
  }
  // Always force endpoint t=1, y=1
  if (out[out.length - 1].t < 1) out.push({ y: 1, t: 1 })
  return out
}

const PRUNE_TOLERANCE = 0.005

/** Drop stops that fall on the line between their neighbors within tolerance. */
function pruneCollinear(samples: Sample[]): Sample[] {
  if (samples.length <= 3) return samples
  const out: Sample[] = [samples[0]]
  for (let i = 1; i < samples.length - 1; i++) {
    const prev = out[out.length - 1]
    const curr = samples[i]
    const next = samples[i + 1]
    const slope = (next.y - prev.y) / (next.t - prev.t)
    const expectedY = prev.y + slope * (curr.t - prev.t)
    if (Math.abs(curr.y - expectedY) >= PRUNE_TOLERANCE) {
      out.push(curr)
    }
  }
  out.push(samples[samples.length - 1])
  return out
}

export function bakeLinear(samples: Sample[]): string {
  const pruned = pruneCollinear(samples)
  const parts = pruned.map((s, i) => {
    if (i === 0 || i === pruned.length - 1) return fmtNum(s.y)
    return `${fmtNum(s.y)} ${fmtNum(s.t * 100)}%`
  })
  return `linear(${parts.join(", ")})`
}

export function sampleBounce(bounces: number, stiffness: number): Sample[] {
  // Parabolic-bounce model. Restitution decreases per bounce; each bounce
  // is half a parabola (descending → contact → ascending).
  const restitution = 0.4 + 0.5 * stiffness // 0.4..0.9
  const out: Sample[] = []

  // Compute durations such that total = 1
  const segDurations: number[] = []
  let energy = 1
  for (let i = 0; i <= bounces; i++) {
    segDurations.push(Math.sqrt(energy))
    energy *= restitution
  }
  const totalDur = segDurations.reduce((a, b) => a + b, 0)
  for (let i = 0; i < segDurations.length; i++) segDurations[i] /= totalDur

  let t = 0
  // Initial drop: descend from y=0 (start) to y=1 (ground)
  const samplesPerSeg = 12
  for (let i = 0; i < samplesPerSeg; i++) {
    const localT = i / samplesPerSeg
    out.push({ y: localT * localT, t: t + localT * segDurations[0] })
  }
  t += segDurations[0]
  out.push({ y: 1, t })

  // Bounces: rise to peak, fall back to ground
  let energyTracker = restitution
  for (let b = 0; b < bounces; b++) {
    const segDur = segDurations[b + 1]
    for (let i = 1; i <= samplesPerSeg; i++) {
      const localT = i / samplesPerSeg
      // y = 1 - peak*(1 - (2*localT - 1)^2) — inverted parabola from 1 to 1-peak to 1
      const u = 2 * localT - 1
      const y = 1 - (1 - energyTracker) * (1 - u * u)
      out.push({ y, t: t + localT * segDur })
    }
    t += segDur
    energyTracker *= restitution
  }
  // Ensure exactly ends at y=1, t=1
  out.push({ y: 1, t: 1 })
  return out
}

export function sampleWiggle(wiggles: number, damping: number): Sample[] {
  // Decaying cosine wave around y=1. After settling, y=1.
  const samples = 80
  const out: Sample[] = []
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1)
    const decay = Math.exp(-damping * t)
    const y = 1 - decay * Math.cos(wiggles * 2 * Math.PI * t)
    out.push({ y, t })
  }
  // Force endpoint
  out[out.length - 1] = { y: 1, t: 1 }
  return out
}

// ---------------------------------------------------------------------------
// Preset accessors (the PRESETS table lives in easing-picker.presets.ts)
// ---------------------------------------------------------------------------

export function bezierFromPreset(name: PresetName): CubicBezierString {
  const preset = PRESETS.find((p) => p.name === name)
  if (!preset) throw new Error(`Unknown preset: ${name}`)
  const [x1, y1, x2, y2] = preset.bezier
  return `cubic-bezier(${fmtNum(x1)}, ${fmtNum(y1)}, ${fmtNum(x2)}, ${fmtNum(y2)})` as CubicBezierString
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
