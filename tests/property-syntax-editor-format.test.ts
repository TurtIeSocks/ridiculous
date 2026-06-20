import { describe, expect, test } from "vitest"
import {
  formatSyntax,
  matchesSyntax,
  parseSyntax,
} from "@/components/ui/property-syntax-editor/property-syntax-editor.helpers"
import type { SyntaxComponent } from "@/components/ui/property-syntax-editor/property-syntax-editor.types"

const comp = (
  base: string,
  isType: boolean,
  multiplier: SyntaxComponent["multiplier"] = "",
): SyntaxComponent => ({ base, isType, multiplier })

// ===========================================================================
// formatSyntax — (universal, components) → string
// ===========================================================================

describe("formatSyntax", () => {
  test("the universal `*` ignores components", () => {
    expect(formatSyntax(true, [])).toBe("*")
    expect(formatSyntax(true, [comp("<length>", true)])).toBe("*")
  })

  test("a single data-type component", () => {
    expect(formatSyntax(false, [comp("<length>", true)])).toBe("<length>")
  })

  test("a `+` multiplier", () => {
    expect(formatSyntax(false, [comp("<length>", true, "+")])).toBe("<length>+")
  })

  test("a `#` multiplier", () => {
    expect(formatSyntax(false, [comp("<color>", true, "#")])).toBe("<color>#")
  })

  test("a literal ident", () => {
    expect(formatSyntax(false, [comp("auto", false)])).toBe("auto")
  })

  test("an alternation joins with ` | `", () => {
    expect(
      formatSyntax(false, [comp("<length>", true), comp("auto", false)]),
    ).toBe("<length> | auto")
  })

  test("no components yields the empty string", () => {
    expect(formatSyntax(false, [])).toBe("")
  })

  // --- round-trip ---------------------------------------------------------

  test.each([
    "*",
    "<length>",
    "<length>+",
    "<color>#",
    "auto",
    "<length> | auto",
    "<color> | <length>#",
  ])("round-trips %s through parseSyntax", (src) => {
    const parsed = parseSyntax(src)
    expect(parsed.error).toBeNull()
    expect(formatSyntax(parsed.universal, parsed.components)).toBe(src)
  })
})

// ===========================================================================
// matchesSyntax — runtime mirror of InitialValueLiteral
// ===========================================================================

describe("matchesSyntax — the type-test examples", () => {
  test("agrees with the strict-tier fixtures", () => {
    expect(matchesSyntax("<length>", "0px")).toBe(true)
    expect(matchesSyntax("<length>", "red")).toBe(false)
    expect(matchesSyntax("<color>", "#ff0000")).toBe(true)
    expect(matchesSyntax("<length> | auto", "auto")).toBe(true)
    expect(matchesSyntax("<length>+", "0px 4px 8px")).toBe(true)
    expect(matchesSyntax("<length>+", "0px red")).toBe(false)
    expect(matchesSyntax("<color>", "notacolor")).toBe(false)
    expect(matchesSyntax("<length> | auto", "none")).toBe(false)
  })
})

describe("matchesSyntax — universal", () => {
  test("`*` accepts anything", () => {
    expect(matchesSyntax("*", "literally anything")).toBe(true)
    expect(matchesSyntax("*", "")).toBe(true)
    expect(matchesSyntax("*", "calc(1px + 2em)")).toBe(true)
  })
})

describe("matchesSyntax — <length>", () => {
  test.each([
    "0px",
    "12rem",
    "-3em",
    "100vh",
    "0.5px",
    "+4px",
  ])("accepts %s", (v) => expect(matchesSyntax("<length>", v)).toBe(true))

  // unitless `0` is NOT a <length> in the kit grammar (HasUnit needs a unit) —
  // the runtime mirrors the type, which rejects it.
  test.each(["red", "10", "0", "px", "1deg", "1%", ""])("rejects %s", (v) =>
    expect(matchesSyntax("<length>", v)).toBe(false))
})

describe("matchesSyntax — <number>", () => {
  test.each(["0", "12", "-3", "0.5", "+4", "3.14"])("accepts %s", (v) =>
    expect(matchesSyntax("<number>", v)).toBe(true))

  test.each(["1px", "red", "1%", "1.2.3", ""])("rejects %s", (v) =>
    expect(matchesSyntax("<number>", v)).toBe(false))
})

describe("matchesSyntax — <integer>", () => {
  test.each(["0", "12", "-3", "+7"])("accepts integer %s", (v) =>
    expect(matchesSyntax("<integer>", v)).toBe(true))

  test("rejects a non-integer number (runtime is stricter than the type)", () => {
    expect(matchesSyntax("<integer>", "0.5")).toBe(false)
    expect(matchesSyntax("<integer>", "3.14")).toBe(false)
  })

  test.each(["1px", "red", ""])("rejects %s", (v) =>
    expect(matchesSyntax("<integer>", v)).toBe(false))
})

describe("matchesSyntax — <percentage>", () => {
  test.each(["0%", "50%", "-10%", "100%"])("accepts %s", (v) =>
    expect(matchesSyntax("<percentage>", v)).toBe(true))

  test.each(["0px", "50", "%"])("rejects %s", (v) =>
    expect(matchesSyntax("<percentage>", v)).toBe(false))
})

