"use client"

import * as React from "react"
import { GeojsonEditor } from "@/components/ui/geojson-editor"
import type { GeoJSON, GeojsonEditorVariant } from "@/components/ui/geojson-editor"
import { ExampleCard } from "@/examples/_shared/example-card"

const seed: GeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-122.43, 37.76],
            [-122.4, 37.76],
            [-122.4, 37.78],
            [-122.43, 37.76],
          ],
        ],
      },
      properties: { name: "Dolores Park" },
    },
  ],
}

const VARIANTS: GeojsonEditorVariant[] = ["drill-down", "dual-pane", "toggle"]

export function LivePreview() {
  const [value, setValue] = React.useState<GeoJSON>(seed)
  const [variant, setVariant] = React.useState<GeojsonEditorVariant>("drill-down")
  return (
    <ExampleCard
      eyebrow="live-preview"
      title="Switch presets"
      description="Pick a layout preset. The map seam (useGeojsonEditorContext inside a custom MapView) mounts alongside any preset via GeojsonEditorProvider."
      className="md:p-8"
    >
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex gap-2 text-xs">
          {VARIANTS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVariant(v)}
              className="rounded-md border border-input px-2 py-1 capitalize"
            >
              {v}
            </button>
          ))}
        </div>
        <GeojsonEditor value={value} onChange={setValue} variant={variant} />
      </div>
    </ExampleCard>
  )
}
