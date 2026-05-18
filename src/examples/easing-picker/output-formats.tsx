"use client"

import { useState } from "react"
import { EasingPicker, type EasingString } from "@/components/ui/easing-picker"

export function OutputFormatsExample() {
  const [easing, setEasing] = useState<EasingString>(
    "cubic-bezier(0.42, 0, 0.58, 1)",
  )
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        Toggle CSS / Tailwind v3 / Tailwind v4 inside the popover.
      </div>
      <EasingPicker value={easing} onChange={setEasing} output="tailwind-v4" />
    </div>
  )
}
