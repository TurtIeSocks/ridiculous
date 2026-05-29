"use client"

import { useState } from "react"
import { FilterBuilder } from "@/components/ui/filter-builder"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [value, setValue] = useState<string>(
    "blur(2px) brightness(1.1) saturate(1.3)",
  )
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="basic-usage"
      title="Build a filter list"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. Add
          functions, edit each argument with the right units, and the editor
          emits a valid space-separated{" "}
          <code className="font-mono text-foreground">filter</code> string.
        </>
      }
    >
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <FilterBuilder value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
    </ExampleCard>
  )
}
