"use client"

import { useState } from "react"
import {
  AnchorPositionEditor,
  cssAnchor,
  cssPositionArea,
  cssPositionTry,
  type PositionAreaString,
} from "@/components/ui/anchor-position-editor"
import { CodeBlock } from "@/examples/_shared/code-block"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

// Compile-time anchor-positioning validation. These calls are checked by tsc:
const validArea = cssPositionArea("top left")
cssAnchor("anchor(--btn bottom)")
cssPositionTry("--fallback, flip-block")
// @ts-expect-error both keywords sit on the y axis
const _sameAxis = cssPositionArea("top bottom")
// @ts-expect-error mixes the physical and logical coordinate systems
const _systemMix = cssPositionArea("left block-start")
// @ts-expect-error diagonal is not an anchor-side keyword
const _badSide = cssAnchor("anchor(--btn diagonal)")
// @ts-expect-error a fallback must be a <length-percentage>, not a color
const _badFallback = cssAnchor("anchor(top, red)")
// @ts-expect-error flip-diagonal is not a try-tactic
const _badTactic = cssPositionTry("flip-diagonal")
void _sameAxis
void _systemMix
void _badSide
void _badFallback
void _badTactic

export function TierStrict() {
  const [value, setValue] = useState<PositionAreaString>(validArea)
  return (
    <ExampleCard
      tierIndex={3}
      tierLabel="strict"
      typeBadge={<>PositionAreaLiteral&lt;S&gt;</>}
      title="Anchor grammar typed at compile time"
      description={
        <>
          <code className="text-foreground">cssPositionArea()</code> /{" "}
          <code className="text-foreground">cssAnchor()</code> /{" "}
          <code className="text-foreground">cssPositionTry()</code> validate the
          cross-axis rule (a pair must sit on different axes of the{" "}
          <em>same</em> coordinate system), the{" "}
          <code className="text-foreground">anchor()</code> side / size keyword
          and its <code className="font-mono">&lt;length-percentage&gt;</code>{" "}
          fallback, and every try-fallback — resolving any violation to{" "}
          <code className="text-foreground">never</code> before you run the
          code.
        </>
      }
    >
      <div className="mt-5 flex items-center gap-2">
        <AnchorPositionEditor value={value} onChange={setValue} />
        <ValueReadout value={value} />
      </div>
      <CodeBlock
        className="mt-6"
        tokens={[
          { kind: "fn", text: "cssPositionArea" },
          { kind: "plain", text: "(" },
          { kind: "str", text: '"top left"' },
          { kind: "plain", text: ") " },
          { kind: "com", text: "// ✓" },
          { kind: "plain", text: "\n" },
          { kind: "com", text: "// @ts-expect-error both on the y axis" },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssPositionArea" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"top bottom"' },
          { kind: "plain", text: ")\n" },
          {
            kind: "com",
            text: "// @ts-expect-error mixes physical + logical",
          },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssPositionArea" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"left block-start"' },
          { kind: "plain", text: ")\n" },
          {
            kind: "com",
            text: "// @ts-expect-error fallback must be <length-percentage>",
          },
          { kind: "plain", text: "\n" },
          { kind: "fn", text: "cssAnchor" },
          { kind: "plain", text: "(" },
          { kind: "err", text: '"anchor(top, red)"' },
          { kind: "plain", text: ")" },
        ]}
      />
      <p className="mt-3 text-muted-foreground/70 text-xs">
        Note: the ambiguous <code className="font-mono">start</code>/
        <code className="font-mono">end</code> keywords (axis depends on
        writing-mode), <code className="font-mono">&lt;dashed-ident&gt;</code>{" "}
        grammar beyond the <code className="font-mono">--</code> prefix, and{" "}
        <code className="font-mono">calc()</code>/
        <code className="font-mono">var()</code> fallbacks are deferred to the
        runtime parser (lenient by design).
      </p>
    </ExampleCard>
  )
}
