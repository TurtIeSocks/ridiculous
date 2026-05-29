import { ComponentPage } from "@/components/layout/component-page"
import { ApiReference } from "@/examples/easing-picker/api-reference"
import { EasingPlayground } from "@/examples/easing-picker/playground"
import { SubComponentBezierExample } from "@/examples/easing-picker/sub-component-bezier"
import { SubComponentSpringExample } from "@/examples/easing-picker/sub-component-spring"
import { TypeLockedExample } from "@/examples/easing-picker/type-locked"

export default function EasingPickerPage() {
  return (
    <ComponentPage
      meta={{
        title: "Easing Picker",
        description:
          "CSS easing function picker — bezier canvas, spring/bounce/wiggle physics baked to linear(), polynomial preset gallery, 6-property animation preview, 3-format output (CSS/Tailwind v3/v4).",
        slug: "easing-picker",
      }}
      examples={
        <>
          <EasingPlayground />
          <TypeLockedExample />
          <SubComponentBezierExample />
          <SubComponentSpringExample />
        </>
      }
      apiReference={<ApiReference />}
    />
  )
}
