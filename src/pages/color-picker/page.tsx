import { InstallCta } from "@/components/layout/install-cta"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/color-picker/api-reference"
import { BasicUsage } from "@/examples/color-picker/basic-usage"
import { ModeLocked } from "@/examples/color-picker/mode-locked"
import { Native } from "@/examples/color-picker/native"

export function ColorPickerPage() {
  return (
    <>
      <SectionHeader
        eyebrow="component"
        title="Color Picker"
        description="Oklch L×C pad, hue + alpha strips, 6-mode round-trip (oklch, oklab, hex, rgb, hsl, hwb). Three usage tiers from casual to strict."
      />
      <div className="mt-12 space-y-10">
        <BasicUsage />
        <ModeLocked />
        <Native />
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
        description="One command. Resolves button + popover against the shadcn-ui registry automatically."
      />
      <div className="mt-6">
        <InstallCta args="add https://turtiesocks.github.io/ridiculous/r/color-picker.json" />
      </div>
    </>
  )
}
