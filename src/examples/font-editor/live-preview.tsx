"use client"

import { useState } from "react"
import { FontEditorPanel, FontPreview } from "@/components/ui/font-editor"

export function LivePreviewExample() {
  const [value, setValue] = useState<string>(
    "italic small-caps 500 18px/1.6 Georgia, serif",
  )
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> live-preview
      </div>
      <h3 className="font-semibold text-xl tracking-tight">
        See the shorthand on real text
      </h3>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        Every control — style, variant, weight, stretch, size, line-height, and
        the family list (web-safe + generic) — composes the typed{" "}
        <code className="font-mono text-foreground">font</code> string. The
        preview below renders sample text with exactly that shorthand applied.
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <FontEditorPanel
            value={value}
            onChange={setValue}
            className="w-full"
          />
        </div>
        <div className="space-y-3">
          <FontPreview value={value} />
          <FontPreview
            value={value}
            editable={false}
            sampleText="Pack my box with five dozen liquor jugs — 0123456789"
          />
        </div>
      </div>
      <code className="mt-4 block overflow-x-auto rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-xs">
        {`font: ${value};`}
      </code>
    </div>
  )
}
