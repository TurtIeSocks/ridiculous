import { InstallCta } from "@/components/layout/install-cta"
import { Layout } from "@/components/layout/layout"
import { SectionHeader } from "@/components/layout/section-header"
import { EasingPlayground } from "@/examples/easing-picker/playground"
import { SubComponentBezierExample } from "@/examples/easing-picker/sub-component-bezier"
import { SubComponentSpringExample } from "@/examples/easing-picker/sub-component-spring"
import { TypeLockedExample } from "@/examples/easing-picker/type-locked"

export function EasingPickerPage() {
  return (
    <Layout variant="compact">
      <SectionHeader
        eyebrow="component"
        title="Easing Picker"
        description="CSS easing function picker — bezier canvas, spring/bounce/wiggle physics baked to linear(), polynomial preset gallery, 6-property animation preview, 3-format output (CSS/Tailwind v3/v4)."
      />
      <div className="mt-12 space-y-10">
        <EasingPlayground />
        <TypeLockedExample />
        <SubComponentBezierExample />
        <SubComponentSpringExample />
      </div>

      <SectionHeader
        className="mt-24"
        eyebrow="install"
        title="Drop it in"
        description="One command via the shadcn CLI."
      />
      <div className="mt-6">
        <InstallCta command="npx shadcn add https://turtiesocks.github.io/ridiculous/r/easing-picker.json" />
      </div>
    </Layout>
  )
}
