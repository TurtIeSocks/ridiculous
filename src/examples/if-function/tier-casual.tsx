"use client"

import { useState } from "react"
import { IfFunction } from "@/components/ui/if-function"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierCasual() {
  const [value, setValue] = useState<string>(
    "if(media(width >= 600px): grid; else: block)",
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
          compile-time validation; the runtime parser splits the branches and
          classifies each condition — including condition bodies the strict tier
          only checks for balance.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <IfFunction value={value} onChange={setValue} />
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
          {
            kind: "str",
            text: '"if(media(width >= 600px): grid; else: block)"',
          },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
