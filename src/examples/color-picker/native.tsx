"use client"

import { useState } from "react"
import { ColorPicker } from "@/components/ui/color-picker"
import { CopyButton } from "@/examples/_shared/copy-button"
import { ExampleCard } from "@/examples/_shared/example-card"
import { ValueReadout } from "@/examples/_shared/value-readout"

export function Native() {
  const [color, setColor] = useState("#ff0000")
  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="native"
      title="Native Variant"
      description={
        <>
          Falls back to the browser&apos;s{" "}
          <code className="text-foreground">
            &lt;input type=&quot;color&quot;&gt;
          </code>
          . sRGB-only, no alpha — wide-gamut and transparent values lose
          information on edit.
        </>
      }
    >
      <div className="mt-6 flex items-center gap-3">
        <ColorPicker native value={color} onChange={setColor} />
        <ValueReadout value={color} size="md" />
        <CopyButton value={color} label="Copy color" />
      </div>
    </ExampleCard>
  )
}
