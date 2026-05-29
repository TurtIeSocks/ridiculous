// =====================================================================
// font-editor.types.ts
//
// The "ridiculous" tier: a compile-time STRICT-ORDER PARSE of the CSS
// `font` shorthand. Unlike the order-free function-list dispatch of
// transform/filter, the `font` shorthand is the most ORDER-SENSITIVE of
// the common shorthands:
//
//   [ style || variant || weight || stretch ]?  <size>  [ / <line-height> ]?  <family>#
//
// …or a single system-font keyword as the WHOLE value.
//
//   "italic bold 16px/1.5 'Times New Roman', serif"  →  the literal
//   "16px serif"                                      →  the literal
//   "16px"                                            →  never (no family)
//   "italic oblique 16px serif"                       →  never (two styles)
//   "caption"                                         →  "caption"
//
// The ORDER is the point: prefix tokens are order-free but each KIND
// appears at most once; <size> is mandatory and precedes the family; the
// optional `/ <line-height>` attaches to the size; <family> is a
// mandatory comma-separated list that ends the value.
//
// Built entirely on `ridiculous-type-kit`. Structure mirrors
// transform-builder.types.ts: kit imports → classifiers → ordered-parse
// state machine → FontLiteral + cssFont → suggestion strings → utility
// types → internal discriminated-union state.
// =====================================================================

import type {
  Digit,
  IsLength,
  IsNumber,
  IsPercentage,
  Letter,
  Or,
  SplitByComma,
  SplitBySpace,
  Trim,
} from "@/lib/ridiculous-type-kit"

// =====================================================================
// 1. KEYWORD UNIONS
// =====================================================================

/** A system-font keyword usable as the WHOLE `font` value. */
export type SystemFontKeyword =
  | "caption"
  | "icon"
  | "menu"
  | "message-box"
  | "small-caption"
  | "status-bar"

/** The CSS generic font-family keywords. */
export type FontGenericFamily =
  | "serif"
  | "sans-serif"
  | "monospace"
  | "cursive"
  | "fantasy"
  | "system-ui"
  | "ui-serif"
  | "ui-sans-serif"
  | "ui-monospace"
  | "ui-rounded"

type FontStyleKeyword = "normal" | "italic" | "oblique"
type FontVariantKeyword = "normal" | "small-caps"
type FontWeightKeyword = "normal" | "bold" | "bolder" | "lighter"
type FontStretchKeyword =
  | "ultra-condensed"
  | "extra-condensed"
  | "condensed"
  | "semi-condensed"
  | "normal"
  | "semi-expanded"
  | "expanded"
  | "extra-expanded"
  | "ultra-expanded"
type AbsoluteSizeKeyword =
  | "xx-small"
  | "x-small"
  | "small"
  | "medium"
  | "large"
  | "x-large"
  | "xx-large"
  | "xxx-large"
  | "larger"
  | "smaller"

// =====================================================================
// 2. TOKEN CLASSIFIERS — one boolean predicate per grammar slot.
//    Each operates on an already-trimmed token.
// =====================================================================

/** Characters allowed anywhere in a bare family ident (incl. inner spaces). */
type IdentChar = Letter | Digit | "-" | "_" | " "

type AllIdentChars<S extends string> = S extends ""
  ? true
  : S extends `${infer C}${infer R}`
    ? C extends IdentChar
      ? AllIdentChars<R>
      : false
    : false

export type IsFontStyle<T extends string> = T extends FontStyleKeyword
  ? true
  : false

export type IsFontVariant<T extends string> = T extends FontVariantKeyword
  ? true
  : false

export type IsFontWeight<T extends string> = T extends FontWeightKeyword
  ? true
  : IsNumber<T>

export type IsFontStretch<T extends string> = T extends FontStretchKeyword
  ? true
  : IsPercentage<T>

export type IsFontSize<T extends string> = T extends AbsoluteSizeKeyword
  ? true
  : Or<IsLength<T>, IsPercentage<T>>

export type IsLineHeight<T extends string> = T extends "normal"
  ? true
  : Or<IsNumber<T>, Or<IsLength<T>, IsPercentage<T>>>

