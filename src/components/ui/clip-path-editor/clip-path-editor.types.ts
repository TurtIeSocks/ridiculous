// =====================================================================
// clip-path-editor.types.ts
//
// The "ridiculous" tier: compile-time BASIC-SHAPE DISPATCH over a CSS
// `clip-path` / `shape-outside` value. The value is a single
// `<basic-shape>` — inset() / circle() / ellipse() / polygon() — with an
// optional leading OR trailing `<geometry-box>` keyword. Built on
// `ridiculous-type-kit`. The strict validator `ClipPathLiteral<S>`
// resolves to `S` when the shape (its arity + each argument's DIMENSION)
// validates, `never` otherwise.
//
//   "circle(50% at center)"            →  the literal
//   "inset(45deg)"                     →  never (wants length-percentage)
//   "polygon(0% 0%, 100% 0%, 50%)"     →  never (odd-token vertex)
//   "circle(50%) border-box"           →  the literal (trailing box)
//   "none"                             →  "none"
//
// Unlike transform/filter (a space-separated function LIST), clip-path is
// ONE function, so dispatch is a single ParseFunction on the value after
// peeling an optional geometry box. The variadic challenge lives in
// polygon()'s vertex list, capped at 32 vertices (the tail is weak-
// validated beyond the cap — see VERTEX_CAP).
// =====================================================================

import type {
  And,
  IsLength,
  IsPercentage,
  Or,
  ParseFunction,
  SplitByComma,
  SplitBySpace,
  Trim,
} from "@/lib/ridiculous-type-kit"

// =====================================================================
// 1. PRIMITIVE PREDICATE ALIASES
// =====================================================================

/** length OR percentage — the universal clip-path coordinate dimension. */
type IsLengthPct<S extends string> = Or<
  IsLength<Trim<S>>,
  IsPercentage<Trim<S>>
>

/** A circle/ellipse radius: a length-% OR a sizing keyword. */
type IsRadius<S extends string> = Or<
  IsLengthPct<S>,
  Trim<S> extends "closest-side" | "farthest-side" ? true : false
>

/** A single `<position>` token: an edge keyword OR a length-%. */
type IsPositionToken<S extends string> = Or<
  Trim<S> extends "left" | "right" | "center" | "top" | "bottom" ? true : false,
  IsLengthPct<S>
>

// =====================================================================
// 2. POSITION (simplified — 0, 1, or 2 tokens; see spec §2.4)
//    Edge-offset 3/4-token forms resolve to false here (the runtime
//    parser accepts them). The editor only ever emits 1/2-token forms.
// =====================================================================

type ValidatePosition<Toks extends string[]> = Toks extends []
  ? true
  : Toks extends [infer A extends string]
    ? IsPositionToken<A>
    : Toks extends [infer A extends string, infer B extends string]
      ? And<IsPositionToken<A>, IsPositionToken<B>>
      : false

// =====================================================================
// 3. SHAPE ARGUMENT VALIDATORS
// =====================================================================

// --- inset( <lp>{1,4} [ round <radius> ]? ) --------------------------
// Peel an optional `round <tail>`; the box must be 1-4 length-%; a present
// `round` requires a non-empty tail (weak-validated — full border-radius
// grammar is out of scope, see spec §2.1).

type AllLengthPct<A extends string[]> = A extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? IsLengthPct<H> extends true
    ? AllLengthPct<T>
    : false
  : true

/** Split a token list at the first `round`; `{ box; round; tail }`. */
type SplitRound<
  Toks extends string[],
  Box extends string[] = [],
> = Toks extends [infer H extends string, ...infer T extends string[]]
  ? Trim<H> extends "round"
    ? { box: Box; round: true; tail: T }
    : SplitRound<T, [...Box, H]>
  : { box: Box; round: false; tail: [] }

type ValidateInset<ArgStr extends string> =
  SplitBySpace<ArgStr> extends infer Toks extends string[]
    ? SplitRound<Toks> extends {
        box: infer Box extends string[]
        round: infer R extends boolean
        tail: infer Tail extends string[]
      }
      ? Box["length"] extends 1 | 2 | 3 | 4
        ? And<
            AllLengthPct<Box>,
            R extends true ? (Tail extends [] ? false : true) : true
          >
        : false
      : false
    : false

