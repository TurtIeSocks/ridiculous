"use client"

import { useState } from "react"
import {
  cssGridAreas,
  cssTracks,
  GridBuilder,
  type GridTemplateString,
} from "@/components/ui/grid-builder"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

// Compile-time grid-template validation. These calls are checked by tsc:
const validTracks = cssTracks("repeat(3, minmax(100px, 1fr)) [end]")
const validAreas = cssGridAreas('"head head" "nav main" "nav foot"')

// @ts-expect-error an fr is not a valid minmax min (must be inflexible)
const _badMin = cssTracks("minmax(1fr, 2fr)")
// @ts-expect-error repeat count must be a positive int | auto-fill | auto-fit
const _badCount = cssTracks("repeat(0, 1fr)")
// @ts-expect-error calc() is undecidable at the strict tier
const _badCalc = cssTracks("calc(1px + 2px)")
// @ts-expect-error grid-template-areas rows must share a column count
const _badCols = cssGridAreas('"a a" "b"')
void _badMin
void _badCount
void _badCalc
void _badCols

export function TierStrict() {
  const [value, setValue] = useState<GridTemplateString>(validTracks)
  void validAreas
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={<>TrackListLiteral&lt;S&gt; · GridAreasLiteral&lt;S&gt;</>}
      title="Two validators at compile time"
      description={
        <>
          <code className="text-foreground">cssTracks()</code> validates the
          whole track-list grammar —{" "}
          <code className="text-foreground">minmax</code>'s min must be
          inflexible, <code className="text-foreground">repeat</code>'s count
          must be a positive int or{" "}
          <code className="text-foreground">auto-fill</code>/
          <code className="text-foreground">auto-fit</code>, named lines must be
          valid idents. <code className="text-foreground">cssGridAreas()</code>{" "}
          checks quoting + equal column counts. A violation resolves to{" "}
          <code className="text-foreground">never</code>.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <GridBuilder value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "fn", text: "cssTracks" },
          { kind: "plain", text: "(" },
          { kind: "str", text: '"repeat(3, minmax(100px, 1fr))"' },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓" },
          { kind: "plain", text: "\n" },
          {
            kind: "com",
            text: "// @ts-expect-error fr is not an inflexible minmax min",
          },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssTracks" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"minmax(1fr, 2fr)"' },
          { kind: "plain", text: ")" },
          { kind: "plain", text: "\n" },
          { kind: "com", text: "// @ts-expect-error unequal column counts" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssGridAreas" },
          { kind: "plain", text: "(" },
          { kind: "err", text: `"'a a' 'b'"` },
          { kind: "plain", text: ")" },
        ]}
      />
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: the contiguous-<strong>rectangle</strong> rule for areas (each
        name spans one filled rectangle) is checked at <strong>runtime</strong>{" "}
        by <code className="font-mono">parseAreas</code> /{" "}
        <code className="font-mono">validateAreasRectangles</code> — it is
        borderline-undecidable as a template-literal type, so the strict tier
        validates shape (quoting + equal columns + cell idents). Likewise{" "}
        <code className="font-mono">calc()</code> /{" "}
        <code className="font-mono">var()</code> are undecidable at strict — use
        the casual / IntelliSense tier for those.
      </p>
    </ExampleCard>
  )
}
