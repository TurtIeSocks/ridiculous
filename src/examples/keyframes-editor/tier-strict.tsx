"use client"

import { useState } from "react"
import {
  cssKeyframes,
  KeyframesEditor,
  type KeyframesString,
} from "@/components/ui/keyframes-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

// Compile-time @keyframes-body validation. These calls are checked by tsc:
const validBody = cssKeyframes("from { opacity: 0 } to { opacity: 1 }")
cssKeyframes(
  "from { transform: translateX(0px) } to { transform: translateX(100px) }",
)
cssKeyframes("0% { color: #f00 } 100% { color: #00f }")
// @ts-expect-error a keyframe selector must be from | to | 0–100%
const _badSelector = cssKeyframes("150% { opacity: 1 }")
// @ts-expect-error opacity must be a number in 0–1
const _badOpacity = cssKeyframes("from { opacity: 2 }")
// @ts-expect-error a transform value must be a transform-function list
const _badTransform = cssKeyframes("from { transform: 5 }")
// @ts-expect-error a color value must be a color (hex / rgb / oklch / …)
const _badColor = cssKeyframes("from { color: notacolor }")
void _badSelector
void _badOpacity
void _badTransform
void _badColor

export function TierStrict() {
  const [value, setValue] = useState<KeyframesString>(validBody)
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={<>KeyframesLiteral&lt;S&gt;</>}
      title="Two-level grammar typed at compile time"
      description={
        <>
          <code className="text-foreground">cssKeyframes()</code> validates the
          block structure and selector range (
          <code className="font-mono">from</code> /{" "}
          <code className="font-mono">to</code> /{" "}
          <code className="font-mono">0–100%</code>), then dispatches each
          declaration&apos;s value on its property name into that
          property&apos;s own validator —{" "}
          <code className="font-mono text-foreground">transform</code> →{" "}
          <code className="font-mono">TransformLiteral</code>,{" "}
          <code className="font-mono text-foreground">filter</code> →{" "}
          <code className="font-mono">FilterLiteral</code>, color properties →{" "}
          <code className="font-mono">ColorLiteral</code>,{" "}
          <code className="font-mono">*-timing-function</code> →{" "}
          <code className="font-mono">EasingLiteral</code>,{" "}
          <code className="font-mono">opacity</code> → 0–1, length properties →{" "}
          <code className="font-mono">&lt;length-percentage&gt;</code> —
          resolving any violation to{" "}
          <code className="text-foreground">never</code> before you run the
          code.
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
          { kind: "fn", text: "cssKeyframes" },
          { kind: "plain", text: "(" },
          { kind: "str", text: '"0% { color: #f00 } 100% { color: #00f }"' },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓" },
          { kind: "plain", text: "\n" },
          { kind: "com", text: "// @ts-expect-error selector out of 0–100" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssKeyframes" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"150% { opacity: 1 }"' },
          { kind: "plain", text: ")\n" },
          { kind: "com", text: "// @ts-expect-error opacity not in 0–1" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssKeyframes" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"from { opacity: 2 }"' },
          { kind: "plain", text: ")\n" },
          {
            kind: "com",
            text: "// @ts-expect-error value isn't a transform list",
          },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssKeyframes" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"from { transform: 5 }"' },
          { kind: "plain", text: ")" },
        ]}
      />
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: unknown properties&apos; values,{" "}
        <code className="font-mono">background</code>/
        <code className="font-mono">background-image</code> (the gradient editor
        emits suggestion strings, not a strict literal),{" "}
        <code className="font-mono">!important</code>, and{" "}
        <code className="font-mono">calc()</code>/
        <code className="font-mono">var()</code> values are deferred to the
        lenient runtime parser. Colors use color-picker forms (
        <code className="font-mono">#f00</code> /{" "}
        <code className="font-mono">oklch(…)</code>), not named colors.
      </p>
    </ExampleCard>
  )
}
