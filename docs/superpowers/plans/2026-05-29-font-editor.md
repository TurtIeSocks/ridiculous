# font-editor — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-05-29-font-editor-design.md`
**Approach:** TDD. Type-level tests first (the validator is the product), then runtime helpers, then component, then demo/registry/nav, then green `pnpm pr:check`.
**Commit cadence:** one commit per logical unit; every commit leaves the tree typecheck-clean.

---

## Task 1 — Strict type tier (`font-editor.types.ts`) + type tests

**Test first:** `tests/font-editor-types.test-d.ts` with `expectTypeOf` (vitest typecheck). Assert:

Accept:
- `FontLiteral<"16px serif">` → itself (minimal: size + family).
- `FontLiteral<"italic bold 16px/1.5 'Times New Roman', serif">` → itself.
- `FontLiteral<"italic small-caps bold ultra-condensed 16px/1.5 sans-serif">` → itself (all 4 prefix kinds).
- prefix order-freedom: `FontLiteral<"bold italic 16px serif">` and `FontLiteral<"italic bold 16px serif">` both kept.
- line-height spacings: `16px/1.5`, `16px/ 1.5`, `16px /1.5`, `16px / 1.5` (each with ` serif`) all kept.
- numeric weight + percentage stretch: `FontLiteral<"350 90% 16px serif">` kept.
- absolute size keyword: `FontLiteral<"x-large serif">` kept; `larger` kept.
- multi-word + quoted family: `FontLiteral<"16px Times New Roman, serif">`, `FontLiteral<"16px \"My Font\", monospace">` kept.
- each system keyword: `FontLiteral<"caption">` … `FontLiteral<"status-bar">` → itself.

Reject (`toBeNever`):
- missing family: `FontLiteral<"16px">`.
- missing size: `FontLiteral<"italic bold serif">` (no size token → never; `serif` is family but no size precedes — parser hits family-classifiable token in size position → never).
- duplicate prefix kind: `FontLiteral<"italic oblique 16px serif">` (two styles), `FontLiteral<"bold 700 16px serif">` (two weights).
- empty: `FontLiteral<"">`.
- line-height without size: `FontLiteral<"/1.5 serif">`.
- garbage: `FontLiteral<"wat 16px serif">`? — `wat` is NOT a prefix kind and NOT…wait `wat` would be read as size attempt → never. Good. Also `FontLiteral<"16px serif extra">` where `extra` is a 2nd comma-less family token after a generic — actually space-separated trailing tokens fold into the family rejoin and `serif extra` is one ident-safe segment, so KEEP. Instead test `FontLiteral<"16px serif, 123abc">`? leading-digit unquoted → ident-safe first-char rule rejects → never. Use a clear reject: `FontLiteral<"16px 'unterminated, serif">` (quote handling) OR simpler `FontLiteral<"16px">` covers missing family; for "token after family" rely on the size-position never. Keep reject set crisp; do not over-test weak-validation edges.
- `var()` strict: `cssFont("var(--f)")` → `@ts-expect-error`.

Utility types: `FamiliesOf`, `SizeOf`, `LineHeightOf`, `IsSystemFont`. Suggestion: `FontString` membership (`"caption"`, `"16px serif"`). State: `FontParts` discrimination. `cssFont` call-site (`@ts-expect-error` on `"16px"` missing family, on duplicate kind).