describe("matchesSyntax — <length-percentage>", () => {
  test.each(["0px", "50%", "12rem", "-3%"])("accepts %s", (v) =>
    expect(matchesSyntax("<length-percentage>", v)).toBe(true))

  test.each(["red", "10", "1deg"])("rejects %s", (v) =>
    expect(matchesSyntax("<length-percentage>", v)).toBe(false))
})

describe("matchesSyntax — <angle>", () => {
  test.each([
    "0deg",
    "90deg",
    "1turn",
    "0.5rad",
    "200grad",
  ])("accepts %s", (v) => expect(matchesSyntax("<angle>", v)).toBe(true))

  test.each(["0px", "10", "1s"])("rejects %s", (v) =>
    expect(matchesSyntax("<angle>", v)).toBe(false))
})

describe("matchesSyntax — <time>", () => {
  test.each(["0s", "200ms", "1.5s"])("accepts %s", (v) =>
    expect(matchesSyntax("<time>", v)).toBe(true))

  test.each(["0px", "10", "1deg"])("rejects %s", (v) =>
    expect(matchesSyntax("<time>", v)).toBe(false))
})

describe("matchesSyntax — <resolution>", () => {
  test.each(["96dpi", "2dppx", "1x", "5dpcm"])("accepts %s", (v) =>
    expect(matchesSyntax("<resolution>", v)).toBe(true))

  test.each(["0px", "10", "1s"])("rejects %s", (v) =>
    expect(matchesSyntax("<resolution>", v)).toBe(false))
})

describe("matchesSyntax — <color> (color-picker forms, not named)", () => {
  test.each([
    "#ff0000",
    "#abc",
    "rgb(255 0 0)",
    "oklch(0.7 0.15 30)",
  ])("accepts %s", (v) => expect(matchesSyntax("<color>", v)).toBe(true))

  test.each(["red", "notacolor", "0px", ""])("rejects %s", (v) =>
    expect(matchesSyntax("<color>", v)).toBe(false))
})

describe("matchesSyntax — lenient grammars", () => {
  test.each([
    "image",
    "url",
    "transform-function",
    "transform-list",
  ])("<%s> accepts any non-empty token", (t) => {
    expect(matchesSyntax(`<${t}>`, "anything")).toBe(true)
    expect(matchesSyntax(`<${t}>`, "url(a.png)")).toBe(true)
  })
})

describe("matchesSyntax — literal idents", () => {
  test("exact match accepts", () => {
    expect(matchesSyntax("auto", "auto")).toBe(true)
  })

  test("non-matching value rejects", () => {
    expect(matchesSyntax("auto", "none")).toBe(false)
    expect(matchesSyntax("auto", "0px")).toBe(false)
  })
})

describe("matchesSyntax — `+` (space list)", () => {
  test("every space-token must satisfy the base", () => {
    expect(matchesSyntax("<length>+", "0px")).toBe(true)
    expect(matchesSyntax("<length>+", "0px 4px 8px")).toBe(true)
    expect(matchesSyntax("<length>+", "0px red")).toBe(false)
  })

  test("an empty list does not satisfy", () => {
    expect(matchesSyntax("<length>+", "")).toBe(false)
    expect(matchesSyntax("<length>+", "   ")).toBe(false)
  })
})

describe("matchesSyntax — `#` (comma list)", () => {
  test("every comma-token must satisfy the base", () => {
    expect(matchesSyntax("<color>#", "#ff0000")).toBe(true)
    expect(matchesSyntax("<color>#", "#ff0000, #00ff00")).toBe(true)
    expect(matchesSyntax("<color>#", "#ff0000, red")).toBe(false)
  })

  test("a length comma-list", () => {
    expect(matchesSyntax("<length>#", "0px, 4px, 8px")).toBe(true)
    expect(matchesSyntax("<length>#", "0px, auto")).toBe(false)
  })
})

describe("matchesSyntax — alternation", () => {
  test("matches when any alternative matches", () => {
    expect(matchesSyntax("<length> | auto", "0px")).toBe(true)
    expect(matchesSyntax("<length> | auto", "auto")).toBe(true)
    expect(matchesSyntax("<length> | auto", "none")).toBe(false)
  })

  test("a three-way alternation", () => {
    expect(matchesSyntax("<length> | <color> | auto", "#ff0000")).toBe(true)
    expect(matchesSyntax("<length> | <color> | auto", "auto")).toBe(true)
    expect(matchesSyntax("<length> | <color> | auto", "12px")).toBe(true)
    expect(matchesSyntax("<length> | <color> | auto", "none")).toBe(false)
  })

  test("a multiplier inside an alternative", () => {
    expect(matchesSyntax("<length># | auto", "0px, 4px")).toBe(true)
    expect(matchesSyntax("<length># | auto", "auto")).toBe(true)
    expect(matchesSyntax("<length># | auto", "none")).toBe(false)
  })
})

describe("matchesSyntax — degenerate inputs", () => {
  test("an unparseable syntax never matches", () => {
    expect(matchesSyntax("<bogus>", "anything")).toBe(false)
    expect(matchesSyntax("", "anything")).toBe(false)
    expect(matchesSyntax("<length> |", "0px")).toBe(false)
  })
})
