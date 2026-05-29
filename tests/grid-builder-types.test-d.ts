import { expectTypeOf, test } from "vitest"
import type { GridBuilder } from "@/components/ui/grid-builder"
import type {
  AreaColumnCountOf,
  AreaRowCountOf,
  GridAreasLiteral,
  GridAreasString,
  GridMode,
  GridTemplateState,
  GridTemplateString,
  GridTemplateStringMap,
  TrackCountOf,
  TrackListLiteral,
  TrackListString,
  TracksOf,
} from "@/components/ui/grid-builder/grid-builder.types"
import {
  cssGridAreas,
  cssTracks,
} from "@/components/ui/grid-builder/grid-builder.types"

// ---------------------------------------------------------------------------
// TrackListLiteral — plain track sizes
// ---------------------------------------------------------------------------

test("track sizes: length / percentage / flex / keywords accept", () => {
  expectTypeOf<TrackListLiteral<"1fr">>().toEqualTypeOf<"1fr">()
  expectTypeOf<TrackListLiteral<"0.5fr">>().toEqualTypeOf<"0.5fr">()
  expectTypeOf<TrackListLiteral<"100px">>().toEqualTypeOf<"100px">()
  expectTypeOf<TrackListLiteral<"50%">>().toEqualTypeOf<"50%">()
  expectTypeOf<TrackListLiteral<"auto">>().toEqualTypeOf<"auto">()
  expectTypeOf<TrackListLiteral<"min-content">>().toEqualTypeOf<"min-content">()
  expectTypeOf<TrackListLiteral<"max-content">>().toEqualTypeOf<"max-content">()
  expectTypeOf<
    TrackListLiteral<"1fr 2fr auto 100px">
  >().toEqualTypeOf<"1fr 2fr auto 100px">()
})

test("track sizes: bad units / unknown keywords reject", () => {
  expectTypeOf<TrackListLiteral<"1fx">>().toBeNever()
  expectTypeOf<TrackListLiteral<"foo">>().toBeNever()
  expectTypeOf<TrackListLiteral<"1fr wobble">>().toBeNever()
  // calc()/var() are undecidable at the strict tier
  expectTypeOf<TrackListLiteral<"calc(1px + 2px)">>().toBeNever()
  expectTypeOf<TrackListLiteral<"var(--x)">>().toBeNever()
})

// ---------------------------------------------------------------------------
// TrackListLiteral — minmax()
// ---------------------------------------------------------------------------

test("minmax: inflexible min + any-track-size max accept", () => {
  expectTypeOf<
    TrackListLiteral<"minmax(100px, 1fr)">
  >().toEqualTypeOf<"minmax(100px, 1fr)">()
  expectTypeOf<
    TrackListLiteral<"minmax(auto, 200px)">
  >().toEqualTypeOf<"minmax(auto, 200px)">()
  expectTypeOf<
    TrackListLiteral<"minmax(min-content, max-content)">
  >().toEqualTypeOf<"minmax(min-content, max-content)">()
  expectTypeOf<
    TrackListLiteral<"minmax(10%, 1fr)">
  >().toEqualTypeOf<"minmax(10%, 1fr)">()
})

test("minmax: fr as the min is rejected (min must be inflexible)", () => {
  expectTypeOf<TrackListLiteral<"minmax(1fr, 2fr)">>().toBeNever()
  expectTypeOf<TrackListLiteral<"minmax(1fr, 100px)">>().toBeNever()
  // wrong arity
  expectTypeOf<TrackListLiteral<"minmax(100px)">>().toBeNever()
  expectTypeOf<TrackListLiteral<"minmax(100px, 1fr, auto)">>().toBeNever()
  // bad max
  expectTypeOf<TrackListLiteral<"minmax(100px, foo)">>().toBeNever()
})

// ---------------------------------------------------------------------------
// TrackListLiteral — fit-content()
// ---------------------------------------------------------------------------

test("fit-content accepts a length / percentage, rejects others", () => {
  expectTypeOf<
    TrackListLiteral<"fit-content(200px)">
  >().toEqualTypeOf<"fit-content(200px)">()
  expectTypeOf<
    TrackListLiteral<"fit-content(30%)">
  >().toEqualTypeOf<"fit-content(30%)">()
  expectTypeOf<TrackListLiteral<"fit-content(1fr)">>().toBeNever()
  expectTypeOf<TrackListLiteral<"fit-content(auto)">>().toBeNever()
})

