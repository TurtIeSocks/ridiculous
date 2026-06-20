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
          "Edit the CSS background shorthand — a comma-stacked list of layers painted back-to-front, each carrying an image (a gradient or url()), a position with an optional / <size>, and repeat / attachment / origin / clip keywords — with compile-time grammar validation. The namesake is the index-aware last-layer-color invariant: BackgroundLiteral<S> splits the value into comma-stacked layers and folds them with a head/tail recursion that KNOWS WHEN IT IS AT THE LAST LAYER, permitting a <color> token ONLY there — so a color in any non-final layer resolves to never (#f00 center, url(x.png) → never), a positional-list constraint new to the registry. Colors use color-picker forms (#f00 / oklch(…), not named colors) and the / between position and size is space-separated. The visual hero is a reorderable layer stack that embeds the real GradientEditor per layer, a 2D crosshair position pad, and final-layer-only ColorPicker over a live composite preview tile — and the color always re-homes onto whichever layer is last after a reorder. Per-layer token validation is membership-based and order-free: the || ordering / cardinality, gradient internals, and calc()/var() values defer to the lenient runtime parser, with the embedded GradientEditor validating gradients in the UI.",
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
