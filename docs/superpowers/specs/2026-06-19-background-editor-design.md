# background-editor — Design Spec

**Date:** 2026-06-19
**Status:** Draft for implementation
**Type:** Per-component design spec (roadmap §5; promotes the §2.2 stretch-bench "background shorthand" item)
**Component:** `background-editor` — edits the CSS `background` shorthand: a comma-stacked list of background layers, each embedding a gradient/image + position/size/repeat/attachment/origin/clip, with a color permitted only on the final layer.
**Authoring mode:** Delegated. Judgement calls in §11.

---

## 1. What it is

`background-editor` is a controlled editor for the CSS `background` shorthand — a comma-separated stack of layers painted back-to-front, where each layer carries an image (a gradient or `url()`), a position with an optional `/ <size>`, and repeat/attachment/origin/clip keywords; **only the final layer may carry a `<color>`**.

The namesake — *ridiculously precise template-literal types* — lands on the **index-aware last-layer-color rule**: `BackgroundLiteral<S>` splits the value into layers and folds them via head/tail recursion that KNOWS WHEN IT IS AT THE LAST LAYER, permitting a `<color>` token only there. This positional-list invariant (the final element of a list is special) is new to the registry — neither transform-builder nor box-shadow-editor expresses a constraint that depends on a token's layer index.

It is the densest **composition** of the classic shorthands: it embeds **gradient-editor** per layer image, validates the trailing color against **color-picker's `ColorLiteral`**, and reuses **unit-input** for position/size lengths.

### 1.1 Grammar (the slice this validates)
```
background     = <bg-layer># , <final-layer>
<bg-layer>     = [ <bg-image> | <position> [ / <size> ] | <repeat> | <attachment> | <box> ]*   (no color)
<final-layer>  = <bg-layer tokens> + an optional trailing <color>
<bg-image>     = none | <gradient()> | url(…) | image-set(…)        (any parenthesized image fn)
<position>     = left|center|right|top|bottom | <length-percentage>
<size>         = cover | contain | auto | <length-percentage>
<repeat>       = repeat | repeat-x | repeat-y | space | round | no-repeat
<attachment>   = scroll | fixed | local
<box>          = border-box | padding-box | content-box
<color>        = color-picker ColorLiteral (hex / rgb / hsl / oklch / oklab / hwb)
```

### 1.2 Examples (strict tier)
```ts
// accepted
cssBackground("linear-gradient(#f00, #00f) center / cover no-repeat, #fff")
cssBackground("url(x.png) left top / 50% repeat-x")
cssBackground("none, radial-gradient(#000, #fff) center")
cssBackground("#fff")                       // a lone color (single, final layer)
// rejected (→ never)
cssBackground("#f00 center, url(x.png)")    // color in a NON-final layer
cssBackground("center / wibble")            // unknown size token
cssBackground("url(x.png) bogus-keyword")   // unrecognized token
```

---

## 2. Three-tier typing model
1. **Casual** — `value: string`. Runtime parser drives the layer stack.
2. **IntelliSense** — `BackgroundString` (`(string & {})` permissive; strict is the gate); the `onChange` return.
3. **Strict** — `BackgroundLiteral<S>` validator + `cssBackground` helper.

---

## 3. Strict-tier design (the index-aware fold)
```
BackgroundLiteral<S> =
  SplitByComma<S> → layers (≥1; SplitByComma is paren-aware so gradient commas stay intact)
  ValidateLayers<layers> → S, else never
ValidateLayers<Layers> =
  Layers extends [L, ...R]
    ? R extends []
      ? ValidateLayer<L, /*allowColor*/ true>     // FINAL layer
      : And<ValidateLayer<L, false>, ValidateLayers<R>>
    : true
ValidateLayer<L, AllowColor> =
  every SplitBySpace<L> token IsBgToken<tok, AllowColor>
IsBgToken<T, AllowColor> =
  T = "/"                                   → true   (position/size separator)
  T ∈ position/size/repeat/attachment/box keywords → true
  Or<IsLength<T>, IsPercentage<T>>          → true
  IsImage<T> (none | a parenthesized fn)    → true
  AllowColor extends true ? Sat<ColorLiteral<T>> : false   // ← the invariant
```
`cssBackground<S>(value: S & BackgroundLiteral<S>): S`. `Sat<L> = [L] extends [never] ? false : true`.

