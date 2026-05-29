"use client"

import { useState } from "react"
import { TransitionEditor } from "@/components/ui/transition-editor"

export function TierCasual() {
  const [value, setValue] = useState<string>("opacity 200ms ease")
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
        Pass any string
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        <code className="text-foreground">useState&lt;string&gt;</code>. No
        compile-time validation; the runtime parser classifies whatever you type
        by token kind — including{" "}
        <code className="text-foreground">calc()</code> durations and tokens in
        any order.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <TransitionEditor value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
        <span className="text-violet-glow">const</span> [value, setValue] ={" "}
        <span className="text-cyan-glow">useState</span>
        {"<"}
        <span className="text-pink-glow">string</span>
        {">"}(
        <span className="text-emerald-400">&quot;opacity 200ms ease&quot;</span>
        )
      </pre>
    </div>
  )
}
