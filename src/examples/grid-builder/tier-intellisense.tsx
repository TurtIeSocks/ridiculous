"use client"

import { useState } from "react"
import {
  GridBuilder,
  type GridTemplateString,
} from "@/components/ui/grid-builder"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [value, setValue] = useState<GridTemplateString>("repeat(4, 1fr)")
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="GridTemplateString"
      title="Literal-shaped hints"
      description={
        <>
          State typed as{" "}
          <code className="text-foreground">GridTemplateString</code> — the
          union of track-list shapes (
          <code className="text-foreground">repeat(…)</code>,{" "}
          <code className="text-foreground">minmax(…)</code>, sizes, named
          lines) and quoted areas rows. It is also the{" "}
          <code className="text-foreground">onChange</code> return type.
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
          { kind: "type", text: "GridTemplateString" },
          { kind: "plain", text: ">(" },
          { kind: "str", text: '"repeat(4, 1fr)"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