### 3.1 Validated vs deferred
**Validates:** the comma-split layer structure; the **last-layer-only-`<color>` invariant** (a color token in any non-final layer → `never`); recognized per-layer token membership (image / position / size / repeat / attachment / box / length-percentage); the final color via color-picker's `ColorLiteral`.
**Defers (lenient):**
1. **A4 — `||` ordering + cardinality** (at most one image, at most one attachment, position-before-`/`-before-size) are NOT enforced — tokens are validated by membership, in any order. The runtime parser slots them. (Order-free `||` is undecidable cheaply — the roadmap budget rule.)
2. **A5 — gradient/image internals** are lenient (any parenthesized function or `none` is accepted as an image); the embedded `GradientEditor` validates gradients in the UI.
3. **A6 — multi-value position (3–4 token `<position>`)** and edge-offset forms accept their tokens as generic position tokens; not slot-checked.
4. **A7 — `<color>` uses color-picker's functional/hex forms**, not named colors (`#f00`/`oklch(...)`, not `red`) — consistent with property-syntax-editor's `<color>`.
5. **`calc()`/`var()`** values → `never` in strict (undecidable); casual/runtime accept.
6. **`/` must be space-separated** in strict (`center / cover`, not `center/cover`); the runtime parser handles both.

---

## 4. Runtime helpers (`background-editor.helpers.ts`)
- `parseBackground(src): { layers: BgLayer[]; error: string | null }` — `BgLayer = { image: string; position: string; size: string; repeat: string; attachment: string; origin: string; clip: string; color?: string }` (color only meaningful on the last layer).
- `formatBackground(layers): string` — canonical re-serialization (color emitted only on the final layer).
- `classifyToken(token): "image" | "position" | "size" | "repeat" | "attachment" | "box" | "length" | "color" | "slash" | "unknown"` — runtime mirror of `IsBgToken`.
- `defaultBackground(): string`; option sources `repeatOptions()` / `attachmentOptions()` / `boxOptions()` / `sizeKeywords()`.

