"use client"

import { useState } from "react"
import { EasingPicker, type EasingString } from "@/components/ui/easing-picker"

export function BasicUsageExample() {
  const [easing, setEasing] = useState<EasingString>(
    "cubic-bezier(0.42, 0, 0.58, 1)",
  )
  return (
    <div className="space-y-4">
      <EasingPicker value={easing} onChange={setEasing} />
      <div className="text-xs font-mono text-muted-foreground">{easing}</div>
    </div>
  )
}
