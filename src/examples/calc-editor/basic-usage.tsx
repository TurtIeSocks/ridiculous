"use client"

import { useState } from "react"
import { CalcEditor } from "@/components/ui/calc-editor"

export function BasicUsage() {
  const [value, setValue] = useState<string>("clamp(1rem, 0.5rem + 2vw, 3rem)")
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> basic-usage
      </div>
      <h3 className="font-semibold text-xl tracking-tight">
        Edit a calc value
      </h3>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        Controlled <code className="font-mono text-foreground">value</code> +{" "}
        <code className="font-mono text-foreground">onChange</code>. The popover
        editor parses, dimension-checks, and only emits a valid CSS math string.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <CalcEditor value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
    </div>
  )
}
