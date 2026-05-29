"use client"

import { useState } from "react"
import { BezierCanvas } from "@/components/ui/easing-picker"
import { ExampleCard } from "@/examples/_shared/example-card"

export function SubComponentBezierExample() {
  const [value, setValue] = useState({ x1: 0.42, y1: 0, x2: 0.58, y2: 1 })
  return (
    <ExampleCard
      eyebrow="sub-component"
      title="BezierCanvas (standalone)"
      description="Drop just the bezier editor into your own UI. Drag the handles; the component owns nothing — you bring the state."
      className="md:p-8"
    >
      <div className="mt-6 flex items-center gap-6">
        <div className="size-44 shrink-0">
          <BezierCanvas value={value} onChange={setValue} />
        </div>
        <code className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-sm">
          cubic-bezier({value.x1.toFixed(2)}, {value.y1.toFixed(2)},{" "}
          {value.x2.toFixed(2)}, {value.y2.toFixed(2)})
        </code>
      </div>
    </ExampleCard>
  )
}
