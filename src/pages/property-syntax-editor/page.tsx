import { ComponentPage } from "@/components/layout/component-page"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/property-syntax-editor/api-reference"
import { BasicUsage } from "@/examples/property-syntax-editor/basic-usage"
import { DependentInitialValue } from "@/examples/property-syntax-editor/dependent-initial-value"
import { TierCasual } from "@/examples/property-syntax-editor/tier-casual"
import { TierIntellisense } from "@/examples/property-syntax-editor/tier-intellisense"
import { TierStrict } from "@/examples/property-syntax-editor/tier-strict"

export default function PropertySyntaxEditorPage() {
  return (
    <ComponentPage
      meta={{
        title: "@property Syntax Editor",
        description:
          'Ridiculously typed editor for the CSS @property syntax: descriptor. The namesake types one CSS string with another — InitialValueLiteral<Syntax, V> checks an initial-value against the validated syntax, so cssProperty("<length>", "red") is a compile error. A chip builder sits beside a live green/red demo.',
        slug: "property-syntax-editor",
      }}
      examples={
        <>
          <BasicUsage />
          <DependentInitialValue />
        </>
      }
      tiers={
        <>
          <SectionHeader
            className="mt-24"
            eyebrow="types"
            title="Three usage tiers"
            description="From useState-and-go to one CSS string typing another at compile time."
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
