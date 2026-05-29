# `if-function` — Component Design Spec

**Date:** 2026-05-29
**Phase:** 10 of 11 (per roadmap §3)
**Status:** Draft for implementation
**Scoped by:** `2026-05-29-ridiculous-component-roadmap-design.md` §5 (per-component contract) + §7 (risk policy)

---

## 1. What this is

An editor for the CSS **`if()`** conditional value function (shipped in browsers
2025). `if()` lets a CSS property pick a value from a list of guarded branches —
the conditional analog of `calc()`. It is the newest grammar in the portfolio
(roadmap entry #4) and depends on nothing else, so it lands late where its
uncertainty is cheapest.

### 1.1 Grammar

```
if( <branch> [ ; <branch> ]* )
<branch>    = <condition> : <value>
<condition> = media( <media-query> )
            | supports( <supports-condition> )
            | style( <style-query> )
            | else                    // ONLY permitted as the final branch
```

- Branches are separated by **top-level semicolons**.
- Each branch splits on its **first top-level colon** into a `<condition>` and a
  `<value>`.
- The literal `else` is a condition that always matches; it is only valid as the
  **last** branch.
- The value is any CSS value token sequence (kept verbatim; not validated for
  CSS correctness — that is property-dependent and undecidable here).

Example:

```css
color: if(
  media(width >= 800px): red;
  supports(color: oklch(0 0 0)): oklch(0.7 0.2 30);
  else: blue
);
```

### 1.2 The namesake (type-level flex)

The strict tier validates, at compile time:

1. The `if( … )` wrapper via the kit's `ParseFunction` (the function name must be
   `if`).
2. The body splits on **top-level semicolons** into branches (a local
   paren-aware splitter, mirroring the kit's `SplitByComma`/`SplitBySpace`
   char-walk — the kit ships no semicolon splitter and must not be modified).
3. Each branch splits on its **first top-level colon** into `condition` and
   `value`.
4. The condition is one of `media(…)` | `supports(…)` | `style(…)` (each body
   validated **leniently** — non-empty + balanced parens) **or** the literal
   `else`, which is rejected unless it is the **last** branch.
5. The value must be **non-empty**.

Anything else resolves to `never`: unknown condition kind, `else` not last,
missing colon, empty value, malformed wrapper, empty branch.

---

## 2. Contract conformance (roadmap §5)

| §5 requirement | This component |
|---|---|
| File layout | `if-function.tsx` + `.types.ts` + `.helpers.ts` + `index.ts` |
| 3-tier model | casual `string`; IntelliSense `IfFunctionString` (onChange return); strict `IfFunctionLiteral<S>` + `cssIf` helper |
| Strict validator | `IfFunctionLiteral<S>` composed from kit primitives + a local semicolon splitter |
| Call-site helper | `export const cssIf = <S extends string>(v: S & IfFunctionLiteral<S>): S => v` |
| Suggestion strings | `IfFunctionString`, `ConditionString`, plus a `…StringMap`-style surface is **not** needed (no mode prop narrows output — see Assumptions A6) |
| Utility types | `BranchCountOf<S>`, `ConditionKindsOf<S>`, `BranchesOf<S>` |
| Internal state | `IfFunctionState` — a branch list (discriminated-union branch records); exported |
| Controlled-only | required `value` + `onChange` |
| Two top-level exports | `<IfFunction/>` (popover) + `<IfFunctionPanel/>` (inline) |
| Sub-components exported | `BranchRow`, `ConditionKindSelect`, `AddBranchButton`, `IfPreview` |
| Demo / registry / nav | MPA entry, page, examples, `registry.json` item + `all` bundle, `nav:build` |
| Testing | type-tests (accept + reject), parse, format, component (jsdom) |
| Coverage | add `src/components/ui/if-function/**` to `coverage.include` |

---

## 3. Type surface (`if-function.types.ts`)

Structure mirrors `transition-editor.types.ts`:

```
kit imports → local semicolon splitter → per-condition predicate →
branch validator → IfFunctionLiteral + cssIf → suggestion strings →
utility types → internal discriminated-union state
```

