# color-function — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-05-29-color-function-design.md`
**Approach:** TDD. Type-level tests first (the validators are the product), then runtime helpers, then component, then demo/registry/nav, then green `pnpm pr:check`.
**Commit cadence:** one commit per logical unit; every commit leaves the tree typecheck-clean.

---

## Task 1 — Strict type tier (`color-function.types.ts`) + type tests

**Test first:** `tests/color-function-types.test-d.ts` with `expectTypeOf` (vitest typecheck). Assert:

**color-mix accept** (→ itself):
- `ColorMixLiteral<"color-mix(in srgb, red, blue)">` — wait, `red`/`blue` are NOT in `ColorLiteral`. Strict tier rejects bare keyword colors (box-shadow precedent). So accept with hex/functional: `ColorMixLiteral<"color-mix(in srgb, #f00, #00f)">`.
- `ColorMixLiteral<"color-mix(in oklch, #f00 30%, oklch(0.5 0.1 240) 70%)">` (cylindrical + percentages).
- `ColorMixLiteral<"color-mix(in oklch shorter hue, #f00, #00f)">` (hue method on cylindrical).
- `ColorMixLiteral<"color-mix(in hsl longer hue, var(--a), var(--b))">` (var colors + hue method).
- `ColorMixLiteral<"color-mix(in display-p3, #f00 25%, #00f)">` (one pct only).

**color-mix reject** (`toBeNever`):
- unknown space: `color-mix(in foo, #f00, #00f)`.
- hue method on rectangular: `color-mix(in srgb shorter hue, #f00, #00f)`.
- hue method missing `hue` keyword: `color-mix(in oklch shorter, #f00, #00f)`.
- wrong arity (1 color): `color-mix(in srgb, #f00)`; (3 colors): `color-mix(in srgb, #f00, #00f, #0f0)`.
- missing `in`: `color-mix(srgb, #f00, #00f)`.
- bad color: `color-mix(in srgb, notacolor, #00f)`.
- bad weight: `color-mix(in srgb, #f00 30, #00f)` (no `%`).

**light-dark accept:** `LightDarkLiteral<"light-dark(#fff, #000)">`, `LightDarkLiteral<"light-dark(var(--l), oklch(0.2 0 0))">`.
**light-dark reject:** arity `light-dark(#fff)` / `light-dark(#fff, #000, #ccc)`; bad color `light-dark(white, #000)`.

**relative accept:**
- `RelativeColorLiteral<"oklch(from #f00 l c h)">` (correct keywords).
- `RelativeColorLiteral<"rgb(from var(--c) r g b)">`.
- `RelativeColorLiteral<"oklch(from #f00 0.5 0.1 240)">` (numeric channels).
- `RelativeColorLiteral<"oklch(from #f00 l c h / 50%)">` (alpha).
- `RelativeColorLiteral<"lab(from #f00 l a b / none)">` (none alpha).
- `RelativeColorLiteral<"oklch(from #f00 calc(l * 2) c h)">` (calc channel, lenient).
- `RelativeColorLiteral<"rgb(from #f00 none g b)">` (none channel).
- `RelativeColorLiteral<"hsl(from var(--c) h s l)">`, `hwb`, `lch`, `oklab`, `color(...)` form: `RelativeColorLiteral<"color(from #f00 srgb r g b)">` — NOTE: `color()` relative form has a colorspace ident after `from <color>`; decide handling (see Task-1 impl note) — test the form actually supported.

**relative reject:**
- wrong keywords for space: `oklch(from #f00 r g b)` (rgb keywords in oklch).
- missing `from`: `oklch(#f00 l c h)`.
- bad source color: `oklch(from notacolor l c h)`.
- wrong channel count: `oklch(from #f00 l c)` (2 channels) / `oklch(from #f00 l c h x)` (4, no `/`).
- non-relative function: `ColorFunctionLiteral<"rotate(90deg)">` → never; bare `ColorFunctionLiteral<"rgb(255 0 0)">` (no `from`) → never.

**Top-level `ColorFunctionLiteral` accept/reject:** routes each family; rejects bare color literal + unknown fn.

**Utility types:** `KindOf<"color-mix(in srgb, #f00, #00f)">` → `"color-mix"`; `KindOf<"oklch(from #f00 l c h)">` → `"relative"`; `KindOf<"light-dark(#f,#0)">` → `"light-dark"`; `KindOf<"rgb(255 0 0)">` → `never`. `MixSpaceOf<"color-mix(in oklch, #f00, #00f)">` → `"oklch"`. `RelativeFnOf<"oklch(from #f00 l c h)">` → `"oklch"`. `ColorsOf<"light-dark(#fff, #000)">` → `["#fff", "#000"]`.

