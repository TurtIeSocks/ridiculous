"use client"

import { useState } from "react"
import { GradientEditor } from "@/components/ui/gradient-editor"
import { CopyButton } from "@/examples/_shared/copy-button"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [grad, setGrad] = useState<string>(
    "linear-gradient(45deg, oklch(0.628 0.258 29.234), oklch(0.622 0.214 259.815))",
  )
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="auto-type"
      title="Basic Usage"
      description="Type unset → switcher visible → onChange emits whichever type the user last selected."
    >
      <div className="mt-6 flex items-center gap-3">
        <GradientEditor value={grad} onChange={setGrad} />
        <ValueReadout value={grad} size="md" />
        <CopyButton value={grad} label="Copy color" />
      </div>
    </ExampleCard>
  )
}
