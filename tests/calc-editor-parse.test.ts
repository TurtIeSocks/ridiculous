import { describe, expect, test } from "vitest"
import {
  calcDimension,
  evaluateCalc,
  parseCalc,
  tokenizeCalc,
} from "@/components/ui/calc-editor/calc-editor.helpers"
import type { CalcNode } from "@/components/ui/calc-editor/calc-editor.types"

/** Parse and assert non-null — keeps the suite free of `!` assertions. */
function mustParse(src: string): CalcNode {
  const node = parseCalc(src)
  if (node === null) throw new Error(`expected "${src}" to parse`)
  return node
}

describe("tokenizeCalc", () => {
  test("splits numbers / units / ops / parens", () => {
    expect(tokenizeCalc("calc(10px + 2rem)").map((t) => t.type)).toEqual([
      "ident",
      "lparen",
      "number",
      "op",
      "number",
      "rparen",
    ])
  })

  test("handles signed numbers and percent", () => {
    const t = tokenizeCalc("calc(-5px + 50%)")
    expect(t.some((x) => x.type === "number" && x.value === "-5px")).toBe(true)
    expect(t.some((x) => x.type === "number" && x.value === "50%")).toBe(true)
  })

  test("tokenizes commas in clamp", () => {
    const t = tokenizeCalc("clamp(1rem, 2vw, 3rem)")
    expect(t.filter((x) => x.type === "comma")).toHaveLength(2)
  })

  test("treats bare * and / as operators", () => {
    const ops = tokenizeCalc("calc(10px * 2 / 4)")
      .filter((t) => t.type === "op")
      .map((t) => t.value)
    expect(ops).toEqual(["*", "/"])
  })
})

describe("parseCalc", () => {
  test("parses calc with precedence (* binds tighter than +)", () => {
    const n = parseCalc("calc(10px + 2 * 5px)")
    expect(n).not.toBeNull()
    expect(n).toMatchObject({
      kind: "fn",
      name: "calc",
      args: [
        {
          kind: "binary",
          op: "+",
          left: { kind: "literal", value: "10px" },
          right: { kind: "binary", op: "*" },
        },
      ],
    })
  })

  test("left-associates same-precedence operators", () => {
    // 10px - 2px - 3px ⇒ ((10 - 2) - 3)
    const n = parseCalc("calc(10px - 2px - 3px)") as Extract<
      CalcNode,
      { kind: "fn" }
    >
    const expr = n.args[0] as Extract<CalcNode, { kind: "binary" }>
    expect(expr.op).toBe("-")
    expect(expr.left).toMatchObject({ kind: "binary", op: "-" })
    expect(expr.right).toMatchObject({ kind: "literal", value: "3px" })
  })

  test("parses clamp / min / max", () => {
    expect(parseCalc("clamp(1rem, 2vw, 3rem)")).toMatchObject({
      kind: "fn",
      name: "clamp",
    })
    const min = parseCalc("min(1px, 2px, 3px)") as Extract<
      CalcNode,
      { kind: "fn" }
    >
    expect(min.args).toHaveLength(3)
  })

  test("parses nested functions and groups", () => {
    expect(parseCalc("calc(min(10px, 2rem) + 1rem)")).not.toBeNull()
    expect(parseCalc("calc((10px + 2px) * 3)")).toMatchObject({
      kind: "fn",
      name: "calc",
      args: [{ kind: "binary", op: "*" }],
    })
  })

  test("parses var() passthrough", () => {
    const n = parseCalc("calc(100% - var(--gap))") as Extract<
      CalcNode,
      { kind: "fn" }
    >
    const expr = n.args[0] as Extract<CalcNode, { kind: "binary" }>
    expect(expr.right).toMatchObject({ kind: "var", name: "--gap" })
  })

  test("returns null on syntax errors", () => {
    expect(parseCalc("calc(10px +")).toBeNull() // dangling operator
    expect(parseCalc("calc()")).toBeNull() // empty
    expect(parseCalc("clamp(1px, 2px)")).toBeNull() // wrong arity
    expect(parseCalc("clamp(1px, 2px, 3px, 4px)")).toBeNull() // too many
    expect(parseCalc("rgb(1, 2, 3)")).toBeNull() // not a calc-family fn
    expect(parseCalc("calc(10px 2px)")).toBeNull() // missing operator
    expect(parseCalc("calc((1px)")).toBeNull() // unbalanced parens
    expect(parseCalc("")).toBeNull()
  })
})

describe("calcDimension", () => {
  test("same-dimension add, mismatch null", () => {
    expect(calcDimension(mustParse("calc(10px + 2rem)"))).toBe("length")
    expect(calcDimension(mustParse("calc(50% + 10%)"))).toBe("percent")
    expect(calcDimension(mustParse("calc(10px + 45deg)"))).toBeNull()
    expect(calcDimension(mustParse("calc(100% - 10px)"))).toBeNull()
  })

  test("multiply / divide number rules", () => {
    expect(calcDimension(mustParse("calc(10px * 3)"))).toBe("length")
    expect(calcDimension(mustParse("calc(2 * 10px)"))).toBe("length")
    expect(calcDimension(mustParse("calc(10px * 2px)"))).toBeNull()
    expect(calcDimension(mustParse("calc(10px / 2)"))).toBe("length")
    expect(calcDimension(mustParse("calc(10px / 2px)"))).toBeNull()
    expect(calcDimension(mustParse("calc(2 / 10px)"))).toBeNull()
  })

  test("clamp / min require same dimension across args", () => {
    expect(calcDimension(mustParse("clamp(1rem, 2vw, 3rem)"))).toBe("length")
    expect(calcDimension(mustParse("min(10px, 45deg)"))).toBeNull()
    expect(calcDimension(mustParse("clamp(1rem, 2vw, 3deg)"))).toBeNull()
  })

  test("nested functions propagate dimensions", () => {
    expect(calcDimension(mustParse("calc(min(10px, 2rem) + 1rem)"))).toBe(
      "length",
    )
    expect(
      calcDimension(mustParse("clamp(1rem, calc(1rem + 2vw), 3rem)")),
    ).toBe("length")
  })

  test("var() is dimension-tolerant (adopts the sibling dimension)", () => {
    expect(calcDimension(mustParse("calc(100% - var(--gap))"))).toBe("percent")
    expect(calcDimension(mustParse("calc(10px + var(--x))"))).toBe("length")
    // var alone is dimension-unknown but valid → "number"-tolerant
    expect(calcDimension(mustParse("calc(var(--x) * 2)"))).not.toBeNull()
  })

  test("math constants are numbers", () => {
    expect(calcDimension(mustParse("calc(10px * pi)"))).toBe("length")
  })
})

describe("evaluateCalc facade", () => {
  test("valid → node + dimension, no error", () => {
    const r = evaluateCalc("calc(10px + 2rem)")
    expect(r.error).toBeNull()
    expect(r.dimension).toBe("length")
    expect(r.node).not.toBeNull()
  })

  test("dimensional violation → dimension null + error", () => {
    const r = evaluateCalc("calc(10px + 45deg)")
    expect(r.dimension).toBeNull()
    expect(r.error).toMatch(/dimension|mismatch|unit|incompatible/i)
  })

  test("syntax error → node null + error", () => {
    const r = evaluateCalc("calc(10px +")
    expect(r.node).toBeNull()
    expect(r.error).not.toBeNull()
  })
})
