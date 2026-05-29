"use client"

import { useState } from "react"
import { FilterBuilder } from "@/components/ui/filter-builder"

export function BasicUsage() {
  const [value, setValue] = useState<string>(
    "blur(2px) brightness(1.1) saturate(1.3)",
  )
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> basic-usage
      </div>
      <h3 className="font-semibold text-xl tracking-tight">
        Build a filter list
      </h3>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        Controlled <code className="font-mono text-foreground">value</code> +{" "}
        <code className="font-mono text-foreground">onChange</code>. Add
        functions, edit each argument with the right units, and the editor emits
        a valid space-separated{" "}
        <code className="font-mono text-foreground">filter</code> string.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <FilterBuilder value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
    </div>
  )
}
