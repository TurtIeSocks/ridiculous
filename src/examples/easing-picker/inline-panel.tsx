"use client"

import { useState } from "react"
import { EasingPanel, type EasingString } from "@/components/ui/easing-picker"

export function InlinePanelExample() {
  const [easing, setEasing] = useState<EasingString>("ease-in-out")
  return (
    <div className="border rounded-lg p-4">
      <EasingPanel value={easing} onChange={setEasing} />
    </div>
  )
}
