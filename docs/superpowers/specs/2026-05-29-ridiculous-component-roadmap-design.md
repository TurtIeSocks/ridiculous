# Ridiculous Component Roadmap — Program Spec

**Date:** 2026-05-29
**Status:** Draft for implementation
**Type:** Program/roadmap spec (governs Phase 0 + 11 component specs)
**Existing registry:** `color-picker`, `gradient-editor`, `unit-input`, `easing-picker`

---

## 1. Overview

This document sequences a batch of new `ridiculous` registry components into phases. It is **not** a single-component spec — it is the umbrella that every per-component spec/plan/implementation cycle hangs off of.

**Thesis.** There are a million UI libraries. The namesake — *ridiculously precise template-literal types* — is the differentiator, so type-system spectacle is the primary selection and ranking criterion. Every component must produce a valid CSS (or near-CSS) value string that is validated to absurd precision at compile time, with the existing 3-tier model (casual / IntelliSense / strict) as the through-line.

Real-world utility, visual demo appeal, and composability are tiebreakers, not goals in themselves.

**How this roadmap is consumed.** Phases run **one at a time**. Each phase is a full cycle:

> brainstorm (if needed) → per-component design spec → implementation plan → TDD implementation → registry build → demo page → tests → merge.

Each phase produces its own `docs/superpowers/specs/<date>-<component>-design.md` and `docs/superpowers/plans/<date>-<component>.md`, scoped by the contract in §5 of this document.

---

## 2. Portfolio

Eleven core components, ranked by type-system spectacle. Star rating = spectacle intensity.

| # | Component | Type-level flex | Spectacle | Reuses |
|---|-----------|-----------------|:---------:|--------|
| 1 | **calc / clamp typer** | recursive expression parser + dimensional analysis (`length − angle` = compile error) | ★★★★★ | kit, unit |
| 2 | **grid template builder** | track list + `repeat()` / `minmax()` + named lines + **areas painter** (rectangle validation) | ★★★★★ | kit, unit |
| 3 | **transform builder** | function-name dispatch → per-argument unit typing & arity | ★★★★ | kit, unit |
| 4 | **if() conditional value** | condition-kind dispatch (`media`/`supports`/`style`) + branch-value typing | ★★★★ | kit |
| 5 | **clip-path / basic-shape editor** | `polygon()` / `circle()` / `inset()` / `ellipse()` (+ `shape-outside` mode) | ★★★★ | kit, unit |
| 6 | **media / container query builder** | boolean logic + feature→value typing | ★★★★ | kit, unit |
| 7 | **font shorthand builder** | strict ordered-optional token parse (`style variant weight stretch size/lh family`) | ★★★★ | kit |
| 8 | **color-fn builder** | `color-mix()` interpolation + relative-color channel grammar (+ `light-dark()` mode) | ★★★★ | kit, color-picker |
| 9 | **transition + animation shorthand** | comma-separated layer list, reuse easing + duration | ★★★ | kit, easing-picker, unit |
| 10 | **box-shadow editor** | multi-layer `x y blur? spread? color? inset?` | ★★★ | kit, color-picker, unit |
| 11 | **filter / backdrop-filter editor** | function-list dispatch (+ `drop-shadow()` color) | ★★★ | kit, color-picker, unit |

### 2.1 Folds (consolidations baked into the portfolio)

- **grid-template-areas** → a mode of #2 (not a separate component).
- **animation shorthand** → merged with transition into #9.
- **backdrop-filter** → a mode of #11.
- **shape-outside** → a mode of #5.
- **light-dark()** → a mode of #8.

### 2.2 Stretch bench (listed, not committed)

Evaluated each at the end of the core run; promote only if it still earns its place:

- **anchor positioning** — `anchor(--name top)`, `anchor-size()`, `position-area` (cutting-edge, 2025+).
- **scroll / view timeline** — `scroll(root block)`, `view(20% 80%)`.
- **border-radius elliptical** — 8-value `/` syntax; strong visual, medium spectacle.
- **SVG `path()` editor** — `M L C Q A Z` mini-parser at the type level. Extreme spectacle + visual, but not CSS and large scope.
- **typed `attr()` / `@property syntax` descriptor** — meta: type CSS's own type-syntax string.
- **background shorthand** — very large grammar, low ROI vs complexity.

