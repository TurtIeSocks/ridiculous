import { describe, expect, it } from "vitest"
import { formatStop } from "@/components/ui/gradient-editor/gradient-editor"

describe("formatStop", () => {
  it("emits color + integer percent", () => {
    expect(formatStop({ color: "#ff0000", position: 50 })).toBe("#ff0000 50%")
  })
  it("rounds fractional positions to integer", () => {
    expect(formatStop({ color: "#ff0000", position: 33.7 })).toBe("#ff0000 34%")
  })
})
