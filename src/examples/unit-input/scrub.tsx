import { useState } from "react"
import { UnitInput } from "@/components/ui/unit-input"
import { ExampleCard } from "@/examples/_shared/example-card"

export function Scrub() {
  const [size, setSize] = useState<string>("16px")
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="drag-to-scrub"
      title="Pointer-lock Scrub"
      description={
        <>
          Hover the <code className="font-mono">px</code> suffix → cursor turns
          into ↔ → drag horizontally. The cursor disappears (pointer-lock) and
          the value tracks your delta. Shift = coarse (×10), Alt = fine (÷10).
        </>
      }
    >
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
        <code className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-sm">
          {size}
        </code>
      </div>
    </ExampleCard>
  )
}
