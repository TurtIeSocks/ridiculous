"use client"

import { useState } from "react"
import { TransformBuilder } from "@/components/ui/transform-builder"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierCasual() {
  const [value, setValue] = useState<string>(
    "translate(10px, 20%) rotate(15deg)",
  )
  return (
    <ExampleCard
      tierIndex={1}
      tierLabel="casual"
      typeBadge="string"
      title="Pass any string"
      description={
        <>
          <code className="text-foreground">useState&lt;string&gt;</code>. No
          compile-time validation; the runtime parser handles whatever you type
          — including <code className="text-foreground">calc()</code> and{" "}
          <code className="text-foreground">var()</code> arguments.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <TransformBuilder value={value} onChange={setValue} />
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
          { kind: "str", text: '"translate(10px, 20%) rotate(15deg)"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
