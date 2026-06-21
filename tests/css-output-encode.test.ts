import { describe, expect, it } from "vitest"
import { encodeArbitraryValue } from "@/components/ui/css-output/css-output.helpers"

describe("encodeArbitraryValue", () => {
  it("turns whitespace runs into single underscores", () => {
    expect(encodeArbitraryValue("0 4px 8px #000")).toBe("0_4px_8px_#000")
  })

  it("keeps slashes and parens, underscores the spaces inside rgb()", () => {
    expect(encodeArbitraryValue("rgb(0 0 0 / 0.25)")).toBe("rgb(0_0_0_/_0.25)")
  })

  it("collapses comma-space to a bare comma", () => {
    expect(encodeArbitraryValue("cubic-bezier(0.25, 0.1, 0.25, 1)")).toBe(
      "cubic-bezier(0.25,0.1,0.25,1)",
    )
  })

  it("encodes a multi-layer box-shadow stack", () => {
    expect(
      encodeArbitraryValue(
        "0px 4px 8px rgb(0 0 0 / 0.25), inset 0px 0px 2px #000",
      ),
    ).toBe("0px_4px_8px_rgb(0_0_0_/_0.25),inset_0px_0px_2px_#000")
  })

  it("escapes literal underscores (Tailwind un-escapes back to '_')", () => {
    expect(encodeArbitraryValue("a_b")).toBe("a\\_b")
    expect(encodeArbitraryValue("url(/a_b.png)")).toBe("url(/a\\_b.png)")
  })
})
