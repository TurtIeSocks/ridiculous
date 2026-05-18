import { useState } from "react"
import { GradientEditor } from "@/components/ui/gradient-editor"
import { CopyButton } from "../color-picker/copy-button"

export function Interpolation() {
  const [srgb, setSrgb] = useState<string>(
    "linear-gradient(in srgb, 90deg, #ff0000, #0000ff)",
  )
  const [oklch, setOklch] = useState<string>(
    "linear-gradient(in oklch, 90deg, #ff0000, #0000ff)",
  )
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> interpolation
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Interpolation Space</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Same red → blue stops, different interpolation spaces. <code className="text-foreground">in srgb</code> goes through a muddy gray midpoint; <code className="text-foreground">in oklch</code> stays perceptually vivid through the transition. This is the brand bias.
      </p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
            <span className="text-gradient">→</span> in srgb
          </div>
          <div className="h-20 rounded-lg border" style={{ background: srgb }} />
          <div className="mt-3 flex items-center gap-2">
            <GradientEditor value={srgb} type="linear" onChange={setSrgb} />
            <code className="text-xs font-mono bg-black/40 border border-white/10 px-2.5 py-1 rounded-md truncate min-w-0 flex-1">
              {srgb}
            </code>
            <CopyButton value={srgb} />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
            <span className="text-gradient">→</span> in oklch
          </div>
          <div className="h-20 rounded-lg border" style={{ background: oklch }} />
          <div className="mt-3 flex items-center gap-2">
            <GradientEditor value={oklch} type="linear" onChange={setOklch} />
            <code className="text-xs font-mono bg-black/40 border border-white/10 px-2.5 py-1 rounded-md truncate min-w-0 flex-1">
              {oklch}
            </code>
            <CopyButton value={oklch} />
          </div>
        </div>
      </div>
    </div>
  )
}
