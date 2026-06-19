// =====================================================================
// shape-path-editor.types.ts — ridiculously typed CSS shape() function
// (CSS Shapes L2; for clip-path / offset-path).
//
// ShapeLiteral<S> peels the shape() wrapper, validates the optional
// fill-rule + the `from <coordinate-pair>` seed, then dispatches each
// comma-separated command on its name (move/line/hline/vline/curve/
// smooth/arc/close) — per-command arity, the by/to direction keyword, the
// with/of slot keywords, and every coordinate's dimension. In the
// transform-builder / clip-path-editor function-dispatch lineage.
//
// NOTE: coordinates are <length-percentage> — the kit's IsLength requires a
// unit, so `0px` / `0%` are required (bare `0` is rejected, consistent with
// every other ridiculous component). hline/vline keyword positions + arc
// flags are deferred to the runtime parser (see spec §3.1).
//
// Spec: docs/superpowers/specs/2026-06-19-shape-path-editor-design.md
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
} from "@/lib/ridiculous-type-kit"

/** A `<length-percentage>` token. */
type LP<S extends string> = Or<IsLength<S>, IsPercentage<S>>

type IsByTo<S extends string> = S extends "by" | "to" ? true : false

/** The eight `<shape-command>` names. */
export type ShapeCommandName =
  | "move"
  | "line"
  | "hline"
  | "vline"
  | "curve"
  | "smooth"
  | "arc"
  | "close"

type FillRule = "nonzero" | "evenodd"

// ---------------------------------------------------------------------------
// the `from` seed segment (optional fill-rule + from <coordinate-pair>)
// ---------------------------------------------------------------------------

type ValidFrom<Toks extends string[]> = Toks extends [
  "from",
  infer X extends string,
  infer Y extends string,
]
  ? And<LP<X>, LP<Y>>
  : false

type ValidFromSeg<Seg extends string> =
  SplitBySpace<Seg> extends [
    infer A extends string,
    ...infer Rest extends string[],
  ]
    ? A extends FillRule
      ? ValidFrom<Rest>
      : ValidFrom<[A, ...Rest]>
    : false

// ---------------------------------------------------------------------------
// per-command validators
// ---------------------------------------------------------------------------

// move|line : <by|to> <x> <y>
type ValidLineLike<Rest extends string[]> = Rest extends [
  infer D extends string,
  infer X extends string,
  infer Y extends string,
]
  ? And<IsByTo<D>, And<LP<X>, LP<Y>>>
  : false

// hline|vline : <by|to> <length-percentage>
type ValidHV<Rest extends string[]> = Rest extends [
  infer D extends string,
  infer V extends string,
]
  ? And<IsByTo<D>, LP<V>>
  : false

// the control-point tail of curve: <cx> <cy> [ / <cx2> <cy2> ]
type ValidControlTail<Ctrl extends string[]> = Ctrl extends [
  infer X1 extends string,
  infer Y1 extends string,
]
  ? And<LP<X1>, LP<Y1>>
  : Ctrl extends [
        infer X1 extends string,
        infer Y1 extends string,
        "/",
        infer X2 extends string,
        infer Y2 extends string,
      ]
    ? And<And<LP<X1>, LP<Y1>>, And<LP<X2>, LP<Y2>>>
    : false

// curve : <by|to> <x> <y> with <control-tail>
type ValidCurve<Rest extends string[]> = Rest extends [
  infer D extends string,
  infer X extends string,
  infer Y extends string,
  "with",
  ...infer Ctrl extends string[],
]
  ? And<IsByTo<D>, And<And<LP<X>, LP<Y>>, ValidControlTail<Ctrl>>>
  : false

// smooth : <by|to> <x> <y> [ with <cx> <cy> ]
type ValidSmooth<Rest extends string[]> = Rest extends [
  infer D extends string,
  infer X extends string,
  infer Y extends string,
]
  ? And<IsByTo<D>, And<LP<X>, LP<Y>>>
  : Rest extends [
        infer D extends string,
        infer X extends string,
        infer Y extends string,
        "with",
        infer CX extends string,
        infer CY extends string,
      ]
    ? And<IsByTo<D>, And<And<LP<X>, LP<Y>>, And<LP<CX>, LP<CY>>>>
    : false

// arc : <by|to> <x> <y> of <r> [ <r2> <flags…> ]  (tail lenient — A5)
type ValidArc<Rest extends string[]> = Rest extends [
  infer D extends string,
  infer X extends string,
  infer Y extends string,
  "of",
  infer R extends string,
  ...string[],
]
  ? And<IsByTo<D>, And<And<LP<X>, LP<Y>>, LP<R>>>
  : false

type ValidCommand<C extends string> =
  SplitBySpace<C> extends [
    infer Name extends string,
    ...infer Rest extends string[],
  ]
    ? Name extends "close"
      ? Rest extends []
        ? true
        : false
      : Name extends "move" | "line"
        ? ValidLineLike<Rest>
        : Name extends "hline" | "vline"
          ? ValidHV<Rest>
          : Name extends "curve"
            ? ValidCurve<Rest>
            : Name extends "smooth"
              ? ValidSmooth<Rest>
              : Name extends "arc"
                ? ValidArc<Rest>
                : false
    : false

type AllCommands<Cmds extends string[]> = Cmds extends [
  infer H extends string,
  ...infer R extends string[],
]
  ? ValidCommand<H> extends true
    ? AllCommands<R>
    : false
  : true

type ValidateShapeBody<Args extends string> =
  SplitByComma<Args> extends [
    infer First extends string,
    ...infer Cmds extends string[],
  ]
    ? ValidFromSeg<First> extends true
      ? AllCommands<Cmds>
      : false
    : false

/** Strict validator for a CSS `shape()` value. `S` or `never`. */
export type ShapeLiteral<S extends string> =
  ParseFunction<S> extends {
    name: "shape"
    args: infer Args extends string
  }
    ? KeepIf<ValidateShapeBody<Args>, S>
    : never

// ---------------------------------------------------------------------------
// call-site helper + suggestion + utility
// ---------------------------------------------------------------------------

export const cssShape = <S extends string>(value: S & ShapeLiteral<S>): S =>
  value

export type ShapeString = `shape(${string})` | (string & {})

/** The command segments of a shape() value (everything after the `from` seed). */
export type CommandsOf<S extends string> =
  ParseFunction<S> extends {
    args: infer Args extends string
  }
    ? SplitByComma<Args> extends [string, ...infer Cmds extends string[]]
      ? Cmds
      : []
    : []

export type CommandCountOf<S extends string> = CommandsOf<S>["length"]

// ---------------------------------------------------------------------------
// internal state (exported for advanced use)
// ---------------------------------------------------------------------------

export interface Point {
  x: string
  y: string
}

export type ShapeCommand =
  | { kind: "move" | "line"; by: boolean; to: Point }
  | { kind: "hline" | "vline"; by: boolean; value: string }
  | { kind: "curve"; by: boolean; to: Point; control: Point; control2?: Point }
  | { kind: "smooth"; by: boolean; to: Point; control?: Point }
  | { kind: "arc"; by: boolean; to: Point; radius: Point; flags?: string }
  | { kind: "close" }

export interface ShapeValue {
  fillRule: "nonzero" | "evenodd" | null
  from: Point
  commands: ShapeCommand[]
}
