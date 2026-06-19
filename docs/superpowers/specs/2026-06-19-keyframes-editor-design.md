# keyframes-editor — Design Spec

**Date:** 2026-06-19
**Status:** Draft for implementation
**Type:** Per-component design spec (roadmap §5; new composition-flagship component)
**Component:** `keyframes-editor` — edits the body of a CSS `@keyframes` rule: a list of percentage/`from`/`to` stops, each holding typed `property: value` declarations.
**Authoring mode:** Delegated. Judgement calls in §11.

---

## 1. What it is

`keyframes-editor` is a controlled editor for the **body** of a `@keyframes` rule — the ordered list of keyframe blocks (e.g. `from { transform: translateX(0); opacity: 1 } 50% { transform: scale(1.2) } to { transform: translateX(100px) }`). The component edits the block list; the `@keyframes` name + wrapper live in the consumer's stylesheet.

The namesake is a **two-level type**: `KeyframesLiteral<S>` validates (a) each `<keyframe-selector>` block header (`from` | `to` | a comma list of `<percentage>` 0–100) AND (b) each declaration's value by **dispatching on the property name into that property's own ridiculous validator** — `transform` → transform-builder's `TransformLiteral`, `filter`/`backdrop-filter` → filter-builder's `FilterLiteral`, `color`/`background-color`/… → color-picker's `ColorLiteral`, `animation-timing-function` → easing-picker's `EasingLiteral`, `opacity` → a 0–1 number, length properties → `<length-percentage>`. It is the registry's **composition flagship** — the only component whose strict tier delegates to four other components' validators, and whose UI embeds those components' editors per stop.

It reuses **transform-builder, filter-builder, color-picker, gradient-editor, easing-picker, unit-input** — the densest reuse in the registry.

### 1.1 Grammar
```
<keyframes-body>    = <keyframe-block>*
<keyframe-block>    = <selector-list> "{" <declaration-list> "}"
<selector-list>     = <keyframe-selector> [ , <keyframe-selector> ]*
<keyframe-selector> = from | to | <percentage>            (0%–100%)
<declaration-list>  = [ <property> : <value> ; ]*           (trailing ; optional)
```

### 1.2 Examples (strict tier)
```ts
// accepted
cssKeyframes("from { opacity: 0 } to { opacity: 1 }")
cssKeyframes("from { transform: translateX(0px) } 50% { transform: scale(1.2) } to { transform: translateX(100px) }")
cssKeyframes("0% { color: #f00 } 100% { color: oklch(0.7 0.15 30) }")
// rejected (→ never)
cssKeyframes("150% { opacity: 1 }")              // selector out of 0–100
cssKeyframes("from { transform: 5 }")            // transform value isn't a transform list
cssKeyframes("from { opacity: 2 }")              // opacity not 0–1
cssKeyframes("from { color: notacolor }")        // not a color
```

---

## 2. Three-tier typing model
1. **Casual** — `value: string`. Runtime parser drives the timeline.
2. **IntelliSense** — `KeyframesString` (`(string & {})` permissive; the strict tier is the gate); the `onChange` return.
3. **Strict** — `KeyframesLiteral<S>` validator + `cssKeyframes` helper.

---

## 3. Strict-tier design (two-level fold)
```
KeyframesLiteral<S> =
  consume blocks via  `${Sel}{${Decls}}${Rest}`  (CSS values contain no { }),
  every block ValidateBlock → S, else never
ValidateBlock<Sel, Decls> =
  ValidateSelectors<Sel>  : SplitByComma → each `from` | `to` | IsPercent0To100
  ValidateDecls<Decls>    : split on top-level `;` → each `prop : value`
      → split on the first `:` → DispatchValue<Trim<Prop>, Trim<Value>>
DispatchValue<Prop, Value> =
  Prop "transform"                          → TransformLiteral<Value> extends Value
  Prop "filter" | "backdrop-filter"         → FilterLiteral<Value> extends Value
  Prop "color"|"background-color"|"border-color"|"outline-color"|"fill"|"stroke"
                                            → ColorLiteral<Value> extends Value
  Prop "animation-timing-function"          → EasingLiteral<Value> extends Value
  Prop "opacity"                            → IsNumber0To1<Value>
  Prop length-prop (width|height|top|left|right|bottom|margin*|padding*|inset|gap|…)
                                            → Or<IsLength, IsPercentage>
  Prop unknown                              → true   (lenient — value not gated)
```
`cssKeyframes<S>(value: S & KeyframesLiteral<S>): S`.

