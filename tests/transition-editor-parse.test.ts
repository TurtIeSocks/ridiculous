import { describe, expect, test } from "vitest"
import {
  defaultAnimationLayer,
  defaultTransitionLayer,
  layerCount,
  parseAnimation,
  parseTime,
  parseTransition,
} from "@/components/ui/transition-editor/transition-editor.helpers"
import type {
  AnimationLayer,
  TransitionLayer,
} from "@/components/ui/transition-editor/transition-editor.types"

function mustParseT(src: string): TransitionLayer[] {
  const r = parseTransition(src)
  if (r === null) throw new Error(`expected "${src}" to parse as transition`)
  return r
}
function mustParseA(src: string): AnimationLayer[] {
  const r = parseAnimation(src)
  if (r === null) throw new Error(`expected "${src}" to parse as animation`)
  return r
}

// ===========================================================================
// parseTransition
// ===========================================================================

describe("parseTransition", () => {
  test("classifies property, duration, delay, easing in any order", () => {
    expect(mustParseT("opacity 200ms 100ms ease-in")).toEqual([
      {
        property: "opacity",
        duration: "200ms",
        delay: "100ms",
        easing: "ease-in",
      },
    ])
  })

  test("first <time> is duration, second is delay (order-free otherwise)", () => {
    expect(mustParseT("ease-out 0.3s opacity 100ms")).toEqual([
      {
        property: "opacity",
        duration: "0.3s",
        delay: "100ms",
        easing: "ease-out",
      },
    ])
  })

  test("duration only — no property keyword", () => {
    expect(mustParseT("200ms")).toEqual([{ duration: "200ms" }])
  })

  test("keeps a functional easing whole (paren-aware)", () => {
    expect(mustParseT("color 100ms cubic-bezier(0.4, 0, 0.2, 1)")).toEqual([
      {
        property: "color",
        duration: "100ms",
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    ])
  })

  test("captures the allow-discrete behavior flag", () => {
    expect(mustParseT("opacity 200ms allow-discrete")).toEqual([
      { property: "opacity", duration: "200ms", allowDiscrete: true },
    ])
  })

  test("parses a multi-layer comma list", () => {
    expect(mustParseT("opacity 200ms ease, transform 0.3s ease-out")).toEqual([
      { property: "opacity", duration: "200ms", easing: "ease" },
      { property: "transform", duration: "0.3s", easing: "ease-out" },
    ])
  })

  test("none / empty → []", () => {
    expect(parseTransition("none")).toEqual([])
    expect(parseTransition("")).toEqual([])
    expect(parseTransition("   ")).toEqual([])
  })

  test("tolerates calc()/var() in a time slot (kept verbatim)", () => {
    expect(mustParseT("opacity calc(200ms + 1s)")).toEqual([
      { property: "opacity", duration: "calc(200ms + 1s)" },
    ])
  })

  test("rejects a third <time> token", () => {
    expect(parseTransition("opacity 200ms 100ms 50ms ease")).toBeNull()
  })

  test("rejects two easings / two properties / doubled behavior", () => {
    expect(parseTransition("opacity ease ease-in")).toBeNull()
    expect(parseTransition("opacity color 200ms")).toBeNull()
    expect(
      parseTransition("opacity 200ms allow-discrete allow-discrete"),
    ).toBeNull()
  })

  test("rejects an unknown / non-ident token", () => {
    expect(parseTransition("opacity 200ms @x")).toBeNull()
  })

  test("accepts a negative <time> and a leading-dot <time>", () => {
    expect(mustParseT("opacity -200ms")).toEqual([
      { property: "opacity", duration: "-200ms" },
    ])
    expect(mustParseT("opacity .5s")).toEqual([
      { property: "opacity", duration: ".5s" },
    ])
  })

  test("rejects a malformed multi-dot <time> (unified parseTime grammar)", () => {
    // The single `parseTime` helper requires a well-formed signed decimal
    // (`-?\d*\.?\d*`), so a multi-dot token like `1.2.3ms` is not a <time>;
    // it then fails ident validation and the whole layer is rejected. (The
    // prior classifier used a looser `[\d.]+` that accepted this.)
    expect(parseTransition("opacity 1.2.3ms")).toBeNull()
  })

  test("a list with any invalid layer is null", () => {
    expect(parseTransition("opacity 200ms, color 200ms 100ms 50ms")).toBeNull()
  })
})

// ===========================================================================
// parseAnimation
// ===========================================================================

describe("parseAnimation", () => {
  test("classifies every animation token kind", () => {
    expect(mustParseA("slide 1s 200ms ease 3 alternate both paused")).toEqual([
      {
        name: "slide",
        duration: "1s",
        delay: "200ms",
        easing: "ease",
        iterationCount: "3",
        direction: "alternate",
        fillMode: "both",
        playState: "paused",
      },
    ])
  })

  test("infinite is an iteration count", () => {
    expect(mustParseA("spin 1s infinite")).toEqual([
      { name: "spin", duration: "1s", iterationCount: "infinite" },
    ])
  })

  test("a bare <number> is the iteration count, not the name", () => {
    expect(mustParseA("1s 3 spin")).toEqual([
      { name: "spin", duration: "1s", iterationCount: "3" },
    ])
  })

  test("duration only", () => {
    expect(mustParseA("1s")).toEqual([{ duration: "1s" }])
  })

  test("multi-layer comma list", () => {
    expect(mustParseA("spin 1s linear infinite, pulse 2s ease")).toEqual([
      {
        name: "spin",
        duration: "1s",
        easing: "linear",
        iterationCount: "infinite",
      },
      { name: "pulse", duration: "2s", easing: "ease" },
    ])
  })

  test("none / empty → []", () => {
    expect(parseAnimation("none")).toEqual([])
    expect(parseAnimation("")).toEqual([])
  })

  test("rejects two iteration counts / two directions / unknown", () => {
    expect(parseAnimation("spin 1s 2 3")).toBeNull()
    expect(parseAnimation("spin alternate reverse")).toBeNull()
    expect(parseAnimation("spin 1s up")).toBeNull()
  })
})

// ===========================================================================
// parseTime — the single <time> splitter shared by every call site
// ===========================================================================

describe("parseTime", () => {
  test("splits a <time> into numeric + lowercased unit", () => {
    expect(parseTime("200ms")).toEqual({ num: "200", unit: "ms" })
    expect(parseTime("0.3s")).toEqual({ num: "0.3", unit: "s" })
    expect(parseTime("0.3S")).toEqual({ num: "0.3", unit: "s" })
    expect(parseTime("-1.5s")).toEqual({ num: "-1.5", unit: "s" })
    expect(parseTime(".5s")).toEqual({ num: ".5", unit: "s" })
  })

  test("returns null for non-<time> tokens", () => {
    expect(parseTime("")).toBeNull()
    expect(parseTime("calc(1s)")).toBeNull()
    expect(parseTime("ease")).toBeNull()
    expect(parseTime("1.2.3ms")).toBeNull()
    expect(parseTime("200")).toBeNull() // no unit
  })
})

// ===========================================================================
// layerCount + defaults
// ===========================================================================

describe("layerCount", () => {
  test("counts transition layers; invalid → 0", () => {
    expect(layerCount("transition", "opacity 1s, color 2s")).toBe(2)
    expect(layerCount("transition", "none")).toBe(0)
    expect(layerCount("transition", "opacity 1s 2s 3s 4s")).toBe(0)
  })
  test("counts animation layers", () => {
    expect(layerCount("animation", "spin 1s, pulse 2s, slide 3s")).toBe(3)
    expect(layerCount("animation", "none")).toBe(0)
  })
})

describe("defaults", () => {
  test("defaultTransitionLayer is a sensible all-200ms-ease layer", () => {
    expect(defaultTransitionLayer()).toEqual({
      property: "all",
      duration: "200ms",
      easing: "ease",
    })
  })
  test("defaultAnimationLayer is a named 1s-ease layer", () => {
    expect(defaultAnimationLayer()).toEqual({
      name: "slide",
      duration: "1s",
      easing: "ease",
      iterationCount: "1",
    })
  })
})
