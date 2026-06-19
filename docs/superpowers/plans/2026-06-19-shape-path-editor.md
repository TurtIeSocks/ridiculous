# shape-path-editor — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-06-19-shape-path-editor-design.md`
**Approach:** TDD. Same conventions as the anchor + property-syntax plans (controlled value/onChange + lastEmittedRef; local mini-select; @/lib/ridiculous-type-kit; examples @/examples/_shared; routes auto-register via nav:build). All paths worktree-absolute.

## Phase A — Types (main thread)
`shape-path-editor.types.ts` + `tests/shape-path-editor-types.test-d.ts`:
- `ShapeCommandName` union; `ShapeString`; `ShapeLiteral<S>` (ParseFunction → name "shape"; strip fill-rule; require `from <lp> <lp>`; SplitByComma rest; per-command dispatch on name → arity + by/to + with/of slots + `<length-percentage>` coords via Or<IsLength,IsPercentage>; arc flags + hline/vline keywords lenient).
- `cssShape`; util `CommandsOf<S>`/`CommandCountOf<S>`; state `ShapeCommand`/`Point`/`ShapeValue`.
- Verify `npx vitest run --typecheck tests/shape-path-editor-types.test-d.ts` green.

## Phase B — Helpers (delegated)
`shape-path-editor.helpers.ts` + parse/format tests: `parseShape`, `formatShape`, `commandNames`, `defaultShape`, `shapeToPoints`/`updatePoint`/`commandArity`. Verify parse+format green.

## Phase C — Component (delegated)
`shape-canvas.tsx` (SVG draggable nodes + Bézier handles + arc gizmo + live preview), `command-row.tsx`, `shape-preview.tsx`, `mini-select.tsx`, `shape-path-editor.tsx` (ShapePathEditor + Panel, mode preview-only), barrel `index.ts`; `tests/shape-path-editor.test.tsx`. Verify component test green.

## Phase D — Demo + wiring (delegated)
6 examples (incl. hero `path-canvas`), page, registry item (deps: ridiculous-type-kit, unit-input, button, popover, input, label) + all-bundle URL, vitest coverage include, nav:build. Verify tsc + biome clean.

## Phase E — Verify (main thread)
typecheck + biome + 4 test files green. Commit.
