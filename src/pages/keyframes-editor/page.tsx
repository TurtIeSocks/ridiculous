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
          "Ridiculously typed editor for a CSS @keyframes body — the composition flagship. A two-level type validates each stop selector and dispatches every declaration into its property's own validator (transform, filter, color, easing, …). A timeline embeds the real editors per stop, with a scrubbed preview.",
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
