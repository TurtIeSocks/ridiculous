"use client"

import * as React from "react"
import type { Position } from "@/components/ui/coordinate-input"
import { CoordinateInput } from "@/components/ui/coordinate-input"
import { ExampleCard } from "@/examples/_shared/example-card"

export function BasicUsage() {
  const [pos, setPos] = React.useState<Position>([-122.42, 37.77])
  return (
    <ExampleCard
      eyebrow="basic-usage"
      title="Controlled lon/lat input"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. Each axis
          is a numeric input with blur/Enter commit. Drag the axis label to
          scrub.
        </>
      }
      className="md:p-8"
    >
      <div className="mt-6 flex flex-col gap-3">
        <CoordinateInput value={pos} onChange={setPos} aria-label="Location" />
        <code className="text-muted-foreground text-xs">
          {JSON.stringify(pos)}
        </code>
      </div>
    </ExampleCard>
  )
}
