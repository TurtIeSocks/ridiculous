"use client"

import { useState } from "react"
import { GridBuilderPanel, GridPreview } from "@/components/ui/grid-builder"
import { ExampleCard } from "@/examples/_shared/example-card"

export function LivePreviewExample() {
  const [columns, setColumns] = useState<string>("repeat(3, minmax(80px, 1fr))")
  const [areas, setAreas] = useState<string>(
    '"head head head" "nav main aside" "foot foot foot"',
  )

  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="live-preview"
      title="See the template on a real grid"
      description={
        <>
          Every edit re-renders a real{" "}
          <code className="font-mono text-foreground">display: grid</code> node
          via inline styles. The areas painter is a grid of clickable cells —
          click to cycle a cell through the area-name palette; the preview
          places each named area by its bounding rectangle.
        </>
      }
    >
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="font-mono text-muted-foreground text-xs">
            track list · grid-template-columns
          </div>
          <GridBuilderPanel
            value={columns}
            onChange={setColumns}
            mode="columns"
            className="w-full"
          />
        </div>
        <div className="space-y-3">
          <div className="font-mono text-muted-foreground text-xs">
            areas painter · grid-template-areas
          </div>
          <GridBuilderPanel
            value={areas}
            onChange={setAreas}
            mode="areas"
            className="w-full"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <GridPreview
          mode="columns"
          columns={columns}
          rows="none"
          areas="none"
        />
        <GridPreview mode="areas" columns="none" rows="none" areas={areas} />
      </div>
    </ExampleCard>
  )
}
