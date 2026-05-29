"use client"

import { useState } from "react"
import {
  TransformBuilder,
  type TransformString,
} from "@/components/ui/transform-builder"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [value, setValue] = useState<TransformString>("scale(1.25)")
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="TransformString"
      title="Literal-shaped hints"
      description={
        <>
          State typed as{" "}
          <code className="text-foreground">TransformString</code> — the union
          of every{" "}
          <code className="text-foreground">
            translate()/scale()/rotate()/…
          </code>{" "}
          head plus <code className="text-foreground">none</code>. It is also
          the <code className="text-foreground">onChange</code> return type.
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
          { kind: "type", text: "TransformString" },
          { kind: "plain", text: ">(" },
          { kind: "str", text: '"scale(1.25)"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
