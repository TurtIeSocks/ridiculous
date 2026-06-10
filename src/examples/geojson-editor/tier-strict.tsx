import { geojson } from "@/components/ui/geojson-editor"
import { ExampleCard } from "@/examples/_shared/example-card"

// Strict tier: compact canonical GeoJSON geometry strings validated at compile time.
const valid = geojson('{"type":"Point","coordinates":[-122.42,37.77]}')

export function TierStrict() {
  // @ts-expect-error — longitude 200 is out of range (caught at compile time)
  const invalid = geojson('{"type":"Point","coordinates":[200,0]}')
  void invalid
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge="geojson()"
      title="Compile-time geometry validation"
      description={
        <>
          <code className="text-foreground">geojson("…")</code> type-parses
          compact canonical geometry strings: Position arity, lon ±180, lat ±90,
          ring closure. Out-of-range literals resolve to{" "}
          <code className="text-foreground">never</code> — a type error at the
          call site. Pass an object for the casual escape hatch.
        </>
      }
    >
      <pre className="mt-5 text-muted-foreground text-xs">{valid}</pre>
    </ExampleCard>
  )
}
