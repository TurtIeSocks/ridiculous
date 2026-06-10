"use client"

import * as React from "react"
import type { Position } from "@/components/ui/coordinate-input"
import { CoordinateInput } from "@/components/ui/coordinate-input"
import { ExampleCard } from "@/examples/_shared/example-card"

// Casual tier: plain Position tuples, no compile-time range checks.
export function TierCasual() {
  const [pos, setPos] = React.useState<Position>([0, 0])
  return (
    <ExampleCard
      tierIndex={1}
      tierLabel="casual"
      typeBadge="Position"
      title="Pass any Position tuple"
      description={
        <>
          <code className="text-foreground">useState&lt;Position&gt;</code>. The
          value is <code className="text-foreground">[number, number]</code> or{" "}
          <code className="text-foreground">[number, number, number]</code>. No
          compile-time range validation — axes clamp at commit.
        </>
      }
    >
      <div className="mt-5">
        <CoordinateInput value={pos} onChange={setPos} aria-label="Casual" />
      </div>
    </ExampleCard>
  )
}
