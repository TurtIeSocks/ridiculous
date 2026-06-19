# property-syntax-editor — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-06-19-property-syntax-editor-design.md`
**Approach:** TDD. Conventions identical to the anchor-position-editor plan (controlled value/onChange + lastEmittedRef; local mini-select; cn from @/lib/utils; type-kit @/lib/ridiculous-type-kit; examples use @/examples/_shared; routes auto-register from registry via nav:build). All paths worktree-absolute.

## Phase A — Types (DONE BY MAIN THREAD — the crown jewel)
`property-syntax-editor.types.ts` + `tests/property-syntax-editor-types.test-d.ts`:
- `DataTypeName` union; `SyntaxLiteral<S>` (universal | `|`-split components, strip single `+`/`#`, base `<type>` ∈ DataTypeName or ident).
- `InitialValueLiteral<Syntax, V>` dependent validator — flat `|` OR over components; per-component multiplier split; `SatisfiesBase` predicate table (length/number/percentage/length-percentage/integer→number/angle/time/resolution via kit; `<color>` via color-picker `ColorLiteral`; image/url/transform lenient; ident equality).
- `cssSyntax`, `cssProperty(syntax, initialValue)` helpers; `SyntaxString`/`MultiplierToken`/`ComponentsOf`; state `SyntaxComponent`/`PropertySyntaxState`.
- Verify `npx vitest run --typecheck tests/property-syntax-editor-types.test-d.ts` green.

## Phase B — Helpers (delegated)
`property-syntax-editor.helpers.ts` + parse/format tests: `parseSyntax`, `formatSyntax`, `matchesSyntax` (runtime mirror; `isColorString` from color-picker for `<color>`; real integer check), `dataTypeNames`, `defaultSyntax`, `defaultInitialValue`. Shared `DATA_TYPE_TABLE`. Verify parse+format green.

## Phase C — Component (delegated)
`syntax-chip-builder.tsx`, `initial-value-field.tsx`, `mini-select.tsx`, `property-syntax-editor.tsx` (PropertySyntaxEditor + Panel), update `index.ts` barrel; `tests/property-syntax-editor.test.tsx`. Verify component test green.

## Phase D — Demo + wiring (delegated)
6 examples (incl. hero `dependent-initial-value`), page, registry item (deps: ridiculous-type-kit, color-picker, button, popover, input) + all-bundle URL, vitest coverage include, nav:build. Verify tsc + biome clean.

## Phase E — Verify (main thread)
typecheck + biome + the 4 test files green. Commit.
