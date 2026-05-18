// src/examples/easing-picker/sub-component-spring.tsx
"use client"

import { useMemo, useState } from "react"
import {
  EasingPreview,
  SpringControls,
  bakeLinear,
  sampleSpring,
} from "@/components/ui/easing-picker"

export function SubComponentSpringExample() {
  const [spring, setSpring] = useState({ stiffness: 100, damping: 10, mass: 1 })
  const easing = useMemo(
    () => bakeLinear(sampleSpring(spring.stiffness, spring.damping, spring.mass, 60)),
    [spring],
  )
  return (
    <div className="space-y-2 w-72">
      <SpringControls value={spring} onChange={setSpring} />
      <EasingPreview easing={easing} property="moveX" />
      <div className="text-xs font-mono break-all">{easing}</div>
    </div>
  )
}
