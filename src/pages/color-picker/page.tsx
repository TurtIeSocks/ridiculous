import { ComponentPage } from "@/components/layout/component-page"
import { ApiReference } from "@/examples/color-picker/api-reference"
import { BasicUsage } from "@/examples/color-picker/basic-usage"
import { ModeLocked } from "@/examples/color-picker/mode-locked"
import { Native } from "@/examples/color-picker/native"

export default function ColorPickerPage() {
  return (
    <ComponentPage
      meta={{
        title: "Color Picker",
        description:
          "Oklch L×C pad, hue + alpha strips, 6-mode round-trip (oklch, oklab, hex, rgb, hsl, hwb). Three usage tiers from casual to strict.",
        slug: "color-picker",
      }}
      examples={
        <>
          <BasicUsage />
          <ModeLocked />
          <Native />
        </>
      }
      apiReference={<ApiReference />}
      installDescription="One command. Resolves button + popover against the shadcn-ui registry automatically."
    />
  )
}