**Suggestion strings + map + call-site:** `ColorFunctionStringMap["color-mix"]` membership; `cssColorFn("color-mix(in srgb, #f00, #00f)")` OK; `@ts-expect-error` on `cssColorFn("color-mix(in foo, #f00, #00f)")`, `cssColorFn("rgb(255 0 0)")`, `cssColorFn("oklch(from #f00 r g b)")`.

**Implement** `color-function.types.ts`:
- Import from kit: `SplitByComma, SplitBySpace, ParseFunction, IsPercentage, IsNumber, IsAngle, Trim, And, Or, Not, StartsWith, KeepIf`. Import `ColorLiteral` from color-picker.
- `IsColorArg<S>` = `ColorLiteral<Trim<S>>` not-never OR `Trim<S>` starts with `var(` and ends `)` → true. (var anywhere a color is expected.)
- Constant unions: `MixColorSpace` (14), `CylindricalSpace` (`hsl|hwb|lch|oklch`), `HueMethod` (`shorter|longer|increasing|decreasing`), `RelativeFn` (`rgb|hsl|hwb|lab|lch|oklab|oklch|color`).
- Per-fn channel keywords map: an interface `ChannelKeywordsFor` is internal; implement as conditional `ChannelKwOk<Fn, Token>` returning boolean. Sets: `rgb→r|g|b`, `hsl→h|s|l`, `hwb→h|w|b`, `lab→l|a|b`, `lch→l|c|h`, `oklab→l|a|b`, `oklch→l|c|h`, `color→` (predefined-rgb channels `r|g|b` — see impl note). Alpha keyword `alpha`.
- **`ColorMixLiteral<S>`**: `ParseFunction<Trim<S>>` → name === `color-mix`; `SplitByComma<args>` must have length 3; part1 = interpolation (`ParseInterp`: `SplitBySpace` → `["in", space]` or `["in", space, method, "hue"]`; space ∈ `MixColorSpace`; if method present, space ∈ `CylindricalSpace` AND method ∈ `HueMethod` AND last token literally `hue`); parts 2&3 = `ColorWithOptPct` (`SplitBySpace` → `[color]` IsColorArg, or `[color, pct]` IsColorArg + IsPercentage). Collapse with `And`/`KeepIf` to `S | never`.
- **`LightDarkLiteral<S>`**: name === `light-dark`; `SplitByComma` length 2; each `IsColorArg`.
- **`RelativeColorLiteral<S>`**: `ParseFunction` → name ∈ `RelativeFn`; `SplitBySpace<args>` → first token `from`; second token = source color (IsColorArg — for `color(` form, third token may be a colorspace ident: handle by allowing an optional space ident before channels when fn===`color`); then exactly 3 channel tokens via `IsChannelTok<Fn, Tok>` (= channel-kw-for-fn OR `none` OR IsNumber OR IsPercentage OR IsAngle OR starts-with `calc(`); optional trailing `/ <alpha>` where alpha = `none`|`alpha`|IsNumber|IsPercentage|starts-`calc(`. Use a small fixed-arity tuple match (no recursion).
- **`ColorFunctionLiteral<S>`**: dispatch on `ParseFunction<Trim<S>>["name"]`: `color-mix`→ColorMix; `light-dark`→LightDark; name ∈ RelativeFn AND args start `from `→Relative; else never. (Union acceptance when used directly.)
- `cssColorFn` call-site helper.
- Suggestion strings: `ColorMixString`, `RelativeColorString`, `LightDarkString`, `ColorFunctionString`; `ColorFunctionStringMap` (`{ "color-mix"; relative; "light-dark" }`); `ColorFunctionMode = keyof …`.
- Utility types `KindOf`, `MixSpaceOf`, `RelativeFnOf`, `ColorsOf`.
- Exported state union `ColorFunctionState` (3 variants per spec §4) + exported `MixColorSpace`, `HueMethod`, `RelativeFn`.

**Impl note — `color()` relative form:** `color(from <c> <space> r g b)` has a colorspace token between source color and channels. Simplest tractable handling: for `fn === "color"`, after `from` + source color, allow an OPTIONAL leading ident token (the predefined-rgb/xyz space) then 3 channel tokens; channel keywords for `color` accepted as `r|g|b` (predefined-rgb) — DOCUMENT this as a relaxation. If type-budget gets hairy, make `color`'s channel tokens fully lenient (any of number/pct/none/calc/ident) and document. Decide during impl; record in spec Assumptions if it deviates.

Run `pnpm test -- color-function-types` (typecheck) until green. Biome. Commit: `feat(color-function): strict type tier (color-mix/light-dark/relative) + type tests`.

---

## Task 2 — Runtime helpers (`color-function.helpers.ts`) + parse/format tests

**Test first:** `tests/color-function-parse.test.ts` + `tests/color-function-format.test.ts`.

