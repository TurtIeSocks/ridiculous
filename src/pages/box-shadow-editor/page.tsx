import { InstallCta } from "@/components/layout/install-cta"
import { Layout } from "@/components/layout/layout"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/box-shadow-editor/api-reference"
import { BasicUsage } from "@/examples/box-shadow-editor/basic-usage"
import { LivePreviewExample } from "@/examples/box-shadow-editor/live-preview"
import { TierCasual } from "@/examples/box-shadow-editor/tier-casual"
import { TierIntellisense } from "@/examples/box-shadow-editor/tier-intellisense"
import { TierStrict } from "@/examples/box-shadow-editor/tier-strict"

export function BoxShadowEditorPage() {
  return (
    <Layout variant="compact">
      <SectionHeader
        eyebrow="component"
        title="Box Shadow Editor"
        description="Edit the CSS box-shadow property — a comma-separated list of shadow layers — with compile-time PER-LAYER TOKEN VALIDATION. The list splits by comma into layers, each layer splits by space into tokens, and every layer is checked for 2-4 lengths (offset-x, offset-y required; blur non-negative; spread optional), at most one inset keyword (leading or trailing), and at most one trailing color validated against the color-picker ColorLiteral. 0px 4px red → never (bare keyword color); 0px 4px -8px → never (negative blur); #000 0px 4px → never (leading color). The strict tier resolves any violation to never."
      />
      <div className="mt-12 space-y-10">
        <BasicUsage />
        <LivePreviewExample />
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="types"
        title="Three usage tiers"
        description="From useState-and-go to per-layer token-typed validation."
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
        <InstallCta args="add https://turtiesocks.github.io/ridiculous/r/box-shadow-editor.json" />
      </div>
    </Layout>
  )
}