---

## 3. Phase sequence

Ordering principle: **de-risk + reuse**. Hardest/riskiest grammars early so type-budget limits surface before we commit downstream; pattern-establishing components precede the ones that reuse the pattern; cheap reuse-existing components cluster late as low-risk closers.

| Phase | Deliverable | Why here |
|------:|-------------|----------|
| **0** | `ridiculous-type-kit` (shared primitives + combinators) | Foundation. Gates every later phase. |
| **1** | calc / clamp typer | Hardest + riskiest (recursive + dimensional). De-risk the compile-time budget first. Peak spectacle = momentum. |
| **2** | transform builder | Establishes the **function-list dispatch** type pattern + canvas/3D demo pattern. |
| **3** | filter / backdrop-filter | Cheap once the transform dispatch (Phase 2) exists — same pattern, different function table. Validates pattern reuse. |
| **4** | grid template builder | Second monster grammar (track list + areas rectangle-validation). |
| **5** | clip-path / basic-shape | Basic-shape grammar; best draggable-vertex visual demo. |
| **6** | box-shadow editor | Multi-layer list; reuses color-picker + unit-input. Cheap. |
| **7** | transition + animation shorthand | Comma layer-list; reuses easing-picker + unit-input. Cheap. |
| **8** | font shorthand builder | Ordered-optional parse; standalone. |
| **9** | color-fn builder | `color-mix()` + relative color; reuses color-picker. |
| **10** | if() conditional value | Newest grammar; depends on nothing, so placed where its uncertainty is cheapest. |
| **11** | media / container query builder | Boolean logic + feature typing; rounds out the set. |

Re-sequencing is allowed between phases if a phase surfaces a dependency we missed; record the reason in that phase's spec.

---

## 4. Architecture decisions

### 4.1 Phase 0 — `ridiculous-type-kit` (shared registry item)

Today `color-picker.types.ts`, `easing-picker.types.ts`, and `unit-input.types.ts` each copy-paste ~12 identical primitives. Eleven more components would multiply that duplication and drift. **Resolution:** extract a single `registry:ui` item that every component declares as a `registryDependency` — exactly the pattern `gradient-editor` already uses to depend on `color-picker`. One extra file lands on install; that is already the shadcn norm.

**Contents.**

