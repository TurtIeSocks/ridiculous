"use client"

import { useState } from "react"
import {
  type AnimationString,
  cssAnimation,
  cssTransition,
  TransitionEditor,
  type TransitionString,
} from "@/components/ui/transition-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

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
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={<>TransitionLiteral&lt;S&gt;</>}
      title="Per-layer token-kind typing at compile time"
      description={
        <>
          <code className="text-foreground">cssTransition()</code> /{" "}
          <code className="text-foreground">cssAnimation()</code> split the list
          by comma, then each layer by space, classify every token by{" "}
          <em>kind</em>, and resolve excess cardinality, an unknown token, or a
          bad easing to <code className="text-foreground">never</code> — a type
          error before you run the code.
        </>
      }
    >
      <div className="mt-5 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <TransitionEditor value={transition} onChange={setTransition} />
          <ValueReadout value={transition} />
        </div>
        <div className="flex items-center gap-2">
          <TransitionEditor
            mode="animation"
            value={animation}
            onChange={setAnimation}
          />
          <ValueReadout value={animation} />
        </div>
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "fn", text: "cssTransition" },
          { kind: "plain", text: "(" },
          { kind: "str", text: '"opacity 200ms 100ms ease allow-discrete"' },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓" },
          { kind: "plain", text: "\n" },
          { kind: "com", text: "// @ts-expect-error three <time> tokens" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssTransition" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"opacity 200ms 100ms 50ms ease"' },
          { kind: "plain", text: ")\n" },
          { kind: "com", text: "// @ts-expect-error two iteration counts" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssAnimation" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"spin 1s 2 3"' },
          { kind: "plain", text: ")" },
        ]}
      />
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: <code className="font-mono">calc()</code> /{" "}
        <code className="font-mono">var()</code> tokens are rejected at the
        strict tier — use the casual or IntelliSense tier; the runtime parser
        accepts them.
      </p>
    </ExampleCard>
  )
}