// ---------------------------------------------------------------------------
// TrackListLiteral — repeat()
// ---------------------------------------------------------------------------

test("repeat: integer / auto-fill / auto-fit counts + nested tracks accept", () => {
  expectTypeOf<
    TrackListLiteral<"repeat(3, 1fr)">
  >().toEqualTypeOf<"repeat(3, 1fr)">()
  expectTypeOf<
    TrackListLiteral<"repeat(2, 100px 200px)">
  >().toEqualTypeOf<"repeat(2, 100px 200px)">()
  expectTypeOf<
    TrackListLiteral<"repeat(auto-fill, minmax(100px, 1fr))">
  >().toEqualTypeOf<"repeat(auto-fill, minmax(100px, 1fr))">()
  expectTypeOf<
    TrackListLiteral<"repeat(auto-fit, 1fr)">
  >().toEqualTypeOf<"repeat(auto-fit, 1fr)">()
})

test("repeat: zero / non-int / bad keyword counts + bad tracks reject", () => {
  expectTypeOf<TrackListLiteral<"repeat(0, 1fr)">>().toBeNever()
  expectTypeOf<TrackListLiteral<"repeat(x, 1fr)">>().toBeNever()
  expectTypeOf<TrackListLiteral<"repeat(2.5, 1fr)">>().toBeNever()
  expectTypeOf<TrackListLiteral<"repeat(3, foo)">>().toBeNever()
  expectTypeOf<TrackListLiteral<"repeat(3)">>().toBeNever()
})

// ---------------------------------------------------------------------------
// TrackListLiteral — named lines [ident]
// ---------------------------------------------------------------------------

test("named lines accept valid idents, reject bad ones", () => {
  expectTypeOf<
    TrackListLiteral<"[sidebar] 1fr [main] 2fr [end]">
  >().toEqualTypeOf<"[sidebar] 1fr [main] 2fr [end]">()
  expectTypeOf<TrackListLiteral<"[a b] 1fr">>().toEqualTypeOf<"[a b] 1fr">()
  expectTypeOf<
    TrackListLiteral<"[col-1] 100px">
  >().toEqualTypeOf<"[col-1] 100px">()
  // an ident may not start with a digit
  expectTypeOf<TrackListLiteral<"[1bad] 1fr">>().toBeNever()
  // empty bracket is not a valid line-name list
  expectTypeOf<TrackListLiteral<"[] 1fr">>().toBeNever()
})

// ---------------------------------------------------------------------------
// TrackListLiteral — none + empty
// ---------------------------------------------------------------------------

test("none keeps the literal; empty is never", () => {
  expectTypeOf<TrackListLiteral<"none">>().toEqualTypeOf<"none">()
  expectTypeOf<TrackListLiteral<"">>().toBeNever()
})

// ---------------------------------------------------------------------------
// GridAreasLiteral — equal vs unequal columns + idents
// ---------------------------------------------------------------------------

test("areas: equal column counts + valid cells accept", () => {
  expectTypeOf<GridAreasLiteral<'"a a" "b b"'>>().toEqualTypeOf<'"a a" "b b"'>()
  expectTypeOf<
    GridAreasLiteral<'"head head head" "nav main main" "foot foot foot"'>
  >().toEqualTypeOf<'"head head head" "nav main main" "foot foot foot"'>()
  // dots are null cells; ".." and "..." are valid null tokens
  expectTypeOf<GridAreasLiteral<'"a ." ". a"'>>().toEqualTypeOf<'"a ." ". a"'>()
  expectTypeOf<
    GridAreasLiteral<'"a .." ".. a"'>
  >().toEqualTypeOf<'"a .." ".. a"'>()
})

test("areas: unequal columns / bad idents / empty reject", () => {
  expectTypeOf<GridAreasLiteral<'"a a" "b"'>>().toBeNever()
  expectTypeOf<GridAreasLiteral<'"a a a" "b b"'>>().toBeNever()
  // a cell ident may not start with a digit
  expectTypeOf<GridAreasLiteral<'"a 1b"'>>().toBeNever()
  expectTypeOf<GridAreasLiteral<'""'>>().toBeNever()
  expectTypeOf<GridAreasLiteral<"">>().toBeNever()
  // unquoted garbage is not an areas string
  expectTypeOf<GridAreasLiteral<"a a">>().toBeNever()
})

test("areas: none keeps the literal", () => {
  expectTypeOf<GridAreasLiteral<"none">>().toEqualTypeOf<"none">()
})

// ---------------------------------------------------------------------------
// Call-site helpers
// ---------------------------------------------------------------------------