**Implement** `font-editor.types.ts`:
- Import from kit: `IsLength, IsPercentage, IsNumber, SplitBySpace, SplitByComma, Trim, And, Or, StartsWith` (+ any needed).
- `SystemFontKeyword`, `FontGenericFamily` unions.
- Token classifiers `IsFontStyle/Variant/Weight/Stretch/Size/LineHeight/FamilyToken` (boolean). FamilyToken: generic OR quoted OR ident-safe. Ident-safe = `AllChars<Body, IdentChar>` with a first-char letter/`_`/`-` guard; `IdentChar = letters | Digit | "-" | "_" | " "`. (Define a letters union once.)
- `Used` accumulator as a record-of-bools or a 4-tuple of `0|1`; simplest: an object type `{ s: boolean; v: boolean; w: boolean; t: boolean }` and `ClassifyFree<H, Used>` returns `{ ok: true; used: NextUsed } | { ok: false }`. To stay simple and fast, prefer the 4-flag object updated positionally.
- `ParsePrefix<Tokens, Used>`, `ParseSizeAndRest<Tokens>`, `ParseFamily<Tokens>` per spec §4.2. ParseFamily rejoins remaining tokens with spaces (`Join<T, " ">`), `SplitByComma`, fold `IsFamilyToken` over non-empty segments; empty list → false.
- `FontLiteral<S>` per spec §4.2 (system keyword short-circuit; collapse to `S | never`).
- `cssFont`.
- `FontString`, `FontStringMap`, `FontStringKey`.
- `IsSystemFont`, `FamiliesOf`, `SizeOf`, `LineHeightOf`.
- `FontParts` discriminated union (exported).
- Re-export kit `Dimension`? Not needed; skip.

Run `pnpm test -- font-editor-types` (typecheck) until green. Biome. Commit: `feat(font-editor): strict ordered-parse type tier + type tests`.

---

## Task 2 — Runtime helpers (`font-editor.helpers.ts`) + parse/format tests

**Test first:** `tests/font-editor-parse.test.ts` and `tests/font-editor-format.test.ts`.

parse:
- `parseFont("italic bold 16px/1.5 'Times New Roman', serif")` → full FontParts.
- system keyword → `{ kind: "system", keyword }`.
- minimal `"16px serif"` → `{ kind: "shorthand", size: "16px", family: ["serif"] }`.
- missing size `"italic serif"` → null; missing family `"16px"` → null.
- duplicate kind `"italic oblique 16px serif"` → null.
- multi-word + quoted family list parsed into `family` array.
- `var()` tolerance: `"16px var(--stack)"` → family `["var(--stack)"]` (kept verbatim).
- all 4 line-height spacings parse to the same lineHeight.

format:
- round-trip: `formatFont(parseFont(x))` canonicalizes (single spaces, `, ` family join, `size/lh`).
- system keyword formats to itself.
- omitted prefix fields dropped; only present ones serialized in canonical order.

helpers extras: `fontFamilies`, `defaultParts`, classifier round-trips, `ParseResult`.

**Implement** `font-editor.helpers.ts`:
- Option-list consts + classifier fns mirroring the type predicates.
- `splitTopLevel` (paren/quote-aware) for the family comma split.
- The runtime ordered-parse mirror of §4.2: tokenize on spaces (depth-0), consume prefix (≤1 each kind, first-free for `normal`), then size (+optional `/lh` in attached/spaced forms), then rejoin rest → split on commas → family array (≥1). Return null on any structural failure.
- `formatFont`, `fontFamilies`, `defaultParts`, `ParseResult`.

Run parse+format tests (jsdom-free, fast). Biome. Commit: `feat(font-editor): runtime parse/format helpers + tests`.

---

## Task 3 — Component (`font-editor.tsx`) + `index.ts` + component tests

**Test first:** `tests/font-editor.test.tsx` (jsdom):
- `FontEditorPanel value="italic bold 16px/1.5 serif"` renders property fields; size field present.
- editing size emits onChange with updated string; editing weight; editing family.
- system-keyword toggle/mode renders the keyword.
- `FontPreview` applies the shorthand: a `[data-font-preview]` element whose `style.font` (or font-family/size composite) reflects the value, with editable sample text.
- popover `<FontEditor>` renders a trigger button; opening reveals the panel.
- `cssFont` returns its arg unchanged at runtime.

