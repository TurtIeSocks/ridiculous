"use client"

import { useState } from "react"
import {
  TransformBuilderPanel,
  TransformPreview3D,
} from "@/components/ui/transform-builder"
import { ExampleCard } from "@/examples/_shared/example-card"

export function Preview3DExample() {
  const [value, setValue] = useState<string>(
    "perspective(600px) rotateY(35deg) rotateX(-10deg) translateZ(20px)",
  )
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="3d-preview"
      title="Drive a card in 3D"
      description={
        <>
          The scrubbers compose{" "}
          <code className="font-mono text-foreground">translate</code>/{" "}
          <code className="font-mono text-foreground">rotate</code>/
          <code className="font-mono text-foreground">scale</code>/
          <code className="font-mono text-foreground">skew</code> functions into
          the typed string and write it back — the card&apos;s{" "}
          <code className="font-mono text-foreground">transform</code> is
          exactly the value you see.
        </>
      }
    >
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
    </ExampleCard>
  )
}
