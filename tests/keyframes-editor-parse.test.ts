import { describe, expect, test } from "vitest"
import {
  defaultKeyframes,
  parseKeyframes,
  percentToSelector,
  propertyEditorKind,
  selectorToPercent,
} from "@/components/ui/keyframes-editor/keyframes-editor.helpers"
import type { KeyframeBlock } from "@/components/ui/keyframes-editor/keyframes-editor.types"

// ===========================================================================
// parseKeyframes — block list, selectors, declarations (spec §4)
// ===========================================================================

describe("parseKeyframes — blocks + declarations", () => {
  test("a single from/to body parses two blocks", () => {
    const r = parseKeyframes("from { opacity: 0 } to { opacity: 1 }")
    expect(r.error).toBeNull()
    expect(r.blocks).toHaveLength(2)
    expect(r.blocks[0]).toEqual<KeyframeBlock>({
      selectors: ["from"],
      declarations: [{ property: "opacity", value: "0" }],
    })
    expect(r.blocks[1]).toEqual<KeyframeBlock>({
      selectors: ["to"],
      declarations: [{ property: "opacity", value: "1" }],
    })
  })

  test("a percentage selector parses", () => {
    const r = parseKeyframes("50% { transform: scale(1.2) }")
    expect(r.error).toBeNull()
    expect(r.blocks).toHaveLength(1)
    expect(r.blocks[0].selectors).toEqual(["50%"])
    expect(r.blocks[0].declarations).toEqual([
      { property: "transform", value: "scale(1.2)" },
    ])
  })

  test("a comma list of selectors splits into multiple", () => {
    const r = parseKeyframes("0%, 50%, 100% { opacity: 1 }")
    expect(r.error).toBeNull()
    expect(r.blocks[0].selectors).toEqual(["0%", "50%", "100%"])
  })

  test("multiple declarations split on `;`", () => {
    const r = parseKeyframes("from { transform: translateX(0px); opacity: 1 }")
    expect(r.error).toBeNull()
    expect(r.blocks[0].declarations).toEqual([
      { property: "transform", value: "translateX(0px)" },
      { property: "opacity", value: "1" },
    ])
  })

  test("a trailing `;` is tolerated", () => {
    const r = parseKeyframes("from { opacity: 0; }")
    expect(r.error).toBeNull()
    expect(r.blocks[0].declarations).toEqual([
      { property: "opacity", value: "0" },
    ])
  })

  test("a declaration value may itself contain a colon-free function", () => {
    const r = parseKeyframes("from { color: oklch(0.7 0.15 30) }")
    expect(r.error).toBeNull()
    expect(r.blocks[0].declarations).toEqual([
      { property: "color", value: "oklch(0.7 0.15 30)" },
    ])
  })

  test("only the FIRST colon splits property from value", () => {
    // a url() / data value can carry a colon in the value half
    const r = parseKeyframes("from { background-image: url(http://x) }")
    expect(r.error).toBeNull()
    expect(r.blocks[0].declarations).toEqual([
      { property: "background-image", value: "url(http://x)" },
    ])
  })

  test("whitespace around property and value is trimmed", () => {
    const r = parseKeyframes("from {   opacity :   0   }")
    expect(r.error).toBeNull()
    expect(r.blocks[0].declarations).toEqual([
      { property: "opacity", value: "0" },
    ])
  })

  test("an empty declaration block yields no declarations", () => {
    const r = parseKeyframes("from { }")
    expect(r.error).toBeNull()
    expect(r.blocks[0].selectors).toEqual(["from"])
    expect(r.blocks[0].declarations).toEqual([])
  })

  test("three blocks keep order", () => {
    const r = parseKeyframes(
      "from { opacity: 0 } 50% { opacity: 0.5 } to { opacity: 1 }",
    )
    expect(r.error).toBeNull()
    expect(r.blocks.map((b) => b.selectors[0])).toEqual(["from", "50%", "to"])
  })

  test("declarations with no whitespace between blocks parse", () => {
    const r = parseKeyframes("from{opacity:0}to{opacity:1}")
    expect(r.error).toBeNull()
    expect(r.blocks).toHaveLength(2)
    expect(r.blocks[0]).toEqual<KeyframeBlock>({
      selectors: ["from"],
      declarations: [{ property: "opacity", value: "0" }],
    })
  })
})

