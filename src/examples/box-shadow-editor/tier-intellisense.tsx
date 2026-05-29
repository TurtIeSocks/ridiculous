"use client"

import { useState } from "react"
import {
  BoxShadowEditor,
  type BoxShadowString,
} from "@/components/ui/box-shadow-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [value, setValue] = useState<BoxShadowString>("0px 4px 8px #0003")
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="BoxShadowString"
      title="Literal-shaped hints"
      description={
        <>
          State typed as{" "}
          <code className="text-foreground">BoxShadowString</code> — a single
          space-separated layer, a comma-joined multi-layer list, or{" "}
          <code className="text-foreground">none</code>. It is also the{" "}
          <code className="text-foreground">onChange</code> return type.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <BoxShadowEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "kw", text: "const" },
          { kind: "plain", text: " [value, setValue] = " },
          { kind: "fn", text: "useState" },
          { kind: "plain", text: "<" },
          { kind: "type", text: "BoxShadowString" },
          { kind: "plain", text: ">(" },
          { kind: "str", text: '"0px 4px 8px #0003"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
