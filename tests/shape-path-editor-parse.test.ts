import { describe, expect, test } from "vitest"
import {
  commandArity,
  commandNames,
  defaultShape,
  parseShape,
  shapeToPoints,
  updatePoint,
} from "@/components/ui/shape-path-editor/shape-path-editor.helpers"
import type { ShapeCommand } from "@/components/ui/shape-path-editor/shape-path-editor.types"

// ===========================================================================
// parseShape — the from seed + per-command discriminated union (spec §4)
// ===========================================================================

describe("parseShape — fill-rule + from seed", () => {
  test("no fill-rule defaults to null with the from point", () => {
    const r = parseShape("shape(from 0px 0px, close)")
    expect(r.error).toBeNull()
    expect(r.fillRule).toBeNull()
    expect(r.from).toEqual({ x: "0px", y: "0px" })
  })

  test("a nonzero fill-rule is captured", () => {
    const r = parseShape("shape(nonzero from 10px 20px, close)")
    expect(r.error).toBeNull()
    expect(r.fillRule).toBe("nonzero")
    expect(r.from).toEqual({ x: "10px", y: "20px" })
  })

  test("an evenodd fill-rule is captured", () => {
    const r = parseShape("shape(evenodd from 0% 0%, hline by 50px, close)")
    expect(r.error).toBeNull()
    expect(r.fillRule).toBe("evenodd")
    expect(r.from).toEqual({ x: "0%", y: "0%" })
  })

  test("percentage coordinates round-trip in the from seed", () => {
    const r = parseShape("shape(from 25% 75%, close)")
    expect(r.error).toBeNull()
    expect(r.from).toEqual({ x: "25%", y: "75%" })
  })
})

describe("parseShape — all eight command kinds", () => {
  test("move", () => {
    const r = parseShape("shape(from 0px 0px, move to 10px 20px, close)")
    expect(r.error).toBeNull()
    expect(r.commands[0]).toEqual<ShapeCommand>({
      kind: "move",
      by: false,
      to: { x: "10px", y: "20px" },
    })
  })

  test("line to (absolute)", () => {
    const r = parseShape("shape(from 0px 0px, line to 100px 0px, close)")
    expect(r.error).toBeNull()
    expect(r.commands[0]).toEqual<ShapeCommand>({
      kind: "line",
      by: false,
      to: { x: "100px", y: "0px" },
    })
  })

  test("line by (relative)", () => {
    const r = parseShape("shape(from 0px 0px, line by 30px 40px, close)")
    expect(r.error).toBeNull()
    expect(r.commands[0]).toEqual<ShapeCommand>({
      kind: "line",
      by: true,
      to: { x: "30px", y: "40px" },
    })
  })

  test("hline", () => {
    const r = parseShape("shape(from 0px 0px, hline by 50px, close)")
    expect(r.error).toBeNull()
    expect(r.commands[0]).toEqual<ShapeCommand>({
      kind: "hline",
      by: true,
      value: "50px",
    })
  })

  test("vline", () => {
    const r = parseShape("shape(from 0px 0px, vline to 50px, close)")
    expect(r.error).toBeNull()
    expect(r.commands[0]).toEqual<ShapeCommand>({
      kind: "vline",
      by: false,
      value: "50px",
    })
  })

  test("curve with one control point (quadratic)", () => {
    const r = parseShape(
      "shape(from 0px 0px, curve to 100px 100px with 50px 0px, close)",
    )
    expect(r.error).toBeNull()
    expect(r.commands[0]).toEqual<ShapeCommand>({
      kind: "curve",
      by: false,
      to: { x: "100px", y: "100px" },
      control: { x: "50px", y: "0px" },
    })
  })

  test("curve with a second control point (cubic, after /)", () => {
    const r = parseShape(
      "shape(from 0px 0px, curve to 100px 100px with 20px 0px / 80px 100px, close)",
    )
    expect(r.error).toBeNull()
    expect(r.commands[0]).toEqual<ShapeCommand>({
      kind: "curve",
      by: false,
      to: { x: "100px", y: "100px" },
      control: { x: "20px", y: "0px" },
      control2: { x: "80px", y: "100px" },
    })
  })

  test("smooth without a control point", () => {
    const r = parseShape("shape(from 10px 10px, smooth to 90px 90px, close)")
    expect(r.error).toBeNull()
    expect(r.commands[0]).toEqual<ShapeCommand>({
      kind: "smooth",
      by: false,
      to: { x: "90px", y: "90px" },
    })
  })

  test("smooth with a control point", () => {
    const r = parseShape(
      "shape(from 0px 0px, smooth to 90px 90px with 40px 10px, close)",
    )
    expect(r.error).toBeNull()
    expect(r.commands[0]).toEqual<ShapeCommand>({
      kind: "smooth",
      by: false,
      to: { x: "90px", y: "90px" },
      control: { x: "40px", y: "10px" },
    })
  })

  test("arc with one radius mirrors into both axes", () => {
    const r = parseShape("shape(from 0px 0px, arc to 100px 0px of 50px, close)")
    expect(r.error).toBeNull()
    expect(r.commands[0]).toEqual<ShapeCommand>({
      kind: "arc",
      by: false,
      to: { x: "100px", y: "0px" },
      radius: { x: "50px", y: "50px" },
    })
  })

  test("arc with two radii", () => {
    const r = parseShape(
      "shape(from 0px 0px, arc to 100px 0px of 50px 30px, close)",
    )
    expect(r.error).toBeNull()
    expect(r.commands[0]).toEqual<ShapeCommand>({
      kind: "arc",
      by: false,
      to: { x: "100px", y: "0px" },
      radius: { x: "50px", y: "30px" },
    })
  })

  test("arc captures a lenient trailing flags tail", () => {
    const r = parseShape(
      "shape(from 0px 0px, arc to 100px 0px of 50px cw large, close)",
    )
    expect(r.error).toBeNull()
    const cmd = r.commands[0]
    expect(cmd.kind).toBe("arc")
    if (cmd.kind === "arc") {
      expect(cmd.radius).toEqual({ x: "50px", y: "50px" })
      expect(cmd.flags).toBe("cw large")
    }
  })

  test("close", () => {
    const r = parseShape("shape(from 0px 0px, line to 10px 10px, close)")
    expect(r.error).toBeNull()
    expect(r.commands[r.commands.length - 1]).toEqual<ShapeCommand>({
      kind: "close",
    })
  })

  test("a multi-command path keeps order", () => {
    const r = parseShape(
      "shape(from 0px 0px, line to 100px 0px, line to 100px 100px, close)",
    )
    expect(r.error).toBeNull()
    expect(r.commands.map((c) => c.kind)).toEqual(["line", "line", "close"])
  })
})

