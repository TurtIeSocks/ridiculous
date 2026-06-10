import type { Position } from "@/components/ui/coordinate-input"
import { ExampleCard } from "@/examples/_shared/example-card"

// IntelliSense tier: the Position tuple gives arity + autocomplete.
const sanFrancisco: Position = [-122.42, 37.77]
const everestSummit: Position = [86.925, 27.988, 8849]

export function TierIntellisense() {
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="Position"
      title="Typed constants and storage"
      description={
        <>
          Annotate stored positions as{" "}
          <code className="text-foreground">Position</code> for arity hints and
          tuple autocomplete. A 3-tuple forces the elevation axis.
        </>
      }
    >
      <pre className="mt-5 text-xs text-muted-foreground">
        {JSON.stringify({ sanFrancisco, everestSummit }, null, 2)}
      </pre>
    </ExampleCard>
  )
}
