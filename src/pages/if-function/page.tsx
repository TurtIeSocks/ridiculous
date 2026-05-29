import { ComponentPage } from "@/components/layout/component-page"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/if-function/api-reference"
import { BasicUsage } from "@/examples/if-function/basic-usage"
import { BranchBuilder } from "@/examples/if-function/branch-builder"
import { TierCasual } from "@/examples/if-function/tier-casual"
import { TierIntellisense } from "@/examples/if-function/tier-intellisense"
import { TierStrict } from "@/examples/if-function/tier-strict"

export default function IfFunctionPage() {
  return (
    <ComponentPage
      meta={{
        title: "if() Conditional Value",
        description:
          "Edit the CSS if() conditional value function (shipped 2025) with compile-time BRANCH-GRAMMAR validation. if() picks a value from a list of guarded branches: if( <condition> : <value> [ ; … ]* ), where each condition is media(), supports(), or style(), and the final branch may be a bare else. The strict tier validates the if() wrapper (via the kit's ParseFunction), splits the body on TOP-LEVEL semicolons (a local paren-aware splitter — the kit ships none), splits each branch on its FIRST top-level colon (so a colon inside style(--x: 1) is not a split), checks the condition kind, enforces else-as-last-branch, and requires a non-empty value. Condition bodies are validated leniently (non-empty + balanced parens); the runtime parser does fuller structural work. if(foo(x): 1) → never (unknown kind); if(else: a; media(x): b) → never (else not last).",
        slug: "if-function",
      }}
      examples={
        <>
          <BasicUsage />
          <BranchBuilder />
        </>
      }
      tiers={
        <>
          <SectionHeader
            className="mt-24"
            eyebrow="types"
            title="Three usage tiers"
            description="From useState-and-go to compile-time branch-grammar validation."
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
