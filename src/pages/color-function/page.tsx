import { InstallCta } from "@/components/layout/install-cta"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/color-function/api-reference"
import { BasicUsage } from "@/examples/color-function/basic-usage"
import { LivePreviewExample } from "@/examples/color-function/live-preview"
import { TierCasual } from "@/examples/color-function/tier-casual"
import { TierIntellisense } from "@/examples/color-function/tier-intellisense"
import { TierStrict } from "@/examples/color-function/tier-strict"

export function ColorFunctionPage() {
  return (
    <>
      <SectionHeader
        eyebrow="component"
        title="Color Function"
        description="Edit the modern CSS color functions — color-mix(), light-dark(), and relative color — with compile-time validation that dispatches on the leading function name. color-mix(in srgb shorter hue, …) → never (hue method on a rectangular space); oklch(from #f00 r g b) → never (rgb channels in an oklch relative color); rgb(255 0 0) → never (a bare color is color-picker's job). The strict tier validates each family's grammar to never on violation."
      />
      <div className="mt-12 space-y-10">
        <BasicUsage />
        <LivePreviewExample />
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="types"
        title="Three usage tiers"
        description="From useState-and-go to per-family grammar validation at compile time."
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
        <InstallCta args="add https://turtiesocks.github.io/ridiculous/r/color-function.json" />
      </div>
    </>
  )
}
