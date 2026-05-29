import { describe, expect, it } from "vitest"
import {
  branchToCss,
  formatIf,
  parseIf,
} from "@/components/ui/if-function/if-function.helpers"
import type { IfBranch } from "@/components/ui/if-function/if-function.types"

describe("branchToCss", () => {
  it("serializes a media branch", () => {
    expect(
      branchToCss({ kind: "media", condition: "width >= 800px", value: "red" }),
    ).toBe("media(width >= 800px): red")
  })

  it("serializes a supports branch", () => {
    expect(
      branchToCss({
        kind: "supports",
        condition: "display: grid",
        value: "grid",
      }),
    ).toBe("supports(display: grid): grid")
  })

  it("serializes a style branch", () => {
    expect(
      branchToCss({ kind: "style", condition: "--x: 1", value: "2px" }),
    ).toBe("style(--x: 1): 2px")
  })

  it("serializes an else branch without parens", () => {
    expect(branchToCss({ kind: "else", condition: "", value: "blue" })).toBe(
      "else: blue",
    )
  })
})

describe("formatIf", () => {
  it("wraps a single branch in if(...)", () => {
    expect(
      formatIf([{ kind: "media", condition: "width >= 1px", value: "red" }]),
    ).toBe("if(media(width >= 1px): red)")
  })

  it("joins branches with '; '", () => {
    expect(
      formatIf([
        { kind: "media", condition: "width >= 800px", value: "red" },
        { kind: "else", condition: "", value: "blue" },
      ]),
    ).toBe("if(media(width >= 800px): red; else: blue)")
  })

  it("formats an empty branch list as if()", () => {
    expect(formatIf([])).toBe("if()")
  })
})

describe("round-trip parseIf ∘ formatIf", () => {
  const cases: IfBranch[][] = [
    [{ kind: "media", condition: "width >= 800px", value: "red" }],
    [
      { kind: "supports", condition: "display: grid", value: "grid" },
      { kind: "else", condition: "", value: "block" },
    ],
    [
      { kind: "media", condition: "width >= 800px", value: "red" },
      { kind: "style", condition: "--x: 1", value: "2px" },
      { kind: "else", condition: "", value: "blue" },
    ],
  ]

  it.each(cases)("round-trips branch list %#", (...branches) => {
    const list = branches as IfBranch[]
    const formatted = formatIf(list)
    expect(parseIf(formatted)).toEqual(list)
  })

  it("re-parses to a stable string (idempotent format)", () => {
    const src = "if(media(width >= 800px): red; else: blue)"
    const parsed = parseIf(src)
    expect(parsed).not.toBeNull()
    if (parsed !== null) expect(formatIf(parsed)).toBe(src)
  })
})
