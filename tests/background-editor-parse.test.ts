import { describe, expect, test } from "vitest"
import {
  attachmentOptions,
  boxOptions,
  classifyToken,
  defaultBackground,
  parseBackground,
  repeatOptions,
  sizeKeywords,
} from "@/components/ui/background-editor/background-editor.helpers"

// ===========================================================================
// parseBackground — paren-aware comma split + per-layer token slotting
// ===========================================================================

describe("parseBackground", () => {
  test("a single gradient layer with position / size and repeat", () => {
    const { layers, error } = parseBackground(
      "linear-gradient(#f00, #00f) center / cover no-repeat",
    )
    expect(error).toBeNull()
    expect(layers).toEqual([
      {
        image: "linear-gradient(#f00, #00f)",
        position: "center",
        size: "cover",
        repeat: "no-repeat",
        attachment: "",
        origin: "",
        clip: "",
      },
    ])
  })

  test("keeps the gradient whole across its inner commas (paren-aware)", () => {
    const { layers, error } = parseBackground(
      "radial-gradient(#000, #fff, #000) center",
    )
    expect(error).toBeNull()
    expect(layers).toHaveLength(1)
    expect(layers[0].image).toBe("radial-gradient(#000, #fff, #000)")
    expect(layers[0].position).toBe("center")
  })

  test("two layers split on the top-level comma", () => {
    const { layers, error } = parseBackground(
      "url(a.png) left top, url(b.png) right bottom",
    )
    expect(error).toBeNull()
    expect(layers).toHaveLength(2)
    expect(layers[0].image).toBe("url(a.png)")
    expect(layers[0].position).toBe("left top")
    expect(layers[1].image).toBe("url(b.png)")
    expect(layers[1].position).toBe("right bottom")
  })

  test("a length-percentage position with a percentage size after the slash", () => {
    const { layers, error } = parseBackground(
      "url(x.png) left top / 50% repeat-x",
    )
    expect(error).toBeNull()
    expect(layers[0]).toEqual({
      image: "url(x.png)",
      position: "left top",
      size: "50%",
      repeat: "repeat-x",
      attachment: "",
      origin: "",
      clip: "",
    })
  })

  test("a length size after the slash", () => {
    const { layers, error } = parseBackground("url(x.png) center / 200px 100px")
    expect(error).toBeNull()
    expect(layers[0].size).toBe("200px 100px")
  })

  test("color is slotted onto the FINAL layer only", () => {
    const { layers, error } = parseBackground(
      "linear-gradient(#f00, #00f) center / cover no-repeat, #fff",
    )
    expect(error).toBeNull()
    expect(layers).toHaveLength(2)
    expect(layers[0].color).toBeUndefined()
    expect(layers[1].color).toBe("#fff")
  })

  test("a lone color is the single final layer", () => {
    const { layers, error } = parseBackground("#fff")
    expect(error).toBeNull()
    expect(layers).toHaveLength(1)
    expect(layers[0].color).toBe("#fff")
    expect(layers[0].image).toBe("")
  })

  test("an oklch() color on the final layer (paren-aware, color not image)", () => {
    const { layers, error } = parseBackground(
      "url(x.png) center, oklch(0.7 0.1 240)",
    )
    expect(error).toBeNull()
    expect(layers).toHaveLength(2)
    expect(layers[1].color).toBe("oklch(0.7 0.1 240)")
    expect(layers[1].image).toBe("")
  })

  test("`none` is a valid image", () => {
    const { layers, error } = parseBackground(
      "none, radial-gradient(#000, #fff) center",
    )
    expect(error).toBeNull()
    expect(layers).toHaveLength(2)
    expect(layers[0].image).toBe("none")
    expect(layers[1].image).toBe("radial-gradient(#000, #fff)")
  })

  test("attachment + origin + clip box keywords (first box = origin, second = clip)", () => {
    const { layers, error } = parseBackground(
      "url(x.png) fixed padding-box content-box",
    )
    expect(error).toBeNull()
    expect(layers[0]).toMatchObject({
      attachment: "fixed",
      origin: "padding-box",
      clip: "content-box",
    })
  })

  test("a single box keyword fills origin only", () => {
    const { layers } = parseBackground("url(x.png) border-box")
    expect(layers[0].origin).toBe("border-box")
    expect(layers[0].clip).toBe("")
  })

  test("collapses surrounding whitespace", () => {
    const { layers, error } = parseBackground("   url(x.png)   center   ")
    expect(error).toBeNull()
    expect(layers[0].image).toBe("url(x.png)")
    expect(layers[0].position).toBe("center")
  })

  test("empty input is an error", () => {
    const r = parseBackground("   ")
    expect(r.layers).toEqual([])
    expect(r.error).not.toBeNull()
  })

  test("an unrecognized token is an error (keeps parsed layers)", () => {
    const r = parseBackground("url(x.png) bogus-keyword")
    expect(r.error).not.toBeNull()
  })

  test("an empty comma group (trailing comma) is an error", () => {
    // The first layer parses; the second comma group is empty → parseLayer
    // reports "an empty background layer".
    const r = parseBackground("url(x.png) center, ")
    expect(r.error).not.toBeNull()
    expect(r.error).toMatch(/empty/i)
  })

  test("a color in a NON-final layer is an error", () => {
    const r = parseBackground("#f00 center, url(x.png)")
    expect(r.error).not.toBeNull()
  })
})

