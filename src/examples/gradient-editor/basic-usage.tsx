import { useState } from "react"
import { GradientEditor } from "@/components/ui/gradient-editor"
import { CopyButton } from "../color-picker/copy-button"

export function BasicUsage() {
  const [grad, setGrad] = useState<string>(
    "linear-gradient(45deg, oklch(0.628 0.258 29.234), oklch(0.622 0.214 259.815))",
  )
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> auto-type
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Basic Usage</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Type unset → switcher visible → onChange emits whichever type the user
        last selected.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <GradientEditor value={grad} onChange={setGrad} />
        <code className="flex-1 truncate text-sm font-mono bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg">
          {grad}
        </code>
        <CopyButton value={grad} />
      </div>
    </div>
  )
}
