"use client"

import { useState } from "react"
import { ColorPicker } from "@/components/ui/color-picker"
import { CopyButton } from "@/examples/_shared/copy-button"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

// Each entry is a color value OR a CSS variable. Vars render against the live
// theme cascade and resolve to a concrete color on click (never the raw var()).
const PRESETS = [
  "var(--color-primary)",
  "var(--color-accent)",
  "var(--color-destructive)",
  "var(--color-violet-glow)",
  "var(--color-cyan-glow)",
  "var(--color-pink-glow)",
  "#22c55e",
  "oklch(0.7 0.2 150)",
]

export function Presets() {
  const [color, setColor] = useState<string>("oklch(0.85 0.15 290)")
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="presets"
      title="Custom Presets"
      description={
        <>
          Pass <code className="text-foreground">presets</code> as an array of
          color values <em>or</em> CSS variables like{" "}
          <code className="text-foreground">var(--color-primary)</code>. Var
          swatches display the resolved theme token and emit a concrete color on
          click. Omit the prop for the built-in palette; pass{" "}
          <code className="text-foreground">[]</code> for none.
        </>
      }
    >
      <div className="mt-6 flex items-center gap-3">
        <ColorPicker value={color} onChange={setColor} presets={PRESETS} />
        <ValueReadout value={color} size="md" />
        <CopyButton value={color} label="Copy color" />
      </div>
    </ExampleCard>
  )
}
