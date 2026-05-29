"use client"

import { useState } from "react"
import {
  cssFilter,
  FilterBuilder,
  type FilterString,
} from "@/components/ui/filter-builder"

// Compile-time function-list dispatch. These calls are validated by tsc:
const valid = cssFilter(
  "blur(4px) brightness(1.2) drop-shadow(2px 2px 4px #000)",
)
// @ts-expect-error blur wants a length, not an angle
const _badBlur = cssFilter("blur(45deg)")
// @ts-expect-error hue-rotate wants an angle, not a length
const _badHue = cssFilter("hue-rotate(10px)")
// @ts-expect-error drop-shadow trailing color is invalid
const _badColor = cssFilter("drop-shadow(2px 2px 4px wrong)")
// @ts-expect-error url body must be non-empty
const _badUrl = cssFilter("url()")
void _badBlur
void _badHue
void _badColor
void _badUrl

export function TierStrict() {
  const [value, setValue] = useState<FilterString>(valid)
  return (
    <div className="glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          <span className="text-gradient">03</span> strict
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          FilterLiteral&lt;S&gt;
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-lg tracking-tight">
        Per-function dimension typing at compile time
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        <code className="text-foreground">cssFilter()</code> dispatches on each
        function name and resolves a wrong dimension, arg count, or bad
        drop-shadow color to <code className="text-foreground">never</code> — a
        type error before you run the code.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <FilterBuilder value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
        <span className="text-cyan-glow">cssFilter</span>(
        <span className="text-emerald-400">
          &quot;blur(4px) drop-shadow(2px 2px 4px #000)&quot;
        </span>
        ) <span className="text-muted-foreground/70">{"// ✓"}</span>
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error blur wants a length"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssFilter</span>(
        <span className="text-destructive">&quot;blur(45deg)&quot;</span>){"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error bad drop-shadow color"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssFilter</span>(
        <span className="text-destructive">
          &quot;drop-shadow(2px 2px 4px wrong)&quot;
        </span>
        )
      </pre>
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: <code className="font-mono">calc()</code> /{" "}
        <code className="font-mono">var()</code> inside an argument are
        undecidable at compile time — use the casual or IntelliSense tier for
        those.
      </p>
    </div>
  )
}
