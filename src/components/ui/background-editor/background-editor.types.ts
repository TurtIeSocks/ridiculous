// =====================================================================
// background-editor.types.ts — ridiculously typed CSS `background`
// shorthand (multi-layer).
//
// BackgroundLiteral<S> splits the value into comma-stacked layers and folds
// them via head/tail recursion that KNOWS WHEN IT IS AT THE LAST LAYER,
// permitting a <color> token ONLY there. This index-aware positional-list
// invariant — the final element of a list is special — is new to the
// registry (transform-builder / box-shadow-editor have no index-dependent
// rule). <color> defers to color-picker's ColorLiteral.
//
// Per-layer token validation is membership-based + order-free (the `||`
// ordering/cardinality is deferred to the runtime parser, spec §3.1 A4).
//
// Spec: docs/superpowers/specs/2026-06-19-background-editor-design.md
// =====================================================================

import type { ColorLiteral } from "@/components/ui/color-picker"
import type {
  And,
  IsLength,
  IsPercentage,
  KeepIf,
  Or,
  SplitByComma,
  SplitBySpace,
} from "@/lib/ridiculous-type-kit"

type Sat<L extends string> = [L] extends [never] ? false : true

// ---------------------------------------------------------------------------
// per-layer token vocabulary
// ---------------------------------------------------------------------------

type PositionKw = "left" | "center" | "right" | "top" | "bottom"
type SizeKw = "cover" | "contain" | "auto"
type RepeatKw =
  | "repeat"
  | "repeat-x"
  | "repeat-y"
  | "space"
  | "round"
  | "no-repeat"
type AttachmentKw = "scroll" | "fixed" | "local"
type BoxKw = "border-box" | "padding-box" | "content-box"
type BgKw = PositionKw | SizeKw | RepeatKw | AttachmentKw | BoxKw

// An image is `none` or any parenthesized function (gradient / url / image-set).
// SplitBySpace is paren-aware, so a gradient token arrives whole.
type IsImage<T extends string> = T extends "none"
  ? true
  : T extends `${string}(${string})`
    ? true
    : false

type IsBgToken<T extends string, AllowColor extends boolean> = T extends "/"
  ? true
  : T extends BgKw
    ? true
    : Or<IsLength<T>, IsPercentage<T>> extends true
      ? true
      : IsImage<T> extends true
        ? true
        : // the invariant: a color token is legal only in the final layer
          AllowColor extends true
          ? Sat<ColorLiteral<T>>
          : false

// ---------------------------------------------------------------------------
// layer fold (head/tail — the last layer allows a color)
// ---------------------------------------------------------------------------

type AllBgTokens<
  Toks extends string[],
  AllowColor extends boolean,
> = Toks extends [infer H extends string, ...infer R extends string[]]
  ? IsBgToken<H, AllowColor> extends true
    ? AllBgTokens<R, AllowColor>
    : false
  : true

type ValidateLayer<L extends string, AllowColor extends boolean> =
  SplitBySpace<L> extends infer Toks extends string[]
    ? Toks extends []
      ? false
      : AllBgTokens<Toks, AllowColor>
    : false

type ValidateLayers<Layers extends string[]> = Layers extends [
  infer L extends string,
  ...infer R extends string[],
]
  ? R extends []
    ? ValidateLayer<L, true>
    : And<ValidateLayer<L, false>, ValidateLayers<R>>
  : false

/** Strict validator for a CSS `background` shorthand. `S` or `never`. */
export type BackgroundLiteral<S extends string> = KeepIf<
  ValidateLayers<SplitByComma<S>>,
  S
>

// ---------------------------------------------------------------------------
// call-site helper + suggestion + utility
// ---------------------------------------------------------------------------

export const cssBackground = <S extends string>(
  value: S & BackgroundLiteral<S>,
): S => value

export type BackgroundString = string & {}

/** The comma-split layers of a `background` value. */
export type LayersOf<S extends string> = SplitByComma<S>
export type LayerCountOf<S extends string> = LayersOf<S>["length"]

// ---------------------------------------------------------------------------
// internal state (exported for advanced use)
// ---------------------------------------------------------------------------

export interface BgLayer {
  image: string
  position: string
  size: string
  repeat: string
  attachment: string
  origin: string
  clip: string
  /** Only meaningful on the final layer. */
  color?: string
}

export interface BackgroundValue {
  layers: BgLayer[]
}
