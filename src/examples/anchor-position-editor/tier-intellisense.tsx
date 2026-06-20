"use client"

import { useState } from "react"
import {
  AnchorPositionEditor,
  type PositionAreaString,
} from "@/components/ui/anchor-position-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [value, setValue] = useState<PositionAreaString>(
    "block-start inline-start",
  )
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="PositionAreaString"
      title="Position-area-shaped hints"
      description={
        <>
          State typed as{" "}
          <code className="text-foreground">PositionAreaString</code> — a
          keyword-pair-shaped string (and the{" "}
          <code className="text-foreground">onChange</code> return type). An{" "}
          <code className="text-foreground">AnchorStringMap</code> keys the
          output by <code className="text-foreground">mode</code>, so the{" "}
          <code className="font-mono">anchor</code> and{" "}
          <code className="font-mono">position-try</code> dialects get their own{" "}
          <code className="text-foreground">AnchorString</code> /{" "}
          <code className="text-foreground">PositionTryString</code>.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <AnchorPositionEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "kw", text: "const" },
          { kind: "plain", text: " [value, setValue] = " },
          { kind: "fn", text: "useState" },
          { kind: "plain", text: "<" },
          { kind: "type", text: "PositionAreaString" },
          { kind: "plain", text: ">(" },
          { kind: "str", text: '"block-start inline-start"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
