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
  EasingState,
  EasingString,
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

// ---------------------------------------------------------------------------
// Physics samplers + baking (Phase 5)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Preset table (Phase 3)
// ---------------------------------------------------------------------------
