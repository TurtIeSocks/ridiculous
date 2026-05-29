"use client"

import { useState } from "react"
import {
  FilterBuilderPanel,
  FilterPreview,
} from "@/components/ui/filter-builder"
import { ExampleCard } from "@/examples/_shared/example-card"

export function LivePreviewExample() {
  const [value, setValue] = useState<string>(
    "saturate(1.4) contrast(1.1) drop-shadow(6px 6px 10px rgb(0 0 0 / 0.4))",
  )
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="live-preview"
      title="See the stack on a real surface"
      description={
        <>
          The scrubbers compose{" "}
          <code className="font-mono text-foreground">blur</code>/
          <code className="font-mono text-foreground">brightness</code>/
          <code className="font-mono text-foreground">contrast</code>/
          <code className="font-mono text-foreground">saturate</code>/
          <code className="font-mono text-foreground">hue-rotate</code> into the
          typed string and write it back. Flip the toggle to apply the same
          value as{" "}
          <code className="font-mono text-foreground">backdrop-filter</code> on
          a translucent panel over a busy background.
        </>
      }
    >
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FilterPreview value={value} onChange={setValue} />
        <div className="space-y-3">
          <FilterBuilderPanel
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
