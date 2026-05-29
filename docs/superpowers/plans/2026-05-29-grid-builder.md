# grid-builder — Implementation Plan (TDD)

Spec: `docs/superpowers/specs/2026-05-29-grid-builder-design.md`.
Style: Biome (no semicolons, double quotes, 2-space). Commit per logical unit with
trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

Order: **types first** (the validator is the product), then runtime helpers, then
component, then demo/registry/nav, then full `pnpm pr:check`.

---

## Step 1 — Strict types + type-tests (TDD: tests first)

1.1 Write `tests/grid-builder-types.test-d.ts` asserting:
- `TrackListLiteral`: accept `1fr`, `100px`, `50%`, `auto`, `min-content`,
  `minmax(100px, 1fr)`, `repeat(3, 1fr)`, `repeat(auto-fill, minmax(100px, 1fr))`,
  `fit-content(200px)`, `[sidebar] 1fr [main] 2fr [end]`, `none`. Reject
  `minmax(1fr, 2fr)` (fr min), `repeat(0, 1fr)` (0 count), `repeat(x, 1fr)` (bad
  count), `foo`, `1fx`, `calc(1px + 2px)`, `[1bad]` (ident starts with digit).
- `GridAreasLiteral`: accept `"a a" "b b"`, `"head head" "nav main" "foot foot"`,
  `"a ." ". a"` (equal cols, dots ok). Reject `"a a" "b"` (unequal cols), `"a 1b"`
  (bad ident), `""` (empty), `"a a"` with non-quoted garbage.
- Utility types `TrackCountOf`, `TracksOf`, `AreaRowCountOf`, `AreaColumnCountOf`.
- Suggestion strings `TrackListString`, `GridAreasString`, `GridTemplateStringMap`,
  `GridMode`.
- `GridTemplateState` discriminated union.
- `cssTracks` / `cssGridAreas` call-site rejection via `@ts-expect-error`.

1.2 Implement `grid-builder.types.ts` to satisfy them:
- Track-list element validators built from kit primitives. Helper aliases:
  `IsTrackKeyword`, `IsInflexible` (length|pct|auto|min-content|max-content),
  `IsTrackSize`, `IsIdent` (leading-char guard + `AllChars`), `ValidateMinmax`,
  `ValidateFitContent`, `ValidateRepeat` (depth-capped recursion into a track
  list), `ValidateLineNames` (bracket body), `ValidateTrackToken`, `ValidateTrackList`.
- `GridAreasLiteral`: `SplitAreaRows` (extract quoted segments), per-row cell
  validation, equal-column-count fold.
- Suggestion unions, util types, state, helpers, `Dimension` re-export.

1.3 `pnpm exec biome check --write` on the two new files; run vitest typecheck on
the test-d file only. Commit: "feat(grid-builder): strict track-list + grid-areas
validators + type tests".

---

## Step 2 — Runtime helpers + tests

2.1 Write `tests/grid-builder-parse.test.ts` + `tests/grid-builder-format.test.ts`:
- `parseTracks`: tokenize a track list to `TrackToken[]`; tolerate `calc()`/`var()`;
  return `null` on bad token. `formatTracks` round-trips.
- `parseAreas`: rows → matrix; reject unequal columns, bad idents; **enforce
  rectangles** (`validateAreasRectangles`). `formatAreas` joins quoted rows.
- `areaNames`, `gridAreaFor` runtime helpers used by the preview/painter.

2.2 Implement `grid-builder.helpers.ts`:
- Paren/bracket-aware `splitTopLevel` (runtime mirror of the kit).
- `parseTracks` / `formatTracks` / `defaultTracks`.
- `parseAreas` (rows array in, matrix + validation) / `formatAreas` /
  `validateAreasRectangles` (scan each name's min/max row/col, assert the bounding
  box is fully filled by that name and the count matches) / `areaNames` /
  `gridAreaFor`.
- `TrackToken` type + `ParseResult` facade.

2.3 biome + run the two runtime specs. Commit: "feat(grid-builder): runtime
tracks/areas parser + formatter incl. rectangle validation".

---

## Step 3 — Component + jsdom test

3.1 Write `tests/grid-builder.test.tsx`: renders panel, switches mode tab, adds a
track, paints an areas cell, preview node has `display: grid`.

3.2 Implement `grid-builder.tsx`:
- `GridBuilder` (popover) + `GridBuilderPanel` (inline, mode tab strip).
- `TrackListEditor` + `TrackTokenRow` (token type select + value via `UnitInput`
  where a length, plain inputs for functions/keywords/named-lines; add/remove).
- `AreasEditor` wrapping `AreasPainter` (clickable cell grid cycling area names) +
  row/col add-remove.
- `GridPreview` (inline-style `display:grid`).
- `LiveString` readout. Commit emits `formatTracks` / `formatAreas` output, resync
  via `lastEmittedRef` (filter-builder pattern).

3.3 `index.ts` barrel (types + components + helpers exports).

3.4 biome + run the jsdom spec. Commit: "feat(grid-builder): popover + panel +
tracks/areas editors + live grid preview".

---

## Step 4 — Demo, registry, nav

4.1 `pages/grid-builder/{index.html,main.tsx}`; add MPA entry to `vite.config.ts`.
4.2 `src/pages/grid-builder/page.tsx` + `src/examples/grid-builder/{basic-usage,
tier-casual,tier-intellisense,tier-strict,api-reference,live-preview}.tsx`.
4.3 Append `grid-builder` item to `registry.json`; add to `all` bundle.
4.4 `pnpm nav:build`; `pnpm registry:build` (don't commit `public/r`).
4.5 Add `src/components/ui/grid-builder/**` to `vitest.config.ts` `coverage.include`.
4.6 biome. Commit: "feat(grid-builder): demo page, examples, registry + nav wiring".

---

## Step 5 — Verify

5.1 `pnpm nav:build` (so vitest can resolve `@/generated/nav` if referenced).
5.2 `pnpm pr:check` (typecheck + biome + vitest incl. type-tests). Fix to green.
5.3 Final commit if any fixes. Report.
