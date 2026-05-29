# query-builder — Implementation Plan (Phase 11)

TDD, bite-sized, real code. Type-tests FIRST (the types are the product). Commit per
logical unit. Biome: no semicolons, double quotes, 2-space indent. All paths are
relative to the worktree root
`/Users/rin/GitHub/ridiculous/.claude/worktrees/hungry-chaplygin-62fec9`.

Spec: `docs/superpowers/specs/2026-05-29-query-builder-design.md`.

---

## Task 1 — `query-builder.types.ts`: strict tier + suggestion + utility + state

Write the full type module. Structure (mirrors `if-function.types.ts` +
`transform-builder.types.ts`):

1. **Local paren-aware splitters** (kit ships no joiner-word splitter): a
   `SplitByTopLevelWord<S, Word>` that walks char-by-char tracking `()`/`[]` depth and
   splits on a whole-word ` and ` / ` or ` at depth 0 (space-delimited so `expand` is
   not a false match). Plus `HasTopLevelWord<S, Word>` (does the word occur at depth
   0?) for the no-mix check, and `IsBalanced<S>` (copy the if-function shape).
2. **Operator split** for ranges: `SplitFirstOp<S>` and `SplitLastOp<S>` returning
   `[left, op, right]` where op ∈ `< <= > >= =` (try the 2-char ops `<=`/`>=` before
   the 1-char ones). A 3-part range is `left op1 mid op2 right`.
3. **Value-dimension predicates** built on the kit: `IsLengthVal`, `IsResolutionVal`,
   `IsRatio` (`<number>` or `<number>/<number>` via `IsNumber`), `IsIntegerVal`
   (`IsNumber`, lenient). Compare via `DimensionOf` where useful (e.g.
   `DimensionOf<V> extends "length"`).
4. **Feature classification types** — `MediaLengthFeature`, `MediaRatioFeature`,
   `MediaResolutionFeature`, `MediaIntegerFeature`, `MediaEnumFeature` unions; plus
   `EnumValuesOf<F>` mapping each enum feature to its keyword union (a conditional
   chain). Same for container: `ContainerLengthFeature`, `ContainerRatioFeature`,
   `ContainerEnumFeature`. A `StripMinMax<F>` that removes a leading `min-`/`max-`.
5. **`ValidateFeatureValue<Feature, Value, Mode>`** — strip `min-`/`max-`, look up the
   base feature's class for the mode, then check the value with the matching predicate
   / enum union. Unknown feature → `false`.
6. **`ValidateFeatureTest<Inner, Mode>`** — dispatch the four shapes (range3, range2,
   plain `:`, boolean). Boolean only for boolean-capable features.
7. **`ValidateTest<S, Mode, Depth>`** — require `(${Inner})` + balanced; if `Inner` is
   a group (starts `(`/`not `/has a top-level joiner) recurse `ValidateCondition`
   (decrement Depth; at 0 accept leniently); else `ValidateFeatureTest`.
8. **`ValidateCondition<S, Mode, Depth>`** — handle leading `not `; split on ` and `
   (if >1 part and NO top-level ` or `, all tests) else split on ` or ` (if >1 and NO
   ` and `, all tests) else single `ValidateTest`. Return `true`/`false`.
9. **`MediaQueryLiteral<S>`** — `Trim`, strip optional `only `/`not ` + media-type;
   handle `only screen` (type only), `screen and <cond-no-or>`, `not <test>`, bare
   condition → `KeepIf<ValidateCondition<…, "media", 4>, S>`.
   `ContainerQueryLiteral<S>` — strip optional leading ident name (head not `(`/`not`),
   then `ValidateCondition<…, "container", 4>`.
10. **Call-site helpers** `cssMediaQuery` / `cssContainerQuery` (the `<S>(v: S &
    Literal<S>): S => v` idiom).
11. **Suggestion strings + maps + enum unions** (§10): `QueryMode`, `FeatureOperator`,
    `MediaType`, `MediaModifier`, `MediaQueryString`, `ContainerQueryString`,
    `QueryString`, `QueryStringMap`, and the enum-keyword unions.
12. **Utility types** `FeaturesOf<S>`, `FeatureCountOf<S>`.
13. **Internal state** (exported discriminated union): `FeatureTest`, `QueryNode`,
    `QueryState`. Re-export `Dimension` from the kit.

**Test (write FIRST, then the module):** `tests/query-builder-types.test-d.ts` per
spec §8 — accept + reject every listed case. Run `pnpm exec vitest run --typecheck
query-builder-types` (background if >5s). Iterate until green.

Commit: `feat(query-builder): strict media/container query type tier + call-site helpers`.

---

## Task 2 — `query-builder.helpers.ts`: runtime parse/format + tables

Write `tests/query-builder-parse.test.ts` + `tests/query-builder-format.test.ts`
FIRST (spec §8), then the helpers:

