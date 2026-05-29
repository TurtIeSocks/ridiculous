"use client"

import { useState } from "react"
import {
  BoxShadowEditor,
  type BoxShadowString,
  cssBoxShadow,
} from "@/components/ui/box-shadow-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

// Compile-time per-layer validation. These calls are validated by tsc:
const valid = cssBoxShadow(
  "inset 0px 0px 10px 2px #000, 0px 4px 8px rgb(0 0 0 / 0.2)",
)
// @ts-expect-error a bare keyword color is not in ColorLiteral — use hex / functional
const _badKeyword = cssBoxShadow("0px 4px red")
// @ts-expect-error blur radius must be non-negative
const _badBlur = cssBoxShadow("0px 4px -8px")
// @ts-expect-error a single offset is too few lengths (need 2-4)
const _badArity = cssBoxShadow("0px")
// @ts-expect-error strict tier is color-LAST only; a leading color resolves to never
const _badLeading = cssBoxShadow("#000 0px 4px")
void _badKeyword
void _badBlur
void _badArity
void _badLeading

export function TierStrict() {
  const [value, setValue] = useState<BoxShadowString>(valid)
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={<>BoxShadowLiteral&lt;S&gt;</>}
      title="Per-layer token typing at compile time"
      description={
        <>
          <code className="text-foreground">cssBoxShadow()</code> splits the
          list by comma, then each layer by space, and resolves a bad arity, a
          negative blur, a misplaced{" "}
          <code className="text-foreground">inset</code>, or a non-
          <code className="text-foreground">ColorLiteral</code> color to{" "}
          <code className="text-foreground">never</code> — a type error before
          you run the code.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <BoxShadowEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "fn", text: "cssBoxShadow" },
          { kind: "plain", text: "(" },
          {
            kind: "str",
            text: '"inset 0px 0px 10px 2px #000, 0px 4px 8px #0003"',
          },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓" },
          { kind: "plain", text: "\n" },
          { kind: "com", text: "// @ts-expect-error bare keyword color" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssBoxShadow" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"0px 4px red"' },
          { kind: "plain", text: ")\n" },
          { kind: "com", text: "// @ts-expect-error negative blur" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssBoxShadow" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"0px 4px -8px"' },
          { kind: "plain", text: ")" },
        ]}
      />
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: bare keyword colors (<code className="font-mono">red</code>) and{" "}
        <code className="font-mono">calc()</code> /{" "}
        <code className="font-mono">var()</code> are rejected at the strict tier
        — use the casual or IntelliSense tier; the runtime parser accepts them.
      </p>
    </ExampleCard>
  )
}
