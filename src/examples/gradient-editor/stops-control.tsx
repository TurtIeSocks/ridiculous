"use client"

import { useState } from "react"
import { GradientEditor } from "@/components/ui/gradient-editor"
import { CopyButton } from "@/examples/_shared/copy-button"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function StopsControl() {
  const [tight, setTight] = useState<string>(
    "linear-gradient(45deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)",
  )
  const [loose, setLoose] = useState<string>(
    "linear-gradient(45deg, #ff0000, #ff8800, #ffff00, #88ff00, #00ff00, #00ff88, #00ffff, #0088ff, #0000ff)",
  )
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="maxStops"
      title="Stops Control"
      description={
        <>
          The <code className="text-foreground">maxStops</code> prop caps how
          many stops the editor will allow. Min 2 is always enforced.
        </>
      }
    >
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="glass-card rounded-xl p-4">
          <div className="mb-3 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
            <span className="text-gradient">→</span> maxStops=3
          </div>
          <div className="flex items-center gap-2">
            <GradientEditor value={tight} maxStops={3} onChange={setTight} />
            <ValueReadout value={tight} />
            <CopyButton value={tight} label="Copy color" />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="mb-3 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
            <span className="text-gradient">→</span> maxStops=12
          </div>
          <div className="flex items-center gap-2">
            <GradientEditor value={loose} maxStops={12} onChange={setLoose} />
            <ValueReadout value={loose} />
            <CopyButton value={loose} label="Copy color" />
          </div>
        </div>
      </div>
    </ExampleCard>
  )
}
