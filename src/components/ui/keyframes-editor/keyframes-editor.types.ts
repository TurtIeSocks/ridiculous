// =====================================================================
// keyframes-editor.types.ts — ridiculously typed CSS @keyframes body.
//
// The composition flagship. KeyframesLiteral<S> is a TWO-LEVEL fold:
//   (1) each `<keyframe-selector>` block header — from | to | a comma list
//       of <percentage> 0–100;
//   (2) each declaration's value, dispatched on the PROPERTY NAME into that
//       property's own ridiculous validator —
//         transform                    → transform-builder's TransformLiteral
//         filter | backdrop-filter     → filter-builder's FilterLiteral
//         color | background-color | … → color-picker's ColorLiteral
//         *-timing-function            → easing-picker's EasingLiteral
//         opacity                      → 0–1 number
//         length properties            → <length-percentage>
//         unknown property             → lenient (value not gated)
//
// The only registry component whose strict tier delegates to four sibling
// validators. Unknown properties + background + calc()/var() are deferred
// (see spec §3.2). tsc-budget gate: spec §3.1.
//
// Spec: docs/superpowers/specs/2026-06-19-keyframes-editor-design.md
// =====================================================================

import type { ColorLiteral } from "@/components/ui/color-picker"
import type { EasingLiteral } from "@/components/ui/easing-picker"
import type { FilterLiteral } from "@/components/ui/filter-builder"
import type { TransformLiteral } from "@/components/ui/transform-builder"
import type {
  And,
  IsLength,
  IsNumber0To1,
  IsPercent0To100,
  IsPercentage,
  KeepIf,
  Or,
  SplitByComma,
  Trim,
} from "@/lib/ridiculous-type-kit"

// `Literal<V>` resolves to `V` (valid) or `never` (invalid); collapse to bool.
type Sat<L extends string> = [L] extends [never] ? false : true

// ---------------------------------------------------------------------------
// local splitters (declarations split on `;`; CSS values carry no top-level `;`)
// ---------------------------------------------------------------------------

type SplitBySemi<
  S extends string,
  Acc extends string[] = [],
> = S extends `${infer H};${infer R}`
  ? SplitBySemi<R, [...Acc, H]>
  : [...Acc, S]

// ---------------------------------------------------------------------------
// property → value dispatch
// ---------------------------------------------------------------------------

type ColorProp =
  | "color"
  | "background-color"
  | "border-color"
  | "outline-color"
  | "caret-color"
  | "text-decoration-color"
  | "fill"
  | "stroke"

type LengthProp =
  | "width"
  | "height"
  | "min-width"
  | "min-height"
  | "max-width"
  | "max-height"
  | "top"
  | "left"
  | "right"
  | "bottom"
  | "inset"
  | "margin"
  | "margin-top"
  | "margin-right"
  | "margin-bottom"
  | "margin-left"
  | "padding"
  | "padding-top"
  | "padding-right"
  | "padding-bottom"
  | "padding-left"
  | "gap"
  | "row-gap"
  | "column-gap"
  | "font-size"
  | "line-height"
  | "border-radius"
  | "border-width"

/** Which embedded editor / validator a property routes to. */
export type KeyframePropertyKind =
  | "transform"
  | "filter"
  | "color"
  | "easing"
  | "opacity"
  | "length"
  | "plain"

type DispatchValue<
  Prop extends string,
  Value extends string,
> = Prop extends "transform"
  ? Sat<TransformLiteral<Value>>
  : Prop extends "filter" | "backdrop-filter"
    ? Sat<FilterLiteral<Value>>
    : Prop extends ColorProp
      ? Sat<ColorLiteral<Value>>
      : Prop extends "animation-timing-function" | "transition-timing-function"
        ? Sat<EasingLiteral<Value>>
        : Prop extends "opacity"
          ? IsNumber0To1<Value>
          : Prop extends LengthProp
            ? Or<IsLength<Value>, IsPercentage<Value>>
            : // unknown property → lenient (value not gated)
              true

// ---------------------------------------------------------------------------
// declarations
// ---------------------------------------------------------------------------

type ValidateDecl<D extends string> = D extends `${infer Prop}:${infer Value}`
  ? DispatchValue<Trim<Prop>, Trim<Value>>
  : false

type AllDecls<Decls extends string[]> = Decls extends [
  infer H extends string,
  ...infer R extends string[],
]
  ? Trim<H> extends ""
    ? AllDecls<R>
    : ValidateDecl<Trim<H>> extends true
      ? AllDecls<R>
      : false
  : true

// ---------------------------------------------------------------------------
// selectors
// ---------------------------------------------------------------------------

type IsSelector<S extends string> = S extends "from" | "to"
  ? true
  : IsPercent0To100<S>

type ValidateSelectors<Sels extends string[]> = Sels extends [
  infer H extends string,
  ...infer R extends string[],
]
  ? IsSelector<Trim<H>> extends true
    ? ValidateSelectors<R>
    : false
  : true

// ---------------------------------------------------------------------------
// blocks
// ---------------------------------------------------------------------------

type ValidateBlock<Sel extends string, Decls extends string> = And<
  ValidateSelectors<SplitByComma<Sel>>,
  AllDecls<SplitBySemi<Decls>>
>

type ParseBlocks<S extends string> =
  Trim<S> extends ""
    ? true
    : Trim<S> extends `${infer Sel}{${infer Decls}}${infer Rest}`
      ? ValidateBlock<Sel, Decls> extends true
        ? ParseBlocks<Rest>
        : false
      : false

/** Strict validator for a `@keyframes` body. `S` or `never`. */
export type KeyframesLiteral<S extends string> =
  S extends `${string}{${string}}${string}` ? KeepIf<ParseBlocks<S>, S> : never

// ---------------------------------------------------------------------------
// call-site helper + suggestion + utility
// ---------------------------------------------------------------------------

export const cssKeyframes = <S extends string>(
  value: S & KeyframesLiteral<S>,
): S => value

export type KeyframesString = string & {}

/** Count of keyframe blocks (stops) in a body. */
type CountBlocks<
  S extends string,
  N extends unknown[] = [],
> = S extends `${string}{${string}}${infer Rest}`
  ? CountBlocks<Rest, [...N, unknown]>
  : N["length"]

export type StopsOf<S extends string> = CountBlocks<S>

// ---------------------------------------------------------------------------
// internal state (exported for advanced use)
// ---------------------------------------------------------------------------

export interface Declaration {
  property: string
  value: string
}

export interface KeyframeBlock {
  selectors: string[]
  declarations: Declaration[]
}

export interface KeyframesValue {
  blocks: KeyframeBlock[]
}
