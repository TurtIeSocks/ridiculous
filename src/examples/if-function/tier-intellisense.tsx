"use client"

import { useState } from "react"
import { IfFunction, type IfFunctionString } from "@/components/ui/if-function"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [value, setValue] = useState<IfFunctionString>(
    "if(supports(display: grid): grid; else: block)",
  )
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="IfFunctionString"
      title="Literal-shaped hints"
      description={
        <>
          State typed as{" "}
          <code className="text-foreground">IfFunctionString</code> — an{" "}
          <code className="text-foreground">if(…)</code>-shaped string. It is
          also the <code className="text-foreground">onChange</code> return
          type, so downstream consumers stay in the suggestion union.
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
          { kind: "type", text: "IfFunctionString" },
          { kind: "plain", text: ">(" },
          {
            kind: "str",
            text: '"if(supports(display: grid): grid; else: block)"',
          },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