// --- circle( <radius>? [ at <position> ]? ) --------------------------
// First token (if not `at`) is the radius; an `at` keyword starts the
// position clause.

type ValidateCircle<ArgStr extends string> =
  Trim<ArgStr> extends ""
    ? true
    : SplitBySpace<ArgStr> extends infer Toks extends string[]
      ? Toks extends [infer H extends string, ...infer T extends string[]]
        ? Trim<H> extends "at"
          ? ValidatePosition<T>
          : T extends [infer A extends string, ...infer Rest extends string[]]
            ? Trim<A> extends "at"
              ? And<IsRadius<H>, ValidatePosition<Rest>>
              : false // a second non-`at` token → too many radii for a circle
            : IsRadius<H> // single radius, no position
        : false
      : false

// --- ellipse( [ <radius> <radius> ]? [ at <position> ]? ) ------------
// Zero radii OR exactly two, optionally followed by `at <position>`.

type ValidateEllipse<ArgStr extends string> =
  Trim<ArgStr> extends ""
    ? true
    : SplitBySpace<ArgStr> extends infer Toks extends string[]
      ? Toks extends [infer A extends string, ...infer T extends string[]]
        ? Trim<A> extends "at"
          ? false // ellipse needs two radii before `at` (0-radii uses empty args)
          : T extends [infer B extends string, ...infer Rest extends string[]]
            ? Trim<B> extends "at"
              ? false // only one radius before `at`
              : And<
                  And<IsRadius<A>, IsRadius<B>>,
                  Rest extends [
                    infer C extends string,
                    ...infer Pos extends string[],
                  ]
                    ? Trim<C> extends "at"
                      ? ValidatePosition<Pos>
                      : false // a third radius
                    : true // exactly two radii, no position
                >
            : false // only one radius total
        : false
      : false

// --- polygon( [ <fill-rule> , ]? <vertex># ) ------------------------
// Comma-separated vertices; each vertex is two length-% (space-separated).
// VARIADIC — validated per-vertex up to VERTEX_CAP, then weak-validated.

/** Depth cap on per-vertex validation (spec §2.5 / §7). */
type VERTEX_CAP = 32

type ValidateVertex<S extends string> =
  SplitBySpace<Trim<S>> extends [infer X extends string, infer Y extends string]
    ? And<IsLengthPct<X>, IsLengthPct<Y>>
    : false

type ValidateVertices<
  V extends string[],
  Depth extends unknown[] = [],
> = V extends [infer H extends string, ...infer T extends string[]]
  ? Depth["length"] extends VERTEX_CAP
    ? true // cap reached — weak-validate the remaining tail
    : ValidateVertex<H> extends true
      ? ValidateVertices<T, [...Depth, unknown]>
      : false
  : true

type ValidatePolygon<ArgStr extends string> =
  SplitByComma<ArgStr> extends infer Parts extends string[]
    ? Parts extends [infer First extends string, ...infer Rest extends string[]]
      ? Trim<First> extends "nonzero" | "evenodd"
        ? Rest extends [] // a fill-rule but no vertices
          ? false
          : ValidateVertices<Rest>
        : ValidateVertices<Parts>
      : false // empty
    : false

// =====================================================================
// 4. SHAPE DISPATCH — ParseFunction → per-shape validator → boolean.
// =====================================================================

type ValidateShape<
  ArgStr extends string,
  Name extends string,
> = Name extends "inset"
  ? ValidateInset<ArgStr>
  : Name extends "circle"
    ? ValidateCircle<ArgStr>
    : Name extends "ellipse"
      ? ValidateEllipse<ArgStr>
      : Name extends "polygon"
        ? ValidatePolygon<ArgStr>
        : false // unknown shape

/** Validate a bare shape function (no geometry box), → true | false. */
type ValidateBareShape<S extends string> =
  ParseFunction<Trim<S>> extends {
    name: infer Name extends string
    args: infer ArgStr extends string
  }
    ? ValidateShape<ArgStr, Name>
    : false

// =====================================================================
// 4b. GEOMETRY-BOX PEEL — right/left-anchored, at most one box.
//
// A plain `${infer Box} ${infer Rest}` infers leftmost, so it mis-splits
// `circle(50% at center) border-box` (the box has spaces). Distributing
// over the `GeometryBox` union with a FIXED suffix/prefix literal makes TS
// anchor the match to that exact box token, peeling correctly.
// =====================================================================

