"use client"

import { useState } from "react"
import { KeyframesEditor } from "@/components/ui/keyframes-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierCasual() {
  const [value, setValue] = useState<string>(
    "from { transform: translateX(0px) } to { transform: translateX(100px) }",
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
          compile-time validation; the runtime parser splits the block list into
          stops and declarations, and{" "}
          <code className="font-mono">propertyEditorKind</code> routes each
          declaration to its embedded editor — even values the strict tier
          defers.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <KeyframesEditor value={value} onChange={setValue} />
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
            text: '"from { transform: translateX(0px) } to { … }"',
          },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
