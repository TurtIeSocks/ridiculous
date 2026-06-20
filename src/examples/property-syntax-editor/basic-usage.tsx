"use client"

import { useState } from "react"
import { PropertySyntaxEditor } from "@/components/ui/property-syntax-editor"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function BasicUsage() {
  const [value, setValue] = useState<string>("<length>")
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="basic-usage"
      title="Edit a @property syntax descriptor"
      description={
        <>
          Controlled <code className="font-mono text-foreground">value</code> +{" "}
          <code className="font-mono text-foreground">onChange</code>. The
          controlled value is the{" "}
          <code className="font-mono text-foreground">syntax</code> STRING. Pick
          data-type chips (<code className="font-mono">&lt;length&gt;</code>,{" "}
          <code className="font-mono">&lt;color&gt;</code>, …), add literal
          idents, toggle a <code className="font-mono">+</code> /{" "}
          <code className="font-mono">#</code> multiplier, or flip the{" "}
          <code className="font-mono">*</code> universal switch — the editor
          emits the canonical descriptor (
          <code className="font-mono text-foreground">
            &lt;length&gt; | auto
          </code>
          ). The panel&apos;s initial-value field is a live demo of the
          dependency, not part of the controlled value.
        </>
      }
    >
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <PropertySyntaxEditor value={value} onChange={setValue} />
        <ValueReadout value={`syntax: "${value}"`} />
      </div>
    </ExampleCard>
  )
}
