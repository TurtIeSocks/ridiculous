# background-editor — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-06-19-background-editor-design.md`
**Approach:** TDD. Same conventions as the prior four plans. All paths worktree-absolute.

## Phase A — Types (main thread)
`background-editor.types.ts` + `tests/background-editor-types.test-d.ts`:
- `BackgroundLiteral<S>`: `SplitByComma` → layers; `ValidateLayers` head/tail fold (last layer → allowColor true, else false); `ValidateLayer` = every `SplitBySpace` token `IsBgToken<T, AllowColor>` (/, keyword sets, length/percentage, image=none|paren-fn, else color via `Sat<ColorLiteral<T>>` only when AllowColor).
- `cssBackground`; `BackgroundString`; `LayersOf<S>`/`LayerCountOf<S>`; state `BgLayer`/`BackgroundValue`.
- Verify `npx vitest run --typecheck tests/background-editor-types.test-d.ts` green + tsc clean. (Colors as #f00, not named.)

## Phase B — Helpers (delegated)
`background-editor.helpers.ts` + parse/format tests: `parseBackground`, `formatBackground` (color only on final layer), `classifyToken`, `defaultBackground`, option sources. Verify green.

## Phase C — Component (delegated)
`layer-stack.tsx`, `layer-card.tsx` (embed GradientEditor + position pad + size/repeat/attachment/box selects; final card adds ColorPicker), `position-pad.tsx` (local 2D crosshair), `background-preview.tsx` (live composite tile), `mini-select.tsx`, `background-editor.tsx` (BackgroundEditor + Panel), barrel; `tests/background-editor.test.tsx`. Verify green + tsc clean.

## Phase D — Demo + wiring (delegated)
6 examples (incl. hero `layer-stack`), page, registry item (deps: ridiculous-type-kit, color-picker, gradient-editor, unit-input, button, popover, input) + all-bundle URL, vitest coverage include, nav:build. Verify tsc + biome clean.

## Phase E — Verify (main thread)
typecheck + biome + 4 test files green. Commit. Then full-suite `pnpm test` + `pnpm pr:check` as the final batch gate (all 5 components shipped).
