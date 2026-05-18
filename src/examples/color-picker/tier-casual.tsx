import { useState } from "react"
import { ColorPicker } from "@/components/ui/color-picker"

export function TierCasual() {
  const [color, setColor] = useState<string>("#3b82f6")
  return (
    <div className="rounded-lg border p-6">
      <h3 className="font-semibold mb-1">Tier 1 — Casual</h3>
      <p className="text-sm text-muted-foreground mb-4">
        <code>useState&lt;string&gt;</code> — any string accepted. Validation at
        runtime only.
      </p>
      <div className="flex items-center gap-4">
        <ColorPicker value={color} onChange={setColor} />
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
          {color}
        </code>
      </div>
      <pre className="mt-4 text-xs font-mono bg-muted p-3 rounded overflow-x-auto">
        {`const [color, setColor] = useState<string>("#3b82f6")
<ColorPicker value={color} onChange={setColor} />`}
      </pre>
    </div>
  )
}
