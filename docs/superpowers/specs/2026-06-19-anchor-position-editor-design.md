# anchor-position-editor — Design Spec

**Date:** 2026-06-19
**Status:** Draft for implementation
**Type:** Per-component design spec (scoped by the roadmap spec §5; promotes the §2.2 stretch-bench "anchor positioning" item)
**Component:** `anchor-position-editor` — edits CSS **anchor-positioning** values: `position-area`, `anchor()` / `anchor-size()` inset/size expressions, and `position-try-fallbacks` chains.
**Authoring mode:** Delegated. Every judgement call recorded in §11 (Assumptions). No clarifying questions asked.

---

## 1. What it is

`anchor-position-editor` is a controlled editor for one of three CSS anchor-positioning value strings, selected by a `mode?: "position-area" | "anchor" | "position-try"` prop (default `"position-area"`):

- **`position-area`** — the value of the `position-area` property: one or two keywords from the position-area vocabulary (e.g. `block-start span-inline-end`, `top center`, `center`). The visual hero is a clickable **3×3 placement grid** that maps the anchor-relative cells to the keyword pair.
- **`anchor`** — an inset-property value containing an `anchor()` or `anchor-size()` function (e.g. `anchor(--btn bottom)`, `anchor(top, 8px)`, `anchor-size(--btn width)`). Built with a name input + side `<select>` + optional fallback length.
- **`position-try`** — a `position-try-fallbacks` value: a comma list of try-fallbacks, each `none` | a `<position-area>` | a `<dashed-ident>` and/or a `<try-tactic>` (`flip-block`/`flip-inline`/`flip-start`). Edited as a reorderable chip chain.

The namesake — *ridiculously precise template-literal types* — lands on the **cross-axis grammar**: the strict tier validates that a `position-area` pair never puts two keywords on the same axis and never mixes the physical and logical coordinate systems; that an `anchor()` side keyword is legal and its optional fallback is a `<length-percentage>`; and that every try-fallback is well-formed. It is the **coupled-keyword-grid** component (the positional-tuple constraint is new to the registry — no existing component rejects a *pair* of tokens for sharing an axis).

It reuses the keyword-table + tier approach proven by `query-builder`, the clickable-cell-grid UI proven by `grid-builder`'s areas painter, and `unit-input` for the `anchor()` fallback length.

### 1.1 Grammar (the dialects this validates)

```
position-area mode  (value of `position-area`):
  <position-area> = <pa-keyword> [ <pa-keyword> ]?          (1 or 2 keywords)
  cross-rule: the two keywords MUST be on different axes of the SAME
              coordinate system; physical (top/left/…) and logical
              (block-/inline-) MUST NOT mix; center & span-all are
              system-neutral (pair with anything).

anchor mode  (value of an inset property: top/left/right/bottom/inset-*):
  <anchor-value> = anchor( [<dashed-ident>]? <anchor-side> [, <length-percentage>]? )
                 | anchor-size( [<dashed-ident>]? <anchor-size> [, <length-percentage>]? )
  <anchor-side>  = top | left | right | bottom | start | end | self-start
                 | self-end | center | inside | outside | <percentage>
  <anchor-size>  = width | height | block | inline | self-block | self-inline

position-try mode  (value of `position-try-fallbacks`):
  <fallbacks>    = <try-fallback> [ , <try-fallback> ]*
  <try-fallback> = none
                 | <position-area>
                 | [ <dashed-ident> || <try-tactic> ]
  <try-tactic>   = flip-block | flip-inline | flip-start
```

### 1.2 Examples (strict tier)

```ts
// position-area — accepted
cssPositionArea("top left")
cssPositionArea("block-start span-inline-end")
cssPositionArea("center")
cssPositionArea("span-all center")
// position-area — rejected (→ never)
cssPositionArea("top bottom")          // both on the y axis
cssPositionArea("left block-start")    // mixes physical + logical
cssPositionArea("nowhere")             // unknown keyword

// anchor — accepted
cssAnchor("anchor(--btn bottom)")
cssAnchor("anchor(top, 8px)")
cssAnchor("anchor-size(--btn width)")
cssAnchor("anchor(50%)")
// anchor — rejected
cssAnchor("anchor(--btn diagonal)")    // not an anchor-side keyword
cssAnchor("anchor-size(--btn red)")    // not an anchor-size keyword
cssAnchor("anchor(top, red)")          // fallback must be <length-percentage>

// position-try — accepted
cssPositionTry("--fallback, flip-block")
cssPositionTry("flip-block flip-inline")
cssPositionTry("top, none, --a flip-start")
// position-try — rejected
cssPositionTry("flip-diagonal")        // not a try-tactic
cssPositionTry("top bottom")           // an embedded position-area that shares an axis
```

