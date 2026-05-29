"use client"

import { useMemo, useState } from "react"
import {
  bakeLinear,
  EasingPreview,
  SpringControls,
  sampleSpring,
} from "@/components/ui/easing-picker"
import { ExampleCard } from "@/examples/_shared/example-card"

export function SubComponentSpringExample() {
  const [spring, setSpring] = useState({ stiffness: 100, damping: 10, mass: 1 })
  const easing = useMemo(
    () =>
      bakeLinear(
        sampleSpring(spring.stiffness, spring.damping, spring.mass, 60),
      ),
    [spring],
  )
  return (
    <ExampleCard
      eyebrow="sub-component"
      title="Spring physics (standalone)"
      description={
        <>
          Compose{" "}
          <code className="font-mono text-foreground">SpringControls</code> +{" "}
          <code className="font-mono text-foreground">sampleSpring</code> +{" "}
          <code className="font-mono text-foreground">bakeLinear</code> to roll
          your own spring picker. The picker baking happens client-side; no
          runtime physics in production.
        </>
      }
      className="md:p-8"
    >
      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_2fr]">
        <SpringControls value={spring} onChange={setSpring} />
        <div className="space-y-2">
          <EasingPreview easing={easing} property="moveX" />
          <code className="block break-all rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-xs">
            {easing}
          </code>
        </div>
      </div>
    </ExampleCard>
  )
}
