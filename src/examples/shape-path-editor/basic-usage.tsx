"use client"

import { useState } from "react"
import { ShapePathEditor } from "@/components/ui/shape-path-editor"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [value, setValue] = useState<string>(
    "shape(from 0px 0px, line to 100px 0px, curve to 100px 100px with 60px 20px, close)",
  )
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="basic-usage"
      title="Edit a shape() path"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. The
          popover opens a draggable SVG canvas plus a per-command row editor:
          add / remove / reorder <code className="font-mono">move</code> ·{" "}
          <code className="font-mono">line</code> ·{" "}
          <code className="font-mono">curve</code> ·{" "}
          <code className="font-mono">arc</code> commands, and the editor emits
          a canonical <code className="font-mono text-foreground">shape()</code>{" "}
          string. Coordinates are{" "}
          <code className="font-mono">&lt;length-percentage&gt;</code> with
          units (<code className="font-mono">0px</code> /{" "}
          <code className="font-mono">0%</code>) — never a bare{" "}
          <code className="font-mono">0</code>.
        </>
      }
    >
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ShapePathEditor value={value} onChange={setValue} />
        <ValueReadout value={`clip-path: ${value}`} />
      </div>
    </ExampleCard>
  )
}
