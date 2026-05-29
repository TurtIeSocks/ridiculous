"use client"

import { useState } from "react"
import {
  FilterBuilder,
  type FilterString,
} from "@/components/ui/filter-builder"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [value, setValue] = useState<FilterString>("saturate(1.5)")
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="FilterString"
      title="Literal-shaped hints"
      description={
        <>
          State typed as <code className="text-foreground">FilterString</code> —
          the union of every{" "}
          <code className="text-foreground">
            blur()/brightness()/drop-shadow()/…
          </code>{" "}
          head plus <code className="text-foreground">none</code>. It is also
          the <code className="text-foreground">onChange</code> return type.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <FilterBuilder value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "kw", text: "const" },
          { kind: "plain", text: " [value, setValue] = " },
          { kind: "fn", text: "useState" },
          { kind: "plain", text: "<" },
          { kind: "type", text: "FilterString" },
          { kind: "plain", text: ">(" },
          { kind: "str", text: '"saturate(1.5)"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
