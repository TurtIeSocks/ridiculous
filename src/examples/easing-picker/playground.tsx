"use client"

import { useState } from "react"
import {
  BezierCanvas,
  type EasingString,
  formatEasing,
  type PolynomialFamily,
  PRESETS,
  type PreviewProperty,
  type StepPosition,
} from "@/components/ui/easing-picker"
import { cn } from "@/lib/utils"

const FAMILIES: ReadonlyArray<PolynomialFamily> = [
  "Sine",
  "Quad",
  "Cubic",
  "Quart",
  "Quint",
  "Expo",
  "Circ",
  "Back",
]

type PlaygroundDirection = "In" | "Out" | "InOut"
const DIRECTIONS: ReadonlyArray<PlaygroundDirection> = ["In", "Out", "InOut"]

type Basis = "bezier" | "spring" | "steps"
const BASES: ReadonlyArray<Basis> = ["bezier", "spring", "steps"]

type OutputFormat = "css" | "tailwind-v3" | "tailwind-v4"

interface PlaygroundState {
  basis: Basis
  x1: number
  y1: number
  x2: number
  y2: number
  extraTop: number
  extraBottom: number
  family: PolynomialFamily | null
  direction: PlaygroundDirection
  stiffness: number
  damping: number
  mass: number
  n: number
  position: StepPosition
  property: PreviewProperty
  duration: number
  loop: boolean
  replayKey: number
  format: OutputFormat
}

const INITIAL_STATE: PlaygroundState = {
  basis: "bezier",
  // easeInOutCubic = [0.65, 0, 0.35, 1] — keep bezier coords consistent with family="Cubic"
  x1: 0.65,
  y1: 0,
  x2: 0.35,
  y2: 1,
  extraTop: 0.25,
  extraBottom: 0.25,
  family: "Cubic",
  direction: "InOut",
  stiffness: 100,
  damping: 10,
  mass: 1,
  n: 4,
  position: "end",
  property: "moveX",
  duration: 600,
  loop: true,
  replayKey: 0,
  format: "css",
}

function resolveBezier(
  family: PolynomialFamily,
  direction: PlaygroundDirection,
): { x1: number; y1: number; x2: number; y2: number } | null {
  const match = PRESETS.find(
    (p) => p.family === family && p.direction === direction,
  )
  if (!match) return null
  const [x1, y1, x2, y2] = match.bezier
  return { x1, y1, x2, y2 }
}

function computeEasing(state: PlaygroundState): EasingString {
  if (state.basis === "bezier") {
    return formatEasing({
      basis: "bezier",
      x1: state.x1,
      y1: state.y1,
      x2: state.x2,
      y2: state.y2,
      extraTop: state.extraTop,
      extraBottom: state.extraBottom,
    })
  }
  if (state.basis === "spring") {
    return formatEasing({
      basis: "spring",
      stiffness: state.stiffness,
      damping: state.damping,
      mass: state.mass,
    })
  }
  return formatEasing({
    basis: "steps",
    n: state.n,
    position: state.position,
  })
}

const pillClass = (active: boolean) =>
  cn(
    "rounded-full px-3 py-1 text-xs font-mono border transition",
    active
      ? "bg-gradient-to-br from-violet-glow to-pink-glow text-background border-transparent"
      : "bg-white/5 border-white/10 hover:bg-white/10",
  )

const sectionLabelClass =
  "font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-2"

export function EasingPlayground() {
  const [state, setState] = useState<PlaygroundState>(INITIAL_STATE)
  const easing = computeEasing(state)

  const setBasis = (basis: Basis) => setState((s) => ({ ...s, basis }))
  const setDirection = (direction: PlaygroundDirection) =>
    setState((s) => {
      if (s.family == null) return { ...s, direction }
      const bezier = resolveBezier(s.family, direction)
      return bezier ? { ...s, direction, ...bezier } : { ...s, direction }
    })
  const setFamily = (family: PolynomialFamily) =>
    setState((s) => {
      const bezier = resolveBezier(family, s.direction)
      return bezier ? { ...s, family, ...bezier } : { ...s, family }
    })
  const setBezier = (b: { x1: number; y1: number; x2: number; y2: number }) =>
    setState((s) => ({ ...s, ...b, family: null }))

  return (
    <section
      data-slot="easing-playground"
      data-replay-key={state.replayKey}
      className={cn(
        "glass-card rounded-2xl p-6 md:p-8 border border-white/10",
        "bg-[linear-gradient(135deg,oklch(0.18_0.04_290),oklch(0.14_0.03_270))]",
      )}
    >
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
            / component · playground
          </div>
          <h3 className="mt-1 text-xl font-bold tracking-tight">
            Easing Picker
          </h3>
        </div>
        <div
          data-slot="easing-playground-value"
          className="text-xs font-mono text-muted-foreground"
        >
          {easing}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr] items-stretch">
        <div
          data-slot="easing-playground-left"
          className="flex flex-col gap-4"
        >
          <div>
            <div className={sectionLabelClass}>Basis</div>
            <div className="flex gap-1.5">
              {BASES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBasis(b)}
                  className={pillClass(state.basis === b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {state.basis === "bezier" && (
            <>
              <div>
                <div className={sectionLabelClass}>Direction</div>
                <div className="flex gap-1.5">
                  {DIRECTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDirection(d)}
                      className={pillClass(state.direction === d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className={sectionLabelClass}>Presets</div>
                <div className="flex flex-wrap gap-1.5">
                  {FAMILIES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFamily(f)}
                      className={pillClass(state.family === f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className={sectionLabelClass}>Curve</div>
                <div className="aspect-square max-w-60">
                  <BezierCanvas
                    value={{
                      x1: state.x1,
                      y1: state.y1,
                      x2: state.x2,
                      y2: state.y2,
                    }}
                    onChange={setBezier}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div data-slot="easing-playground-right">{/* filled in Task 5 */}</div>
      </div>
    </section>
  )
}