/** `{ box; rest }` peeling an optional leading/trailing box; `box: "none"`
 *  when there's no box (or a box appears at both ends → marked invalid). */
type StripLeadingBox<S extends string> = S extends `${infer B} ${infer Rest}`
  ? B extends GeometryBox
    ? { box: B; rest: Rest; position: "leading" }
    : { box: "none"; rest: S; position: "none" }
  : { box: "none"; rest: S; position: "none" }

type StripTrailingBox<S extends string> = GeometryBox extends infer B
  ? B extends string
    ? S extends `${infer Rest} ${B}`
      ? { box: B; rest: Rest; position: "trailing" }
      : never
    : never
  : never

/** Peel one box (trailing preferred — it is unambiguous), else leading. */
type PeelBox<S extends string> = [StripTrailingBox<S>] extends [never]
  ? StripLeadingBox<S>
  : StripTrailingBox<S>

// =====================================================================
// 5. STRICT VALIDATOR + CALL-SITE HELPER
//    Peel an optional leading OR trailing geometry box (at most one),
//    then validate the remaining shape. A bare box is valid on its own.
// =====================================================================

/**
 * Strict literal validator. Resolves to `S` when `S` is a dimensionally-
 * and arity-valid CSS `clip-path` / `shape-outside` value — a single
 * basic shape with an optional leading OR trailing geometry box, a bare
 * geometry box, or the `none` keyword — and `never` otherwise. `calc()` /
 * `var()` inside an argument resolve to `never` here (undecidable at
 * compile time) — use the casual / IntelliSense tier; the runtime parser
 * accepts them.
 *
 * @example
 * type A = ClipPathLiteral<"circle(50% at center)">       // the literal
 * type B = ClipPathLiteral<"inset(45deg)">                // never
 * type C = ClipPathLiteral<"circle(50%) border-box">      // the literal
 * type D = ClipPathLiteral<"none">                        // "none"
 */
export type ClipPathLiteral<S extends string> =
  Trim<S> extends "none"
    ? S
    : Trim<S> extends ""
      ? never
      : // bare geometry box on its own
        Trim<S> extends GeometryBox
        ? S
        : PeelBox<Trim<S>> extends {
              box: infer Box
              rest: infer Rest extends string
            }
          ? Box extends "none"
            ? // no box — validate the whole value as a shape
              ValidateBareShape<Trim<S>> extends true
              ? S
              : never
            : // one box peeled — `Rest` must be a boxless shape (this rejects
              // a SECOND box, since a bare box is not a valid ParseFunction)
              ValidateBareShape<Rest> extends true
              ? S
              : never
          : never

/**
 * Call-site validator helper. Mirrors `cssFilter()` / `cssTransform()` /
 * `cssCalc()` / `color()` / `easing()`. An invalid clip-path becomes a
 * type error at the argument.
 */
export const cssClipPath = <S extends string>(
  value: S & ClipPathLiteral<S>,
): S => value

// =====================================================================
// 6. SUGGESTION STRINGS — IntelliSense + onChange return types
// =====================================================================

/** The supported basic-shape function names. */
export type BasicShapeName = "inset" | "circle" | "ellipse" | "polygon"

/** The CSS `<geometry-box>` keywords. */
export type GeometryBox =
  | "margin-box"
  | "border-box"
  | "padding-box"
  | "content-box"
  | "fill-box"
  | "stroke-box"
  | "view-box"

/**
 * Suggestion union — "this is a clip-path string". Per-shape heads, with an
 * optional leading or trailing geometry box, plus a bare box and `none`.
 */
export type ClipPathString =
  | `${BasicShapeName}(${string})`
  | `${BasicShapeName}(${string}) ${GeometryBox}`
  | `${GeometryBox} ${BasicShapeName}(${string})`
  | GeometryBox
  | "none"

/** Shape → output-string map. Backs the per-shape suggestion shapes. */
export interface ClipPathStringMap {
  inset: `inset(${string})`
  circle: `circle(${string})`
  ellipse: `ellipse(${string})`
  polygon: `polygon(${string})`
}

