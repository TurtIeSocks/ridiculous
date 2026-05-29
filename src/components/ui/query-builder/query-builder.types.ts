// =====================================================================
// query-builder.types.ts
//
// The "ridiculous" tier for CSS media queries AND container queries.
// `MediaQueryLiteral<S>` / `ContainerQueryLiteral<S>` resolve to `S` for a
// structurally + dimensionally valid query, `never` otherwise. Built on
// `ridiculous-type-kit` (DimensionOf, IsLength/IsResolution/IsNumber, And/Or,
// KeepIf, Trim). The boolean/parenthesized skeleton mirrors if-function (local
// paren-aware splitters — the kit ships no joiner-word splitter); the value
// dimension dispatch mirrors transform-builder.
//
// Grammar (see 2026-05-29-query-builder-design.md §1.1):
//   media:     [ (only|not)? <type> [ and <cond-no-or> ]? ] | <condition> | not <test>
//   container: [ <name> ]? <condition>
//   <condition> = <test> [ (and|or) <test> ]*   (NO mixing and/or at one level)
//   <test>      = ( <feature-test> ) | ( <condition> )   (nested, depth-capped)
//   <feature-test> = <feature> | <feature>:<value>
//                  | <feature> <op> <value> | <value> <op> <feature> <op> <value>
//
// Validated vs deferred boundary is design §3.4 / §7: strict validates the
// skeleton + the no-mix rule + a KNOWN feature table with per-feature value
// dimensions; it DEFERS unknown features, operator-direction consistency, the
// min-/max--with-range combo, calc()/var() values, and depth past 4 — the
// runtime parser does the fuller job.
// =====================================================================

import type {
  And,
  IsLength,
  IsNumber,
  IsResolution,
  Or,
  Trim,
} from "@/lib/ridiculous-type-kit"

// =====================================================================
// 1. LOCAL PAREN-AWARE SPLITTERS (kit ships no joiner-word splitter)
// =====================================================================

type Push<Acc extends string[], Cur extends string> = [...Acc, Cur]

// Walk char-by-char tracking ()/[] depth; split on the whole word ` ${W} `
// (space-delimited) only at depth 0. We detect the joiner by peeking for
// `${W} ` after a space at depth 0 — implemented by matching ` and `/` or `
// against the remaining string.
type SplitWord<
  S extends string,
  W extends string,
  Depth extends unknown[] = [],
  Cur extends string = "",
  Acc extends string[] = [],
> = S extends `${infer C}${infer Rest}`
  ? C extends "(" | "["
    ? SplitWord<Rest, W, [...Depth, unknown], `${Cur}${C}`, Acc>
    : C extends ")" | "]"
      ? SplitWord<
          Rest,
          W,
          Depth extends [unknown, ...infer D] ? D : [],
          `${Cur}${C}`,
          Acc
        >
      : Depth["length"] extends 0
        ? S extends ` ${W} ${infer After}`
          ? SplitWord<After, W, Depth, "", Push<Acc, Cur>>
          : SplitWord<Rest, W, Depth, `${Cur}${C}`, Acc>
        : SplitWord<Rest, W, Depth, `${Cur}${C}`, Acc>
  : Push<Acc, Cur>

type TrimAllDrop<T extends string[]> = T extends [
  infer H extends string,
  ...infer R extends string[],
]
  ? Trim<H> extends ""
    ? TrimAllDrop<R>
    : [Trim<H>, ...TrimAllDrop<R>]
  : []

/** Split `S` on the top-level whole word `W` (` and ` / ` or `). */
type SplitByWord<S extends string, W extends string> = TrimAllDrop<
  SplitWord<S, W>
>

// Does the whole word `W` occur at top level (depth 0)? Used for the no-mix
// check: when we split on one joiner we verify the other is absent.
type HasWord<
  S extends string,
  W extends string,
  Depth extends unknown[] = [],
> = S extends `${infer C}${infer Rest}`
  ? C extends "(" | "["
    ? HasWord<Rest, W, [...Depth, unknown]>
    : C extends ")" | "]"
      ? HasWord<Rest, W, Depth extends [unknown, ...infer D] ? D : []>
      : Depth["length"] extends 0
        ? S extends ` ${W} ${string}`
          ? true
          : HasWord<Rest, W, Depth>
        : HasWord<Rest, W, Depth>
  : false

