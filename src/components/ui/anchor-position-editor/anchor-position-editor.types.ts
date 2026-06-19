// =====================================================================
// anchor-position-editor.types.ts — ridiculously typed CSS
// anchor-positioning values.
//
// Three strict validators behind one `mode` prop:
//   • PositionAreaLiteral<S> — the `position-area` keyword pair, with the
//     CROSS-AXIS rule (two keywords must sit on different axes of the SAME
//     coordinate system; physical & logical never mix; center / span-all
//     are system-neutral). This positional-tuple constraint — rejecting a
//     PAIR for sharing an axis — is new to the registry.
//   • AnchorLiteral<S> — `anchor()` / `anchor-size()` inset/size functions.
//   • PositionTryLiteral<S> — a `position-try-fallbacks` comma list.
//
// Built entirely on ridiculous-type-kit. See the design spec
// docs/superpowers/specs/2026-06-19-anchor-position-editor-design.md.
// =====================================================================

import type {
  And,
  IsLength,
  IsPercentage,
  KeepIf,
  Or,
  ParseFunction,
  SplitByComma,
  SplitBySpace,
  StartsWith,
} from "@/lib/ridiculous-type-kit"

// ---------------------------------------------------------------------------
// position-area keyword vocabulary, grouped by axis family
// ---------------------------------------------------------------------------

/** Physical x-axis keywords (and their `span-` reach forms). */
type PhysX =
  | "left"
  | "right"
  | "x-start"
  | "x-end"
  | "x-self-start"
  | "x-self-end"
  | "span-left"
  | "span-right"
  | "span-x-start"
  | "span-x-end"
  | "span-x-self-start"
  | "span-x-self-end"

/** Physical y-axis keywords (and their `span-` reach forms). */
type PhysY =
  | "top"
  | "bottom"
  | "y-start"
  | "y-end"
  | "y-self-start"
  | "y-self-end"
  | "span-top"
  | "span-bottom"
  | "span-y-start"
  | "span-y-end"
  | "span-y-self-start"
  | "span-y-self-end"

/** Logical block-axis keywords. */
type LogBlock =
  | "block-start"
  | "block-end"
  | "self-block-start"
  | "self-block-end"
  | "span-block-start"
  | "span-block-end"
  | "span-self-block-start"
  | "span-self-block-end"

/** Logical inline-axis keywords. */
type LogInline =
  | "inline-start"
  | "inline-end"
  | "self-inline-start"
  | "self-inline-end"
  | "span-inline-start"
  | "span-inline-end"
  | "span-self-inline-start"
  | "span-self-inline-end"

/**
 * System-neutral keywords: usable on either axis / either coordinate system.
 * The "ambiguous-axis" forms (start/end/self-start/self-end) live here too —
 * their real axis depends on writing-mode, undecidable at the type level, so
 * the strict tier treats them leniently (A6 in the spec).
 */
type Neutral =
  | "center"
  | "span-all"
  | "start"
  | "end"
  | "self-start"
  | "self-end"
  | "span-start"
  | "span-end"
  | "span-self-start"
  | "span-self-end"

/** Every valid `position-area` keyword. */
export type PaKeyword = PhysX | PhysY | LogBlock | LogInline | Neutral

/** The axis a keyword binds to (or `neutral` for system-agnostic forms). */
export type PositionAxis = "x" | "y" | "block" | "inline" | "neutral"

/** Map a `position-area` keyword to its axis tag. */
export type AxisOf<K extends string> = K extends PhysX
  ? "x"
  : K extends PhysY
    ? "y"
    : K extends LogBlock
      ? "block"
      : K extends LogInline
        ? "inline"
        : K extends Neutral
          ? "neutral"
          : never

/**
 * The cross-axis compatibility rule: two keywords pair iff they are on
 * different axes of the SAME coordinate system. `neutral` pairs with
 * anything; x↔y (physical) and block↔inline (logical) pair; everything
 * else (same axis, or physical↔logical) is rejected.
 */
export type Compatible<
  A extends PositionAxis,
  B extends PositionAxis,
> = A extends "neutral"
  ? true
  : B extends "neutral"
    ? true
    : A extends "x"
      ? B extends "y"
        ? true
        : false
      : A extends "y"
        ? B extends "x"
          ? true
          : false
        : A extends "block"
          ? B extends "inline"
            ? true
            : false
          : A extends "inline"
            ? B extends "block"
              ? true
              : false
            : false

type ValidatePaBool<Toks extends string[]> = Toks extends [
  infer A extends string,
]
  ? A extends PaKeyword
    ? true
    : false
  : Toks extends [infer A extends string, infer B extends string]
    ? A extends PaKeyword
      ? B extends PaKeyword
        ? Compatible<AxisOf<A>, AxisOf<B>>
        : false
      : false
    : false

/** Strict validator for a `position-area` value. Resolves to `S` or `never`. */
export type PositionAreaLiteral<S extends string> = KeepIf<
  ValidatePaBool<SplitBySpace<S>>,
  S
>

// ---------------------------------------------------------------------------
// anchor() / anchor-size()
// ---------------------------------------------------------------------------

/** Keywords accepted as an `anchor()` side. */
export type AnchorSideKeyword =
  | "top"
  | "left"
  | "right"
  | "bottom"
  | "start"
  | "end"
  | "self-start"
  | "self-end"
  | "center"
  | "inside"
  | "outside"

