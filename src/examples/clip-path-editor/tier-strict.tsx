"use client"

import { useState } from "react"
import {
  ClipPathEditor,
  type ClipPathString,
  cssClipPath,
} from "@/components/ui/clip-path-editor"

// Compile-time basic-shape dispatch. These calls are validated by tsc:
const valid = cssClipPath("polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)")
// @ts-expect-error inset wants a length-percentage, not an angle
const _badInset = cssClipPath("inset(45deg)")
// @ts-expect-error a circle radius cannot be two values
const _badCircle = cssClipPath("circle(50% 60%)")
// @ts-expect-error a polygon vertex needs exactly two coordinates
const _badPoly = cssClipPath("polygon(0% 0%, 100% 0%, 50%)")
// @ts-expect-error at most one geometry box
const _badBox = cssClipPath("border-box circle() padding-box")
void _badInset
void _badCircle
void _badPoly
void _badBox

export function TierStrict() {
  const [value, setValue] = useState<ClipPathString>(valid)
  return (
    <div className="glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          <span className="text-gradient">03</span> strict
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          ClipPathLiteral&lt;S&gt;
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-lg tracking-tight">
        Per-shape grammar at compile time
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        <code className="text-foreground">cssClipPath()</code> dispatches on the
        shape function and resolves a wrong dimension, arg count, vertex shape,
        or a double geometry box to{" "}
        <code className="text-foreground">never</code> — a type error before you
        run the code.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <ClipPathEditor value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
        <span className="text-cyan-glow">cssClipPath</span>(
        <span className="text-emerald-400">
          &quot;polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)&quot;
        </span>
        ) <span className="text-muted-foreground/70">{"// ✓"}</span>
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error circle radius cannot be two values"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssClipPath</span>(
        <span className="text-destructive">&quot;circle(50% 60%)&quot;</span>)
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error a vertex needs two coordinates"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssClipPath</span>(
        <span className="text-destructive">
          &quot;polygon(0% 0%, 100% 0%, 50%)&quot;
        </span>
        )
      </pre>
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: <code className="font-mono">calc()</code> /{" "}
        <code className="font-mono">var()</code> coordinates, the{" "}
        <code className="font-mono">inset()</code> round radius tail, and
        3/4-token edge-offset positions are undecidable / out-of-scope at the
        strict tier — use the casual or IntelliSense tier; the runtime parser
        accepts them. Polygon vertices past 32 are weak-validated.
      </p>
    </div>
  )
}
