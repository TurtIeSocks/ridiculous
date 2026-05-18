import { useState } from "react"
import { ColorPicker } from "@/components/ui/color-picker"

export function TierCasual() {
  const [color, setColor] = useState<string>("#3b82f6")
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col">
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
          <span className="text-gradient">01</span> casual
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/60">
          string
        </span>
      </div>
      <h3 className="mt-3 text-lg font-semibold tracking-tight">
        Pass any string
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        <code className="text-foreground">useState&lt;string&gt;</code>. No
        compile-time validation; runtime parser handles whatever you throw.
      </p>
      <div className="mt-5 flex items-center gap-3">
        <ColorPicker value={color} onChange={setColor} />
        <code className="text-xs font-mono bg-black/40 border border-white/10 px-2.5 py-1 rounded-md truncate min-w-0 flex-1">
          {color}
        </code>
      </div>
      <pre className="mt-6 text-[11px] leading-relaxed font-mono bg-black/40 border border-white/10 p-4 rounded-lg overflow-x-auto">
        <span className="text-violet-glow">const</span>{" "}
        <span>[color, setColor]</span> ={" "}
        <span className="text-cyan-glow">useState</span>
        {"<"}
        <span className="text-pink-glow">string</span>
        {">"}(<span className="text-emerald-400">&quot;#3b82f6&quot;</span>)
        {"\n"}
        {"<"}
        <span className="text-cyan-glow">ColorPicker</span>{" "}
        <span className="text-violet-glow">value</span>={"{color}"}{" "}
        <span className="text-violet-glow">onChange</span>={"{setColor}"} {"/>"}
      </pre>
    </div>
  )
}