### 3.1 tsc-budget decision point (roadmap top risk)
This is the **deepest type in the registry** (blocks × declarations × per-value recursive literals like `TransformLiteral`). Phase A **measures `tsc` wall-time** after wiring the dispatch:
- If acceptable → ship the full dispatch (transform/filter/color/easing/opacity/length strict).
- If `tsc` spikes → **dial back**: keep color/opacity/length/easing strict (cheap), validate `transform`/`filter` values **leniently** (the two most expensive recursive literals), documenting the reduced boundary here. The skeleton (selectors + property recognition) stays strict either way.
The decision + the measured number are recorded in this spec's §3.1 at implementation time. Precedent: calc-editor measured `tsc` before committing to full dimensional analysis.

### 3.2 Validated vs deferred
**Validates:** block structure (`sel { decls }`), selector range (from/to/0–100%), and the KNOWN-property values via dispatch.
**Defers (lenient):** unknown properties' values; `background`/`background-image` (gradient-editor exports suggestion strings, not a strict `GradientLiteral`) → lenient; `!important`; `var()`/`env()`/`calc()` values → `never` in strict (undecidable), casual/runtime accept; nested `{}` (not valid in keyframes anyway); monotonic-ordering of stops (not checked — the UI sorts).

---

## 4. Runtime helpers (`keyframes-editor.helpers.ts`)
- `parseKeyframes(src): { blocks: KeyframeBlock[]; error: string | null }` — `KeyframeBlock = { selectors: string[]; declarations: { property: string; value: string }[] }`.
- `formatKeyframes(blocks): string` — canonical re-serialization (stops sorted from→%→to).
- `propertyEditorKind(property): "transform" | "filter" | "color" | "easing" | "opacity" | "length" | "plain"` — which embedded editor a declaration opens (runtime mirror of the dispatch table).
- `defaultKeyframes(): string`; `selectorToPercent(sel)` / `percentToSelector(n)` for the timeline.

## 4.1 The timeline UI
A horizontal 0–100% track with draggable stop markers (`from`=0%, `to`=100%). Selecting a stop reveals its declaration list; **each declaration opens the editor matching `propertyEditorKind`** — `TransformBuilder` for `transform`, `FilterBuilder` for `filter`, `ColorPicker` for color properties, `GradientEditor` for `background`, `EasingPicker` for timing, `UnitInput` for length, a plain input otherwise. A play head scrubs a **live preview** element whose inline style interpolates between the surrounding stops (a lightweight JS interpolation for the demo, not a full CSS animation engine). The composition — real typed editors per declaration — is the affordance.

---

## 5. Component (`keyframes-editor.tsx`)
Controlled `value` (keyframes body) + `onChange`. `KeyframesEditor` (popover) + `KeyframesEditorPanel` (inline).

**Sub-components (named exports):**
- `KeyframeTimeline` — the 0–100% track + draggable stop markers + add/remove stop + the play head.
- `DeclarationRow` — one `property: value` row: a property `<select>`/input + the embedded editor chosen by `propertyEditorKind`. Add/remove declarations.
- `KeyframePreview` — the live scrubbed preview box (JS interpolation between stops) + a play/pause toggle; guarded/degrades gracefully.
- `MiniSelect` — local copy.
- `LiveString` — the produced keyframes body.

**State:** the parsed `KeyframeBlock[]` + the selected stop + the play head position; `commit` + `lastEmittedRef` resync. a11y: stops are labelled draggable markers with keyboard nudge; the play head is a labelled slider; embedded editors keep their own a11y.

---

## 6. Demo, registry, navigation
- **Page:** `src/pages/keyframes-editor/page.tsx`. Route auto-registers via NAV.
- **Examples** (`src/examples/keyframes-editor/`): `basic-usage`, `tier-casual`, `tier-intellisense`, `tier-strict`, `api-reference`, plus **`animation-timeline`** (the hero: the timeline with per-stop embedded editors + the scrubbing preview).
- **Registry:** `keyframes-editor` item — `registryDependencies`: `ridiculous-type-kit`, `transform-builder`, `filter-builder`, `color-picker`, `gradient-editor`, `easing-picker`, `unit-input`, `button`, `popover`, `input`. Files = index + tsx + types + helpers + sub-component tsx. Append `.json` URL to `all`.
- **Coverage:** add `src/components/ui/keyframes-editor/**`. **Nav:** `pnpm nav:build`.