/**
 * One font-family token: a generic-family keyword, OR a quoted string
 * (any inner content), OR a bare custom-ident (weak-validated as
 * ident-safe — first char a letter/`_`/`-`, body letters/digits/`-`/`_`/
 * spaces). The full CSS custom-ident grammar is deferred (documented).
 */
export type IsFamilyToken<T extends string> = T extends FontGenericFamily
  ? true
  : T extends `"${string}"`
    ? true
    : T extends `'${string}'`
      ? true
      : T extends `${infer First}${string}`
        ? First extends Letter | "_" | "-"
          ? AllIdentChars<T>
          : false
        : false

// =====================================================================
// 3. ORDERED-PARSE STATE MACHINE — the namesake.
//
//  ParsePrefix consumes order-free prefix tokens (<=1 of each kind, with a
//  4-flag "Used" accumulator). The first token that is NOT a still-free
//  prefix kind starts the mandatory <size>. ParseSizeAndRest validates the
//  size and the optional `/ <line-height>` (attached + spaced forms), then
//  ParseFamily rejoins the remaining tokens, splits on commas, and requires
//  a non-empty list of family tokens.
// =====================================================================

interface Used {
  s: boolean // style consumed
  v: boolean // variant consumed
  w: boolean // weight consumed
  t: boolean // stretch consumed
}

type EmptyUsed = { s: false; v: false; w: false; t: false }

// Try to consume H as a still-FREE prefix kind. `normal` takes the first
// free kind (style → variant → weight → stretch). Returns the next Used on
// success, or `false` when H is not a free prefix kind.
type ConsumePrefix<H extends string, U extends Used> =
  IsFontStyle<H> extends true
    ? U["s"] extends false
      ? { s: true; v: U["v"]; w: U["w"]; t: U["t"] }
      : TryVariant<H, U>
    : TryVariant<H, U>

type TryVariant<H extends string, U extends Used> =
  IsFontVariant<H> extends true
    ? U["v"] extends false
      ? { s: U["s"]; v: true; w: U["w"]; t: U["t"] }
      : TryWeight<H, U>
    : TryWeight<H, U>

type TryWeight<H extends string, U extends Used> =
  IsFontWeight<H> extends true
    ? U["w"] extends false
      ? { s: U["s"]; v: U["v"]; w: true; t: U["t"] }
      : TryStretch<H, U>
    : TryStretch<H, U>

type TryStretch<H extends string, U extends Used> =
  IsFontStretch<H> extends true
    ? U["t"] extends false
      ? { s: U["s"]; v: U["v"]; w: U["w"]; t: true }
      : false
    : false

type ParsePrefix<Tokens extends string[], U extends Used> = Tokens extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? ConsumePrefix<H, U> extends infer Next
    ? Next extends Used
      ? ParsePrefix<T, Next>
      : ParseSizeAndRest<Tokens> // H was not a free prefix kind → it is the size
    : false
  : false // ran out of tokens without ever reaching a size → invalid

type ParseSizeAndRest<Tokens extends string[]> = Tokens extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? // attached form: "16px/1.5", or trailing-slash "16px/" with the
    // line-height in the next token ("16px/ 1.5")
    H extends `${infer Sz}/${infer Lh}`
    ? IsFontSize<Trim<Sz>> extends true
      ? Lh extends "" // "16px/" — line-height is the next token
        ? T extends [infer N extends string, ...infer R extends string[]]
          ? IsLineHeight<Trim<N>> extends true
            ? ParseFamily<R>
            : false
          : false
        : IsLineHeight<Trim<Lh>> extends true
          ? ParseFamily<T>
          : false
      : false
    : IsFontSize<H> extends true
      ? // half-spaced "16px /1.5" — next token starts with `/`
        T extends [infer N extends string, ...infer R extends string[]]
        ? N extends `/${infer Lh}`
          ? Lh extends "" // fully spaced "16px / 1.5" — `/` is its own token
            ? R extends [infer Lh2 extends string, ...infer R2 extends string[]]
              ? IsLineHeight<Trim<Lh2>> extends true
                ? ParseFamily<R2>
                : false
              : false
            : IsLineHeight<Trim<Lh>> extends true
              ? ParseFamily<R>
              : false
          : ParseFamily<T> // no line-height
        : false // size with nothing after → no family
      : false // mandatory size missing / invalid
  : false

