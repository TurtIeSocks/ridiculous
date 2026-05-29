"use client"

import { useState } from "react"
import { GridBuilder } from "@/components/ui/grid-builder"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [value, setValue] = useState<string>("repeat(3, 1fr)")
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="basic-usage"
      title="Build a grid template"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. Switch
          between <code className="font-mono text-foreground">columns</code>,{" "}
          <code className="font-mono text-foreground">rows</code>, and{" "}
          <code className="font-mono text-foreground">areas</code>; add tracks
          or paint cells and the editor emits a valid template string.
        </>
      }
    >
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <GridBuilder value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
    </ExampleCard>
  )
}
