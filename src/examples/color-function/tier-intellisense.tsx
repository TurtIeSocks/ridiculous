"use client"

import { useState } from "react"
import {
  ColorFunction,
  type ColorFunctionString,
} from "@/components/ui/color-function"

export function TierIntellisense() {
  const [value, setValue] = useState<ColorFunctionString>(
    "light-dark(#ffffff, #1a1a1a)",
  )
  return (
    <div className="glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          <span className="text-gradient">02</span> intellisense
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          ColorFunctionString
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-lg tracking-tight">
        Suggestion-shaped hints
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        State typed as{" "}
        <code className="text-foreground">ColorFunctionString</code> — the union
        of the three family shapes. It is also the{" "}
        <code className="text-foreground">onChange</code> return type, and it
        narrows to one family via the{" "}
        <code className="text-foreground">mode</code> prop. Precise validation
        lives in the strict tier.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <ColorFunction value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
        <span className="text-violet-glow">const</span> [value, setValue] ={" "}
        <span className="text-cyan-glow">useState</span>
        {"<"}
        <span className="text-pink-glow">ColorFunctionString</span>
        {">"}(
        <span className="text-emerald-400">
          &quot;light-dark(#ffffff, #1a1a1a)&quot;
        </span>
        )
      </pre>
    </div>
  )
}
