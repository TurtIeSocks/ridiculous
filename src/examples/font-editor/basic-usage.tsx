"use client"

import { useState } from "react"
import { FontEditor } from "@/components/ui/font-editor"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [value, setValue] = useState<string>(
    "italic 600 18px/1.4 'Inter', sans-serif",
  )
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="basic-usage"
      title="Build a font shorthand"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. Set the
          optional prefix (style/variant/weight/stretch), the mandatory size and
          family, and the optional line-height — the editor emits a valid,
          canonically-ordered{" "}
          <code className="font-mono text-foreground">font</code> string.
        </>
      }
    >
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <FontEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
    </ExampleCard>
  )
}
