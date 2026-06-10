import { coordinate } from "@/components/ui/coordinate-input"
import { ExampleCard } from "@/examples/_shared/example-card"

// Strict tier: numeric-literal validation at the call site.
const valid = coordinate([-122.42, 37.77])

export function TierStrict() {
  // @ts-expect-error — longitude 200 is out of range
  const invalid = coordinate([200, 0])
  void invalid
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge="coordinate()"
      title="Compile-time range validation"
      description={
        <>
          <code className="text-foreground">coordinate([lon, lat])</code>{" "}
          stringifies each numeric literal and range-checks it (lon ±180, lat
          ±90). Out-of-range literals resolve to{" "}
          <code className="text-foreground">never</code> — a type error at the
          call site. Authoring helper only; runtime values use the component +
          parseCoordinate.
        </>
      }
    >
      <pre className="mt-5 text-xs text-muted-foreground">
        {JSON.stringify(valid)}
      </pre>
    </ExampleCard>
  )
}
