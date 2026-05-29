import { InstallCta } from "@/components/layout/install-cta"
import { Layout } from "@/components/layout/layout"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/font-editor/api-reference"
import { BasicUsage } from "@/examples/font-editor/basic-usage"
import { LivePreviewExample } from "@/examples/font-editor/live-preview"
import { TierCasual } from "@/examples/font-editor/tier-casual"
import { TierIntellisense } from "@/examples/font-editor/tier-intellisense"
import { TierStrict } from "@/examples/font-editor/tier-strict"

export function FontEditorPage() {
  return (
    <Layout variant="compact">
      <SectionHeader
        eyebrow="component"
        title="Font Editor"
        description="Edit the CSS font shorthand — the most order-sensitive of the common shorthands — with a compile-time STRICT-ORDER PARSE. Order-free prefix tokens (style, variant, weight, stretch — each at most once), then a mandatory size, an optional / line-height, then a mandatory comma-separated family list. Or a system-font keyword as the whole value. 16px → never (no family); italic oblique 16px serif → never (two styles). The strict tier resolves any order or structure violation to never."
      />
      <div className="mt-12 space-y-10">
        <BasicUsage />
        <LivePreviewExample />
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="types"
        title="Three usage tiers"
        description="From useState-and-go to a full ordered-grammar parse at compile time."
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
        <InstallCta args="add https://turtiesocks.github.io/ridiculous/r/font-editor.json" />
      </div>
    </Layout>
  )
}
