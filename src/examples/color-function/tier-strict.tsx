"use client"

import { useState } from "react"
import {
  ColorFunction,
  type ColorFunctionString,
  cssColorFn,
} from "@/components/ui/color-function"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

// Compile-time per-family validation. These calls are validated by tsc:
const valid = cssColorFn("color-mix(in oklch shorter hue, #ff0000, #0000ff)")
// @ts-expect-error hue method on a rectangular (non-cylindrical) space
const _badHue = cssColorFn("color-mix(in srgb shorter hue, #f00, #00f)")
// @ts-expect-error rgb channel keywords in an oklch relative color
const _badChannels = cssColorFn("oklch(from #f00 r g b)")
// @ts-expect-error a bare color is not in scope (color-picker's domain)
const _bareColor = cssColorFn("rgb(255 0 0)")
// @ts-expect-error unknown interpolation colorspace
const _badSpace = cssColorFn("color-mix(in bogus, #f00, #00f)")
void _badHue
void _badChannels
void _bareColor
void _badSpace

export function TierStrict() {
  const [value, setValue] = useState<ColorFunctionString>(valid)
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={<>ColorFunctionLiteral&lt;S&gt;</>}
      title="Per-family grammar at compile time"
      description={
        <>
          <code className="text-foreground">cssColorFn()</code> dispatches on
          the function name and resolves a bad colorspace, a hue method on a
          rectangular space, or wrong relative-color channel keywords to{" "}
          <code className="text-foreground">never</code> — a type error before
          you run the code.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <ColorFunction value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "fn", text: "cssColorFn" },
          { kind: "plain", text: "(" },
          {
            kind: "str",
            text: '"color-mix(in oklch shorter hue, #f00, #00f)"',
          },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓" },
          { kind: "plain", text: "\n" },
          {
            kind: "com",
            text: "// @ts-expect-error hue method on a rectangular space",
          },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssColorFn" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"color-mix(in srgb shorter hue, …)"' },
          { kind: "plain", text: ")\n" },
          {
            kind: "com",
            text: "// @ts-expect-error rgb channels in an oklch relative color",
          },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssColorFn" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"oklch(from #f00 r g b)"' },
          { kind: "plain", text: ")" },
        ]}
      />
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: <code className="font-mono">calc()</code> channel bodies and
        channel magnitudes are weak-validated — any balanced{" "}
        <code className="font-mono">calc(…)</code> passes. The runtime parser is
        equally tolerant.
      </p>
    </ExampleCard>
  )
}
