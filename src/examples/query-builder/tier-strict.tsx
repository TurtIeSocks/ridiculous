"use client"

import { useState } from "react"
import {
  cssContainerQuery,
  cssMediaQuery,
  type MediaQueryString,
  QueryBuilder,
} from "@/components/ui/query-builder"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

// Compile-time query validation. These calls are checked by tsc:
const validMedia = cssMediaQuery("screen and (min-width: 600px)")
cssContainerQuery("(inline-size > 30rem)")
// @ts-expect-error width wants a <length>, not a <ratio>
const _badDimension = cssMediaQuery("(width: 16/9)")
// @ts-expect-error CSS forbids mixing and/or without parens
const _mixed = cssMediaQuery("(hover) and (color) or (grid)")
// @ts-expect-error resolution is not a container feature
const _wrongMode = cssContainerQuery("(min-resolution: 2dppx)")
// @ts-expect-error sideways is not a valid orientation keyword
const _badEnum = cssMediaQuery("(orientation: sideways)")
void _badDimension
void _mixed
void _wrongMode
void _badEnum

export function TierStrict() {
  const [value, setValue] = useState<MediaQueryString>(validMedia)
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={<>MediaQueryLiteral&lt;S&gt;</>}
      title="Query grammar typed at compile time"
      description={
        <>
          <code className="text-foreground">cssMediaQuery()</code> /{" "}
          <code className="text-foreground">cssContainerQuery()</code> validate
          the structure, the <code className="text-foreground">and</code>/
          <code className="text-foreground">or</code> no-mix rule, and each
          feature's value dimension — resolving any violation to{" "}
          <code className="text-foreground">never</code> before you run the
          code.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <QueryBuilder value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "fn", text: "cssMediaQuery" },
          { kind: "plain", text: "(" },
          { kind: "str", text: '"screen and (min-width: 600px)"' },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓" },
          { kind: "plain", text: "\n" },
          {
            kind: "com",
            text: "// @ts-expect-error width wants <length>, not <ratio>",
          },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssMediaQuery" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"(width: 16/9)"' },
          { kind: "plain", text: ")\n" },
          {
            kind: "com",
            text: "// @ts-expect-error mixes and/or without parens",
          },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssMediaQuery" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"(a) and (b) or (c)"' },
          { kind: "plain", text: ")" },
        ]}
      />
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: unknown/exotic features, <code className="font-mono">calc()</code>{" "}
        values, and deep nesting are deferred to the runtime parser (lenient by
        design). The strict tier gates the known feature set with typed values.
      </p>
    </ExampleCard>
  )
}
