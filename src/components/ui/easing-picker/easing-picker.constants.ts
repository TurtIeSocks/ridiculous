// =====================================================================
// easing-picker.constants.ts
//
// UI-facing constants shared across the panel and its controls:
// default state per basis, the ordered basis list for the tabs, and
// the ordered step-position list for the <select>.
// =====================================================================

import type {
  EasingBasis,
  EasingState,
  StepPosition,
} from "./easing-picker.types"

export const DEFAULT_SPRING_STATE: Extract<EasingState, { basis: "spring" }> = {
  basis: "spring",
  stiffness: 100,
  damping: 10,
  mass: 1,
}
export const DEFAULT_BOUNCE_STATE: Extract<EasingState, { basis: "bounce" }> = {
  basis: "bounce",
  bounces: 3,
  stiffness: 0.5,
}
export const DEFAULT_WIGGLE_STATE: Extract<EasingState, { basis: "wiggle" }> = {
  basis: "wiggle",
  wiggles: 4,
  damping: 5,
}
export const DEFAULT_BEZIER_STATE: Extract<EasingState, { basis: "bezier" }> = {
  basis: "bezier",
  x1: 0.42,
  y1: 0,
  x2: 0.58,
  y2: 1,
  extraTop: 0.25,
  extraBottom: 0.25,
}
export const DEFAULT_STEPS_STATE: Extract<EasingState, { basis: "steps" }> = {
  basis: "steps",
  n: 4,
  position: "end",
}

export const DEFAULT_BY_BASIS: Record<EasingBasis, EasingState> = {
  bezier: DEFAULT_BEZIER_STATE,
  spring: DEFAULT_SPRING_STATE,
  bounce: DEFAULT_BOUNCE_STATE,
  wiggle: DEFAULT_WIGGLE_STATE,
  steps: DEFAULT_STEPS_STATE,
}

export const ALL_BASES: readonly EasingBasis[] = [
  "bezier",
  "spring",
  "bounce",
  "wiggle",
  "steps",
] as const

export const STEP_POSITIONS: StepPosition[] = [
  "start",
  "end",
  "jump-start",
  "jump-end",
  "jump-both",
  "jump-none",
]
