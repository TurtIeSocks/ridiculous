"use client"

import { useState } from "react"
import { GridBuilder } from "@/components/ui/grid-builder"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierCasual() {
  // Plain string state — no validation, "just JavaScript".
  const [value, setValue] = useState<string>("1fr 2fr 1fr")
  return (
    <ExampleCard
      tierIndex={1}
      tierLabel="casual"
      typeBadge="string"
      title="Just use a string"
      description={
        <>
          The escape hatch. <code className="text-foreground">value</code> is a
          plain <code className="text-foreground">string</code> — no
          compile-time checking, drop in any template and go.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <GridBuilder value={value} onChange={setValue} />
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
          { kind: "str", text: '"1fr 2fr 1fr"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
