import { ComponentPage } from "@/components/layout/component-page"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/color-function/api-reference"
import { BasicUsage } from "@/examples/color-function/basic-usage"
import { LivePreviewExample } from "@/examples/color-function/live-preview"
import { TierCasual } from "@/examples/color-function/tier-casual"
import { TierIntellisense } from "@/examples/color-function/tier-intellisense"
import { TierStrict } from "@/examples/color-function/tier-strict"

export default function ColorFunctionPage() {
  return (
    <ComponentPage
      meta={{
        title: "Color Function",
        description:
          "Edit the modern CSS color functions — color-mix(), light-dark(), and relative color — with compile-time validation that dispatches on the leading function name. color-mix(in srgb shorter hue, …) → never (hue method on a rectangular space); oklch(from #f00 r g b) → never (rgb channels in an oklch relative color); rgb(255 0 0) → never (a bare color is color-picker's job). The strict tier validates each family's grammar to never on violation.",
        slug: "color-function",
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
            description="From useState-and-go to per-family grammar validation at compile time."
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
