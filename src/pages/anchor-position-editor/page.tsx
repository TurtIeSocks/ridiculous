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
          "Edit CSS anchor-positioning values with compile-time grammar validation. A mode prop ('position-area' | 'anchor' | 'position-try', default 'position-area') selects the dialect. The namesake is the cross-axis rule: the strict tier validates that a position-area keyword pair sits on two DIFFERENT axes of the SAME coordinate system — rejecting both same-axis pairs (top bottom → never) and physical↔logical mixes (left block-start → never), a positional-tuple constraint new to the registry. anchor mode validates the anchor()/anchor-size() function name, side/size keyword, and <length-percentage> fallback (anchor(top, red) → never); position-try mode validates each comma-separated fallback (none | a position-area | a dashed-ident + try-tactic), so flip-diagonal → never. The visual hero is a clickable 3×3 placement grid with logical/physical + span toggles and a live snap preview that edits one coordinate system at a time — guaranteeing the cross-axis rule by construction in the UI. The ambiguous start/end keywords (axis depends on writing-mode), <dashed-ident> grammar beyond the -- prefix, and calc()/var() fallbacks are deferred to the lenient runtime parser.",
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
