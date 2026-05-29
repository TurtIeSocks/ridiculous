// =====================================================================
// transition-editor.types.ts
//
// The "ridiculous" tier: compile-time PER-LAYER TOKEN-KIND CLASSIFICATION
// over the CSS `transition` AND `animation` shorthands (both are
// COMMA-separated layer lists whose space-separated tokens are largely
// ORDER-INDEPENDENT within a layer — CSS classifies each token by KIND,
// not by position). This is the SAME inverse-nesting as box-shadow-editor
// (comma → layers, space → tokens) but classified by KIND + cardinality
// instead of by ordered position.
//
// Built on `ridiculous-type-kit` plus the easing-picker's `EasingLiteral`
// for the per-layer <easing-function> token. `TransitionLiteral<S>` /
// `AnimationLiteral<S>` resolve to `S` when every layer's tokens classify
// within their per-kind caps, `never` otherwise.
//
//   "opacity 200ms ease-in"                  → the literal
//   "all 200ms, color 100ms ease"            → the literal (2 layers)
//   "opacity 200ms 100ms 50ms ease"          → never (3 <time>)
//   "opacity 200ms wobble @x"                → never (unknown token)
//   "spin 1s ease-in-out infinite"           → the literal (animation)
//   "spin 1s 2 3"                            → never (2 iteration-counts)
//
// TRANSITION layer tokens:  { <=2 <time> (duration, delay), <=1
//   <easing-function>, <=1 <single-transition-property> (all|none|ident),
//   <=1 allow-discrete }.
// ANIMATION layer tokens:   { <=2 <time>, <=1 <easing-function>, <=1
//   iteration-count (<number>|infinite), <=1 direction, <=1 fill-mode,
//   <=1 play-state, <=1 <keyframes-name> ident }.
//
// See `2026-05-29-transition-editor-design.md` §3 for the token-kind
// precedence and the documented ambiguity resolutions.
// =====================================================================

import type { EasingLiteral } from "@/components/ui/easing-picker/easing-picker.types"
import type {
  AllChars,
  Digit,
  IsNumber,
  IsTime,
  Letter,
  SplitByComma,
  SplitBySpace,
  Trim,
} from "@/lib/ridiculous-type-kit"

// =====================================================================
// 1. PER-TOKEN PREDICATE ALIASES
// =====================================================================

/** Collapse the easing literal-or-never validator into a boolean. */
type IsEasing<S extends string> =
  EasingLiteral<Trim<S>> extends never ? false : true

// `<custom-ident>` — weak validation (design §3.3): a non-empty token of
// ident-safe chars (letters / digits / `-` / `_`) that does NOT start with a
// digit. Full <custom-ident> grammar (escapes, CSS-wide-keyword exclusion) is
// deferred to the runtime parser; the type budget does not warrant it for the
// single catch-all slot.
type IdentChar = Letter | Digit | "-" | "_"

type IsIdent<S extends string> = S extends ""
  ? false
  : S extends `${Digit}${string}`
    ? false
    : AllChars<S, IdentChar>

// =====================================================================
// 2. KEYWORD SETS
// =====================================================================

/** The `transition`-shorthand behavior flag (CSS Transitions L2). */
export type TransitionBehavior = "allow-discrete"

/** `all` / `none` — the keyword forms of <single-transition-property>. */
type TransitionPropKeyword = "all" | "none"

/** <single-animation-direction>. */
export type AnimationDirection =
  | "normal"
  | "reverse"
  | "alternate"
  | "alternate-reverse"

/** <single-animation-fill-mode>. */
export type AnimationFillMode = "none" | "forwards" | "backwards" | "both"

/** <single-animation-play-state>. */
export type AnimationPlayState = "running" | "paused"

/** <single-animation-iteration-count> — a <number> or `infinite`. */
type IsIterationCount<S extends string> =
  Trim<S> extends "infinite" ? true : IsNumber<Trim<S>>

// =====================================================================
// 3. PER-LAYER TOKEN CLASSIFICATION (the engine)
//
// Fold the layer's tokens by KIND, threading a tuple-length counter per
// kind. Reject the moment a counter would exceed its cap or a token matches
// nothing. Precedence is fixed (design §3): easing keywords beat the
// <custom-ident> catch-all so `ease` / `linear` count as easing, not as a
// property / keyframes-name.
// =====================================================================

