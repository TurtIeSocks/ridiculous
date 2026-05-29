"use client"

import { useState } from "react"
import {
  ClipPathEditor,
  type ClipPathString,
} from "@/components/ui/clip-path-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [value, setValue] = useState<ClipPathString>("ellipse(40% 30%)")
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="ClipPathString"
      title="Literal-shaped hints"
      description={
        <>
          State typed as <code className="text-foreground">ClipPathString</code>{" "}
          — the union of every{" "}
          <code className="text-foreground">
            inset()/circle()/ellipse()/polygon()
          </code>{" "}
          head (with an optional geometry box) plus a bare box and{" "}
          <code className="text-foreground">none</code>. It is also the{" "}
          <code className="text-foreground">onChange</code> return type.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <ClipPathEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "kw", text: "const" },
          { kind: "plain", text: " [value, setValue] = " },
          { kind: "fn", text: "useState" },
          { kind: "plain", text: "<" },
          { kind: "type", text: "ClipPathString" },
          { kind: "plain", text: ">(" },
          { kind: "str", text: '"ellipse(40% 30%)"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