test("cssTracks validates at the call site", () => {
  const a = cssTracks("repeat(3, 1fr)")
  expectTypeOf(a).toEqualTypeOf<"repeat(3, 1fr)">()
  // @ts-expect-error fr is not a valid minmax min
  cssTracks("minmax(1fr, 2fr)")
  // @ts-expect-error repeat count must be a positive int or auto-fill/auto-fit
  cssTracks("repeat(0, 1fr)")
  // @ts-expect-error calc() is undecidable at the strict tier
  cssTracks("calc(1px + 2px)")
  // @ts-expect-error unknown keyword
  cssTracks("foo")
})

test("cssGridAreas validates at the call site", () => {
  const a = cssGridAreas('"a a" "b b"')
  expectTypeOf(a).toEqualTypeOf<'"a a" "b b"'>()
  // @ts-expect-error unequal column counts
  cssGridAreas('"a a" "b"')
  // @ts-expect-error cell ident may not start with a digit
  cssGridAreas('"a 1b"')
})

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

test("TracksOf / TrackCountOf count top-level tracks (named lines excluded)", () => {
  expectTypeOf<TracksOf<"1fr 2fr auto">>().toEqualTypeOf<
    ["1fr", "2fr", "auto"]
  >()
  expectTypeOf<TracksOf<"[a] 1fr [b] 2fr [c]">>().toEqualTypeOf<
    ["1fr", "2fr"]
  >()
  expectTypeOf<TrackCountOf<"1fr 2fr auto">>().toEqualTypeOf<3>()
  expectTypeOf<TrackCountOf<"repeat(3, 1fr) 100px">>().toEqualTypeOf<2>()
  expectTypeOf<TrackCountOf<"none">>().toEqualTypeOf<0>()
})

test("AreaRowCountOf / AreaColumnCountOf measure the areas matrix", () => {
  expectTypeOf<AreaRowCountOf<'"a a" "b b" "c c"'>>().toEqualTypeOf<3>()
  expectTypeOf<AreaColumnCountOf<'"a a a" "b b b"'>>().toEqualTypeOf<3>()
  expectTypeOf<AreaRowCountOf<"none">>().toEqualTypeOf<0>()
  expectTypeOf<AreaColumnCountOf<"none">>().toEqualTypeOf<0>()
})

// ---------------------------------------------------------------------------
// Suggestion strings + map + mode
// ---------------------------------------------------------------------------

test("suggestion unions + map + mode keys", () => {
  expectTypeOf<"1fr">().toMatchTypeOf<TrackListString>()
  expectTypeOf<"repeat(3, 1fr)">().toMatchTypeOf<TrackListString>()
  expectTypeOf<"none">().toMatchTypeOf<TrackListString>()
  expectTypeOf<'"a a" "b b"'>().toMatchTypeOf<GridAreasString>()
  expectTypeOf<"none">().toMatchTypeOf<GridAreasString>()
  expectTypeOf<GridMode>().toEqualTypeOf<"columns" | "rows" | "areas">()
  expectTypeOf<
    GridTemplateStringMap["columns"]
  >().toEqualTypeOf<TrackListString>()
  expectTypeOf<GridTemplateStringMap["rows"]>().toEqualTypeOf<TrackListString>()
  expectTypeOf<
    GridTemplateStringMap["areas"]
  >().toEqualTypeOf<GridAreasString>()
})

// ---------------------------------------------------------------------------
// Internal state — discriminated union
// ---------------------------------------------------------------------------

test("GridTemplateState discriminates by mode", () => {
  const cols: GridTemplateState = { mode: "columns", tracks: "1fr 1fr" }
  const rows: GridTemplateState = { mode: "rows", tracks: "auto 1fr" }
  const areas: GridTemplateState = { mode: "areas", rows: ["a a", "b b"] }
  expectTypeOf(cols).toMatchTypeOf<GridTemplateState>()
  expectTypeOf(rows).toMatchTypeOf<GridTemplateState>()
  expectTypeOf(areas).toMatchTypeOf<GridTemplateState>()
})

// ---------------------------------------------------------------------------
// Component onChange — open GridTemplateString (no per-mode narrowing)
// ---------------------------------------------------------------------------

test("GridBuilder onChange returns the open GridTemplateString", () => {
  type P = Parameters<typeof GridBuilder>[0]
  expectTypeOf<P["onChange"]>().parameter(0).toEqualTypeOf<GridTemplateString>()
})
