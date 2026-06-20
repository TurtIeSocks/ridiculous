"use client"

import { useState } from "react"
import { AnchorPositionEditor } from "@/components/ui/anchor-position-editor"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [value, setValue] = useState<string>("top center")
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="basic-usage"
      title="Place an anchored element"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. The
          default <code className="font-mono">position-area</code> mode shows a
          clickable 3×3 grid: pick a cell and the editor emits the{" "}
          <code className="font-mono text-foreground">position-area</code>{" "}
          keyword pair (
          <code className="font-mono text-foreground">top center</code>,{" "}
          <code className="font-mono text-foreground">bottom right</code>, …).
          The center cell collapses to the single keyword{" "}
          <code className="font-mono">center</code>. Logical / physical and span
          toggles never mix coordinate systems, so the pair is valid by
          construction.
        </>
      }
    >
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <AnchorPositionEditor value={value} onChange={setValue} />
        <ValueReadout value={`position-area: ${value}`} />
      </div>
    </ExampleCard>
  )
}
