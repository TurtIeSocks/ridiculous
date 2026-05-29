# color-function — Component Design Spec

**Date:** 2026-05-29
**Phase:** 9 of 11 (per roadmap §3 — "color-fn builder")
**Status:** Draft for implementation
**Roadmap contract:** `docs/superpowers/specs/2026-05-29-ridiculous-component-roadmap-design.md` §5 + §7
**Reuses:** `ridiculous-type-kit`, `color-picker` (`ColorLiteral`, `<ColorPicker/>`)

---

## 1. Overview

`color-function` edits **modern CSS color functions** at all three tiers (casual / IntelliSense / strict). The namesake type-level flex is **strict-tier dispatch on the function name** via `ParseFunction`, branching into three independent grammars selected by an optional `mode` prop:

| `mode` | Function family | Grammar |
|--------|-----------------|---------|
| `"color-mix"` | `color-mix(in <space> [<hue-method>]?, <color> <pct>?, <color> <pct>?)` | interpolation-space + 2 weighted colors |
| `"relative"` | `<fn>(from <color> <c1> <c2> <c3> [/ <alpha>]?)`, `fn ∈ rgb\|hsl\|hwb\|lab\|lch\|oklab\|oklch\|color` | relative-color channel grammar |
| `"light-dark"` | `light-dark(<color>, <color>)` | exactly 2 colors |

`mode` is **optional**. When omitted, the strict validator `ColorFunctionLiteral<S>` accepts **any** of the three (a union); when set, the suggestion-string type narrows the `onChange` return and the editor UI shows only that family's controls. The strict validator is mode-agnostic by design (it dispatches on the literal text, not the prop) — `mode` is a UI + suggestion-string concern, mirroring how `filter-builder`'s mode is a render concern, not a validator concern.

This is a **CSS color value** (it resolves to a `<color>`), so it composes with everything that takes a color — and it reuses the color-picker's `ColorLiteral` for every nested color argument, exactly as `box-shadow-editor` and `filter-builder` do.

---

## 2. Strict tier — the grammar (the product)

The strict validator is `ColorFunctionLiteral<S>`, composed from three sub-validators. Each resolves to `S` on success, `never` on violation. `var(...)` is accepted **anywhere a `<color>` is expected** (a color may be a CSS variable). `calc(...)` inside numeric channels is accepted **leniently** in the relative-color tier (documented relaxation, §2.3 + §7).

### 2.1 `ColorMixLiteral<S>` — FULL validation

Shape: `color-mix(in <colorspace> [<hue-method>]?, <color> <percentage>?, <color> <percentage>?)`

1. Match `color-mix(<body>)`; the body splits by comma (paren-aware) into exactly **3 parts**.
2. **Part 1** is the interpolation spec: `in <colorspace>` or `in <colorspace> <hue> hue`.
   - `<colorspace>` ∈ the **14-member set**: `srgb | srgb-linear | display-p3 | a98-rgb | prophoto-rgb | rec2020 | lab | oklab | xyz | xyz-d50 | xyz-d65 | hsl | hwb | lch | oklch`.
   - The **4 cylindrical** spaces (`hsl | hwb | lch | oklch`) MAY carry a hue-interpolation method: `<method> hue` where `<method> ∈ shorter | longer | increasing | decreasing`. Rectangular spaces with a trailing hue method resolve to `never`.
3. **Parts 2 & 3** are each `<color>` with an **optional trailing `<percentage>`**: split the part by space (paren-aware); the head token(s) form the color, an optional final token is a `<percentage>`.
   - Color is validated via `ColorLiteral` **or** `var(...)`.
   - The percentage (when present) is validated via the kit's `IsPercentage`.

Rejects: wrong arity (not 3 comma parts), missing `in`, unknown colorspace, hue method on a rectangular space, hue method without the literal `hue` keyword, a non-`ColorLiteral`/`var` color, a non-percentage weight.

### 2.2 `LightDarkLiteral<S>` — FULL validation

Shape: `light-dark(<color>, <color>)`

1. Match `light-dark(<body>)`; the body splits by comma into exactly **2 parts**.
2. Each part is a `<color>` via `ColorLiteral` **or** `var(...)`. (No percentages, no `in`.)

