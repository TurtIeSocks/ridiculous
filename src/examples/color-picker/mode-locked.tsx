import { useState } from "react"
import {
  type ColorMode,
  ColorPicker,
  type ColorStringMap,
} from "@/components/ui/color-picker"
import { CopyButton } from "./copy-button"

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
      <div className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
        <span className="text-gradient">→</span> {mode}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <ColorPicker<M>
          value={color}
          mode={mode}
          onChange={(next) => setColor(next as ColorStringMap[M])}
        />
        <code className="text-xs font-mono bg-black/40 border border-white/10 px-2.5 py-1 rounded-md truncate min-w-0 flex-1">
          {color}
        </code>
        <CopyButton value={color} />
      </div>
    </div>
  )
}

export function ModeLocked() {
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> mode-locked
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Mode-Locked</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Setting <code className="text-foreground">mode</code> hides the switcher
        and locks <code className="text-foreground">onChange</code> to that
        format.
      </p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODES.map((m) => (
          <ModeCard key={m} mode={m} />
        ))}
      </div>
    </div>
  )
}
