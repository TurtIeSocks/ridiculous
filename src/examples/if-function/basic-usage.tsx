"use client"

import { useState } from "react"
import { IfFunction } from "@/components/ui/if-function"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [value, setValue] = useState<string>(
    "if(media(width >= 800px): 2rem; else: 1rem)",
  )
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="basic-usage"
      title="Branch by condition"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. The CSS{" "}
          <code className="font-mono text-foreground">if()</code> function picks
          a value from a list of guarded branches — each branch is a{" "}
          <code className="font-mono text-foreground">condition : value</code>{" "}
          separated by semicolons, where the condition is{" "}
          <code className="font-mono text-foreground">media()</code>,{" "}
          <code className="font-mono text-foreground">supports()</code>,{" "}
          <code className="font-mono text-foreground">style()</code>, or a
          trailing <code className="font-mono text-foreground">else</code>. Add
          branches and the editor emits a valid{" "}
          <code className="font-mono">if()</code> string.
        </>
      }
    >
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <IfFunction value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
    </ExampleCard>
  )
}
