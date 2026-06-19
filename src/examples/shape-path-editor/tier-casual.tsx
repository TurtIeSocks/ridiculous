"use client"

import { useState } from "react"
import { ShapePathEditor } from "@/components/ui/shape-path-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierCasual() {
  const [value, setValue] = useState<string>(
    "shape(evenodd from 0px 0px, hline by 50px, vline by 50px, close)",
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
          compile-time validation; the runtime parser tokenizes the{" "}
          <code className="font-mono">shape()</code> body, classifies every
          command by name, and drives the canvas — including the optional
          fill-rule and exotic <code className="font-mono">hline</code> /{" "}
          <code className="font-mono">vline</code> forms the strict tier treats
          structurally.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <ShapePathEditor value={value} onChange={setValue} />
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
            text: '"shape(evenodd from 0px 0px, hline by 50px, …)"',
          },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
