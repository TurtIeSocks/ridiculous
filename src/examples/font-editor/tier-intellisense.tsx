"use client"

import { useState } from "react"
import { FontEditor, type FontString } from "@/components/ui/font-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [value, setValue] = useState<FontString>("bold 16px sans-serif")
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="FontString"
      title="Suggestion-shaped hints"
      description={
        <>
          State typed as <code className="text-foreground">FontString</code> —
          the system-font keywords plus any space-containing shorthand. It is
          also the <code className="text-foreground">onChange</code> return
          type. Precise validation lives in the strict tier.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <FontEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "kw", text: "const" },
          { kind: "plain", text: " [value, setValue] = " },
          { kind: "fn", text: "useState" },
          { kind: "plain", text: "<" },
          { kind: "type", text: "FontString" },
          { kind: "plain", text: ">(" },
          { kind: "str", text: '"bold 16px sans-serif"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
