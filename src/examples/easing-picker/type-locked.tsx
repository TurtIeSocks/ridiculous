"use client"

import { useState } from "react"
import {
  type CubicBezierString,
  EasingPicker,
  type LinearString,
  type StepsString,
} from "@/components/ui/easing-picker"
import { ExampleCard } from "@/examples/_shared/example-card"

export function TypeLockedExample() {
  const [bezier, setBezier] = useState<CubicBezierString>(
    "cubic-bezier(0.42, 0, 0.58, 1)",
  )
  const [spring, setSpring] = useState<LinearString>("linear(0, 1)")
  const [steps, setSteps] = useState<StepsString>("steps(4)")

  return (
    <ExampleCard
      eyebrow="basis-narrow"
      title="Type-Locked"
      description={
        <>
          Setting <code className="font-mono text-foreground">basis</code>{" "}
          narrows the value and onChange types at compile time. Each picker
          below emits a different literal-string flavor.
        </>
      }
      className="md:p-8"
    >
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <div className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
            → bezier
          </div>
          <EasingPicker basis="bezier" value={bezier} onChange={setBezier} />
        </div>
        <div className="space-y-1">
          <div className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
            → spring
          </div>
          <EasingPicker basis="spring" value={spring} onChange={setSpring} />
        </div>
        <div className="space-y-1">
          <div className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
            → steps
          </div>
          <EasingPicker basis="steps" value={steps} onChange={setSteps} />
        </div>
      </div>
    </ExampleCard>
  )
}