// Parens balance + never go negative (if-function shape).
type IsBalancedAcc<
  S extends string,
  Depth extends unknown[] = [],
> = S extends `${infer C}${infer Rest}`
  ? C extends "(" | "["
    ? IsBalancedAcc<Rest, [...Depth, unknown]>
    : C extends ")" | "]"
      ? Depth extends [unknown, ...infer D]
        ? IsBalancedAcc<Rest, D>
        : false
      : IsBalancedAcc<Rest, Depth>
  : Depth["length"] extends 0
    ? true
    : false

type IsBalanced<S extends string> = IsBalancedAcc<S>

// =====================================================================
// 2. OPERATOR SPLITS (for range feature tests)
//    Ops: < <= > >= = . Try 2-char (<=,>=) before 1-char.
// =====================================================================

export type FeatureOperator = "<" | "<=" | ">" | ">=" | "="

// Split on the FIRST operator → [left, op, right]. Walks char-by-char so the
// 2-char ops win over their 1-char prefixes. Operators only appear at depth 0
// in a feature test (the test is already unwrapped of its outer parens).
type SplitFirstOp<
  S extends string,
  Cur extends string = "",
> = S extends `${infer A}${infer B}${infer Rest}`
  ? `${A}${B}` extends "<=" | ">="
    ? [Cur, `${A}${B}`, Rest]
    : A extends "<" | ">" | "="
      ? [Cur, A, `${B}${Rest}`]
      : SplitFirstOp<`${B}${Rest}`, `${Cur}${A}`>
  : S extends `${infer A}${infer Rest}`
    ? A extends "<" | ">" | "="
      ? [Cur, A, Rest]
      : never
    : never

// =====================================================================
// 3. VALUE-DIMENSION PREDICATES (built on the kit)
// =====================================================================

type IsLengthVal<S extends string> = IsLength<Trim<S>>
type IsResolutionVal<S extends string> = IsResolution<Trim<S>>
type IsIntegerVal<S extends string> = IsNumber<Trim<S>>

// A <ratio>: `<number>` or `<number>/<number>` (lenient — design A11).
type IsRatio<S extends string> =
  Trim<S> extends `${infer N}/${infer D}`
    ? And<IsNumber<Trim<N>>, IsNumber<Trim<D>>>
    : IsNumber<Trim<S>>

// =====================================================================
// 4. FEATURE TABLES (design §3.3) — KNOWN sets, per mode.
//    `min-`/`max-` prefixes are stripped (StripMinMax) before lookup.
// =====================================================================

type StripMinMax<F extends string> = F extends `min-${infer R}`
  ? R
  : F extends `max-${infer R}`
    ? R
    : F

export type QueryMode = "media" | "container"

// --- enum keyword unions (exported for IntelliSense) ------------------
export type Orientation = "portrait" | "landscape"
export type PrefersColorScheme = "light" | "dark"
export type PrefersReducedMotion = "no-preference" | "reduce"
export type PrefersReducedTransparency = "no-preference" | "reduce"
export type PrefersContrast = "no-preference" | "more" | "less" | "custom"
export type ForcedColors = "none" | "active"
export type Hover = "none" | "hover"
export type Pointer = "none" | "coarse" | "fine"
export type ColorGamut = "srgb" | "p3" | "rec2020"
export type DynamicRange = "standard" | "high"
export type Scripting = "none" | "initial-only" | "enabled"
export type UpdateFrequency = "none" | "slow" | "fast"
export type OverflowBlock = "none" | "scroll" | "paged"
export type OverflowInline = "none" | "scroll"
export type DisplayMode =
  | "fullscreen"
  | "standalone"
  | "minimal-ui"
  | "browser"
  | "window-controls-overlay"

