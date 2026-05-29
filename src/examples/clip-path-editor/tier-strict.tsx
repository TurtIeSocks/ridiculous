"use client"

import { useState } from "react"
import {
  ClipPathEditor,
  type ClipPathString,
  cssClipPath,
} from "@/components/ui/clip-path-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

// Compile-time basic-shape dispatch. These calls are validated by tsc:
const valid = cssClipPath("polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)")
// @ts-expect-error inset wants a length-percentage, not an angle
const _badInset = cssClipPath("inset(45deg)")
// @ts-expect-error a circle radius cannot be two values
const _badCircle = cssClipPath("circle(50% 60%)")
// @ts-expect-error a polygon vertex needs exactly two coordinates
const _badPoly = cssClipPath("polygon(0% 0%, 100% 0%, 50%)")
// @ts-expect-error at most one geometry box
const _badBox = cssClipPath("border-box circle() padding-box")
void _badInset
void _badCircle
void _badPoly
void _badBox

export function TierStrict() {
  const [value, setValue] = useState<ClipPathString>(valid)
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={<>ClipPathLiteral&lt;S&gt;</>}
      title="Per-shape grammar at compile time"
      description={
        <>
          <code className="text-foreground">cssClipPath()</code> dispatches on
          the shape function and resolves a wrong dimension, arg count, vertex
          shape, or a double geometry box to{" "}
          <code className="text-foreground">never</code> — a type error before
          you run the code.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <ClipPathEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "fn", text: "cssClipPath" },
          { kind: "plain", text: "(" },
          {
            kind: "str",
            text: '"polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"',
          },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓" },
          { kind: "plain", text: "\n" },
          {
            kind: "com",
            text: "// @ts-expect-error circle radius cannot be two values",
          },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssClipPath" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"circle(50% 60%)"' },
          { kind: "plain", text: ")" },
          { kind: "plain", text: "\n" },
          {
            kind: "com",
            text: "// @ts-expect-error a vertex needs two coordinates",
          },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssClipPath" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"polygon(0% 0%, 100% 0%, 50%)"' },
          { kind: "plain", text: ")" },
        ]}
      />
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: <code className="font-mono">calc()</code> /{" "}
        <code className="font-mono">var()</code> coordinates, the{" "}
        <code className="font-mono">inset()</code> round radius tail, and
        3/4-token edge-offset positions are undecidable / out-of-scope at the
        strict tier — use the casual or IntelliSense tier; the runtime parser
        accepts them. Polygon vertices past 32 are weak-validated.
      </p>
    </ExampleCard>
  )
}
