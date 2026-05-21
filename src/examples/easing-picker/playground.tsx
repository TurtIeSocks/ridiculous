"use client"

import { useState } from "react"
import type {
  EasingString,
  PolynomialFamily,
  PreviewProperty,
  StepPosition,
} from "@/components/ui/easing-picker"
import { cn } from "@/lib/utils"

type PlaygroundDirection = "In" | "Out" | "InOut" // subset of registry's Direction (4-way); playground UX exposes 3
type Basis = "bezier" | "spring" | "steps"
type OutputFormat = "css" | "tailwind-v3" | "tailwind-v4"

interface PlaygroundState {
  basis: Basis

  // bezier — extraTop/Bottom required by EasingState; canvas-viewport-only, not user-tweakable here
  x1: number
  y1: number
  x2: number
  y2: number
  extraTop: number
  extraBottom: number
  family: PolynomialFamily | null
  direction: PlaygroundDirection

  // spring
  stiffness: number
  damping: number
  mass: number

  // steps — `n` matches StepsControlsProps.value.n (not `steps`)
  n: number
  position: StepPosition

  // preview
  property: PreviewProperty
  duration: number
  loop: boolean
  replayKey: number

  // output
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

export function EasingPlayground() {
  const [state] = useState<PlaygroundState>(INITIAL_STATE)

  // Placeholder — replaced in later tasks once derived helpers are wired.
  const easing: EasingString = "cubic-bezier(0.42, 0, 0.58, 1)" as EasingString

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
        <div className="text-xs font-mono text-muted-foreground">{easing}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr] items-stretch">
        <div data-slot="easing-playground-left">{/* filled in Task 3 */}</div>
        <div data-slot="easing-playground-right">{/* filled in Task 5 */}</div>
      </div>
    </section>
  )
}
