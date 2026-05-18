import { describe, expect, it } from "vitest"
import { splitTopLevelCommas } from "@/components/ui/gradient-editor/gradient-editor"

describe("splitTopLevelCommas", () => {
  it("splits a flat list", () => {
    expect(splitTopLevelCommas("a, b, c")).toEqual(["a", "b", "c"])
  })
  it("does NOT split commas inside parens", () => {
    expect(splitTopLevelCommas("rgb(1, 2, 3), oklch(0.5 0.1 240 / 50%)")).toEqual([
      "rgb(1, 2, 3)",
      "oklch(0.5 0.1 240 / 50%)",
    ])
  })
  it("handles nested parens", () => {
    expect(splitTopLevelCommas("calc(min(1px, 2px) + 3px), foo")).toEqual([
      "calc(min(1px, 2px) + 3px)",
      "foo",
    ])
  })
  it("trims whitespace around segments", () => {
    expect(splitTopLevelCommas("  a  ,  b  ")).toEqual(["a", "b"])
  })
  it("returns a single segment when no commas at top level", () => {
    expect(splitTopLevelCommas("rgb(1, 2, 3)")).toEqual(["rgb(1, 2, 3)"])
  })
  it("handles empty input", () => {
    expect(splitTopLevelCommas("")).toEqual([])
  })
})
