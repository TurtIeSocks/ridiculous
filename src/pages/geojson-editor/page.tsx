import { ComponentPage } from "@/components/layout/component-page"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/geojson-editor/api-reference"
import { BasicUsage } from "@/examples/geojson-editor/basic-usage"
import { LivePreview } from "@/examples/geojson-editor/live-preview"
import { TierCasual } from "@/examples/geojson-editor/tier-casual"
import { TierIntellisense } from "@/examples/geojson-editor/tier-intellisense"
import { TierStrict } from "@/examples/geojson-editor/tier-strict"

export default function GeojsonEditorPage() {
  return (
    <ComponentPage
      meta={{
        title: "GeoJSON Editor",
        description:
          "RFC 7946 GeoJSON editor with a headless core, five composable view parts, and three layout presets (drill-down / dual-pane / toggle). Generic over the value type — narrow to Feature<Polygon, P> for per-geometry type soundness. Three usage tiers: casual (plain GeoJSON object), IntelliSense (typed constants via the discriminated union), strict (geometry-deep compile-time validation via the geojson() call-site helper).",
        slug: "geojson-editor",
      }}
      examples={
        <>
          <BasicUsage />
          <LivePreview />
        </>
      }
      tiers={
        <>
          <SectionHeader
            className="mt-24"
            eyebrow="types"
            title="Three usage tiers"
            description="From useState-and-go to geometry-deep compile-time validation."
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
