import { useState } from "react"
import { type DegString, deg, UnitInput } from "@/components/ui/unit-input"
import { ExampleCard } from "@/examples/_shared/example-card"

export function StrictTyping() {
  // DegString = `${number}deg`. The deg() helper validates a literal
  // at compile time — uncomment the line below to see the type error.
  // const bad = deg("45px")
  const [angle, setAngle] = useState<DegString>(deg("90deg"))
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="tier-strict"
      title="Strict Typing"
      description={
        <>
          <code className="font-mono">unit="deg"</code> narrows the
          value/onChange types to <code className="font-mono">DegString</code>.
          The <code className="font-mono">deg()</code> call-site helper rejects
          wrong-suffix literals at compile time.
        </>
      }
    >
      <div className="mt-6 flex items-center gap-6">
        <UnitInput
          unit="deg"
          value={angle}
          onChange={setAngle}
          min={0}
          max={360}
          aria-label="Angle"
          className="w-24"
        />
        <code className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-sm">
          {angle}
        </code>
      </div>
    </ExampleCard>
  )
}
