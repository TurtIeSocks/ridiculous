# transition-editor — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-05-29-transition-editor-design.md`
**Worktree:** `/Users/rin/GitHub/ridiculous/.claude/worktrees/hungry-chaplygin-62fec9` (branch `claude/hungry-chaplygin-62fec9`)
**Approach:** TDD. Type-tests FIRST (the validator is the product), then runtime parse/format, then component. Commit per logical unit. Biome: no semicolons, double quotes, 2-space indent.

Verification per phase boundary (parallel Bash batch): `pnpm exec biome check`, `pnpm typecheck`, `pnpm test`. Run `pnpm nav:build` before vitest if it complains about `@/generated/nav`.

---

## Task 1 — Type tier: `transition-editor.types.ts` + `tests/transition-editor-types.test-d.ts`

### 1a. Write the type-test file FIRST (red — module doesn't exist yet)

`tests/transition-editor-types.test-d.ts`. Import from `@/components/ui/transition-editor/transition-editor.types`. Sections:

**TransitionLiteral accept:**
- `"opacity 200ms ease-in"`, `"transform 0.3s 100ms ease-out"`, `"all 200ms"`, `"200ms"` (duration only, property defaults to all), `"opacity 200ms 100ms ease allow-discrete"`, `"color 100ms cubic-bezier(0.4, 0, 0.2, 1)"`, multi-layer `"opacity 200ms ease, transform 0.3s ease-out"`, `"none"`.

**TransitionLiteral reject (`toBeNever`):**
- `"opacity 200ms 100ms 50ms ease"` (3 times), `"opacity ease ease-in"` (2 easings), `"opacity color 200ms"` (2 idents/props), `"opacity 200ms allow-discrete allow-discrete"` (doubled behavior), `"opacity 200ms wobblezzz @x"` (the `@x` token fails ident chars → unknown), `"opacity 200ms cubic-bezier(2, 0, 0, 0)"` (bad easing via EasingLiteral), `"opacity calc(200ms + 1s)"` (calc undecidable), `""` (empty), `"opacity 200ms, color 200ms 100ms 50ms"` (one bad layer fails list).

**AnimationLiteral accept:**
- `"spin 1s ease-in-out infinite"`, `"slide 1s 200ms ease 3 alternate both paused"`, `"1s"`, `"pulse 2s infinite alternate"`, multi-layer, `"none"`.

**AnimationLiteral reject:**
- `"spin 1s 2 3"` (2 iteration counts), `"spin alternate reverse"` (2 directions), `"spin 1s up"` (unknown), `"spin 1s steps(0)"` (bad easing — steps n must be positive), `"spin calc(1s)"` (calc), `""` (empty).

**Per-layer validators:** `TransitionLayerLiteral<"opacity 200ms ease">` → literal; `<"a, b">` → never (a comma-list is not one layer). Same for `AnimationLayerLiteral`.

**Call-site helpers:** `cssTransition("opacity 200ms ease-in")` returns the literal; `@ts-expect-error` on `cssTransition("opacity 200ms 100ms 50ms ease")`, `cssTransition("opacity calc(1s)")`. `cssAnimation("spin 1s infinite")` returns literal; `@ts-expect-error` on `cssAnimation("spin 1s 2 3")`.

**Utility + suggestion + state:** `LayersOf<"a 1s, b 2s">` → `["a 1s", "b 2s"]`; `LayerCountOf<"a 1s, b 2s">` → 2; `LayerCountOf<"none">` → 0; `TransitionPropertiesOf<...>` (best-effort: tuple of property tokens — may weak-extract); `AnimationNamesOf<...>`; `TransitionString`/`AnimationString` `toMatchTypeOf`; `TransitionEditorStringMap["transition"]` matches `TransitionString`; `EditorMode` equals `keyof TransitionEditorStringMap`; `TransitionLayer`/`AnimationLayer` shape; `TransitionEditorState` discriminated on `mode`; component `onChange` return type per mode.

### 1b. Implement `transition-editor.types.ts` (green)

Structure (mirror box-shadow-editor.types.ts + calc-editor.types.ts):