Rejects: wrong arity, a non-`ColorLiteral`/`var` color.

### 2.3 `RelativeColorLiteral<S>` — validation with a documented channel relaxation

Shape: `<fn>(from <color> <c1> <c2> <c3> [/ <alpha>]?)` for `fn ∈ rgb | hsl | hwb | lab | lch | oklab | oklch | color`.

1. Match `<fn>(<body>)` where `fn` is one of the 8 relative-color function names.
2. The body MUST start with the `from` keyword (paren-aware space split → first token is `from`).
3. The **source color** is the next token group, validated via `ColorLiteral` **or** `var(...)`.
   - For `color(...)`-form relative colors the source-color grammar additionally permits the predefined-rgb / xyz colorspace ident form is **not** separately validated; `ColorLiteral` covers hex/functional and `var` covers variables. (See Assumptions.)
4. After the source color come the **channel tokens**: exactly **3** channel values, then an OPTIONAL `/ <alpha>`.
5. **Channel-token validation (the relaxation):** each channel token must be one of:
   - a **channel keyword** valid for that function's space (e.g. `oklch` → `l c h`, `rgb` → `r g b`, `lab` → `l a b`, `hsl` → `h s l`, `hwb` → `h w b`, `lch` → `l c h`, `oklab` → `l a b`),
   - a `<number>` (kit `IsNumber`),
   - a `<percentage>` (kit `IsPercentage`),
   - an **angle** (kit `IsAngle`) — for hue channels,
   - or `calc(...)` (accepted **leniently** — body not parsed).
   - The alpha (after `/`) accepts `<number>` | `<percentage>` | a channel keyword (`alpha`) | `calc(...)` | `none`.
   - `none` is accepted for any channel (CSS relative-color allows `none`).

   **Per-space channel-keyword strictness IS implemented** (it is affordable — a small per-function keyword set in a dispatch table). So `oklch(from red r g b)` (wrong keywords for `oklch`) resolves to `never`, while `oklch(from red l c h)` is accepted. This EXCEEDS the contract's "nice if affordable" bar.

   **Documented relaxation (per §7):** the validator does **not** range-check channel magnitudes, does not enforce that a hue channel is specifically an angle vs. a number (CSS permits a bare number for hue), does not parse `calc(...)` bodies (any balanced `calc(...)` token passes), and does not cross-check that channel keywords reference channels of the *source* color's space (CSS resolves the `from` color into the destination space, so `r`/`g`/`b` are always available in an `rgb()` relative color regardless of how the source was written). The runtime parser performs the same channel-token classification but is equally lenient on `calc`/magnitudes.

### 2.4 Top-level `ColorFunctionLiteral<S>`

```
ColorFunctionLiteral<S> =
  Trim<S> starts with "color-mix("   → ColorMixLiteral<S>
  Trim<S> starts with "light-dark("  → LightDarkLiteral<S>
  Trim<S> is one of the 8 relative fns "(…)" AND body starts with "from "
                                     → RelativeColorLiteral<S>
  otherwise                          → never
```

Dispatch is on the **leading function name** (paren-aware), so a relative `rgb(from …)` routes to `RelativeColorLiteral` while a plain `rgb(255 0 0)` (no `from`) routes to `never` (that is `color-picker`'s job, not this component's — this component edits the *function families* above, not bare color literals). This keeps the three grammars cleanly separated and the dispatch O(1).

### 2.5 Compile-time budget (per §7)

- No variadic recursion in any of the three grammars — each has a **fixed maximum token count** (color-mix: 3 comma parts × ≤2 space tokens; light-dark: 2; relative: `from` + color + 3 channels + optional `/ alpha` = ≤6 tokens). This is far cheaper than the box-shadow/transition layer-list folds; no depth cap is needed.
- The colorspace set (14) and channel-keyword sets are plain string unions — constant-time `extends` checks.
- `ColorLiteral` is the heaviest sub-check (it already ships and is used by box-shadow/filter); we call it at most 3× per value.

---

## 3. Three-tier typing model (§5.2)

