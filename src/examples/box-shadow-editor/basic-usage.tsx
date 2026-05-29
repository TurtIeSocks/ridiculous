"use client"

import { useState } from "react"
import { BoxShadowEditor } from "@/components/ui/box-shadow-editor"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [value, setValue] = useState<string>(
    "0px 1px 2px rgb(0 0 0 / 0.2), 0px 4px 8px rgb(0 0 0 / 0.15)",
  )
  return (
    <ExampleCard
      eyebrow="basic-usage"
      title="Stack shadow layers"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. Add
          layers, toggle{" "}
          <code className="font-mono text-foreground">inset</code>, edit each
          offset / blur / spread with the right units, pick a per-layer color,
          and the editor emits a valid comma-separated{" "}
          <code className="font-mono text-foreground">box-shadow</code> string.
        </>
      }
      className="md:p-8"
    >
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <BoxShadowEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
    </ExampleCard>
  )
}
