"use client"

import { useState } from "react"
import {
  cssTransform,
  TransformBuilder,
  type TransformString,
} from "@/components/ui/transform-builder"

// Compile-time function-name dispatch. These calls are validated by tsc:
const valid = cssTransform("translateX(10px) rotate(45deg) scale(1.5)")
// @ts-expect-error rotate wants an angle, not a length
const _badRotate = cssTransform("rotate(10px)")
// @ts-expect-error translateX wants a length-%, not an angle
const _badTranslate = cssTransform("translateX(45deg)")
// @ts-expect-error matrix needs exactly 6 numbers
const _badArity = cssTransform("matrix(1, 0, 0, 1, 0)")
// @ts-expect-error perspective is length-only
const _badPerspective = cssTransform("perspective(45deg)")
void _badRotate
void _badTranslate
void _badArity
void _badPerspective

export function TierStrict() {
  const [value, setValue] = useState<TransformString>(valid)
  return (
    <div className="glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          <span className="text-gradient">03</span> strict
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          TransformLiteral&lt;S&gt;
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-lg tracking-tight">
        Per-function unit typing at compile time
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        <code className="text-foreground">cssTransform()</code> dispatches on
        each function name and resolves a wrong unit or arg count to{" "}
        <code className="text-foreground">never</code> — a type error before you
        run the code.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <TransformBuilder value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
        <span className="text-cyan-glow">cssTransform</span>(
        <span className="text-emerald-400">
          &quot;translateX(10px) rotate(45deg)&quot;
        </span>
        ) <span className="text-muted-foreground/70">{"// ✓"}</span>
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error rotate wants an angle"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssTransform</span>(
        <span className="text-destructive">&quot;rotate(10px)&quot;</span>)
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error matrix needs 6 numbers"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssTransform</span>(
        <span className="text-destructive">
          &quot;matrix(1, 0, 0, 1, 0)&quot;
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
