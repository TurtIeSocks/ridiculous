import { describe, expect, test } from "vitest"
import {
  formatShape,
  parseShape,
} from "@/components/ui/shape-path-editor/shape-path-editor.helpers"
import type { ShapeValue } from "@/components/ui/shape-path-editor/shape-path-editor.types"

// ===========================================================================
// formatShape — canonical re-serialization (spec §4)
// ===========================================================================

describe("formatShape — the from seed + fill-rule", () => {
  test("a from seed with no fill-rule", () => {
    const shape: ShapeValue = {
      fillRule: null,
      from: { x: "0px", y: "0px" },
      commands: [{ kind: "close" }],
    }
    expect(formatShape(shape)).toBe("shape(from 0px 0px, close)")
  })

  test("a nonzero fill-rule leads the value", () => {
    const shape: ShapeValue = {
      fillRule: "nonzero",
      from: { x: "10px", y: "20px" },
      commands: [{ kind: "close" }],
    }
    expect(formatShape(shape)).toBe("shape(nonzero from 10px 20px, close)")
  })

  test("an evenodd fill-rule leads the value", () => {
    const shape: ShapeValue = {
      fillRule: "evenodd",
      from: { x: "0%", y: "0%" },
      commands: [{ kind: "hline", by: true, value: "50px" }, { kind: "close" }],
    }
    expect(formatShape(shape)).toBe(
      "shape(evenodd from 0% 0%, hline by 50px, close)",
    )
  })

  test("percentage units are preserved", () => {
    const shape: ShapeValue = {
      fillRule: null,
      from: { x: "25%", y: "75%" },
      commands: [{ kind: "close" }],
    }
    expect(formatShape(shape)).toBe("shape(from 25% 75%, close)")
  })
})

describe("formatShape — per command kind", () => {
  test("move / line", () => {
    expect(
      formatShape({
        fillRule: null,
        from: { x: "0px", y: "0px" },
        commands: [
          { kind: "move", by: false, to: { x: "10px", y: "20px" } },
          { kind: "line", by: true, to: { x: "30px", y: "40px" } },
        ],
      }),
    ).toBe("shape(from 0px 0px, move to 10px 20px, line by 30px 40px)")
  })

  test("hline / vline", () => {
    expect(
      formatShape({
        fillRule: null,
        from: { x: "0px", y: "0px" },
        commands: [
          { kind: "hline", by: true, value: "50px" },
          { kind: "vline", by: false, value: "60px" },
        ],
      }),
    ).toBe("shape(from 0px 0px, hline by 50px, vline to 60px)")
  })

  test("curve quadratic (single control)", () => {
    expect(
      formatShape({
        fillRule: null,
        from: { x: "0px", y: "0px" },
        commands: [
          {
            kind: "curve",
            by: false,
            to: { x: "100px", y: "100px" },
            control: { x: "50px", y: "0px" },
          },
        ],
      }),
    ).toBe("shape(from 0px 0px, curve to 100px 100px with 50px 0px)")
  })

  test("curve cubic (second control after /)", () => {
    expect(
      formatShape({
        fillRule: null,
        from: { x: "0px", y: "0px" },
        commands: [
          {
            kind: "curve",
            by: false,
            to: { x: "100px", y: "100px" },
            control: { x: "20px", y: "0px" },
            control2: { x: "80px", y: "100px" },
          },
        ],
      }),
    ).toBe(
      "shape(from 0px 0px, curve to 100px 100px with 20px 0px / 80px 100px)",
    )
  })

  test("smooth without control", () => {
    expect(
      formatShape({
        fillRule: null,
        from: { x: "10px", y: "10px" },
        commands: [{ kind: "smooth", by: false, to: { x: "90px", y: "90px" } }],
      }),
    ).toBe("shape(from 10px 10px, smooth to 90px 90px)")
  })

  test("smooth with control", () => {
    expect(
      formatShape({
        fillRule: null,
        from: { x: "0px", y: "0px" },
        commands: [
          {
            kind: "smooth",
            by: false,
            to: { x: "90px", y: "90px" },
            control: { x: "40px", y: "10px" },
          },
        ],
      }),
    ).toBe("shape(from 0px 0px, smooth to 90px 90px with 40px 10px)")
  })

  test("arc with a single radius collapses both axes to one of value", () => {
    expect(
      formatShape({
        fillRule: null,
        from: { x: "0px", y: "0px" },
        commands: [
          {
            kind: "arc",
            by: false,
            to: { x: "100px", y: "0px" },
            radius: { x: "50px", y: "50px" },
          },
        ],
      }),
    ).toBe("shape(from 0px 0px, arc to 100px 0px of 50px)")
  })

  test("arc with two radii keeps both", () => {
    expect(
      formatShape({
        fillRule: null,
        from: { x: "0px", y: "0px" },
        commands: [
          {
            kind: "arc",
            by: false,
            to: { x: "100px", y: "0px" },
            radius: { x: "50px", y: "30px" },
          },
        ],
      }),
    ).toBe("shape(from 0px 0px, arc to 100px 0px of 50px 30px)")
  })

  test("arc appends a flags tail", () => {
    expect(
      formatShape({
        fillRule: null,
        from: { x: "0px", y: "0px" },
        commands: [
          {
            kind: "arc",
            by: false,
            to: { x: "100px", y: "0px" },
            radius: { x: "50px", y: "50px" },
            flags: "cw large",
          },
        ],
      }),
    ).toBe("shape(from 0px 0px, arc to 100px 0px of 50px cw large)")
  })
})

// ===========================================================================
// round-trip — parse(format(x)) and format(parse(x))
// ===========================================================================

describe("round-trip parse ⇄ format", () => {
  const canonical = [
    "shape(from 0px 0px, line to 100px 0px, close)",
    "shape(from 0% 0%, curve to 100px 100px with 50px 0px, close)",
    "shape(evenodd from 0px 0px, hline by 50px, vline by 50px, close)",
    "shape(from 10px 10px, smooth to 90px 90px, close)",
    "shape(from 0px 0px, arc to 100px 0px of 50px, close)",
    "shape(nonzero from 5px 5px, move to 20px 20px, line by 10px 10px, close)",
    "shape(from 0px 0px, curve to 100px 100px with 20px 0px / 80px 100px, close)",
    "shape(from 0px 0px, smooth to 90px 90px with 40px 10px, close)",
    "shape(from 0px 0px, arc to 100px 0px of 50px 30px, close)",
  ]

  for (const src of canonical) {
    test(`format(parse(x)) === x for: ${src}`, () => {
      const parsed = parseShape(src)
      expect(parsed.error).toBeNull()
      expect(formatShape(parsed)).toBe(src)
    })
  }

  test("parse(format(x)) preserves structure", () => {
    const shape: ShapeValue = {
      fillRule: "evenodd",
      from: { x: "0px", y: "0px" },
      commands: [
        { kind: "line", by: false, to: { x: "100px", y: "0px" } },
        {
          kind: "curve",
          by: false,
          to: { x: "100px", y: "100px" },
          control: { x: "50px", y: "0px" },
        },
        { kind: "close" },
      ],
    }
    const reparsed = parseShape(formatShape(shape))
    expect(reparsed.error).toBeNull()
    expect(reparsed.fillRule).toBe(shape.fillRule)
    expect(reparsed.from).toEqual(shape.from)
    expect(reparsed.commands).toEqual(shape.commands)
  })
})
