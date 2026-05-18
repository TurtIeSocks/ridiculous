import { useState } from "react"
import {
  ColorPicker,
  type ColorString,
} from "@/components/ui/color-picker"

export function TierIntellisense() {
  const [color, setColor] = useState<ColorString>(
    "oklch(0.7 0.18 240)",
  )
  return (
    <div className="rounded-lg border p-6">
      <h3 className="font-semibold mb-1">Tier 2 — IntelliSense</h3>
      <p className="text-sm text-muted-foreground mb-4">
        State typed as <code>ColorString</code> — IDE suggests literal shapes
        in autocomplete. Range checks still deferred to runtime.
      </p>
      <div className="flex items-center gap-4">
        <ColorPicker value={color} onChange={setColor} />
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
          {color}
        </code>
      </div>
      <pre className="mt-4 text-xs font-mono bg-muted p-3 rounded overflow-x-auto">
        {`const [color, setColor] = useState<ColorString>("oklch(0.7 0.18 240)")
// hover the literal in your editor — IntelliSense suggests oklch/oklab/hex/rgb/hsl/hwb shapes`}
      </pre>
    </div>
  )
}
