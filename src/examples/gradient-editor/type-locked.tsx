"use client"

import { useState } from "react"
import {
  GradientEditor,
  type GradientStringMap,
  type GradientType,
} from "@/components/ui/gradient-editor"
import { CopyButton } from "@/examples/_shared/copy-button"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

const TYPES: readonly GradientType[] = ["linear", "radial", "conic"] as const

function TypeCard<T extends GradientType>({ type }: { type: T }) {
  const initial: Record<GradientType, string> = {
    linear: "linear-gradient(45deg, #ff0000, #0000ff)",
    radial: "radial-gradient(circle at 50% 50%, #ff0000, #0000ff)",
    conic: "conic-gradient(from 0deg at 50% 50%, #ff0000, #0000ff)",
  }
  const [grad, setGrad] = useState<GradientStringMap[T]>(
    initial[type] as GradientStringMap[T],
  )
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">→</span> {type}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <GradientEditor<T>
          value={grad}
          type={type}
          onChange={(next) => setGrad(next as GradientStringMap[T])}
        />
        <ValueReadout value={grad} />
        <CopyButton value={grad} label="Copy color" />
      </div>
    </div>
  )
}

export function TypeLocked() {
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="type-locked"
      title="Type-Locked"
      description={
        <>
          Setting <code className="text-foreground">type</code> hides the
          switcher and locks <code className="text-foreground">onChange</code>{" "}
          to that gradient flavor.
        </>
      }
    >
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TYPES.map((t) => (
          <TypeCard key={t} type={t} />
        ))}
      </div>
    </ExampleCard>
  )
}
