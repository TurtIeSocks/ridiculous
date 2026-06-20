import { describe, expect, test } from "vitest"
import {
  dataTypeNames,
  defaultInitialValue,
  defaultSyntax,
  parseSyntax,
} from "@/components/ui/property-syntax-editor/property-syntax-editor.helpers"

// ===========================================================================
// parseSyntax — string → { universal, components, error }
// ===========================================================================

describe("parseSyntax", () => {
  test("the universal `*`", () => {
    expect(parseSyntax("*")).toEqual({
      universal: true,
      components: [],
      error: null,
    })
  })

  test("a single data-type component", () => {
    expect(parseSyntax("<length>")).toEqual({
      universal: false,
      components: [{ base: "<length>", isType: true, multiplier: "" }],
      error: null,
    })
  })

  test("a `+` (space-list) multiplier", () => {
    expect(parseSyntax("<length>+")).toEqual({
      universal: false,
      components: [{ base: "<length>", isType: true, multiplier: "+" }],
      error: null,
    })
  })

  test("a `#` (comma-list) multiplier", () => {
    expect(parseSyntax("<color>#")).toEqual({
      universal: false,
      components: [{ base: "<color>", isType: true, multiplier: "#" }],
      error: null,
    })
  })

  test("a literal ident component", () => {
    expect(parseSyntax("auto")).toEqual({
      universal: false,
      components: [{ base: "auto", isType: false, multiplier: "" }],
      error: null,
    })
  })

  test("a `|` alternation of a type and an ident", () => {
    expect(parseSyntax("<length> | auto")).toEqual({
      universal: false,
      components: [
        { base: "<length>", isType: true, multiplier: "" },
        { base: "auto", isType: false, multiplier: "" },
      ],
      error: null,
    })
  })

  test("collapses whitespace around the pipe and components", () => {
    expect(parseSyntax("  <length>+  |  <color>#  ")).toEqual({
      universal: false,
      components: [
        { base: "<length>", isType: true, multiplier: "+" },
        { base: "<color>", isType: true, multiplier: "#" },
      ],
      error: null,
    })
  })

  test("an ident with a multiplier", () => {
    expect(parseSyntax("auto#")).toEqual({
      universal: false,
      components: [{ base: "auto", isType: false, multiplier: "#" }],
      error: null,
    })
  })

  // --- errors -------------------------------------------------------------

  test("an empty string is an error", () => {
    const r = parseSyntax("")
    expect(r.error).not.toBeNull()
    expect(r.universal).toBe(false)
  })

  test("a whitespace-only string is an error", () => {
    expect(parseSyntax("   ").error).not.toBeNull()
  })

  test("an empty alternative is an error", () => {
    expect(parseSyntax("<length> |").error).not.toBeNull()
  })

  test("a leading empty alternative is an error", () => {
    expect(parseSyntax("| auto").error).not.toBeNull()
  })

  test("a double multiplier is an error", () => {
    expect(parseSyntax("<length>++").error).not.toBeNull()
  })

  test("an unknown data type is an error", () => {
    expect(parseSyntax("<bogus>").error).not.toBeNull()
  })

  test("an empty data type `<>` is an error", () => {
    expect(parseSyntax("<>").error).not.toBeNull()
  })

  test("an unterminated type token is an error", () => {
    expect(parseSyntax("<length").error).not.toBeNull()
  })

  test("keeps the parsed components alongside an error for the UI", () => {
    const r = parseSyntax("<length> |")
    expect(r.error).not.toBeNull()
    expect(Array.isArray(r.components)).toBe(true)
  })
})

// ===========================================================================
// dataTypeNames — the palette options
// ===========================================================================

describe("dataTypeNames", () => {
  test("includes the core dimensional + color types", () => {
    const names = dataTypeNames()
    for (const n of [
      "length",
      "number",
      "percentage",
      "length-percentage",
      "color",
      "integer",
      "angle",
      "time",
      "resolution",
    ]) {
      expect(names).toContain(n)
    }
  })

  test("includes the lenient grammar types", () => {
    const names = dataTypeNames()
    for (const n of ["image", "url", "transform-function", "transform-list"]) {
      expect(names).toContain(n)
    }
  })

  test("is non-empty and free of duplicates", () => {
    const names = dataTypeNames()
    expect(names.length).toBeGreaterThan(0)
    expect(new Set(names).size).toBe(names.length)
  })
})

// ===========================================================================
// defaults
// ===========================================================================

describe("defaultSyntax", () => {
  test("is a non-empty, parseable syntax string", () => {
    const s = defaultSyntax()
    expect(typeof s).toBe("string")
    expect(s.length).toBeGreaterThan(0)
    expect(parseSyntax(s).error).toBeNull()
  })
})

describe("defaultInitialValue", () => {
  test("for `<length>` yields a length", () => {
    const v = defaultInitialValue("<length>")
    expect(typeof v).toBe("string")
    expect(v.length).toBeGreaterThan(0)
  })

  test("for `<color>` yields a color", () => {
    expect(defaultInitialValue("<color>").length).toBeGreaterThan(0)
  })

  test("for an ident alternation yields a value", () => {
    expect(defaultInitialValue("<length> | auto").length).toBeGreaterThan(0)
  })

  test("for the universal `*` yields some value", () => {
    expect(typeof defaultInitialValue("*")).toBe("string")
  })
})
