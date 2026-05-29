"use client"

import { useState } from "react"
import {
  cssFont,
  FontEditor,
  type FontString,
} from "@/components/ui/font-editor"

// Compile-time ordered parse. These calls are validated by tsc:
const valid = cssFont("italic bold 16px/1.5 'Inter', sans-serif")
// @ts-expect-error missing the mandatory font-family
const _noFamily = cssFont("16px")
// @ts-expect-error two style tokens — duplicate prefix kind
const _dupStyle = cssFont("italic oblique 16px serif")
// @ts-expect-error no size precedes the family
const _noSize = cssFont("italic serif")
// @ts-expect-error var() is undecidable at the strict tier
const _varFont = cssFont("var(--font)")
void _noFamily
void _dupStyle
void _noSize
void _varFont

export function TierStrict() {
  const [value, setValue] = useState<FontString>(valid)
  return (
    <div className="glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          <span className="text-gradient">03</span> strict
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          FontLiteral&lt;S&gt;
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-lg tracking-tight">
        The ordered grammar at compile time
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        <code className="text-foreground">cssFont()</code> parses the prefix,
        size, optional line-height and family in order and resolves a missing
        size, missing family, or duplicate prefix kind to{" "}
        <code className="text-foreground">never</code> — a type error before you
        run the code.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <FontEditor value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
        <span className="text-cyan-glow">cssFont</span>(
        <span className="text-emerald-400">
          &quot;italic bold 16px/1.5 serif&quot;
        </span>
        ) <span className="text-muted-foreground/70">{"// ✓"}</span>
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error no font-family"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssFont</span>(
        <span className="text-destructive">&quot;16px&quot;</span>){"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error two style tokens"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssFont</span>(
        <span className="text-destructive">
          &quot;italic oblique 16px serif&quot;
        </span>
        )
      </pre>
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: <code className="font-mono">var()</code> /{" "}
        <code className="font-mono">calc()</code> are undecidable at compile
        time — use the casual or IntelliSense tier for those.
      </p>
    </div>
  )
}
