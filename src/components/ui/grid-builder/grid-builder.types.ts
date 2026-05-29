// =====================================================================
// grid-builder.types.ts
//
// The "ridiculous" tier: two compile-time validators for CSS grid
// templates, built on `ridiculous-type-kit`.
//
//   1. TrackListLiteral<S> — `grid-template-columns` / `grid-template-rows`.
//      A space-separated track list: <length>/<percentage>/<flex>,
//      keywords (auto/min-content/max-content), minmax(), fit-content(),
//      repeat(), and [named-line] brackets. FULL validation.
//
//   2. GridAreasLiteral<S> — `grid-template-areas`. A sequence of quoted
//      row strings. Type-level: every row has an EQUAL cell count and each
//      cell is a valid <ident> or a null cell (a run of dots). The
//      contiguous-RECTANGLE invariant is PUNTED to runtime (see JSDoc +
//      spec §7) — it is borderline-undecidable as a template-literal type.
//
//   "minmax(100px, 1fr)"        →  the literal
//   "minmax(1fr, 2fr)"          →  never (an fr is not an inflexible min)
//   "repeat(auto-fill, 1fr)"    →  the literal
//   '"a a" "b b"'               →  the literal
//   '"a a" "b"'                 →  never (unequal columns)
//
// REUSES the function-dispatch pattern (ParseFunction + SplitByComma +
// SplitBySpace) from transform-builder / filter-builder, and the
// depth-capped recursion + IsNever guard idiom from calc-editor.
// =====================================================================

import type {
  AllChars,
  And,
  Digit,
  IsFlex,
  IsLength,
  IsPercentage,
  IsPositiveInt,
  Letter,
  NonEmptyAllChars,
  Or,
  ParseFunction,
  SplitByComma,
  SplitBySpace,
  Trim,
} from "@/lib/ridiculous-type-kit"

// =====================================================================
// 0. SHARED — IsNever guard. `never extends X` is vacuously true, so a
//    naive `extends true` on a possibly-never boolean wrongly accepts.
// =====================================================================

type IsNever<T> = [T] extends [never] ? true : false

// =====================================================================
// 1. IDENT VALIDATION (line names + area names)
//
// ASCII letters / digits / - / _, must not start with a digit (CSS's
// fuller <custom-ident> grammar — escapes, non-ASCII — is out of scope;
// see spec §9.5).
// =====================================================================

type IdentChar = Letter | Digit | "-" | "_"

/** A valid CSS-ish ident: non-empty, not digit-led, ident chars only. */
type IsIdent<S extends string> = S extends `${infer First}${string}`
  ? First extends Digit
    ? false
    : AllChars<S, IdentChar>
  : false

// =====================================================================
// 2. TRACK-SIZE PRIMITIVES
// =====================================================================

/** auto | min-content | max-content. */
type IsTrackKeyword<S extends string> =
  Trim<S> extends "auto" | "min-content" | "max-content" ? true : false

/** <inflexible> — a minmax() min: length | percentage | auto | min/max-content.
 *  Notably NOT an <flex> (`fr`). */
type IsInflexible<S extends string> = Or<
  Or<IsLength<Trim<S>>, IsPercentage<Trim<S>>>,
  IsTrackKeyword<Trim<S>>
>

// =====================================================================
// 3. FUNCTION DISPATCH — minmax / fit-content / repeat
//
// Nesting budget for repeat() recursion (CSS forbids nested repeat()).
// Capped small per spec §9.2 (compile budget); pathological depth
// weak-accepts at the type level and is caught by the runtime parser.
// =====================================================================

type Depth = [unknown, unknown, unknown]

/** minmax(min, max): exactly 2 args; min inflexible; max any track-size. */
type ValidateMinmax<Args extends string, D extends unknown[]> =
  SplitByComma<Args> extends [
    infer Min extends string,
    infer Max extends string,
  ]
    ? And<IsInflexible<Min>, IsTrackSize<Max, D>>
    : false

