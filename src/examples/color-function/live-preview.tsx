"use client"

import { useState } from "react"
import {
  ColorFunctionPanel,
  ColorFunctionPreview,
} from "@/components/ui/color-function"

export function LivePreviewExample() {
  const [mix, setMix] = useState<string>(
    "color-mix(in oklch, oklch(0.75 0.18 35) 50%, oklch(0.6 0.2 255) 50%)",
  )
  const [relative, setRelative] = useState<string>(
    "oklch(from oklch(0.7 0.2 30) l c calc(h + 180))",
  )
  const [lightDark, setLightDark] = useState<string>(
    "light-dark(#fef3c7, #1e293b)",
  )

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
        <span className="text-gradient">/</span> live-preview
      </div>
      <h3 className="font-semibold text-xl tracking-tight">
        Each family, edited live with a result swatch
      </h3>
      <p className="mt-2 max-w-prose text-muted-foreground text-sm">
        Three modes, three panels. Every control composes the typed string; the
        swatch beneath each renders the produced value as a computed
        background-color. The{" "}
        <code className="font-mono text-foreground">light-dark()</code> swatch
        carries a scheme toggle so the browser resolves it both ways.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <PreviewColumn title="color-mix()" value={mix}>
          <ColorFunctionPanel
            mode="color-mix"
            value={mix}
            onChange={setMix}
            className="w-full"
          />
        </PreviewColumn>

        <PreviewColumn title="relative color" value={relative}>
          <ColorFunctionPanel
            mode="relative"
            value={relative}
            onChange={setRelative}
            className="w-full"
          />
        </PreviewColumn>

        <PreviewColumn title="light-dark()" value={lightDark}>
          <ColorFunctionPanel
            mode="light-dark"
            value={lightDark}
            onChange={setLightDark}
            className="w-full"
          />
        </PreviewColumn>
      </div>
    </div>
  )
}

interface PreviewColumnProps {
  title: string
  value: string
  children: React.ReactNode
}

function PreviewColumn({ title, value, children }: PreviewColumnProps) {
  return (
    <div className="space-y-3">
      <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.15em]">
        {title}
      </div>
      {children}
      <ColorFunctionPreview value={value} />
      <code className="block overflow-x-auto rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-[11px]">
        {value}
      </code>
    </div>
  )
}