// --- media feature classes -------------------------------------------
type MediaLengthFeature = "width" | "height" | "device-width" | "device-height"
type MediaRatioFeature = "aspect-ratio" | "device-aspect-ratio"
type MediaResolutionFeature = "resolution"
type MediaIntegerFeature =
  | "color"
  | "color-index"
  | "monochrome"
  | "device-pixel-ratio"

// Map an enum media feature to its keyword union (false if not an enum).
type MediaEnumValues<F extends string> = F extends "orientation"
  ? Orientation
  : F extends "prefers-color-scheme"
    ? PrefersColorScheme
    : F extends "prefers-reduced-motion"
      ? PrefersReducedMotion
      : F extends "prefers-reduced-transparency"
        ? PrefersReducedTransparency
        : F extends "prefers-contrast"
          ? PrefersContrast
          : F extends "forced-colors"
            ? ForcedColors
            : F extends "hover" | "any-hover"
              ? Hover
              : F extends "pointer" | "any-pointer"
                ? Pointer
                : F extends "color-gamut"
                  ? ColorGamut
                  : F extends "dynamic-range" | "video-dynamic-range"
                    ? DynamicRange
                    : F extends "scripting"
                      ? Scripting
                      : F extends "update"
                        ? UpdateFrequency
                        : F extends "overflow-block"
                          ? OverflowBlock
                          : F extends "overflow-inline"
                            ? OverflowInline
                            : F extends "display-mode"
                              ? DisplayMode
                              : never

// Boolean-capable media features (valid as a bare `(feature)`).
type MediaBooleanFeature =
  | "color"
  | "color-index"
  | "monochrome"
  | "grid"
  | "hover"
  | "any-hover"
  | "pointer"
  | "any-pointer"
  | "orientation"
  | "prefers-color-scheme"
  | "prefers-reduced-motion"
  | "prefers-reduced-transparency"
  | "prefers-contrast"
  | "forced-colors"
  | "color-gamut"
  | "dynamic-range"
  | "video-dynamic-range"
  | "scripting"
  | "update"
  | "overflow-block"
  | "overflow-inline"
  | "display-mode"

// --- container feature classes (size/style subset — design A5/A6) -----
type ContainerLengthFeature = "width" | "height" | "inline-size" | "block-size"
type ContainerRatioFeature = "aspect-ratio"
type ContainerEnumValues<F extends string> = F extends "orientation"
  ? Orientation
  : never
type ContainerBooleanFeature = "orientation"

// =====================================================================
// 5. VALUE VALIDATION PER FEATURE (the dispatch core)
//    Strip min-/max-, look up the base feature's class for the mode, check
//    the value's dimension / keyword. Unknown feature → false.
// =====================================================================

type ValidateMediaValue<Feature extends string, Value extends string> =
  StripMinMax<Feature> extends infer F extends string
    ? F extends MediaLengthFeature
      ? IsLengthVal<Value>
      : F extends MediaRatioFeature
        ? IsRatio<Value>
        : F extends MediaResolutionFeature
          ? IsResolutionVal<Value>
          : F extends MediaIntegerFeature
            ? IsIntegerVal<Value>
            : MediaEnumValues<F> extends never
              ? false
              : Trim<Value> extends MediaEnumValues<F>
                ? true
                : false
    : false

type ValidateContainerValue<Feature extends string, Value extends string> =
  StripMinMax<Feature> extends infer F extends string
    ? F extends ContainerLengthFeature
      ? IsLengthVal<Value>
      : F extends ContainerRatioFeature
        ? IsRatio<Value>
        : ContainerEnumValues<F> extends never
          ? false
          : Trim<Value> extends ContainerEnumValues<F>
            ? true
            : false
    : false

type ValidateValue<
  Feature extends string,
  Value extends string,
  Mode extends QueryMode,
> = Mode extends "media"
  ? ValidateMediaValue<Feature, Value>
  : ValidateContainerValue<Feature, Value>

// Boolean test: the bare feature must be boolean-capable for the mode.
type ValidateBoolean<
  Feature extends string,
  Mode extends QueryMode,
> = Mode extends "media"
  ? Trim<Feature> extends MediaBooleanFeature
    ? true
    : false
  : Trim<Feature> extends ContainerBooleanFeature
    ? true
    : false

