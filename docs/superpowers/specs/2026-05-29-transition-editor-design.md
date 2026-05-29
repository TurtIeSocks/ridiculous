# transition-editor — Component Design Spec

**Date:** 2026-05-29
**Phase:** 7 of 11 (per `2026-05-29-ridiculous-component-roadmap-design.md` §3)
**Status:** Approved for implementation (autonomous phase-lead; human asleep, all calls delegated)
**Reuses:** `ridiculous-type-kit`, `easing-picker` (`EasingLiteral` + `<EasingPicker/>` UI), `unit-input` (`<time>` entry)

---

## 1. Overview

`transition-editor` edits **two** CSS shorthands that share a grammar shape — `transition` and `animation` — selected by a `mode?: "transition" | "animation"` prop (default `"transition"`). Both are **comma-separated layer lists**; each layer is a set of **space-separated tokens** that are *largely order-independent within the layer* (CSS classifies each token by KIND, not by position). This is the namesake flex: the strict tier classifies each layer's tokens by kind and checks per-kind cardinality, rejecting unknown tokens or excess cardinality to `never`.

This mirrors the **inverse-nesting** pattern proven by `box-shadow-editor` (Phase 6) and `filter-builder` (Phase 3): split by comma into layers, split each layer by space into tokens, classify. The novelty over box-shadow is that box-shadow's tokens are *positional* (x, y, blur, spread are ordered lengths); transition/animation tokens are *kind-classified and order-free* (a `<time>` is a `<time>` wherever it appears; the first time is duration, the second is delay).

It reuses `easing-picker`'s `EasingLiteral<S>` to validate the `<easing-function>` token at the type level, `<EasingPicker/>` as the per-layer easing UI, and `unit-input` for `<time>` (duration / delay) entry. The live-preview example renders a React element that actually transitions / animates with the built value, with a play / replay button and demo `@keyframes`.

```
transition mode:
  "opacity 200ms ease-in"                          → the literal
  "transform 0.3s 100ms ease-out allow-discrete"   → the literal
  "all 200ms linear, color 100ms ease"             → the literal (2 layers)
  "opacity 200ms 100ms 50ms ease"                  → never (3 times)
  "opacity 200ms wobble"                           → never (unknown token)

animation mode:
  "spin 1s ease-in-out infinite"                   → the literal
  "1s 200ms ease 3 alternate both paused slide"    → the literal
  "spin 1s 2 3"                                     → never (2 iteration counts)
  "spin 1s up"                                      → never (unknown token)
```

---

## 2. Contract conformance (roadmap §5)

| §5 requirement | This component |
|---|---|
| File layout | `transition-editor.tsx` (components, single file) + `.types.ts` + `.helpers.ts` + `index.ts` |
| 3-tier model | casual `string`; IntelliSense `TransitionString` / `AnimationString` unions (also `onChange` return); strict `TransitionLiteral<S>` / `AnimationLiteral<S>` + `cssTransition` / `cssAnimation` call-site helpers |
| Strict validators | `TransitionLiteral<S>`, `AnimationLiteral<S>`, plus per-layer `TransitionLayerLiteral<S>` / `AnimationLayerLiteral<S>` |
| Call-site helpers | `cssTransition`, `cssAnimation` (mirror `cssBoxShadow` / `color` / `easing`) |
| Suggestion strings | `TransitionString`, `AnimationString` + `TransitionStringMap` / `AnimationStringMap` (keyed by `mode`) → `TransitionEditorStringMap` + `EditorMode` key |
| Utility types | `LayersOf<S>`, `LayerCountOf<S>`, `ModeOf<...>` analog → `TransitionPropertiesOf<S>`, `AnimationNamesOf<S>` |
| Internal state | exported discriminated union on `mode` — `TransitionEditorState` = `{ mode: "transition"; layers: TransitionLayer[] }` \| `{ mode: "animation"; layers: AnimationLayer[] }` |
| Controlled-only | required `value` + `onChange` |
| Two top-level exports | `<TransitionEditor/>` (popover) + `<TransitionEditorPanel/>` (inline) |
| Sub-components exported | `TransitionLayerRow`, `AddLayerButton`, `TransitionPreview` (+ helper rows) |
| Testing | `*-types.test-d.ts` (accept+reject, both modes), `-parse.test.ts`, `-format.test.ts`, `.test.tsx` |
| Coverage | add `src/components/ui/transition-editor/**` to `vitest.config.ts` `coverage.include` |
| Registry | `registry:ui` item with `registryDependencies` + add to `all` bundle |
| Demo / nav | MPA entry + page + examples + `pnpm nav:build` |