parse:
- `parseColorFunction("color-mix(in oklch, #f00 30%, #00f 70%)")` → `{ kind: "color-mix", space: "oklch", colorA: "#f00", pctA: "30%", colorB: "#00f", pctB: "70%" }`.
- `parseColorFunction("color-mix(in hsl shorter hue, red, blue)")` → kind color-mix, hue `shorter`, tolerant keyword colors `red`/`blue` kept.
- `parseColorFunction("light-dark(#fff, #000)")` → `{ kind: "light-dark", light: "#fff", dark: "#000" }`.
- `parseColorFunction("oklch(from red l c h / 50%)")` → `{ kind: "relative", fn: "oklch", from: "red", c1: "l", c2: "c", c3: "h", alpha: "50%" }`.
- `parseColorFunction("rgb(from var(--c) r g b)")` → relative, fn rgb, from `var(--c)`.
- tolerant: keeps calc/var verbatim; `parseColorFunction("oklch(from #f00 calc(l * 2) c h)")` → c1 `calc(l * 2)`.
- null on errors: unknown fn `parseColorFunction("rotate(90deg)")`; bare `rgb(255 0 0)` (no from); wrong color-mix arity; missing `in`; relative wrong channel count.
- `colorFunctionKind` mirrors `KindOf` for each + null.
- `defaultState("color-mix"|"relative"|"light-dark")` returns a sensible seed (valid round-trip).

format:
- `formatColorFunction` canonical output per kind; `parse∘format` idempotence on the parse samples.

**Implement** `color-function.helpers.ts`:
- Const tables: `MIX_COLOR_SPACES`, `CYLINDRICAL_SPACES`, `HUE_METHODS`, `RELATIVE_FNS`, `CHANNEL_KEYWORDS` (per-fn record).
- Paren-aware `splitTopLevel(src, sep)` (mirror filter helper).
- `parseColorFunction`: outer `ParseFunction`-style regex `^([a-z-]+)\((.*)\)$/is`; dispatch on name; color-mix → comma-split into 3, parse interp (space-split part1), parse color+optPct parts; light-dark → comma-split 2; relative → fn ∈ RELATIVE_FNS AND first space-token `from` → space-split, classify (handle `color(` optional space ident). Tolerant: accept keyword colors, keep calc/var; null on structural errors.
- `formatColorFunction(state)`; `colorFunctionKind(src)`; `defaultState(mode)`; `ParseResult` facade interface.

Run parse+format tests (fast, jsdom-free). Biome. Commit: `feat(color-function): runtime parse/format helpers + dispatch tables + tests`.

---

## Task 3 — Component (`color-function.tsx`) + `index.ts` + component tests

**Test first:** `tests/color-function.test.tsx` (jsdom):
- `<ColorFunctionPanel value="color-mix(in oklch, #f00 30%, #00f)" onChange/>` renders space select + two color pickers + ratio sliders; changing a color/space/ratio emits onChange with an updated `color-mix(...)` string.
- relative mode: `<ColorFunctionPanel mode="relative" value="oklch(from #f00 l c h)" />` renders fn select + from-color + 3 channel inputs; editing a channel emits.
- light-dark: `<ColorFunctionPanel mode="light-dark" value="light-dark(#fff, #000)" />` renders two color pickers; editing emits.
- mode omitted: a family `<select>` appears; defaults to parsed kind.
- `<ColorFunction>` popover renders a trigger; opening reveals the panel; trigger swatch carries the value as background.
- `<ColorFunctionPreview>` renders a `[data-cf-preview]` element with `style.background === value`; light-dark toggle flips `color-scheme`.
- `cssColorFn` returns its arg at runtime.

**Implement** `color-function.tsx` (single file, `"use client"`):
- Props: `ColorFunctionPanelProps<TMode extends ColorFunctionMode = ...>` mirroring `transition-editor` (`mode?: TMode`; `value: ColorFunctionStringMap[TMode] | (string & {})`; `onChange: (v: ColorFunctionStringMap[TMode]) => void`; `className`; `aria-label`). `ColorFunctionProps` extends it. Note: when `mode` omitted the editor handles all 3 families at runtime; the default `TMode` for the unparameterized call resolves the union string type — pick a sensible default key for typing (decide: union of all, or default `"color-mix"`; transition-editor defaults to `"transition"`, so default `"color-mix"` and document that the omitted-mode UI still edits any family at runtime).
- `<ColorFunction>` popover wrapper (Button trigger: small swatch `<span style={{ background: value }}>` + truncated value; PopoverContent → Panel). Mirror transition-editor/easing structure.
- `<ColorFunctionPanel>`: `parseColorFunction(value)` → `ColorFunctionState` local state; `commit(next)` formats + `onChange`, with `lastEmittedRef` resync on external `value` change (transition-editor pattern). When `mode` set → render only that family editor; else a family `<select>` (defaults to parsed kind or `"color-mix"`) then the editor; switching family seeds via `defaultState`.
- `<ColorMixEditor>`: space `<select>` (14), hue-method `<select>` (shown only when space ∈ cylindrical; includes a "none" option), two `<ColorPicker native value onChange/>`, two `<input type="range" 0..100>` ratio sliders each emitting optional trailing `%` (a checkbox/toggle to include the pct, or always emit), a swap-ratio button.
- `<RelativeColorEditor>`: fn `<select>` (8), from-color `<ColorPicker/>`, three channel text `<input>`s (placeholder = channel keyword for the fn, e.g. l/c/h), optional alpha `<input>`.
- `<LightDarkEditor>`: two `<ColorPicker/>` (light, dark).
- `<ColorFunctionPreview>`: `<div data-cf-preview style={{ background: value }}>` + a light-dark `color-scheme` toggle wrapper + the live string in `<code>`.
- Native `<select>` / `<input type="range">` (sibling precedent). `cn` from `@/lib/utils`.

