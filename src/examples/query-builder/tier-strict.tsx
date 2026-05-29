"use client"

import { useState } from "react"
import {
  cssContainerQuery,
  cssMediaQuery,
  type MediaQueryString,
  QueryBuilder,
} from "@/components/ui/query-builder"

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
    <div className="glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          <span className="text-gradient">03</span> strict
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          MediaQueryLiteral&lt;S&gt;
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-lg tracking-tight">
        Query grammar typed at compile time
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        <code className="text-foreground">cssMediaQuery()</code> /{" "}
        <code className="text-foreground">cssContainerQuery()</code> validate
        the structure, the <code className="text-foreground">and</code>/
        <code className="text-foreground">or</code> no-mix rule, and each
        feature's value dimension — resolving any violation to{" "}
        <code className="text-foreground">never</code> before you run the code.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <QueryBuilder value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
        <span className="text-cyan-glow">cssMediaQuery</span>(
        <span className="text-emerald-400">
          &quot;screen and (min-width: 600px)&quot;
        </span>
        ) <span className="text-muted-foreground/70">{"// ✓"}</span>
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error width wants <length>, not <ratio>"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssMediaQuery</span>(
        <span className="text-destructive">&quot;(width: 16/9)&quot;</span>)
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error mixes and/or without parens"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssMediaQuery</span>(
        <span className="text-destructive">&quot;(a) and (b) or (c)&quot;</span>
        )
      </pre>
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: unknown/exotic features, <code className="font-mono">calc()</code>{" "}
        values, and deep nesting are deferred to the runtime parser (lenient by
        design). The strict tier gates the known feature set with typed values.
      </p>
    </div>
  )
}
