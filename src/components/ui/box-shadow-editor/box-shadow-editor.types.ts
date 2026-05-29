// =====================================================================
// box-shadow-editor.types.ts
//
// The "ridiculous" tier: compile-time PER-LAYER TOKEN VALIDATION over a
// CSS `box-shadow` value (a COMMA-separated list of shadow layers). This
// is the INVERSE NESTING of the filter-builder dispatch: filter splits by
// space into functions; box-shadow splits by COMMA into layers, then by
// SPACE into the tokens of each layer.
//
// Built on `ridiculous-type-kit` plus the color-picker's `ColorLiteral`
// for the per-layer color. `BoxShadowLiteral<S>` resolves to `S` when
// every layer validates, `never` otherwise.
//
//   "0px 2px 4px rgb(0 0 0 / 0.2)"           →  the literal
//   "inset 0px 0px 10px 2px #000, 0px 4px 8px #0008"  →  the literal
//   "0px 4px red"                             →  never (bare keyword color)
//   "#000 0px 4px"                            →  never (leading color)
//   "0px 4px -8px"                            →  never (negative blur)
//   "0px"                                     →  never (too few lengths)
//
// Each layer:  [inset?] <offset-x> <offset-y> <blur>? <spread>? <color>?
//   - exactly 2-4 lengths (offset-x, offset-y required; blur, spread opt.)
//   - blur (3rd length) is non-negative; spread (4th) may be signed
//   - at most one `inset` keyword, LEADING or TRAILING only
//   - at most one <color>, TRAILING only, validated via ColorLiteral
//     (hex / functional; bare keyword colors like `red` are NOT in
//     ColorLiteral — strict tier rejects them, the runtime parser accepts)
// =====================================================================

import type { ColorLiteral } from "@/components/ui/color-picker/color-picker.types"
import type {
  And,
  IsLength,
  Or,
  SplitByComma,
  SplitBySpace,
  Trim,
} from "@/lib/ridiculous-type-kit"

// =====================================================================
// 1. PER-TOKEN PREDICATE ALIASES
// =====================================================================

/** Collapse the literal-or-never color validator into a boolean. */
type IsColor<S extends string> =
  ColorLiteral<Trim<S>> extends never ? false : true

/** A length whose numeric part is non-negative (no leading `-`). */
type IsNonNegLength<S extends string> =
  Trim<S> extends `-${string}` ? false : IsLength<Trim<S>>

// =====================================================================
// 2. LENGTH-GROUP VALIDATION
//
// Given the tuple of a layer's tokens AFTER any inset keyword has been
// stripped, validate 2-4 lengths with an OPTIONAL TRAILING color (so the
// token count ranges 2-5). The legal positional shapes:
//
//   [x, y]                     two lengths
//   [x, y, blur]               three lengths (blur non-negative) …
//   [x, y, color]              … OR two lengths + a trailing color
//   [x, y, blur, spread]       four lengths (blur non-neg, spread signed) …
//   [x, y, blur, color]        … OR three lengths + a trailing color
//   [x, y, blur, spread, color]   four lengths + a trailing color (full form)
//
// x, y are plain lengths (signed OK). blur is a NON-NEGATIVE length.
// spread is a plain length. color is a ColorLiteral.
// =====================================================================

type ValidateLengths<Parts extends string[]> = Parts extends [
  infer X extends string,
  infer Y extends string,
]
  ? And<IsLength<Trim<X>>, IsLength<Trim<Y>>>
  : Parts extends [
        infer X extends string,
        infer Y extends string,
        infer Z extends string,
      ]
    ? And<
        IsLength<Trim<X>>,
        And<IsLength<Trim<Y>>, Or<IsNonNegLength<Z>, IsColor<Z>>>
      >
    : Parts extends [
          infer X extends string,
          infer Y extends string,
          infer Z extends string,
          infer W extends string,
        ]
      ? And<
          IsLength<Trim<X>>,
          And<
            IsLength<Trim<Y>>,
            And<IsNonNegLength<Z>, Or<IsLength<Trim<W>>, IsColor<W>>>
          >
        >
      : Parts extends [
            infer X extends string,
            infer Y extends string,
            infer Z extends string,
            infer W extends string,
            infer C extends string,
          ]
        ? And<
            IsLength<Trim<X>>,
            And<
              IsLength<Trim<Y>>,
              And<IsNonNegLength<Z>, And<IsLength<Trim<W>>, IsColor<C>>>
            >
          >
        : false // < 2 or > 5 tokens (more than 4 lengths + a color)