---

## 2. Three-tier typing model (roadmap §5.2)

1. **Casual** — `value: string`. No validation; runtime parser still drives the UI.
2. **IntelliSense** — `AnchorStringMap` keyed by mode (`PositionAreaString`, `AnchorString`, `PositionTryString`), each permissive (`… | (string & {})`); the union `AnchorPositionString` is the casual `onChange` return.
3. **Strict** — `PositionAreaLiteral<S>`, `AnchorLiteral<S>`, `PositionTryLiteral<S>` validators + call-site helpers `cssPositionArea` / `cssAnchor` / `cssPositionTry` resolving invalid input to `never`.

---

## 3. Strict-tier design (the namesake)

Built entirely on `ridiculous-type-kit`. Three validators; the position-area cross-axis rule is the spectacle.

### 3.1 `PositionAreaLiteral<S>`

```
PositionAreaLiteral<S> =
  SplitBySpace<Trim<S>>  →  [K1] | [K1, K2]   (reject 0 or >2 tokens)
  → each token must be a known PaKeyword (membership in the keyword union)
  → AxisOf<K>: classify each into  "x" | "y" | "block" | "inline" | "neutral"
       physical x : left,right,span-left,span-right,x-start,x-end,x-self-start,x-self-end + span- variants
       physical y : top,bottom,span-top,span-bottom,y-start,y-end,y-self-start,y-self-end + span- variants
       logical bl : block-start,block-end,span-block-start,span-block-end
       logical in : inline-start,inline-end,span-inline-start,span-inline-end
       neutral    : center, span-all, start, end, self-start, self-end, span-start, span-end
  → single token → accept (the other axis spans implicitly)
  → pair [A,B] → Compatible<AxisOf A, AxisOf B>:
       neutral with anything            → ok
       x with y                         → ok        (both physical)
       block with inline                → ok        (both logical)
       same axis (x+x, y+y, bl+bl, in+in) → never
       physical with logical (x|y + bl|in) → never  (system mix)
```

