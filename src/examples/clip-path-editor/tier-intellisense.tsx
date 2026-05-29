"use client"

import { useState } from "react"
import {
  ClipPathEditor,
  type ClipPathString,
} from "@/components/ui/clip-path-editor"

export function TierIntellisense() {
  const [value, setValue] = useState<ClipPathString>("ellipse(40% 30%)")
  return (
    <div className="glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          <span className="text-gradient">02</span> intellisense
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          ClipPathString
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-lg tracking-tight">
        Literal-shaped hints
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        State typed as <code className="text-foreground">ClipPathString</code> —
        the union of every{" "}
        <code className="text-foreground">
          inset()/circle()/ellipse()/polygon()
        </code>{" "}
        head (with an optional geometry box) plus a bare box and{" "}
        <code className="text-foreground">none</code>. It is also the{" "}
        <code className="text-foreground">onChange</code> return type.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <ClipPathEditor value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
        <span className="text-violet-glow">const</span> [value, setValue] ={" "}
        <span className="text-cyan-glow">useState</span>
        {"<"}
        <span className="text-pink-glow">ClipPathString</span>
        {">"}(
        <span className="text-emerald-400">&quot;ellipse(40% 30%)&quot;</span>)
      </pre>
    </div>
  )
}