export type ClipPathShape = keyof ClipPathStringMap

// =====================================================================
// 7. UTILITY TYPES — operate on clip-path literals at the type level
// =====================================================================

/** Strip a leading/trailing geometry box, returning the inner shape text. */
type StripBox<S extends string> =
  Trim<S> extends GeometryBox
    ? "" // bare box → no shape
    : PeelBox<Trim<S>> extends { rest: infer Rest extends string }
      ? Rest
      : Trim<S>

/**
 * The basic shape of a clip-path value: the shape name, `"box"` for a bare
 * geometry box, or `"none"`.
 *
 * @example
 * type A = ShapeOf<"circle(50%)">              // "circle"
 * type B = ShapeOf<"ellipse(1px 2px) border-box"> // "ellipse"
 * type C = ShapeOf<"border-box">               // "box"
 * type D = ShapeOf<"none">                     // "none"
 */
export type ShapeOf<S extends string> =
  Trim<S> extends "none"
    ? "none"
    : Trim<S> extends GeometryBox
      ? "box"
      : ParseFunction<StripBox<S>> extends {
            name: infer Name extends BasicShapeName
          }
        ? Name
        : never

/** Drop a leading fill-rule from a polygon arg's comma parts. */
type DropFillRule<Parts extends string[]> = Parts extends [
  infer First extends string,
  ...infer Rest extends string[],
]
  ? Trim<First> extends "nonzero" | "evenodd"
    ? Rest
    : Parts
  : Parts

/**
 * The number of vertices in a `polygon()` value (0 if not a polygon).
 *
 * @example
 * type A = VertexCountOf<"polygon(0% 0%, 100% 0%, 50% 100%)"> // 3
 * type B = VertexCountOf<"nonzero polygon...">                // (fill-rule dropped)
 * type C = VertexCountOf<"circle(50%)">                       // 0
 */
export type VertexCountOf<S extends string> =
  ShapeOf<S> extends "polygon"
    ? ParseFunction<StripBox<S>> extends { args: infer ArgStr extends string }
      ? DropFillRule<SplitByComma<ArgStr>>["length"]
      : 0
    : 0

/**
 * The geometry-box keyword present in a clip-path value, or `"none"`.
 *
 * @example
 * type A = GeometryBoxOf<"circle(50%) border-box">    // "border-box"
 * type B = GeometryBoxOf<"padding-box ellipse(1px 2px)"> // "padding-box"
 * type C = GeometryBoxOf<"circle(50%)">               // "none"
 */
export type GeometryBoxOf<S extends string> =
  Trim<S> extends GeometryBox
    ? Trim<S>
    : PeelBox<Trim<S>> extends { box: infer Box extends GeometryBox | "none" }
      ? Box
      : "none"

// =====================================================================
// 8. INTERNAL STATE — discriminated union (exported)
//
// The editor's state is a single shape (discriminated by `shape`) plus an
// optional geometry box. Exported for advanced use (custom serialization,
// programmatic build). Argument values are kept as strings (they carry
// units), mirroring how the literal preserves the raw text.
// =====================================================================

export type ClipPathShapeState =
  // 1-4 length-% box (right/bottom/left optional via CSS shorthand) + round
  | {
      shape: "inset"
      top: string
      right?: string
      bottom?: string
      left?: string
      round?: string
    }
  // one radius (length-% or keyword) + optional `at` position
  | { shape: "circle"; radius?: string; atX?: string; atY?: string }
  // two radii + optional `at` position
  | { shape: "ellipse"; rx?: string; ry?: string; atX?: string; atY?: string }
  // optional fill-rule + a vertex list
  | {
      shape: "polygon"
      fillRule?: "nonzero" | "evenodd"
      vertices: Array<{ x: string; y: string }>
    }

export interface ClipPathState {
  /** The optional geometry-box keyword. */
  box?: GeometryBox
  /** Where the box sits relative to the shape (for round-trip fidelity). */
  boxPosition?: "leading" | "trailing"
  /** The basic shape, or `null` for a bare geometry box / `none`. */
  shape: ClipPathShapeState | null
}

// Re-export the kit's Dimension for convenience.
export type { Dimension } from "@/lib/ridiculous-type-kit"
