"use client"

import { useState } from "react"
import {
  CalcEditorPanel,
  computeCalc,
  FluidTypePlayground,
  parseCalc,
} from "@/components/ui/calc-editor"
import { ExampleCard } from "@/examples/_shared/example-card"

const PRESET = "clamp(1rem, 0.75rem + 2vw, 2.5rem)"

export function FluidTypePlaygroundExample() {
  const [expr, setExpr] = useState<string>(PRESET)

  // Live preview text whose font-size tracks the expression at a few widths.
  const node = parseCalc(expr)
  const at = (vw: number): string => {
    if (!node) return "—"
    const px = computeCalc(node, { viewport: vw, basis: vw })
    return px === null ? "—" : `${Math.round(px * 100) / 100}px`
  }

  return (
    <ExampleCard
      eyebrow="fluid-type playground"
      title="clamp() across the viewport"
      description={
        <>
          Drag the viewport slider and watch the computed{" "}
          <code className="font-mono text-foreground">font-size</code> resolve
          live. This is fluid typography — a single{" "}
          <code className="font-mono text-foreground">clamp()</code> that scales
          between a min and max as the screen grows.
        </>
      }
      className="md:p-8"
    >
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <CalcEditorPanel value={expr} onChange={setExpr} fn="clamp" />
        </div>

        <div className="space-y-4">
          <FluidTypePlayground expression={expr} />
          <div className="rounded-lg border p-4">
            <div className="mb-2 font-mono text-muted-foreground text-xs">
              computed font-size
            </div>
            <dl className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
              <div>
                <dt className="text-muted-foreground">320px</dt>
                <dd className="text-foreground">{at(320)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">768px</dt>
                <dd className="text-foreground">{at(768)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">1440px</dt>
                <dd className="text-foreground">{at(1440)}</dd>
              </div>
            </dl>
          </div>
          <p
            className="rounded-lg border bg-muted/30 p-4 leading-snug"
            style={{ fontSize: expr }}
          >
            The quick brown fox
          </p>
        </div>
      </div>
    </ExampleCard>
  )
}
