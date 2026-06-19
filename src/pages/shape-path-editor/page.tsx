import { ComponentPage } from "@/components/layout/component-page"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/shape-path-editor/api-reference"
import { BasicUsage } from "@/examples/shape-path-editor/basic-usage"
import { PathCanvas } from "@/examples/shape-path-editor/path-canvas"
import { TierCasual } from "@/examples/shape-path-editor/tier-casual"
import { TierIntellisense } from "@/examples/shape-path-editor/tier-intellisense"
import { TierStrict } from "@/examples/shape-path-editor/tier-strict"

export default function ShapePathEditorPage() {
  return (
    <ComponentPage
      meta={{
        title: "Shape Path Editor",
        description:
          "Edit a CSS shape() <basic-shape> value (for clip-path / offset-path) with compile-time grammar validation. The namesake is per-command dispatch: the strict tier peels the shape() wrapper, validates the optional fill-rule and the `from <coordinate-pair>` seed, then dispatches each comma-separated command on its name (move / line / hline / vline / curve / smooth / arc / close) — checking per-command arity, the by/to direction, the with/of slot keywords, and every coordinate's dimension as a <length-percentage> with units. An unknown command (wiggle), a wrong arity (line to 100px), or a curve missing its `with` control all resolve to never before you run the code. A mode prop ('clip-path' | 'offset-path', default 'clip-path') drives the live preview only — both modes share one validator. The visual hero is the only registry canvas that draws Bézier control handles, not just vertices: drag a node or a tethered handle, arrow-nudge it, and the editor re-serializes through updatePoint. The hline/vline keyword positions, the order-free arc flags (cw / large / rotate), a curve's optional second control point, and calc()/var() coordinates are deferred to the lenient runtime parser; the live preview is gated on CSS.supports and degrades to a raw SVG render (fresh browser support: Chrome 137 / Safari 18.4).",
        slug: "shape-path-editor",
      }}
      examples={
        <>
          <BasicUsage />
          <PathCanvas />
        </>
      }
      tiers={
        <>
          <SectionHeader
            className="mt-24"
            eyebrow="types"
            title="Three usage tiers"
            description="From useState-and-go to compile-time per-command-grammar validation."
          />
          <div className="mt-12 space-y-6">
            <TierCasual />
            <TierIntellisense />
            <TierStrict />
          </div>
        </>
      }
      apiReference={<ApiReference />}
    />
  )
}
