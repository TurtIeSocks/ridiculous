"use client"

import { useState } from "react"
import {
  ColorFunction,
  type ColorFunctionString,
} from "@/components/ui/color-function"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [value, setValue] = useState<ColorFunctionString>(
    "light-dark(#ffffff, #1a1a1a)",
  )
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="ColorFunctionString"
      title="Suggestion-shaped hints"
      description={
        <>
          State typed as{" "}
          <code className="text-foreground">ColorFunctionString</code> — the
          union of the three family shapes. It is also the{" "}
          <code className="text-foreground">onChange</code> return type, and it
          narrows to one family via the{" "}
          <code className="text-foreground">mode</code> prop. Precise validation
          lives in the strict tier.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <ColorFunction value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "kw", text: "const" },
          { kind: "plain", text: " [value, setValue] = " },
          { kind: "fn", text: "useState" },
          { kind: "plain", text: "<" },
          { kind: "type", text: "ColorFunctionString" },
          { kind: "plain", text: ">(" },
          { kind: "str", text: '"light-dark(#ffffff, #1a1a1a)"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
