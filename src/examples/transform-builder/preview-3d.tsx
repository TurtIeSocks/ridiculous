"use client"

import { useState } from "react"
import {
  TransformBuilderPanel,
  TransformPreview3D,
} from "@/components/ui/transform-builder"

export function Preview3DExample() {
  const [value, setValue] = useState<string>(
    "perspective(600px) rotateY(35deg) rotateX(-10deg) translateZ(20px)",
  )
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> 3d-preview
      </div>
      <h3 className="font-semibold text-xl tracking-tight">
        Drive a card in 3D
      </h3>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        The scrubbers compose{" "}
        <code className="font-mono text-foreground">translate</code>/{" "}
        <code className="font-mono text-foreground">rotate</code>/
        <code className="font-mono text-foreground">scale</code>/
        <code className="font-mono text-foreground">skew</code> functions into
        the typed string and write it back — the card&apos;s{" "}
        <code className="font-mono text-foreground">transform</code> is exactly
        the value you see.
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TransformPreview3D value={value} onChange={setValue} />
        <div className="space-y-3">
          <TransformBuilderPanel
            value={value}
            onChange={setValue}
            className="w-full"
          />
        </div>
      </div>
      <code className="mt-4 block overflow-x-auto rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-xs">
        {value}
      </code>
    </div>
  )
}
