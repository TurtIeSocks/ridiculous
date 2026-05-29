"use client"

import { useState } from "react"
import { GradientEditor } from "@/components/ui/gradient-editor"
import { CopyButton } from "@/examples/_shared/copy-button"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function Interpolation() {
  const [srgb, setSrgb] = useState<string>(
    "linear-gradient(90deg in srgb, #ff0000, #0000ff)",
  )
  const [oklch, setOklch] = useState<string>(
    "linear-gradient(90deg in oklch, #ff0000, #0000ff)",
  )
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="interpolation"
      title="Interpolation Space"
      description={
        <>
          Same red → blue stops, different interpolation spaces.{" "}
          <code className="text-foreground">in srgb</code> goes through a muddy
          gray midpoint; <code className="text-foreground">in oklch</code> stays
          perceptually vivid through the transition. This is the brand bias.
        </>
      }
    >
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="glass-card rounded-xl p-4">
          <div className="mb-3 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
            <span className="text-gradient">→</span> in srgb
          </div>
          <div
            className="h-20 rounded-lg border"
            style={{ background: srgb }}
          />
          <div className="mt-3 flex items-center gap-2">
            <GradientEditor value={srgb} type="linear" onChange={setSrgb} />
            <ValueReadout value={srgb} />
            <CopyButton value={srgb} label="Copy color" />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="mb-3 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
            <span className="text-gradient">→</span> in oklch
          </div>
          <div
            className="h-20 rounded-lg border"
            style={{ background: oklch }}
          />
          <div className="mt-3 flex items-center gap-2">
            <GradientEditor value={oklch} type="linear" onChange={setOklch} />
            <ValueReadout value={oklch} />
            <CopyButton value={oklch} label="Copy color" />
          </div>
        </div>
      </div>
    </ExampleCard>
  )
}