// =====================================================================
// 6. FEATURE TEST DISPATCH (the four shapes)
// =====================================================================

type ValidateFeatureTest<Inner extends string, Mode extends QueryMode> =
  // [X] extends [never] guards against SplitFirstOp returning `never` (no op):
  // a bare `never` would vacuously satisfy the tuple pattern and widen L/Rest.
  [SplitFirstOp<Trim<Inner>>] extends [never]
    ? // no operator → plain `feature: value` or boolean `(feature)`
      Trim<Inner> extends `${infer F}:${infer V}`
      ? ValidateValue<Trim<F>, Trim<V>, Mode>
      : ValidateBoolean<Trim<Inner>, Mode>
    : SplitFirstOp<Trim<Inner>> extends [
          infer L extends string,
          FeatureOperator,
          infer Rest extends string,
        ]
      ? [SplitFirstOp<Trim<Rest>>] extends [never]
        ? // range2: L op Rest → L is the feature
          ValidateValue<Trim<L>, Trim<Rest>, Mode>
        : SplitFirstOp<Trim<Rest>> extends [
              infer Mid extends string,
              FeatureOperator,
              infer R extends string,
            ]
          ? // range3: L op Mid op R → Mid is the feature
            And<
              ValidateValue<Trim<Mid>, Trim<L>, Mode>,
              ValidateValue<Trim<Mid>, Trim<R>, Mode>
            >
          : false
      : false

// =====================================================================
// 7. TEST + CONDITION (recursive, depth-capped — design A10)
//    Depth is a tuple; we recurse on nested groups until it empties, then
//    accept the tail leniently (keeps tsc bounded).
// =====================================================================

// Is `Inner` (the content of a `( … )`) a GROUP rather than a feature test?
// A group starts with `(` or `not ` or has a top-level joiner.
type IsGroup<Inner extends string> =
  Trim<Inner> extends `(${string}`
    ? true
    : Trim<Inner> extends `not ${string}`
      ? true
      : Or<HasWord<Trim<Inner>, "and">, HasWord<Trim<Inner>, "or">>

type ValidateTest<
  S extends string,
  Mode extends QueryMode,
  Depth extends unknown[],
> =
  Trim<S> extends `(${infer Inner})`
    ? IsBalanced<Inner> extends true
      ? IsGroup<Inner> extends true
        ? Depth extends [unknown, ...infer D]
          ? ValidateCondition<Inner, Mode, D>
          : true // depth cap reached → accept leniently
        : ValidateFeatureTest<Inner, Mode>
      : false
    : false

// Every element of a tuple is a valid test.
type AllTests<
  Parts extends string[],
  Mode extends QueryMode,
  Depth extends unknown[],
> = Parts extends [infer H extends string, ...infer T extends string[]]
  ? ValidateTest<H, Mode, Depth> extends true
    ? AllTests<T, Mode, Depth>
    : false
  : true

type ValidateCondition<
  S extends string,
  Mode extends QueryMode,
  Depth extends unknown[],
> =
  Trim<S> extends `not ${infer Rest}`
    ? ValidateTest<Trim<Rest>, Mode, Depth>
    : SplitByWord<Trim<S>, "and"> extends infer AndParts extends string[]
      ? AndParts["length"] extends 0 | 1
        ? // no top-level `and` → try `or`
          SplitByWord<Trim<S>, "or"> extends infer OrParts extends string[]
          ? OrParts["length"] extends 0 | 1
            ? // single test
              ValidateTest<Trim<S>, Mode, Depth>
            : // all-or, and `and` must NOT appear at top level (no-mix)
              HasWord<Trim<S>, "and"> extends true
              ? false
              : AllTests<OrParts, Mode, Depth>
          : false
        : // all-and, and `or` must NOT appear at top level (no-mix)
          HasWord<Trim<S>, "or"> extends true
          ? false
          : AllTests<AndParts, Mode, Depth>
      : false

// =====================================================================
// 8. STRICT VALIDATORS + CALL-SITE HELPERS
// =====================================================================