```ts
import type { EasingLiteral } from "@/components/ui/easing-picker/easing-picker.types"
import type {
  IsNumber,
  IsTime,
  SplitByComma,
  SplitBySpace,
  Trim,
} from "@/lib/ridiculous-type-kit"

// --- token-kind predicates ---
type IsEasing<S extends string> =
  EasingLiteral<Trim<S>> extends never ? false : true

// weak <custom-ident>: non-empty, ident-safe chars, no leading digit
type IdentChar = /* letters + digits + - + _ via AllChars */
type IsIdent<S extends string> = ...   // uses AllChars<S, IdentChar> + not-leading-digit + non-empty

// transition keyword sets
type TransitionBehavior = "allow-discrete"
type TransitionPropKeyword = "all" | "none"

// animation keyword sets
type AnimationDirection =
  "normal" | "reverse" | "alternate" | "alternate-reverse"
type AnimationFillMode = "none" | "forwards" | "backwards" | "both"
type AnimationPlayState = "running" | "paused"
type IsIterationCount<S> = S extends "infinite" ? true : IsNumber<Trim<S>>
```

**Count-record fold (the engine).** Use a tuple-as-counter or a small flag record. Simplest robust form: fold tokens into an accumulator object of booleans/small counts and short-circuit to `false` on overflow/unknown. Because TS object-type accumulation in a recursive conditional is awkward, prefer **tuple-length counters threaded as type params**:

```ts
// Transition: thread counts [times, easings, props, behaviors] as unknown[] tuples.
type ClassifyTransition<
  Tokens extends string[],
  T extends unknown[] = [],   // <time> count
  E extends unknown[] = [],   // easing count
  P extends unknown[] = [],   // property count
  B extends unknown[] = [],   // behavior count
> = Tokens extends [infer H extends string, ...infer R extends string[]]
  ? Trim<H> extends TransitionBehavior
    ? B["length"] extends 1 ? false : ClassifyTransition<R, T, E, P, [...B, 0]>
    : IsTime<Trim<H>> extends true
      ? T["length"] extends 2 ? false : ClassifyTransition<R, [...T, 0], E, P, B>
      : IsEasing<H> extends true
        ? E["length"] extends 1 ? false : ClassifyTransition<R, T, [...E, 0], P, B>
        : Trim<H> extends TransitionPropKeyword
          ? P["length"] extends 1 ? false : ClassifyTransition<R, T, E, [...P, 0], B>
          : IsIdent<Trim<H>> extends true
            ? P["length"] extends 1 ? false : ClassifyTransition<R, T, E, [...P, 0], B>
            : false   // unknown token
  : true   // all tokens classified within caps
```

Animation analog `ClassifyAnimation` threads `[times, easings, iter, dir, fill, play, name]`; precedence per spec §3.2 (time → infinite/number iter → direction → fill → play → easing → ident name). Note: a fold needs an **empty-layer guard** (zero tokens) → `false` (a layer with no tokens is invalid); enforce by checking the top-level layer is non-empty before classify, OR require `Tokens extends []` at entry → `false`. Simplest: in the per-layer validator, `SplitBySpace` of a non-empty trimmed layer yields ≥1 token; guard `Tokens extends [] ? false : Classify...`.

```ts
export type TransitionLayerLiteral<S extends string> =
  SplitBySpace<Trim<S>> extends infer Parts extends string[]
    ? Parts extends []
      ? never
      : ClassifyTransition<Parts> extends true ? S : never
    : never

// depth-capped layer fold (box-shadow precedent, cap 32)
type ValidateTransitionLayers<Layers extends string[], Depth extends unknown[] = []> =
  Layers extends [infer H extends string, ...infer Rest extends string[]]
    ? Depth["length"] extends 32
      ? Trim<H> extends "" ? false : ValidateTransitionLayers<Rest, Depth>
      : TransitionLayerLiteral<H> extends never
        ? false
        : ValidateTransitionLayers<Rest, [...Depth, 0]>
    : true

export type TransitionLiteral<S extends string> =
  Trim<S> extends "none" ? S
  : Trim<S> extends "" ? never
  : SplitByComma<Trim<S>> extends infer L extends string[]
    ? L extends [] ? never : ValidateTransitionLayers<L> extends true ? S : never
    : never

export const cssTransition = <S extends string>(value: S & TransitionLiteral<S>): S => value
```

