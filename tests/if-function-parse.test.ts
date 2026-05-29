import { describe, expect, it } from "vitest"
import {
  branchCount,
  defaultBranch,
  parseIf,
} from "@/components/ui/if-function/if-function.helpers"

describe("parseIf — accept", () => {
  it("parses a single media() branch", () => {
    expect(parseIf("if(media(width >= 800px): red)")).toEqual([
      { kind: "media", condition: "width >= 800px", value: "red" },
    ])
  })

  it("parses a supports() branch", () => {
    expect(parseIf("if(supports(display: grid): grid)")).toEqual([
      { kind: "supports", condition: "display: grid", value: "grid" },
    ])
  })

  it("parses a style() branch (colon inside style is not a branch split)", () => {
    expect(parseIf("if(style(--x: 1): 2px)")).toEqual([
      { kind: "style", condition: "--x: 1", value: "2px" },
    ])
  })

  it("parses a media branch + trailing else", () => {
    expect(parseIf("if(media(width >= 800px): red; else: blue)")).toEqual([
      { kind: "media", condition: "width >= 800px", value: "red" },
      { kind: "else", condition: "", value: "blue" },
    ])
  })

  it("parses a three-branch list", () => {
    expect(
      parseIf(
        "if(media(width >= 800px): red; supports(color: oklch(0 0 0)): green; else: blue)",
      ),
    ).toEqual([
      { kind: "media", condition: "width >= 800px", value: "red" },
      { kind: "supports", condition: "color: oklch(0 0 0)", value: "green" },
      { kind: "else", condition: "", value: "blue" },
    ])
  })

  it("keeps a value containing parens verbatim", () => {
    expect(parseIf("if(media(width >= 800px): rgb(1 2 3))")).toEqual([
      { kind: "media", condition: "width >= 800px", value: "rgb(1 2 3)" },
    ])
  })

  it("tolerates a trailing semicolon", () => {
    expect(parseIf("if(else: red;)")).toEqual([
      { kind: "else", condition: "", value: "red" },
    ])
  })

  it("tolerates an interior empty branch (dropped)", () => {
    expect(parseIf("if(media(a >= 1px): 1;; else: 2)")).toEqual([
      { kind: "media", condition: "a >= 1px", value: "1" },
      { kind: "else", condition: "", value: "2" },
    ])
  })

  it("trims surrounding whitespace", () => {
    expect(parseIf("  if(media(width >= 1px): red)  ")).toEqual([
      { kind: "media", condition: "width >= 1px", value: "red" },
    ])
  })
})

describe("parseIf — reject (null)", () => {
  it("rejects a non-if wrapper", () => {
    expect(parseIf("calc(1px + 2px)")).toBeNull()
  })

  it("rejects an empty body", () => {
    expect(parseIf("if()")).toBeNull()
  })

  it("rejects a body of only semicolons", () => {
    expect(parseIf("if(;;)")).toBeNull()
  })

  it("rejects a branch with no top-level colon", () => {
    expect(parseIf("if(media(width >= 1px) red)")).toBeNull()
  })

  it("rejects an empty value", () => {
    expect(parseIf("if(media(width >= 1px): )")).toBeNull()
  })

  it("rejects an unknown condition kind", () => {
    expect(parseIf("if(foo(x): 1)")).toBeNull()
  })

  it("rejects else when it is not the last branch", () => {
    expect(parseIf("if(else: a; media(width >= 1px): b)")).toBeNull()
  })

  it("rejects an unbalanced wrapper", () => {
    expect(parseIf("if(media(width >= 1px: red")).toBeNull()
  })

  it("rejects an unbalanced condition body", () => {
    expect(parseIf("if(media(calc(1px): red)")).toBeNull()
  })

  it("rejects an empty condition body", () => {
    expect(parseIf("if(media(): red)")).toBeNull()
  })

  it("rejects else with a body (else takes no parens)", () => {
    expect(parseIf("if(else(x): red)")).toBeNull()
  })
})

describe("branchCount", () => {
  it("counts the branches", () => {
    expect(branchCount("if(media(a >= 1px): 1; else: 2)")).toBe(2)
    expect(branchCount("if(style(--x: 1): 2px)")).toBe(1)
  })

  it("is 0 for an invalid value", () => {
    expect(branchCount("if()")).toBe(0)
    expect(branchCount("nope")).toBe(0)
  })
})

describe("defaultBranch", () => {
  it("defaults to a valid media branch", () => {
    expect(defaultBranch()).toEqual({
      kind: "media",
      condition: "width >= 600px",
      value: "red",
    })
  })

  it("seeds each kind with a valid condition", () => {
    expect(defaultBranch("supports").condition).toBe("display: grid")
    expect(defaultBranch("style").condition).toBe("--x: 1")
    expect(defaultBranch("else").condition).toBe("")
  })
})
