"use client"

import { useState } from "react"
import { TransitionEditor } from "@/components/ui/transition-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierCasual() {
  const [value, setValue] = useState<string>("opacity 200ms ease")
  return (
    <ExampleCard
      tierIndex={1}
      tierLabel="casual"
      typeBadge="string"
      title="Pass any string"
      description={
        <>
          <code className="text-foreground">useState&lt;string&gt;</code>. No
          compile-time validation; the runtime parser classifies whatever you
          type by token kind — including{" "}
          <code className="text-foreground">calc()</code> durations and tokens
          in any order.
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
          { kind: "type", text: "string" },
          { kind: "plain", text: ">(" },
          { kind: "str", text: '"opacity 200ms ease"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
