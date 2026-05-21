"use client"

import { useMemo, useState } from "react"
import {
  bakeLinear,
  EasingPreview,
  SpringControls,
  sampleSpring,
} from "@/components/ui/easing-picker"

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
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> sub-component
      </div>
      <h3 className="text-xl font-semibold tracking-tight">
        Spring physics (standalone)
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Compose{" "}
        <code className="font-mono text-foreground">SpringControls</code> +{" "}
        <code className="font-mono text-foreground">sampleSpring</code> +{" "}
        <code className="font-mono text-foreground">bakeLinear</code> to roll
        your own spring picker. The picker baking happens client-side; no
        runtime physics in production.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_2fr]">
        <SpringControls value={spring} onChange={setSpring} />
        <div className="space-y-2">
          <EasingPreview easing={easing} property="moveX" />
          <code className="block text-xs font-mono bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg break-all">
            {easing}
          </code>
        </div>
      </div>
    </div>
  )
}
