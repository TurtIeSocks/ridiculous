import { useState } from "react"
import { GradientEditor } from "@/components/ui/gradient-editor"
import { CopyButton } from "../color-picker/copy-button"

export function StopsControl() {
  const [tight, setTight] = useState<string>(
    "linear-gradient(45deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)",
  )
  const [loose, setLoose] = useState<string>(
    "linear-gradient(45deg, #ff0000, #ff8800, #ffff00, #88ff00, #00ff00, #00ff88, #00ffff, #0088ff, #0000ff)",
  )
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> maxStops
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Stops Control</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        The <code className="text-foreground">maxStops</code> prop caps how many
        stops the editor will allow. Min 2 is always enforced.
      </p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
            <span className="text-gradient">→</span> maxStops=3
          </div>
          <div className="flex items-center gap-2">
            <GradientEditor value={tight} maxStops={3} onChange={setTight} />
            <code className="text-xs font-mono bg-black/40 border border-white/10 px-2.5 py-1 rounded-md truncate min-w-0 flex-1">
              {tight}
            </code>
            <CopyButton value={tight} />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
            <span className="text-gradient">→</span> maxStops=12
          </div>
          <div className="flex items-center gap-2">
            <GradientEditor value={loose} maxStops={12} onChange={setLoose} />
            <code className="text-xs font-mono bg-black/40 border border-white/10 px-2.5 py-1 rounded-md truncate min-w-0 flex-1">
              {loose}
            </code>
            <CopyButton value={loose} />
          </div>
        </div>
      </div>
    </div>
  )
}
