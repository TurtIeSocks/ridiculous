"use client"

import { useState } from "react"
import {
  CalcEditor,
  type CalcString,
  cssCalc,
} from "@/components/ui/calc-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

// Compile-time dimensional analysis. These calls are validated by tsc:
const valid = cssCalc("calc(10px + 2rem)") // ✓ length + length
// @ts-expect-error length + angle is dimensionally invalid
const _badSum = cssCalc("calc(10px + 45deg)")
// @ts-expect-error length × length is invalid (need a number operand)
const _badProduct = cssCalc("calc(10px * 2px)")
// @ts-expect-error cannot divide by a length
const _badDivide = cssCalc("calc(10px / 2px)")
// @ts-expect-error clamp() requires exactly 3 arguments
const _badArity = cssCalc("clamp(1rem, 2vw)")
void _badSum
void _badProduct
void _badDivide
void _badArity

export function TierStrict() {
  const [value, setValue] = useState<CalcString>(valid)
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={<>CalcLiteral&lt;S&gt;</>}
      title="Dimensional algebra at compile time"
      description={
        <>
          <code className="text-foreground">cssCalc()</code> resolves invalid
          math to <code className="text-foreground">never</code>. Mismatched
          units type- error before you ever run the code.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <CalcEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "fn", text: "cssCalc" },
          { kind: "plain", text: "(" },
          { kind: "str", text: '"calc(10px + 2rem)"' },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓ length" },
          { kind: "plain", text: "\n" },
          { kind: "com", text: "// @ts-expect-error length + angle" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssCalc" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"calc(10px + 45deg)"' },
          { kind: "plain", text: ")\n" },
          { kind: "com", text: "// @ts-expect-error length × length" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssCalc" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"calc(10px * 2px)"' },
          { kind: "plain", text: ")" },
        ]}
      />
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: <code className="font-mono">var()</code> is undecidable at compile
        time — use the casual or IntelliSense tier for expressions containing
        it.
      </p>
    </ExampleCard>
  )
}