---

## 3. The type flex (the product)

The strict tier is the spectacle. CSS shorthands classify space-separated tokens by **kind** within each comma layer. We split (kit `SplitByComma` → `SplitBySpace`, paren-aware so `cubic-bezier(0.4, 0, 0.2, 1)` stays one token), then **fold over the tokens accumulating a per-kind count record**, rejecting on an unknown token or any count exceeding its cap.

### 3.1 `TransitionLiteral<S>` — per-layer token kinds

Per layer, tokens drawn from:

- **`<time>`** — at most **2** (first = duration, second = delay). Validate via kit `IsTime<S>`.
- **`<easing-function>`** — at most **1**. Validate via `EasingLiteral<Trim<Token>> extends never ? false : true`.
- **`<single-transition-property>`** — at most **1**. One of `all` | `none` | a `<custom-ident>` (a non-keyword, non-time, non-easing identifier — see §3.3).
- **`allow-discrete`** — at most **1** (a `<transition-behavior>` flag).

Reject any **unknown token** or **excess cardinality** → `never`. On success keep the literal `S`.

The classification order inside the fold matters because the property slot is the catch-all `<custom-ident>`. Token classification precedence (first match wins):

1. `allow-discrete` (exact keyword)
2. `<time>` (`IsTime`)
3. `<easing-function>` (`EasingLiteral` non-never) — checked **before** property so `ease`, `ease-in`, `linear`, `step-start` etc. are counted as easing keywords, not as `<custom-ident>` properties
4. `all` / `none` (the property keywords)
5. otherwise: a candidate `<custom-ident>` property — accept as the (single) property slot. Reject if it contains characters disqualifying it as an ident (see §3.3 — weak validation), or if the property slot is already filled.

> **Easing-vs-property ambiguity (documented):** A bare ident like `ease` is both a valid CSS easing keyword *and*, in principle, a `<custom-ident>` property name. We resolve it as **easing** (precedence 3) — matching how every browser tokenizer treats the CSS-wide easing keywords. So `transition: ease 200ms` is read as "transition all properties with the `ease` timing function," which is the real CSS interpretation (`ease` is not a property name). This is a deliberate, documented call.

### 3.2 `AnimationLiteral<S>` — per-layer token kinds

Per layer, tokens drawn from:

- **`<time>`** — at most **2** (duration, delay). `IsTime`.
- **`<easing-function>`** — at most **1**. `EasingLiteral`.
- **`<single-animation-iteration-count>`** — at most **1**: a `<number>` (kit `IsNumber`) **or** `infinite`.
- **`<single-animation-direction>`** — at most **1**: `normal` | `reverse` | `alternate` | `alternate-reverse`.
- **`<single-animation-fill-mode>`** — at most **1**: `none` | `forwards` | `backwards` | `both`.
- **`<single-animation-play-state>`** — at most **1**: `running` | `paused`.
- **`<keyframes-name>`** — at most **1**: a `<custom-ident>` ident (the catch-all, same shape as the transition property slot).

Reject unknown / excess → `never`. Token classification precedence (first match wins):

