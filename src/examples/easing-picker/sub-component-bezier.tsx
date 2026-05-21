"use client"

import { useState } from "react"
import { BezierCanvas } from "@/components/ui/easing-picker"

export function SubComponentBezierExample() {
  const [value, setValue] = useState({ x1: 0.42, y1: 0, x2: 0.58, y2: 1 })
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> sub-component
      </div>
      <h3 className="text-xl font-semibold tracking-tight">
        BezierCanvas (standalone)
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Drop just the bezier editor into your own UI. Drag the handles; the
        component owns nothing — you bring the state.
      </p>
      <div className="mt-6 flex items-center gap-6">
        <div className="size-44 shrink-0">
          <BezierCanvas value={value} onChange={setValue} />
        </div>
        <code className="text-sm font-mono bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg">
          cubic-bezier({value.x1.toFixed(2)}, {value.y1.toFixed(2)},{" "}
          {value.x2.toFixed(2)}, {value.y2.toFixed(2)})
        </code>
      </div>
    </div>
  )
}