`AxisOf` is a conditional-type lookup over the keyword union (one `extends` ladder, like `transform-builder`'s function dispatch). `Compatible` is a bounded 5×5 tag check. The `start/end/self-start/self-end` "ambiguous" keywords are tagged `neutral` (lenient — see §3.4 A-deferral), so any pair containing them is accepted.

### 3.2 `AnchorLiteral<S>`

```
AnchorLiteral<S> =
  ParseFunction<Trim<S>>  →  { name; args }
  name ∈ { "anchor", "anchor-size" }   (else never)
  SplitByComma<args> → [Head] | [Head, Fallback]   (reject >2)
  Fallback (if present) must be IsLength | IsPercentage      (else never)
  Head = SplitBySpace<Head> → [Side] | [Name, Side]
      Name (if present) must StartsWith<Name, "--">           (lenient ident check)
      Side ∈ AnchorSideKeyword (for "anchor") | AnchorSizeKeyword (for "anchor-size")
           | (anchor only) IsPercentage<Side>
```

### 3.3 `PositionTryLiteral<S>`

```
PositionTryLiteral<S> =
  SplitByComma<Trim<S>> → fallbacks (≥1)
  each fallback:
    "none"                                  → ok
    SplitBySpace → tokens
      all tokens ∈ TryTactic ∪ dashed-ident(StartsWith "--")  → ok  (the `<dashed-ident> || <try-tactic>` arm)
      else interpret the whole fallback as a <position-area> → PositionAreaLiteral
```

### 3.4 Validated vs deferred (explicit boundary)

**Validates:** keyword membership; the position-area cross-axis + system-mix rule for *physical/logical* keyword pairs; `anchor()`/`anchor-size()` function name, side/size keyword, and `<length-percentage>` fallback dimension; try-fallback well-formedness.

**Defers (lenient):**
1. **Ambiguous `start/end/self-start/self-end`** are tagged `neutral`, so `start end` (technically two axis-agnostic tokens) is accepted without checking they resolve to different axes. (Their axis depends on writing-mode — undecidable at type level.) Documented A6.
2. **`<dashed-ident>` validity** — only the `--` prefix is checked, not the full custom-ident grammar (matches how other components treat idents leniently).
3. **`calc()`/`var()`/`env()`** anchor fallbacks → `never` in strict (undecidable dimension); accepted by casual + runtime.
4. **Order/duplication** in the `<dashed-ident> || <try-tactic>` arm (e.g. two tactics, or tactic-before-name) is accepted leniently.
5. **`anchor-size` second arg** and `inside`/`outside` anchor sides are accepted but their property-context legality (which property the value lands in) is **not** cross-checked — the component edits the value in isolation.
6. **`@position-try` at-rule** and `position-try-order` / `position-visibility` are **out of strict scope** (the component edits the three value grammars above). `position-try-order` keywords appear only as a non-validated convenience in the position-try UI footer. Documented A7.

This boundary is the contract; §8 type-tests assert both sides.

---

## 4. Runtime helpers (`anchor-position-editor.helpers.ts`)

Pure parse/format — the superset (parses structure, no keyword gating beyond what the UI needs to round-trip).

- `parsePositionArea(src): { keywords: string[]; error: string | null }`
- `parseAnchor(src): AnchorExpr | null` — `{ fn: "anchor" | "anchor-size"; name?: string; side: string; fallback?: string }`
- `parsePositionTry(src): TryFallback[]` — each `{ kind: "none" | "area" | "tactics"; area?: string; idents?: string[]; tactics?: string[] }`
- `formatPositionArea`, `formatAnchor`, `formatPositionTry` — canonical re-serialization.
- `axisOf(keyword): "x" | "y" | "block" | "inline" | "neutral" | "unknown"` — runtime mirror of the type `AxisOf`.
- `areCompatible(a, b): boolean` — runtime mirror of `Compatible`.
- `positionAreaKeywords(): readonly string[]`, `anchorSides()`, `anchorSizes()`, `tryTactics()` — `<select>` option sources.
- `cellToKeywords(row, col): [string, string]` and `keywordsToCell(keywords): { row; col } | null` — the 3×3 grid ⇄ keyword-pair mapping (physical default).
- `defaultFor(mode): string` — seed value per mode.

One shared `KEYWORD_TABLE` data structure feeds both the runtime `axisOf` and is documented as the same source as the type `AxisOf` (separately authored, reviewed together — the query-builder precedent).

## 4.1 The 3×3 grid ⇄ keyword mapping

The grid is anchor-relative: 9 cells around (and over) the mock anchor. Physical default keyword pairs:

```
            left              center            right
  top    [top left]        [top center]       [top right]
  center [center left]     [center]           [center right]
  bottom [bottom left]     [bottom center]    [bottom right]
```

`[center]` (the middle cell) serializes to the single keyword `center`. `span-*` reach is a secondary control: a "span" toggle on a chosen cell switches the emitted axis keyword to its `span-` form (e.g. clicking `top` with span on → `span-top`). The grid edits the **physical** system; a "logical" switch in the panel header swaps the vocabulary to `block-/inline-` for the same cells (so the same 3×3 emits `block-start inline-start`, etc.). Logical/physical is a UI toggle, never mixed in one value (guaranteeing the cross-axis type rule by construction).

---

## 5. Component (`anchor-position-editor.tsx`)

Controlled `value` + `onChange` + `mode`. Mirrors `query-builder.tsx`.

**Top-level exports:** `AnchorPositionEditor` (popover-wrapped: `<Button>` trigger showing the mode badge + truncated value, `<Popover>` → `AnchorPositionEditorPanel`) and `AnchorPositionEditorPanel` (inline).

**Sub-components (named exports):**
- `PositionAreaGrid` — the 3×3 clickable grid (cells are `<button>`s); a logical/physical toggle and a span toggle; a live mini-preview that snaps a positioned box to the chosen cell around a mock anchor. Modeled on `grid-builder`'s `AreasPainter`.
- `AnchorExprFields` — name `<input>` (optional, `--`), function `<select>` (`anchor`/`anchor-size`), side/size `<select>` (options swap with the function), optional fallback `unit-input`.
- `TryFallbackChain` — a reorderable list of fallback chips; each chip is `none` | a mini position-area picker | ident+tactic selects. Add/remove/reorder (move up/down buttons; no drag-drop dep).
- `MiniSelect` — the local compact `<select>` chrome (copied from the query-builder convention; per registry self-containment memory, each component owns its copy — do NOT import query-builder's).
- `AnchorPreview` — the live mock-anchor + positioned-box preview (position-area mode); degrades to a static diagram with a support note when the browser lacks anchor positioning (mirrors `if-function`'s support note).
- `LiveString` — the produced value in a `<code>`.

**State model.** Per mode: position-area holds `{ system: "physical" | "logical"; span: boolean; row; col }`; anchor holds the `AnchorExpr`; position-try holds `TryFallback[]`. `commit` serializes + calls `onChange`, guarded by `lastEmittedRef` (query-builder precedent). Resync from external `value`/`mode` via `useEffect`.

a11y: grid cells are labelled buttons with `aria-pressed`; selects/inputs labelled; preview is `aria-hidden` decorative or `role="img"` with a label.

---

## 6. Demo, registry, navigation

- **Page:** `src/pages/anchor-position-editor/page.tsx` (mirrors query-builder; intro covers the mode prop, the cross-axis rule, the validated/deferred boundary). **Route:** add to `src/routes.tsx`.
- **Examples** (`src/examples/anchor-position-editor/`): `basic-usage`, `tier-casual`, `tier-intellisense`, `tier-strict`, `api-reference`, plus **`placement-grid`** (the hero: the 3×3 grid emitting `position-area` with the logical/physical + span toggles and the live snap preview).
- **Registry:** add an `anchor-position-editor` item to `registry.json` — `type: registry:ui`; `registryDependencies`: `ridiculous-type-kit`, `unit-input`, `button`, `popover`, `input`, `label`. Files = index + tsx + types + helpers + the sub-component tsx files. Append its `.json` URL to the `all` bundle's `registryDependencies`. (`public/r/*` is gitignored — only `registry.json` is committed.)
- **Nav:** `pnpm nav:build` (auto via predev/prebuild/pretypecheck).
- **Coverage:** add `src/components/ui/anchor-position-editor/**` to `vitest.config.ts` `coverage.include`.

---

## 7. Testing (roadmap §5.5)

- **`tests/anchor-position-editor-types.test-d.ts`** (primary gate). Accept + `@ts-expect-error` reject for: position-area single/pair, the cross-axis rejections (`top bottom`, `left block-start`), unknown keyword; anchor fn name / side / size / fallback dimension; position-try tactics, embedded position-area, dashed-ident arm; call-site helper return types; `AnchorPositionMode`, `KeywordsOf<S>`, suggestion unions + `AnchorStringMap`.
- **`tests/anchor-position-editor-parse.test.ts`** — `parsePositionArea`, `parseAnchor`, `parsePositionTry`, `axisOf`, `areCompatible`, `cellToKeywords`/`keywordsToCell`, option sources, `defaultFor`.
- **`tests/anchor-position-editor-format.test.ts`** — `format*` round-trips; canonical serialization (`center` single, `block-start inline-start`, `anchor(--btn bottom, 8px)`, `--a flip-block, none`).
- **`tests/anchor-position-editor.test.tsx`** (jsdom + canvas mock) — panel renders per mode; grid-cell click emits the keyword pair; logical/physical + span toggles change output; anchor fields emit `anchor(...)`; try-chain add/remove/reorder; popover trigger summary. (No `matchMedia`/anchor support in jsdom — preview guards + degrades; tests assert the degraded path.)
- **Coverage:** thresholds stay 90/85/90/90.

---

## 8. File layout (deliverables)

```
src/components/ui/anchor-position-editor/
  index.ts
  anchor-position-editor.tsx
  anchor-position-editor.types.ts
  anchor-position-editor.helpers.ts
  position-area-grid.tsx
  anchor-expr-fields.tsx
  try-fallback-chain.tsx
  anchor-preview.tsx
  mini-select.tsx
src/pages/anchor-position-editor/page.tsx
src/examples/anchor-position-editor/{basic-usage,tier-casual,tier-intellisense,
  tier-strict,api-reference,placement-grid}.tsx
tests/{anchor-position-editor-types.test-d.ts, anchor-position-editor-parse.test.ts,
  anchor-position-editor-format.test.ts, anchor-position-editor.test.tsx}
```

Modified: `registry.json` (item + bundle URL), `src/routes.tsx` (page route), `vitest.config.ts` (coverage path), `@/generated/nav` (via `nav:build`).

---

## 9. Type surface (exports from `anchor-position-editor.types.ts`)

- **Validators:** `PositionAreaLiteral<S>`, `AnchorLiteral<S>`, `PositionTryLiteral<S>`.
- **Call-site helpers:** `cssPositionArea`, `cssAnchor`, `cssPositionTry`.
- **Suggestion strings:** `PositionAreaString`, `AnchorString`, `PositionTryString`, `AnchorPositionString` (union), `AnchorStringMap` (keyed by `AnchorPositionMode`), `AnchorPositionMode`.
- **Keyword unions:** `PaKeyword`, `AnchorSideKeyword`, `AnchorSizeKeyword`, `TryTactic`, `PositionAxis` (`"x"|"y"|"block"|"inline"|"neutral"`).
- **Utility types:** `KeywordsOf<S>` (the keyword tuple in a position-area), `AxisOf<K>`.
- **Internal state (exported):** `AnchorExpr`, `TryFallback`, `PositionAreaState`.

---

## 10. Component API conventions (roadmap §5.6)

Controlled-only `value` + `onChange`; `AnchorPositionEditor` + `AnchorPositionEditorPanel` two-export split; sub-components named-exported; keyboard + a11y parity.

---

## 11. Assumptions (delegated decisions — review checkpoint)

- **A1 — `mode` default `"position-area"`.** It is the visual hero (the 3×3 grid) and the strongest type showcase (the cross-axis rule). The other two modes are opt-in.
- **A2 — Three validators, not one `AnchorLiteral<S, Mode>`.** Mirrors `cssMediaQuery`/`cssContainerQuery`. Three `cssX` helpers read cleaner than a mode type-arg.
- **A3 — Known-keyword whitelist in strict; unknown → `never`.** Same contract as query-builder A3: strict gates the known set, casual/runtime accept exotic.
- **A4 — `position-area` keyword set is the solid common set** (physical x/y + their `span-` forms, logical block/inline + `span-`, `center`, `span-all`, and the ambiguous `start/end/self-start/self-end`). The rarer `x-self-start`/`y-self-end` self-coordinate forms are included in the union but treated structurally like their non-self siblings (axis tag by prefix). Not exhaustive — "a solid KNOWN set."
- **A5 — The cross-axis rule rejects same-axis and physical↔logical pairs; `center`/`span-all` are neutral.** This is the spectacle and the genuinely-new positional-tuple constraint.
- **A6 — `start/end/self-start/self-end` tagged `neutral` (lenient).** Their real axis depends on writing-mode and is undecidable at the type level, so any pair containing them is accepted. The runtime `areCompatible` matches.
- **A7 — `@position-try` at-rule, `position-try-order`, `position-visibility` are OUT of strict scope.** The component edits the three value grammars; `position-try-order` shows as a non-validated UI convenience only.
- **A8 — The grid edits ONE coordinate system at a time** (a physical/logical header toggle), guaranteeing the cross-axis rule by construction in the UI; the *types* enforce it for arbitrary hand-written strings.
- **A9 — `anchor()` fallback restricted to `<length-percentage>` in strict;** `calc()`/`var()` are casual-tier (undecidable). Reuses `unit-input` for the length.
- **A10 — `<dashed-ident>` checked by `--` prefix only** (lenient ident grammar), matching the repo's existing ident leniency.
- **A11 — No drag-and-drop dependency for the try-chain;** reorder via up/down buttons (keeps the dep set minimal per roadmap §4.2).
- **A12 — Each component owns its `mini-select.tsx` copy** (registry self-containment — do not import query-builder's), per the user's recorded preference.

---

## 12. Risks

- **Type budget.** `AxisOf` over a ~30-member keyword union + the 5×5 `Compatible` check + three validators. Bounded: the keyword union is flat, `AxisOf` is a single `extends` ladder, `Compatible` is a constant lookup, `SplitBySpace`/`SplitByComma`/`ParseFunction` are the proven kit combinators. No deep recursion. Watch `tsc` wall-time; if it spikes, shrink the `span-`/self- keyword set first.
- **Keyword-table drift (type vs runtime).** Two authorings of `AxisOf`. Mitigation: adjacent `KEYWORD_TABLE`, reviewed together; the same example keywords appear in both the type-test and the parse-test, so drift fails a test.
- **No anchor positioning in jsdom (or older browsers).** The preview guards (`CSS.supports("position-area: center")`) and degrades to a static diagram with a support note; tests assert the degraded path.
