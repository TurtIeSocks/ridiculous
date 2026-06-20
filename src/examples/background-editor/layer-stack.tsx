"use client"

import { useState } from "react"
import { BackgroundEditorPanel } from "@/components/ui/background-editor"

export function LayerStack() {
  const [value, setValue] = useState<string>(
    "linear-gradient(135deg, rgb(59 130 246 / 0.7), rgb(139 92 246 / 0.7)) center / cover no-repeat, radial-gradient(circle at 30% 30%, #fbbf24, transparent 60%) left top / 60% 60% no-repeat, #0f172a",
  )

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> layer-stack
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-xl tracking-tight">
          The layer stack, composited live
        </h3>
      </div>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        The hero: a <strong>reorderable stack of layers</strong> painted
        back-to-front. Each card embeds a real{" "}
        <code className="font-mono text-foreground">GradientEditor</code> (or a{" "}
        <code className="font-mono">url()</code> input) for the image, a{" "}
        <strong>2D crosshair position pad</strong> with{" "}
        <code className="font-mono">x</code>/
        <code className="font-mono">y</code>{" "}
        <code className="font-mono">UnitInput</code>s, a{" "}
        <code className="font-mono">size</code> control, and repeat / attachment
        / origin / clip selects. Use the <strong>↑ / ↓</strong> buttons to
        reorder the paint order — and watch the{" "}
        <code className="font-mono text-foreground">&lt;color&gt;</code> always
        re-home onto whichever layer is <strong>last</strong> (the index-aware
        invariant, kept true under reorder). Only the final card exposes the{" "}
        <code className="font-mono">ColorPicker</code>. The live tile composites
        every layer in real time, exactly as the browser paints it.
      </p>
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-start">
        <BackgroundEditorPanel
          value={value}
          onChange={setValue}
          className="w-full"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="font-mono text-[10px] text-muted-foreground uppercase">
            produced value
          </div>
          <code className="block overflow-x-auto rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-xs">
            background: {value || " "}
          </code>
          <p className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-muted-foreground/80 text-xs leading-relaxed">
            The value lands on the{" "}
            <code className="font-mono text-foreground">background</code>{" "}
            property. Layers join with <code className="font-mono">,</code> and
            paint front-to-back (the first layer sits on top); the trailing{" "}
            <code className="font-mono text-foreground">&lt;color&gt;</code> is
            emitted only on the final layer. The checkerboard underlay makes
            transparency visible.
          </p>
        </div>
      </div>
    </div>
  )
}