## 4.1 The layer stack UI
A reorderable vertical stack of layer cards (drag-to-reorder = CSS paint order, via up/down buttons — no DnD dep, per the roadmap dependency policy). Each card: an **embedded `GradientEditor`** (or a `url()` input) for the image with a thumbnail; a **2D crosshair position pad** (ported in-spirit from gradient-editor's position picker — re-implemented locally, NOT imported, per registry self-containment) with `unit-input` x/y; a size control (`cover`/`contain`/`auto`/length); repeat/attachment/origin/clip `<select>`s. The **final** card additionally exposes a **`ColorPicker`** for the layer color. A live preview tile renders the full produced `background` compositing all layers in real time. The reorder + the final-only color are the affordances a textarea can't show.

---

## 5. Component (`background-editor.tsx`)
Controlled `value` + `onChange`. `BackgroundEditor` (popover) + `BackgroundEditorPanel` (inline).

**Sub-components (named exports):**
- `LayerStack` — the reorderable list of layer cards + add/remove/reorder.
- `LayerCard` — one layer's editors (image / position pad / size / repeat / attachment / origin / clip); the final card also renders the color picker.
- `PositionPad` — the 2D crosshair position picker (local re-implementation).
- `MiniSelect` — local copy.
- `BackgroundPreview` — the live composited preview tile.
- `LiveString` — the produced `background` value.

**State:** the parsed `BgLayer[]`; `commit` + `lastEmittedRef` resync. a11y: position pad is a labelled 2D control with keyboard nudge; reorder buttons labelled; selects labelled.

---

## 6. Demo, registry, navigation
- **Page:** `src/pages/background-editor/page.tsx`. Route auto-registers via NAV.
- **Examples** (`src/examples/background-editor/`): `basic-usage`, `tier-casual`, `tier-intellisense`, `tier-strict`, `api-reference`, plus **`layer-stack`** (the hero: a 2–3 layer stack with embedded gradients, the position pad, reorder, and the final-layer color, over the live preview tile).
- **Registry:** `background-editor` item — `registryDependencies`: `ridiculous-type-kit`, `color-picker`, `gradient-editor`, `unit-input`, `button`, `popover`, `input`. Files = index + tsx + types + helpers + sub-component tsx. Append `.json` URL to `all`.
- **Coverage:** add `src/components/ui/background-editor/**`. **Nav:** `pnpm nav:build`.

---

## 7. Testing (roadmap §5.5)
- **`tests/background-editor-types.test-d.ts`** (gate): layer accept/reject; the **last-layer-color invariant** (color in final layer accepted, color in non-final → never); unknown token reject; position/size tokens; `cssBackground` returns; `LayersOf`/`LayerCountOf`, `BackgroundString`.
- **`tests/background-editor-parse.test.ts`** — `parseBackground` (multi-layer, slash size, color on last, errors), `classifyToken`, option sources, `defaultBackground`.
- **`tests/background-editor-format.test.ts`** — `formatBackground` round-trips; color only on final layer.
- **`tests/background-editor.test.tsx`** (jsdom) — layer add/remove/reorder; position pad emits coords; final-layer color picker present only on the last card; embedded gradient editor present; live preview updates; popover summary.
- **Coverage:** 90/85/90/90.

---

## 8. File layout
```
src/components/ui/background-editor/
  index.ts, background-editor.tsx, background-editor.types.ts,
  background-editor.helpers.ts, layer-stack.tsx, layer-card.tsx,
  position-pad.tsx, background-preview.tsx, mini-select.tsx
src/pages/background-editor/page.tsx
src/examples/background-editor/{basic-usage,tier-casual,tier-intellisense,
  tier-strict,api-reference,layer-stack}.tsx
tests/{background-editor-types.test-d.ts, -parse.test.ts, -format.test.ts, .test.tsx}
```
Modified: `registry.json`, `vitest.config.ts`, `@/generated/nav`.

---

## 9. Type surface (exports from `background-editor.types.ts`)
- **Validator:** `BackgroundLiteral<S>`. **Helper:** `cssBackground`.
- **Suggestion:** `BackgroundString`. **Util:** `LayersOf<S>` (comma split), `LayerCountOf<S>`.
- **State:** `BgLayer`, `BackgroundValue`.

---

## 10. Component API conventions
Controlled-only; `BackgroundEditor` + `BackgroundEditorPanel`; sub-components named-exported; a11y parity.

---

## 11. Assumptions (delegated — review checkpoint)
- **A1 — One validator `BackgroundLiteral<S>` + `cssBackground`.**
- **A2 — The last-layer-only-`<color>` invariant is the headline** — an index-aware head/tail fold; a color token in any non-final layer → `never`. New validator shape for the registry.
- **A3 — Per-layer token validation is membership-based, order-free (A4 deferral).** The strict tier checks every token is a recognized background token (or, in the final layer, a color); it does NOT enforce `||` ordering/cardinality. Keeps `tsc` bounded.
- **A4 — Images are lenient** (any parenthesized fn or `none`); gradients validated by the embedded `GradientEditor` in the UI.
- **A5 — `<color>` uses color-picker forms** (hex/functional), not named colors; consistent with property-syntax-editor.
- **A6 — `/` is space-separated in strict;** runtime handles both.
- **A7 — Reorder via up/down buttons (no DnD dep);** the `PositionPad` is a local re-implementation (registry self-containment — not imported from gradient-editor).
- **A8 — Each component owns its `mini-select.tsx` copy.**

---

## 12. Risks
- **Type budget.** Comma layer fold × per-layer token fold × `ColorLiteral` on the final layer. Bounded: flat `SplitByComma`/`SplitBySpace`, membership `extends` checks, `ColorLiteral` only on the final layer's tokens (not every layer). No deep recursion beyond the two flat folds. Watch `tsc`; if it spikes, the lenient image/keyword checks are already the cheap path — the only recursive cost is `ColorLiteral`, applied sparingly.
- **Highest UI surface in the batch** (embedded gradient + color pickers, position pad, reorderable stack, live composite preview). Mitigation: build incrementally (stack + card skeleton → embed editors → position pad → preview), each covered by a component test; the embedded editors are shipped + tested.
- **Embedded-editor coupling** (gradient-editor + color-picker). Mitigation: depend on their public barrels; the component test pins their presence, not their internals.
