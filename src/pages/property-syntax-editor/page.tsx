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
          'Edit a CSS @property syntax: descriptor — the meta type-grammar that declares what values a registered custom property accepts ("<length>+", "<color>", "<length> | auto", "*") — with compile-time validation. The namesake spectacle is ONE CSS string typing another: the dependent validator InitialValueLiteral<Syntax, V> checks a candidate initial-value V against an already-validated Syntax, and the call-site helper cssProperty(syntax, initialValue) type-checks ONLY when the initial value satisfies the declared syntax (cssProperty("<length>", "red") → never). The controlled value is the syntax string; the panel\'s initial-value field is a live demo of the dependency that turns green/red in real time as matchesSyntax runs. The strict tier validates the full <syntax> grammar (universal *, | alternation, +/# multipliers, known data types, literal idents) and the initial-value against the syntax for the dimensional types, <color> (deferred to color-picker\'s ColorLiteral — color-picker forms like #ff0000 / oklch(...), not the 148 named colors), idents, alternation, and multipliers. <integer> is checked as <number> at the type level; <image>/<url>/<transform-*> and calc()/var() initial values defer to the lenient runtime parser.',
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
