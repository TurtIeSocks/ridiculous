import { useState } from "react"
import { UnitInput } from "@/components/ui/unit-input"

export function BasicUsage() {
  const [angle, setAngle] = useState<string>("45deg")
  const [pct, setPct] = useState<string>("50%")
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> tier-casual
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Basic Usage</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        Two UnitInputs, two units. Type a number; commit on blur or Enter. Arrow
        keys step ±1, Shift+Arrow ±10. Hover the suffix to scrub.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span aria-hidden="true">angle:</span>
          <UnitInput
            unit="deg"
            value={angle}
            onChange={setAngle}
            min={0}
            max={360}
            aria-label="Angle"
            className="w-24"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span aria-hidden="true">opacity:</span>
          <UnitInput
            unit="%"
            value={pct}
            onChange={setPct}
            min={0}
            max={100}
            aria-label="Opacity"
            className="w-20"
          />
        </div>
        <code className="text-sm font-mono bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg">
          {angle}, {pct}
        </code>
      </div>
    </div>
  )
}