1. **Casual** — `value: ColorFunctionString | (string & {})`. Any string; runtime parser handles it.
2. **IntelliSense** — suggestion-string unions (`ColorMixString`, `RelativeColorString`, `LightDarkString`, `ColorFunctionString`) + a `ColorFunctionStringMap` keyed by `mode`, and `ColorFunctionMode = keyof ColorFunctionStringMap`. These are the `onChange` return type; when `mode` is set the return narrows to `ColorFunctionStringMap[mode]`.
3. **Strict** — `ColorFunctionLiteral<S>` (+ the three sub-validators exported) and the call-site helper `cssColorFn`.

---

## 4. Required type surface (`color-function.types.ts`, §5.3)

- **Strict validators:** `ColorMixLiteral<S>`, `RelativeColorLiteral<S>`, `LightDarkLiteral<S>`, `ColorFunctionLiteral<S>`.
- **Call-site helper:** `export const cssColorFn = <S extends string>(value: S & ColorFunctionLiteral<S>): S => value`.
- **Suggestion strings:** `ColorMixString`, `RelativeColorString`, `LightDarkString`, `ColorFunctionString`; `ColorFunctionStringMap` (`{ "color-mix": ColorMixString; relative: RelativeColorString; "light-dark": LightDarkString }`); `ColorFunctionMode = keyof ColorFunctionStringMap`.
- **Utility types** (literal-level operators, in the spirit of `ModeOf`/`FunctionOf`):
  - `KindOf<S>` → `"color-mix" | "relative" | "light-dark" | never` (which family a literal is).
  - `MixSpaceOf<S>` → the interpolation colorspace of a `color-mix` literal (`never` if not a mix).
  - `RelativeFnOf<S>` → the function name of a relative-color literal (`never` otherwise).
  - `ColorsOf<S>` → tuple of the raw color-argument strings (`["#a", "#b"]` for light-dark / color-mix; `["red"]` source for relative).
- **Internal state:** an **exported discriminated union** `ColorFunctionState` keyed by `kind`:
  - `{ kind: "color-mix"; space: string; hue?: string; colorA: string; pctA?: string; colorB: string; pctB?: string }`
  - `{ kind: "relative"; fn: string; from: string; c1: string; c2: string; c3: string; alpha?: string }`
  - `{ kind: "light-dark"; light: string; dark: string }`

  Plus supporting exported unions: `MixColorSpace` (14), `HueMethod` (4), `RelativeFn` (8), and per-fn `ChannelKeywordsFor` is internal.

---

## 5. Runtime helpers (`color-function.helpers.ts`)

The tolerant superset of the strict tier. Single source of truth the UI drives off.

- `parseColorFunction(src: string): ColorFunctionState | null` — dispatch on the leading function name (paren-aware), parse into the discriminated union, or `null` on a syntax / arity / unknown-name error. Tolerant: keeps `calc()`/`var()` verbatim, accepts bare keyword colors (`red`) as color arguments (they are valid CSS even though not in `ColorLiteral`), lenient on channel magnitudes.
- `formatColorFunction(state: ColorFunctionState): string` — canonical re-serialization.
- `colorFunctionKind(src: string): ColorFunctionState["kind"] | null` — runtime mirror of `KindOf`.
- `defaultState(mode: ColorFunctionMode): ColorFunctionState` — seed a fresh value per mode.
- Paren-aware `splitTopLevel` (runtime mirror of the kit combinator), as in box-shadow/filter helpers.
- Constant tables: `MIX_COLOR_SPACES`, `CYLINDRICAL_SPACES`, `HUE_METHODS`, `RELATIVE_FNS`, `CHANNEL_KEYWORDS` (per-fn).
- `ParseResult` facade interface (matching sibling helpers).

---

## 6. Components (`color-function.tsx`, §5.6)

