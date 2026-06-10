"use client"

import * as React from "react"
import type { GeoJSON } from "@/components/ui/geojson-editor"
import { GeojsonEditor } from "@/components/ui/geojson-editor"
import { ExampleCard } from "@/examples/_shared/example-card"

// Casual tier: plain GeoJSON object, no compile-time shape constraints.
export function TierCasual() {
  const [value, setValue] = React.useState<GeoJSON>({
    type: "Point",
    coordinates: [0, 0],
  })
  return (
    <ExampleCard
      tierIndex={1}
      tierLabel="casual"
      typeBadge="GeoJSON"
      title="Pass any GeoJSON object"
      description={
        <>
          <code className="text-foreground">useState&lt;GeoJSON&gt;</code>{" "}
          accepts any geometry, Feature, or FeatureCollection. No compile-time
          shape constraints — runtime validation flags lon/lat range, ring
          closure, and other RFC 7946 rules.
        </>
      }
    >
      <div className="mt-5">
        <GeojsonEditor value={value} onChange={setValue} variant="toggle" />
      </div>
    </ExampleCard>
  )
}
