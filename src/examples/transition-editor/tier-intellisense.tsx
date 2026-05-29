"use client"

import { useState } from "react"
import {
  TransitionEditor,
  type TransitionString,
} from "@/components/ui/transition-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [value, setValue] = useState<TransitionString>("opacity 200ms ease")
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="TransitionString"
      title="Literal-shaped hints"
      description={
        <>
          State typed as{" "}
          <code className="text-foreground">TransitionString</code> — a
          space-separated layer, a comma-joined list, or{" "}
          <code className="text-foreground">none</code>. The mode keys the map:{" "}
          <code className="text-foreground">AnimationString</code> is the
          animation-mode return. It is also the{" "}
          <code className="text-foreground">onChange</code> type.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <TransitionEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "kw", text: "const" },
          { kind: "plain", text: " [value, setValue] = " },
          { kind: "fn", text: "useState" },
          { kind: "plain", text: "<" },
          { kind: "type", text: "TransitionString" },
          { kind: "plain", text: ">(" },
          { kind: "str", text: '"opacity 200ms ease"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
