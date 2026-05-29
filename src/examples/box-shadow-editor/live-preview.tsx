"use client"

import { useState } from "react"
import {
  BoxShadowEditorPanel,
  BoxShadowPreview,
} from "@/components/ui/box-shadow-editor"

export function LivePreviewExample() {
  const [value, setValue] = useState<string>(
    "0px 1px 2px rgb(0 0 0 / 0.2), 0px 6px 12px rgb(0 0 0 / 0.18)",
  )
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> live-preview
      </div>
      <h3 className="font-semibold text-xl tracking-tight">
        Drag the light, stack the shadow
      </h3>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        The preview card carries the whole shadow stack. Drag the glowing{" "}
        <strong>light source</strong> and every layer&apos;s{" "}
        <code className="font-mono text-foreground">offset-x</code> /{" "}
        <code className="font-mono text-foreground">offset-y</code> re-casts
        away from it; the{" "}
        <code className="font-mono text-foreground">elevation</code> scrubber
        scales the blur. Add and remove layers and pick each layer&apos;s color
        in the panel — every change writes back the typed string.
      </p>
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
    </div>
  )
}
