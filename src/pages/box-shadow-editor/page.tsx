import { ComponentPage } from "@/components/layout/component-page"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/box-shadow-editor/api-reference"
import { BasicUsage } from "@/examples/box-shadow-editor/basic-usage"
import { LivePreviewExample } from "@/examples/box-shadow-editor/live-preview"
import { TierCasual } from "@/examples/box-shadow-editor/tier-casual"
import { TierIntellisense } from "@/examples/box-shadow-editor/tier-intellisense"
import { TierStrict } from "@/examples/box-shadow-editor/tier-strict"

export default function BoxShadowEditorPage() {
  return (
    <ComponentPage
      meta={{
        title: "Box Shadow Editor",
        description:
          "Edit the CSS box-shadow property — a comma-separated list of shadow layers — with compile-time PER-LAYER TOKEN VALIDATION. The list splits by comma into layers, each layer splits by space into tokens, and every layer is checked for 2-4 lengths (offset-x, offset-y required; blur non-negative; spread optional), at most one inset keyword (leading or trailing), and at most one trailing color validated against the color-picker ColorLiteral. 0px 4px red → never (bare keyword color); 0px 4px -8px → never (negative blur); #000 0px 4px → never (leading color). The strict tier resolves any violation to never.",
        slug: "box-shadow-editor",
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
            description="From useState-and-go to per-layer token-typed validation."
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
