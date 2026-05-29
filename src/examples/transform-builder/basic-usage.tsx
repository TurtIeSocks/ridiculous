"use client"

import { useState } from "react"
import { TransformBuilder } from "@/components/ui/transform-builder"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [value, setValue] = useState<string>(
    "translateX(10px) rotate(45deg) scale(1.1)",
  )
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="basic-usage"
      title="Build a transform list"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. Add
          functions, edit each argument with the right units, and the editor
          emits a valid space-separated{" "}
          <code className="font-mono text-foreground">transform</code> string.
        </>
      }
    >
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <TransformBuilder value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
    </ExampleCard>
  )
}
