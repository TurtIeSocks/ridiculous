import { useState } from "react"
import { ColorPicker } from "@/components/ui/color-picker"

export function BasicUsage() {
  const [color, setColor] = useState<string>("oklch(0.628 0.258 29.234)")
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> auto-mode
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Basic Usage</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Mode unset → switcher visible → onChange emits whichever mode the user
        last selected.
      </p>
      <div className="mt-6 flex items-center gap-4">
        <ColorPicker value={color} onChange={setColor} />
        <code className="text-sm font-mono bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg">
          {color}
        </code>
      </div>
    </div>
  )
}
