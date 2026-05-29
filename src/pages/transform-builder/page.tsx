import { InstallCta } from "@/components/layout/install-cta"
import { Layout } from "@/components/layout/layout"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/transform-builder/api-reference"
import { BasicUsage } from "@/examples/transform-builder/basic-usage"
import { Preview3DExample } from "@/examples/transform-builder/preview-3d"
import { TierCasual } from "@/examples/transform-builder/tier-casual"
import { TierIntellisense } from "@/examples/transform-builder/tier-intellisense"
import { TierStrict } from "@/examples/transform-builder/tier-strict"

export function TransformBuilderPage() {
  return (
    <Layout variant="compact">
      <SectionHeader
        eyebrow="component"
        title="Transform Builder"
        description="Edit the CSS transform property — a space-separated list of transform functions — with compile-time FUNCTION-NAME DISPATCH. Each function's name is looked up in a signature table that validates its argument count and every argument's dimension. rotate(10px) → never (wants angle); translateX(45deg) → never (wants length). The strict tier resolves any violation to never."
      />
      <div className="mt-12 space-y-10">
        <BasicUsage />
        <Preview3DExample />
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="types"
        title="Three usage tiers"
        description="From useState-and-go to per-function unit-typed dispatch."
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
        <InstallCta args="add https://turtiesocks.github.io/ridiculous/r/transform-builder.json" />
      </div>
    </Layout>
  )
}
