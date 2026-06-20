"use client"

import { useState } from "react"
import { BackgroundEditor } from "@/components/ui/background-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierCasual() {
  const [value, setValue] = useState<string>(
    "url(photo.jpg) left top / 50% repeat-x, #fff",
  )
  return (
    <ExampleCard
      tierIndex={1}
      tierLabel="casual"
      typeBadge="string"
      title="Pass any string"
      description={
        <>
          <code className="text-foreground">useState&lt;string&gt;</code>. No
          compile-time validation; the runtime parser splits the value
          paren-aware into layers and slots every space-token by kind — image,
          position, the <code className="font-mono">/ size</code> follower,
          repeat / attachment / origin / clip — exactly as the strict tier
          would, but lenient about token order and exotic forms.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <BackgroundEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "kw", text: "const" },
          { kind: "plain", text: " [value, setValue] = " },
          { kind: "fn", text: "useState" },
          { kind: "plain", text: "<" },
          { kind: "type", text: "string" },
          { kind: "plain", text: ">(" },
          {
            kind: "str",
            text: '"url(photo.jpg) left top / 50% repeat-x, #fff"',
          },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
