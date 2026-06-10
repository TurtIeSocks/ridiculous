"use client"

import * as React from "react"
import type { GeoJSON } from "@/components/ui/geojson-editor"
import { GeojsonEditor } from "@/components/ui/geojson-editor"
import { ExampleCard } from "@/examples/_shared/example-card"

const seed: GeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-122.42, 37.77] },
      properties: { name: "SF" },
    },
  ],
}

export function BasicUsage() {
  const [value, setValue] = React.useState<GeoJSON>(seed)
  return (
    <ExampleCard
      eyebrow="basic-usage"
      title="Controlled GeoJSON editor"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>.
          Drill-down preset: feature tree, geometry fields, properties grid, raw
          pane toggle, and error rail.
        </>
      }
    >
      <div className="mt-6">
        <GeojsonEditor value={value} onChange={setValue} />
      </div>
    </ExampleCard>
  )
}
