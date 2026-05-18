import { useState } from "react"
import {
  UnitInput,
  deg,
  type DegString,
} from "@/components/ui/unit-input"

export function StrictTyping() {
  // DegString = `${number}deg`. The deg() helper validates a literal
  // at compile time — uncomment the line below to see the type error.
  // const bad = deg("45px")
  const [angle, setAngle] = useState<DegString>(deg("90deg"))
  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
        <span className="text-gradient">/</span> tier-strict
      </div>
      <h3 className="text-xl font-semibold tracking-tight">Strict Typing</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-prose">
        <code className="font-mono">unit="deg"</code> narrows the value/onChange
        types to <code className="font-mono">DegString</code>. The{" "}
        <code className="font-mono">deg()</code> call-site helper rejects
        wrong-suffix literals at compile time.
      </p>
      <div className="mt-6 flex items-center gap-6">
        <UnitInput
          unit="deg"
          value={angle}
          onChange={setAngle}
          min={0}
          max={360}
          aria-label="Angle"
        />
        <code className="text-sm font-mono bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg">
          {angle}
        </code>
      </div>
    </div>
  )
}
