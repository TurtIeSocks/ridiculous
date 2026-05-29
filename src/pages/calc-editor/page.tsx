import { InstallCta } from "@/components/layout/install-cta"
import { Layout } from "@/components/layout/layout"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/calc-editor/api-reference"
import { BasicUsage } from "@/examples/calc-editor/basic-usage"
import { FluidTypePlaygroundExample } from "@/examples/calc-editor/fluid-type-playground"
import { TierCasual } from "@/examples/calc-editor/tier-casual"
import { TierIntellisense } from "@/examples/calc-editor/tier-intellisense"
import { TierStrict } from "@/examples/calc-editor/tier-strict"

export function CalcEditorPage() {
  return (
    <Layout variant="compact">
      <SectionHeader
        eyebrow="component"
        title="Calc Editor"
        description="Edit a CSS math expression — calc(), clamp(), min(), max(), nested — with compile-time DIMENSIONAL ANALYSIS. length ± length ✓, length ± angle ✗, length × length ✗, ÷ by non-number ✗. The strict tier resolves invalid math to never."
      />
      <div className="mt-12 space-y-10">
        <BasicUsage />
        <FluidTypePlaygroundExample />
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="types"
        title="Three usage tiers"
        description="From useState-and-go to literal-validated dimensional algebra."
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
        <InstallCta args="add https://turtiesocks.github.io/ridiculous/r/calc-editor.json" />
      </div>
    </Layout>
  )
}
