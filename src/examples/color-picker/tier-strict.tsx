"use client"

import { useState } from "react"
import {
  ColorPicker,
  type ColorString,
  color,
} from "@/components/ui/color-picker"
import { CodeBlock } from "@/examples/_shared/code-block"
import { CopyButton } from "@/examples/_shared/copy-button"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierStrict() {
  const [c, setC] = useState<ColorString>(color("oklch(0.7 0.18 240)"))
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={<>ColorLiteral&lt;S&gt;</>}
      title="Validate at compile time"
      description={
        <>
          <code className="text-foreground">color()</code> range-checks the
          literal. Out-of-range tokens type-error.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <ColorPicker value={c} onChange={setC} />
        <ValueReadout value={c} />
        <CopyButton value={c} label="Copy color" />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "kw", text: "const" },
          { kind: "plain", text: " valid = " },
          { kind: "fn", text: "color" },
          { kind: "plain", text: "(" },
          { kind: "str", text: '"#ff0000"' },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓" },
          { kind: "plain", text: "\n" },
          { kind: "com", text: "// @ts-expect-error 256 > 255" },
          { kind: "plain", text: "\n" },
          { kind: "kw", text: "const" },
          { kind: "plain", text: " bad = " },
          { kind: "fn", text: "color" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"rgb(256 0 0)"' },
          { kind: "plain", text: ")\n" },
          { kind: "com", text: "// @ts-expect-error wrong hex length" },
          { kind: "plain", text: "\n" },
          { kind: "kw", text: "const" },
          { kind: "plain", text: " short = " },
          { kind: "fn", text: "color" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"#ff"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
