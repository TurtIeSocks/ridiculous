import { InstallCta } from "@/components/layout/install-cta"
import { Layout } from "@/components/layout/layout"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/if-function/api-reference"
import { BasicUsage } from "@/examples/if-function/basic-usage"
import { BranchBuilder } from "@/examples/if-function/branch-builder"
import { TierCasual } from "@/examples/if-function/tier-casual"
import { TierIntellisense } from "@/examples/if-function/tier-intellisense"
import { TierStrict } from "@/examples/if-function/tier-strict"

export function IfFunctionPage() {
  return (
    <Layout variant="compact">
      <SectionHeader
        eyebrow="component"
        title="if() Conditional Value"
        description="Edit the CSS if() conditional value function (shipped 2025) with compile-time BRANCH-GRAMMAR validation. if() picks a value from a list of guarded branches: if( <condition> : <value> [ ; … ]* ), where each condition is media(), supports(), or style(), and the final branch may be a bare else. The strict tier validates the if() wrapper (via the kit's ParseFunction), splits the body on TOP-LEVEL semicolons (a local paren-aware splitter — the kit ships none), splits each branch on its FIRST top-level colon (so a colon inside style(--x: 1) is not a split), checks the condition kind, enforces else-as-last-branch, and requires a non-empty value. Condition bodies are validated leniently (non-empty + balanced parens); the runtime parser does fuller structural work. if(foo(x): 1) → never (unknown kind); if(else: a; media(x): b) → never (else not last)."
      />
      <div className="mt-12 space-y-10">
        <BasicUsage />
        <BranchBuilder />
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="types"
        title="Three usage tiers"
        description="From useState-and-go to compile-time branch-grammar validation."
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
        <InstallCta args="add https://turtiesocks.github.io/ridiculous/r/if-function.json" />
      </div>
    </Layout>
  )
}