// Rejoin the remaining (space-split) tokens, split on commas, require a
// non-empty list where every comma-segment is a family token.
type ParseFamily<Tokens extends string[]> = Tokens extends []
  ? false // family is mandatory
  : SplitByComma<Join<Tokens, " ">> extends infer Segs extends string[]
    ? Segs extends []
      ? false
      : AllFamily<Segs>
    : false

type AllFamily<Segs extends string[]> = Segs extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? IsFamilyToken<Trim<H>> extends true
    ? AllFamily<T>
    : false
  : true

type Join<T extends string[], Sep extends string> = T extends [
  infer H extends string,
  ...infer R extends string[],
]
  ? R extends []
    ? H
    : `${H}${Sep}${Join<R, Sep>}`
  : ""

// =====================================================================
// 4. STRICT VALIDATOR + CALL-SITE HELPER
// =====================================================================

/**
 * Strict literal validator. Resolves to `S` when `S` is a structurally and
 * dimensionally valid CSS `font` shorthand (or a system-font keyword),
 * `never` otherwise. The ordered grammar is enforced: order-free prefix
 * (≤1 each of style/variant/weight/stretch) → mandatory `<size>` →
 * optional `/ <line-height>` → mandatory `<font-family>` list.
 *
 * `var()` / `calc()` resolve to `never` here (undecidable at compile time)
 * — use the casual / IntelliSense tier; the runtime parser accepts them.
 *
 * @example
 * type A = FontLiteral<"italic bold 16px/1.5 serif"> // the literal
 * type B = FontLiteral<"16px">                        // never (no family)
 * type C = FontLiteral<"caption">                     // "caption"
 */
export type FontLiteral<S extends string> =
  Trim<S> extends SystemFontKeyword
    ? S
    : Trim<S> extends ""
      ? never
      : SplitBySpace<Trim<S>> extends infer Toks extends string[]
        ? Toks extends []
          ? never
          : ParsePrefix<Toks, EmptyUsed> extends true
            ? S
            : never
        : never

/**
 * Call-site validator helper. Mirrors `cssTransform()` / `color()` /
 * `easing()`. An invalid font shorthand becomes a type error at the
 * argument.
 */
export const cssFont = <S extends string>(value: S & FontLiteral<S>): S => value

// =====================================================================
// 5. SUGGESTION STRINGS — IntelliSense + onChange return types
// =====================================================================

/**
 * Suggestion union — "this is a font value". Deliberately loose: a precise
 * template-literal union for "optional-prefix size /lh family-list" would be
 * enormous and slow `tsc`. Strictness lives in `FontLiteral`. A non-system
 * shorthand always contains at least one space (size + family), so the
 * `` `${string} ${string}` `` arm covers it; system keywords surface in
 * autocomplete via the keyword union. Also the `onChange` return type.
 */
export type FontString = SystemFontKeyword | `${string} ${string}`

/** Representative output-string shapes. Mirrors `TransformStringMap`. */
export interface FontStringMap {
  system: SystemFontKeyword
  sizeFamily: `${string} ${string}`
  full: `${string} ${string}`
}

export type FontStringKey = keyof FontStringMap

// =====================================================================
// 6. UTILITY TYPES — operate on font literals at the type level
// =====================================================================

/** `true` when `S` is a system-font keyword. */
export type IsSystemFont<S extends string> =
  Trim<S> extends SystemFontKeyword ? true : false

/**
 * The ordered tuple of comma-separated family tokens in a font string.
 * `[]` for a system keyword or an unparseable value.
 *
 * @example
 * type F = FamiliesOf<"16px Times New Roman, serif"> // ["Times New Roman","serif"]
 */
export type FamiliesOf<S extends string> =
  Trim<S> extends SystemFontKeyword
    ? []
    : SplitBySpace<Trim<S>> extends infer Toks extends string[]
      ? FamiliesFromTokens<Toks, EmptyUsed>
      : []

