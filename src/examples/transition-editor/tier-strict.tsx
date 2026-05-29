"use client"

import { useState } from "react"
import {
  type AnimationString,
  cssAnimation,
  cssTransition,
  TransitionEditor,
  type TransitionString,
} from "@/components/ui/transition-editor"

// Compile-time per-layer token-kind validation. These calls are checked by tsc:
const validTransition = cssTransition(
  "opacity 200ms 100ms ease-in-out allow-discrete",
)
// @ts-expect-error three <time> tokens — duration + delay is the cap
const _tooManyTimes = cssTransition("opacity 200ms 100ms 50ms ease")
// @ts-expect-error two <easing-function> tokens
const _twoEasings = cssTransition("opacity ease ease-in")
// @ts-expect-error calc() is undecidable at the strict tier
const _calcTransition = cssTransition("opacity calc(200ms + 1s)")

const validAnimation = cssAnimation("spin 1s ease-in-out infinite alternate")
// @ts-expect-error two iteration-count tokens
const _twoCounts = cssAnimation("spin 1s 2 3")
// @ts-expect-error an unknown token
const _unknown = cssAnimation("spin 1s up")
void _tooManyTimes
void _twoEasings
void _calcTransition
void _twoCounts
void _unknown

export function TierStrict() {
  const [transition, setTransition] =
    useState<TransitionString>(validTransition)
  const [animation, setAnimation] = useState<AnimationString>(validAnimation)
  return (
    <div className="glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-muted-foreground text-xs uppercase tracking-[0.15em]">
          <span className="text-gradient">03</span> strict
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          TransitionLiteral&lt;S&gt;
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-lg tracking-tight">
        Per-layer token-kind typing at compile time
      </h3>
      <p className="mt-2 text-muted-foreground text-sm">
        <code className="text-foreground">cssTransition()</code> /{" "}
        <code className="text-foreground">cssAnimation()</code> split the list
        by comma, then each layer by space, classify every token by{" "}
        <em>kind</em>, and resolve excess cardinality, an unknown token, or a
        bad easing to <code className="text-foreground">never</code> — a type
        error before you run the code.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <TransitionEditor value={transition} onChange={setTransition} />
          <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
            {transition}
          </code>
        </div>
        <div className="flex items-center gap-2">
          <TransitionEditor
            mode="animation"
            value={animation}
            onChange={setAnimation}
          />
          <code className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs">
            {animation}
          </code>
        </div>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
        <span className="text-cyan-glow">cssTransition</span>(
        <span className="text-emerald-400">
          &quot;opacity 200ms 100ms ease allow-discrete&quot;
        </span>
        ) <span className="text-muted-foreground/70">{"// ✓"}</span>
        {"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error three <time> tokens"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssTransition</span>(
        <span className="text-destructive">
          &quot;opacity 200ms 100ms 50ms ease&quot;
        </span>
        ){"\n"}
        <span className="text-muted-foreground/70">
          {"// @ts-expect-error two iteration counts"}
        </span>
        {"\n"}
        <span className="text-cyan-glow">cssAnimation</span>(
        <span className="text-destructive">&quot;spin 1s 2 3&quot;</span>)
      </pre>
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: <code className="font-mono">calc()</code> /{" "}
        <code className="font-mono">var()</code> tokens are rejected at the
        strict tier — use the casual or IntelliSense tier; the runtime parser
        accepts them.
      </p>
    </div>
  )
}
