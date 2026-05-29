import { ComponentPage } from "@/components/layout/component-page"
import { ApiReference } from "@/examples/gradient-editor/api-reference"
import { BasicUsage } from "@/examples/gradient-editor/basic-usage"
import { Interpolation } from "@/examples/gradient-editor/interpolation"
import { StopsControl } from "@/examples/gradient-editor/stops-control"
import { TypeLocked } from "@/examples/gradient-editor/type-locked"

export default function GradientEditorPage() {
  return (
    <ComponentPage
      meta={{
        title: "Gradient Editor",
        description:
          "Linear / radial / conic gradients with draggable stops, oklch-default interpolation, and color-picker stops via cross-registry composition.",
        slug: "gradient-editor",
      }}
      examples={
        <>
          <BasicUsage />
          <TypeLocked />
          <StopsControl />
          <Interpolation />
        </>
      }
      apiReference={<ApiReference />}
      installDescription="One command. Resolves color-picker + unit-input transitively."
    />
  )
}
