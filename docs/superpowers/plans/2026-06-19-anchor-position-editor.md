# anchor-position-editor — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-06-19-anchor-position-editor-design.md`
**Approach:** TDD. Types are the product → type-tests first. All paths worktree-absolute.

Conventions (from the shipped components — do not re-derive):
- Tier: `value: <Mode>String | (string & {})`; `onChange: (v: <union>String) => void`; strict `XLiteral<S>` + `cssX` helper.
- Component: controlled, popover-wrapped `<X>` + inline `<XPanel>`; `commit` + `lastEmittedRef` resync guard (see `query-builder.tsx`).
- Local `mini-select.tsx` per component (registry self-containment — never import another component's).
- `cn` from `@/lib/utils`; `Button` from `@/components/ui/button`; `Popover*` from `@/components/ui/popover`; `UnitInput` from `@/components/ui/unit-input`.
- Type-kit: `@/lib/ridiculous-type-kit` — `SplitBySpace`, `SplitByComma`, `ParseFunction`, `Trim`, `StartsWith`, `IsLength`, `IsPercentage`, `AllChars`, `KeepIf`, `And`/`Or`/`Not`.
- Examples use `@/examples/_shared/{ExampleCard, CodeBlock, ValueReadout, code-block}`; tier-strict proves rejection via `@ts-expect-error`.

## Phase A — Types (`anchor-position-editor.types.ts` + `tests/anchor-position-editor-types.test-d.ts`)

1. Write the type-test FIRST with accept + `@ts-expect-error` reject cases from spec §1.2 + §8. It will not compile (no types yet) — that is the red.
2. Implement `anchor-position-editor.types.ts`:
   - Keyword unions: `PaKeyword`, `AnchorSideKeyword`, `AnchorSizeKeyword`, `TryTactic`, `PositionAxis`.
   - `AxisOf<K>` — conditional ladder mapping each `PaKeyword` to its axis tag (`x`/`y`/`block`/`inline`/`neutral`). Use `StartsWith` for `span-`/`x-`/`y-` prefixes where it collapses members.
   - `Compatible<A, B>` — 5×5 tag check (neutral ok; x+y ok; block+inline ok; same-axis never; physical+logical never).
   - `PositionAreaLiteral<S>` — `SplitBySpace` → 1|2 tokens → keyword membership → `Compatible`.
   - `AnchorLiteral<S>` — `ParseFunction` → name in {anchor,anchor-size} → `SplitByComma` head/fallback → side/size membership or `IsPercentage` → fallback `IsLength|IsPercentage`.
   - `PositionTryLiteral<S>` — `SplitByComma` → each fallback `none` | tactics/ident arm | `PositionAreaLiteral`.
   - Call-site helpers `cssPositionArea`/`cssAnchor`/`cssPositionTry`.
   - Suggestion strings + `AnchorStringMap` + `AnchorPositionMode`; util `KeywordsOf<S>`; exported state types `AnchorExpr`, `TryFallback`, `PositionAreaState`.
3. Run `pnpm typecheck` + the type-test (`pnpm test anchor-position-editor-types`) → green. Iterate on the cross-axis rule until every reject is `never` and every accept is `S`.

## Phase B — Helpers (`anchor-position-editor.helpers.ts` + parse/format tests)

1. Write `tests/anchor-position-editor-parse.test.ts` + `tests/anchor-position-editor-format.test.ts` (red).
2. Implement helpers per spec §4 + §4.1: `parse*`/`format*`, `axisOf`, `areCompatible` (runtime mirrors — keep adjacent to a shared `KEYWORD_TABLE`), option sources, `cellToKeywords`/`keywordsToCell`, `defaultFor`.
3. `pnpm test anchor-position-editor-parse anchor-position-editor-format` → green.

## Phase C — Component (`anchor-position-editor.tsx` + sub-components + `index.ts` + component test)

1. Write `tests/anchor-position-editor.test.tsx` (red): renders per mode, grid-cell click emits pair, toggles change output, anchor fields emit `anchor(...)`, try-chain add/remove/reorder, popover summary, preview degrades.
2. Implement `mini-select.tsx`, `position-area-grid.tsx`, `anchor-expr-fields.tsx`, `try-fallback-chain.tsx`, `anchor-preview.tsx`, then `anchor-position-editor.tsx` (panel orchestrates by mode), then `index.ts` barrel (export components, types, validators, helpers — mirror `query-builder/index.ts`).
3. `pnpm test anchor-position-editor` (the .tsx) → green.

## Phase D — Demo + wiring

1. `src/examples/anchor-position-editor/`: 6 examples (basic-usage, tier-casual, tier-intellisense, tier-strict, api-reference, placement-grid). Mirror `src/examples/query-builder/*`.
2. `src/pages/anchor-position-editor/page.tsx` (mirror query-builder page; `ComponentPage` meta + examples + tiers + apiReference).
3. `src/routes.tsx` — add the page route (mirror an existing page route entry).
4. `registry.json` — add the `anchor-position-editor` item (type/title/description in the registry voice, registryDependencies, files list per spec §8) + append its `.json` URL to the `all` bundle `registryDependencies`.
5. `vitest.config.ts` — add `src/components/ui/anchor-position-editor/**` to `coverage.include`.
6. `pnpm nav:build`.

## Phase E — Verify

1. `pnpm typecheck`, `pnpm check`, `pnpm test` (the new files) — in parallel where possible.
2. Fix all reds. Full `pnpm pr:check` green before commit.
3. Commit on branch `c/focused-dirac-1a6e95`.
