import { ComponentPage } from "@/components/layout/component-page"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/calc-editor/api-reference"
import { BasicUsage } from "@/examples/calc-editor/basic-usage"
import { FluidTypePlaygroundExample } from "@/examples/calc-editor/fluid-type-playground"
import { TierCasual } from "@/examples/calc-editor/tier-casual"
import { TierIntellisense } from "@/examples/calc-editor/tier-intellisense"
import { TierStrict } from "@/examples/calc-editor/tier-strict"

export default function CalcEditorPage() {
  return (
    <ComponentPage
      meta={{
        title: "Calc Editor",
        description:
          "Edit a CSS math expression — calc(), clamp(), min(), max(), nested — with compile-time DIMENSIONAL ANALYSIS. length ± length ✓, length ± angle ✗, length × length ✗, ÷ by non-number ✗. The strict tier resolves invalid math to never.",
        slug: "calc-editor",
      }}
      examples={
        <>
          <BasicUsage />
          <FluidTypePlaygroundExample />
        </>
      }
      tiers={
        <>
          <SectionHeader
            className="mt-24"
            eyebrow="types"
            title="Three usage tiers"
            description="From useState-and-go to literal-validated dimensional algebra."
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
