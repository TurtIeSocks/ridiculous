# Box Shadow Editor — Component Design Spec

**Date:** 2026-05-29
**Phase:** 6 of 11 (per `2026-05-29-ridiculous-component-roadmap-design.md` §3)
**Status:** Draft for implementation
**Type:** Per-component design spec (scoped by the roadmap's §5 contract)

---

## 1. Overview

`box-shadow-editor` edits the CSS `box-shadow` property: a **comma-separated list of
shadow layers**. Each layer is

```
[inset?] <offset-x> <offset-y> <blur-radius>? <spread-radius>? <color>?
```

The namesake "ridiculous" tier is **per-layer token validation at compile time**:
`SplitByComma` → layers, then per layer `SplitBySpace` → tokens, validating exactly
2–4 `<length>` values (offset-x / offset-y required; blur / spread optional; blur is
non-negative), at most one optional `inset` keyword (leading **or** trailing), and at
most one optional `<color>` validated against the color-picker's `ColorLiteral`.

This is the **inverse nesting** of the Phase 3 `filter-builder` dispatch: filter splits
by *space* into functions; box-shadow splits by *comma* into layers, then by space into
tokens within each layer. Both reuse the kit's paren-aware splitters so a functional
color whose own body contains spaces and a slash — `rgb(0 0 0 / 0.2)` — stays a single
token.

It reuses `<ColorPicker/>` for the per-layer color control and (optionally) `unit-input`
patterns for the length fields, mirroring how `filter-builder`'s drop-shadow row works.

**Spectacle rating:** ★★★ (roadmap §2). Multi-layer list with optional-token placement.
Real utility + a draggable "light source" demo are the tiebreakers.

---

## 2. The grammar (what we validate)

### 2.1 Property level

`box-shadow: none | <shadow># ` — `none` (the empty state) or one-or-more comma-separated
`<shadow>` layers.

### 2.2 Layer level — `<shadow>`

Per the CSS spec (CSS Backgrounds & Borders L3), a single `<shadow>` is:

```
inset? && <length>{2,4} && <color>?
```

CSS `&&` means the three groups may appear **in any order**, but within the
`<length>{2,4}` group the lengths are **positionally ordered**: `offset-x offset-y
blur? spread?`. So legal forms include:

- `2px 2px` (offset-x, offset-y)
- `2px 2px 4px` (+ blur)
- `2px 2px 4px 1px` (+ blur, spread)
- `inset 2px 2px 4px #000` (leading inset + color)
- `2px 2px 4px #000 inset` (trailing inset)
- `#000 2px 2px` (leading color — legal CSS)

`blur-radius` must be **non-negative**; `spread-radius` may be negative.

### 2.3 Strict-tier scope (what compiles)

The strict `BoxShadowLiteral<S>` validates, **per layer**:

1. **`inset` placement** — at most one `inset`, only as the **leading or trailing** token.
   An `inset` wedged between lengths/color (`2px inset 2px`) resolves to `never`.
2. **Length arity** — exactly **2, 3, or 4** length tokens after inset/color are removed.
   Fewer than 2 or more than 4 → `never`.
3. **Length validity** — every offset/blur/spread token must satisfy the kit's `IsLength`
   (a number + a known CSS length unit — `px/rem/em/vw/...`; **bare `0` is rejected**, as
   `IsLength<"0">` is `false`, matching the filter-builder precedent that `blur(0)` →
   `never`).
4. **Blur non-negative** — the 3rd token (blur), when present, must satisfy
   `IsNonNegativeNumber` on its numeric part (so `-4px` blur → `never`). Spread (4th token)
   may be signed.
5. **Color** — at most one `<color>`, validated against the color-picker's
   `ColorLiteral`. Strict tier accepts the color in the **trailing** position only
   (after the lengths, before/after a trailing `inset`). See §2.4 for the placement /
   keyword decisions.

A **depth cap** guards the comma layer-list recursion (32 layers; see §2.5). The strict
tier validates layers up to the cap, then weak-validates the variadic tail (each token
non-empty). The runtime parser does full validation regardless of count.

### 2.4 Two documented decisions (the namesake judgement calls)

**(a) Bare keyword colors (`red`, `blue`, …).** The color-picker's `ColorLiteral`
covers hex + functional notations (`#rgb`/`#rrggbb`/`#rrggbbaa`, `rgb()`/`rgba()`,
`hsl()`, `oklch()`, `oklab()`, `hwb()`) but **not** the CSS `<named-color>` keyword set.
Encoding all 148 named colors as a literal union is cheap, **but** it collides with
`inset` detection and with any future bare ident, and it diverges from the established
precedent: `filter-builder` already documents "bare keyword colors are not in
`ColorLiteral` — use hex / functional." 

> **Decision:** the **strict tier requires hex or functional colors**; a bare
> `<named-color>` keyword (`red`) resolves to `never`. This matches the filter-builder
> precedent exactly, keeps the strict tier fast (no 148-entry union), and avoids
> ambiguity with the `inset` keyword. The **runtime parser is tolerant** — it accepts
> any non-length, non-`inset` token as a color (so `red` works at the casual /
> IntelliSense tier and in the live UI).

So `cssBoxShadow("0 2px 4px rgb(0 0 0 / 0.2)")` ✓ but
`cssBoxShadow("inset 0 0 10px 2px #000, 0 4px 8px red")` → `never` (the `red` layer
fails). Documented in `api-reference` + the `tier-strict` example.

**(b) Color placement.** CSS allows a **leading** color (`#000 2px 2px`). At the strict
type level, supporting color-anywhere multiplies the per-layer case analysis. The
filter-builder precedent for drop-shadow is "strict accepts color-LAST only; the runtime
parser normalizes a leading color to color-last."

> **Decision:** the **strict tier accepts color in the trailing position only** (after
> the length group). A leading-color layer (`#000 2px 2px`) resolves to `never` at the
> type level. The **runtime parser accepts a leading color and normalizes it to
> color-last** (offset-x offset-y blur? spread? then color, with inset wherever the user
> had it canonicalized to leading). Documented alongside (a).

`inset` may be **leading or trailing** at the strict tier (both are common and the
placement check is cheap — strip one end then the other).

### 2.5 Compile-time budget (roadmap §7)

- **Layer depth cap:** validate up to **32** comma-separated layers recursively; beyond
  that, weak-validate (each layer non-empty). 32 is far past any realistic shadow stack
  and mirrors the clip-path-editor's 32-vertex cap.
- **Per-layer token cap:** a layer has at most 6 tokens (inset + 4 lengths + color), so
  per-layer analysis is bounded and cheap — no recursion within a layer beyond the
  fixed-arity tuple matches.
- **`calc()` / `var()` inside a length or color** → `never` at the strict tier
  (undecidable), accepted by the runtime parser. Same contract as every other component.

---

## 3. Three-tier typing model (roadmap §5.2)

1. **Casual** — `value: string`. No validation; the runtime parser handles anything
   (incl. `calc()`/`var()`, bare named colors, leading colors).
2. **IntelliSense** — `BoxShadowString` suggestion union (per-layer-shaped heads + the
   `none` keyword) drives autocomplete and is the `onChange` return type.
3. **Strict** — `BoxShadowLiteral<S>` full validator + the `cssBoxShadow` call-site
   helper resolving invalid input to `never`.

---

## 4. Required type surface (`box-shadow-editor.types.ts`)

Mirrors the roadmap §5.3 checklist and the filter-builder shape.

- **Strict validators:**
  - `ShadowLayerLiteral<S>` — validates a single layer (inset placement + 2–4 lengths +
    optional trailing color). Returns `S | never`. Exported (advanced single-layer use).
  - `BoxShadowLiteral<S>` — splits by comma, folds `ShadowLayerLiteral` over each layer
    up to the depth cap; `none` → `S`; empty / any-invalid-layer → `never`.
- **Call-site helper:** `export const cssBoxShadow = <S extends string>(value: S &
  BoxShadowLiteral<S>): S => value`.
- **Suggestion strings:**
  - `ShadowLayerString` — a layer-shaped union (`` `${string} ${string}` ``-style heads
    covering inset/lengths/color permutations, kept permissive like `FilterString`).
  - `BoxShadowString = ShadowLayerString | `${ShadowLayerString}, ${string}` | "none"` —
    single layer, multi-layer (head-anchored), or `none`. Also the `onChange` return type.
  - `BoxShadowStringMap` interface + `BoxShadowKind` key type. The component has no
    output-narrowing *mode* (unlike filter's `filter`/`backdrop-filter`, which don't
    narrow either), so the map is keyed by layer *kind* (`outset` / `inset`) for parity
    with the contract's "`…StringMap` + key type" requirement. `inset: `inset ${string}``,
    `outset: ${ShadowLayerString}`.
- **Utility types** (literal-level operators, in the spirit of `FunctionsOf` /
  `LayerCountOf`):
  - `LayersOf<S>` — tuple of raw per-layer strings (`["0 2px 4px #000", "inset 0 0 2px"]`).
  - `LayerCountOf<S>` — `LayersOf<S>["length"]` (the number of layers; `none` → `0`).
  - `HasInset<S>` — `true` if **any** layer carries `inset`, else `false`.
  - `IsInsetLayer<S>` — `true` if a *single* layer string is an inset shadow.
- **Internal state:** `ShadowLayer` — a flat record (not a discriminated union on a
  function name, because every layer has the same shape; the meaningful discriminant is
  the boolean `inset`). Exported for advanced use:
  ```ts
  export interface ShadowLayer {
    inset: boolean
    offsetX: string
    offsetY: string
    blur?: string
    spread?: string
    color?: string
  }
  ```
  The roadmap calls for a "discriminated union (multi-layer)". The *editor* state is
  `ShadowLayer[]`; the discriminated-union requirement is satisfied at the suggestion-
  string + util-type level (`IsInsetLayer` discriminates inset vs outset) and the
  `BoxShadowStringMap` outset/inset keys. `ShadowLayer.inset: boolean` is the
  runtime discriminant. (Documented deviation — see Assumptions.)

---

## 5. Runtime helpers (`box-shadow-editor.helpers.ts`)

Superset of the strict tier (tolerant). Mirrors `filter-builder.helpers.ts`.

- `parseBoxShadow(src: string): ShadowLayer[] | null` — split by comma (paren-aware) into
  layers; per layer split by space; classify tokens: `inset` keyword → `inset: true`;
  length-ish tokens (incl. `calc()`/`var()`) → positional offsets/blur/spread; the one
  remaining token → color (accepts leading or trailing; normalized to color-last in the
  record). Requires ≥ 2 length tokens per layer; > 4 lengths, > 1 color, or > 1 inset →
  `null`. `none` / empty → `[]`.
- `formatBoxShadow(layers: ShadowLayer[]): string` — canonical serialization: per layer
  `[inset ]offsetX offsetY[ blur][ spread][ color]` (inset leading, color last); layers
  joined by `, `; empty → `none`.
- `layerToCss(layer: ShadowLayer): string` — one layer → its CSS string.
- `defaultLayer(): ShadowLayer` — `{ inset: false, offsetX: "0px", offsetY: "4px", blur:
  "8px", spread: undefined, color: "rgb(0 0 0 / 0.25)" }` (a soft drop shadow).
- `boxShadowLayerCount(src: string): number` — runtime mirror of `LayerCountOf`.
- A paren-aware `splitTopLevel` (runtime mirror of the kit combinator), as in
  filter-builder.helpers.

---

## 6. Component API (`box-shadow-editor.tsx`)

Controlled-only (`value` + `onChange`), two top-level exports + named sub-components.
Mirrors `filter-builder.tsx` structure.

- **`<BoxShadowEditor/>`** — popover-wrapped. Trigger button shows the layer count + a
  swatch preview of the stacked shadow + the truncated value.
- **`<BoxShadowEditorPanel/>`** — inline editor (the popover body): one
  `<ShadowLayerRow/>` per layer, an "+ add layer" button, the live string, and the
  `<BoxShadowPreview/>`.
- **`<ShadowLayerRow/>`** (exported) — one layer: an `inset` toggle, offset-x / offset-y /
  blur / spread length editors (`<ShadowLengthEditor/>`), the per-layer `<ColorPicker/>`
  color control (with add/remove affordance like drop-shadow), and a remove button.
- **`<ShadowLengthEditor/>`** (exported) — a numeric field + unit select for a length
  slot; raw text passthrough for opaque `calc()`/`var()`. (Same shape as
  `FilterArgEditor` `kind="length"`.) `allowNegative` prop (offsets + spread true, blur
  false → clamps the unit-stripped sign for blur).
- **`<AddLayerButton/>`** (exported) — appends a `defaultLayer()`.
- **`<BoxShadowPreview/>`** (exported) — **the showcase**: a card with the shadow stack
  applied, on a neutral stage, with a **draggable "light source"** dot. Dragging the
  light source updates **offset-x / offset-y of every layer** (light from top-left →
  positive x/y offset, i.e. shadow cast down-right), with a depth-scaled magnitude.
  Pointer handlers (`onPointerDown`/`Move`/`Up` + `setPointerCapture`) update React state
  and call `onChange` with the reformatted string. **No browser tooling** — pure React
  pointer events. ARIA: the light source is a `role="slider"`-style draggable with an
  `aria-label` and keyboard arrow-key nudging.

Props:

```ts
interface BoxShadowEditorPanelProps {
  value: BoxShadowString | (string & {})
  onChange: (value: BoxShadowString) => void
  className?: string
  "aria-label"?: string
}
interface BoxShadowEditorProps extends BoxShadowEditorPanelProps {}
```

No `mode` prop — `box-shadow` has one render target (unlike filter's
filter/backdrop-filter). Keyboard + a11y parity (focusable controls, ARIA labels on the
draggable light source, arrow-key nudge).

---

## 7. Demo, registry, navigation (roadmap §5.4)

- **MPA entry:** `pages/box-shadow-editor/{index.html,main.tsx}`; add the input to
  `vite.config.ts` `rollupOptions.input`.
- **Page:** `src/pages/box-shadow-editor/page.tsx` (Layout + SectionHeaders + examples +
  `InstallCta`).
- **Examples** (`src/examples/box-shadow-editor/`): `basic-usage`, `tier-casual`,
  `tier-intellisense`, `tier-strict`, `api-reference`, and `live-preview` (the card +
  draggable light source + add/remove layers + per-layer `<ColorPicker/>`).
- **Registry:** add a `box-shadow-editor` item (`type: registry:ui`;
  `registryDependencies: ["ridiculous-type-kit", "color-picker", "unit-input", "button",
  "popover", "input", "label", "slider"]`) and append its URL to the `all` bundle. Run
  `pnpm registry:build` (the `public/r/*.json` outputs are gitignored — regenerate, don't
  commit; commit only `registry.json`).
- **Nav:** `pnpm nav:build` regenerates `src/generated/nav.ts` from `registry.json`.

---

## 8. Testing (roadmap §5.5)

- **Type-level** `tests/box-shadow-editor-types.test-d.ts` — assert acceptance **and**
  rejection (the primary gate): layer arity (2/3/4 ✓; 1, 5 ✗), inset placement (leading ✓,
  trailing ✓, mid ✗, double ✗), color (trailing hex/functional ✓; leading ✗; bare keyword
  ✗; bad ✗), blur non-negative (`-4px` blur ✗), multi-layer lists, `none`, garbage, the
  `cssBoxShadow` call-site helper, and every util type (`LayersOf`, `LayerCountOf`,
  `HasInset`, `IsInsetLayer`) + suggestion strings/map + `ShadowLayer` state.
- **Runtime** `tests/box-shadow-editor-parse.test.ts` + `tests/box-shadow-editor-format.test.ts`
  for `parseBoxShadow` / `formatBoxShadow` / `layerToCss` / `defaultLayer` /
  `boxShadowLayerCount` (incl. leading-color normalization, inset placement tolerance,
  calc/var passthrough, arity rejection).
- **Component** `tests/box-shadow-editor.test.tsx` (jsdom) — row rendering per layer,
  editing a length / toggling inset / adding+removing a color / adding+removing a layer,
  the preview applying the stacked shadow, and the draggable light source updating
  offsets via synthetic pointer events.
- **Coverage:** add `src/components/ui/box-shadow-editor/**` to `coverage.include` in
  `vitest.config.ts`; keep 90/85/90/90 thresholds.

---

## 9. Assumptions (every judgement call made on the sleeping human's behalf)

1. **Bare keyword colors rejected at the strict tier** (require hex/functional), accepted
   at runtime. Rationale + precedent in §2.4(a). This is the explicitly-requested
   documented decision.
2. **Color trailing-only at the strict tier**; runtime normalizes a leading color to
   color-last (§2.4(b)). Matches filter-builder's drop-shadow precedent.
3. **`inset` allowed leading OR trailing** at the strict tier; mid-token inset → `never`.
   Both ends are common in the wild and the check is cheap.
4. **Bare `0` is not a valid length** at the strict tier (`IsLength<"0"> === false`), so
   `0 2px` → `never`; use `0px`. This matches the kit + filter-builder (`blur(0)` →
   `never`). The runtime parser is tolerant (accepts `0`). Examples use `0px`.
5. **Internal state is a flat `ShadowLayer` record with a boolean `inset` discriminant**,
   not a tagged discriminated union, because every layer has identical shape — the only
   discriminant is inset-ness. The roadmap's "discriminated union (multi-layer)"
   requirement is met via the `IsInsetLayer`/`HasInset` util types, the `BoxShadowStringMap`
   `inset`/`outset` keys, and `ShadowLayer.inset: boolean`. **Documented deviation.**
6. **No `mode` prop / no output narrowing.** `box-shadow` has a single render target.
   The `…StringMap` + key type (required by §5.3) is keyed by layer kind (inset/outset)
   for contract parity rather than by an output-narrowing mode.
7. **Depth cap 32 layers** for the strict comma-list recursion (weak-validate beyond);
   per-layer token analysis is fixed-arity. Mirrors clip-path's 32 cap + the roadmap §7
   "depth caps + weak-validate the variadic tail."
8. **Light source → offsets mapping:** dragging the light source sets every layer's
   offset-x/offset-y to the negated, depth-scaled light vector (light top-left ⇒ shadow
   bottom-right). Magnitude scales with each layer's existing blur so a stack reads as a
   coherent light. Blur/spread/color are preserved per layer. Arrow keys nudge the light
   ±1 unit (a11y).
9. **`<ColorPicker native>`** is used for the per-layer color control (compact inline
   swatch), matching filter-builder's drop-shadow color control.
10. **`unit-input` is a declared `registryDependency`** for parity with the roadmap's
    "MAY reuse unit-input" note and the install graph, even though the inline
    `<ShadowLengthEditor>` (number field + unit select) is the actual control rendered —
    matching how filter-builder declares but renders its own `FilterArgEditor`. (This
    keeps the dependency graph honest for consumers who want the full kit; the editor's
    own length control is bespoke to support the inset/spread layout.) **If `unit-input`
    turns out genuinely unused and lint/registry flags it, it will be rendered for at
    least the blur slot** to justify the dependency. Resolved during implementation.

---

## 10. Out of scope

- `box-shadow` animation / transitions (Phase 7).
- `text-shadow` (no spread, no inset — a near-subset; not in the roadmap).
- Retro-migrating existing components onto the kit (roadmap §4.1).
- Range-checking numeric magnitudes beyond the blur-non-negative rule (dimension + arity
  only, per the filter-builder precedent).