### 3.1 Local top-level semicolon splitter

The kit has no semicolon splitter. Implement `SplitBySemicolon<S>` locally by
mirroring the kit's `SplitTopLevel` char-walk (track `(`/`[` depth; split on `;`
only at depth 0). Trim each part; **drop empty** parts (a trailing `;` is
tolerated — matches the runtime). This stays private to `.types.ts`.

### 3.2 Condition validation (lenient bodies — roadmap §7)

```
IsBalanced<S>   — parens balance + never go negative (char-walk over "(" / ")")
IsConditionKind<S> — Trim<S> is `media(<body>)` | `supports(<body>)` | `style(<body>)`
                     where <body> is non-empty AND IsBalanced<body>
```

The condition body (the media-query / supports-condition / style-query grammar)
is **not** parsed at the type level — only presence + paren balance. Full body
grammars are large and property/feature-dependent; the runtime parser does
fuller structural work, and a future media-query-builder component (phase 11)
owns the deep media grammar. This deferral is exactly the §7 "weak-validate the
variadic/opaque tail" policy; documented in §7 of this spec too.

### 3.3 Branch + wrapper validation

```
IsBranch<S, IsLast> — split on FIRST top-level colon → Cond : Value
                      Cond is `else` (only if IsLast) OR IsConditionKind<Cond>
                      Value is non-empty (after Trim)
ValidateBranches<Branches> — fold; the `else`-last rule is enforced by passing
                      IsLast=true only for the final element
IfFunctionLiteral<S> — ParseFunction<S>.name === "if"
                       AND body splits into ≥1 branch
                       AND ValidateBranches succeeds → S, else never
```

"First top-level colon" matters: `style(--x: 1)` contains a colon inside the
condition. Split on the FIRST top-level colon **after** depth tracking so the
colon inside `style(…)` (depth 1) is not the split point. Implement a
`SplitFirstColonTopLevel<S>` char-walk returning `[before, after] | never`.

### 3.4 Suggestion strings (IntelliSense + onChange)

Permissive, like `TransitionString` (the strict tier is the real gate):

```ts
export type ConditionKind = "media" | "supports" | "style" | "else"
export type ConditionString =
  | `media(${string})`
  | `supports(${string})`
  | `style(${string})`
  | "else"
export type IfFunctionString = `if(${string})` | (string & {})
```

### 3.5 Utility types

```ts
export type BranchesOf<S>       // raw per-branch strings of the if() body, [] if not if()
export type BranchCountOf<S>    // BranchesOf<S>["length"]
export type ConditionKindsOf<S> // tuple of each branch's ConditionKind ("media"|...|"else")
```

### 3.6 Internal state

```ts
export interface IfBranch {
  /** "media" | "supports" | "style" | "else" */
  kind: ConditionKind
  /** The condition body (inside the kind's parens). Empty for `else`. */
  condition: string
  /** The branch value (right of the colon). */
  value: string
}
export interface IfFunctionState {
  branches: IfBranch[]
}
```

`IfFunctionState` is an object wrapper (not a bare array) so it can grow without
a breaking change, and to match the "discriminated-union state" spirit — the
discriminant lives per-branch on `kind`.

---

## 4. Runtime helpers (`if-function.helpers.ts`)

Pure parse/format, the superset of the strict tier (fuller than the lenient
type bodies, tolerant where the type tier rejects):

- `splitTopLevel(src, sep)` — paren-aware char-walk (runtime mirror of the kit).
- `parseIf(src): IfBranch[] | null` — validate `if(…)` wrapper, split body on
  top-level `;`, split each branch on first top-level `:`, classify the
  condition kind, extract the kind's inner body, keep the value verbatim.
  Returns `null` on: bad wrapper, no branches, a branch with no colon, an empty
  value, an unknown condition kind, `else` not last, unbalanced parens.
- `branchToCss(branch): string` — `else: value` or `kind(condition): value`.
- `formatIf(branches): string` — `if( b1; b2; … )` (canonical: `"; "` joiner,
  single space inside the parens).