**Implement** `font-editor.tsx` (single file):
- `"use client"`.
- `FontEditorPanelProps` / `FontEditorProps` (value `FontString | (string & {})`, onChange `(v: FontString)=>void`, className, aria-label).
- `<FontEditor>` popover wrapper (Button trigger showing the value; PopoverContent → Panel) — copy transform-builder structure.
- `<FontEditorPanel>` — parseFont → FontParts state; `commit` with `lastEmittedRef` resync (transform-builder pattern). A mode switch (system vs shorthand). For shorthand: `PropertyField` rows for style/variant/weight (select + number for numeric weight), stretch (select + % input), size (value+unit/keyword select), line-height (number/normal), and `FamilyEditor`. LiveString + `FontPreview`.
- `<PropertyField>` exported (label + control slot).
- `<FamilyEditor>` exported — list of family tokens with add (from web-safe + generic list) / remove / edit; emits string[].
- `<FontPreview>` exported — sample-text element with `style={{ font: value }}` (fallback: when value is `none`/empty, skip); editable sample text input; `data-font-preview` attr.
- Native `<select>` controls (transform-builder precedent); reuse `UnitInput` for line-height numeric if it fits cleanly, else a plain number input (decide during impl; spec assumption 10).

`index.ts` barrel: export component props + components, helper types + fns, type exports + `cssFont` (mirror transform-builder index).

Run component tests. Biome. Commit: `feat(font-editor): editor components (popover + panel + preview) + tests`.

---

## Task 4 — Demo page + examples + MPA entry

- `pages/font-editor/index.html` (copy transform-builder; title "Font Editor — ridiculous").
- `pages/font-editor/main.tsx` (FontEditorPage).
- `src/pages/font-editor/page.tsx` (Layout compact; SectionHeaders; examples; InstallCta url `add https://turtiesocks.github.io/ridiculous/r/font-editor.json`).
- `src/examples/font-editor/{basic-usage,tier-casual,tier-intellisense,tier-strict,api-reference,live-preview}.tsx` (mirror transform-builder examples; `live-preview` = the FontPreview showcase with all controls + a web-safe/generic family list).
- `vite.config.ts`: add `"font-editor": path.resolve(__dirname, "pages/font-editor/index.html")` to `rollupOptions.input`.

Biome. Commit: `feat(font-editor): demo page, examples, MPA entry`.

---

## Task 5 — Registry + nav + coverage

- `registry.json`: add `font-editor` item (after transition-editor) with the 4 files + `registryDependencies` `[ridiculous-type-kit, unit-input, button, popover, input, label, select]`; add `https://turtiesocks.github.io/ridiculous/r/font-editor.json` to the `all` bundle's `registryDependencies` and mention in its description.
- `vitest.config.ts`: add `"src/components/ui/font-editor/**"` to `coverage.include`.
- `pnpm nav:build` (regenerates `src/generated/nav.ts`).
- `pnpm registry:build` (regenerates `public/r/*.json` — gitignored, NOT committed).

Commit (registry.json + vitest.config.ts + vite.config.ts if not already + generated nav): `feat(font-editor): registry entry, all-bundle, nav, coverage include`.

---

## Task 6 — Green `pnpm pr:check`

- Run `pnpm nav:build` first (vitest typecheck imports `@/generated/nav` transitively via pages — ensure fresh).
- `pnpm run typecheck`, `pnpm run check`, `pnpm run test` (or `pnpm pr:check`). Iterate to green: fix biome, fix any type-test mismatches, fix coverage if below threshold (add tests for uncovered branches).
- Final commit must be typecheck-clean.

---

## Risk watchpoints (from spec §4.2 / roadmap §7)

- **Compile budget:** prefix accumulator capped at 4; family rejoin bounded. If `tsc` slows, simplify the `Used` accumulator (object → positional) and ensure tail-recursion. Measure `pnpm typecheck` wall-time after Task 1.
- **`normal` ambiguity:** verified by a type test that `normal 16px serif` keeps and `normal normal normal normal 16px serif` keeps (4 normals) but a 5th token in size position behaves.
- **Family rejoin correctness:** the trickiest runtime+type piece. Test multi-word ("Times New Roman") and comma lists thoroughly.