// --- transition: counters [time, easing, prop, behavior] ---
type ClassifyTransition<
  Tokens extends string[],
  T extends unknown[] = [],
  E extends unknown[] = [],
  P extends unknown[] = [],
  B extends unknown[] = [],
> = Tokens extends [infer H extends string, ...infer R extends string[]]
  ? Trim<H> extends TransitionBehavior
    ? B["length"] extends 1
      ? false
      : ClassifyTransition<R, T, E, P, [...B, 0]>
    : IsTime<Trim<H>> extends true
      ? T["length"] extends 2
        ? false
        : ClassifyTransition<R, [...T, 0], E, P, B>
      : IsEasing<H> extends true
        ? E["length"] extends 1
          ? false
          : ClassifyTransition<R, T, [...E, 0], P, B>
        : Trim<H> extends TransitionPropKeyword
          ? P["length"] extends 1
            ? false
            : ClassifyTransition<R, T, E, [...P, 0], B>
          : IsIdent<Trim<H>> extends true
            ? P["length"] extends 1
              ? false
              : ClassifyTransition<R, T, E, [...P, 0], B>
            : false // unknown token
  : true // every token classified within its cap

// --- animation: counters [time, easing, iter, dir, fill, play, name] ---
type ClassifyAnimation<
  Tokens extends string[],
  T extends unknown[] = [],
  E extends unknown[] = [],
  I extends unknown[] = [],
  D extends unknown[] = [],
  F extends unknown[] = [],
  PL extends unknown[] = [],
  N extends unknown[] = [],
> = Tokens extends [infer H extends string, ...infer R extends string[]]
  ? IsTime<Trim<H>> extends true
    ? T["length"] extends 2
      ? false
      : ClassifyAnimation<R, [...T, 0], E, I, D, F, PL, N>
    : IsIterationCount<H> extends true
      ? I["length"] extends 1
        ? false
        : ClassifyAnimation<R, T, E, [...I, 0], D, F, PL, N>
      : Trim<H> extends AnimationDirection
        ? D["length"] extends 1
          ? false
          : ClassifyAnimation<R, T, E, I, [...D, 0], F, PL, N>
        : Trim<H> extends AnimationFillMode
          ? F["length"] extends 1
            ? false
            : ClassifyAnimation<R, T, E, I, D, [...F, 0], PL, N>
          : Trim<H> extends AnimationPlayState
            ? PL["length"] extends 1
              ? false
              : ClassifyAnimation<R, T, E, I, D, F, [...PL, 0], N>
            : IsEasing<H> extends true
              ? E["length"] extends 1
                ? false
                : ClassifyAnimation<R, T, [...E, 0], I, D, F, PL, N>
              : IsIdent<Trim<H>> extends true
                ? N["length"] extends 1
                  ? false
                  : ClassifyAnimation<R, T, E, I, D, F, PL, [...N, 0]>
                : false // unknown token
  : true

// =====================================================================
// 4. STRICT VALIDATORS + CALL-SITE HELPERS
// =====================================================================

/**
 * Strict single-`transition`-layer validator. Resolves to `S` when `S` is
 * one valid layer (tokens classify within caps), `never` otherwise. A
 * comma-separated list is NOT a single layer.
 *
 * @example
 * type A = TransitionLayerLiteral<"opacity 200ms ease"> // the literal
 * type B = TransitionLayerLiteral<"opacity 200ms 100ms 50ms ease"> // never
 */
export type TransitionLayerLiteral<S extends string> =
  SplitBySpace<Trim<S>> extends infer Parts extends string[]
    ? Parts extends []
      ? never
      : ClassifyTransition<Parts> extends true
        ? S
        : never
    : never

/**
 * Strict single-`animation`-layer validator. Resolves to `S` for one valid
 * layer, `never` otherwise.
 */
export type AnimationLayerLiteral<S extends string> =
  SplitBySpace<Trim<S>> extends infer Parts extends string[]
    ? Parts extends []
      ? never
      : ClassifyAnimation<Parts> extends true
        ? S
        : never
    : never

