"use client"

import * as React from "react"
import { CoordinateInput } from "@/components/ui/coordinate-input"
import type { Position } from "@/components/ui/coordinate-input"
import { ExampleCard } from "@/examples/_shared/example-card"

export function LivePreview() {
  const [pos, setPos] = React.useState<Position>([-122.42, 37.77, 16])
  return (
    <ExampleCard
      eyebrow="live-preview"
      title="Scrub all three axes"
      description="Drag the lon / lat / alt labels to scrub. Shift = ×10, Alt = ×0.1."
      className="md:p-8"
    >
      <div className="mt-6 flex flex-col gap-3">
        <CoordinateInput
          value={pos}
          axes="3d"
          onChange={setPos}
          aria-label="Drag a label to scrub"
        />
        <code className="text-xs text-muted-foreground">
          {JSON.stringify(pos)}
        </code>
      </div>
    </ExampleCard>
  )
}