// =====================================================================
// 3. INSET STRIPPING + PER-LAYER TOKEN VALIDATION
//
// `inset` is allowed LEADING or TRAILING only. We peel a leading inset,
// else a trailing inset, then validate the remaining tokens as a length
// group. A mid-token inset falls through to ValidateLengths where it
// fails (inset is neither a length nor a ColorLiteral). A doubled inset
// is rejected because after peeling one end the other inset remains in
// the length group and fails.
// =====================================================================

type ValidateLayerTokens<Parts extends string[]> = Parts extends [
  "inset",
  ...infer Rest extends string[],
]
  ? ValidateLengths<Rest>
  : Parts extends [...infer Init extends string[], "inset"]
    ? ValidateLengths<Init>
    : ValidateLengths<Parts>

// =====================================================================
// 4. STRICT VALIDATORS + CALL-SITE HELPER
// =====================================================================

/**
 * Strict single-layer validator. Resolves to `S` when `S` is one valid
 * shadow layer (inset placement + 2-4 lengths + optional trailing color),
 * `never` otherwise. A comma-separated list is NOT a single layer.
 *
 * @example
 * type A = ShadowLayerLiteral<"inset 0px 4px 8px #000"> // the literal
 * type B = ShadowLayerLiteral<"0px 4px red">            // never
 */
export type ShadowLayerLiteral<S extends string> =
  SplitBySpace<Trim<S>> extends infer Parts extends string[]
    ? ValidateLayerTokens<Parts> extends true
      ? S
      : never
    : never

// Depth-capped fold over the comma layer list. Up to 32 layers are fully
// validated; beyond the cap the tail is weak-validated (each layer must be
// non-empty). The runtime parser validates fully regardless of count.
type ValidateLayers<
  Layers extends string[],
  Depth extends unknown[] = [],
> = Layers extends [infer H extends string, ...infer T extends string[]]
  ? Depth["length"] extends 32
    ? Trim<H> extends "" // past the cap: weak-validate non-empty
      ? false
      : ValidateLayers<T, Depth>
    : ValidateLayerTokens<
          SplitBySpace<Trim<H>> extends infer P extends string[] ? P : []
        > extends true
      ? ValidateLayers<T, [...Depth, unknown]>
      : false
  : true // reached the end without a failure

/**
 * Strict literal validator. Resolves to `S` when `S` is a valid CSS
 * `box-shadow` value (or the `none` keyword), `never` otherwise.
 * `calc()` / `var()` inside a token resolve to `never` here (undecidable
 * at compile time) — use the casual / IntelliSense tier; the runtime
 * parser accepts them.
 *
 * @example
 * type A = BoxShadowLiteral<"0px 2px 4px #000">  // the literal
 * type B = BoxShadowLiteral<"0px 4px red">       // never (bare keyword)
 * type C = BoxShadowLiteral<"none">               // "none"
 */
export type BoxShadowLiteral<S extends string> =
  Trim<S> extends "none"
    ? S
    : Trim<S> extends ""
      ? never
      : SplitByComma<Trim<S>> extends infer Layers extends string[]
        ? Layers extends []
          ? never
          : ValidateLayers<Layers> extends true
            ? S
            : never
        : never

/**
 * Call-site validator helper. Mirrors `cssFilter()` / `cssTransform()` /
 * `color()` / `easing()`. An invalid box-shadow becomes a type error at
 * the argument.
 */
export const cssBoxShadow = <S extends string>(
  value: S & BoxShadowLiteral<S>,
): S => value

