import { InstallCta } from "@/components/layout/install-cta"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/clip-path-editor/api-reference"
import { BasicUsage } from "@/examples/clip-path-editor/basic-usage"
import { PolygonPlayground } from "@/examples/clip-path-editor/polygon-playground"
import { TierCasual } from "@/examples/clip-path-editor/tier-casual"
import { TierIntellisense } from "@/examples/clip-path-editor/tier-intellisense"
import { TierStrict } from "@/examples/clip-path-editor/tier-strict"

export function ClipPathEditorPage() {
  return (
    <>
      <SectionHeader
        eyebrow="component"
        title="Clip Path Editor"
        description="Edit the CSS clip-path / shape-outside property — a single <basic-shape> with an optional geometry-box keyword — with compile-time BASIC-SHAPE DISPATCH. ParseFunction routes the value to a per-shape validator: inset() validates 1-4 length-percentages, circle() a radius + at-position, ellipse() two radii, polygon() a variadic vertex list (each vertex two length-percentages, validated to a 32-vertex cap). inset(45deg) → never; circle(50% 60%) → never; polygon(0% 0%, 100% 0%, 50%) → never. Drag the polygon vertices to write percentage coordinates live."
      />
      <div className="mt-12 space-y-10">
        <BasicUsage />
        <PolygonPlayground />
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="types"
        title="Three usage tiers"
        description="From useState-and-go to per-shape dimension-typed dispatch."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <TierCasual />
        <TierIntellisense />
        <TierStrict />
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="api"
        title="API"
        description="Public surface — component props, runtime helpers, and the type exports."
      />
      <div className="mt-8">
        <ApiReference />
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="install"
        title="Drop it in"
        description="One command via the shadcn CLI."
      />
      <div className="mt-6">
        <InstallCta args="add https://turtiesocks.github.io/ridiculous/r/clip-path-editor.json" />
      </div>
    </>
  )
}
