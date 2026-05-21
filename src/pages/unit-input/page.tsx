import { InstallCta } from "@/components/layout/install-cta"
import { Layout } from "@/components/layout/layout"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/unit-input/api-reference"
import { BasicUsage } from "@/examples/unit-input/basic-usage"
import { Scrub } from "@/examples/unit-input/scrub"
import { StrictTyping } from "@/examples/unit-input/strict-typing"

export function UnitInputPage() {
  return (
    <Layout variant="compact">
      <SectionHeader
        eyebrow="component"
        title="Unit Input"
        description="CSS-unit input with built-in deg/%/px/rem/em/vw/vh validators, pointer-locked drag scrubbing, and tiered typing tiers from casual to strict."
      />
      <div className="mt-12 space-y-10">
        <BasicUsage />
        <Scrub />
        <StrictTyping />
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
        <InstallCta args="add https://turtiesocks.github.io/ridiculous/r/unit-input.json" />
      </div>
    </Layout>
  )
}
