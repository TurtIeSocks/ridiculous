import { useState } from "react"
import { ColorPicker } from "@/components/ui/color-picker"

export function BasicUsage() {
  const [color, setColor] = useState<string>("oklch(0.628 0.258 29.234)")
  return (
    <div className="rounded-lg border p-6">
      <h3 className="font-semibold mb-4">Basic Usage</h3>
      <div className="flex items-center gap-4">
        <ColorPicker value={color} onChange={setColor} />
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
          {color}
        </code>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Mode unset → switcher visible → onChange emits whichever mode the user
        last selected.
      </p>
    </div>
  )
}