- `defaultBranch(kind?): IfBranch` — a sensible seed per kind.
- `branchCount(src): number` — runtime mirror of `BranchCountOf` (invalid → 0).
- `ParseResult` facade `{ branches: IfBranch[] | null; error: string | null }`.

Runtime is **fuller** than the type tier on condition bodies: it validates paren
balance + non-empty, same as the type tier, but additionally classifies the kind
robustly. It does **not** validate the media/supports/style body grammar deeply
(documented limitation, §7).

---

## 5. Component (`if-function.tsx`)

Mirrors `transition-editor.tsx` shape (popover + inline panel + a branch-row
list + add button + live string + a small preview).

- `IfFunction` — popover-wrapped trigger button (shows branch count + truncated
  value), renders `IfFunctionPanel` inside `PopoverContent`.
- `IfFunctionPanel` — inline `<fieldset>`; holds `IfBranch[]` state, resyncs from
  external `value` (skipping its own emits via a `lastEmittedRef`), commits via
  `formatIf` → `onChange`.
- `BranchRow` — one branch: a **condition-kind `<select>`** (media / supports /
  style / else), a **condition-body `<input>`** (disabled + hidden when kind is
  `else`), a **value `<input>`**, and a remove button. `else` is only selectable
  for the last row (enforced in the panel: non-last rows omit the `else` option).
- `ConditionKindSelect` — the labelled native `<select>` (native, like
  `KeywordSelect` in transition-editor — no shadcn `select` dependency).
- `AddBranchButton` — `+ add branch`.
- `IfPreview` — applies the produced `if()` string to a sample element's `color`
  (with a graceful note + fallback for browsers without `if()` support), plus a
  one-line "cutting-edge browser support" caption.

All controls are native HTML + the existing `button`/`input`/`popover` shadcn
primitives + `cn`. No new runtime deps.

### 5.1 The required branch-builder example

`src/examples/if-function/branch-builder.tsx` — a standalone interactive demo:
per-branch condition-kind `<select>` (media/supports/style), a condition-body
input, a value input, add/remove branches, an optional trailing `else` branch,
and a live readout of the produced `if()` string + the cutting-edge-support note.
This is satisfied by `IfFunctionPanel` itself; the example wraps it with the
explanatory copy + the support caption.

---

## 6. Demo, registry, nav

- MPA: `pages/if-function/{index.html,main.tsx}`; add the input to
  `vite.config.ts`.
- Page: `src/pages/if-function/page.tsx` (Layout + SectionHeaders + examples +
  `InstallCta`).
- Examples: `basic-usage`, `tier-casual`, `tier-intellisense`, `tier-strict`,
  `api-reference`, `branch-builder`.
- `registry.json`: add an `if-function` item (`type: registry:ui`;
  `registryDependencies`: `ridiculous-type-kit`, `button`, `popover`, `input`)
  and append it to the `all` bundle. `pnpm registry:build` regenerates
  `public/r/*.json` (gitignored — not committed).
- `pnpm nav:build` regenerates `src/generated/nav.ts` from `registry.json`.

---

## 7. Strict-tier scope: validated vs deferred (roadmap §7)

**Validated at compile time:**

- `if( … )` wrapper (name must be `if`, via `ParseFunction`).
- Top-level `;` branch split (paren-aware; trailing `;` tolerated).
- ≥1 branch required.
- First top-level `:` split per branch (paren-aware — a colon inside `style(…)`
  is not the split point).
