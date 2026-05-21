"use client"

import { useState } from "react"
import {
  type CubicBezierString,
  EasingPicker,
  type LinearString,
  type StepsString,
} from "@/components/ui/easing-picker"

export function TypeLockedExample() {
  const [bezier, setBezier] = useState<CubicBezierString>(
    "cubic-bezier(0.42, 0, 0.58, 1)",
  )
  const [spring, setSpring] = useState<LinearString>("linear(0, 1)")
  const [steps, setSteps] = useState<StepsString>("steps(4)")

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> basis-narrow
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Type-Locked</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Setting <code className="font-mono text-foreground">basis</code> narrows
        the value and onChange types at compile time. Each picker below emits a
        different literal-string flavor.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            → bezier
          </div>
          <EasingPicker basis="bezier" value={bezier} onChange={setBezier} />
        </div>
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            → spring
          </div>
          <EasingPicker basis="spring" value={spring} onChange={setSpring} />
        </div>
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            → steps
          </div>
          <EasingPicker basis="steps" value={steps} onChange={setSteps} />
        </div>
      </div>
    </div>
  )
}
