"use client"

import { useState } from "react"
import { ColorPicker, type ColorString } from "@/components/ui/color-picker"
import { CodeBlock } from "@/examples/_shared/code-block"
import { CopyButton } from "@/examples/_shared/copy-button"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [color, setColor] = useState<ColorString>("oklch(0.7 0.18 240)")
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="ColorString"
      title="Literal hints in the editor"
      description={
        <>
          State typed as <code className="text-foreground">ColorString</code>.
          IDE autocompletes literal shapes; range checks still deferred to
          runtime.
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
          { kind: "type", text: "ColorString" },
          { kind: "plain", text: ">(" },
          { kind: "str", text: '"oklch(0.7 0.18 240)"' },
          { kind: "plain", text: ")\n" },
          {
            kind: "com",
            text: "// hover the literal — IDE suggests oklch / oklab / hex / rgb / hsl / hwb",
          },
        ]}
      />
    </ExampleCard>
  )
}