// Walk past the prefix + size(+lh), then return the comma-split family list.
type FamiliesFromTokens<
  Tokens extends string[],
  U extends Used,
> = Tokens extends [infer H extends string, ...infer T extends string[]]
  ? ConsumePrefix<H, U> extends infer Next
    ? Next extends Used
      ? FamiliesFromTokens<T, Next>
      : FamiliesAfterSize<Tokens>
    : []
  : []

type FamiliesAfterSize<Tokens extends string[]> = Tokens extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? H extends `${infer _Sz}/${infer Lh}`
    ? Lh extends "" // "16px/" — line-height is the next token; family follows
      ? T extends [string, ...infer R extends string[]]
        ? FamilySegs<R>
        : []
      : FamilySegs<T>
    : T extends [infer N extends string, ...infer R extends string[]]
      ? N extends `/${infer Lh}`
        ? Lh extends ""
          ? R extends [string, ...infer R2 extends string[]]
            ? FamilySegs<R2>
            : []
          : FamilySegs<R>
        : FamilySegs<T>
      : []
  : []

type FamilySegs<Tokens extends string[]> = Tokens extends []
  ? []
  : SplitByComma<Join<Tokens, " ">> extends infer Segs extends string[]
    ? TrimSegs<Segs>
    : []

type TrimSegs<Segs extends string[]> = Segs extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? [Trim<H>, ...TrimSegs<T>]
  : []

/**
 * The `<size>` token of a font shorthand, or `never`.
 *
 * @example
 * type S = SizeOf<"italic 16px/1.5 serif"> // "16px"
 */
export type SizeOf<S extends string> =
  Trim<S> extends SystemFontKeyword
    ? never
    : SplitBySpace<Trim<S>> extends infer Toks extends string[]
      ? SizeFromTokens<Toks, EmptyUsed>
      : never

type SizeFromTokens<Tokens extends string[], U extends Used> = Tokens extends [
  infer H extends string,
  ...infer T extends string[],
]
  ? ConsumePrefix<H, U> extends infer Next
    ? Next extends Used
      ? SizeFromTokens<T, Next>
      : H extends `${infer Sz}/${string}`
        ? Trim<Sz>
        : H
    : never
  : never

/**
 * The `<line-height>` token of a font shorthand, or `never` when absent.
 *
 * @example
 * type L = LineHeightOf<"16px/1.5 serif"> // "1.5"
 */
export type LineHeightOf<S extends string> =
  Trim<S> extends SystemFontKeyword
    ? never
    : SplitBySpace<Trim<S>> extends infer Toks extends string[]
      ? LineHeightFromTokens<Toks, EmptyUsed>
      : never

type LineHeightFromTokens<
  Tokens extends string[],
  U extends Used,
> = Tokens extends [infer H extends string, ...infer T extends string[]]
  ? ConsumePrefix<H, U> extends infer Next
    ? Next extends Used
      ? LineHeightFromTokens<T, Next>
      : H extends `${string}/${infer Lh}`
        ? Lh extends "" // "16px/" — line-height is the bare next token
          ? T extends [infer N extends string, ...string[]]
            ? Trim<N>
            : never
          : Trim<Lh>
        : LhFromNext<T>
    : never
  : never

type LhFromNext<Tokens extends string[]> = Tokens extends [
  infer N extends string,
  ...infer R extends string[],
]
  ? N extends `/${infer Lh}`
    ? Lh extends ""
      ? R extends [infer Lh2 extends string, ...string[]]
        ? Trim<Lh2>
        : never
      : Trim<Lh>
    : never
  : never

// =====================================================================
// 7. INTERNAL STATE — discriminated union (exported)
//
// The editor's state is a single FontParts, discriminated by `kind`.
// Exported for advanced use (custom serialization, programmatic build).
// Values are kept as strings (they carry units / quoting), mirroring how
// the literal preserves the raw text.
// =====================================================================

export type FontParts =
  | { kind: "system"; keyword: SystemFontKeyword }
  | {
      kind: "shorthand"
      style?: string
      variant?: string
      weight?: string
      stretch?: string
      size: string
      lineHeight?: string
      family: string[]
    }
