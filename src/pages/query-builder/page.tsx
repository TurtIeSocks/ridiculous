import { InstallCta } from "@/components/layout/install-cta"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/query-builder/api-reference"
import { BasicUsage } from "@/examples/query-builder/basic-usage"
import { ConditionBuilder } from "@/examples/query-builder/condition-builder"
import { TierCasual } from "@/examples/query-builder/tier-casual"
import { TierIntellisense } from "@/examples/query-builder/tier-intellisense"
import { TierStrict } from "@/examples/query-builder/tier-strict"

export function QueryBuilderPage() {
  return (
    <>
      <SectionHeader
        eyebrow="component"
        title="Media / Container Query Builder"
        description="Edit CSS media queries AND container queries with compile-time STRUCTURE + FEATURE-VALUE validation. A mode prop ('media' | 'container') selects the dialect. The strict tier validates the optional leading modifier + media-type (only/not all|screen|print) or container name, the boolean combination of parenthesized feature tests — enforcing the CSS no-mixing-and-and-or-at-one-level rule — and each feature test's VALUE dimension against a known feature table: length features want a <length>, resolution features a <resolution>, aspect-ratio a <ratio> like 16/9, and enum features one of their keywords (orientation → portrait|landscape, pointer → none|coarse|fine, …). (width: 16/9) → never; (min-resolution: 600px) → never; (a) and (b) or (c) → never (mixes and/or). Container mode restricts the feature set to the size subset (width, height, inline-size, block-size, aspect-ratio) + orientation. Unknown/exotic features, calc() values, and deep nesting past a depth cap are deferred to the runtime parser (lenient by design)."
      />
      <div className="mt-12 space-y-10">
        <BasicUsage />
        <ConditionBuilder />
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="types"
        title="Three usage tiers"
        description="From useState-and-go to compile-time query-grammar validation."
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
        <InstallCta args="add https://turtiesocks.github.io/ridiculous/r/query-builder.json" />
      </div>
    </>
  )
}
