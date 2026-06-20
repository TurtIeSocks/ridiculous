"use client"

import { useState } from "react"
import {
  BackgroundEditor,
  type BackgroundString,
} from "@/components/ui/background-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [value, setValue] = useState<BackgroundString>(
    "radial-gradient(#000, #fff) center, #0a0a0a",
  )
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="BackgroundString"
      title="Background-shaped hints"
      description={
        <>
          State typed as{" "}
          <code className="text-foreground">BackgroundString</code> — a
          shorthand-shaped string (and the{" "}
          <code className="text-foreground">onChange</code> return type). It
          stays assignable from any string literal, so you opt into the strict
          gate only at the call sites that want it (
          <code className="text-foreground">cssBackground()</code>) while the
          editor still round-trips freely.{" "}
          <code className="font-mono">LayersOf&lt;S&gt;</code> and{" "}
          <code className="font-mono">LayerCountOf&lt;S&gt;</code> read the
          comma-split layer tuple off any value.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <BackgroundEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "kw", text: "const" },
          { kind: "plain", text: " [value, setValue] = " },
          { kind: "fn", text: "useState" },
          { kind: "plain", text: "<" },
          { kind: "type", text: "BackgroundString" },
          { kind: "plain", text: ">(" },
          {
            kind: "str",
            text: '"radial-gradient(#000, #fff) center, #0a0a0a"',
          },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