// Depth-capped fold over the comma layer list. Up to 32 layers are fully
// validated; beyond the cap the tail is weak-validated (non-empty). The
// runtime parser validates fully regardless of count. (box-shadow precedent.)
type ValidateLayers<
  Layers extends string[],
  Mode extends EditorMode,
  Depth extends unknown[] = [],
> = Layers extends [infer H extends string, ...infer Rest extends string[]]
  ? Depth["length"] extends 32
    ? Trim<H> extends ""
      ? false
      : ValidateLayers<Rest, Mode, Depth>
    : (
          Mode extends "transition"
            ? TransitionLayerLiteral<H>
            : AnimationLayerLiteral<H>
        ) extends never
      ? false
      : ValidateLayers<Rest, Mode, [...Depth, 0]>
  : true

/**
 * Strict `transition` validator. Resolves to `S` when `S` is a valid CSS
 * `transition` value (or the `none` keyword), `never` otherwise.
 * `calc()` / `var()` inside a token resolve to `never` here (undecidable at
 * compile time) — use the casual / IntelliSense tier; the runtime parser
 * accepts them.
 *
 * @example
 * type A = TransitionLiteral<"opacity 200ms ease-in"> // the literal
 * type B = TransitionLiteral<"opacity 200ms 100ms 50ms"> // never
 * type C = TransitionLiteral<"none"> // "none"
 */
export type TransitionLiteral<S extends string> =
  Trim<S> extends "none"
    ? S
    : Trim<S> extends ""
      ? never
      : SplitByComma<Trim<S>> extends infer L extends string[]
        ? L extends []
          ? never
          : ValidateLayers<L, "transition"> extends true
            ? S
            : never
        : never

/**
 * Strict `animation` validator. Resolves to `S` for a valid CSS `animation`
 * value (or `none`), `never` otherwise. Same calc()/var() caveat.
 *
 * @example
 * type A = AnimationLiteral<"spin 1s ease infinite"> // the literal
 * type B = AnimationLiteral<"spin 1s 2 3"> // never
 */
export type AnimationLiteral<S extends string> =
  Trim<S> extends "none"
    ? S
    : Trim<S> extends ""
      ? never
      : SplitByComma<Trim<S>> extends infer L extends string[]
        ? L extends []
          ? never
          : ValidateLayers<L, "animation"> extends true
            ? S
            : never
        : never

/**
 * Call-site validator helper for `transition`. Mirrors `cssBoxShadow()` /
 * `color()` / `easing()`. An invalid transition becomes a type error at the
 * argument.
 */
export const cssTransition = <S extends string>(
  value: S & TransitionLiteral<S>,
): S => value

/** Call-site validator helper for `animation`. */
export const cssAnimation = <S extends string>(
  value: S & AnimationLiteral<S>,
): S => value

// =====================================================================
// 5. SUGGESTION STRINGS — IntelliSense + onChange return types
//
// Permissive (like box-shadow-editor's `BoxShadowString`): a single layer is
// one-or-more space-separated tokens; multi-layer lists are head-anchored on
// a layer followed by a comma; plus `none`. The STRICT tier is the real gate.
// =====================================================================

export type TransitionLayerString = `${string} ${string}` | (string & {})

export type TransitionString =
  | `${string} ${string}`
  | `${string}, ${string}`
  | "none"
  | (string & {})

export type AnimationString =
  | `${string} ${string}`
  | `${string}, ${string}`
  | "none"
  | (string & {})

/**
 * Mode → output-string map. The `mode` prop narrows the `onChange` return:
 * `transition` → `TransitionString`, `animation` → `AnimationString`.
 */
export interface TransitionEditorStringMap {
  transition: TransitionString
  animation: AnimationString
}

export type EditorMode = keyof TransitionEditorStringMap

// =====================================================================
// 6. UTILITY TYPES — operate on transition / animation literals
// =====================================================================

/**
 * The raw per-layer strings of a transition / animation value.
 *
 * @example
 * type T = LayersOf<"opacity 1s, color 2s"> // ["opacity 1s", "color 2s"]
 * type N = LayersOf<"none"> // []
 */
export type LayersOf<S extends string> =
  Trim<S> extends "none" | "" ? [] : SplitByComma<Trim<S>>

/**
 * The number of layers.
 *
 * @example
 * type C = LayerCountOf<"opacity 1s, color 2s"> // 2
 */
