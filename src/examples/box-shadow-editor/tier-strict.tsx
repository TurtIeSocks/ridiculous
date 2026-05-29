"use client"

import { useState } from "react"
import {
  BoxShadowEditor,
  type BoxShadowString,
  cssBoxShadow,
} from "@/components/ui/box-shadow-editor"

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
    <div className="glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          <span className="text-gradient">03</span> strict
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          BoxShadowLiteral&lt;S&gt;
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-lg tracking-tight">
        Per-layer token typing at compile time
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        <code className="text-foreground">cssBoxShadow()</code> splits the list
        by comma, then each layer by space, and resolves a bad arity, a negative
        blur, a misplaced <code className="text-foreground">inset</code>, or a
        non-<code className="text-foreground">ColorLiteral</code> color to{" "}
        <code className="text-foreground">never</code> — a type error before you
        run the code.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <BoxShadowEditor value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
        <span className="text-cyan-glow">cssBoxShadow</span>(
        <span className="text-emerald-400">
          &quot;inset 0px 0px 10px 2px #000, 0px 4px 8px #0003&quot;
        </span>
        ) <span className="text-muted-foreground/70">{"// ✓"}</span>
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error bare keyword color"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssBoxShadow</span>(
        <span className="text-destructive">&quot;0px 4px red&quot;</span>){"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error negative blur"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssBoxShadow</span>(
        <span className="text-destructive">&quot;0px 4px -8px&quot;</span>)
      </pre>
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: bare keyword colors (<code className="font-mono">red</code>) and{" "}
        <code className="font-mono">calc()</code> /{" "}
        <code className="font-mono">var()</code> are rejected at the strict tier
        — use the casual or IntelliSense tier; the runtime parser accepts them.
      </p>
    </div>
  )
}