type Depth4 = [unknown, unknown, unknown, unknown]
export type MediaType = "all" | "screen" | "print"
export type MediaModifier = "only" | "not"

// Strip an optional leading `only `/`not ` + media-type, then validate.
type ValidateMedia<S extends string> =
  Trim<S> extends `${MediaType}` | `only ${MediaType}` | `not ${MediaType}`
    ? true // a bare (optionally modified) media type with no condition
    : Trim<S> extends `${MediaType} and ${infer Cond}`
      ? // <type> and <condition> — after a type only `and` may join (we reuse
        // ValidateCondition; an `or` there would be invalid CSS anyway and the
        // no-mix scan handles a mixed tail)
        ValidateCondition<Trim<Cond>, "media", Depth4>
      : Trim<S> extends `only ${MediaType} and ${infer Cond}`
        ? ValidateCondition<Trim<Cond>, "media", Depth4>
        : Trim<S> extends `not ${MediaType} and ${infer Cond}`
          ? ValidateCondition<Trim<Cond>, "media", Depth4>
          : // no media type → a bare condition (which itself handles `not <test>`)
            ValidateCondition<Trim<S>, "media", Depth4>

/**
 * Strict media-query validator. Resolves to `S` for a structurally +
 * dimensionally valid `@media` condition, `never` otherwise.
 *
 * @example
 * type A = MediaQueryLiteral<"screen and (min-width: 600px)"> // the literal
 * type B = MediaQueryLiteral<"(width: 16/9)">                 // never
 */
export type MediaQueryLiteral<S extends string> =
  And<IsBalanced<Trim<S>>, ValidateMedia<S>> extends true ? S : never

// Strip an optional leading <container-name> ident (head not `(` / `not`).
type ValidateContainer<S extends string> =
  Trim<S> extends `(${string}`
    ? ValidateCondition<Trim<S>, "container", Depth4>
    : Trim<S> extends `not ${string}`
      ? ValidateCondition<Trim<S>, "container", Depth4>
      : Trim<S> extends `${string} ${infer Rest}`
        ? // a leading name token, then the condition
          ValidateCondition<Trim<Rest>, "container", Depth4>
        : false

/**
 * Strict container-query validator. Resolves to `S` for a valid `@container`
 * condition (size/style subset), `never` otherwise.
 *
 * @example
 * type A = ContainerQueryLiteral<"(inline-size > 30rem)"> // the literal
 * type B = ContainerQueryLiteral<"(min-resolution: 2dppx)"> // never
 */
export type ContainerQueryLiteral<S extends string> =
  And<IsBalanced<Trim<S>>, ValidateContainer<S>> extends true ? S : never

/**
 * Call-site media-query validator. Mirrors `cssIf()` / `cssTransform()`. An
 * invalid query becomes a type error at the argument.
 */
export const cssMediaQuery = <S extends string>(
  value: S & MediaQueryLiteral<S>,
): S => value

/** Call-site container-query validator. */
export const cssContainerQuery = <S extends string>(
  value: S & ContainerQueryLiteral<S>,
): S => value

// =====================================================================
// 9. SUGGESTION STRINGS — IntelliSense + onChange return types
//    Permissive (the strict tier is the gate), mirrors if-function.
// =====================================================================

/** Suggestion union — "this is a media-query string". */
export type MediaQueryString =
  | `(${string})`
  | `${MediaType}${string}`
  | (string & {})

/** Suggestion union — "this is a container-query string". */
export type ContainerQueryString = `(${string})` | (string & {})

/** Either dialect. */
export type QueryString = MediaQueryString | ContainerQueryString

/** Mode → output-string map (mirrors TransformStringMap). */
export interface QueryStringMap {
  media: MediaQueryString
  container: ContainerQueryString
}

// =====================================================================
// 10. UTILITY TYPES — operate on query literals at the type level
// =====================================================================

