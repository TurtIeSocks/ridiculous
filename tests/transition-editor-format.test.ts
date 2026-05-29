import { describe, expect, test } from "vitest"
import {
  animationLayerToCss,
  formatAnimation,
  formatTransition,
  parseAnimation,
  parseTransition,
  transitionLayerToCss,
} from "@/components/ui/transition-editor/transition-editor.helpers"

// ===========================================================================
// transitionLayerToCss — canonical order: property duration delay easing behavior
// ===========================================================================

describe("transitionLayerToCss", () => {
  test("emits canonical order, omitting absent tokens", () => {
    expect(
      transitionLayerToCss({
        easing: "ease-in",
        duration: "200ms",
        property: "opacity",
      }),
    ).toBe("opacity 200ms ease-in")
  })

  test("includes delay between duration and easing, and the behavior flag last", () => {
    expect(
      transitionLayerToCss({
        property: "opacity",
        duration: "200ms",
        delay: "100ms",
        easing: "ease",
        allowDiscrete: true,
      }),
    ).toBe("opacity 200ms 100ms ease allow-discrete")
  })

  test("duration-only layer", () => {
    expect(transitionLayerToCss({ duration: "200ms" })).toBe("200ms")
  })
})

describe("formatTransition", () => {
  test("joins layers with `, `; empty → none", () => {
    expect(
      formatTransition([
        { property: "opacity", duration: "200ms", easing: "ease" },
        { property: "transform", duration: "0.3s" },
      ]),
    ).toBe("opacity 200ms ease, transform 0.3s")
    expect(formatTransition([])).toBe("none")
  })

  test("round-trips parse ∘ format", () => {
    const src = "opacity 200ms 100ms ease-in, transform 0.3s ease-out"
    const layers = parseTransition(src)
    expect(layers).not.toBeNull()
    expect(formatTransition(layers ?? [])).toBe(src)
  })
})

// ===========================================================================
// animationLayerToCss — canonical: duration delay easing iter dir fill play name
// ===========================================================================

describe("animationLayerToCss", () => {
  test("emits canonical order", () => {
    expect(
      animationLayerToCss({
        name: "slide",
        duration: "1s",
        delay: "200ms",
        easing: "ease",
        iterationCount: "3",
        direction: "alternate",
        fillMode: "both",
        playState: "paused",
      }),
    ).toBe("1s 200ms ease 3 alternate both paused slide")
  })

  test("name + duration only", () => {
    expect(animationLayerToCss({ name: "spin", duration: "1s" })).toBe(
      "1s spin",
    )
  })
})

describe("formatAnimation", () => {
  test("joins layers; empty → none", () => {
    expect(
      formatAnimation([
        { name: "spin", duration: "1s", iterationCount: "infinite" },
        { name: "pulse", duration: "2s" },
      ]),
    ).toBe("1s infinite spin, 2s pulse")
    expect(formatAnimation([])).toBe("none")
  })

  test("round-trips parse ∘ format", () => {
    const src = "1s 200ms ease 3 alternate both paused slide"
    const layers = parseAnimation(src)
    expect(layers).not.toBeNull()
    expect(formatAnimation(layers ?? [])).toBe(src)
  })
})
