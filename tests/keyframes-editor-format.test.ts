import { describe, expect, test } from "vitest"
import {
  formatKeyframes,
  parseKeyframes,
} from "@/components/ui/keyframes-editor/keyframes-editor.helpers"
import type { KeyframeBlock } from "@/components/ui/keyframes-editor/keyframes-editor.types"

// ===========================================================================
// formatKeyframes — canonical re-serialization (spec §4)
// ===========================================================================

describe("formatKeyframes — canonical shape", () => {
  test("a single block serializes `sel { prop: value }`", () => {
    const blocks: KeyframeBlock[] = [
      {
        selectors: ["from"],
        declarations: [{ property: "opacity", value: "0" }],
      },
    ]
    expect(formatKeyframes(blocks)).toBe("from { opacity: 0 }")
  })

  test("multiple declarations join with `; `", () => {
    const blocks: KeyframeBlock[] = [
      {
        selectors: ["from"],
        declarations: [
          { property: "transform", value: "translateX(0px)" },
          { property: "opacity", value: "1" },
        ],
      },
    ]
    expect(formatKeyframes(blocks)).toBe(
      "from { transform: translateX(0px); opacity: 1 }",
    )
  })

  test("a comma selector list joins with `, `", () => {
    const blocks: KeyframeBlock[] = [
      {
        selectors: ["0%", "50%", "100%"],
        declarations: [{ property: "opacity", value: "1" }],
      },
    ]
    expect(formatKeyframes(blocks)).toBe("0%, 50%, 100% { opacity: 1 }")
  })

  test("an empty declaration list serializes an empty block", () => {
    const blocks: KeyframeBlock[] = [{ selectors: ["from"], declarations: [] }]
    expect(formatKeyframes(blocks)).toBe("from {  }")
  })

  test("multiple blocks join with a space", () => {
    const blocks: KeyframeBlock[] = [
      {
        selectors: ["from"],
        declarations: [{ property: "opacity", value: "0" }],
      },
      {
        selectors: ["to"],
        declarations: [{ property: "opacity", value: "1" }],
      },
    ]
    expect(formatKeyframes(blocks)).toBe(
      "from { opacity: 0 } to { opacity: 1 }",
    )
  })
})

// ===========================================================================
// formatKeyframes — stop sorting (spec §4: from=0 < % < to=100)
// ===========================================================================

describe("formatKeyframes — stops sorted from → % → to", () => {
  test("to before from is reordered", () => {
    const blocks: KeyframeBlock[] = [
      {
        selectors: ["to"],
        declarations: [{ property: "opacity", value: "1" }],
      },
      {
        selectors: ["from"],
        declarations: [{ property: "opacity", value: "0" }],
      },
    ]
    expect(formatKeyframes(blocks)).toBe(
      "from { opacity: 0 } to { opacity: 1 }",
    )
  })

  test("from sorts to 0, to sorts to 100, % in between", () => {
    const blocks: KeyframeBlock[] = [
      {
        selectors: ["to"],
        declarations: [{ property: "opacity", value: "1" }],
      },
      {
        selectors: ["50%"],
        declarations: [{ property: "opacity", value: "0.5" }],
      },
      {
        selectors: ["from"],
        declarations: [{ property: "opacity", value: "0" }],
      },
    ]
    expect(formatKeyframes(blocks)).toBe(
      "from { opacity: 0 } 50% { opacity: 0.5 } to { opacity: 1 }",
    )
  })

  test("percentage stops sort numerically", () => {
    const blocks: KeyframeBlock[] = [
      {
        selectors: ["75%"],
        declarations: [{ property: "opacity", value: "0.75" }],
      },
      {
        selectors: ["25%"],
        declarations: [{ property: "opacity", value: "0.25" }],
      },
    ]
    expect(formatKeyframes(blocks)).toBe(
      "25% { opacity: 0.25 } 75% { opacity: 0.75 }",
    )
  })

  test("a stop is sorted by its FIRST selector in a comma list", () => {
    const blocks: KeyframeBlock[] = [
      {
        selectors: ["80%", "90%"],
        declarations: [{ property: "opacity", value: "1" }],
      },
      {
        selectors: ["10%"],
        declarations: [{ property: "opacity", value: "0" }],
      },
    ]
    expect(formatKeyframes(blocks)).toBe(
      "10% { opacity: 0 } 80%, 90% { opacity: 1 }",
    )
  })
})

// ===========================================================================
// round-trip parse ⇄ format
// ===========================================================================

describe("round-trip parse ⇄ format", () => {
  const canonical = [
    "from { opacity: 0 } to { opacity: 1 }",
    "from { transform: translateX(0px) } 50% { transform: scale(1.2) } to { transform: translateX(100px) }",
    "0% { color: #f00 } 100% { color: oklch(0.7 0.15 30) }",
    "from { transform: translateX(0px); opacity: 1 } to { transform: translateX(100px); opacity: 0 }",
  ]

  for (const src of canonical) {
    test(`format(parse(x)) === x for: ${src}`, () => {
      const parsed = parseKeyframes(src)
      expect(parsed.error).toBeNull()
      expect(formatKeyframes(parsed.blocks)).toBe(src)
    })
  }

  test("parse(format(x)) preserves structure (post-sort)", () => {
    const blocks: KeyframeBlock[] = [
      {
        selectors: ["to"],
        declarations: [{ property: "opacity", value: "1" }],
      },
      {
        selectors: ["from"],
        declarations: [{ property: "opacity", value: "0" }],
      },
    ]
    const reparsed = parseKeyframes(formatKeyframes(blocks))
    expect(reparsed.error).toBeNull()
    expect(reparsed.blocks.map((b) => b.selectors[0])).toEqual(["from", "to"])
  })
})
