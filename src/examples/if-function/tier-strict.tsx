"use client"

import { useState } from "react"
import {
  cssIf,
  IfFunction,
  type IfFunctionString,
} from "@/components/ui/if-function"

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
    <div className="glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          <span className="text-gradient">03</span> strict
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          IfFunctionLiteral&lt;S&gt;
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-lg tracking-tight">
        Branch grammar typed at compile time
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        <code className="text-foreground">cssIf()</code> validates the{" "}
        <code className="text-foreground">if()</code> wrapper, splits branches
        on top-level semicolons, splits each branch on its first top-level
        colon, and checks the condition kind, the{" "}
        <code className="text-foreground">else</code>-last rule, and a non-empty
        value — resolving any violation to{" "}
        <code className="text-foreground">never</code> before you run the code.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <IfFunction value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
        <span className="text-cyan-glow">cssIf</span>(
        <span className="text-emerald-400">
          &quot;if(media(width &gt;= 800px): red; else: blue)&quot;
        </span>
        ) <span className="text-muted-foreground/70">{"// ✓"}</span>
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error unknown condition kind"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssIf</span>(
        <span className="text-destructive">&quot;if(foo(x): 1)&quot;</span>)
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error else not last"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssIf</span>(
        <span className="text-destructive">
          &quot;if(else: a; media(width &gt;= 1px): b)&quot;
        </span>
        )
      </pre>
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: condition <em>bodies</em> (the media-query / supports-condition /
        style-query grammar) are validated leniently at the type level —
        non-empty + balanced parens. The runtime parser does fuller structural
        work.
      </p>
    </div>
  )
}
