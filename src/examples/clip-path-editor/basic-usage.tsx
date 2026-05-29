"use client"

import { useState } from "react"
import { ClipPathEditor } from "@/components/ui/clip-path-editor"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [value, setValue] = useState<string>(
    "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  )
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="basic-usage"
      title="Edit a basic shape"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. Pick a
          shape, edit each argument with the right units, drag polygon vertices,
          and the editor emits a valid{" "}
          <code className="font-mono text-foreground">clip-path</code> string.
        </>
      }
    >
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ClipPathEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
    </ExampleCard>
  )
}
