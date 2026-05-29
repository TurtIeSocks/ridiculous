"use client"

import { useState } from "react"
import { GridBuilder } from "@/components/ui/grid-builder"

export function BasicUsage() {
  const [value, setValue] = useState<string>("repeat(3, 1fr)")
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> basic-usage
      </div>
      <h3 className="font-semibold text-xl tracking-tight">
        Build a grid template
      </h3>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        Controlled <code className="font-mono text-foreground">value</code> +{" "}
        <code className="font-mono text-foreground">onChange</code>. Switch
        between <code className="font-mono text-foreground">columns</code>,{" "}
        <code className="font-mono text-foreground">rows</code>, and{" "}
        <code className="font-mono text-foreground">areas</code>; add tracks or
        paint cells and the editor emits a valid template string.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <GridBuilder value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
    </div>
  )
}
