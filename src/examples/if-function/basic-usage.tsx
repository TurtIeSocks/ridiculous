"use client"

import { useState } from "react"
import { IfFunction } from "@/components/ui/if-function"

export function BasicUsage() {
  const [value, setValue] = useState<string>(
    "if(media(width >= 800px): 2rem; else: 1rem)",
  )
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> basic-usage
      </div>
      <h3 className="font-semibold text-xl tracking-tight">
        Branch by condition
      </h3>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        Controlled <code className="font-mono text-foreground">value</code> +{" "}
        <code className="font-mono text-foreground">onChange</code>. The CSS{" "}
        <code className="font-mono text-foreground">if()</code> function picks a
        value from a list of guarded branches — each branch is a{" "}
        <code className="font-mono text-foreground">condition : value</code>{" "}
        separated by semicolons, where the condition is{" "}
        <code className="font-mono text-foreground">media()</code>,{" "}
        <code className="font-mono text-foreground">supports()</code>,{" "}
        <code className="font-mono text-foreground">style()</code>, or a
        trailing <code className="font-mono text-foreground">else</code>. Add
        branches and the editor emits a valid{" "}
        <code className="font-mono">if()</code> string.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <IfFunction value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
    </div>
  )
}
