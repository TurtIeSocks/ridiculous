import { useState } from "react"
import { ColorPicker } from "@/components/ui/color-picker"
import { CopyButton } from "./copy-button"

export function Native() {
  const [color, setColor] = useState("#ff0000")
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> native
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Native Variant</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Falls back to the browser&apos;s{" "}
        <code className="text-foreground">
          &lt;input type=&quot;color&quot;&gt;
        </code>
        . sRGB-only, no alpha — wide-gamut and transparent values lose
        information on edit.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <ColorPicker native value={color} onChange={setColor} />
        <code className="flex-1 truncate text-sm font-mono bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg">
          {color}
        </code>
        <CopyButton value={color} />
      </div>
    </div>
  )
}
