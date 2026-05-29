"use client"

import { useState } from "react"
import { GridBuilder } from "@/components/ui/grid-builder"

export function TierCasual() {
  // Plain string state — no validation, "just JavaScript".
  const [value, setValue] = useState<string>("1fr 2fr 1fr")
  return (
    <div className="glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          <span className="text-gradient">01</span> casual
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          string
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-lg tracking-tight">
        Just use a string
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        The escape hatch. <code className="text-foreground">value</code> is a
        plain <code className="text-foreground">string</code> — no compile-time
        checking, drop in any template and go.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <GridBuilder value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
        <span className="text-violet-glow">const</span> [value, setValue] ={" "}
        <span className="text-cyan-glow">useState</span>
        {"<"}
        <span className="text-pink-glow">string</span>
        {">"}(<span className="text-emerald-400">&quot;1fr 2fr 1fr&quot;</span>)
      </pre>
    </div>
  )
}