- `<ColorFunction/>` — **popover-wrapped**. Trigger shows a computed swatch (the produced string as `background`) + the truncated value. Controlled `value` + `onChange` + `mode?` + `className` + `aria-label`.
- `<ColorFunctionPanel/>` — **inline**, the same editor. Same props.
- **Exported sub-components** (named exports, for composition):
  - `<ColorMixEditor/>` — interpolation-space `<select>`, optional hue-method `<select>` (shown only for cylindrical spaces), two `<ColorPicker/>` color inputs, two mix-ratio range sliders (raw `<input type="range">`, 0–100%), each emitting an optional trailing `%`. A "swap ratio" affordance.
  - `<RelativeColorEditor/>` — relative-fn `<select>` (8 names), a from-color `<ColorPicker/>`, three channel editors (each a text `<input>` with the channel-keyword placeholder shown for the chosen fn, e.g. `l`/`c`/`h`), and an optional alpha channel editor.
  - `<LightDarkEditor/>` — two `<ColorPicker/>` swatches (light, dark).
  - `<ColorFunctionPreview/>` — the showcase: renders the produced string as a **computed background-color swatch** (a `<div>` with `style={{ background: value }}`), plus a `light-dark()` toggle that flips a `color-scheme` container so the `light-dark()` preview actually switches, and the live produced string in a `<code>`.
- **Mode behavior:** when `mode` is set, the panel renders only that family's editor. When `mode` is omitted, the panel renders a small `<select>` to choose the family (defaulting to whatever `parseColorFunction(value)` reports, else `"color-mix"`), then that family's editor.
- **Controls:** use the existing `button` / `popover` / `input` shadcn primitives plus **raw HTML `<select>` and `<input type="range">`** (the precedent across box-shadow / transition / filter / font — `select`/`slider`/`label` are declared as `registryDependencies` for downstream shadcn consumers but the in-repo code uses raw elements to stay typecheck-clean, since those modules are not vendored into this repo). Color inputs use `<ColorPicker native value onChange/>`.
- a11y: labelled controls, `aria-label` on the popover trigger, keyboard-operable sliders (native range inputs are), `role`/`aria-valuetext` parity where a custom control is introduced.

---

## 7. Demo, registry, navigation (§5.4)

- **MPA entry:** `pages/color-function/index.html` + `pages/color-function/main.tsx`; add the input to `vite.config.ts` `rollupOptions.input`.
- **Page:** `src/pages/color-function/page.tsx` (mirrors box-shadow page: SectionHeaders + examples grid + InstallCta).
- **Examples** (`src/examples/color-function/`): `basic-usage`, `tier-casual`, `tier-intellisense`, `tier-strict`, `api-reference`, plus a **`live-preview`** with result swatches — input colors via `<ColorPicker/>`, a colorspace `<select>` + mix-ratio slider for color-mix; a from-color + channel editors for relative; two swatches for light-dark; each showing the produced string + a computed preview swatch.
- **Registry:** add a `color-function` item to `registry.json` (`type: registry:ui`; `registryDependencies`: `ridiculous-type-kit`, `color-picker`, `button`, `popover`, `input`, `label`, `select`, `slider`); add to the `all` bundle. `pnpm registry:build` regenerates `public/r/*.json` (GITIGNORED — do not commit).
- **Nav:** `pnpm nav:build`.
- **Coverage:** add `src/components/ui/color-function/**` to `vitest.config.ts` `coverage.include`.

---

## 8. Testing (§5.5)

- **`tests/color-function-types.test-d.ts`** — accept + reject for all three families:
  - color-mix: accept valid space + hue-method + weighted colors; reject unknown space, hue method on rectangular space, wrong arity, bad color, bad weight.
  - relative: accept correct per-space channel keywords + numbers/percentages + optional alpha + `var`/`calc`/`none`; reject wrong channel keywords for the space, missing `from`, bad source color, wrong channel count.
  - light-dark: accept 2 colors / `var`; reject arity + bad color.
  - utility types (`KindOf`, `MixSpaceOf`, `RelativeFnOf`, `ColorsOf`), suggestion unions + map + `cssColorFn` call-site `@ts-expect-error` rejections, and the component `onChange` return type.
- **`tests/color-function-parse.test.ts`** — `parseColorFunction` round-trips + `null` on errors + tolerance (keyword colors, calc/var).
- **`tests/color-function-format.test.ts`** — `formatColorFunction` canonical output for each kind; `parse∘format` idempotence.
- **`tests/color-function.test.tsx`** (jsdom) — render `<ColorFunction/>` + `<ColorFunctionPanel/>`; mode switching; editing a color / space / ratio / channel emits the expected string; the preview swatch carries the value.