`index.ts` barrel: export component props + components (`ColorFunction`, `ColorFunctionPanel`, `ColorMixEditor`, `RelativeColorEditor`, `LightDarkEditor`, `ColorFunctionPreview`), helper `ParseResult` + fns + tables, type exports + `cssColorFn` (mirror font-editor index).

Run component tests. Biome. Commit: `feat(color-function): editor components (popover + panel + 3 family editors + preview) + tests`.

---

## Task 4 — Demo page + examples + MPA entry

- `pages/color-function/index.html` (copy font-editor; title "Color Function — ridiculous"; emoji 🎨).
- `pages/color-function/main.tsx` (ColorFunctionPage).
- `src/pages/color-function/page.tsx` (Layout; SectionHeaders; examples grid; InstallCta url `add https://turtiesocks.github.io/ridiculous/r/color-function.json`). Mirror box-shadow/font page.
- `src/examples/color-function/{basic-usage,tier-casual,tier-intellisense,tier-strict,api-reference,live-preview}.tsx`. `live-preview` = result-swatch showcase: color-mix (two ColorPickers + space select + ratio slider + produced string + computed swatch), relative (from-color + channel editors + swatch), light-dark (two swatches + the `color-scheme` toggle), each showing the produced string + a computed preview.
- `vite.config.ts`: add `"color-function": path.resolve(__dirname, "pages/color-function/index.html")` to `rollupOptions.input`.

Biome. Commit: `feat(color-function): demo page, examples, MPA entry`.

---

## Task 5 — Registry + nav + coverage

- `registry.json`: add `color-function` item (after font-editor) — `type: registry:ui`, title "Color Function", a spectacle-forward description, `registryDependencies` `[ridiculous-type-kit, color-picker, button, popover, input, label, select, slider]`, the 4 files (index, .tsx, .types.ts, .helpers.ts); add `https://turtiesocks.github.io/ridiculous/r/color-function.json` to the `all` bundle's `registryDependencies`.
- `vitest.config.ts`: add `"src/components/ui/color-function/**"` to `coverage.include`.
- `pnpm nav:build` (regenerates `src/generated/nav.ts`).
- `pnpm registry:build` (regenerates `public/r/*.json` — gitignored, NOT committed).

Commit (registry.json + vitest.config.ts + vite.config.ts if not already + generated nav): `feat(color-function): registry entry, all-bundle, nav, coverage include`.

---

## Task 6 — Green `pnpm pr:check`

- Run `pnpm nav:build` first (vitest typecheck imports `@/generated/nav` transitively via pages).
- Run `pnpm run typecheck`, `pnpm exec biome check`, `pnpm run test` in parallel; iterate to green. Fix biome, type-test mismatches, coverage gaps (add tests for uncovered branches to hit 90/85/90/90).
- Final commit must be typecheck-clean.

---

## Risk watchpoints (spec §2.5 / roadmap §7)

- **Compile budget:** all three grammars are fixed-arity (no variadic recursion) — color-mix 3 comma parts × ≤2 tokens, light-dark 2, relative ≤6 tokens. `ColorLiteral` called ≤3× per value (the heaviest sub-check). Measure `pnpm typecheck` wall-time after Task 1; if slow, the channel-keyword dispatch is the only thing to simplify.
- **`color()` relative form** (colorspace ident between source + channels): the one fiddly case. Keep it tractable (optional ident + lenient `r|g|b` channels) and document; do not let it balloon the validator.
- **Mode default typing:** unparameterized `<ColorFunction>` must still typecheck and edit any family at runtime. Default `TMode = "color-mix"` for the string type (transition-editor precedent), runtime UI is mode-agnostic when the prop is omitted.
- **Ratio slider → optional `%`:** keep emit deterministic (round-trip stable). Decide whether both pcts always emit or only when non-default; test the chosen behavior.
