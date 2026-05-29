"use client"

import { useState } from "react"
import { ColorPicker } from "@/components/ui/color-picker"
import { CodeBlock } from "@/examples/_shared/code-block"
import { CopyButton } from "@/examples/_shared/copy-button"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierCasual() {
  const [color, setColor] = useState<string>("#3b82f6")
  return (
    <ExampleCard
      tierIndex={1}
      tierLabel="casual"
      typeBadge="string"
      title="Pass any string"
      description={
        <>
          <code className="text-foreground">useState&lt;string&gt;</code>. No
          compile-time validation; runtime parser handles whatever you throw.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <ColorPicker value={color} onChange={setColor} />
        <ValueReadout value={color} />
        <CopyButton value={color} label="Copy color" />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "kw", text: "const" },
          { kind: "plain", text: " [color, setColor] = " },
          { kind: "fn", text: "useState" },
          { kind: "plain", text: "<" },
          { kind: "type", text: "string" },
          { kind: "plain", text: ">(" },
          { kind: "str", text: '"#3b82f6"' },
          { kind: "plain", text: ")\n<" },
          { kind: "fn", text: "ColorPicker" },
          { kind: "plain", text: " " },
          { kind: "kw", text: "value" },
          { kind: "plain", text: "={color} " },
          { kind: "kw", text: "onChange" },
          { kind: "plain", text: "={setColor} />" },
        ]}
      />
    </ExampleCard>
  )
}
