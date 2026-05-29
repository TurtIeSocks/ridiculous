"use client"

import { useState } from "react"
import {
  type ColorMode,
  ColorPicker,
  type ColorStringMap,
} from "@/components/ui/color-picker"
import { CopyButton } from "@/examples/_shared/copy-button"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

const MODES: readonly ColorMode[] = [
  "oklch",
  "oklab",
  "hex",
  "rgb",
  "hsl",
  "hwb",
] as const

function ModeCard<M extends ColorMode>({ mode }: { mode: M }) {
  const initial: Record<ColorMode, string> = {
    oklch: "oklch(0.628 0.258 29.234)",
    oklab: "oklab(0.628 0.225 0.126)",
    hex: "#ff0000",
    rgb: "rgb(255 0 0)",
    hsl: "hsl(0 100% 50%)",
    hwb: "hwb(0 0% 0%)",
  }
  const [color, setColor] = useState<ColorStringMap[M]>(
    initial[mode] as ColorStringMap[M],
  )
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">→</span> {mode}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <ColorPicker<M>
          value={color}
          mode={mode}
          onChange={(next) => setColor(next as ColorStringMap[M])}
        />
        <ValueReadout value={color} />
        <CopyButton value={color} label="Copy color" />
      </div>
    </div>
  )
}

export function ModeLocked() {
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="mode-locked"
      title="Mode-Locked"
      description={
        <>
          Setting <code className="text-foreground">mode</code> hides the
          switcher and locks <code className="text-foreground">onChange</code>{" "}
          to that format.
        </>
      }
    >
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((m) => (
          <ModeCard key={m} mode={m} />
        ))}
      </div>
    </ExampleCard>
  )
}
