"use client"

import { useState } from "react"
import { CalcEditor, type CalcString } from "@/components/ui/calc-editor"

export function TierIntellisense() {
  const [value, setValue] = useState<CalcString>("min(50%, 30rem)")
  return (
    <div className="glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          <span className="text-gradient">02</span> intellisense
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          CalcString
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-lg tracking-tight">
        Literal-shaped hints
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        State typed as <code className="text-foreground">CalcString</code> — the{" "}
        <code className="text-foreground">
          calc() / clamp() / min() / max()
        </code>{" "}
        union. Also the <code className="text-foreground">onChange</code>{" "}
        return.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <CalcEditor value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
        <span className="text-violet-glow">const</span> [value, setValue] ={" "}
        <span className="text-cyan-glow">useState</span>
        {"<"}
        <span className="text-pink-glow">CalcString</span>
        {">"}(
        <span className="text-emerald-400">&quot;min(50%, 30rem)&quot;</span>)
      </pre>
    </div>
  )
}