describe("parseKeyframes — errors", () => {
  test("an empty string errors", () => {
    const r = parseKeyframes("")
    expect(r.error).not.toBeNull()
  })

  test("a body with no blocks errors", () => {
    const r = parseKeyframes("just text")
    expect(r.error).not.toBeNull()
  })

  test("an unclosed block errors", () => {
    const r = parseKeyframes("from { opacity: 0")
    expect(r.error).not.toBeNull()
  })

  test("a block with no selector errors", () => {
    const r = parseKeyframes("{ opacity: 0 }")
    expect(r.error).not.toBeNull()
  })
})

// ===========================================================================
// propertyEditorKind — runtime mirror of the dispatch table (spec §4 / §4.1)
// ===========================================================================

describe("propertyEditorKind", () => {
  test("transform routes to the transform editor", () => {
    expect(propertyEditorKind("transform")).toBe("transform")
  })

  test("filter + backdrop-filter route to the filter editor", () => {
    expect(propertyEditorKind("filter")).toBe("filter")
    expect(propertyEditorKind("backdrop-filter")).toBe("filter")
  })

  test("color-ish properties route to the color editor", () => {
    expect(propertyEditorKind("color")).toBe("color")
    expect(propertyEditorKind("background-color")).toBe("color")
    expect(propertyEditorKind("border-color")).toBe("color")
    expect(propertyEditorKind("outline-color")).toBe("color")
    expect(propertyEditorKind("fill")).toBe("color")
    expect(propertyEditorKind("stroke")).toBe("color")
  })

  test("timing-function properties route to the easing editor", () => {
    expect(propertyEditorKind("animation-timing-function")).toBe("easing")
    expect(propertyEditorKind("transition-timing-function")).toBe("easing")
  })

  test("opacity routes to the opacity editor", () => {
    expect(propertyEditorKind("opacity")).toBe("opacity")
  })

  test("length properties route to the length editor", () => {
    expect(propertyEditorKind("width")).toBe("length")
    expect(propertyEditorKind("height")).toBe("length")
    expect(propertyEditorKind("top")).toBe("length")
    expect(propertyEditorKind("left")).toBe("length")
    expect(propertyEditorKind("margin-top")).toBe("length")
    expect(propertyEditorKind("padding")).toBe("length")
    expect(propertyEditorKind("gap")).toBe("length")
  })

  test("background / background-image are plain (routed to gradient in UI)", () => {
    expect(propertyEditorKind("background")).toBe("plain")
    expect(propertyEditorKind("background-image")).toBe("plain")
  })

  test("an unknown property is plain", () => {
    expect(propertyEditorKind("z-index")).toBe("plain")
    expect(propertyEditorKind("font-weight")).toBe("plain")
  })

  test("the property name is trimmed before dispatch", () => {
    expect(propertyEditorKind("  transform  ")).toBe("transform")
  })
})

// ===========================================================================
// selectorToPercent / percentToSelector — the timeline coordinate map (§4.1)
// ===========================================================================

describe("selectorToPercent", () => {
  test("from is 0", () => {
    expect(selectorToPercent("from")).toBe(0)
  })

  test("to is 100", () => {
    expect(selectorToPercent("to")).toBe(100)
  })

  test("a percentage selector returns its numeric part", () => {
    expect(selectorToPercent("50%")).toBe(50)
    expect(selectorToPercent("0%")).toBe(0)
    expect(selectorToPercent("100%")).toBe(100)
    expect(selectorToPercent("33.3%")).toBe(33.3)
  })

  test("surrounding whitespace is tolerated", () => {
    expect(selectorToPercent("  to  ")).toBe(100)
    expect(selectorToPercent(" 25% ")).toBe(25)
  })
})

describe("percentToSelector", () => {
  test("0 collapses to from", () => {
    expect(percentToSelector(0)).toBe("from")
  })

  test("100 collapses to to", () => {
    expect(percentToSelector(100)).toBe("to")
  })

  test("an interior value becomes an N% selector", () => {
    expect(percentToSelector(50)).toBe("50%")
    expect(percentToSelector(25)).toBe("25%")
    expect(percentToSelector(33.3)).toBe("33.3%")
  })

  test("round-trips with selectorToPercent for interior stops", () => {
    expect(selectorToPercent(percentToSelector(42))).toBe(42)
  })
})

// ===========================================================================
// defaultKeyframes
// ===========================================================================

describe("defaultKeyframes", () => {
  test("is the from/to opacity seed", () => {
    expect(defaultKeyframes()).toBe("from { opacity: 0 } to { opacity: 1 }")
  })

  test("is a parseable, two-block body", () => {
    const r = parseKeyframes(defaultKeyframes())
    expect(r.error).toBeNull()
    expect(r.blocks).toHaveLength(2)
  })
})
