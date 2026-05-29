"use client"

import { useState } from "react"
import { TransitionEditor } from "@/components/ui/transition-editor"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [transition, setTransition] = useState<string>(
    "opacity 200ms ease, transform 0.3s 100ms ease-out",
  )
  const [animation, setAnimation] = useState<string>("spin 1s linear infinite")
  return (
    <ExampleCard
      eyebrow="basic-usage"
      title="Two shorthands, one editor"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. The{" "}
          <code className="font-mono text-foreground">mode</code> prop switches
          between the{" "}
          <code className="font-mono text-foreground">transition</code> and{" "}
          <code className="font-mono text-foreground">animation</code>{" "}
          shorthands. Add layers, edit each token with the right control, and
          the editor emits a valid comma-separated string.
        </>
      }
      className="md:p-8"
    >
      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <TransitionEditor value={transition} onChange={setTransition} />
          <ValueReadout value={transition} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TransitionEditor
            mode="animation"
            value={animation}
            onChange={setAnimation}
          />
          <ValueReadout value={animation} />
        </div>
      </div>
    </ExampleCard>
  )
}
