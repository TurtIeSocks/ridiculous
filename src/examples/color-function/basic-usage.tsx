"use client"

import { useState } from "react"
import { ColorFunction } from "@/components/ui/color-function"

export function BasicUsage() {
  const [value, setValue] = useState<string>(
    "color-mix(in oklch, oklch(0.7 0.2 30) 60%, oklch(0.6 0.2 250))",
  )
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> basic-usage
      </div>
      <h3 className="font-semibold text-xl tracking-tight">
        Build a modern color function
      </h3>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        Controlled <code className="font-mono text-foreground">value</code> +{" "}
        <code className="font-mono text-foreground">onChange</code>. Pick the
        interpolation colorspace, the two colors and their mix ratio — the
        editor emits a valid{" "}
        <code className="font-mono text-foreground">color-mix()</code> string,
        and the trigger swatch shows the resolved color.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ColorFunction value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
    </div>
  )
}
