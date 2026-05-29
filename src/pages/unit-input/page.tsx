import { ComponentPage } from "@/components/layout/component-page"
import { ApiReference } from "@/examples/unit-input/api-reference"
import { BasicUsage } from "@/examples/unit-input/basic-usage"
import { Scrub } from "@/examples/unit-input/scrub"
import { StrictTyping } from "@/examples/unit-input/strict-typing"

export default function UnitInputPage() {
  return (
    <ComponentPage
      meta={{
        title: "Unit Input",
        description:
          "CSS-unit input with built-in deg/%/px/rem/em/vw/vh validators, pointer-locked drag scrubbing, and tiered typing tiers from casual to strict.",
        slug: "unit-input",
      }}
      examples={
        <>
          <BasicUsage />
          <Scrub />
          <StrictTyping />
        </>
      }
      apiReference={<ApiReference />}
    />
  )
}