/** fit-content(<length-percentage>): exactly 1 arg, length or percentage. */
type ValidateFitContent<Args extends string> =
  SplitByComma<Args> extends [infer L extends string]
    ? Or<IsLength<Trim<L>>, IsPercentage<Trim<L>>>
    : false

/** A repeat() count: positive integer | auto-fill | auto-fit. */
type IsRepeatCount<S extends string> =
  Trim<S> extends "auto-fill" | "auto-fit" ? true : IsPositiveInt<Trim<S>>

/**
 * repeat(count, tracks): the first comma-arg is the count; everything after
 * the first comma is the (space-separated) track list, validated recursively.
 * SplitByComma is paren/bracket-aware, so a nested minmax() comma does NOT
 * leak a top-level part — `repeat(2, minmax(0, 1fr))` is [count, tracks].
 */
type ValidateRepeat<Args extends string, D extends unknown[]> =
  SplitByComma<Args> extends [
    infer Count extends string,
    ...infer Rest extends string[],
  ]
    ? Rest extends []
      ? false // repeat needs a track list after the count
      : And<
          IsRepeatCount<Count>,
          // Rest may itself contain commas only inside nested functions; the
          // top-level repeat track list is space-separated, so there is at
          // most one Rest element. Join defensively, validate as a track list.
          ValidateTrackList<SplitBySpace<JoinComma<Rest>>, D>
        >
    : false

/** Re-join comma-split parts (defensive; Rest is normally length 1). */
type JoinComma<T extends string[]> = T extends [infer H extends string]
  ? H
  : T extends [infer H extends string, ...infer R extends string[]]
    ? `${H}, ${JoinComma<R>}`
    : ""

// =====================================================================
// 4. TRACK-SIZE + TRACK-TOKEN
// =====================================================================

/**
 * <track-size> — length | percentage | flex | keyword | minmax() |
 * fit-content(). Used for top-level tracks and minmax()'s max. Functions
 * dispatch via ParseFunction; D carries the repeat() recursion budget.
 */
type IsTrackSize<S extends string, D extends unknown[]> =
  Or<
    Or<IsLength<Trim<S>>, IsPercentage<Trim<S>>>,
    Or<IsFlex<Trim<S>>, IsTrackKeyword<Trim<S>>>
  > extends true
    ? true
    : ParseFunction<Trim<S>> extends {
          name: infer Name extends string
          args: infer Args extends string
        }
      ? Name extends "minmax"
        ? ValidateMinmax<Args, D>
        : Name extends "fit-content"
          ? ValidateFitContent<Args>
          : Name extends "repeat"
            ? D extends [unknown, ...infer Rest]
              ? ValidateRepeat<Args, Rest>
              : true // depth budget exhausted → weak-accept (runtime catches)
            : false
      : false

/** A bracketed line-name group: `[a]`, `[a b]`. One+ space-separated idents. */
type ValidateLineNames<S extends string> =
  Trim<S> extends `[${infer Body}]`
    ? ValidateIdentList<SplitBySpace<Trim<Body>>>
    : false

type ValidateIdentList<Names extends string[]> = Names extends []
  ? false // empty bracket is not a valid line-name list
  : ValidateIdentListInner<Names>

type ValidateIdentListInner<Names extends string[]> = Names extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? IsIdent<Trim<H>> extends true
    ? ValidateIdentListInner<T>
    : false
  : true

/** A single track-list token: a track size OR a [named-line] group. */
type ValidateTrackToken<S extends string, D extends unknown[]> =
  IsTrackSize<S, D> extends true ? true : ValidateLineNames<S>

/** Fold a token list; every token must validate. */
type ValidateTrackList<
  Tokens extends string[],
  D extends unknown[],
> = Tokens extends [infer H extends string, ...infer T extends string[]]
  ? ValidateTrackToken<H, D> extends true
    ? ValidateTrackList<T, D>
    : false
  : true // reached the end without a failure

// =====================================================================
// 5. STRICT VALIDATOR — TrackListLiteral + cssTracks
// =====================================================================

