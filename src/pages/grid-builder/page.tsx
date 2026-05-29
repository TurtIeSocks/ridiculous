import { ComponentPage } from "@/components/layout/component-page"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/grid-builder/api-reference"
import { BasicUsage } from "@/examples/grid-builder/basic-usage"
import { LivePreviewExample } from "@/examples/grid-builder/live-preview"
import { TierCasual } from "@/examples/grid-builder/tier-casual"
import { TierIntellisense } from "@/examples/grid-builder/tier-intellisense"
import { TierStrict } from "@/examples/grid-builder/tier-strict"

export default function GridBuilderPage() {
  return (
    <ComponentPage
      meta={{
        title: "Grid Builder",
        description:
          "Edit grid-template-columns / grid-template-rows (track lists) and grid-template-areas, with two compile-time validators. TrackListLiteral fully validates the track grammar — minmax(1fr, 2fr) → never (an fr is not an inflexible min), repeat(0, 1fr) → never, fit-content / [named-lines] / nested repeat all typed. GridAreasLiteral checks quoting + equal column counts at the type level; the contiguous-rectangle rule is enforced at runtime. Three tiers, a live display:grid preview, and a clickable areas painter.",
        slug: "grid-builder",
      }}
      examples={
        <>
          <BasicUsage />
          <LivePreviewExample />
        </>
      }
      tiers={
        <>
          <SectionHeader
            className="mt-24"
            eyebrow="types"
            title="Three usage tiers"
            description="From useState-and-go to two strict template-literal validators."
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
