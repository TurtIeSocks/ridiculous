"use client"

import { useState } from "react"
import {
  EasingPicker,
  type CubicBezierString,
  type LinearString,
  type StepsString,
} from "@/components/ui/easing-picker"

export function TypeLockedExample() {
  const [bezier, setBezier] = useState<CubicBezierString>("cubic-bezier(0.42, 0, 0.58, 1)")
  const [spring, setSpring] = useState<LinearString>("linear(0, 1)")
  const [steps, setSteps] = useState<StepsString>("steps(4)")

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-sm font-medium">basis="bezier"</div>
        <EasingPicker basis="bezier" value={bezier} onChange={setBezier} />
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium">basis="spring"</div>
        <EasingPicker basis="spring" value={spring} onChange={setSpring} />
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium">basis="steps"</div>
        <EasingPicker basis="steps" value={steps} onChange={setSteps} />
      </div>
    </div>
  )
}
