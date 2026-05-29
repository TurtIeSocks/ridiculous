"use client"

import { useState } from "react"
import {
  ColorFunction,
  type ColorFunctionString,
  cssColorFn,
} from "@/components/ui/color-function"

// Compile-time per-family validation. These calls are validated by tsc:
const valid = cssColorFn("color-mix(in oklch shorter hue, #ff0000, #0000ff)")
// @ts-expect-error hue method on a rectangular (non-cylindrical) space
const _badHue = cssColorFn("color-mix(in srgb shorter hue, #f00, #00f)")
// @ts-expect-error rgb channel keywords in an oklch relative color
const _badChannels = cssColorFn("oklch(from #f00 r g b)")
// @ts-expect-error a bare color is not in scope (color-picker's domain)
const _bareColor = cssColorFn("rgb(255 0 0)")
// @ts-expect-error unknown interpolation colorspace
const _badSpace = cssColorFn("color-mix(in bogus, #f00, #00f)")
void _badHue
void _badChannels
void _bareColor
void _badSpace

export function TierStrict() {
  const [value, setValue] = useState<ColorFunctionString>(valid)
  return (
    <div className="glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          <span className="text-gradient">03</span> strict
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          ColorFunctionLiteral&lt;S&gt;
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-lg tracking-tight">
        Per-family grammar at compile time
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        <code className="text-foreground">cssColorFn()</code> dispatches on the
        function name and resolves a bad colorspace, a hue method on a
        rectangular space, or wrong relative-color channel keywords to{" "}
        <code className="text-foreground">never</code> — a type error before you
        run the code.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <ColorFunction value={value} onChange={setValue} />
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
          {value}
        </code>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
        <span className="text-cyan-glow">cssColorFn</span>(
        <span className="text-emerald-400">
          &quot;color-mix(in oklch shorter hue, #f00, #00f)&quot;
        </span>
        ) <span className="text-muted-foreground/70">{"// ✓"}</span>
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error hue method on a rectangular space"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssColorFn</span>(
        <span className="text-destructive">
          &quot;color-mix(in srgb shorter hue, …)&quot;
        </span>
        ){"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error rgb channels in an oklch relative color"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssColorFn</span>(
        <span className="text-destructive">
          &quot;oklch(from #f00 r g b)&quot;
        </span>
        )
      </pre>
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: <code className="font-mono">calc()</code> channel bodies and
        channel magnitudes are weak-validated — any balanced{" "}
        <code className="font-mono">calc(…)</code> passes. The runtime parser is
        equally tolerant.
      </p>
    </div>
  )
}
