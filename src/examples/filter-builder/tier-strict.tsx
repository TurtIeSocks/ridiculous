"use client"

import { useState } from "react"
import {
  cssFilter,
  FilterBuilder,
  type FilterString,
} from "@/components/ui/filter-builder"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

// Compile-time function-list dispatch. These calls are validated by tsc:
const valid = cssFilter(
  "blur(4px) brightness(1.2) drop-shadow(2px 2px 4px #000)",
)
// @ts-expect-error blur wants a length, not an angle
const _badBlur = cssFilter("blur(45deg)")
// @ts-expect-error hue-rotate wants an angle, not a length
const _badHue = cssFilter("hue-rotate(10px)")
// @ts-expect-error drop-shadow trailing color is invalid
const _badColor = cssFilter("drop-shadow(2px 2px 4px wrong)")
// @ts-expect-error url body must be non-empty
const _badUrl = cssFilter("url()")
void _badBlur
void _badHue
void _badColor
void _badUrl

export function TierStrict() {
  const [value, setValue] = useState<FilterString>(valid)
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={<>FilterLiteral&lt;S&gt;</>}
      title="Per-function dimension typing at compile time"
      description={
        <>
          <code className="text-foreground">cssFilter()</code> dispatches on
          each function name and resolves a wrong dimension, arg count, or bad
          drop-shadow color to <code className="text-foreground">never</code> —
          a type error before you run the code.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <FilterBuilder value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "fn", text: "cssFilter" },
          { kind: "plain", text: "(" },
          { kind: "str", text: '"blur(4px) drop-shadow(2px 2px 4px #000)"' },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓" },
          { kind: "plain", text: "\n" },
          { kind: "com", text: "// @ts-expect-error blur wants a length" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssFilter" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"blur(45deg)"' },
          { kind: "plain", text: ")\n" },
          { kind: "com", text: "// @ts-expect-error bad drop-shadow color" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssFilter" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"drop-shadow(2px 2px 4px wrong)"' },
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
