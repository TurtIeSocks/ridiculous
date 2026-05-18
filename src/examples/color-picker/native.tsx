import { useState } from "react"
import { ColorPicker } from "@/components/ui/color-picker"

export function Native() {
  const [color, setColor] = useState("#ff0000")
  return (
    <div className="rounded-lg border p-6">
      <h3 className="font-semibold mb-4">Native Variant</h3>
      <div className="flex items-center gap-4">
        <ColorPicker native value={color} onChange={setColor} />
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
          {color}
        </code>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Falls back to the browser&apos;s <code>&lt;input type=&quot;color&quot;&gt;</code>.
        sRGB-only, no alpha — wide-gamut and transparent values lose information
        on edit.
      </p>
    </div>
  )
}
