"use client"

import { useState } from "react"
import { KeyframesEditor } from "@/components/ui/keyframes-editor"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [value, setValue] = useState<string>(
    "from { opacity: 0 } to { opacity: 1 }",
  )
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="basic-usage"
      title="Edit a @keyframes body"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. The
          component edits the <strong>body</strong> of a{" "}
          <code className="font-mono">@keyframes</code> rule — the ordered list
          of stops (<code className="font-mono text-foreground">from</code>,{" "}
          <code className="font-mono text-foreground">to</code>, and{" "}
          <code className="font-mono text-foreground">N%</code>) — not the rule
          name. The popover trigger shows the stop count and a truncated
          preview; the panel exposes a timeline, per-stop declarations, and a
          scrubbed preview. Wrap the emitted body in your own{" "}
          <code className="font-mono">@keyframes spin {"{ … }"}</code>.
        </>
      }
    >
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <KeyframesEditor value={value} onChange={setValue} />
        <ValueReadout value={`@keyframes spin { ${value} }`} />
      </div>
    </ExampleCard>
  )
}
