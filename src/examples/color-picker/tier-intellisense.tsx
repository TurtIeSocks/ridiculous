import { useState } from "react"
import { ColorPicker, type ColorString } from "@/components/ui/color-picker"
import { CopyButton } from "./copy-button"

export function TierIntellisense() {
  const [color, setColor] = useState<ColorString>("oklch(0.7 0.18 240)")
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col">
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
          <span className="text-gradient">02</span> intellisense
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/60">
          ColorString
        </span>
      </div>
      <h3 className="mt-3 text-lg font-semibold tracking-tight">
        Literal hints in the editor
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        State typed as <code className="text-foreground">ColorString</code>. IDE
        autocompletes literal shapes; range checks still deferred to runtime.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <ColorPicker value={color} onChange={setColor} />
        <code className="text-xs font-mono bg-black/40 border border-white/10 px-2.5 py-1 rounded-md truncate min-w-0 flex-1">
          {color}
        </code>
        <CopyButton value={color} />
      </div>
      <pre className="mt-6 text-[11px] leading-relaxed font-mono bg-black/40 border border-white/10 p-4 rounded-lg overflow-x-auto">
        <span className="text-violet-glow">const</span>{" "}
        <span>[color, setColor]</span> ={" "}
        <span className="text-cyan-glow">useState</span>
        {"<"}
        <span className="text-pink-glow">ColorString</span>
        {">"}(
        <span className="text-emerald-400">
          &quot;oklch(0.7 0.18 240)&quot;
        </span>
        ){"\n"}
        <span className="text-muted-foreground/70">
          {/* hover the literal — IDE suggests oklch / oklab / hex / rgb / hsl /
          hwb */}
        </span>
      </pre>
    </div>
  )
}