1. `<time>` (`IsTime`)
2. `infinite` → iteration count
3. `<number>` (`IsNumber`, no unit) → iteration count
4. direction keyword set
5. fill-mode keyword set
6. play-state keyword set
7. `<easing-function>` (`EasingLiteral`) — easing keywords (`ease`, `linear`, …) classified here
8. otherwise: `<keyframes-name>` `<custom-ident>` (the single name slot)

> **`none` ambiguity (documented):** In `animation`, `none` is the fill-mode keyword *and* could be the keyframes-name `none` (meaning "no animation"). We classify a bare `none` as **fill-mode** (precedence 5) for the per-token fold — i.e. `animation: none` strict-parses as a layer with fill-mode `none` and no name. This is acceptable for an editor (a name-less layer is a valid partial shorthand); the runtime parser makes the same call. Documented, not a bug.

> **`normal` overlap:** `normal` is an animation direction; it is not a fill-mode/play-state/ident conflict, so no special handling.

### 3.3 `<custom-ident>` weak validation (documented deferral)

A full `<custom-ident>` grammar (must not start with a digit, may not be a CSS-wide keyword, escapes, etc.) is more than the type budget warrants for the *single* catch-all slot. We **weak-validate** the ident: it must be a **non-empty** token composed of ident-safe characters (letters, digits, `-`, `_`) and **not** start with a digit. This is enough to reject obvious garbage (`200ms` is already a time; `@x` fails the char check) while keeping `tsc` fast. The runtime parser applies the same weak rule. Precedent: `LinearLiteral` weak-validates `linear()`, `OklabLiteral` skips axis range-checks (roadmap §7).

> Anything reaching the catch-all has already failed every keyword/number/time/easing test, so the ident check is mostly a guard against punctuation. We accept the (vanishingly rare) case of an unusual-but-legal ident being over- or under-matched; the runtime parser is the tolerant source of truth the UI drives off.

### 3.4 Cardinality fold + depth cap

Per layer: fold tokens into a count record `{ time; easing; iter; dir; fill; play; behavior; prop/name }`; reject the moment a count would exceed its cap or a token matches nothing. Empty layer (no tokens) → `never`.

The comma layer-list fold is **depth-capped at 32 layers** (box-shadow precedent); past the cap the tail is weak-validated (each layer non-empty). The runtime parser validates fully regardless of count. `none` (the whole-value keyword) and empty string: `transition: none` and `animation: none` are valid whole-value keywords → keep `S`. Empty string → `never`.

### 3.5 What strict defers (documented in api-reference + types JSDoc)

- `<custom-ident>` is **weak-validated** (§3.3).
- `calc()` / `var()` inside any token → `never` (undecidable at compile time). Runtime parser accepts.
- Numeric magnitudes not range-checked (an iteration `<number>` may be negative at the type level — CSS clamps; runtime parser preserves the string). `<time>` sign not checked beyond `IsTime`'s shape.
- The two-`<time>` "first=duration, second=delay" ordering is a *count* check at the type level (≤2 times); the runtime parser assigns duration/delay positionally.
- Layer count beyond 32 weak-validated.

---

## 4. Runtime helpers (`transition-editor.helpers.ts`)

The full parser — superset of the strict tier. Tolerant: keeps `calc()`/`var()` verbatim, accepts the same weak idents, classifies by the same kind precedence. Single source of truth for the UI.

- `parseTransition(src: string): TransitionLayer[] | null` — `none`/empty → `[]`; `null` on unknown token / excess cardinality / syntax error.
- `parseAnimation(src: string): AnimationLayer[] | null` — same contract.
- `formatTransition(layers: TransitionLayer[]): string` / `formatAnimation(...)` — canonical re-serialization; empty → `none`. Canonical token **order** on output (CSS allows any order but a canonical emit is friendlier): transition → `property duration delay easing allow-discrete` (omitting absent); animation → `duration delay easing iteration-count direction fill-mode play-state name`.
- `layerCount(mode, src): number` — runtime mirror of `LayerCountOf` (invalid → 0).
- `defaultTransitionLayer()` / `defaultAnimationLayer()` — seed a fresh layer (transition: `{ property: "all", duration: "200ms", easing: "ease" }`; animation: `{ name: "slide", duration: "1s", easing: "ease", iterationCount: "1" }`).
- Paren-aware `splitTopLevel` (runtime mirror of the kit combinator) so functional easings survive the comma/space split.
- `ParseResult` facade interface (mirrors box-shadow).

