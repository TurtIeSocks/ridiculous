"use client"

import { useState } from "react"
import {
  KeyframesEditor,
  type KeyframesString,
} from "@/components/ui/keyframes-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function TierIntellisense() {
  const [value, setValue] = useState<KeyframesString>(
    "0% { color: #f00 } 100% { color: #00f }",
  )
  return (
    <ExampleCard
      tierIndex={2}
      tierLabel="intellisense"
      typeBadge="KeyframesString"
      title="Keyframes-body-shaped hints"
      description={
        <>
          State typed as{" "}
          <code className="text-foreground">KeyframesString</code> — a
          keyframes-body-shaped string (and the{" "}
          <code className="text-foreground">onChange</code> return type). The
          permissive suggestion type that pairs with the strict-tier gate;{" "}
          <code className="text-foreground">StopsOf&lt;S&gt;</code> counts the
          blocks at the type level.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <KeyframesEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "kw", text: "const" },
          { kind: "plain", text: " [value, setValue] = " },
          { kind: "fn", text: "useState" },
          { kind: "plain", text: "<" },
          { kind: "type", text: "KeyframesString" },
          { kind: "plain", text: ">(" },
          { kind: "str", text: '"0% { color: #f00 } 100% { color: #00f }"' },
          { kind: "plain", text: ")" },
        ]}
      />
    </ExampleCard>
  )
}
