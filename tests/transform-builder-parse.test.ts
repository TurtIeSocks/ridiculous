import { describe, expect, test } from "vitest"
import {
  argSpec,
  defaultItem,
  parseTransform,
  transformFunctions,
} from "@/components/ui/transform-builder/transform-builder.helpers"
import type { TransformItem } from "@/components/ui/transform-builder/transform-builder.types"

/** Parse and assert non-null — keeps the suite free of `!` assertions. */
function mustParse(src: string): TransformItem[] {
  const items = parseTransform(src)
  if (items === null) throw new Error(`expected "${src}" to parse`)
  return items
}

describe("parseTransform", () => {
  test("parses a multi-function list into typed items", () => {
    const items = mustParse("translateX(10px) rotate(45deg) scale(1.5)")
    expect(items).toEqual([
      { fn: "translateX", value: "10px" },
      { fn: "rotate", angle: "45deg" },
      { fn: "scale", x: "1.5" },
    ])
  })

  test("parses two-arg translate and scale", () => {
    expect(mustParse("translate(10px, 20%)")).toEqual([
      { fn: "translate", x: "10px", y: "20%" },
    ])
    expect(mustParse("scale(1, 2)")).toEqual([{ fn: "scale", x: "1", y: "2" }])
  })

  test("parses translate3d / rotate3d / scale3d", () => {
    expect(mustParse("translate3d(1px, 2%, 3px)")).toEqual([
      { fn: "translate3d", x: "1px", y: "2%", z: "3px" },
    ])
    expect(mustParse("rotate3d(1, 1, 1, 45deg)")).toEqual([
      { fn: "rotate3d", x: "1", y: "1", z: "1", angle: "45deg" },
    ])
    expect(mustParse("scale3d(1, 2, 3)")).toEqual([
      { fn: "scale3d", x: "1", y: "2", z: "3" },
    ])
  })

  test("parses matrix and matrix3d into value tuples", () => {
    expect(mustParse("matrix(1, 0, 0, 1, 0, 0)")).toEqual([
      { fn: "matrix", values: ["1", "0", "0", "1", "0", "0"] },
    ])
    const m3d = mustParse(
      "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)",
    )
    expect(m3d[0].fn).toBe("matrix3d")
    expect((m3d[0] as { values: string[] }).values).toHaveLength(16)
  })

  test("none and empty parse to an empty list", () => {
    expect(parseTransform("none")).toEqual([])
    expect(parseTransform("")).toEqual([])
    expect(parseTransform("   ")).toEqual([])
  })

  test("arity violations and unknown functions reject (null)", () => {
    expect(parseTransform("matrix(1, 0, 0, 1, 0)")).toBeNull()
    expect(parseTransform("translate(1px, 2px, 3px)")).toBeNull()
    expect(parseTransform("rotate3d(1, 1, 45deg)")).toBeNull()
    expect(parseTransform("wobble(3)")).toBeNull()
    expect(parseTransform("rotate")).toBeNull()
  })

  test("keeps calc()/var() arguments verbatim (runtime is tolerant)", () => {
    expect(mustParse("translateX(calc(1px + 2px))")).toEqual([
      { fn: "translateX", value: "calc(1px + 2px)" },
    ])
    expect(mustParse("rotate(var(--a))")).toEqual([
      { fn: "rotate", angle: "var(--a)" },
    ])
  })

  test("tolerates extra whitespace between functions", () => {
    expect(mustParse("translateX(10px)   rotate(45deg)")).toEqual([
      { fn: "translateX", value: "10px" },
      { fn: "rotate", angle: "45deg" },
    ])
  })
})

describe("transformFunctions", () => {
  test("lists function names in order", () => {
    expect(transformFunctions("translateX(1px) rotate(45deg)")).toEqual([
      "translateX",
      "rotate",
    ])
    expect(transformFunctions("none")).toEqual([])
  })
})

describe("defaultItem", () => {
  test("seeds sensible defaults per function", () => {
    expect(defaultItem("translateX")).toEqual({
      fn: "translateX",
      value: "0px",
    })
    expect(defaultItem("rotate")).toEqual({ fn: "rotate", angle: "0deg" })
    expect(defaultItem("scale")).toEqual({ fn: "scale", x: "1" })
    expect(defaultItem("perspective")).toEqual({
      fn: "perspective",
      value: "800px",
    })
    expect(defaultItem("matrix")).toEqual({
      fn: "matrix",
      values: ["1", "0", "0", "1", "0", "0"],
    })
    const m3d = defaultItem("matrix3d")
    expect((m3d as { values: string[] }).values).toHaveLength(16)
  })
})

describe("argSpec", () => {
  test("describes arity and argument kinds", () => {
    expect(argSpec("translateX")).toMatchObject({
      min: 1,
      max: 1,
      kinds: ["length-percentage"],
    })
    expect(argSpec("translate3d")).toMatchObject({
      min: 3,
      max: 3,
      kinds: ["length-percentage", "length-percentage", "length"],
    })
    expect(argSpec("rotate3d")).toMatchObject({
      min: 4,
      max: 4,
      kinds: ["number", "number", "number", "angle"],
    })
    expect(argSpec("translate")).toMatchObject({ min: 1, max: 2 })
    expect(argSpec("matrix")).toMatchObject({ min: 6, max: 6 })
    expect(argSpec("matrix3d")).toMatchObject({ min: 16, max: 16 })
  })
})
