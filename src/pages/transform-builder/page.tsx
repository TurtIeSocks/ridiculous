import { ComponentPage } from "@/components/layout/component-page"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/transform-builder/api-reference"
import { BasicUsage } from "@/examples/transform-builder/basic-usage"
import { Preview3DExample } from "@/examples/transform-builder/preview-3d"
import { TierCasual } from "@/examples/transform-builder/tier-casual"
import { TierIntellisense } from "@/examples/transform-builder/tier-intellisense"
import { TierStrict } from "@/examples/transform-builder/tier-strict"

export default function TransformBuilderPage() {
  return (
    <ComponentPage
      meta={{
        title: "Transform Builder",
        description:
          "Edit the CSS transform property — a space-separated list of transform functions — with compile-time FUNCTION-NAME DISPATCH. Each function's name is looked up in a signature table that validates its argument count and every argument's dimension. rotate(10px) → never (wants angle); translateX(45deg) → never (wants length). The strict tier resolves any violation to never.",
        slug: "transform-builder",
      }}
      examples={
        <>
          <BasicUsage />
          <Preview3DExample />
        </>
      }
      tiers={
        <>
          <SectionHeader
            className="mt-24"
            eyebrow="types"
            title="Three usage tiers"
            description="From useState-and-go to per-function unit-typed dispatch."
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