// ===========================================================================
// classifyToken — runtime mirror of IsBgToken
// ===========================================================================

describe("classifyToken", () => {
  test("position keywords", () => {
    for (const kw of ["left", "center", "right", "top", "bottom"]) {
      expect(classifyToken(kw)).toBe("position")
    }
  })

  test("size keywords", () => {
    for (const kw of ["cover", "contain", "auto"]) {
      expect(classifyToken(kw)).toBe("size")
    }
  })

  test("repeat keywords", () => {
    for (const kw of [
      "repeat",
      "repeat-x",
      "repeat-y",
      "space",
      "round",
      "no-repeat",
    ]) {
      expect(classifyToken(kw)).toBe("repeat")
    }
  })

  test("attachment keywords", () => {
    for (const kw of ["scroll", "fixed", "local"]) {
      expect(classifyToken(kw)).toBe("attachment")
    }
  })

  test("box keywords", () => {
    for (const kw of ["border-box", "padding-box", "content-box"]) {
      expect(classifyToken(kw)).toBe("box")
    }
  })

  test("lengths and percentages classify as length", () => {
    expect(classifyToken("50%")).toBe("length")
    expect(classifyToken("200px")).toBe("length")
    expect(classifyToken("1.5rem")).toBe("length")
    expect(classifyToken("-10px")).toBe("length")
  })

  test("the slash separator", () => {
    expect(classifyToken("/")).toBe("slash")
  })

  test("images — none and parenthesized functions", () => {
    expect(classifyToken("none")).toBe("image")
    expect(classifyToken("url(x.png)")).toBe("image")
    expect(classifyToken("linear-gradient(#f00, #00f)")).toBe("image")
    expect(classifyToken("image-set(a.png 1x)")).toBe("image")
  })

  test("colors — hex and functional forms", () => {
    expect(classifyToken("#fff")).toBe("color")
    expect(classifyToken("#ff0000")).toBe("color")
    expect(classifyToken("oklch(0.7 0.1 240)")).toBe("color")
    expect(classifyToken("rgb(255 0 0)")).toBe("color")
  })

  test("an unrecognized token", () => {
    expect(classifyToken("wibble")).toBe("unknown")
    expect(classifyToken("bogus-keyword")).toBe("unknown")
  })
})

// ===========================================================================
// option sources
// ===========================================================================

describe("option sources", () => {
  test("repeatOptions", () => {
    expect(repeatOptions()).toEqual([
      "repeat",
      "repeat-x",
      "repeat-y",
      "space",
      "round",
      "no-repeat",
    ])
  })

  test("attachmentOptions", () => {
    expect(attachmentOptions()).toEqual(["scroll", "fixed", "local"])
  })

  test("boxOptions", () => {
    expect(boxOptions()).toEqual(["border-box", "padding-box", "content-box"])
  })

  test("sizeKeywords", () => {
    expect(sizeKeywords()).toEqual(["cover", "contain", "auto"])
  })
})

// ===========================================================================
// defaultBackground
// ===========================================================================

describe("defaultBackground", () => {
  test("seeds a valid, parseable single-layer value", () => {
    const seed = defaultBackground()
    const { error, layers } = parseBackground(seed)
    expect(error).toBeNull()
    expect(layers.length).toBeGreaterThan(0)
  })
})