Internal state records (exported from `.types.ts`, kept as strings since they carry units/idents):

```ts
export interface TransitionLayer {
  property?: string          // <single-transition-property> | "all" | "none"
  duration?: string          // <time>
  delay?: string             // <time>
  easing?: string            // <easing-function>
  allowDiscrete?: boolean    // <transition-behavior> flag
}

export interface AnimationLayer {
  name?: string              // <keyframes-name>
  duration?: string          // <time>
  delay?: string             // <time>
  easing?: string            // <easing-function>
  iterationCount?: string    // <number> | "infinite"
  direction?: AnimationDirection
  fillMode?: AnimationFillMode
  playState?: AnimationPlayState
}
```

---

## 5. Components (`transition-editor.tsx`)

Mirrors box-shadow-editor structure. Single file. `"use client"`.

- **`<TransitionEditor mode? value onChange className? aria-label? />`** — popover-wrapped trigger (Button) showing `{count} {layer|layers}` + a mode badge + truncated value; opens `<TransitionEditorPanel/>`.
- **`<TransitionEditorPanel mode? value onChange className? aria-label? />`** — inline fieldset: a row per layer, an `AddLayerButton`, a `LiveString` (code block), and a `<TransitionPreview/>`. Holds `TransitionLayer[]` | `AnimationLayer[]` state via the parser, resync-from-external-value with a `lastEmittedRef` (box-shadow precedent).
- **`<TransitionLayerRow mode layer onChange onRemove index? />`** — one editable layer:
  - **transition:** a property text input (datalist suggesting `all`/`none`/common props), two `<UnitInput unit="ms">`-style time editors (duration required, delay optional), a `<EasingPicker>` for the easing token, an `allow-discrete` toggle, a remove button.
  - **animation:** a name text input, duration + delay time editors, `<EasingPicker>`, an iteration-count input (number or `infinite` toggle), and `<select>`s for direction / fill-mode / play-state, a remove button.
  - Internally splits into small exported helper components only where it helps readability; otherwise inline. To respect "no bare value prop on UnitInput for times," time slots use a `TimeField` wrapper around `<UnitInput>` that flips unit `s`↔`ms` and passes through raw `calc()`/`var()` like box-shadow's `ShadowLengthEditor` opaque path.
- **`<AddLayerButton onAdd className? />`** — appends a fresh layer (dashed button), reused for both modes.
- **`<TransitionPreview mode value onChange? property? className? />`** — the showcase. A target element with the built `transition` or `animation` applied via inline `style`, a **play / replay** button that re-triggers the effect (toggle a target state for transition; restart the animation by clearing+reassigning `animationName` / bumping a `key`), and an inline `<style>` defining demo `@keyframes` (`slide`, `pulse`, `spin`). Per-layer easing surfaced via `<EasingPicker>` in the row; the elevation-style scrubber is replaced by a duration scrubber via `<UnitInput>`. `onChange` optional (preview-only when omitted, mirroring box-shadow).

A11y: keyboard + ARIA parity — toggles `aria-pressed`, labelled controls (`offset`-style indexed labels: `duration 1`, `easing 2`), the play button is a real `<button>`, selects are labelled.

---

## 6. Demo, registry, nav