---

## 7. Testing (roadmap §5.5)
- **`tests/keyframes-editor-types.test-d.ts`** (gate): block structure accept/reject; selector range; the per-property dispatch (transform/filter/color/opacity/easing/length accept + reject) — scoped to whatever §3.1 ships strictly; `cssKeyframes` returns; `KeyframesString`, `StopsOf`/`PropertiesOf`.
- **`tests/keyframes-editor-parse.test.ts`** — `parseKeyframes` (blocks, selectors, declarations, errors), `propertyEditorKind`, `selectorToPercent`/`percentToSelector`, `defaultKeyframes`.
- **`tests/keyframes-editor-format.test.ts`** — `formatKeyframes` round-trips + stop sorting.
- **`tests/keyframes-editor.test.tsx`** (jsdom) — timeline renders stops; adding a stop + declaration emits the body; a `transform` declaration embeds the transform editor; play head scrubs the preview; popover summary.
- **Coverage:** 90/85/90/90.

---

## 8. File layout
```
src/components/ui/keyframes-editor/
  index.ts, keyframes-editor.tsx, keyframes-editor.types.ts,
  keyframes-editor.helpers.ts, keyframe-timeline.tsx, declaration-row.tsx,
  keyframe-preview.tsx, mini-select.tsx
src/pages/keyframes-editor/page.tsx
src/examples/keyframes-editor/{basic-usage,tier-casual,tier-intellisense,
  tier-strict,api-reference,animation-timeline}.tsx
tests/{keyframes-editor-types.test-d.ts, -parse.test.ts, -format.test.ts, .test.tsx}
```
Modified: `registry.json`, `vitest.config.ts`, `@/generated/nav`.

---

## 9. Type surface (exports from `keyframes-editor.types.ts`)
- **Validator:** `KeyframesLiteral<S>`. **Helper:** `cssKeyframes`.
- **Suggestion:** `KeyframesString`. **Util:** `StopsOf<S>`, `PropertiesOf<S>`, `KeyframePropertyKind`.
- **State:** `KeyframeBlock`, `Declaration`, `KeyframesValue`.

---

## 10. Component API conventions
Controlled-only; `KeyframesEditor` + `KeyframesEditorPanel`; sub-components named-exported; embedded editors reused; a11y parity.

---

## 11. Assumptions (delegated — review checkpoint)
- **A1 — The component edits the @keyframes BODY** (block list), not the `@keyframes name { }` wrapper. The consumer owns the name. Keeps one string value.
- **A2 — One validator `KeyframesLiteral<S>` + `cssKeyframes`.**
- **A3 — Per-property dispatch into the four sibling validators** (TransformLiteral / FilterLiteral / ColorLiteral / EasingLiteral) + opacity 0–1 + length-percentage; unknown properties lenient. This is the composition spectacle.
- **A4 — `background`/`background-image` are lenient** (gradient-editor exports suggestion strings, not a strict literal); the UI still embeds `GradientEditor` for them.
- **A5 — `tsc`-budget gate (§3.1):** ship full dispatch if `tsc` stays acceptable; otherwise downgrade `transform`/`filter` values to lenient (the two heaviest recursive literals) and keep the rest strict. Measured at implementation.
- **A6 — Live preview is a lightweight JS interpolation** between adjacent stops for the scrubber demo, NOT a full CSS animation/timing engine. Documented in the demo.
- **A7 — Stop ordering is sorted by the UI** (from=0 → % → to=100); the types/parser accept any order (CSS does too).
- **A8 — Each component owns its `mini-select.tsx` copy.**

---

## 12. Risks
- **Type budget (TOP risk — deepest type in the registry).** Mitigated by §3.1's measure-then-scope gate, lenient unknown properties, lenient background, and the fact that the per-value literals already compile standalone. The two-level fold is the new cost; the gate caps it.
- **Six-component reuse → blast radius.** A breaking change in any embedded component propagates here. Mitigation: depend on their public barrels only; the type-test + component test pin the integration points.
- **Preview interpolation scope creep.** Kept deliberately lightweight (A6) — no easing application, no unit-aware interpolation beyond numbers/lengths; documented.
