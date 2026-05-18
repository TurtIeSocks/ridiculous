import { describe, expect, it } from "vitest"
import { parseHex } from "@/components/ui/color-picker/color-picker"

describe("parseHex", () => {
  it("parses 6-digit hex", () => {
    expect(parseHex("#ff0000")).toEqual({ r: 1, g: 0, b: 0, a: 1 })
    expect(parseHex("#00ff00")).toEqual({ r: 0, g: 1, b: 0, a: 1 })
    expect(parseHex("#0000ff")).toEqual({ r: 0, g: 0, b: 1, a: 1 })
  })
  it("parses 3-digit hex by doubling chars", () => {
    expect(parseHex("#f00")).toEqual({ r: 1, g: 0, b: 0, a: 1 })
    expect(parseHex("#0f0")).toEqual({ r: 0, g: 1, b: 0, a: 1 })
  })
  it("parses 8-digit hex with alpha", () => {
    expect(parseHex("#ff000080")).toEqual({
      r: 1,
      g: 0,
      b: 0,
      a: expect.closeTo(0.5019, 3),
    })
  })
  it("parses 4-digit hex with alpha", () => {
    expect(parseHex("#f008")).toEqual({
      r: 1,
      g: 0,
      b: 0,
      a: expect.closeTo(0.5333, 3),
    })
  })
  it("returns null for invalid", () => {
    expect(parseHex("#zzz")).toBeNull()
    expect(parseHex("ff0000")).toBeNull()
    expect(parseHex("#ff")).toBeNull()
    expect(parseHex("")).toBeNull()
  })
})
