"use client"

import { useState } from "react"
import { CalcEditor } from "@/components/ui/calc-editor"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [value, setValue] = useState<string>("clamp(1rem, 0.5rem + 2vw, 3rem)")
  return (
    <ExampleCard
      eyebrow="basic-usage"
      title="Edit a calc value"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. The
          popover editor parses, dimension-checks, and only emits a valid CSS
          math string.
        </>
      }
      className="md:p-8"
    >
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <CalcEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
    </ExampleCard>
  )
}
