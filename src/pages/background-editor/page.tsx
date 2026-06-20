import { ComponentPage } from "@/components/layout/component-page"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/background-editor/api-reference"
import { BasicUsage } from "@/examples/background-editor/basic-usage"
import { LayerStack } from "@/examples/background-editor/layer-stack"
import { TierCasual } from "@/examples/background-editor/tier-casual"
import { TierIntellisense } from "@/examples/background-editor/tier-intellisense"
import { TierStrict } from "@/examples/background-editor/tier-strict"

export default function BackgroundEditorPage() {
  return (
    <ComponentPage
      meta={{
        title: "Background Editor",
        description:
          "Ridiculously typed editor for the CSS background shorthand. An index-aware fold permits a <color> token only on the final layer, so a color in any earlier layer is a compile error. A reorderable layer stack embeds the real gradient + color pickers over a live composite preview.",
        slug: "background-editor",
      }}
      examples={
        <>
          <BasicUsage />
          <LayerStack />
        </>
      }
      tiers={
        <>
          <SectionHeader
            className="mt-24"
            eyebrow="types"
            title="Three usage tiers"
            description="From useState-and-go to compile-time last-layer-color-invariant validation."
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
