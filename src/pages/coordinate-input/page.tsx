import { ComponentPage } from "@/components/layout/component-page"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/coordinate-input/api-reference"
import { BasicUsage } from "@/examples/coordinate-input/basic-usage"
import { LivePreview } from "@/examples/coordinate-input/live-preview"
import { TierCasual } from "@/examples/coordinate-input/tier-casual"
import { TierIntellisense } from "@/examples/coordinate-input/tier-intellisense"
import { TierStrict } from "@/examples/coordinate-input/tier-strict"

export default function CoordinateInputPage() {
  return (
    <ComponentPage
      meta={{
        title: "Coordinate Input",
        description:
          "Ridiculously typed lon/lat/alt Position input with pointer-lock drag scrubbing and range-validated axes. Value is a numeric Position tuple ([lon, lat] or [lon, lat, alt]). Three usage tiers: casual (plain tuple), IntelliSense (typed constant storage), strict (compile-time range validation via the coordinate() call-site helper — lon ±180, lat ±90). Drag the axis label to scrub; Shift = ×10, Alt = ×0.1.",
        slug: "coordinate-input",
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
            description="From useState-and-go to per-axis compile-time range validation."
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
