import { useState } from "react"
import {
  type ColorMode,
  ColorPicker,
  type ColorStringMap,
} from "@/components/ui/color-picker"

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
    <div className="rounded-lg border p-4">
      <h4 className="font-mono text-sm mb-3">{mode}</h4>
      <div className="flex items-center gap-3">
        <ColorPicker<M>
          value={color}
          mode={mode}
          onChange={(next) => setColor(next as ColorStringMap[M])}
        />
        <code className="text-xs font-mono bg-muted px-2 py-1 rounded truncate">
          {color}
        </code>
      </div>
    </div>
  )
}

export function ModeLocked() {
  return (
    <div className="rounded-lg border p-6">
      <h3 className="font-semibold mb-4">Mode-Locked</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODES.map((m) => (
          <ModeCard key={m} mode={m} />
        ))}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Setting <code>mode</code> hides the switcher and locks onChange to that
        format.
      </p>
    </div>
  )
}
