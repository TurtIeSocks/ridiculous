"use client"

import { useState } from "react"
import {
  GridBuilder,
  type GridTemplateString,
} from "@/components/ui/grid-builder"

export function TierIntellisense() {
  const [value, setValue] = useState<GridTemplateString>("repeat(4, 1fr)")
  return (
    <div className="glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          <span className="text-gradient">02</span> intellisense
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          GridTemplateString
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-lg tracking-tight">
        Literal-shaped hints
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        State typed as{" "}
        <code className="text-foreground">GridTemplateString</code> — the union
        of track-list shapes (<code className="text-foreground">repeat(…)</code>
        , <code className="text-foreground">minmax(…)</code>, sizes, named
        lines) and quoted areas rows. It is also the{" "}
        <code className="text-foreground">onChange</code> return type.
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
        <span className="text-pink-glow">GridTemplateString</span>
        {">"}(
        <span className="text-emerald-400">&quot;repeat(4, 1fr)&quot;</span>)
      </pre>
    </div>
  )
}
