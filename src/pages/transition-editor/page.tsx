import { InstallCta } from "@/components/layout/install-cta"
import { Layout } from "@/components/layout/layout"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/transition-editor/api-reference"
import { BasicUsage } from "@/examples/transition-editor/basic-usage"
import { LivePreviewExample } from "@/examples/transition-editor/live-preview"
import { TierCasual } from "@/examples/transition-editor/tier-casual"
import { TierIntellisense } from "@/examples/transition-editor/tier-intellisense"
import { TierStrict } from "@/examples/transition-editor/tier-strict"

export function TransitionEditorPage() {
  return (
    <Layout variant="compact">
      <SectionHeader
        eyebrow="component"
        title="Transition + Animation Editor"
        description="Edit the CSS transition AND animation shorthands — both comma-separated layer lists — with compile-time PER-LAYER TOKEN-KIND CLASSIFICATION. A mode prop picks the shorthand. The list splits by comma into layers, each layer splits by space into tokens, and every token is classified by KIND with a per-kind cardinality cap (tokens are order-independent within a layer). Transition layers: ≤2 <time> (duration, delay), ≤1 <easing-function>, ≤1 <property>, ≤1 allow-discrete. Animation layers: ≤2 <time>, ≤1 easing, ≤1 iteration-count, ≤1 direction, ≤1 fill-mode, ≤1 play-state, ≤1 <keyframes-name>. The <easing-function> token reuses easing-picker's EasingLiteral. opacity 200ms 100ms 50ms ease → never (3 times); spin 1s 2 3 → never (2 iteration counts). The strict tier resolves any violation to never; the runtime parser is tolerant."
      />
      <div className="mt-12 space-y-10">
        <BasicUsage />
        <LivePreviewExample />
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="types"
        title="Three usage tiers"
        description="From useState-and-go to per-layer token-kind validation."
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
        <InstallCta args="add https://turtiesocks.github.io/ridiculous/r/transition-editor.json" />
      </div>
    </Layout>
  )
}
