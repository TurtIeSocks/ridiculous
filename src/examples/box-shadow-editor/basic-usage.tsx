"use client"

import { useState } from "react"
import { BoxShadowEditor } from "@/components/ui/box-shadow-editor"

export function BasicUsage() {
  const [value, setValue] = useState<string>(
    "0px 1px 2px rgb(0 0 0 / 0.2), 0px 4px 8px rgb(0 0 0 / 0.15)",
  )
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> basic-usage
      </div>
      <h3 className="font-semibold text-xl tracking-tight">
        Stack shadow layers
      </h3>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        Controlled <code className="font-mono text-foreground">value</code> +{" "}
        <code className="font-mono text-foreground">onChange</code>. Add layers,
        toggle <code className="font-mono text-foreground">inset</code>, edit
        each offset / blur / spread with the right units, pick a per-layer
        color, and the editor emits a valid comma-separated{" "}
        <code className="font-mono text-foreground">box-shadow</code> string.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <BoxShadowEditor value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
    </div>
  )
}