/**
 * Strict validator for `grid-template-columns` / `grid-template-rows`.
 * Resolves to `S` when `S` is a fully-valid track list (or `none`),
 * `never` otherwise. `calc()` / `var()` inside a track resolve to `never`
 * (undecidable at compile time) — use the casual / IntelliSense tier or
 * the runtime parser for those.
 *
 * @example
 * type A = TrackListLiteral<"repeat(3, 1fr)">    // the literal
 * type B = TrackListLiteral<"minmax(1fr, 2fr)">  // never (fr min)
 * type C = TrackListLiteral<"none">              // "none"
 */
export type TrackListLiteral<S extends string> =
  Trim<S> extends "none"
    ? S
    : Trim<S> extends ""
      ? never
      : SplitBySpace<Trim<S>> extends infer Tokens extends string[]
        ? Tokens extends []
          ? never
          : ValidateTrackList<Tokens, Depth> extends true
            ? S
            : never
        : never

/** Call-site validator. Mirrors `cssCalc()` / `cssFilter()`. */
export const cssTracks = <S extends string>(
  value: S & TrackListLiteral<S>,
): S => value

// =====================================================================
// 6. GRID AREAS VALIDATOR
//
// Type-level: quoting + equal column count + valid cells. The
// contiguous-RECTANGLE invariant is enforced at RUNTIME (spec §7).
// =====================================================================

/** A null cell: a run of one or more dots (`.`, `..`, `...`). */
type IsDots<S extends string> = NonEmptyAllChars<S, ".">

/** A single areas cell: a valid ident OR a null-cell dot run. */
type IsAreaCell<S extends string> = Or<IsIdent<Trim<S>>, IsDots<Trim<S>>>

/** Validate one row's cells; return the cell count or `never` on a bad cell. */
type RowCellCount<Cells extends string[]> = Cells extends []
  ? never // empty row
  : ValidateCells<Cells> extends true
    ? Cells["length"]
    : never

type ValidateCells<Cells extends string[]> = Cells extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? IsAreaCell<H> extends true
    ? ValidateCells<T>
    : false
  : true

/**
 * Split the areas string into quoted row bodies (without quotes), or `never`
 * if anything between/around the rows is not part of a `"..."` quoted string.
 * Walks `S` directly — the kit's space-splitter is quote-UNAWARE, so we can't
 * lean on it here; we match a leading `"..."` and recurse on the remainder.
 */
type SplitAreaRows<S extends string> =
  Trim<S> extends ""
    ? []
    : Trim<S> extends `"${infer Body}"${infer Rest}`
      ? SplitAreaRows<Rest> extends infer Tail extends string[]
        ? [Body, ...Tail]
        : never
      : never // leftover non-quoted text → not an areas string

/** Fold the rows, requiring every row's cell count to equal the first's. */
type EqualColumns<
  Rows extends string[],
  Expected extends number | "init" = "init",
> = Rows extends [infer H extends string, ...infer T extends string[]]
  ? RowCellCount<SplitBySpace<Trim<H>>> extends infer N
    ? IsNever<N> extends true
      ? false
      : N extends number
        ? Expected extends "init"
          ? EqualColumns<T, N>
          : Expected extends N
            ? EqualColumns<T, Expected>
            : false
        : false
    : false
  : Expected extends "init"
    ? false // no rows
    : true

/**
 * Strict validator for `grid-template-areas`. Resolves to `S` when `S` is a
 * sequence of quoted row strings with an EQUAL cell count per row and every
 * cell a valid <ident> or null cell (`.`), `never` otherwise.
 *
 * PUNT (spec §7): the contiguous-RECTANGLE invariant — each area name must
 * span a single filled rectangle — is NOT checked here (borderline-
 * undecidable as a template-literal type, and it would make `tsc` crawl). It
 * is enforced at RUNTIME by `validateAreasRectangles` / `parseAreas`. The
 * strict type tier validates SHAPE; the runtime does FULL validation.
 *
 * @example
 * type A = GridAreasLiteral<'"a a" "b b"'>  // the literal
 * type B = GridAreasLiteral<'"a a" "b"'>    // never (unequal columns)
 * type C = GridAreasLiteral<"none">         // "none"
 */
