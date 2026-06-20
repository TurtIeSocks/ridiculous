import { describe, expect, test } from "vitest"
import {
  formatBackground,
  parseBackground,
} from "@/components/ui/background-editor/background-editor.helpers"
import type { BgLayer } from "@/components/ui/background-editor/background-editor.types"

function layer(partial: Partial<BgLayer>): BgLayer {
  return {
    image: "",
    position: "",
    size: "",
    repeat: "",
    attachment: "",
    origin: "",
    clip: "",
    ...partial,
  }
}

// ===========================================================================
// formatBackground — canonical re-serialization
// ===========================================================================

describe("formatBackground", () => {
  test("a single gradient layer with position / size and repeat", () => {
    expect(
      formatBackground([
        layer({
          image: "linear-gradient(#f00, #00f)",
          position: "center",
          size: "cover",
          repeat: "no-repeat",
        }),
      ]),
    ).toBe("linear-gradient(#f00, #00f) center / cover no-repeat")
  })

  test("emits `position / size` with a space-separated slash", () => {
    expect(
      formatBackground([
        layer({ image: "url(x.png)", position: "left top", size: "50%" }),
      ]),
    ).toBe("url(x.png) left top / 50%")
  })

  test("omits the slash when there is no size", () => {
    expect(
      formatBackground([layer({ image: "url(x.png)", position: "center" })]),
    ).toBe("url(x.png) center")
  })

  test("joins multiple layers with a comma", () => {
    expect(
      formatBackground([
        layer({ image: "url(a.png)", position: "left top" }),
        layer({ image: "url(b.png)", position: "right bottom" }),
      ]),
    ).toBe("url(a.png) left top, url(b.png) right bottom")
  })

  test("color is emitted only on the final layer", () => {
    expect(
      formatBackground([
        layer({ image: "url(a.png)", position: "center", color: "#f00" }),
        layer({ image: "url(b.png)", position: "center", color: "#fff" }),
      ]),
    ).toBe("url(a.png) center, url(b.png) center #fff")
  })

  test("a lone color (single final layer)", () => {
    expect(formatBackground([layer({ color: "#fff" })])).toBe("#fff")
  })

  test("attachment, origin and clip in canonical order", () => {
    expect(
      formatBackground([
        layer({
          image: "url(x.png)",
          attachment: "fixed",
          origin: "padding-box",
          clip: "content-box",
        }),
      ]),
    ).toBe("url(x.png) fixed padding-box content-box")
  })

  test("an empty layer list serializes to the empty string", () => {
    expect(formatBackground([])).toBe("")
  })

  test("round-trips through parseBackground", () => {
    for (const src of [
      "linear-gradient(#f00, #00f) center / cover no-repeat",
      "url(x.png) left top / 50% repeat-x",
      "none, radial-gradient(#000, #fff) center",
      "#fff",
      "linear-gradient(#f00, #00f) center / cover no-repeat, #fff",
      "url(x.png) fixed padding-box content-box",
    ]) {
      const { layers, error } = parseBackground(src)
      expect(error).toBeNull()
      expect(formatBackground(layers)).toBe(src)
    }
  })
})