Same shape for `AnimationLayerLiteral` / `AnimationLiteral` / `cssAnimation`.

**Suggestion strings (permissive, like box-shadow):**
```ts
export type TransitionLayerString = `${string} ${string}` | `${string}`   // keep permissive; strict is the gate
export type TransitionString = TransitionLayerString | `${TransitionLayerString}, ${string}` | "none"
export type AnimationString = ... | "none"
export interface TransitionEditorStringMap {
  transition: TransitionString
  animation: AnimationString
}
export type EditorMode = keyof TransitionEditorStringMap
```
> Note: keep `TransitionString`/`AnimationString` permissive enough that all accept-case literals `toMatchTypeOf` (avoid `${string} ${string}` excluding the single-token `"200ms"` / `"none"` — include a bare-`${string}` arm or special-case `none`). The strict tier is the real gate; the suggestion union only needs to *contain* valid strings, mirroring box-shadow's permissive `BoxShadowString`.

**Utility types:** `LayersOf<S>` (`Trim<S> extends "none" | "" ? [] : SplitByComma<Trim<S>>`), `LayerCountOf<S> = LayersOf<S>["length"]`. `TransitionPropertiesOf` / `AnimationNamesOf`: best-effort tuple extraction of the ident token per layer — acceptable to weak-extract (fold each layer's tokens, pick the ident-classified one) or, if it bloats compile, document as a simpler `LayersOf`-derived shape. Keep cheap.

**Internal state:** export `TransitionLayer`, `AnimationLayer`, `AnimationDirection`/`FillMode`/`PlayState` (as exported string unions), and:
```ts
export type TransitionEditorState =
  | { mode: "transition"; layers: TransitionLayer[] }
  | { mode: "animation"; layers: AnimationLayer[] }
```

**Verify Task 1:** type-tests green via `pnpm test` (typecheck project picks up `*.test-d.ts`). Watch `tsc` time. **Commit:** `feat: transition-editor strict type tier (transition + animation classification)`.

---

## Task 2 — Runtime helpers: `transition-editor.helpers.ts` + parse/format tests

### 2a. Write `tests/transition-editor-parse.test.ts` + `tests/transition-editor-format.test.ts` (red)

Parse: classify-by-kind both modes, `none`/empty → `[]`, reject (null) on excess cardinality / unknown token, `calc()`/`var()` kept verbatim (classified as time-ish opaque? — decide: an opaque `calc(...)` in a time slot is accepted by runtime and stored as duration/delay positionally), weak ident, `defaultTransitionLayer`/`defaultAnimationLayer`, `layerCount`. Format: canonical order, round-trip, empty → `none`.

### 2b. Implement `transition-editor.helpers.ts` (green)

- `splitTopLevel(src, sep)` paren-aware (copy box-shadow's).
- `splitLayers`, `splitTokens`.
- Token classifiers (runtime mirrors): `isTimeish` (`/^[\d.]+(s|ms)$/i` or opaque `calc|var|min|max|clamp|env(`), `isNumberish`, `isEasingish` (matches keyword set or `cubic-bezier(`/`steps(`/`linear(`), `isIdent` (weak), keyword sets.
- `parseTransitionLayer(tokens): TransitionLayer | null` — fold by precedence (behavior → time → easing → prop-keyword → ident), enforce caps, first time = duration, second = delay. Empty tokens → null.
- `parseAnimationLayer(tokens): AnimationLayer | null` — fold by precedence (time → infinite/number iter → direction → fill → play → easing → ident name), caps, positional duration/delay.
- `parseTransition` / `parseAnimation` (none/empty → `[]`, any null layer → null).
- `layerToTransitionCss` / `layerToAnimationCss` — canonical order (spec §4); `formatTransition` / `formatAnimation` (empty → `none`).
- `layerCount(mode, src)`, `defaultTransitionLayer()`, `defaultAnimationLayer()`.
- `ParseResult` facade.

**Verify:** parse/format suites green. **Commit:** `feat: transition-editor runtime parse + format helpers`.

---

## Task 3 — Component: `transition-editor.tsx` + `index.ts` + `tests/transition-editor.test.tsx`

### 3a. Write `tests/transition-editor.test.tsx` (red)

jsdom tests per spec §7: panel rows per layer (both modes), edit time/property/name emits string, allow-discrete toggle, direction/fill/play selects, add/remove, `value="none"`, popover trigger count+mode, preview applies value + play/replay re-triggers (assert handler fires / target carries the style), no controls when `onChange` omitted, `cssTransition`/`cssAnimation` runtime passthrough.

### 3b. Implement `transition-editor.tsx` (green)

Mirror box-shadow-editor.tsx. `"use client"`. Components: `TransitionEditor` (popover), `TransitionEditorPanel` (inline, parser-backed state + `lastEmittedRef` resync), `TransitionLayerRow` (mode-branched fields), `TimeField` (UnitInput wrapper, s↔ms, opaque passthrough), `AddLayerButton`, `TransitionPreview` (target with inline `transition`/`animation` style + `<style>` `@keyframes` + play/replay button + duration scrubber via UnitInput). Embed `<EasingPicker value={layer.easing ?? "ease"} onChange={...}/>` for the easing token. Native `<select>` for direction/fill/play, datalist for property suggestions. A11y: indexed labels, `aria-pressed`, real buttons.

### 3c. Write `index.ts` barrel

Export components + their `*Props` + helpers + all type exports (`TransitionLiteral`, `AnimationLiteral`, `TransitionLayerLiteral`, `AnimationLayerLiteral`, `cssTransition`, `cssAnimation`, suggestion strings, map, `EditorMode`, utility types, `TransitionLayer`/`AnimationLayer`/`TransitionEditorState`, `ParseResult`).

**Verify:** component suite green; full `pnpm test`. **Commit:** `feat: transition-editor components + barrel`.

---

## Task 4 — Demo wiring

- `src/examples/transition-editor/{basic-usage,tier-casual,tier-intellisense,tier-strict,api-reference,live-preview}.tsx` (mirror box-shadow examples; strict uses `@ts-expect-error` for both modes; live-preview is the animated showcase with play/replay + inline `@keyframes`, showing both a transition and an animation target).
- `src/pages/transition-editor/page.tsx` (Layout + SectionHeaders + examples + InstallCta).
- `pages/transition-editor/{index.html,main.tsx}` (copy box-shadow's, retitle).
- `vite.config.ts`: append `"transition-editor"` MPA input.
- `pnpm nav:build`.

**Verify:** `pnpm typecheck` (catches example type errors) + `pnpm exec biome check`. **Commit:** `feat: transition-editor demo page, examples, MPA entry`.

---

## Task 5 — Registry + coverage + final green

- `registry.json`: add `transition-editor` `registry:ui` item (registryDependencies: `ridiculous-type-kit`, `easing-picker`, `unit-input`, `button`, `popover`, `input`, `label`, `select`; the 4 files); add `transition-editor.json` URL to `all` + update `all` description.
- `pnpm registry:build` (regenerates `public/r/*.json` — gitignored, do NOT commit).
- `vitest.config.ts`: add `"src/components/ui/transition-editor/**"` to `coverage.include`.
- Run `pnpm nav:build` then **`pnpm pr:check`** until green (typecheck + biome + vitest incl. type-tests + coverage thresholds 90/85/90/90).

**Commit:** `feat: register transition-editor + coverage include` (commit `registry.json`, `vite.config.ts`, `vitest.config.ts`; NOT `public/r/`).

---

## Commit discipline

- Each task = one commit, tree typecheck-clean at every commit.
- Biome `pnpm exec biome check` (fix) before each commit.
- Trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Do NOT merge / switch branches. If low on context, stop at a typecheck-clean commit and report remaining at file granularity.
