"use client"

import { useState } from "react"
import { TransitionEditorPanel } from "@/components/ui/transition-editor"
import { ExampleCard } from "@/examples/_shared/example-card"

export function LivePreviewExample() {
  const [transition, setTransition] = useState<string>(
    "transform 400ms 0ms ease-in-out",
  )
  const [animation, setAnimation] = useState<string>(
    "pulse 1.2s ease-in-out infinite alternate",
  )
  return (
    <ExampleCard
      eyebrow="live-preview"
      title="Watch it actually move"
      description={
        <>
          Each panel carries a real preview element with the built value
          applied. The <strong>play</strong> button fires the transition; the{" "}
          <strong>replay</strong> button restarts the animation. Pick each
          layer&apos;s easing with the embedded{" "}
          <code className="font-mono text-foreground">EasingPicker</code>, scrub
          the duration with the{" "}
          <code className="font-mono text-foreground">ms</code> control, and
          every change writes back the typed string. Animation mode ships demo{" "}
          <code className="font-mono text-foreground">@keyframes</code> (
          <code className="font-mono text-foreground">slide</code> /{" "}
          <code className="font-mono text-foreground">pulse</code> /{" "}
          <code className="font-mono text-foreground">spin</code>).
        </>
      }
      className="md:p-8"
    >
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="font-mono text-[10px] text-muted-foreground uppercase">
            transition
          </div>
          <TransitionEditorPanel
            value={transition}
            onChange={setTransition}
            className="w-full"
          />
          <code className="block overflow-x-auto rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-xs">
            {transition}
          </code>
        </div>
        <div className="space-y-3">
          <div className="font-mono text-[10px] text-muted-foreground uppercase">
            animation
          </div>
          <TransitionEditorPanel
            mode="animation"
            value={animation}
            onChange={setAnimation}
            className="w-full"
          />
          <code className="block overflow-x-auto rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-xs">
            {animation}
          </code>
        </div>
      </div>
    </ExampleCard>
  )
}
