import { describe, expect, it } from "vitest"
import {
  defaultTrack,
  formatAreas,
  formatTracks,
  parseAreas,
  parseTracks,
} from "@/components/ui/grid-builder/grid-builder.helpers"

describe("formatTracks", () => {
  it("joins token values with spaces", () => {
    expect(
      formatTracks([
        { kind: "size", value: "1fr" },
        { kind: "fn", name: "minmax", value: "minmax(100px, 1fr)" },
        { kind: "line", names: ["end"], value: "[end]" },
      ]),
    ).toBe("1fr minmax(100px, 1fr) [end]")
  })

  it("empty list → none", () => {
    expect(formatTracks([])).toBe("none")
  })

  it("round-trips a track list", () => {
    const input = "[start] repeat(3, minmax(100px, 1fr)) [end] auto"
    const tokens = parseTracks(input)
    expect(tokens).not.toBeNull()
    expect(formatTracks(tokens ?? [])).toBe(input)
  })
})

describe("formatAreas", () => {
  it("wraps each row in quotes", () => {
    expect(
      formatAreas([
        ["head", "head"],
        ["nav", "main"],
      ]),
    ).toBe('"head head" "nav main"')
  })

  it("empty matrix → none", () => {
    expect(formatAreas([])).toBe("none")
  })

  it("round-trips an areas string", () => {
    const input = '"head head" "nav main" "foot foot"'
    const matrix = parseAreas(input)
    expect(matrix).not.toBeNull()
    expect(formatAreas(matrix ?? [])).toBe(input)
  })
})

describe("defaultTrack", () => {
  it("defaults to a 1fr size token", () => {
    expect(defaultTrack()).toEqual({ kind: "size", value: "1fr" })
  })

  it("can seed a function token", () => {
    expect(defaultTrack("fn")).toEqual({
      kind: "fn",
      name: "minmax",
      value: "minmax(100px, 1fr)",
    })
  })

  it("can seed a line token", () => {
    expect(defaultTrack("line")).toEqual({
      kind: "line",
      names: ["line"],
      value: "[line]",
    })
  })
})