- **MPA entry:** `pages/transition-editor/{index.html,main.tsx}` (copy box-shadow's; title "Transition + Animation Editor — ridiculous").
- **Page:** `src/pages/transition-editor/page.tsx` (Layout + SectionHeaders + examples + `InstallCta args="add https://turtiesocks.github.io/ridiculous/r/transition-editor.json"`).
- **Examples** (`src/examples/transition-editor/`): `basic-usage`, `tier-casual`, `tier-intellisense`, `tier-strict`, `api-reference`, and `live-preview` (the animated showcase with play/replay + `@keyframes`). The strict example uses `@ts-expect-error` on both transition and animation rejects.
- **`vite.config.ts`:** add the `"transition-editor"` MPA input (append-only).
- **`registry.json`:** add a `transition-editor` `registry:ui` item; `registryDependencies`: `ridiculous-type-kit`, `easing-picker`, `unit-input`, `button`, `popover`, `input`, `label`, `select` (shadcn bases, install-time, mirroring box-shadow's pattern of listing un-vendored shadcn primitives). Add `transition-editor.json` URL to the `all` bundle and update the `all` description. Run `pnpm registry:build` (regenerates `public/r/*.json`, **gitignored — do not commit**).
- **`pnpm nav:build`** picks up the page from registry.json.

---

## 7. Testing

- **`tests/transition-editor-types.test-d.ts`** — accept + reject for **both** modes:
  - transition: accept 1–4 token layers (property/duration/delay/easing/allow-discrete combos), multi-layer comma lists, `none`; reject 3 `<time>`, 2 easings, 2 properties, doubled `allow-discrete`, unknown token, `calc()`, invalid easing (`cubic-bezier(2, 0, 0, 0)` → never via `EasingLiteral`), empty.
  - animation: accept duration/delay/easing/iteration/direction/fill/play/name combos, `infinite`, multi-layer; reject 2 iteration counts, 2 directions, unknown token, invalid easing, `calc()`, empty.
  - call-site `cssTransition` / `cssAnimation` accept + `@ts-expect-error` rejects.
  - utility types (`LayersOf`, `LayerCountOf`, `TransitionPropertiesOf`, `AnimationNamesOf`), suggestion unions + map + `EditorMode`, internal state shape, component `onChange` return type.
- **`tests/transition-editor-parse.test.ts`** — `parseTransition` / `parseAnimation`: kind classification, cardinality rejection, `none`/empty → `[]`, `calc()` tolerance, weak ident, `defaultTransitionLayer`/`defaultAnimationLayer`, `layerCount`.
- **`tests/transition-editor-format.test.ts`** — `formatTransition` / `formatAnimation` canonical order, round-trip parse∘format, empty → `none`.
- **`tests/transition-editor.test.tsx`** — jsdom: panel renders one row per layer (both modes), editing a time/property/name emits the updated string, toggling allow-discrete, switching direction/fill/play selects, add/remove layer, `value="none"` empty state, the popover trigger shows the count + mode, the preview applies the value to the target and the play/replay button re-triggers, preview renders no controls when `onChange` omitted.
- **`vitest.config.ts`:** add `"src/components/ui/transition-editor/**"` to `coverage.include`. Thresholds stay 90/85/90/90.

---

## 8. Assumptions (every call made on the human's behalf)

1. **Default `mode`:** `"transition"` (the property the component is named first for; matches the §2 portfolio entry "transition + animation").
2. **`mode` is a static prop, not switchable in-UI.** The editor renders for one mode at a time; switching modes is a parent concern (re-render with a different `mode`). State is keyed by mode in the discriminated union. (Rationale: a transition layer and an animation layer have different fields; an in-UI toggle would need a value migration policy that adds scope without spectacle value. The preview/examples show both modes side by side instead.)
3. **Strict tier classifies by token KIND with the precedence in §3.1/§3.2.** Easing keywords win over `<custom-ident>`; `none` classifies as fill-mode in animation. Both documented as deliberate.
4. **`<custom-ident>` (transition property / animation keyframes-name) is weak-validated** (non-empty, ident-safe chars, no leading digit) — §3.3. Full `<custom-ident>` grammar deferred to the runtime parser. Justified by type-budget (roadmap §7) and the slot being a single catch-all.
5. **`<easing-function>` token validated by reusing `EasingLiteral<S>`** from `easing-picker.types` (the brief's explicit REUSE directive). An invalid bezier/steps inside a layer → the layer → `never`.
6. **`<time>` validated by kit `IsTime`** (`s`/`ms`); `<number>` by kit `IsNumber`; no magnitude range-checks (CSS clamps iteration counts; negative times are a runtime concern). The duration-before-delay ordering is a count constraint at the type level (≤2 times), positional at runtime.
7. **`calc()` / `var()` → `never` at strict**, accepted by the runtime parser (box-shadow precedent).
8. **Layer-list recursion capped at 32**; tail weak-validated (box-shadow precedent).
9. **Canonical output token order** (§4) — transition `property duration delay easing allow-discrete`; animation `duration delay easing iteration-count direction fill-mode play-state name`. CSS is order-free within a layer, but a deterministic emit is friendlier and keeps round-trip tests stable. (Input order is irrelevant — both parser and strict tier are order-free.)
10. **`onChange` return type** is the open suggestion union (`TransitionString` / `AnimationString` per mode via the string map) — no per-state narrowing (box-shadow precedent; there is no `basis`-style discriminant to narrow on beyond `mode`, which the map already keys).
11. **UI uses native `<select>` + native controls + datalist + reused `<EasingPicker>`/`<UnitInput>`** — no new shadcn primitive *files* vendored locally; `label`/`select` listed as install-time `registryDependencies` exactly as box-shadow does. (Keeps the modify-existing-files surface to the four allowed files; matches the shipped convention.)
12. **Live-preview demo defines `@keyframes` inline via a `<style>` element** in the example (the brief requires it; no global CSS edit). Demo keyframes: `slide`, `pulse`, `spin`.
13. **Play/replay semantics:** transition mode toggles a boolean target state (e.g. translateX 0 ↔ 120px) so the transition fires on each press; animation mode restarts by remounting the target via a `key` bump (the reliable cross-browser animation-restart trick), which works under inline styles without reading computed layout.
14. **Preview duration control:** a `<UnitInput>` scrubber that scales the first layer's duration (analogous to box-shadow's elevation scrubber), keeping the "scrub a number, watch it animate" interaction the roadmap favors.
15. **`allow-discrete`** is modeled as a per-layer boolean (`<transition-behavior>`); it only exists in transition mode. Animation has no equivalent flag.
16. **No `transition-behavior` as a separate property** — `allow-discrete` is folded into the transition layer per the modern shorthand (CSS Transitions L2 allows it in the `transition` shorthand). Documented as the single behavior flag.

---

## 9. Risks

- **`tsc` budget from two parallel folds + `EasingLiteral` reuse.** `EasingLiteral` is already a 4-arm union validator; calling it per-token across two grammars could be costly. Mitigation: classify cheaply first (keyword/time/number checks are shallow), only invoke `EasingLiteral` at the easing-precedence step, cap layers at 32, weak-validate idents. Measure `tsc` wall-time after type-tests land; if it spikes, narrow `EasingLiteral` use to a cheaper "looks-like-an-easing" pre-check + full validation only on the matched token (it already is the matched-token path). Fallback documented in §3.5.
- **Token-kind precedence ambiguities** (`ease` as easing-vs-ident, `none` as fill-mode-vs-name) — resolved deterministically and documented (§3.1/§3.2); type-tests pin the chosen interpretation so a future change is caught.
- **Animation restart reliability in jsdom** — the `key`-bump remount is testable (assert the target re-renders / a new node); we assert the button calls its handler and the applied style carries the value rather than asserting real animation frames (jsdom has no animation clock).