export type LayerCountOf<S extends string> = LayersOf<S>["length"]

// Pull the single <custom-ident> token (property / keyframes-name) out of a
// layer's classified tokens. Uses the SAME precedence as the classifier: a
// token is the ident slot only if it is not a time / easing / number / known
// keyword. Returns `never` for a layer with no ident (so the per-layer map
// can stay total we fall back to "" — see PropOfLayer).
type FirstIdentTransition<Tokens extends string[]> = Tokens extends [
  infer H extends string,
  ...infer R extends string[],
]
  ? IsTime<Trim<H>> extends true
    ? FirstIdentTransition<R>
    : IsEasing<H> extends true
      ? FirstIdentTransition<R>
      : Trim<H> extends TransitionBehavior
        ? FirstIdentTransition<R>
        : Trim<H> extends "all" | "none"
          ? Trim<H>
          : IsIdent<Trim<H>> extends true
            ? Trim<H>
            : FirstIdentTransition<R>
  : never

type FirstIdentAnimation<Tokens extends string[]> = Tokens extends [
  infer H extends string,
  ...infer R extends string[],
]
  ? IsTime<Trim<H>> extends true
    ? FirstIdentAnimation<R>
    : IsIterationCount<H> extends true
      ? FirstIdentAnimation<R>
      : Trim<H> extends
            | AnimationDirection
            | AnimationFillMode
            | AnimationPlayState
        ? FirstIdentAnimation<R>
        : IsEasing<H> extends true
          ? FirstIdentAnimation<R>
          : IsIdent<Trim<H>> extends true
            ? Trim<H>
            : FirstIdentAnimation<R>
  : never

type MapIdents<
  Layers extends string[],
  Kind extends "transition" | "animation",
> = Layers extends [infer H extends string, ...infer R extends string[]]
  ? [
      Kind extends "transition"
        ? FirstIdentTransition<SplitBySpace<Trim<H>>>
        : FirstIdentAnimation<SplitBySpace<Trim<H>>>,
      ...MapIdents<R, Kind>,
    ]
  : []

/**
 * The transition-property ident of each layer (`all` / `none` / custom).
 *
 * @example
 * type T = TransitionPropertiesOf<"opacity 1s, transform 2s">
 * //   ["opacity", "transform"]
 */
export type TransitionPropertiesOf<S extends string> = MapIdents<
  LayersOf<S>,
  "transition"
>

/**
 * The keyframes-name of each animation layer.
 *
 * @example
 * type T = AnimationNamesOf<"spin 1s, pulse 2s"> // ["spin", "pulse"]
 */
export type AnimationNamesOf<S extends string> = MapIdents<
  LayersOf<S>,
  "animation"
>

// =====================================================================
// 7. INTERNAL STATE — the per-layer records + discriminated-union editor
//    state (exported for advanced use: custom serialization, programmatic
//    build). Values are kept as strings (they carry units / idents),
//    mirroring how the literal preserves the raw text.
// =====================================================================

/** One `transition` layer. */
export interface TransitionLayer {
  /** <single-transition-property> — `all` | `none` | a <custom-ident>. */
  property?: string
  /** Duration — a <time>. */
  duration?: string
  /** Delay — a <time>. */
  delay?: string
  /** Timing function — an <easing-function> (validated via EasingLiteral). */
  easing?: string
  /** The `allow-discrete` <transition-behavior> flag. */
  allowDiscrete?: boolean
}

/** One `animation` layer. */
export interface AnimationLayer {
  /** <keyframes-name> — a <custom-ident>. */
  name?: string
  /** Duration — a <time>. */
  duration?: string
  /** Delay — a <time>. */
  delay?: string
  /** Timing function — an <easing-function>. */
  easing?: string
  /** Iteration count — a <number> or `infinite`. */
  iterationCount?: string
  /** Direction. */
  direction?: AnimationDirection
  /** Fill mode. */
  fillMode?: AnimationFillMode
  /** Play state. */
  playState?: AnimationPlayState
}

/**
 * The editor's internal state — a discriminated union on `mode`. A transition
 * layer and an animation layer carry different fields, so the mode tags the
 * layer list.
 */
export type TransitionEditorState =
  | { mode: "transition"; layers: TransitionLayer[] }
  | { mode: "animation"; layers: AnimationLayer[] }
