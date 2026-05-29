"use client"

import { useState } from "react"
import { TransitionEditor } from "@/components/ui/transition-editor"

export function BasicUsage() {
  const [transition, setTransition] = useState<string>(
    "opacity 200ms ease, transform 0.3s 100ms ease-out",
  )
  const [animation, setAnimation] = useState<string>("spin 1s linear infinite")
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> basic-usage
      </div>
      <h3 className="font-semibold text-xl tracking-tight">
        Two shorthands, one editor
      </h3>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        Controlled <code className="font-mono text-foreground">value</code> +{" "}
        <code className="font-mono text-foreground">onChange</code>. The{" "}
        <code className="font-mono text-foreground">mode</code> prop switches
        between the{" "}
        <code className="font-mono text-foreground">transition</code> and{" "}
        <code className="font-mono text-foreground">animation</code> shorthands.
        Add layers, edit each token with the right control, and the editor emits
        a valid comma-separated string.
      </p>
      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <TransitionEditor value={transition} onChange={setTransition} />
          <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
            {transition}
          </code>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TransitionEditor
            mode="animation"
            value={animation}
            onChange={setAnimation}
          />
          <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
            {animation}
          </code>
        </div>
      </div>
    </div>
  )
}
