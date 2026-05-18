import { useState } from "react"
import {
  ColorPicker,
  color,
  type ColorString,
} from "@/components/ui/color-picker"

export function TierStrict() {
  const [c, setC] = useState<ColorString>(color("oklch(0.7 0.18 240)"))
  return (
    <div className="rounded-lg border p-6">
      <h3 className="font-semibold mb-1">Tier 3 — Strict</h3>
      <p className="text-sm text-muted-foreground mb-4">
        <code>color()</code> validates the literal at compile time. Range
        violations type-error.
      </p>
      <div className="flex items-center gap-4">
        <ColorPicker value={c} onChange={setC} />
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
          {c}
        </code>
      </div>
      <pre className="mt-4 text-xs font-mono bg-muted p-3 rounded overflow-x-auto">
        {`import { color } from "@/components/ui/color-picker"

const valid = color("#ff0000")        // ✓
// @ts-expect-error 256 > 255
const broken = color("rgb(256 0 0)")  // type-error
// @ts-expect-error wrong hex length
const wrong = color("#ff")            // type-error`}
      </pre>
    </div>
  )
}
