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
          "Ridiculously typed editor for the CSS shape() function (clip-path / offset-path). The strict tier dispatches each command on its name (move/line/curve/arc/…), checking arity, direction, and every coordinate. Ships the registry's only Bézier-control-handle canvas with a live preview.",
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
