import { describe, expect, it } from "vitest"
import { formatHex } from "@/components/ui/color-picker/color-picker"

describe("formatHex", () => {
  it("emits 6-digit hex without alpha", () => {
    const oklch = { l: 0.628, c: 0.258, h: 29.234, a: 1 } // red-ish
    const hex = formatHex(oklch, false)
    expect(hex).toMatch(/^#[0-9a-f]{6}$/)
  })
  it("emits 8-digit hex with alpha", () => {
    const oklch = { l: 0.628, c: 0.258, h: 29.234, a: 0.5 }
    const hex = formatHex(oklch, true)
    expect(hex).toMatch(/^#[0-9a-f]{8}$/)
  })
})
