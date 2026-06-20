"use client"

import { useState } from "react"
import {
  PropertySyntaxEditor,
  type SyntaxString,
} from "@/components/ui/property-syntax-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [value, setValue] = useState<SyntaxString>("<length>+")
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="SyntaxString"
      title="Syntax-shaped hints"
      description={
        <>
          State typed as <code className="text-foreground">SyntaxString</code> —
          a descriptor-shaped union (
          <code className="font-mono">&lt;length&gt;</code>,{" "}
          <code className="font-mono">&lt;color&gt;#</code>,{" "}
          <code className="font-mono">*</code>, …) and the{" "}
          <code className="text-foreground">onChange</code> return type. Every{" "}
          <code className="text-foreground">DataTypeName</code> crossed with the
          three multipliers is suggested, while{" "}
          <code className="font-mono">(string &amp; {"{}"})</code> keeps
          free-form alternations editable.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <PropertySyntaxEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "kw", text: "const" },
          { kind: "plain", text: " [value, setValue] = " },
          { kind: "fn", text: "useState" },
          { kind: "plain", text: "<" },
          { kind: "type", text: "SyntaxString" },
          { kind: "plain", text: ">(" },
          { kind: "str", text: '"<length>+"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
