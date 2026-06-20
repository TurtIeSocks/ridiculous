"use client"

import { useState } from "react"
import { PropertySyntaxEditor } from "@/components/ui/property-syntax-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierCasual() {
  const [value, setValue] = useState<string>("<length> | auto")
  return (
    <ExampleCard
      tierIndex={1}
      tierLabel="casual"
      typeBadge="string"
      title="Pass any string"
      description={
        <>
          <code className="text-foreground">useState&lt;string&gt;</code>. No
          compile-time validation; the runtime parser tokenizes the descriptor
          into its <code className="font-mono">|</code> alternatives, classifies
          each component as a{" "}
          <code className="font-mono">&lt;data-type&gt;</code> or a literal
          ident, and reads its <code className="font-mono">+</code> /{" "}
          <code className="font-mono">#</code> multiplier.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <PropertySyntaxEditor value={value} onChange={setValue} />
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
          { kind: "str", text: '"<length> | auto"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
