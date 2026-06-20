# keyframes-editor — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-06-19-keyframes-editor-design.md`
**Approach:** TDD. Same conventions as the prior four plans. All paths worktree-absolute.

## Phase A — Types + tsc-budget gate (main thread)
`keyframes-editor.types.ts` + `tests/keyframes-editor-types.test-d.ts`:
- `KeyframesLiteral<S>` two-level fold: block consumption via `${Sel}{${Decls}}${Rest}`; `ValidateSelectors` (from/to/IsPercent0To100); `ValidateDecls` (split on `;`, first `:` → DispatchValue).
- `DispatchValue<Prop,Value>`: transform→TransformLiteral, filter/backdrop-filter→FilterLiteral, color-ish→ColorLiteral, *-timing-function→EasingLiteral, opacity→IsNumber0To1, length-props→Or<IsLength,IsPercentage>, unknown→lenient. `Sat<L,V> = [L] extends [never] ? false : true`.
- `cssKeyframes`; `KeyframesString`; `StopsOf<S>` (block count); `KeyframePropertyKind`; state `KeyframeBlock`/`Declaration`/`KeyframesValue`.
- **MEASURE `tsc`** (time `npx tsc --noEmit -p tsconfig.app.json`). If acceptable → keep full dispatch. If it spikes → downgrade transform/filter values to lenient, keep the rest strict; record the number + decision in spec §3.1.
- Verify `npx vitest run --typecheck tests/keyframes-editor-types.test-d.ts` green.

## Phase B — Helpers (delegated)
`keyframes-editor.helpers.ts` + parse/format tests: `parseKeyframes`, `formatKeyframes` (sorted), `propertyEditorKind`, `selectorToPercent`/`percentToSelector`, `defaultKeyframes`. Verify green.

## Phase C — Component (delegated)
`keyframe-timeline.tsx` (0–100% track + draggable stops + play head), `declaration-row.tsx` (property select + embedded editor by propertyEditorKind — TransformBuilder/FilterBuilder/ColorPicker/GradientEditor/EasingPicker/UnitInput/plain), `keyframe-preview.tsx` (JS-interpolated scrub preview), `mini-select.tsx`, `keyframes-editor.tsx` (KeyframesEditor + Panel), barrel; `tests/keyframes-editor.test.tsx`. Verify green.

## Phase D — Demo + wiring (delegated)
6 examples (incl. hero `animation-timeline`), page, registry item (deps: ridiculous-type-kit, transform-builder, filter-builder, color-picker, gradient-editor, easing-picker, unit-input, button, popover, input) + all-bundle URL, vitest coverage include, nav:build. Verify tsc + biome clean.

## Phase E — Verify (main thread)
typecheck + biome + 4 test files green. Commit.
