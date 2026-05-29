"use client"

import { useState } from "react"
import {
  cssTransform,
  TransformBuilder,
  type TransformString,
} from "@/components/ui/transform-builder"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

// Compile-time function-name dispatch. These calls are validated by tsc:
const valid = cssTransform("translateX(10px) rotate(45deg) scale(1.5)")
// @ts-expect-error rotate wants an angle, not a length
const _badRotate = cssTransform("rotate(10px)")
// @ts-expect-error translateX wants a length-%, not an angle
const _badTranslate = cssTransform("translateX(45deg)")
// @ts-expect-error matrix needs exactly 6 numbers
const _badArity = cssTransform("matrix(1, 0, 0, 1, 0)")
// @ts-expect-error perspective is length-only
const _badPerspective = cssTransform("perspective(45deg)")
void _badRotate
void _badTranslate
void _badArity
void _badPerspective

export function TierStrict() {
  const [value, setValue] = useState<TransformString>(valid)
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={<>TransformLiteral&lt;S&gt;</>}
      title="Per-function unit typing at compile time"
      description={
        <>
          <code className="text-foreground">cssTransform()</code> dispatches on
          each function name and resolves a wrong unit or arg count to{" "}
          <code className="text-foreground">never</code> — a type error before
          you run the code.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <TransformBuilder value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "fn", text: "cssTransform" },
          { kind: "plain", text: "(" },
          { kind: "str", text: '"translateX(10px) rotate(45deg)"' },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓" },
          { kind: "plain", text: "\n" },
          { kind: "com", text: "// @ts-expect-error rotate wants an angle" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssTransform" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"rotate(10px)"' },
          { kind: "plain", text: ")" },
          { kind: "plain", text: "\n" },
          { kind: "com", text: "// @ts-expect-error matrix needs 6 numbers" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssTransform" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"matrix(1, 0, 0, 1, 0)"' },
          { kind: "plain", text: ")" },
        ]}
      />
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: <code className="font-mono">calc()</code> /{" "}
        <code className="font-mono">var()</code> inside an argument are
        undecidable at compile time — use the casual or IntelliSense tier for
        those.
      </p>
    </ExampleCard>
  )
}
