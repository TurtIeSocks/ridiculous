import { useState } from "react"
import { UnitInput } from "@/components/ui/unit-input"
import { ExampleCard } from "@/examples/_shared/example-card"

export function BasicUsage() {
  const [angle, setAngle] = useState<string>("45deg")
  const [pct, setPct] = useState<string>("50%")
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="tier-casual"
      title="Basic Usage"
      description="Two UnitInputs, two units. Type a number; commit on blur or Enter. Arrow keys step ±1, Shift+Arrow ±10. Hover the suffix to scrub."
    >
      <div className="mt-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2 font-mono text-muted-foreground text-xs">
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
        <div className="flex items-center gap-2 font-mono text-muted-foreground text-xs">
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
        <code className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-sm">
          {angle}, {pct}
        </code>
      </div>
    </ExampleCard>
  )
}
