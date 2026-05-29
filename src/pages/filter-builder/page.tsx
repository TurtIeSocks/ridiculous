import { InstallCta } from "@/components/layout/install-cta"
import { Layout } from "@/components/layout/layout"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/filter-builder/api-reference"
import { BasicUsage } from "@/examples/filter-builder/basic-usage"
import { LivePreviewExample } from "@/examples/filter-builder/live-preview"
import { TierCasual } from "@/examples/filter-builder/tier-casual"
import { TierIntellisense } from "@/examples/filter-builder/tier-intellisense"
import { TierStrict } from "@/examples/filter-builder/tier-strict"

export function FilterBuilderPage() {
  return (
    <Layout variant="compact">
      <SectionHeader
        eyebrow="component"
        title="Filter Builder"
        description="Edit the CSS filter / backdrop-filter property — a space-separated list of filter functions — with compile-time FUNCTION-LIST DISPATCH. Each function's name is looked up in a signature table that validates its argument count and every argument's dimension. blur(45deg) → never (wants length); hue-rotate(10px) → never (wants angle); drop-shadow's trailing color is validated against the color-picker ColorLiteral. The strict tier resolves any violation to never."
      />
      <div className="mt-12 space-y-10">
        <BasicUsage />
        <LivePreviewExample />
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="types"
        title="Three usage tiers"
        description="From useState-and-go to per-function dimension-typed dispatch."
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
        <InstallCta args="add https://turtiesocks.github.io/ridiculous/r/filter-builder.json" />
      </div>
    </Layout>
  )
}
