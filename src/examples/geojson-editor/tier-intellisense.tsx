import type { Feature, Polygon } from "@/components/ui/geojson-editor"
import { ExampleCard } from "@/examples/_shared/example-card"

// IntelliSense tier: discriminated union narrows coordinates by the `type` tag.
const park: Feature<Polygon, { name: string }> = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0],
      ],
    ],
  },
  properties: { name: "Park" },
}

export function TierIntellisense() {
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="Feature<Polygon, P>"
      title="Typed constants and storage"
      description={
        <>
          Annotate stored values as{" "}
          <code className="text-foreground">Feature&lt;Polygon, P&gt;</code> (or
          any narrowed geometry) for shape hints and autocomplete.{" "}
          <code className="text-foreground">GeoJSON&lt;G, P&gt;</code> is
          generic over both.
        </>
      }
    >
      <pre className="mt-5 text-muted-foreground text-xs">
        {JSON.stringify(park, null, 2)}
      </pre>
    </ExampleCard>
  )
}
