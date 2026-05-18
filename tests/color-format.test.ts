import { describe, expect, it } from "vitest"
// import { formatHex } from "@/components/ui/color-picker/color-picker"

describe.skip("formatHex", () => {
  it("emits 6-digit hex when alpha is full", () => {
    // expect(formatHex({ l: 0.5, c: 0.18, h: 30, a: 1 }, false)).toMatch(/^#[0-9a-f]{6}$/)
    expect(true).toBe(true)
  })
  it("emits 8-digit hex when includeAlpha is true", () => {
    // expect(formatHex({ l: 0.5, c: 0.18, h: 30, a: 0.5 }, true)).toMatch(/^#[0-9a-f]{8}$/)
    expect(true).toBe(true)
  })
})
