# font-editor — Design Spec

**Date:** 2026-05-29
**Phase:** 8 of 11 (per `2026-05-29-ridiculous-component-roadmap-design.md`)
**Status:** Design — autonomous (human asleep; all calls made here, recorded in §Assumptions)
**Component:** `font-editor` — edits the CSS `font` shorthand.

---

## 1. What it is

A controlled (`value` + `onChange`) editor for the CSS `font` shorthand property. The shorthand is the most order-sensitive of the common shorthands:

```
font: [ <style> || <variant> || <weight> || <stretch> ]? <size> [ / <line-height> ]? <family>#
```

…or a single **system-font keyword** (`caption | icon | menu | message-box | small-caption | status-bar`) as the *whole* value.

The "ridiculous" tier is a **strict ordered parse**: the prefix tokens are order-free but each kind appears at most once; `<size>` is mandatory and must precede the family; `/ <line-height>` is optional and attaches to the size; `<family>` is a mandatory comma-separated list and ends the value. Any violation (missing size, missing family, duplicate prefix kind, token after the family, bad `/lh` placement) resolves to `never`. This ordered-grammar parse — not a flat function list — is the distinguishing spectacle of this component (contrast Phase 2/3's order-free function-list dispatch).

This phase is **standalone** (roadmap §3: "Ordered-optional parse; standalone"). It does not reuse color-picker; it reuses `ridiculous-type-kit` and (in the runtime/UI) `unit-input`.

---

## 2. Three-tier typing model (contract §5.2)

1. **Casual** — `value: FontString | (string & {})`; plain `string` accepted. The runtime parser handles anything (incl. `var()`, weird spacing). No compile-time validation.
2. **IntelliSense** — `FontString` suggestion union (`onChange` return type). Because the shorthand always ends in a font-family token after a size, a precise template-literal union is impractical; `FontString` is `` `${string} ${string}` `` shaped via the system keywords plus an open `` `${string}` `` family tail — see §4.4 for the exact pragmatic shape. It is exported and is the `onChange` return type.
3. **Strict** — `FontLiteral<S>` full ordered-parse validator + call-site helper `cssFont(value)`. Invalid → `never`.

---

## 3. Component API (contract §5.6)

Mirrors transform-builder / easing-picker precedent exactly.

- `<FontEditor>` — popover-wrapped trigger + panel. Props: `value`, `onChange`, `className?`, `aria-label?`.
- `<FontEditorPanel>` — the same editor inline. Same props.
- Exported sub-components (named, for composition):
  - `<FontPreview>` — live text preview: sample text rendered with the built `font` shorthand applied (`style={{ font: value }}`). Editable sample-text field. **This is the live text-preview deliverable.** No browser tooling — a React element rendering text with the shorthand.
  - `<PropertyField>` — one labelled control row (used internally; exported for composition).
  - `<FamilyEditor>` — the comma-separated family-list editor (add/remove/reorder family tokens; a small web-safe + generic family list).
- Controlled only. `value` is required.
- `onChange` emits the canonical re-serialized `FontString`.

---

## 4. Type surface (`font-editor.types.ts`)

Built entirely on `@/lib/ridiculous-type-kit`. Structure mirrors `transform-builder.types.ts`:
kit imports → token classifiers → ordered-parse state machine → `FontLiteral` + `cssFont` → suggestion strings → utility types → internal discriminated-union state.

### 4.1 Token classifiers (the prefix kinds)

Each is a boolean predicate over a trimmed token:

- `IsFontStyle<T>` — `normal | italic | oblique` (we do **not** validate `oblique <angle>` at the strict tier — see §6 deferrals; runtime accepts `oblique` only as a single token too).
- `IsFontVariant<T>` — `normal | small-caps`.
- `IsFontWeight<T>` — `normal | bold | bolder | lighter | <number 1–1000>`. The numeric branch uses `IsNumber<T>` from the kit (any number is accepted; the 1–1000 bound is **weak-validated** — documented).
- `IsFontStretch<T>` — `ultra-condensed | extra-condensed | condensed | semi-condensed | normal | semi-expanded | expanded | extra-expanded | ultra-expanded | <percentage>`.
- `IsFontSize<T>` — `xx-small | x-small | small | medium | large | x-large | xx-large | xxx-large | larger | smaller | <length> | <percentage>` (length/percentage via kit `IsLength` / `IsPercentage`).
- `IsLineHeight<T>` — `normal | <number> | <length> | <percentage>`.
- `IsFamilyToken<T>` — one family token: a generic family keyword (`serif | sans-serif | monospace | cursive | fantasy | system-ui | ui-serif | ui-sans-serif | ui-monospace | ui-rounded`), OR a quoted string (`'...'` / `"..."` — weak: any content between matching quotes), OR a bare `<custom-ident>` (weak-validated: ident-safe = made of letters, digits, `-`, `_`, and spaces; first char a letter/`_`/`-`). Documented weak-validation.

`normal` is intentionally a member of style, variant, weight, **and** line-height. The strict parser's ambiguity rule: a leading `normal` is consumed as a *prefix* token occupying the first still-free prefix kind among {style, variant, weight, stretch} (in that priority order). This matches CSS's own resolution that `normal` in the prefix is harmless; it never blocks a later distinct token because each `normal` only consumes one free slot. (Documented; see §6.)

### 4.2 Ordered-parse state machine

The namesake. A tail-recursive walk over `SplitBySpace<Trim<S>>` with a 4-bit "used" accumulator for the prefix kinds.

```
ParsePrefix<Tokens, Used> :
  - if Tokens is empty            → never (no size encountered → invalid)
  - let H = head, T = tail
  - if H classifies as a still-FREE prefix kind (style|variant|weight|stretch,
        first-free-wins for `normal`)        → ParsePrefix<T, Used + that kind>
  - else (H is not a free prefix kind)        → ParseSizeAndRest<Tokens>   // H must be the size
```

```
ParseSizeAndRest<Tokens> :
  - H = head, T = tail
  - H may be "size", "size/lh", or "size" with lh as the next token:
      * if H = `${Sz}/${Lh}`  and IsFontSize<Sz> and IsLineHeight<Lh>  → ParseFamily<T>
      * else if IsFontSize<H>:
          - if T head = `/${Lh}` (attached-slash spaced form) and IsLineHeight<Lh> → ParseFamily<tail of T>
          - else if T = ["/", Lh, ...rest] (fully spaced `size / lh`) and IsLineHeight<Lh> → ParseFamily<rest>
          - else → ParseFamily<T>          // no line-height
      * else → never                        // mandatory size missing/invalid
```

```
ParseFamily<Tokens> :
  - the family is a COMMA-separated list. But SplitBySpace already split on
    spaces, so a multi-word family ("Times New Roman") spans several tokens.
  - Strategy: REJOIN the remaining tokens with spaces back into one string,
    then SplitByComma, then every comma-segment must IsFamilyToken (a segment
    may itself be multi-word: "Times New Roman" → ident-safe allows spaces).
  - empty family list → never (family is mandatory)
  - all segments valid → the whole literal S ; else never
```

`FontLiteral<S>`:
```
FontLiteral<S> =
  Trim<S> extends SystemFontKeyword ? S
  : Trim<S> extends "" ? never
  : SplitBySpace<Trim<S>> extends infer Toks extends string[]
      ? Toks extends [] ? never
        : ParsePrefix<Toks, EmptyUsed> extends true ? S : never
      : never
```
(The parse helpers return `true`/`never`-equivalent booleans threaded so the top type collapses to `S | never`. Implementation detail: the inner helpers return `true | false`; `FontLiteral` does `KeepIf`-style `extends true ? S : never`.)

**Compile-budget control (risk §7):** the prefix accumulator caps at 4 tokens (4 kinds); a 5th unclassifiable token forces the size branch. The family rejoin is a bounded fold. No unbounded recursion. The strict tier defers: `oblique <angle>`, `<number>` weight range 1–1000, font-family `<custom-ident>` full CSS grammar (we allow ident-safe), and `var()`/`calc()` anywhere (→ `never`; runtime accepts). All deferrals documented in `api-reference` strict-scope section.

### 4.3 Call-site helper

```ts
export const cssFont = <S extends string>(value: S & FontLiteral<S>): S => value
```
Mirrors `cssTransform` / `easing` / `color`.

### 4.4 Suggestion strings + map

- `SystemFontKeyword` = the 6 system keywords union.
- `FontGenericFamily` = the 10 generic family keywords union.
- `FontString` — the IntelliSense/`onChange` union. Pragmatic shape:
  `` SystemFontKeyword | `${string} ${string}` `` (a size+family always contains at least one space). This keeps autocomplete useful (system keywords surface) while accepting any well-formed shorthand. Documented as deliberately loose at the IntelliSense tier — strictness lives in `FontLiteral`.
- `FontStringMap` interface keyed by a small set of representative shapes (e.g. `system`, `sizeFamily`, `full`) → string template — mirrors `TransformStringMap` convention (a map + key type for the contract's "…StringMap interface + mode/basis key type"). Key type `FontStringKey = keyof FontStringMap`.

### 4.5 Utility types

- `IsSystemFont<S>` — `true` if `Trim<S>` is a system keyword.
- `FamiliesOf<S>` — tuple of the family tokens (comma segments) in a font string; `[]` for a system keyword or unparseable.
- `SizeOf<S>` — the size token (string) of a font shorthand, or `never`.
- `LineHeightOf<S>` — the line-height token, or `never` when absent.

### 4.6 Internal state (exported discriminated union)

```ts
export type FontParts =
  | { kind: "system"; keyword: SystemFontKeyword }
  | {
      kind: "shorthand"
      style?: string        // normal|italic|oblique  (undefined = omitted)
      variant?: string      // normal|small-caps
      weight?: string       // normal|bold|…|<number>
      stretch?: string      // …-condensed/-expanded|normal|<percentage>
      size: string          // mandatory
      lineHeight?: string    // optional
      family: string[]       // mandatory, ≥1, each a family token (may be multi-word/quoted)
    }
```
Exported for advanced use (custom serialization, programmatic build), mirroring `TransformItem`.

---

## 5. Runtime helpers (`font-editor.helpers.ts`)

The runtime is the **superset** of the strict tier: tolerates `var()` and arbitrary spacing, does the full ordered parse, validates structure (size + family mandatory; ≤1 of each prefix kind), and drives the UI.

- `parseFont(src: string): FontParts | null` — string → `FontParts`, or `null` on structural error (missing size, missing family, duplicate prefix kind, junk). System keyword → `{ kind: "system", … }`.
- `formatFont(parts: FontParts): string` — canonical re-serialization. Order: `style variant weight stretch size[/lh] family`. System → the keyword. Omitted prefix fields dropped. Family joined with `, `.
- `fontFamilies(src: string): string[]` — runtime mirror of `FamiliesOf`.
- `defaultParts(): FontParts` — a sensible seed (`{ kind: "shorthand", size: "16px", family: ["sans-serif"] }`).
- Classifier helpers used by the UI: `classifyStyle/Variant/Weight/Stretch/Size/LineHeight/Family` (the runtime mirror of the type predicates), plus option-list constants (`FONT_STYLES`, `FONT_VARIANTS`, `FONT_WEIGHTS`, `FONT_STRETCHES`, `ABSOLUTE_SIZES`, `GENERIC_FAMILIES`, `WEB_SAFE_FAMILIES`).
- `ParseResult` facade (`{ parts; error }`), mirroring transform-builder.

Paren/quote-aware top-level splitter (mirror of the kit combinator) for splitting the family list on commas at depth 0 (so a `var(--x, fallback)` arg doesn't get split).

---

## 6. Strict-tier scope (what `FontLiteral` validates vs. defers)

**Validates:**
- System-font keyword as a whole value.
- The full ordered grammar: order-free prefix (≤1 each of style/variant/weight/stretch) → mandatory `<size>` → optional `/ <line-height>` (attached `16px/1.5`, half-spaced `16px/ 1.5` / `16px /1.5`, fully spaced `16px / 1.5`) → mandatory `<font-family>` list.
- Rejection of: missing size, missing family, duplicate prefix kind, a token after the family that isn't a family token, line-height without a size, empty string, garbage.
- length/percentage via kit `IsLength`/`IsPercentage`; number weight via `IsNumber`.

**Defers (documented):**
- `oblique <angle>` — only bare `oblique` validates strictly (runtime also treats `oblique 10deg` as two… no: runtime keeps `oblique` only as style; an angle after it would be read as the size attempt and fail. Documented: use casual tier for `oblique <angle>`).
- `<number>` weight **range** 1–1000 — any number passes (weak). Out-of-range numbers are real CSS errors but not caught at compile time.
- `<font-family>` `<custom-ident>` full grammar — **weak-validated** as ident-safe (letters/digits/`-`/`_`/spaces; quoted strings accept any inner content). E.g. a family starting with a digit unquoted may pass the type but is invalid CSS. Documented.
- `var()` / `calc()` anywhere → `never` at the strict tier (undecidable). The runtime parser accepts them — use casual/IntelliSense.
- The `normal` ambiguity: a leading `normal` consumes the first free prefix kind (style→variant→weight→stretch). Multiple `normal`s consume successive free kinds. This is sound for acceptance (CSS treats prefix `normal` as a no-op) but means `FontLiteral` accepts e.g. `normal normal normal normal 16px serif` (4 normals = 4 kinds). Documented as intentional.

---

## 7. Demo, registry, navigation (contract §5.4)

- **MPA entry:** `pages/font-editor/{index.html, main.tsx}` (copy transform-builder's; swap titles/imports). Add to `vite.config.ts` `rollupOptions.input`.
- **Page:** `src/pages/font-editor/page.tsx` (Layout compact; SectionHeaders; examples grid).
- **Examples:** `src/examples/font-editor/{basic-usage, tier-casual, tier-intellisense, tier-strict, api-reference}.tsx` + `live-preview.tsx` (the live text-preview: sample text rendered with the built font; controls for style/variant/weight/stretch/size/line-height/family with a web-safe + generic family list).
- **Registry:** add `font-editor` item to `registry.json` (`type: registry:ui`; files = the 4 component files; `registryDependencies`: `ridiculous-type-kit`, `unit-input`, `button`, `popover`, `input`, `label`, `select`). Add `font-editor.json` to the `all` bundle's `registryDependencies`. `pnpm registry:build` regenerates `public/r/*.json` (gitignored — not committed).
- **Nav:** `pnpm nav:build` (regenerates `src/generated/nav.ts` from registry.json).

---

## 8. Testing (contract §5.5)

- `tests/font-editor-types.test-d.ts` — accept + reject. Coverage: full forms (all prefix kinds present), missing size, missing family, duplicate prefix kind, each system keyword, line-height attachment (all 4 spacings), prefix order-freedom, `FamiliesOf`/`SizeOf`/`LineHeightOf`/`IsSystemFont`, `FontString` suggestion membership, `FontParts` discrimination, component `onChange` return type.
- `tests/font-editor-parse.test.ts` — `parseFont` (full forms, system keyword, missing size/family → null, duplicate kind → null, multi-word + quoted family, `var()` tolerance), `fontFamilies`, `defaultParts`, classifiers.
- `tests/font-editor-format.test.ts` — `formatFont` round-trips and canonical ordering; system keyword; omitted fields dropped; family join.
- `tests/font-editor.test.tsx` — jsdom render/interaction: panel renders the property fields, editing size/weight/family emits onChange, system-keyword mode, FontPreview applies the shorthand to sample text, popover trigger.
- **Coverage:** add `src/components/ui/font-editor/**` to `vitest.config.ts` `coverage.include`. Thresholds unchanged (90/85/90/90).

---

## 9. Files created

```
src/components/ui/font-editor/font-editor.tsx
src/components/ui/font-editor/font-editor.types.ts
src/components/ui/font-editor/font-editor.helpers.ts
src/components/ui/font-editor/index.ts
pages/font-editor/index.html
pages/font-editor/main.tsx
src/pages/font-editor/page.tsx
src/examples/font-editor/{basic-usage,tier-casual,tier-intellisense,tier-strict,api-reference,live-preview}.tsx
docs/superpowers/specs/2026-05-29-font-editor-design.md   (this file)
docs/superpowers/plans/2026-05-29-font-editor.md
tests/font-editor-types.test-d.ts
tests/font-editor-parse.test.ts
tests/font-editor-format.test.ts
tests/font-editor.test.tsx
```
Modified (append-only per task constraints): `registry.json`, `vite.config.ts` (MPA input), `vitest.config.ts` (coverage.include line), `src/generated/nav.ts` (via `nav:build`).

---

## Assumptions (every call made on the human's behalf)

1. **Branch base.** This worktree already contains Phase 7 (transition-editor) in `registry.json` / `vite.config.ts` / `vitest.config.ts`. I build Phase 8 on top; I do not touch Phase ≤7 entries except appending font-editor and adding it to the `all` bundle.
2. **Pattern source.** `transform-builder` is the closest complete 4-file precedent; I mirror its file structure, demo wiring, test layout, and registry shape. Differences are driven by the ordered-grammar (vs. flat function-list) nature of `font`.
3. **`normal` ambiguity → first-free-prefix-kind.** A leading `normal` consumes the first still-free kind among style→variant→weight→stretch. This is sound for *acceptance* and matches CSS treating prefix `normal` as a no-op. It means `FontLiteral` accepts redundant `normal`s. Recorded as intentional; runtime parser uses the same rule.
4. **Family `<custom-ident>` weak-validation.** Bare family idents are validated as ident-safe (letters/digits/`-`/`_`/spaces, first char letter/`_`/`-`); quoted strings accept any inner content. Full CSS custom-ident grammar (escapes, leading-digit rules) is out of scope at the strict tier — documented. Runtime is equally permissive.
5. **Weight number range 1–1000 weak-validated.** `IsNumber` passes any number; the 1–1000 bound is not enforced at compile time (consistent with the roadmap's "weak-validate the variadic/edge tail" guidance and `OklabLiteral` precedent).
6. **`oblique <angle>` deferred.** Only bare `oblique` validates strictly. `oblique 14deg` → use casual tier. Keeps the prefix classifier single-token and the compile budget low.
7. **`/line-height` spacings all accepted strictly.** `16px/1.5`, `16px/ 1.5`, `16px /1.5`, `16px / 1.5` all validate. The spec calls out the attached + spaced forms; I support every combination since `SplitBySpace` produces all of them as distinct token shapes.
8. **`var()`/`calc()` → `never` strictly, accepted at runtime.** Matches transform-builder's documented stance.
9. **IntelliSense `FontString` is deliberately loose** (`SystemFontKeyword | \`${string} ${string}\``). A precise template-literal union for "optional-prefix size /lh family-list" would be enormous and slow; strictness lives in `FontLiteral`. Documented in `api-reference`.
10. **Size editor UI.** Font-size accepts many unit kinds + absolute keywords, so the size control is a value-input + unit/keyword select (transform-builder `ArgEditor` style), not a single fixed-unit `UnitInput`. Line-height (a bare ratio) uses a numeric input. `unit-input` is declared as a `registryDependency` per the task and reused for the line-height numeric entry where a unit applies; documented if a different control proves cleaner during implementation.
11. **`select` shadcn base in registryDependencies.** The task lists `select` as an allowed base; I use native `<select>` elements in the component (matching transform-builder, which lists `slider` but uses native controls too) and still declare `select` for parity / future use, alongside `button`, `popover`, `input`, `label`.
12. **`xxx-large`** is included in absolute sizes (modern CSS); `larger`/`smaller` (relative) included per the task's size list.
13. **No new runtime deps.** Only `ridiculous-type-kit` (types) + existing shadcn primitives + `unit-input`.
14. **Caveman/process rules** (global CLAUDE.md) apply to my main-thread narration, not to code/commits/spec prose, which stay normal English.
