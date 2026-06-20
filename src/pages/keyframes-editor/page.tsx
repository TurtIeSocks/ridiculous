import { ComponentPage } from "@/components/layout/component-page"
import { SectionHeader } from "@/components/layout/section-header"
import { AnimationTimeline } from "@/examples/keyframes-editor/animation-timeline"
import { ApiReference } from "@/examples/keyframes-editor/api-reference"
import { BasicUsage } from "@/examples/keyframes-editor/basic-usage"
import { TierCasual } from "@/examples/keyframes-editor/tier-casual"
import { TierIntellisense } from "@/examples/keyframes-editor/tier-intellisense"
import { TierStrict } from "@/examples/keyframes-editor/tier-strict"

export default function KeyframesEditorPage() {
  return (
    <ComponentPage
      meta={{
        title: "Keyframes Editor",
        description:
          "Edit the body of a CSS @keyframes rule — the ordered list of keyframe blocks (from / to / N% stops, each holding typed property: value declarations) — with compile-time validation. The namesake is a TWO-LEVEL type: KeyframesLiteral<S> validates (a) every <keyframe-selector> block header (from | to | a comma list of <percentage> 0–100) and (b) each declaration's value by dispatching on the property name into that property's OWN ridiculous validator — transform → transform-builder's TransformLiteral, filter / backdrop-filter → filter-builder's FilterLiteral, color / background-color / fill / stroke / … → color-picker's ColorLiteral, *-timing-function → easing-picker's EasingLiteral, opacity → a 0–1 number, length properties → <length-percentage>. It is the registry's composition flagship — the only component whose strict tier delegates to four sibling validators, and whose UI embeds those components' editors per declaration. The visual hero is a 0–100% timeline of draggable stop markers: select a stop and each declaration opens the real typed editor for its property (TransformBuilder, FilterBuilder, ColorPicker, GradientEditor, EasingPicker, UnitInput), while a scrubbed play head interpolates a live preview between the surrounding stops. Unknown properties' values, background / background-image (the gradient editor emits suggestion strings, not a strict literal), !important, and calc() / var() values are deferred to the lenient runtime parser; the UI sorts stops so monotonic ordering is not type-checked.",
        slug: "keyframes-editor",
      }}
      examples={
        <>
          <BasicUsage />
          <AnimationTimeline />
        </>
      }
      tiers={
        <>
          <SectionHeader
            className="mt-24"
            eyebrow="types"
            title="Three usage tiers"
            description="From useState-and-go to a compile-time two-level fold that dispatches each declaration into its property's own validator."
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
