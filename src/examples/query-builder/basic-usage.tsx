"use client"

import { useState } from "react"
import { QueryBuilder } from "@/components/ui/query-builder"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [value, setValue] = useState<string>(
    "screen and (min-width: 600px) and (max-width: 900px)",
  )
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="basic-usage"
      title="Build a media query"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. Pick a
          media type, add parenthesized feature tests (
          <code className="font-mono text-foreground">min-width</code>,{" "}
          <code className="font-mono text-foreground">orientation</code>,{" "}
          <code className="font-mono text-foreground">hover</code>, …), and the
          editor emits the <code className="font-mono">@media</code> condition
          string. A single <code className="font-mono">and</code>/
          <code className="font-mono">or</code> joiner keeps the condition valid
          by construction.
        </>
      }
    >
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <QueryBuilder value={value} onChange={setValue} />
        <ValueReadout value={`@media ${value}`} />
      </div>
    </ExampleCard>
  )
}
