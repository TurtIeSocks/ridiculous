"use client"

import { useState } from "react"
import { IfFunctionPanel } from "@/components/ui/if-function"
import { ExampleCard } from "@/examples/_shared/example-card"

export function BranchBuilder() {
  const [value, setValue] = useState<string>(
    "if(media(width >= 800px): 2rem; supports(width: 1cqi): 1.5rem; else: 1rem)",
  )
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="branch-builder"
      title="Build the branch list"
      description={
        <>
          Each row is one branch: a condition-kind{" "}
          <code className="font-mono text-foreground">select</code> (
          <code className="font-mono text-foreground">media</code> /{" "}
          <code className="font-mono text-foreground">supports</code> /{" "}
          <code className="font-mono text-foreground">style</code>), a
          condition-body input, and the value. Add or remove branches; the final
          row may switch to a trailing{" "}
          <code className="font-mono text-foreground">else</code>. The produced{" "}
          <code className="font-mono text-foreground">if()</code> string updates
          live.
        </>
      }
    >
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-start">
        <IfFunctionPanel value={value} onChange={setValue} className="w-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="font-mono text-[10px] text-muted-foreground uppercase">
            produced value
          </div>
          <code className="block overflow-x-auto rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-xs">
            {value}
          </code>
          <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-amber-200/80 text-xs leading-relaxed">
            <strong>Heads up:</strong> the CSS{" "}
            <code className="font-mono">if()</code> function is cutting-edge —
            it shipped in 2025 and browser support is still rolling out.
            Non-supporting browsers ignore the declaration and fall back.
          </p>
        </div>
      </div>
    </ExampleCard>
  )
}