---

## 9. Deliverables (file granularity)

```
src/components/ui/color-function/
  color-function.tsx          # components + small render helpers
  color-function.types.ts     # validators, suggestion strings, util types, state union
  color-function.helpers.ts   # parse / format / dispatch tables
  index.ts                    # barrel
pages/color-function/{index.html, main.tsx}
src/pages/color-function/page.tsx
src/examples/color-function/{basic-usage,tier-casual,tier-intellisense,tier-strict,api-reference,live-preview}.tsx
tests/{color-function-types.test-d.ts, color-function-parse.test.ts, color-function-format.test.ts, color-function.test.tsx}
```

Modified existing files (allowed surface only): `registry.json` (append item + `all` bundle), `vite.config.ts` (MPA input), `vitest.config.ts` (`coverage.include` line), generated nav (via `pnpm nav:build`).

---

## 10. Assumptions (every call made autonomously)

The human delegated all decisions. Each judgement call:

1. **`mode` is a UI + suggestion-string concern, not a validator concern.** `ColorFunctionLiteral<S>` accepts any of the three families regardless of the runtime `mode` prop (TS generics can't see a runtime prop). When `mode` is set, `onChange`'s return narrows via `ColorFunctionStringMap[mode]` and the UI shows only that family. Rationale: matches the `filter-builder`/`box-shadow` precedent where mode is a render concern; a per-mode strict generic would need the call site to thread the mode as a type param, which the controlled `value`/`onChange` contract doesn't expose.
2. **Per-space channel-keyword strictness IS implemented** in the relative tier (the contract calls it "nice if affordable" — it is, via a small per-fn keyword union). Exceeds the minimum bar.
3. **Documented channel relaxation (per §7):** no magnitude range-checks; hue channels accept number OR angle (CSS allows bare numbers for hue); `calc(...)` channel tokens pass if balanced (body not parsed); `none` accepted for any channel/alpha; channel keywords are validated against the *destination* function's space, not cross-checked against the source color's space (correct per CSS resolution semantics).
4. **`var(...)` is accepted wherever a `<color>` is expected** (color-mix colors, light-dark colors, relative source color). A CSS variable is a legitimate color reference. `var(...)` is NOT separately accepted as a colorspace ident or a hue method (those are fixed keyword sets).
5. **Dispatch is on the leading function name only.** A bare `rgb(255 0 0)` with no `from` keyword is NOT in scope for this component (it's a plain color, color-picker's domain) and resolves to `never`. Only the `from`-prefixed relative form, `color-mix(`, and `light-dark(` are in scope.
6. **The 14-member colorspace set** is the CSS Color 5 `color-mix` interpolation set named in the task; `xyz` is treated as a distinct accepted token alongside `xyz-d50`/`xyz-d65` (CSS allows bare `xyz` ≡ `xyz-d65`).
7. **Cylindrical spaces** = exactly `hsl | hwb | lch | oklch` (the four polar spaces that carry a hue component); only these may take a `<hue-method> hue` suffix.
8. **Raw HTML `<select>` / `<input type="range">`** in the component (not vendored shadcn `select`/`slider`), matching every sibling component in this repo; `select`/`slider`/`label` still appear in `registryDependencies` so downstream shadcn installs pull them. This keeps the in-repo build typecheck-clean (those modules aren't present under `src/components/ui/`).
9. **`light-dark()` preview** flips a wrapper's `color-scheme` (`light`↔`dark`) so the browser actually resolves the function differently — the showcase for that mode.
10. **No new runtime dependencies** (roadmap §4.2). Only `@/components/ui/{button,popover,input,color-picker}`, `@/lib/utils`, and React.
11. **Single-file `.tsx`** per §5.1 (well under the 2000-line split threshold; expected ~600–800 lines).
12. **`ColorLiteral` is used un-parameterized** (`ColorLiteral<Trim<token>>`) — it is not colorspace-generic in `color-picker.types.ts`; the task's `ColorLiteral<S>` phrasing refers to passing the candidate string `S`, which is exactly its signature.
