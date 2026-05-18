import { useState } from "react"
import { UnitInput } from "@/components/ui/unit-input"

export function Scrub() {
  const [size, setSize] = useState<string>("16px")
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> drag-to-scrub
      </div>
      <h3 className="text-xl font-semibold tracking-tight">
        Pointer-lock Scrub
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Hover the <code className="font-mono">px</code> suffix → cursor turns
        into ↔ → drag horizontally. The cursor disappears (pointer-lock) and the
        value tracks your delta. Shift = coarse (×10), Alt = fine (÷10).
      </p>
      <div className="mt-6 flex items-center gap-6">
        <UnitInput
          unit="px"
          value={size}
          onChange={setSize}
          step={1}
          dragSensitivity={1}
          aria-label="Size"
          className="w-20"
        />
        <div
          aria-hidden="true"
          className="rounded bg-linear-to-br from-violet-glow to-pink-glow"
          style={{ width: size, height: size }}
        />
        <code className="text-sm font-mono bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg">
          {size}
        </code>
      </div>
    </div>
  )
}