- **Extracted existing primitives:** `Digit`, `HexDigit`, `WS`, `TrimLeft`/`TrimRight`/`Trim`, `AllChars`, `NonEmptyAllChars`, `Length`, `And`, `Or`, `Not`, `Enumerate`, `IntRange`, `StripLeadingZeros`, `NormalizeInt`, `IsIntPart`, `IsByte`, `IsNumber0To1`/`0To100`/`0To360`/`0To400`, `IsPercent0To100`, `IsNonNegativeNumber`, `IsSignedDecimal`, `IsPositiveInt`, `KeepIf`.
- **New dimension primitives:** `IsLength<S>` (px/rem/em/ex/ch/vw/vh/vmin/vmax/cm/mm/in/pt/pc/q + container & small/large/dynamic viewport units; **excludes `fr`**, which is grid-scoped), `IsAngle<S>` (deg/grad/rad/turn — generalizes color's `IsHue`), `IsTime<S>` (s/ms), `IsResolution<S>` (dpi/dpcm/dppx/x), `IsPercentage<S>`, `IsNumber<S>`, `IsFlex<S>` (`fr`).
- **Dimensional-analysis tags:** a `Dimension` tag union (`"length" | "angle" | "time" | "percent" | "number" | "flex" | "resolution"`) and `DimensionOf<S>` mapping a value literal to its tag. This is the engine the calc typer (Phase 1) needs.
- **Combinators:** `SplitByComma<S>` and `SplitBySpace<S>` (→ tuples, for layer lists and space-separated tokens), `ParseFunction<S>` (→ `{ name; args }`, for grid / transform / clip-path / filter dispatch), `StartsWith`, `EndsWith`.
- **Call-site helper factory convention** and shared **utility-type conventions** (see §5.3).

**Registry shape.** Files live under `src/lib/` (e.g. `src/lib/ridiculous-type-kit/`) and target `lib/` on install, matching `components.json` `aliases.lib = "@/lib"`. Item name: `ridiculous-type-kit` (final name confirmed in the Phase 0 spec).

**Compatibility note.** The existing 4 components are **not** retro-migrated in Phase 0 (avoids touching shipped, tested code). They keep their inlined copies; new components consume the kit. A later optional cleanup phase may migrate them once the kit is proven — out of scope here.

### 4.2 Dependency policy

- Keep runtime dependencies minimal — match the existing set (`@radix-ui/*`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`).
- Freely pull **shadcn base-registry** primitives as `registryDependencies` (button, popover, dialog/sheet, slider, tabs, select, toggle-group, tooltip, label, separator, input…).
- No new heavy third-party runtime deps without an explicit call-out in that component's spec.

---

## 5. Per-component contract

Every phase's component conforms to this template unless its spec explicitly deviates (with reason). This mirrors the conventions proven by the existing 4 components.

### 5.1 File layout

```
src/components/ui/<component>/
  <component>.tsx        // components + (optionally) helpers, single file
  <component>.types.ts   // Literal validators, suggestion strings, util types, internal state
  <component>.helpers.ts // OPTIONAL — pure runtime parse/format/convert (color & gradient have it; easing inlines)
  index.ts               // barrel exports
```

Single-file `.tsx` is the convention even at 1000–1800 lines (precedent: `color-picker.tsx` ~1013, `gradient-editor.tsx` ~1140). Split into a sibling sub-component directory only past ~2000 lines (per global CLAUDE.md). Non-component exports (hooks/constants/types) live in `.types.ts` / `.helpers.ts`, never alongside the component, to avoid `react-refresh/only-export-components`.

### 5.2 Three-tier typing model

1. **Casual** — accept plain `string`. The escape hatch "when you just want JavaScript." No validation.
2. **IntelliSense** — suggestion-string union types (e.g. `` `oklch(${number} ${number} ${number})` ``) drive autocomplete and are the `onChange` return type.
3. **Strict** — full template-literal validator generic `<Component>Literal<S>` plus a call-site helper that resolves invalid input to `never`.

### 5.3 Required type surface (in `<component>.types.ts`)

- **Strict validator(s):** `export type XLiteral<S extends string> = …` composed from kit primitives.
- **Call-site helper:** `export const x = <S extends string>(value: S & XLiteral<S>): S => value` — mirrors `color()` / `easing()`.
- **Suggestion strings:** non-generic unions for IntelliSense + `onChange` returns (mirrors `ColorString` / `EasingString`), plus a `…StringMap` interface + mode/basis key type where a mode prop narrows output.
- **Utility types:** literal-level operators in the spirit of `ModeOf` / `WithAlpha` / `FunctionOf` (component-specific, e.g. `LayerCountOf`, `FunctionsOf`).
- **Internal state:** a discriminated union (mirrors `EasingState`), exported for advanced use (custom serialization).

### 5.4 Demo, registry, navigation

- **MPA entry:** `pages/<component>/index.html` + `pages/<component>/main.tsx`.
- **Page:** `src/pages/<component>/page.tsx`.
- **Examples:** `src/examples/<component>/` with at minimum `basic-usage`, `tier-casual`, `tier-intellisense`, `tier-strict`, `api-reference`, plus component-specific demos. Match the existing `src/examples/*` set.
- **Install snippet** via `InstallCta`; package-manager tabs already handled by `use-package-manager`.
- **Registry:** add the item to `registry.json` (with `registryDependencies` incl. `ridiculous-type-kit`); `pnpm registry:build` emits `public/r/<component>.json`; add to the `all` meta-bundle.
- **Nav:** `pnpm nav:build` (runs via `predev`/`prebuild`/`pretypecheck`) picks the page up.

### 5.5 Testing

- **Type-level:** `tests/<component>-types.test-d.ts` — exercised by vitest `typecheck` (`include: tests/**/*.test-d.ts`). Must assert **both** acceptance of valid literals and rejection of invalid ones (`@ts-expect-error`). This is the spec's primary correctness gate — the types are the product.
- **Runtime logic:** `tests/<component>-parse.test.ts` and `tests/<component>-format.test.ts` for the pure helpers.
- **Component:** `tests/<component>.test.tsx` (jsdom + `tests/setup.ts` canvas mock) for render/interaction.
- **Coverage:** add the component's `src/components/ui/<component>/**` path to vitest `coverage.include`; keep thresholds 90/85/90/90 (statements/branches/functions/lines).

### 5.6 Component API conventions

- **Controlled-only:** required `value` + `onChange` (ColorPicker precedent).
- **Two top-level exports** where a popover wrapper makes sense: `<X />` (popover-wrapped) + `<XPanel />` (inline) — easing-picker precedent.
- **Sub-components exported** as named exports for composition.
- Keyboard + a11y parity with existing components (focus management, ARIA on draggable/canvas controls).

---

## 6. Per-phase workflow

Each phase, in order:

1. **Spec** — write `docs/superpowers/specs/<date>-<component>-design.md` scoped by §5. Brainstorm only the genuinely open questions; the contract answers the rest.
2. **Plan** — `writing-plans` → `docs/superpowers/plans/<date>-<component>.md` (TDD steps).
3. **Implement** — TDD: type-level tests first (the validator is the product), then runtime + component.
4. **Wire** — registry entry + `registry:build` + demo page + nav + `all` bundle.
5. **Verify** — `pnpm pr:check` (typecheck + biome + vitest, incl. type-tests) green.
6. **Integrate** — merge to main, delete branch + worktree.

Phase 0 follows the same flow minus the demo page (it ships types only; its "tests" are `tests/type-kit-*.test-d.ts`).

---

## 7. Risks & mitigations

- **Compile-time budget (top risk).** Recursive/variadic type parsing — calc expression depth (calc), grid track lists (grid), multi-layer shadows/transitions (box-shadow, transition), function arg lists (transform, filter) — can explode `tsc`. **Mitigation:** depth caps + weak-validate the variadic tail, with the runtime parser doing full validation. Precedent already in the codebase: `LinearLiteral` punts on `linear()`'s variadic stops, and `OklabLiteral` deliberately does not range-check the a/b axes. Each component's spec documents exactly what its strict tier validates vs. defers.
- **Dimensional analysis feasibility (calc, Phase 1).** Type-level unit algebra (length ± length, length × number, reject length × length) may be too costly. Phase 1 explicitly de-risks; fallback is "validate units are present + parens balance, skip full algebra." Decided in the calc spec, informed by a `tsc` perf measurement.
- **Type-test as the gate.** Because the types are the product, every phase's `*-types.test-d.ts` must prove rejection as rigorously as acceptance. Watch `tsc` wall-time as the kit + components grow.
- **Unit-set scoping.** `fr` is grid-only; container-query units are query-context; keep `IsLength` and friends scoped so a value isn't accepted in the wrong context.
- **Kit churn.** Phase 0 can't perfectly predict every primitive later phases need. Treat the kit as additive — new phases may extend it; they must not break existing exports (the existing 4 components don't consume it yet, but later components will).

---

## 8. Open questions / deferred

- Final name for the kit item (`ridiculous-type-kit` working title).
- Whether/when to retro-migrate the existing 4 components onto the kit (optional post-core cleanup phase).
- Stretch-bench promotion decided after the core 11 (see §2.2).
- Type-test tooling is settled: vitest `typecheck` with `*.test-d.ts` (no `tsd`/`expect-type` dependency needed).

---

## 9. Decisions captured during brainstorming

| Decision | Resolution |
|----------|-----------|
| Lane | Both CSS-value editors and broader typed inputs; in practice all candidates are CSS/near-CSS value strings. |
| Ranking criterion | Type-system spectacle leads; utility/visual/composability are tiebreakers. |
| Portfolio | 11 core + stretch bench (§2); scouted 2025–26 grammars (`if()`, `color-mix`/relative color, grid-areas, anchor, scroll/view) and folded the worthy ones. |
| Shared primitives | Single `ridiculous-type-kit` registry item; not codegen, not per-component duplication. |
| Phase ordering | De-risk + reuse (§3). |
| Dep policy | Minimal runtime deps; shadcn base-registry items free to pull. |
| Existing-4 migration | Deferred; not part of this roadmap. |
