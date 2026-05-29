import { ComponentPage } from "@/components/layout/component-page"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/filter-builder/api-reference"
import { BasicUsage } from "@/examples/filter-builder/basic-usage"
import { LivePreviewExample } from "@/examples/filter-builder/live-preview"
import { TierCasual } from "@/examples/filter-builder/tier-casual"
import { TierIntellisense } from "@/examples/filter-builder/tier-intellisense"
import { TierStrict } from "@/examples/filter-builder/tier-strict"

export default function FilterBuilderPage() {
  return (
    <ComponentPage
      meta={{
        title: "Filter Builder",
        description:
          "Edit the CSS filter / backdrop-filter property — a space-separated list of filter functions — with compile-time FUNCTION-LIST DISPATCH. Each function's name is looked up in a signature table that validates its argument count and every argument's dimension. blur(45deg) → never (wants length); hue-rotate(10px) → never (wants angle); drop-shadow's trailing color is validated against the color-picker ColorLiteral. The strict tier resolves any violation to never.",
        slug: "filter-builder",
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
            description="From useState-and-go to per-function dimension-typed dispatch."
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