export type GridAreasLiteral<S extends string> =
  Trim<S> extends "none"
    ? S
    : Trim<S> extends ""
      ? never
      : SplitAreaRows<Trim<S>> extends infer Rows
        ? IsNever<Rows> extends true
          ? never
          : Rows extends string[]
            ? Rows extends []
              ? never
              : EqualColumns<Rows> extends true
                ? S
                : never
            : never
        : never

/** Call-site validator. Mirrors `cssTracks()`. */
export const cssGridAreas = <S extends string>(
  value: S & GridAreasLiteral<S>,
): S => value

// =====================================================================
// 7. SUGGESTION STRINGS — IntelliSense + onChange return types
// =====================================================================

/** Named track-size keywords/suggestions. */
export type GridTrackSize =
  | "auto"
  | "min-content"
  | "max-content"
  | `${number}fr`
  | `${number}px`
  | `${number}%`

/**
 * Suggestion union — "this is a track list". Head-anchored function shapes
 * also match multi-track lists; plus the bare keywords/sizes and `none`.
 */
export type TrackListString =
  | GridTrackSize
  | `repeat(${string})`
  | `minmax(${string})`
  | `fit-content(${string})`
  | `[${string}]${string}`
  | `${string} ${string}`
  | "none"

/** Suggestion union — "this is a grid-template-areas string". */
export type GridAreasString = `"${string}"${string}` | "none"

/** The union of both property shapes — the component's onChange return. */
export type GridTemplateString = TrackListString | GridAreasString

/** The editor's three modes. */
export type GridMode = "columns" | "rows" | "areas"

/** Mode → output-string shape. columns/rows are track lists; areas its own. */
export interface GridTemplateStringMap {
  columns: TrackListString
  rows: TrackListString
  areas: GridAreasString
}

// =====================================================================
// 8. UTILITY TYPES — operate on grid literals at the type level
// =====================================================================

/** Drop bracketed [line-name] tokens; keep only track tokens. */
type TrackTokensOnly<Tokens extends string[]> = Tokens extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? Trim<H> extends `[${string}]`
    ? TrackTokensOnly<T>
    : [H, ...TrackTokensOnly<T>]
  : []

/**
 * The top-level track tokens (named lines excluded).
 *
 * @example
 * type T = TracksOf<"[a] 1fr [b] 2fr [c]">  // ["1fr", "2fr"]
 */
export type TracksOf<S extends string> =
  Trim<S> extends "none" | "" ? [] : TrackTokensOnly<SplitBySpace<Trim<S>>>

/**
 * The number of top-level tracks (named lines excluded).
 *
 * @example
 * type C = TrackCountOf<"repeat(3, 1fr) 100px">  // 2
 */
export type TrackCountOf<S extends string> = TracksOf<S>["length"]

/**
 * The number of rows in a grid-template-areas string.
 *
 * @example
 * type R = AreaRowCountOf<'"a a" "b b" "c c"'>  // 3
 */
export type AreaRowCountOf<S extends string> =
  Trim<S> extends "none" | ""
    ? 0
    : SplitAreaRows<Trim<S>> extends infer Rows extends string[]
      ? Rows["length"]
      : 0

/**
 * The column count of an areas string (cells in the first row; the validator
 * guarantees uniformity).
 *
 * @example
 * type C = AreaColumnCountOf<'"a a a" "b b b"'>  // 3
 */
export type AreaColumnCountOf<S extends string> =
  Trim<S> extends "none" | ""
    ? 0
    : SplitAreaRows<Trim<S>> extends [infer First extends string, ...string[]]
      ? SplitBySpace<Trim<First>>["length"]
      : 0

// =====================================================================
// 9. INTERNAL STATE — discriminated union (exported)
//
// The editor keeps raw text per mode. Exported for advanced use (custom
// serialization, programmatic build).
// =====================================================================

export type GridTemplateState =
  | { mode: "columns"; tracks: string }
  | { mode: "rows"; tracks: string }
  | { mode: "areas"; rows: string[] }

// Re-export the kit's Dimension for convenience.
export type { Dimension } from "@/lib/ridiculous-type-kit"
