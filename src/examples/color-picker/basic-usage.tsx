"use client"

import { useState } from "react"
import { ColorPicker } from "@/components/ui/color-picker"
import { CopyButton } from "@/examples/_shared/copy-button"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [color, setColor] = useState<string>("oklch(0.628 0.258 29.234)")
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="auto-mode"
      title="Basic Usage"
      description="Mode unset → switcher visible → onChange emits whichever mode the user last selected."
    >
      <div className="mt-6 flex items-center gap-3">
        <ColorPicker value={color} onChange={setColor} />
        <ValueReadout value={color} size="md" />
        <CopyButton value={color} label="Copy color" />
      </div>
    </ExampleCard>
  )
}
