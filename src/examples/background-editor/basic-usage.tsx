"use client"

import { useState } from "react"
import { BackgroundEditor } from "@/components/ui/background-editor"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [value, setValue] = useState<string>(
    "linear-gradient(#3b82f6, #8b5cf6) center / cover no-repeat, #0f172a",
  )
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="basic-usage"
      title="Edit a background shorthand"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. The
          component edits the CSS <code className="font-mono">background</code>{" "}
          shorthand — a comma-stacked list of layers painted back-to-front, each
          carrying an image, a{" "}
          <code className="font-mono">position / size</code>, and repeat /
          attachment / origin / clip keywords. The popover trigger shows the
          layer count and a truncated preview; the panel exposes the reorderable
          layer stack, a 2D position pad per layer, and a live composite tile.
          Only the <strong>final</strong> layer may carry a{" "}
          <code className="font-mono text-foreground">&lt;color&gt;</code>.
        </>
      }
    >
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <BackgroundEditor value={value} onChange={setValue} />
        <ValueReadout value={`background: ${value}`} />
      </div>
    </ExampleCard>
  )
}