describe("parseShape — errors", () => {
  test("a non-shape function errors", () => {
    const r = parseShape("rotate(90deg)")
    expect(r.error).not.toBeNull()
  })

  test("an empty string errors", () => {
    const r = parseShape("")
    expect(r.error).not.toBeNull()
  })

  test("a missing from seed errors", () => {
    const r = parseShape("shape(line to 10px 10px, close)")
    expect(r.error).not.toBeNull()
  })

  test("an unknown command errors", () => {
    const r = parseShape("shape(from 0px 0px, wiggle to 10px 10px)")
    expect(r.error).not.toBeNull()
  })

  test("a line with one coordinate (not a pair) errors", () => {
    const r = parseShape("shape(from 0px 0px, line to 100px)")
    expect(r.error).not.toBeNull()
  })

  test("a curve missing its with control point errors", () => {
    const r = parseShape("shape(from 0px 0px, curve to 10px 10px)")
    expect(r.error).not.toBeNull()
  })

  test("a missing by/to direction errors", () => {
    const r = parseShape("shape(from 0px 0px, line 10px 10px)")
    expect(r.error).not.toBeNull()
  })
})

// ===========================================================================
// commandNames / commandArity / defaultShape
// ===========================================================================

describe("commandNames", () => {
  test("returns all eight names", () => {
    expect(commandNames()).toEqual([
      "move",
      "line",
      "hline",
      "vline",
      "curve",
      "smooth",
      "arc",
      "close",
    ])
  })
})

describe("commandArity — coordinate-pair count a kind carries", () => {
  test("line-like carry one pair", () => {
    expect(commandArity("move")).toBe(1)
    expect(commandArity("line")).toBe(1)
  })

  test("hline/vline carry no pairs (a single scalar)", () => {
    expect(commandArity("hline")).toBe(0)
    expect(commandArity("vline")).toBe(0)
  })

  test("curve carries the endpoint + a control point", () => {
    expect(commandArity("curve")).toBe(2)
  })

  test("smooth + arc carry the endpoint pair", () => {
    expect(commandArity("smooth")).toBe(1)
    expect(commandArity("arc")).toBe(1)
  })

  test("close carries nothing", () => {
    expect(commandArity("close")).toBe(0)
  })
})

describe("defaultShape", () => {
  test("is a valid, parseable shape() seed", () => {
    const seed = defaultShape()
    expect(seed.startsWith("shape(")).toBe(true)
    const r = parseShape(seed)
    expect(r.error).toBeNull()
    expect(r.commands.length).toBeGreaterThan(0)
  })
})

// ===========================================================================
// shapeToPoints — endpoints + control handles in normalized 0..200 px space
// ===========================================================================