/** Keywords accepted as an `anchor-size()` dimension. */
export type AnchorSizeKeyword =
  | "width"
  | "height"
  | "block"
  | "inline"
  | "self-block"
  | "self-inline"

type IsLengthPct<S extends string> = Or<IsLength<S>, IsPercentage<S>>

type IsAnchorSide<S extends string> = Or<
  S extends AnchorSideKeyword ? true : false,
  IsPercentage<S>
>

type IsAnchorSize<S extends string> = S extends AnchorSizeKeyword ? true : false

type IsAnchorHead<Head extends string, Fn extends "anchor" | "anchor-size"> =
  SplitBySpace<Head> extends [infer Side extends string]
    ? Fn extends "anchor"
      ? IsAnchorSide<Side>
      : IsAnchorSize<Side>
    : SplitBySpace<Head> extends [
          infer Name extends string,
          infer Side extends string,
        ]
      ? And<
          StartsWith<Name, "--">,
          Fn extends "anchor" ? IsAnchorSide<Side> : IsAnchorSize<Side>
        >
      : false

type IsAnchorArgs<Args extends string, Fn extends "anchor" | "anchor-size"> =
  SplitByComma<Args> extends [infer Head extends string]
    ? IsAnchorHead<Head, Fn>
    : SplitByComma<Args> extends [
          infer Head extends string,
          infer Fallback extends string,
        ]
      ? And<IsAnchorHead<Head, Fn>, IsLengthPct<Fallback>>
      : false

type IsAnchor<S extends string> =
  ParseFunction<S> extends {
    name: infer N extends string
    args: infer Args extends string
  }
    ? N extends "anchor"
      ? IsAnchorArgs<Args, "anchor">
      : N extends "anchor-size"
        ? IsAnchorArgs<Args, "anchor-size">
        : false
    : false

/** Strict validator for an `anchor()` / `anchor-size()` value. */
export type AnchorLiteral<S extends string> = KeepIf<IsAnchor<S>, S>

// ---------------------------------------------------------------------------
// position-try-fallbacks
// ---------------------------------------------------------------------------

/** The three `<try-tactic>` keywords. */
export type TryTactic = "flip-block" | "flip-inline" | "flip-start"

type IsIdentOrTactic<T extends string> = Or<
  StartsWith<T, "--">,
  T extends TryTactic ? true : false
>

type AllIdentOrTactic<Toks extends string[]> = Toks extends [
  infer H extends string,
  ...infer R extends string[],
]
  ? IsIdentOrTactic<H> extends true
    ? AllIdentOrTactic<R>
    : false
  : true

type IsTryFallbackStr<F extends string> = F extends "none"
  ? true
  : SplitBySpace<F> extends infer Toks extends string[]
    ? Toks extends []
      ? false
      : AllIdentOrTactic<Toks> extends true
        ? true
        : ValidatePaBool<Toks>
    : false

type AllTryFallbacks<Toks extends string[]> = Toks extends [
  infer H extends string,
  ...infer R extends string[],
]
  ? IsTryFallbackStr<H> extends true
    ? AllTryFallbacks<R>
    : false
  : true

/** Strict validator for a `position-try-fallbacks` value. */
export type PositionTryLiteral<S extends string> =
  SplitByComma<S> extends infer Toks extends string[]
    ? Toks extends []
      ? never
      : KeepIf<AllTryFallbacks<Toks>, S>
    : never

// ---------------------------------------------------------------------------
// Call-site helpers (resolve invalid input to `never` at the argument)
// ---------------------------------------------------------------------------

export const cssPositionArea = <S extends string>(
  value: S & PositionAreaLiteral<S>,
): S => value

export const cssAnchor = <S extends string>(value: S & AnchorLiteral<S>): S =>
  value

export const cssPositionTry = <S extends string>(
  value: S & PositionTryLiteral<S>,
): S => value

// ---------------------------------------------------------------------------
// IntelliSense suggestion strings + mode map
// ---------------------------------------------------------------------------

export type AnchorPositionMode = "position-area" | "anchor" | "position-try"

export type PositionAreaString =
  | PaKeyword
  | `${PaKeyword} ${PaKeyword}`
  | (string & {})

export type AnchorString =
  | `anchor(${string})`
  | `anchor-size(${string})`
  | (string & {})

export type PositionTryString = string & {}

export type AnchorPositionString =
  | PositionAreaString
  | AnchorString
  | PositionTryString

export interface AnchorStringMap {
  "position-area": PositionAreaString
  anchor: AnchorString
  "position-try": PositionTryString
}

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

/** The keyword tuple of a `position-area` value. */
export type KeywordsOf<S extends string> = SplitBySpace<S>

// ---------------------------------------------------------------------------
// Internal editor state (exported for advanced / custom serialization)
// ---------------------------------------------------------------------------

export interface AnchorExpr {
  fn: "anchor" | "anchor-size"
  name?: string
  side: string
  fallback?: string
}

export interface TryFallback {
  kind: "none" | "area" | "tactics"
  area?: string
  idents?: string[]
  tactics?: string[]
}

export interface PositionAreaState {
  system: "physical" | "logical"
  span: boolean
  row: 0 | 1 | 2
  col: 0 | 1 | 2
}
