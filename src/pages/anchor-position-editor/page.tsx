import { ComponentPage } from "@/components/layout/component-page"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/anchor-position-editor/api-reference"
import { BasicUsage } from "@/examples/anchor-position-editor/basic-usage"
import { PlacementGrid } from "@/examples/anchor-position-editor/placement-grid"
import { TierCasual } from "@/examples/anchor-position-editor/tier-casual"
import { TierIntellisense } from "@/examples/anchor-position-editor/tier-intellisense"
import { TierStrict } from "@/examples/anchor-position-editor/tier-strict"

export default function AnchorPositionEditorPage() {
  return (
    <ComponentPage
      meta={{
        title: "Anchor Position Editor",
        description:
          "Ridiculously typed editor for CSS anchor positioning (mode prop). The strict tier enforces the position-area cross-axis rule — a keyword pair must sit on two different axes of the same coordinate system. The hero is a clickable 3×3 placement grid with a live snap preview.",
        slug: "anchor-position-editor",
      }}
      examples={
        <>
          <BasicUsage />
          <PlacementGrid />
        </>
      }
      tiers={
        <>
          <SectionHeader
            className="mt-24"
            eyebrow="types"
            title="Three usage tiers"
            description="From useState-and-go to compile-time cross-axis-grammar validation."
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
