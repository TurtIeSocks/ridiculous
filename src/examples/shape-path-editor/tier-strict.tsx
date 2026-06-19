"use client"

import { useState } from "react"
import {
  cssShape,
  ShapePathEditor,
  type ShapeString,
} from "@/components/ui/shape-path-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

// Compile-time shape() validation. These calls are checked by tsc:
const validShape = cssShape(
  "shape(from 0px 0px, curve to 100px 100px with 50px 0px, close)",
)
cssShape("shape(evenodd from 0% 0%, hline by 50%, vline by 50%, close)")
cssShape("shape(from 10px 10px, arc to 100px 0px of 50px, close)")
// @ts-expect-error unknown command name
const _badCmd = cssShape("shape(from 0px 0px, wiggle to 10px 10px)")
// @ts-expect-error line needs a coordinate PAIR, not one value
const _badArity = cssShape("shape(from 0px 0px, line to 100px, close)")
// @ts-expect-error curve needs a `with` control point
const _missingWith = cssShape("shape(from 0px 0px, curve to 10px 10px, close)")
// @ts-expect-error not a shape() function
const _notShape = cssShape("rotate(90deg)")
void _badCmd
void _badArity
void _missingWith
void _notShape

export function TierStrict() {
  const [value, setValue] = useState<ShapeString>(validShape)
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={<>ShapeLiteral&lt;S&gt;</>}
      title="The shape() grammar typed at compile time"
      description={
        <>
          <code className="text-foreground">cssShape()</code> peels the{" "}
          <code className="font-mono">shape()</code> wrapper, validates the
          optional fill-rule and the{" "}
          <code className="font-mono">from &lt;coordinate-pair&gt;</code> seed,
          then dispatches every comma-separated command on its name —{" "}
          <strong>per-command arity</strong>, the{" "}
          <code className="font-mono">by</code>/
          <code className="font-mono">to</code> direction, the{" "}
          <code className="font-mono">with</code>/
          <code className="font-mono">of</code> slot keywords, and each
          coordinate&apos;s dimension — resolving any violation to{" "}
          <code className="text-foreground">never</code> before you run the
          code.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <ShapePathEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "fn", text: "cssShape" },
          { kind: "plain", text: "(" },
          {
            kind: "str",
            text: '"shape(from 0px 0px, curve to 100px 100px with 50px 0px, close)"',
          },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓" },
          { kind: "plain", text: "\n" },
          { kind: "com", text: "// @ts-expect-error unknown command" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssShape" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"shape(from 0px 0px, wiggle to 10px 10px)"' },
          { kind: "plain", text: ")\n" },
          {
            kind: "com",
            text: "// @ts-expect-error line needs a coordinate PAIR",
          },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssShape" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"shape(from 0px 0px, line to 100px, close)"' },
          { kind: "plain", text: ")\n" },
          {
            kind: "com",
            text: "// @ts-expect-error curve needs a `with` control",
          },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssShape" },
          { kind: "plain", text: "(" },
          {
            kind: "err",
            text: '"shape(from 0px 0px, curve to 10px 10px, close)"',
          },
          { kind: "plain", text: ")" },
        ]}
      />
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: coordinates are{" "}
        <code className="font-mono">&lt;length-percentage&gt;</code> with units
        — a bare <code className="font-mono">0</code> is rejected (use{" "}
        <code className="font-mono">0px</code> /{" "}
        <code className="font-mono">0%</code>). The{" "}
        <code className="font-mono">hline</code>/
        <code className="font-mono">vline</code> keyword positions, the
        order-free <code className="font-mono">arc</code> flags (
        <code className="font-mono">cw</code>/
        <code className="font-mono">large</code>/
        <code className="font-mono">rotate</code>), and{" "}
        <code className="font-mono">calc()</code>/
        <code className="font-mono">var()</code> coordinates are deferred to the
        lenient runtime parser.
      </p>
    </ExampleCard>
  )
}
