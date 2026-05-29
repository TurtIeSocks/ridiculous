# `if-function` — Implementation Plan (TDD)

**Spec:** `docs/superpowers/specs/2026-05-29-if-function-design.md`
**Branch:** `claude/hungry-chaplygin-62fec9` (worktree)
**Style:** Biome — no semicolons, double quotes, 2-space indent. `pnpm exec biome check --write` before each commit. Commit trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

Each task: write the test first, then the implementation, run the narrow check, commit.

---

## Task 1 — Type tier (`if-function.types.ts`) + type-tests

**Test first:** `tests/if-function-types.test-d.ts`

Accept:
- each kind: `if(media(width >= 800px): red)`, `if(supports(display: grid): grid)`, `if(style(--x: 1): 2px)`
- `else` as last: `if(media(...): a; else: b)`
- multi-branch: 3 branches incl. trailing else
- value with internal colon-safe parens: `if(style(--x: 1): url(a))` (colon inside style not a split point)
- `cssIf(...)` accepts a valid literal, returns it

Reject (`@ts-expect-error` / `toBeNever`):
- unknown kind: `if(foo(x): 1)`
- `else` not last: `if(else: a; media(x): b)`
- missing colon: `if(media(x) red)`
- empty value: `if(media(x): )`
- malformed wrapper: `if(media(x): a` (no close) / `calc(1px)` (wrong name)
- empty body: `if()`

Utility-type assertions: `BranchesOf`, `BranchCountOf`, `ConditionKindsOf`, suggestion unions, `IfBranch`/`IfFunctionState`.

**Implement** `if-function.types.ts`:
- imports from `@/lib/ridiculous-type-kit`: `ParseFunction`, `Trim`, `And`, `KeepIf` (others as needed).
- `SplitBySemicolon<S>` — local paren-aware char-walk (track `(`/`[` depth, split on `;` at depth 0, trim, drop empties).
- `SplitFirstColonTopLevel<S>` — char-walk returning `[before, after]` for the FIRST `:` at depth 0, else `never`.
- `IsBalanced<S>` — char-walk: parens balance, never negative.
- `IsConditionKind<S>` — `media(B)`/`supports(B)`/`style(B)` with `B` non-empty + `IsBalanced<B>`.
- `IsBranch<S, IsLast>` — first-colon split; cond is `else` (only if `IsLast`) or `IsConditionKind`; value non-empty.
- `ValidateBranches<Branches>` — fold, last element gets `IsLast=true`.
- `IfFunctionLiteral<S>` — `ParseFunction` name `if` + ≥1 branch + `ValidateBranches` → `S` else `never`.
- `cssIf` helper.
- `ConditionKind`, `ConditionString`, `IfFunctionString`.
- `BranchesOf`, `BranchCountOf`, `ConditionKindsOf`.
- `IfBranch`, `IfFunctionState`.

**Check:** `pnpm exec vitest run tests/if-function-types.test-d.ts` (typecheck project). Commit.

---

## Task 2 — Runtime helpers (`if-function.helpers.ts`) + parse/format tests

**Test first:** `tests/if-function-parse.test.ts` + `tests/if-function-format.test.ts`

Parse accept → branch records; parse reject → `null` (mirror the type rejects + a couple runtime-only tolerances). Format: round-trip `parseIf` ∘ `formatIf`; canonical joiner; `branchToCss` per kind incl. else; `defaultBranch(kind)`; `branchCount`.

**Implement** `if-function.helpers.ts`: `splitTopLevel`, `parseIf`, `branchToCss`, `formatIf`, `defaultBranch`, `branchCount`, `ParseResult`.

**Check:** `pnpm exec vitest run tests/if-function-parse.test.ts tests/if-function-format.test.ts`. Commit.

---

## Task 3 — Component (`if-function.tsx`) + barrel (`index.ts`) + component test

**Test first:** `tests/if-function.test.tsx` (jsdom): renders panel with branches from value; add a branch; change kind to/from else; edit value; remove branch; onChange emits canonical string; popover trigger shows count.

**Implement** `if-function.tsx`: `IfFunction`, `IfFunctionPanel`, `BranchRow`, `ConditionKindSelect`, `AddBranchButton`, `IfPreview`. Props interfaces. `index.ts` barrel (types + helpers + components, mirror transition-editor).

**Check:** `pnpm exec vitest run tests/if-function.test.tsx`. Commit.

---

## Task 4 — Demo wiring

- `pages/if-function/index.html` + `main.tsx`.
- `src/pages/if-function/page.tsx`.
- `src/examples/if-function/{basic-usage,tier-casual,tier-intellisense,tier-strict,api-reference,branch-builder}.tsx`.
- Add MPA entry to `vite.config.ts`.
- `pnpm nav:build`.

**Check:** `pnpm run typecheck`. Commit.

---

## Task 5 — Registry + coverage

- Append `if-function` item to `registry.json` (deps: `ridiculous-type-kit`, `button`, `popover`, `input`) + add to `all` bundle.
- `pnpm registry:build` (do NOT commit `public/r/*`).
- Add `src/components/ui/if-function/**` to `vitest.config.ts` `coverage.include`.

**Check:** `pnpm registry:build` succeeds. Commit `registry.json` + `vitest.config.ts`.

---

## Task 6 — Full `pnpm pr:check` green

Run `pnpm nav:build` first (vitest may import `@/generated/nav`), then `pnpm pr:check`. Fix any fallout. Final commit must leave the tree typecheck-clean.
