"use client"

import { useState } from "react"
import {
  cssIf,
  IfFunction,
  type IfFunctionString,
} from "@/components/ui/if-function"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

// Compile-time if() validation. These calls are checked by tsc:
const validIf = cssIf(
  "if(media(width >= 800px): red; supports(color: oklch(0 0 0)): green; else: blue)",
)
// @ts-expect-error foo() is not a media/supports/style condition
const _unknownKind = cssIf("if(foo(x): 1)")
// @ts-expect-error else may only be the final branch
const _elseNotLast = cssIf("if(else: a; media(width >= 1px): b)")
// @ts-expect-error the value after the colon is empty
const _emptyValue = cssIf("if(media(width >= 1px): )")
void _unknownKind
void _elseNotLast
void _emptyValue

export function TierStrict() {
  const [value, setValue] = useState<IfFunctionString>(validIf)
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={<>IfFunctionLiteral&lt;S&gt;</>}
      title="Branch grammar typed at compile time"
      description={
        <>
          <code className="text-foreground">cssIf()</code> validates the{" "}
          <code className="text-foreground">if()</code> wrapper, splits branches
          on top-level semicolons, splits each branch on its first top-level
          colon, and checks the condition kind, the{" "}
          <code className="text-foreground">else</code>-last rule, and a
          non-empty value — resolving any violation to{" "}
          <code className="text-foreground">never</code> before you run the
          code.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <IfFunction value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "fn", text: "cssIf" },
          { kind: "plain", text: "(" },
          { kind: "str", text: '"if(media(width >= 800px): red; else: blue)"' },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓" },
          { kind: "plain", text: "\n" },
          { kind: "com", text: "// @ts-expect-error unknown condition kind" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssIf" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"if(foo(x): 1)"' },
          { kind: "plain", text: ")\n" },
          { kind: "com", text: "// @ts-expect-error else not last" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssIf" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"if(else: a; media(width >= 1px): b)"' },
          { kind: "plain", text: ")" },
        ]}
      />
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: condition <em>bodies</em> (the media-query / supports-condition /
        style-query grammar) are validated leniently at the type level —
        non-empty + balanced parens. The runtime parser does fuller structural
        work.
      </p>
    </ExampleCard>
  )
}
