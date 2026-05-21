import { InstallCta } from "@/components/layout/install-cta"
import { Layout } from "@/components/layout/layout"
import { SectionHeader } from "@/components/layout/section-header"
import { ApiReference } from "@/examples/gradient-editor/api-reference"
import { BasicUsage } from "@/examples/gradient-editor/basic-usage"
import { Interpolation } from "@/examples/gradient-editor/interpolation"
import { StopsControl } from "@/examples/gradient-editor/stops-control"
import { TypeLocked } from "@/examples/gradient-editor/type-locked"

export function GradientEditorPage() {
  return (
    <Layout variant="compact">
      <SectionHeader
        eyebrow="component"
        title="Gradient Editor"
        description="Linear / radial / conic gradients with draggable stops, oklch-default interpolation, and color-picker stops via cross-registry composition."
      />
      <div className="mt-12 space-y-10">
        <BasicUsage />
        <TypeLocked />
        <StopsControl />
        <Interpolation />
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
        description="One command. Resolves color-picker + unit-input transitively."
      />
      <div className="mt-6">
        <InstallCta command="npx shadcn add https://turtiesocks.github.io/ridiculous/r/gradient-editor.json" />
      </div>
    </Layout>
  )
}
