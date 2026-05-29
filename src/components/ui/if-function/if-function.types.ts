// =====================================================================
// if-function.types.ts
//
// The "ridiculous" tier for the CSS `if()` conditional value function
// (shipped 2025). Grammar:
//
//   if( <branch> [ ; <branch> ]* )
//   <branch>    = <condition> : <value>
//   <condition> = media(<media-query>) | supports(<supports-condition>)
//               | style(<style-query>) | else     // else: LAST branch only
//
// `IfFunctionLiteral<S>` resolves to `S` when:
//   1. `S` is an `if( … )` wrapper (name === "if", via the kit's ParseFunction),
//   2. the body splits on TOP-LEVEL semicolons into >= 1 branch,
//   3. each branch splits on its FIRST TOP-LEVEL colon into condition/value,
//   4. the condition is media()/supports()/style() (body non-empty + parens
//      balanced — LENIENT, per roadmap §7) OR the literal `else` (last only),
//   5. the value is non-empty.
// Otherwise → never.
//
// The kit ships no semicolon splitter, so SplitBySemicolon is implemented
// locally by mirroring the kit's paren-aware char-walk (the kit is NOT
// modified). Same for the first-colon splitter and the balance checker.
//
//   "if(media(width >= 800px): red; else: blue)"  → the literal
//   "if(style(--x: 1): 2px)"                       → the literal
//   "if(else: a; media(x): b)"                     → never (else not last)
//   "if(media(x) red)"                             → never (no colon)
//   "if(foo(x): 1)"                                → never (unknown kind)
//
// See `2026-05-29-if-function-design.md` §3 + §7 for the validated-vs-deferred
// boundary.
// =====================================================================

import type { And, ParseFunction, Trim } from "@/lib/ridiculous-type-kit"

// =====================================================================
// 1. LOCAL PAREN-AWARE SPLITTERS (kit mirror — kit has no `;` splitter)
// =====================================================================

type Push<Acc extends string[], Cur extends string> = [...Acc, Cur]

// Walk char-by-char tracking ()/[] depth; split on `;` only at depth 0.
type SplitSemiTopLevel<
  S extends string,
  Depth extends unknown[] = [],
  Cur extends string = "",
  Acc extends string[] = [],
> = S extends `${infer C}${infer Rest}`
  ? C extends "(" | "["
    ? SplitSemiTopLevel<Rest, [...Depth, unknown], `${Cur}${C}`, Acc>
    : C extends ")" | "]"
      ? SplitSemiTopLevel<
          Rest,
          Depth extends [unknown, ...infer D] ? D : [],
          `${Cur}${C}`,
          Acc
        >
      : C extends ";"
        ? Depth["length"] extends 0
          ? SplitSemiTopLevel<Rest, Depth, "", Push<Acc, Cur>>
          : SplitSemiTopLevel<Rest, Depth, `${Cur}${C}`, Acc>
        : SplitSemiTopLevel<Rest, Depth, `${Cur}${C}`, Acc>
  : Push<Acc, Cur>

// Trim each part; DROP empty parts (so a trailing `;` is tolerated).
type TrimDropEmpty<T extends string[]> = T extends [
  infer H extends string,
  ...infer R extends string[],
]
  ? Trim<H> extends ""
    ? TrimDropEmpty<R>
    : [Trim<H>, ...TrimDropEmpty<R>]
  : []

/** Split an `if()` body on TOP-LEVEL semicolons into trimmed branches. */
export type SplitBySemicolon<S extends string> = TrimDropEmpty<
  SplitSemiTopLevel<S>
>

// Split on the FIRST `:` at depth 0 → [before, after], else never. A colon
// inside `style(--x: 1)` (depth 1) or a value's `url(a:b)` is NOT the split.
type SplitFirstColon<
  S extends string,
  Depth extends unknown[] = [],
  Cur extends string = "",
> = S extends `${infer C}${infer Rest}`
  ? C extends "(" | "["
    ? SplitFirstColon<Rest, [...Depth, unknown], `${Cur}${C}`>
    : C extends ")" | "]"
      ? SplitFirstColon<
          Rest,
          Depth extends [unknown, ...infer D] ? D : [],
          `${Cur}${C}`
        >
      : C extends ":"
        ? Depth["length"] extends 0
          ? [Cur, Rest]
          : SplitFirstColon<Rest, Depth, `${Cur}${C}`>
        : SplitFirstColon<Rest, Depth, `${Cur}${C}`>
  : never // no top-level colon

// =====================================================================
// 2. BALANCE CHECK (parens balance + never go negative)
// =====================================================================

type IsBalancedAcc<
  S extends string,
  Depth extends unknown[] = [],
> = S extends `${infer C}${infer Rest}`
  ? C extends "(" | "["
    ? IsBalancedAcc<Rest, [...Depth, unknown]>
    : C extends ")" | "]"
      ? Depth extends [unknown, ...infer D]
        ? IsBalancedAcc<Rest, D>
        : false // closed with nothing open → negative
      : IsBalancedAcc<Rest, Depth>
  : Depth["length"] extends 0
    ? true
    : false // unclosed at end

/** True iff every `(`/`[` is matched and depth never goes negative. */
export type IsBalanced<S extends string> = IsBalancedAcc<S>

// =====================================================================
// 3. CONDITION VALIDATION (lenient bodies — roadmap §7)
// =====================================================================

// A media()/supports()/style() condition whose body is non-empty + balanced.
type IsConditionKind<S extends string> =
  Trim<S> extends `media(${infer B})`
    ? NonEmptyBalanced<B>
    : Trim<S> extends `supports(${infer B})`
      ? NonEmptyBalanced<B>
      : Trim<S> extends `style(${infer B})`
        ? NonEmptyBalanced<B>
        : false

