"use client"

import { useState } from "react"
import { QueryBuilder } from "@/components/ui/query-builder"

export function BasicUsage() {
  const [value, setValue] = useState<string>(
    "screen and (min-width: 600px) and (max-width: 900px)",
  )
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> basic-usage
      </div>
      <h3 className="font-semibold text-xl tracking-tight">
        Build a media query
      </h3>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        Controlled <code className="font-mono text-foreground">value</code> +{" "}
        <code className="font-mono text-foreground">onChange</code>. Pick a
        media type, add parenthesized feature tests (
        <code className="font-mono text-foreground">min-width</code>,{" "}
        <code className="font-mono text-foreground">orientation</code>,{" "}
        <code className="font-mono text-foreground">hover</code>, …), and the
        editor emits the <code className="font-mono">@media</code> condition
        string. A single <code className="font-mono">and</code>/
        <code className="font-mono">or</code> joiner keeps the condition valid
        by construction.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <QueryBuilder value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          @media {value}
        </code>
      </div>
    </div>
  )
}