describe("shapeToPoints", () => {
  test("the from seed is the first endpoint", () => {
    const { from, commands } = parseShape("shape(from 20px 40px, close)")
    const pts = shapeToPoints({ fillRule: null, from, commands })
    expect(pts[0]).toMatchObject({
      role: "endpoint",
      cmdIndex: -1,
      x: 20,
      y: 40,
    })
  })

  test("strips units to produce numeric geometry", () => {
    const r = parseShape("shape(from 0px 0px, line to 100px 50px, close)")
    const pts = shapeToPoints(r)
    const endpoint = pts.find((p) => p.role === "endpoint" && p.cmdIndex === 0)
    expect(endpoint).toMatchObject({ x: 100, y: 50 })
  })

  test("a curve contributes an endpoint and a control handle", () => {
    const r = parseShape(
      "shape(from 0px 0px, curve to 100px 100px with 50px 0px, close)",
    )
    const pts = shapeToPoints(r)
    const curvePts = pts.filter((p) => p.cmdIndex === 0)
    const roles = curvePts.map((p) => p.role).sort()
    expect(roles).toContain("endpoint")
    expect(roles).toContain("control")
    const control = curvePts.find((p) => p.role === "control")
    expect(control).toMatchObject({ x: 50, y: 0 })
  })

  test("a cubic curve contributes a second control handle", () => {
    const r = parseShape(
      "shape(from 0px 0px, curve to 100px 100px with 20px 0px / 80px 100px, close)",
    )
    const pts = shapeToPoints(r)
    const control2 = pts.find((p) => p.cmdIndex === 0 && p.role === "control2")
    expect(control2).toMatchObject({ x: 80, y: 100 })
  })

  test("hline/vline/close contribute no draggable points", () => {
    const r = parseShape(
      "shape(from 0px 0px, hline by 50px, vline to 50px, close)",
    )
    const pts = shapeToPoints(r)
    // only the from seed endpoint is draggable
    expect(pts.filter((p) => p.cmdIndex >= 0)).toHaveLength(0)
  })

  test("every point carries a stable, unique id", () => {
    const r = parseShape(
      "shape(from 0px 0px, curve to 100px 100px with 50px 0px, line to 0px 0px, close)",
    )
    const pts = shapeToPoints(r)
    const ids = pts.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ===========================================================================
// updatePoint — write px coords back to the matching slot
// ===========================================================================

describe("updatePoint", () => {
  test("moves a command endpoint, writing px units", () => {
    const r = parseShape("shape(from 0px 0px, line to 100px 0px, close)")
    const pts = shapeToPoints(r)
    const endpoint = pts.find((p) => p.role === "endpoint" && p.cmdIndex === 0)
    if (endpoint === undefined) throw new Error("no endpoint")
    const next = updatePoint(r, endpoint.id, 120, 60)
    const cmd = next.commands[0]
    expect(cmd).toEqual<ShapeCommand>({
      kind: "line",
      by: false,
      to: { x: "120px", y: "60px" },
    })
  })

  test("moves the from seed", () => {
    const r = parseShape("shape(from 0px 0px, close)")
    const pts = shapeToPoints(r)
    const seed = pts.find((p) => p.cmdIndex === -1)
    if (seed === undefined) throw new Error("no seed")
    const next = updatePoint(r, seed.id, 30, 70)
    expect(next.from).toEqual({ x: "30px", y: "70px" })
  })

  test("moves a control handle independently of its endpoint", () => {
    const r = parseShape(
      "shape(from 0px 0px, curve to 100px 100px with 50px 0px, close)",
    )
    const pts = shapeToPoints(r)
    const control = pts.find((p) => p.role === "control" && p.cmdIndex === 0)
    if (control === undefined) throw new Error("no control")
    const next = updatePoint(r, control.id, 25, 75)
    const cmd = next.commands[0]
    expect(cmd.kind).toBe("curve")
    if (cmd.kind === "curve") {
      expect(cmd.control).toEqual({ x: "25px", y: "75px" })
      // endpoint untouched
      expect(cmd.to).toEqual({ x: "100px", y: "100px" })
    }
  })

  test("an unknown id is a no-op (returns an equal shape)", () => {
    const r = parseShape("shape(from 0px 0px, line to 100px 0px, close)")
    const next = updatePoint(r, "nope", 1, 2)
    expect(next.fillRule).toEqual(r.fillRule)
    expect(next.from).toEqual(r.from)
    expect(next.commands).toEqual(r.commands)
  })

  test("a point id is stable across a re-derive (round-trips through updatePoint)", () => {
    const r = parseShape(
      "shape(from 0px 0px, curve to 100px 100px with 50px 0px, close)",
    )
    const pts = shapeToPoints(r)
    const control = pts.find((p) => p.role === "control")
    if (control === undefined) throw new Error("no control")
    const next = updatePoint(r, control.id, 10, 10)
    const nextPts = shapeToPoints(next)
    expect(nextPts.find((p) => p.role === "control")?.id).toBe(control.id)
  })
})
