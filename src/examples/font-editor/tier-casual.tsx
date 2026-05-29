"use client"

import { useState } from "react"
import { FontEditor } from "@/components/ui/font-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierCasual() {
  const [value, setValue] = useState<string>("16px var(--brand-stack), serif")
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
          — including <code className="text-foreground">var()</code> family
          tokens.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <FontEditor value={value} onChange={setValue} />
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
          { kind: "str", text: '"16px var(--brand-stack), serif"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
