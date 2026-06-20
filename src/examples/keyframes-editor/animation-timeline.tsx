"use client"

import { useState } from "react"
import { KeyframesEditorPanel } from "@/components/ui/keyframes-editor"

export function AnimationTimeline() {
  const [value, setValue] = useState<string>(
    "from { transform: translateX(0px); opacity: 0 } 50% { transform: scale(1.2); opacity: 1 } to { transform: translateX(120px); opacity: 1 }",
  )

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> animation-timeline
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-xl tracking-tight">
          The timeline, scrubbed live
        </h3>
      </div>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        The hero: a <strong>0–100% timeline</strong> of keyframe stops (
        <code className="font-mono text-foreground">from</code> = 0%,{" "}
        <code className="font-mono text-foreground">to</code> = 100%,{" "}
        <code className="font-mono text-foreground">N%</code> between). Select a
        stop to reveal its declarations — and{" "}
        <strong>each declaration opens the real typed editor</strong> for its
        property: <code className="font-mono text-foreground">transform</code>{" "}
        embeds the <code className="font-mono">TransformBuilder</code>,{" "}
        <code className="font-mono text-foreground">filter</code> the{" "}
        <code className="font-mono">FilterBuilder</code>, color properties the{" "}
        <code className="font-mono">ColorPicker</code>,{" "}
        <code className="font-mono">background</code> the{" "}
        <code className="font-mono">GradientEditor</code>,{" "}
        <code className="font-mono">*-timing-function</code> the{" "}
        <code className="font-mono">EasingPicker</code>, and length /{" "}
        <code className="font-mono">opacity</code> a{" "}
        <code className="font-mono">UnitInput</code>. Drag the play head (or hit{" "}
        <strong>▶ play</strong>) and the preview box interpolates between the
        surrounding stops. This composition — six typed editors, one per
        declaration — is the affordance.
      </p>
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-start">
        <KeyframesEditorPanel
          value={value}
          onChange={setValue}
          className="w-full"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="font-mono text-[10px] text-muted-foreground uppercase">
            produced value
          </div>
          <code className="block overflow-x-auto rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-xs">
            @keyframes slide {"{ "}
            {value || " "}
            {" }"}
          </code>
          <p className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-muted-foreground/80 text-xs leading-relaxed">
            The editor emits the <strong>body</strong>; wrap it in your own{" "}
            <code className="font-mono text-foreground">@keyframes name</code>.
            The scrub preview is a <strong>lightweight JS interpolation</strong>{" "}
            between adjacent stops (numbers / lengths / opacity) — non-numeric
            values snap to the nearest stop. It is a scrub demo, not a full CSS
            animation engine (spec A6).
          </p>
        </div>
      </div>
    </div>
  )
}
