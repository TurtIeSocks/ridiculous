"use client"

import { useState } from "react"
import {
  BoxShadowEditorPanel,
  BoxShadowPreview,
} from "@/components/ui/box-shadow-editor"
import { ExampleCard } from "@/examples/_shared/example-card"

export function LivePreviewExample() {
  const [value, setValue] = useState<string>(
    "0px 1px 2px rgb(0 0 0 / 0.2), 0px 6px 12px rgb(0 0 0 / 0.18)",
  )
  return (
    <ExampleCard
      eyebrow="live-preview"
      title="Drag the light, stack the shadow"
      description={
        <>
          The preview card carries the whole shadow stack. Drag the glowing{" "}
          <strong>light source</strong> and every layer&apos;s{" "}
          <code className="font-mono text-foreground">offset-x</code> /{" "}
          <code className="font-mono text-foreground">offset-y</code> re-casts
          away from it; the{" "}
          <code className="font-mono text-foreground">elevation</code> scrubber
          scales the blur. Add and remove layers and pick each layer&apos;s
          color in the panel — every change writes back the typed string.
        </>
      }
      className="md:p-8"
    >
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <BoxShadowPreview value={value} onChange={setValue} />
        <div className="space-y-3">
          <BoxShadowEditorPanel
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