// The feature name of one parenthesized test (or never). Guarded against
// SplitFirstOp returning `never` (no operator) with the [X] extends [never]
// idiom — otherwise the tuple pattern is vacuously satisfied and L widens.
type FeatureOfTest<S extends string> =
  Trim<S> extends `(${infer Inner})`
    ? [SplitFirstOp<Trim<Inner>>] extends [never]
      ? Trim<Inner> extends `${infer F}:${string}`
        ? Trim<F> // plain
        : Trim<Inner> // boolean
      : SplitFirstOp<Trim<Inner>> extends [
            infer L extends string,
            FeatureOperator,
            infer Rest extends string,
          ]
        ? [SplitFirstOp<Trim<Rest>>] extends [never]
          ? Trim<L> // range2 → left token
          : SplitFirstOp<Trim<Rest>> extends [
                infer Mid extends string,
                FeatureOperator,
                string,
              ]
            ? Trim<Mid> // range3 → middle token
            : never
        : never
    : never

type FeatureNames<Parts extends string[]> = Parts extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? FeatureOfTest<H> extends never
    ? FeatureNames<T>
    : [FeatureOfTest<H>, ...FeatureNames<T>]
  : []

// Flatten a query to its top-level parenthesized tests (drops leading
// type/modifier/name + the `not`), splitting on whichever joiner is present.
type TopLevelTests<S extends string> =
  Trim<S> extends `not ${infer R}`
    ? TopLevelTests<R>
    : SplitByWord<Trim<S>, "and"> extends infer A extends string[]
      ? A["length"] extends 0 | 1
        ? SplitByWord<Trim<S>, "or">
        : A
      : []

// Strip a leading media-type / modifier so FeaturesOf sees only tests. (A
// container name is a bare ident — it won't match `(`, so FeatureOfTest yields
// never for it and FeatureNames drops it.)
type StripLead<S extends string> =
  Trim<S> extends `only ${infer R}`
    ? StripLead<R>
    : Trim<S> extends `${MediaType} and ${infer R}`
      ? R
      : Trim<S> extends `${MediaType}`
        ? ""
        : Trim<S>

/**
 * The feature names used in a query (top level).
 *
 * @example
 * type T = FeaturesOf<"(min-width: 600px) and (orientation: landscape)">
 * //   ["min-width", "orientation"]
 */
export type FeaturesOf<S extends string> = FeatureNames<
  TopLevelTests<StripLead<S>>
>

/**
 * The number of feature tests at the top level.
 *
 * @example
 * type C = FeatureCountOf<"(min-width: 600px) and (max-width: 900px)"> // 2
 */
export type FeatureCountOf<S extends string> = FeaturesOf<S>["length"]

// =====================================================================
// 11. INTERNAL STATE — discriminated union (exported for advanced use)
//
// The editor's flat state: an optional leading modifier/type (media) or name
// (container), one boolean joiner, a top-level `not`, and a list of tests.
// The full nested grammar is handled by the types + runtime parser; the row
// UI edits this flat case (design A8). Values are strings (they carry tokens).
// =====================================================================

/** One feature test, discriminated by `kind`. */
export type FeatureTest =
  | { kind: "boolean"; feature: string }
  | { kind: "plain"; feature: string; value: string }
  | { kind: "range2"; feature: string; op: FeatureOperator; value: string }
  | {
      kind: "range3"
      feature: string
      op: FeatureOperator
      value: string
      op2: FeatureOperator
      value2: string
    }

/** A parsed query node: a flat group of tests, or (from the parser) a nested
 * group / single test. The editor primarily uses `group`. */
export type QueryNode =
  | { type: "group"; joiner: "and" | "or"; not: boolean; tests: FeatureTest[] }
  | { type: "test"; not: boolean; test: FeatureTest }
  | { type: "raw"; not: boolean; text: string }

/** The editor's flat internal state. */
export interface QueryState {
  mode: QueryMode
  /** media only — `only` / `not` modifier on the media type. */
  modifier?: MediaModifier
  /** media only — the media type. */
  mediaType?: MediaType
  /** container only — the optional container name. */
  containerName?: string
  /** the single boolean joiner for the flat test list. */
  joiner: "and" | "or"
  /** a top-level `not`. */
  not: boolean
  /** the feature tests. */
  tests: FeatureTest[]
}

// Re-export the kit's Dimension for convenience.
export type { Dimension } from "@/lib/ridiculous-type-kit"
