"use client"

import { useState } from "react"
import {
  type ShapePathEditorMode,
  ShapePathEditorPanel,
} from "@/components/ui/shape-path-editor"

export function PathCanvas() {
  const [mode, setMode] = useState<ShapePathEditorMode>("clip-path")
  const [value, setValue] = useState<string>(
    "shape(from 20px 100px, curve to 180px 100px with 60px 0px / 120px 200px, smooth to 100px 40px, close)",
  )

  const property = mode === "clip-path" ? "clip-path" : "offset-path"

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> path-canvas
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-xl tracking-tight">
          Drag the Bézier handles, snapped live
        </h3>
        <fieldset className="m-0 inline-flex overflow-hidden rounded-lg border border-white/10 p-0 font-mono text-xs">
          <legend className="sr-only">preview mode</legend>
          {(["clip-path", "offset-path"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={
                mode === m
                  ? "bg-foreground px-3 py-1 text-background"
                  : "px-3 py-1 text-muted-foreground hover:text-foreground"
              }
            >
              {m}
            </button>
          ))}
        </fieldset>
      </div>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        The hero: a draggable SVG canvas editing a{" "}
        <code className="font-mono text-foreground">curve</code> with its{" "}
        <strong>Bézier control handles</strong> (each tethered to its endpoint
        by a connector line) and a{" "}
        <code className="font-mono text-foreground">smooth</code> segment. Drag
        a node or a handle — or focus one and arrow-nudge it — and the editor
        re-serializes through <code className="font-mono">updatePoint</code> and
        emits a canonical <code className="font-mono">shape()</code> string. The{" "}
        <strong>{property}</strong> toggle re-targets the live preview: clip a
        box, or animate a dot along the path. Coordinates stay{" "}
        <code className="font-mono">&lt;length-percentage&gt;</code> with units.
      </p>
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-start">
        <ShapePathEditorPanel
          mode={mode}
          value={value}
          onChange={setValue}
          className="w-full"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="font-mono text-[10px] text-muted-foreground uppercase">
            produced value
          </div>
          <code className="block overflow-x-auto rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-xs">
            {property}: {value || " "}
          </code>
          <p className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-muted-foreground/80 text-xs leading-relaxed">
            The value lands on the{" "}
            <code className="font-mono text-foreground">{property}</code>{" "}
            property. The preview is gated on{" "}
            <code className="font-mono">
              CSS.supports("clip-path: shape(…)")
            </code>{" "}
            and degrades to a raw SVG path render with a support note where{" "}
            <code className="font-mono">shape()</code> is unavailable (Chrome
            137 / Safari 18.4).
          </p>
        </div>
      </div>
    </div>
  )
}
