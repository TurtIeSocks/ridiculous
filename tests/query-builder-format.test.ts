import { describe, expect, test } from "vitest"
import {
  formatQuery,
  matchesNow,
  parseQuery,
  queryToString,
} from "@/components/ui/query-builder/query-builder.helpers"
import type { QueryState } from "@/components/ui/query-builder/query-builder.types"

// ===========================================================================
// formatQuery — canonical serialization of a parsed node
// ===========================================================================

describe("formatQuery (node)", () => {
  test("a plain test", () => {
    const { node } = parseQuery("(min-width: 600px)", "media")
    expect(node && formatQuery(node, "media")).toBe("(min-width: 600px)")
  })

  test("a 2-part range", () => {
    const { node } = parseQuery("(width >= 600px)", "media")
    expect(node && formatQuery(node, "media")).toBe("(width >= 600px)")
  })

  test("a 3-part range", () => {
    const { node } = parseQuery("(400px <= width <= 700px)", "media")
    expect(node && formatQuery(node, "media")).toBe("(400px <= width <= 700px)")
  })

  test("an and-joined pair", () => {
    const { node } = parseQuery(
      "(min-width: 600px) and (max-width: 900px)",
      "media",
    )
    expect(node && formatQuery(node, "media")).toBe(
      "(min-width: 600px) and (max-width: 900px)",
    )
  })

  test("a boolean test", () => {
    const { node } = parseQuery("(hover)", "media")
    expect(node && formatQuery(node, "media")).toBe("(hover)")
  })

  test("a not-negated test", () => {
    const { node } = parseQuery("not (monochrome)", "media")
    expect(node && formatQuery(node, "media")).toBe("not (monochrome)")
  })
})

// ===========================================================================
// queryToString — from the flat editor state
// ===========================================================================

describe("queryToString (state)", () => {
  test("media type + single test", () => {
    const s: QueryState = {
      mode: "media",
      mediaType: "screen",
      joiner: "and",
      not: false,
      tests: [{ kind: "plain", feature: "min-width", value: "600px" }],
    }
    expect(queryToString(s)).toBe("screen and (min-width: 600px)")
  })

  test("only modifier + media type, no tests", () => {
    const s: QueryState = {
      mode: "media",
      modifier: "only",
      mediaType: "screen",
      joiner: "and",
      not: false,
      tests: [],
    }
    expect(queryToString(s)).toBe("only screen")
  })

  test("container name + test", () => {
    const s: QueryState = {
      mode: "container",
      containerName: "sidebar",
      joiner: "and",
      not: false,
      tests: [{ kind: "range2", feature: "width", op: ">", value: "400px" }],
    }
    expect(queryToString(s)).toBe("sidebar (width > 400px)")
  })

  test("or-joined tests", () => {
    const s: QueryState = {
      mode: "media",
      joiner: "or",
      not: false,
      tests: [
        { kind: "boolean", feature: "hover" },
        { kind: "plain", feature: "pointer", value: "coarse" },
      ],
    }
    expect(queryToString(s)).toBe("(hover) or (pointer: coarse)")
  })

  test("a top-level not wraps the flat condition", () => {
    const s: QueryState = {
      mode: "media",
      joiner: "and",
      not: true,
      tests: [
        { kind: "boolean", feature: "hover" },
        { kind: "plain", feature: "pointer", value: "fine" },
      ],
    }
    // not binds one operand → wrap the multi-test condition in parens
    expect(queryToString(s)).toBe("not ((hover) and (pointer: fine))")
  })

  test("a single negated test does not double-wrap", () => {
    const s: QueryState = {
      mode: "media",
      joiner: "and",
      not: true,
      tests: [{ kind: "boolean", feature: "monochrome" }],
    }
    expect(queryToString(s)).toBe("not (monochrome)")
  })
})

// ===========================================================================
// round-trip: parse → format is stable
// ===========================================================================

describe("round-trip", () => {
  for (const q of [
    "(min-width: 600px)",
    "(width >= 600px)",
    "(400px <= width <= 700px)",
    "(min-width: 600px) and (max-width: 900px)",
    "(hover) or (pointer: coarse)",
    "(aspect-ratio: 16/9)",
    "(orientation: landscape)",
  ]) {
    test(`stable: ${q}`, () => {
      const { node } = parseQuery(q, "media")
      expect(node && formatQuery(node, "media")).toBe(q)
    })
  }
})

// ===========================================================================
// matchesNow — media only, guarded
// ===========================================================================

describe("matchesNow", () => {
  test("container mode returns null", () => {
    expect(matchesNow("(width > 400px)", "container")).toBeNull()
  })

  test("media mode reads window.matchMedia", () => {
    const mm = vi.fn().mockReturnValue({ matches: true })
    Object.defineProperty(window, "matchMedia", {
      value: mm,
      writable: true,
      configurable: true,
    })
    expect(matchesNow("(min-width: 1px)", "media")).toBe(true)
    expect(mm).toHaveBeenCalledWith("(min-width: 1px)")
  })

  test("returns null when matchMedia is unavailable", () => {
    Object.defineProperty(window, "matchMedia", {
      value: undefined,
      writable: true,
      configurable: true,
    })
    expect(matchesNow("(min-width: 1px)", "media")).toBeNull()
  })
})
