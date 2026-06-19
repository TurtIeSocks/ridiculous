// =====================================================================
// property-syntax-editor.types.ts — ridiculously typed CSS @property
// `syntax:` descriptor, with the crown-jewel dependent validator.
//
//   • SyntaxLiteral<S> — the `<syntax>` meta-grammar: "*" | a `|`-separated
//     list of `<data-type>` / literal-ident components, each with an optional
//     single `+` (space list) or `#` (comma list) multiplier.
//   • InitialValueLiteral<Syntax, V> — ONE CSS STRING TYPING ANOTHER: a
//     candidate `initial-value` V is checked AGAINST a validated `Syntax`.
//     `cssProperty(syntax, initialValue)` type-checks only when they agree.
//
// `<color>` defers to color-picker's ColorLiteral (the honest cross-component
// showcase). The `|` combinator never nests in a @property syntax descriptor,
// so a flat local SplitPipe replaces the kit's (unexported) SplitTopLevel.
//
// Spec: docs/superpowers/specs/2026-06-19-property-syntax-editor-design.md
// =====================================================================

import type { ColorLiteral } from "@/components/ui/color-picker"
import type {
  Digit,
  IsAngle,
  IsLength,
  IsNumber,
  IsPercentage,
  IsResolution,
  IsTime,
  KeepIf,
  Letter,
  NonEmptyAllChars,
  Or,
  SplitByComma,
  SplitBySpace,
  Trim,
} from "@/lib/ridiculous-type-kit"

// ---------------------------------------------------------------------------
// data types + local splitters
// ---------------------------------------------------------------------------

/** The data-type names a `@property` syntax descriptor may reference. */
export type DataTypeName =
  | "length"
  | "number"
  | "percentage"
  | "length-percentage"
  | "color"
  | "integer"
  | "angle"
  | "time"
  | "resolution"
  | "image"
  | "url"
  | "transform-function"
  | "transform-list"
  | "custom-ident"

/** A single `+`/`#` multiplier (or none). */
export type MultiplierToken = "" | "+" | "#"

/** Split a descriptor on its top-level `|` (no nesting in this grammar). */
type SplitPipe<
  S extends string,
  Acc extends string[] = [],
> = S extends `${infer H}|${infer R}`
  ? SplitPipe<R, [...Acc, Trim<H>]>
  : [...Acc, Trim<S>]

/** Peel a single trailing `+`/`#` multiplier off a component. */
type StripMult<C extends string> = C extends `${infer Base}#`
  ? { base: Trim<Base>; mult: "#" }
  : C extends `${infer Base}+`
    ? { base: Trim<Base>; mult: "+" }
    : { base: Trim<C>; mult: "" }

type IdentChar = Letter | Digit | "-" | "_"

/** A component base is either `<known-data-type>` or a (lenient) literal ident. */
type IsTypeOrIdent<Base extends string> = Base extends `<${infer T}>`
  ? T extends DataTypeName
    ? true
    : false
  : NonEmptyAllChars<Base, IdentChar>

// ---------------------------------------------------------------------------
// SyntaxLiteral<S>
// ---------------------------------------------------------------------------

type ValidComponent<C extends string> =
  StripMult<C> extends {
    base: infer B extends string
  }
    ? IsTypeOrIdent<B>
    : false

type AllValidComponents<Comps extends string[]> = Comps extends [
  infer H extends string,
  ...infer R extends string[],
]
  ? ValidComponent<H> extends true
    ? AllValidComponents<R>
    : false
  : true

/** Strict validator for a `@property` `syntax:` value. `S` or `never`. */
export type SyntaxLiteral<S extends string> =
  Trim<S> extends "*" ? S : KeepIf<AllValidComponents<SplitPipe<S>>, S>

// ---------------------------------------------------------------------------
// InitialValueLiteral<Syntax, V> — the dependent validator
// ---------------------------------------------------------------------------

type IsColor<Tok extends string> = [ColorLiteral<Tok>] extends [never]
  ? false
  : true

/** Does a single token satisfy a single (multiplier-stripped) base? */
type SatisfiesBase<
  Tok extends string,
  Base extends string,
> = Base extends `<${infer T}>`
  ? T extends "length"
    ? IsLength<Tok>
    : T extends "number"
      ? IsNumber<Tok>
      : T extends "integer"
        ? IsNumber<Tok>
        : T extends "percentage"
          ? IsPercentage<Tok>
          : T extends "length-percentage"
            ? Or<IsLength<Tok>, IsPercentage<Tok>>
            : T extends "angle"
              ? IsAngle<Tok>
              : T extends "time"
                ? IsTime<Tok>
                : T extends "resolution"
                  ? IsResolution<Tok>
                  : T extends "color"
                    ? IsColor<Tok>
                    : // image / url / transform-* / custom-ident → lenient
                      true
  : // literal ident → exact match
    Tok extends Base
    ? true
    : false

type AllSatisfy<Toks extends string[], Base extends string> = Toks extends [
  infer H extends string,
  ...infer R extends string[],
]
  ? SatisfiesBase<H, Base> extends true
    ? AllSatisfy<R, Base>
    : false
  : true

type NonEmptyAll<Toks extends string[], Base extends string> = Toks extends []
  ? false
  : AllSatisfy<Toks, Base>

type SatisfiesComp<V extends string, Comp extends string> =
  StripMult<Comp> extends {
    base: infer B extends string
    mult: infer M extends string
  }
    ? M extends "+"
      ? NonEmptyAll<SplitBySpace<V>, B>
      : M extends "#"
        ? NonEmptyAll<SplitByComma<V>, B>
        : SatisfiesBase<Trim<V>, B>
    : false

type MatchesAny<V extends string, Comps extends string[]> = Comps extends [
  infer H extends string,
  ...infer R extends string[],
]
  ? SatisfiesComp<V, H> extends true
    ? true
    : MatchesAny<V, R>
  : false

/** Dependent validator: a candidate `initial-value` V vs a `Syntax`. */
export type InitialValueLiteral<Syntax extends string, V extends string> =
  Trim<Syntax> extends "*" ? V : KeepIf<MatchesAny<V, SplitPipe<Syntax>>, V>

/** Exported for advanced use (custom serialization / extension). */
export type { SatisfiesBase }

// ---------------------------------------------------------------------------
// Call-site helpers
// ---------------------------------------------------------------------------

export const cssSyntax = <S extends string>(value: S & SyntaxLiteral<S>): S =>
  value

/**
 * The crown jewel: type-checks ONLY when `initialValue` satisfies the
 * declared `syntax` — one CSS string constraining another's type.
 */
export const cssProperty = <Syn extends string, Init extends string>(
  syntax: Syn & SyntaxLiteral<Syn>,
  initialValue: Init & InitialValueLiteral<Syn, Init>,
): { syntax: Syn; initialValue: Init } => ({ syntax, initialValue })

// ---------------------------------------------------------------------------
// IntelliSense suggestion strings
// ---------------------------------------------------------------------------

export type SyntaxString =
  | "*"
  | `<${DataTypeName}>`
  | `<${DataTypeName}>+`
  | `<${DataTypeName}>#`
  | (string & {})

// ---------------------------------------------------------------------------
// Utility + state
// ---------------------------------------------------------------------------

/** The component strings of a syntax descriptor (split on `|`). */
export type ComponentsOf<S extends string> = SplitPipe<S>

export interface SyntaxComponent {
  base: string
  isType: boolean
  multiplier: MultiplierToken
}

export interface PropertySyntaxState {
  universal: boolean
  components: SyntaxComponent[]
  initialValue: string
  inherits: boolean
}
