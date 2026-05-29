"use client"

import { useState } from "react"
import { ColorFunction } from "@/components/ui/color-function"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [value, setValue] = useState<string>(
    "color-mix(in oklch, oklch(0.7 0.2 30) 60%, oklch(0.6 0.2 250))",
  )
  return (
    <ExampleCard
      eyebrow="basic-usage"
      title="Build a modern color function"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. Pick the
          interpolation colorspace, the two colors and their mix ratio — the
          editor emits a valid{" "}
          <code className="font-mono text-foreground">color-mix()</code> string,
          and the trigger swatch shows the resolved color.
        </>
      }
      className="md:p-8"
    >
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ColorFunction value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
    </ExampleCard>
  )
}
