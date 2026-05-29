"use client"

import { useState } from "react"
import { CalcEditor, type CalcString } from "@/components/ui/calc-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [value, setValue] = useState<CalcString>("min(50%, 30rem)")
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="CalcString"
      title="Literal-shaped hints"
      description={
        <>
          State typed as <code className="text-foreground">CalcString</code> —
          the{" "}
          <code className="text-foreground">
            calc() / clamp() / min() / max()
          </code>{" "}
          union. Also the <code className="text-foreground">onChange</code>{" "}
          return.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <CalcEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "kw", text: "const" },
          { kind: "plain", text: " [value, setValue] = " },
          { kind: "fn", text: "useState" },
          { kind: "plain", text: "<" },
          { kind: "type", text: "CalcString" },
          { kind: "plain", text: ">(" },
          { kind: "str", text: '"min(50%, 30rem)"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
