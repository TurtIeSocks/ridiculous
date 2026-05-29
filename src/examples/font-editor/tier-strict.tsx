"use client"

import { useState } from "react"
import {
  cssFont,
  FontEditor,
  type FontString,
} from "@/components/ui/font-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

// Compile-time ordered parse. These calls are validated by tsc:
const valid = cssFont("italic bold 16px/1.5 'Inter', sans-serif")
// @ts-expect-error missing the mandatory font-family
const _noFamily = cssFont("16px")
// @ts-expect-error two style tokens — duplicate prefix kind
const _dupStyle = cssFont("italic oblique 16px serif")
// @ts-expect-error no size precedes the family
const _noSize = cssFont("italic serif")
// @ts-expect-error var() is undecidable at the strict tier
const _varFont = cssFont("var(--font)")
void _noFamily
void _dupStyle
void _noSize
void _varFont

export function TierStrict() {
  const [value, setValue] = useState<FontString>(valid)
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={<>FontLiteral&lt;S&gt;</>}
      title="The ordered grammar at compile time"
      description={
        <>
          <code className="text-foreground">cssFont()</code> parses the prefix,
          size, optional line-height and family in order and resolves a missing
          size, missing family, or duplicate prefix kind to{" "}
          <code className="text-foreground">never</code> — a type error before
          you run the code.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <FontEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "fn", text: "cssFont" },
          { kind: "plain", text: "(" },
          { kind: "str", text: '"italic bold 16px/1.5 serif"' },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓" },
          { kind: "plain", text: "\n" },
          { kind: "com", text: "// @ts-expect-error no font-family" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssFont" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"16px"' },
          { kind: "plain", text: ")\n" },
          { kind: "com", text: "// @ts-expect-error two style tokens" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssFont" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"italic oblique 16px serif"' },
          { kind: "plain", text: ")" },
        ]}
      />
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: <code className="font-mono">var()</code> /{" "}
        <code className="font-mono">calc()</code> are undecidable at compile
        time — use the casual or IntelliSense tier for those.
      </p>
    </ExampleCard>
  )
}
