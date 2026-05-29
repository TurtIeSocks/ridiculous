"use client"

import { useState } from "react"
import {
  type MediaQueryString,
  QueryBuilder,
} from "@/components/ui/query-builder"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [value, setValue] = useState<MediaQueryString>(
    "(hover) and (pointer: fine)",
  )
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="MediaQueryString"
      title="Query-shaped hints"
      description={
        <>
          State typed as{" "}
          <code className="text-foreground">MediaQueryString</code> — a query-
          shaped string (and the{" "}
          <code className="text-foreground">onChange</code> return type). A{" "}
          <code className="text-foreground">QueryStringMap</code> keys the
          output by <code className="text-foreground">mode</code>, so the
          container dialect gets its own{" "}
          <code className="text-foreground">ContainerQueryString</code>.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <QueryBuilder value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "kw", text: "const" },
          { kind: "plain", text: " [value, setValue] = " },
          { kind: "fn", text: "useState" },
          { kind: "plain", text: "<" },
          { kind: "type", text: "MediaQueryString" },
          { kind: "plain", text: ">(" },
          { kind: "str", text: '"(hover) and (pointer: fine)"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