- Condition kind ∈ { `media(…)`, `supports(…)`, `style(…)`, `else` }.
- `else` permitted **only** as the last branch.
- Condition body (inside the kind's parens): **non-empty + parens balanced**.
- Value: **non-empty** (after trim).

**Deferred to the runtime parser / not validated at the type level:**

- The internal grammar of the media-query / supports-condition / style-query
  bodies (feature names, operators, value ranges). Rationale: large,
  property/feature-dependent, owned conceptually by the phase-11 media-query
  builder; §7 "weak-validate the opaque tail" policy. The bodies are checked
  only for presence + paren balance.
- CSS correctness of branch values (property-dependent, undecidable here).
- A `calc()`/`var()` etc. inside a condition body or value is accepted by the
  strict tier as long as parens balance and the slot is non-empty (it is opaque
  text to this validator) — unlike transition-editor, `if()` does not classify
  value tokens, so there is nothing to make undecidable.

**Compile-budget guard:** the only recursion is the three char-walk splitters
(semicolon, first-colon, balance) and a linear branch fold. No nested-depth
recursion beyond paren tracking. A branch-count cap is **not** required (the
fold is linear and cheap), matching `transition-editor`'s linear layer fold;
if `tsc` time regresses, a 32-branch cap mirroring `ValidateLayers` is the
fallback (recorded here pre-emptively).

---

## 8. Assumptions (decisions made without the human — global CLAUDE.md delegate mode)

- **A1 — Lenient condition bodies.** The strict tier validates condition bodies
  only for non-emptiness + paren balance, not their internal grammar. This is
  the explicit roadmap §7 policy and keeps `tsc` fast. The runtime parser and
  the future media-query builder own deep grammar.
- **A2 — `else` body must be empty.** `else` takes no parens. `else(…)` is
  rejected (it is neither a bare `else` nor a known kind). An `else` with a
  trailing condition body in state serializes as bare `else`.
- **A3 — First-colon split is depth-aware.** A colon inside `style(--x: 1)` or
  inside a value's `url(a:b)` does not split the branch. Only the first
  **top-level** colon does.
- **A4 — Trailing semicolon tolerated.** `if(else: red;)` is valid (the empty
  trailing branch is dropped) at both the type and runtime tiers, mirroring how
  the kit's splitters + the runtime drop empty trailing parts. An *interior*
  empty branch (`a: 1;; b: 2`) drops the empty middle too (no empty-branch
  error) — consistent, lenient, and matches "drop empty parts".
- **A5 — No `none`/empty sentinel.** Unlike transition's `none`, `if()` has no
  keyword form; an empty or whitespace `value` prop → `never` (strict) / `null`
  (runtime) / an empty editor that seeds one default branch on first add.
- **A6 — No mode prop, so no StringMap.** `if()` has a single output shape;
  there is no mode that narrows `onChange`. The §5.3 "StringMap + mode key"
  surface is therefore omitted (it is "where a mode prop narrows output" —
  conditional in the contract). `ConditionKind` is the exported key-ish type.
- **A7 — Native `<select>` for the condition kind.** Matches transition-editor's
  `KeywordSelect`; avoids adding a shadcn `select` dependency. Registry deps stay
  `ridiculous-type-kit`, `button`, `popover`, `input`.
- **A8 — Default seed branch.** A fresh branch defaults to
  `media(width >= 600px): …` for media, `supports(display: grid): …` for
  supports, `style(--x: 1): …` for style, and a non-empty placeholder value, so
  the produced string is immediately valid.
- **A9 — Canonical format.** `formatIf` emits `if( b1; b2; … )` — one space
  after `(`, one before `)`, `"; "` between branches, `kind(condition): value`
  (or `else: value`) per branch. Round-trips through `parseIf`.
- **A10 — State is `{ branches: IfBranch[] }`.** An object wrapper (not a bare
  array) for forward-compat and to read as a "state" object like the other
  components; the per-branch `kind` is the discriminant.
- **A11 — `IfBranch` is a flat record, not a kind-discriminated union.** All
  three kinds share the same `{ kind; condition; value }` shape (only `else`
  leaves `condition` empty), so a flat interface is simpler than a union and the
  UI maps over it uniformly. The "discriminated-union" contract wording is
  satisfied by `kind` being a literal-union discriminant on the record.

---

## 9. Risks

- **Compile budget.** Mitigated by lenient bodies (A1) + linear fold (§7). The
  splitters are the same char-walk technique already shipping in the kit.
- **First-colon vs `style(--x: 1)`.** Mitigated by the depth-aware
  `SplitFirstColonTopLevel` (A3) — covered by a dedicated type-test + parse test.
- **Browser support.** `if()` is 2025-cutting-edge; the preview + examples carry
  an explicit caption. The component still produces a valid string everywhere.
