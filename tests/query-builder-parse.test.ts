import { describe, expect, test } from "vitest"
import {
  defaultFeatureTest,
  defaultQuery,
  enumOptionsFor,
  featureKind,
  featuresFor,
  parseFeatureTest,
  parseQuery,
} from "@/components/ui/query-builder/query-builder.helpers"

// ===========================================================================
// parseFeatureTest — the four shapes
// ===========================================================================

describe("parseFeatureTest", () => {
  test("boolean", () => {
    expect(parseFeatureTest("hover")).toEqual({
      kind: "boolean",
      feature: "hover",
    })
  })

  test("plain colon", () => {
    expect(parseFeatureTest("min-width: 600px")).toEqual({
      kind: "plain",
      feature: "min-width",
      value: "600px",
    })
  })

  test("2-part range", () => {
    expect(parseFeatureTest("width >= 600px")).toEqual({
      kind: "range2",
      feature: "width",
      op: ">=",
      value: "600px",
    })
  })

  test("3-part range", () => {
    expect(parseFeatureTest("400px <= width <= 700px")).toEqual({
      kind: "range3",
      feature: "width",
      op: "<=",
      value: "400px",
      op2: "<=",
      value2: "700px",
    })
  })

  test("a colon inside the value is not the split (style-ish)", () => {
    // first top-level colon splits; the value keeps its colon
    expect(parseFeatureTest("background: url(a:b)")).toEqual({
      kind: "plain",
      feature: "background",
      value: "url(a:b)",
    })
  })

  test("an empty value is null", () => {
    expect(parseFeatureTest("min-width:")).toBeNull()
  })
})

// ===========================================================================
// parseQuery — media mode
// ===========================================================================

describe("parseQuery (media)", () => {
  test("a single plain test", () => {
    const { node, error } = parseQuery("(min-width: 600px)", "media")
    expect(error).toBeNull()
    expect(node).toEqual({
      type: "group",
      joiner: "and",
      not: false,
      tests: [{ kind: "plain", feature: "min-width", value: "600px" }],
    })
  })

  test("an and-joined pair", () => {
    const { node } = parseQuery(
      "(min-width: 600px) and (max-width: 900px)",
      "media",
    )
    expect(node?.type).toBe("group")
    if (node?.type === "group") {
      expect(node.joiner).toBe("and")
      expect(node.tests).toHaveLength(2)
    }
  })

  test("an or-joined pair", () => {
    const { node } = parseQuery("(hover) or (pointer: coarse)", "media")
    if (node?.type === "group") expect(node.joiner).toBe("or")
  })

  test("a media type + condition strips the type", () => {
    const { node } = parseQuery("screen and (min-width: 600px)", "media")
    if (node?.type === "group") {
      expect(node.tests).toHaveLength(1)
      expect(node.tests[0]).toEqual({
        kind: "plain",
        feature: "min-width",
        value: "600px",
      })
    }
  })

  test("a top-level not is captured", () => {
    const { node } = parseQuery("not (monochrome)", "media")
    expect(node?.not).toBe(true)
  })

  test("an unbalanced query errors", () => {
    const { node, error } = parseQuery("(min-width: 600px", "media")
    expect(node).toBeNull()
    expect(error).not.toBeNull()
  })

  test("an empty string errors gracefully", () => {
    const { node } = parseQuery("", "media")
    expect(node).toBeNull()
  })
})

// ===========================================================================
// parseQuery — container mode
// ===========================================================================

describe("parseQuery (container)", () => {
  test("a single size test", () => {
    const { node } = parseQuery("(inline-size > 30rem)", "container")
    if (node?.type === "group") {
      expect(node.tests[0]).toEqual({
        kind: "range2",
        feature: "inline-size",
        op: ">",
        value: "30rem",
      })
    }
  })

  test("a named container strips the name", () => {
    const { node, error } = parseQuery("sidebar (width > 400px)", "container")
    expect(error).toBeNull()
    if (node?.type === "group") {
      expect(node.tests).toHaveLength(1)
      expect(node.tests[0]).toMatchObject({ feature: "width" })
    }
  })
})

// ===========================================================================
// feature table helpers
// ===========================================================================

describe("featureKind", () => {
  test("media classes", () => {
    expect(featureKind("min-width", "media")).toBe("length")
    expect(featureKind("resolution", "media")).toBe("resolution")
    expect(featureKind("aspect-ratio", "media")).toBe("ratio")
    expect(featureKind("orientation", "media")).toBe("enum")
    expect(featureKind("color", "media")).toBe("integer")
    expect(featureKind("flux-capacitor", "media")).toBe("unknown")
  })

  test("container subset", () => {
    expect(featureKind("inline-size", "container")).toBe("length")
    expect(featureKind("aspect-ratio", "container")).toBe("ratio")
    expect(featureKind("orientation", "container")).toBe("enum")
    // media-only features are unknown in container mode
    expect(featureKind("resolution", "container")).toBe("unknown")
    expect(featureKind("hover", "container")).toBe("unknown")
  })
})

describe("featuresFor / enumOptionsFor", () => {
  test("featuresFor returns mode-specific names", () => {
    const media = featuresFor("media")
    expect(media).toContain("width")
    expect(media).toContain("orientation")
    expect(media).toContain("resolution")
    const container = featuresFor("container")
    expect(container).toContain("inline-size")
    expect(container).not.toContain("resolution")
    expect(container).not.toContain("hover")
  })

  test("enumOptionsFor returns keywords or null", () => {
    expect(enumOptionsFor("orientation")).toEqual(["portrait", "landscape"])
    expect(enumOptionsFor("pointer")).toEqual(["none", "coarse", "fine"])
    expect(enumOptionsFor("width")).toBeNull()
  })
})

// ===========================================================================
// defaults
// ===========================================================================

describe("defaults", () => {
  test("defaultFeatureTest", () => {
    expect(defaultFeatureTest("media")).toMatchObject({ feature: "width" })
    expect(defaultFeatureTest("container")).toMatchObject({
      feature: "inline-size",
    })
  })

  test("defaultQuery", () => {
    const q = defaultQuery("media")
    expect(q.mode).toBe("media")
    expect(q.tests).toHaveLength(1)
    expect(q.joiner).toBe("and")
  })
})
