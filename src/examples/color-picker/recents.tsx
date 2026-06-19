"use client"

import { useState } from "react"
import { ColorPicker, type ColorString } from "@/components/ui/color-picker"
import { CopyButton } from "@/examples/_shared/copy-button"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function Recents() {
  const [color, setColor] = useState<ColorString>("oklch(0.628 0.258 29.234)")
  const [history, setHistory] = useState<ColorString[]>([
    "oklch(0.85 0.15 290)",
    "#22c55e",
  ])
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="recents"
      title="Recents (controlled)"
      description={
        <>
          Pass <code className="text-foreground">history</code> +{" "}
          <code className="text-foreground">onHistoryChange</code> to control
          the recents row — a color commits once when the popover closes,
          deduped, most-recent first, capped at 8. Drop both props (or seed with{" "}
          <code className="text-foreground">defaultHistory</code>) for the
          uncontrolled variant.
        </>
      }
    >
      <div className="mt-6 flex items-center gap-3">
        <ColorPicker
          value={color}
          onChange={setColor}
          history={history}
          onHistoryChange={setHistory}
        />
        <ValueReadout value={color} size="md" />
        <CopyButton value={color} label="Copy color" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-muted-foreground text-xs">
        <span className="uppercase tracking-[0.15em]">
          history[{history.length}]:
        </span>
        {history.map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 rounded border"
              style={{ backgroundColor: c }}
            />
            {c}
          </span>
        ))}
      </div>
    </ExampleCard>
  )
}
