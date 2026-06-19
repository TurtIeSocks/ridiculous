"use client"

import { useState } from "react"
import {
  ShapePathEditor,
  type ShapeString,
} from "@/components/ui/shape-path-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [value, setValue] = useState<ShapeString>(
    "shape(from 10px 10px, smooth to 90px 90px, close)",
  )
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="ShapeString"
      title="shape()-shaped hints"
      description={
        <>
          State typed as <code className="text-foreground">ShapeString</code> —{" "}
          <code className="font-mono">
            `shape($&#123;string&#125;)` | (string &amp; &#123;&#125;)
          </code>{" "}
          — a wrapper-shaped string (and the{" "}
          <code className="text-foreground">onChange</code> return type). The
          editor hint surfaces the <code className="font-mono">shape(</code>{" "}
          prefix while still accepting any string, so you get the autocomplete
          nudge without the strict tier&apos;s per-command rejection.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <ShapePathEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "kw", text: "const" },
          { kind: "plain", text: " [value, setValue] = " },
          { kind: "fn", text: "useState" },
          { kind: "plain", text: "<" },
          { kind: "type", text: "ShapeString" },
          { kind: "plain", text: ">(" },
          {
            kind: "str",
            text: '"shape(from 10px 10px, smooth to 90px 90px, close)"',
          },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