- `QueryMode` re-import from types.
- Paren-aware `splitTopLevelWord`, `hasTopLevelWord`, `isBalanced`, op-split helpers
  (runtime mirrors of the type splitters).
- `FEATURE_TABLE` constant: `Record<string, { mode: "media"|"container"|"both"; kind:
  "length"|"resolution"|"ratio"|"integer"|"enum"; enums?: readonly string[];
  boolean?: boolean }>`. One row per known feature (base names; `min-`/`max-` handled
  by stripping at lookup).
- `featureKind`, `featuresFor`, `enumOptionsFor`.
- `parseFeatureTest(inner)` → `FeatureTest | null` (classify the four shapes).
- `parseQuery(src, mode)` → `{ node: QueryNode | null; error: string | null }`
  (strip modifier/type or name, recurse the condition).
- `formatFeatureTest`, `formatNode`, `formatQuery(node, mode)`.
- `defaultFeatureTest(mode)`, `defaultQuery(mode)`.
- `matchesNow(query, mode)` → `boolean | null` (media-only, guarded `matchMedia`).
- `ParseResult` facade + `queryToString`.

Run both runtime specs (background). Iterate to green.

Commit: `feat(query-builder): runtime parser, formatter, feature table, matchMedia helper`.

---

## Task 3 — `query-builder.tsx`: components

Write `tests/query-builder.test.tsx` FIRST (mock `window.matchMedia` in the file via
`Object.defineProperty(window, "matchMedia", { value: vi.fn().mockImplementation(q =>
({ matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
addListener: vi.fn(), removeListener: vi.fn(), onchange: null, dispatchEvent: vi.fn()
})), writable: true })`). Cover: panel renders rows from value, feature/op/value edits
emit strings, joiner + not toggles, mode-specific controls (MediaTypeSelect vs
ContainerNameInput), mode switches feature options, matches-now reads the mock, popover
trigger summary, empty/invalid value.

Then implement (mirror `if-function.tsx`): `QueryBuilder`, `QueryBuilderPanel`,
`MediaTypeSelect`, `ContainerNameInput`, `JoinerSelect`, `FeatureTestRow`, `NotToggle`,
`QueryPreview`, internal `LiveString`. Reuse `unit-input` for length values. Controlled
value resync via `lastEmittedRef` (if-function pattern). `mode` defaults to `"media"`.

Run the component spec (background, jsdom — fast). Iterate to green.

Commit: `feat(query-builder): popover + inline panel, feature-test rows, live matches indicator`.

---

## Task 4 — `index.ts` barrel + demo (page, examples, MPA)

- `src/components/ui/query-builder/index.ts` — export all components + prop types +
  helpers + types (mirror `if-function/index.ts`).
- `pages/query-builder/index.html` + `main.tsx` (copy if-function, swap names/title).
- `src/pages/query-builder/page.tsx` (mirror if-function page; describe mode + no-mix +
  validated/deferred boundary).
- `src/examples/query-builder/{basic-usage,tier-casual,tier-intellisense,tier-strict,
  api-reference,condition-builder}.tsx`. `condition-builder` = the contract demo
  (feature select + op + value + and/or/not, produced string, media matches-now).
  `tier-strict` uses `cssMediaQuery` / `cssContainerQuery` with `@ts-expect-error`
  rejections.
- Append the `vite.config.ts` MPA input entry.

Run `pnpm nav:build`.

Commit: `feat(query-builder): demo page, examples, barrel, MPA entry, nav`.

---

## Task 5 — registry + coverage + green pr:check

- Append the `query-builder` item to `registry.json` (`registryDependencies`:
  ridiculous-type-kit, unit-input, button, popover, input, label, select; four files)
  and add its `.json` URL to the `all` bundle.
- Append `src/components/ui/query-builder/**` to `coverage.include` in
  `vitest.config.ts`.
- `pnpm registry:build` (regenerates gitignored `public/r/*.json` — do NOT commit
  those).
- `pnpm exec biome check --write` the new files.
- `pnpm nav:build` (ensure `@/generated/nav` current), then `pnpm pr:check` until
  GREEN (typecheck + biome + vitest incl. type-tests + coverage thresholds).

Commit: `feat(query-builder): registry entry, all-bundle, coverage include`.

---

## Notes / guardrails

- Type-test is the gate; assert rejection (`@ts-expect-error`) as rigorously as
  acceptance.
- Keep `tsc` bounded: depth cap 4, flat folds, cheap no-mix scan. If wall-time spikes,
  trim the enum feature set (cheapest lever) before touching the dispatch shape.
- Last commit MUST leave the tree typecheck-clean.
- Do NOT commit `public/r/*.json`. Commit `registry.json` only.
- Background any command >5s.
