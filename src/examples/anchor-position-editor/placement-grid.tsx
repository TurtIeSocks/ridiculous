"use client"

import { useState } from "react"
import {
  AnchorPositionEditorPanel,
  type AnchorPositionMode,
} from "@/components/ui/anchor-position-editor"

export function PlacementGrid() {
  const [mode, setMode] = useState<AnchorPositionMode>("position-area")
  const [areaValue, setAreaValue] = useState<string>("top center")
  const [anchorValue, setAnchorValue] = useState<string>("anchor(--btn bottom)")
  const [tryValue, setTryValue] = useState<string>("flip-block, flip-inline")

  const value =
    mode === "position-area"
      ? areaValue
      : mode === "anchor"
        ? anchorValue
        : tryValue
  const setValue =
    mode === "position-area"
      ? setAreaValue
      : mode === "anchor"
        ? setAnchorValue
        : setTryValue
  const property =
    mode === "position-area"
      ? "position-area"
      : mode === "anchor"
        ? "top"
        : "position-try-fallbacks"

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> placement-grid
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-xl tracking-tight">
          The 3×3 placement grid, snapped live
        </h3>
        <fieldset className="m-0 inline-flex overflow-hidden rounded-lg border border-white/10 p-0 font-mono text-xs">
          <legend className="sr-only">anchor mode</legend>
          {(["position-area", "anchor", "position-try"] as const).map((m) => (
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
        The hero of <code className="font-mono text-foreground">mode</code>{" "}
        <code className="font-mono text-foreground">"position-area"</code>: a
        clickable 3×3 grid around a mock anchor. Click a cell to emit its{" "}
        <code className="font-mono text-foreground">position-area</code> keyword
        pair. A <strong>logical / physical</strong> toggle swaps the vocabulary
        (<code className="font-mono">top left</code> ⇄{" "}
        <code className="font-mono">block-start inline-start</code>) — never
        mixing the two systems, so the cross-axis rule holds by construction. A{" "}
        <strong>span</strong> toggle switches the chosen axis keyword to its{" "}
        <code className="font-mono">span-</code> reach form, and the live
        preview snaps a positioned box to the chosen cell. Switch the mode to
        build an <code className="font-mono">anchor()</code> expression or a
        reorderable <code className="font-mono">position-try</code> chain.
      </p>
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-start">
        <AnchorPositionEditorPanel
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
            property (or, for <code className="font-mono">anchor()</code>, any
            inset property). The preview is gated on{" "}
            <code className="font-mono">
              CSS.supports("position-area: center")
            </code>{" "}
            and degrades to a static diagram where anchor positioning is
            unavailable.
          </p>
        </div>
      </div>
    </div>
  )
}
