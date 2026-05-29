"use client"

import { useState } from "react"
import {
  CalcEditor,
  type CalcString,
  cssCalc,
} from "@/components/ui/calc-editor"

// Compile-time dimensional analysis. These calls are validated by tsc:
const valid = cssCalc("calc(10px + 2rem)") // ✓ length + length
// @ts-expect-error length + angle is dimensionally invalid
const _badSum = cssCalc("calc(10px + 45deg)")
// @ts-expect-error length × length is invalid (need a number operand)
const _badProduct = cssCalc("calc(10px * 2px)")
// @ts-expect-error cannot divide by a length
const _badDivide = cssCalc("calc(10px / 2px)")
// @ts-expect-error clamp() requires exactly 3 arguments
const _badArity = cssCalc("clamp(1rem, 2vw)")
void _badSum
void _badProduct
void _badDivide
void _badArity

export function TierStrict() {
  const [value, setValue] = useState<CalcString>(valid)
  return (
    <div className="glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          <span className="text-gradient">03</span> strict
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          CalcLiteral&lt;S&gt;
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-lg tracking-tight">
        Dimensional algebra at compile time
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        <code className="text-foreground">cssCalc()</code> resolves invalid math
        to <code className="text-foreground">never</code>. Mismatched units
        type- error before you ever run the code.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <CalcEditor value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
        <span className="text-cyan-glow">cssCalc</span>(
        <span className="text-emerald-400">&quot;calc(10px + 2rem)&quot;</span>){" "}
        <span className="text-muted-foreground/70">{"// ✓ length"}</span>
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error length + angle"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssCalc</span>(
        <span className="text-destructive">&quot;calc(10px + 45deg)&quot;</span>
        ){"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error length × length"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssCalc</span>(
        <span className="text-destructive">&quot;calc(10px * 2px)&quot;</span>)
      </pre>
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: <code className="font-mono">var()</code> is undecidable at compile
        time — use the casual or IntelliSense tier for expressions containing
        it.
      </p>
    </div>
  )
}