// =====================================================================
// 5. SUGGESTION STRINGS — IntelliSense + onChange return types
// =====================================================================

/**
 * Suggestion union — "this is a box-shadow string". Kept permissive (like
 * filter-builder's `FilterString`): a single layer is two-or-more
 * space-separated tokens; multi-layer lists are head-anchored on a layer
 * followed by a comma; plus `none`. The STRICT tier is the real gate.
 */
export type ShadowLayerString = `${string} ${string}`

export type BoxShadowString =
  | ShadowLayerString
  | `${ShadowLayerString}, ${string}`
  | "none"

/**
 * Layer-kind → output-string map. `box-shadow` has a single render target
 * (no filter/backdrop-filter-style mode), so the map is keyed by layer
 * KIND — `inset` shadows lead with the `inset` keyword; `outset` shadows
 * are a plain layer. Backs the per-kind suggestion shapes.
 */
export interface BoxShadowStringMap {
  outset: ShadowLayerString
  inset: `inset ${string}`
}

export type BoxShadowKind = keyof BoxShadowStringMap

// =====================================================================
// 6. UTILITY TYPES — operate on box-shadow literals at the type level
// =====================================================================

/**
 * The raw per-layer strings of a box-shadow value.
 *
 * @example
 * type T = LayersOf<"0px 4px #000, inset 0px 0px 2px">
 * //   ["0px 4px #000", "inset 0px 0px 2px"]
 * type N = LayersOf<"none"> // []
 */
export type LayersOf<S extends string> =
  Trim<S> extends "none" | "" ? [] : SplitByComma<Trim<S>>

/**
 * The number of shadow layers.
 *
 * @example
 * type C = LayerCountOf<"0px 1px, 0px 4px"> // 2
 */
export type LayerCountOf<S extends string> = LayersOf<S>["length"]

// Whether a single layer's tokens carry a leading or trailing `inset`.
type LayerTokensHaveInset<Parts extends string[]> = Parts extends [
  "inset",
  ...string[],
]
  ? true
  : Parts extends [...string[], "inset"]
    ? true
    : false

/**
 * Whether a SINGLE layer string is an inset shadow.
 *
 * @example
 * type A = IsInsetLayer<"inset 0px 0px 2px">       // true
 * type B = IsInsetLayer<"0px 0px 2px #000 inset">  // true
 * type C = IsInsetLayer<"0px 4px">                  // false
 */
export type IsInsetLayer<S extends string> = LayerTokensHaveInset<
  SplitBySpace<Trim<S>> extends infer P extends string[] ? P : []
>

type AnyLayerInset<Layers extends string[]> = Layers extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? IsInsetLayer<H> extends true
    ? true
    : AnyLayerInset<T>
  : false

/**
 * Whether ANY layer in the box-shadow is an inset shadow.
 *
 * @example
 * type A = HasInset<"0px 4px, inset 0px 0px 2px"> // true
 * type B = HasInset<"0px 4px #000">                // false
 */
export type HasInset<S extends string> = AnyLayerInset<LayersOf<S>>

// =====================================================================
// 7. INTERNAL STATE — the per-layer record (exported)
//
// The editor's state is `ShadowLayer[]`. Every layer has the same shape,
// so the meaningful discriminant is the boolean `inset` (not a tagged
// union on a function name as in filter-builder). Exported for advanced
// use (custom serialization, programmatic build). Values are kept as
// strings (they carry units / colors), mirroring how the literal
// preserves the raw text.
// =====================================================================

export interface ShadowLayer {
  /** Whether this is an inner (`inset`) shadow. */
  inset: boolean
  /** Horizontal offset (signed length). */
  offsetX: string
  /** Vertical offset (signed length). */
  offsetY: string
  /** Blur radius (non-negative length). Optional. */
  blur?: string
  /** Spread radius (signed length). Optional. */
  spread?: string
  /** Color (hex / functional / — at runtime — keyword). Optional. */
  color?: string
}
