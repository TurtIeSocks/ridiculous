// src/examples/easing-picker/sub-component-bezier.tsx
"use client"

import { useState } from "react"
import { BezierCanvas } from "@/components/ui/easing-picker"

export function SubComponentBezierExample() {
  const [value, setValue] = useState({ x1: 0.42, y1: 0, x2: 0.58, y2: 1 })
  return (
    <div className="space-y-2 w-60">
      <BezierCanvas value={value} onChange={setValue} />
      <div className="text-xs font-mono">
        cubic-bezier({value.x1.toFixed(2)}, {value.y1.toFixed(2)},{" "}
        {value.x2.toFixed(2)}, {value.y2.toFixed(2)})
      </div>
    </div>
  )
}
