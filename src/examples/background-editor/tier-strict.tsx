"use client"

import { useState } from "react"
import {
  BackgroundEditor,
  type BackgroundString,
  cssBackground,
} from "@/components/ui/background-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

// Compile-time background-shorthand validation. These calls are checked by tsc:
const validBg = cssBackground(
  "linear-gradient(#f00, #00f) center / cover no-repeat, #fff",
)
cssBackground("url(x.png) left top / 50% repeat-x")
cssBackground("#fff") // a lone color — the single, final layer
// @ts-expect-error a <color> is legal only on the FINAL layer
const _earlyColor = cssBackground("#f00 center, url(x.png)")
// @ts-expect-error an unknown size token (only the final layer may add a color)
const _unknownToken = cssBackground("center / wibble")
// @ts-expect-error an unrecognized keyword is not a background token
const _bogus = cssBackground("url(x.png) bogus-keyword")
void _earlyColor
void _unknownToken
void _bogus

export function TierStrict() {
  const [value, setValue] = useState<BackgroundString>(validBg)
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={<>BackgroundLiteral&lt;S&gt;</>}
      title="The shorthand typed at compile time"
      description={
        <>
          <code className="text-foreground">cssBackground()</code> splits the
          value into comma-stacked layers and folds them with an{" "}
          <strong>index-aware</strong> head/tail recursion that knows when it is
          at the last layer — permitting a{" "}
          <code className="font-mono text-foreground">&lt;color&gt;</code> token
          ONLY there. A color in any non-final layer, or any unrecognized
          per-layer token, resolves to{" "}
          <code className="text-foreground">never</code> before you run the
          code. Colors use color-picker forms (
          <code className="font-mono">#f00</code> /{" "}
          <code className="font-mono">oklch(…)</code>), not named colors.
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
          { kind: "fn", text: "cssBackground" },
          { kind: "plain", text: "(" },
          { kind: "str", text: '"…gradient… center / cover, #fff"' },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓ color on the final layer" },
          { kind: "plain", text: "\n" },
          {
            kind: "com",
            text: "// @ts-expect-error color in a non-final layer",
          },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssBackground" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"#f00 center, url(x.png)"' },
          { kind: "plain", text: ")\n" },
          { kind: "com", text: "// @ts-expect-error unknown size token" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssBackground" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"center / wibble"' },
          { kind: "plain", text: ")" },
        ]}
      />
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: per-layer token validation is membership-based and order-free —
        the <code className="font-mono">||</code> ordering / cardinality (at
        most one image, position-before-<code className="font-mono">/</code>
        -before- size) is deferred to the runtime parser. Image internals are
        lenient (any parenthesized function or{" "}
        <code className="font-mono">none</code>; the embedded{" "}
        <code className="font-mono">GradientEditor</code> validates gradients),
        and <code className="font-mono">calc()</code>/
        <code className="font-mono">var()</code> defer to runtime.
      </p>
    </ExampleCard>
  )
}