type NonEmptyBalanced<B extends string> =
  Trim<B> extends "" ? false : IsBalanced<B>

// =====================================================================
// 4. BRANCH + WRAPPER VALIDATION
// =====================================================================

// One branch: split on the first top-level colon, validate condition + value.
// `else` is accepted only when `IsLast` is true.
type IsBranch<S extends string, IsLast extends boolean> =
  SplitFirstColon<Trim<S>> extends [
    infer Cond extends string,
    infer Val extends string,
  ]
    ? And<
        Trim<Cond> extends "else" ? IsLast : IsConditionKind<Cond>,
        Trim<Val> extends "" ? false : true
      >
    : false // no colon

// Fold the branch list; only the final element may be `else`.
type ValidateBranches<Branches extends string[]> = Branches extends [
  infer Only extends string,
]
  ? IsBranch<Only, true>
  : Branches extends [infer Head extends string, ...infer Rest extends string[]]
    ? IsBranch<Head, false> extends true
      ? ValidateBranches<Rest>
      : false
    : false // empty list

/**
 * Strict `if()` validator. Resolves to `S` for a valid CSS `if()` value,
 * `never` otherwise. Condition bodies are validated leniently (non-empty +
 * balanced parens); their internal grammar is deferred to the runtime parser
 * (design §7).
 *
 * @example
 * type A = IfFunctionLiteral<"if(media(width >= 800px): red; else: blue)"> // literal
 * type B = IfFunctionLiteral<"if(else: a; media(x): b)">                   // never
 * type C = IfFunctionLiteral<"if(style(--x: 1): 2px)">                     // literal
 */
export type IfFunctionLiteral<S extends string> =
  ParseFunction<Trim<S>> extends { name: "if"; args: infer Body extends string }
    ? SplitBySemicolon<Body> extends infer Branches extends string[]
      ? Branches extends []
        ? never
        : ValidateBranches<Branches> extends true
          ? S
          : never
      : never
    : never

/**
 * Call-site validator helper. Mirrors `color()` / `easing()` / `cssCalc()`.
 * An invalid `if()` becomes a type error at the argument.
 */
export const cssIf = <S extends string>(value: S & IfFunctionLiteral<S>): S =>
  value

// =====================================================================
// 5. SUGGESTION STRINGS — IntelliSense + onChange return types
//
// Permissive (the strict tier is the real gate), like transition-editor's
// TransitionString. `if()` has a single output shape — no mode prop narrows
// the output, so there is no StringMap (design A6).
// =====================================================================

/** A condition kind discriminant. */
export type ConditionKind = "media" | "supports" | "style" | "else"

/** Suggestion union for a single condition. */
export type ConditionString =
  | `media(${string})`
  | `supports(${string})`
  | `style(${string})`
  | "else"

/** Suggestion union — "this is an if() string". */
export type IfFunctionString = `if(${string})` | (string & {})

// =====================================================================
// 6. UTILITY TYPES — operate on if() literals at the type level
// =====================================================================

/**
 * The raw per-branch strings of an `if()` body (`[]` if not an if()).
 *
 * @example
 * type T = BranchesOf<"if(media(x): a; else: b)"> // ["media(x): a", "else: b"]
 */
export type BranchesOf<S extends string> =
  ParseFunction<Trim<S>> extends { name: "if"; args: infer Body extends string }
    ? SplitBySemicolon<Body>
    : []

/**
 * The number of branches.
 *
 * @example
 * type C = BranchCountOf<"if(media(x): a; else: b)"> // 2
 */
export type BranchCountOf<S extends string> = BranchesOf<S>["length"]

// The condition kind of one branch string (defaults to "else" wording for the
// bare `else`; "media"/"supports"/"style" by prefix). Used by ConditionKindsOf.
type KindOfBranch<S extends string> =
  SplitFirstColon<Trim<S>> extends [infer Cond extends string, string]
    ? Trim<Cond> extends `media(${string}`
      ? "media"
      : Trim<Cond> extends `supports(${string}`
        ? "supports"
        : Trim<Cond> extends `style(${string}`
          ? "style"
          : Trim<Cond> extends "else"
            ? "else"
            : never
    : never

type MapKinds<Branches extends string[]> = Branches extends [
  infer H extends string,
  ...infer R extends string[],
]
  ? [KindOfBranch<H>, ...MapKinds<R>]
  : []

/**
 * The condition kind of each branch.
 *
 * @example
 * type T = ConditionKindsOf<"if(media(x): a; else: b)"> // ["media", "else"]
 */
export type ConditionKindsOf<S extends string> = MapKinds<BranchesOf<S>>

// =====================================================================
// 7. INTERNAL STATE — the per-branch record + the editor state object
//    (exported for advanced use: custom serialization, programmatic build).
//    Values are kept as strings (they carry CSS tokens), mirroring how the
//    literal preserves the raw text.
// =====================================================================

/**
 * One `if()` branch. All kinds share this flat shape; `else` leaves
 * `condition` empty (design A11). `kind` is the literal-union discriminant.
 */
export interface IfBranch {
  /** The condition kind. */
  kind: ConditionKind
  /** The condition body (inside the kind's parens). Empty for `else`. */
  condition: string
  /** The branch value (right of the colon). */
  value: string
}

/**
 * The editor's internal state — a branch list. An object wrapper (not a bare
 * array) for forward-compat; the discriminant lives per-branch on `kind`.
 */
export interface IfFunctionState {
  branches: IfBranch[]
}
