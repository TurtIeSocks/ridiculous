# css-output + Tailwind copy mode — Design Spec

**Date:** 2026-06-21
**Status:** Draft for implementation
**Type:** Cross-cutting feature spec (adds a shared output primitive + converter; rolls out across the registry)
**Authoring mode:** Participate. The five load-bearing decisions were taken with the user (§3). Mapping facts were verified by a 22-agent fan-out against real component source + the Tailwind v4 docs (§4 carries the verified table).

---

## 1. What it is

Every editor component in the registry renders the CSS string it produces in an in-panel **readout** (a `<code>` block — `LiveString` / `live-string.tsx`). Today that readout shows **raw CSS only**, and only `easing-picker` has a copy button.

This feature adds a **"copy as Tailwind" mode**: each readout becomes a small toolbar that can show the value as **raw CSS** or as a **Tailwind v4 class** (inline arbitrary value, e.g. `shadow-[0_4px_8px_#0006]`), with a copy button — and, for the four properties Tailwind exposes a theme namespace for, an optional reusable **`@theme {}` token** form.

The premise: in 2026 a registry consumer is far likelier to paste a Tailwind class than a raw declaration. The mode is **opt-out-able** and defaults to showing both.

### 1.1 Two deliverables

1. **`cssToTailwind()`** — a pure converter function added to the shared `ridiculous-type-kit` lib (`registry:lib`). The brain. Property-aware, fully unit-tested.
2. **`<CssOutput>`** — a new shared `registry:ui` item (`css-output`): readout + `css ⇄ tailwind` toggle + copy button + adaptive `@theme` token disclosure. Every editor renders this instead of (or in addition to) its bespoke readout.

---

## 2. Goals & non-goals

**Goals**

- One shared converter + one shared readout UI, reused across the registry via declared `registryDependencies` (no copy-pasted internals — honors registry self-containment: a `shadcn add box-shadow-editor` transitively pulls `css-output` → `ridiculous-type-kit`).
- Accurate, idiomatic Tailwind v4 output: named utility where one exists (`shadow-[…]`, `filter-[…]`, `bg-[…]`, `grid-cols-[…]`, `ease-[…]`, `animate-[…]`, `transform-[…]`), generic `[property:value]` arbitrary-property fallback otherwise.
- A reusable `@theme {}` token form for the four namespace-backed properties (`color`, `box-shadow`, easing → `ease`, `animation` → `animate`).
- Graceful, automatic degradation to **css-only** for values that have no Tailwind class form (at-rules, queries, context-free values).
- End-users who install a component get the toggle out of the box.

**Non-goals (out of scope / future)**

- Tailwind **v3** output. Explicitly dropped (including removing easing-picker's existing `tw-v3` mode). v3 users fend for themselves.
- Tailwind **variant** generation for query-builder (`@max-md:`, `@container`) — queries map to variants, not classes; css-only for now (noted in §10).
- A `@theme { @keyframes … }` snippet for keyframes-editor — css-only for now (§10).
- Auto-detecting the host property for context-free editors (calc / unit-input / if-function). They stay css-only unless a consumer explicitly passes a `property`.

---

## 3. Locked decisions (from the brainstorm)

| # | Decision | Choice |
|---|---|---|
| 1 | Where the feature lives | **Shipped via type-kit converter** — `cssToTailwind()` in `ridiculous-type-kit`, consumed by a shared UI primitive. |
| 2 | Output shape | **Inline arbitrary value + v4 `@theme` token.** No v3. |
| 3 | Coverage | **All expressible, adaptive.** Every component whose value can become *some* Tailwind class gets the toggle; the rest degrade to css-only automatically. |
| 4 | UI delivery | **Shared readout primitive** (`css-output`, a `registry:ui` item), declared as a `registryDependency` of each consumer. |
| 5 | Component API + default | **`output?: "css" \| "tailwind" \| "both"`, default `"both"`** (toggle shown). `"css"`/`"tailwind"` pin the readout and hide the toggle. |

---

## 4. The converter — `cssToTailwind()`

### 4.1 Contract

```ts
// src/lib/ridiculous-type-kit/tailwind.ts  (re-exported from index.ts)

export interface TailwindForm {
  /** Inline class, e.g. "shadow-[0_4px_8px_#0006]" or "[filter:blur(4px)]". */
  inline: string
  /** Present only for the 4 namespace-backed properties. */
  theme?: {
    /** "@theme {\n  --shadow-custom: 0 4px 8px #0006;\n}" */
    atRule: string
    /** "shadow-custom" — the class the token enables. */
    className: string
  }
}

export interface CssToTailwindOptions {
  /** @theme token suffix; default "custom". e.g. "brand" → --color-brand / bg-brand. */
  name?: string
  /** Only used when property === "color". Default "bg". */
  colorPrefix?: "bg" | "text" | "border"
}

/** Returns null when the value has no Tailwind class form (at-rule / query / context-free). */
export function cssToTailwind(
  property: string | null | undefined,
  value: string,
  opts?: CssToTailwindOptions,
): TailwindForm | null
```

A `null` return *is* "not expressible" — there is no separate `expressible` flag. `<CssOutput>` reads `null` and renders css-only.

### 4.2 Verified property map

> Verified 2026-06-21 against `tailwindcss` v4 docs (context7) and each component's source. `inline` column shows the produced class; `token` column shows the `@theme` namespace (blank = no token form).

| `property` passed | inline form | `@theme` namespace |
|---|---|---|
| `color` | `bg-[…]` / `text-[…]` / `border-[…]` (via `colorPrefix`, default `bg`) | `--color-*` |
| `box-shadow` | `shadow-[…]` | `--shadow-*` |
| `transition-timing-function` *(easing)* | `ease-[…]` | `--ease-*` |
| `animation` | `animate-[…]` | `--animate-*` |
| `filter` | `filter-[…]` | — |
| `backdrop-filter` | `[backdrop-filter:…]` | — |
| `transform` | `transform-[…]` | — |
| `background-image` *(pure gradient/url)* | `bg-[…]` | — |
| `grid-template-columns` | `grid-cols-[…]` | — |
| `grid-template-rows` | `grid-rows-[…]` | — |
| `background` *(shorthand)* | `[background:…]` | — |
| `transition` *(shorthand)* | `[transition:…]` | — |
| `grid-template-areas` | `[grid-template-areas:…]` | — |
| `clip-path` | `[clip-path:…]` | — |
| `shape-outside` | `[shape-outside:…]` | — |
| `offset-path` | `[offset-path:…]` | — |
| `position-area` | `[position-area:…]` | — |
| *any other concrete CSS property* | `[property:…]` (generic fallback) | — |
| `null` / at-rule / query / context-free | **returns `null`** → css-only | — |

**Rule of construction:**

```
NAMED = { color: <colorPrefix>, box-shadow: "shadow", transition-timing-function: "ease",
          animation: "animate", filter: "filter", transform: "transform",
          background-image: "bg", grid-template-columns: "grid-cols",
          grid-template-rows: "grid-rows" }
TOKEN_NS = { color: "color", box-shadow: "shadow", transition-timing-function: "ease",
             animation: "animate" }
NON_EXPRESSIBLE = at-rules, queries, and any property the host passes as null/undefined

inline = NAMED[property]
       ? `${NAMED[property]}-[${encode(value)}]`
       : `[${property}:${encode(value)}]`         // generic arbitrary-property fallback
theme  = TOKEN_NS[property] ? buildTheme(property, value, name, colorPrefix) : undefined
```

`buildTheme`: suffix `name` (default `"custom"`), `atRule = "@theme {\n  --${ns}-${name}: ${value};\n}"` (raw value — real CSS inside `@theme`, **not** underscore-encoded), `className = ${NAMED[property]}-${name}` (e.g. color → `bg-brand`, shadow → `shadow-custom`).

### 4.3 Encoding — `encode(value)` (the fiddly-correctness core)

Verified Tailwind v4 arbitrary-value rules:

1. **Comma-space → comma.** `, ` → `,` first (Tailwind keeps commas literal; collapsing the trailing space avoids ugly `,_`). e.g. `…0.25), inset 0…` → `…0.25),inset 0…`.
2. **Whitespace runs → single `_`.** `0 0 0 / 0.25` → `0_0_0_/_0.25`.
3. **Literal `_` → `\_`**, *except* inside `url(...)` where underscores are preserved literally by Tailwind (don't escape them there).
4. Commas, parentheses, slashes stay literal — no backslash escaping.

Worked examples (from real component output):

| component value | property | inline result |
|---|---|---|
| `0px 4px 8px rgb(0 0 0 / 0.25), inset 0px 0px 2px #000` | `box-shadow` | `shadow-[0px_4px_8px_rgb(0_0_0_/_0.25),inset_0px_0px_2px_#000]` |
| `oklch(0.628 0.258 29.234)` | `color` | `bg-[oklch(0.628_0.258_29.234)]` |
| `blur(4px) brightness(1) drop-shadow(4px 4px 8px rgb(0 0 0 / 0.5))` | `filter` | `filter-[blur(4px)_brightness(1)_drop-shadow(4px_4px_8px_rgb(0_0_0_/_0.5))]` |
| `linear-gradient(90deg in oklch, #ff0000 0%, #0000ff 100%)` | `background-image` | `bg-[linear-gradient(90deg_in_oklch,#ff0000_0%,#0000ff_100%)]` |
| `circle(50% at 50% 50%)` | `clip-path` | `[clip-path:circle(50%_at_50%_50%)]` |
| `opacity 200ms ease, transform 0.3s 100ms ease-out` | `transition` | `[transition:opacity_200ms_ease,transform_0.3s_100ms_ease-out]` |
| `cubic-bezier(0.25, 0.1, 0.25, 1)` | `transition-timing-function` | `ease-[cubic-bezier(0.25,0.1,0.25,1)]` |

**Token examples** (`@theme`, raw value preserved):

```css
/* box-shadow, name "card" */
@theme {
  --shadow-card: 0px 4px 8px rgb(0 0 0 / 0.25);
}
/* → class="shadow-card" */
```
```css
/* color, name "brand", colorPrefix "text" */
@theme {
  --color-brand: oklch(0.628 0.258 29.234);
}
/* → class="text-brand" (also bg-brand, border-brand, …) */
```

---

## 5. The `<CssOutput>` primitive

New `registry:ui` item at `src/components/ui/css-output/`. `registryDependencies: ["ridiculous-type-kit", "button"]`. `"use client"` (clipboard + local state).

### 5.1 Props

```ts
export interface CssOutputProps {
  /** The formatted CSS value the host already produces. */
  value: string
  /** CSS property the value targets; drives conversion. Omit/null → css-only. */
  property?: string | null
  /** "css" | "tailwind" | "both" — default "both". */
  output?: "css" | "tailwind" | "both"
  /** Only meaningful when property === "color". Default "bg". */
  colorPrefix?: "bg" | "text" | "border"
  className?: string
}
```

`value` + `property` are the only props a host must wire. `colorPrefix` is the readout's *initial* prefix; the readout also exposes a live `bg/text/border` selector for color (see §5.3).

### 5.2 Render decision tree

```
tw = property ? cssToTailwind(property, value, { name, colorPrefix }) : null
isCssOnly = tw === null || output === "css"

if isCssOnly:         readout(value) + copy           // no toggle
elif output==="tailwind": readout(tw.inline) + copy   // pinned, no toggle
else (output==="both"):
    segmented toggle [ css | tailwind ], initial = "css"
    css view:      readout(value) + copy
    tailwind view: readout(tw.inline) + copy
                   + colorPrefix selector  (iff property === "color")
                   + token disclosure      (iff tw.theme)
```

- **Initial format = `css`** in `"both"` mode (least surprise; Tailwind is one click away). Toggle is a `tablist`/radiogroup, keyboard-navigable.
- **Copy** copies whatever the current view shows (raw CSS, the inline class, or — inside the token disclosure — the full `@theme` block). Reuses easing-picker's proven copy logic: debounced `Copied`/`Failed` state, `try/catch` on `navigator.clipboard.writeText`, timer ref cleared on unmount.

### 5.3 Sub-affordances (tailwind view only)

- **Color prefix selector** (`property === "color"`): a tiny `bg / text / border` segmented control; switching it re-derives `tw.inline` and the token `className`.
- **Token disclosure** (`tw.theme` present): a collapsed "use as `@theme` token" row that reveals the `@theme {}` block, an editable **var-name input** (default `custom`; sanitized to `[a-z0-9-]`, mirroring easing-picker's existing input), and its own copy button for the block. Name edits flow back through `cssToTailwind(..., { name })`.

### 5.4 Styling & a11y

- Match the existing readout look: `<code>`-style, `rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs`, `overflow-x-auto`.
- Toggle buttons: `aria-pressed` / `role="tab"`; copy button: `aria-label` reflecting state (`Copy` / `Copied`).
- Empty / `none` value → render the readout but **disable copy** (nothing useful to copy).
- Self-contained: imports only `@/components/ui/button`, `@/lib/utils` (`cn`), and `cssToTailwind` from the type-kit. No imports from sibling editors.

---

## 6. Per-component integration

Each editor passes `value` (its already-formatted string) and the correct `property`. **Mode-dependent** components compute `property` from their current mode prop.

| Component | `property` passed | Integration | Notes |
|---|---|---|---|
| color-picker | `"color"` | **Add** readout (none today; value shows only in demo) | colorPrefix selector applies |
| color-function | `"color"` | swap `live-string.tsx` | color value (`color-mix()` etc.) → `bg-[…]` + `--color-*` |
| box-shadow-editor | `"box-shadow"` | swap `LiveString` | `shadow-[…]` + `--shadow-*` |
| easing-picker | `"transition-timing-function"` | **replace `OutputPanel`**, drop tw-v3 (§7) | `ease-[…]` + `--ease-*` |
| gradient-editor | `"background-image"` | **Add** readout (none today) | `bg-[…]` |
| background-editor | `"background"` | swap `LiveString` | shorthand → `[background:…]` |
| filter-builder | `mode==="backdrop"? "backdrop-filter" : "filter"` | swap `LiveString` | `filter-[…]` / `[backdrop-filter:…]` |
| transform-builder | `"transform"` | swap readout | `transform-[…]` |
| transition-editor | `mode==="animation"? "animation" : "transition"` | swap `LiveString` | animation → `animate-[…]` + token; transition shorthand → `[transition:…]` |
| grid-builder | `columns→"grid-template-columns"`, `rows→"grid-template-rows"`, `areas→"grid-template-areas"` | swap `LiveString` | cols/rows named; areas arbitrary-prop |
| clip-path-editor | `mode==="shape-outside"? "shape-outside" : "clip-path"` | swap `live-string.tsx` | `[clip-path:…]` / `[shape-outside:…]` |
| shape-path-editor | `mode==="offset-path"? "offset-path" : "clip-path"` | swap `LiveString` | `[clip-path:shape(…)]` etc. |
| anchor-position-editor | `position-area mode→"position-area"`; **anchor & position-try modes → `null`** | swap readout(s) | only position-area is class-expressible; others css-only |
| keyframes-editor | `null` | swap readout | @keyframes body — css-only |
| property-syntax-editor | `null` | swap readout | @property syntax descriptor — css-only |
| query-builder | `null` | swap readout | media/container query — css-only |
| calc-editor | `null` | (no readout today; optional add) | context-free — css-only |
| if-function | `null` | swap readout | conditional value, ambiguous host — css-only |
| unit-input | `null` | (inline numeric input; **no CssOutput**) | context-free dimension; not a code readout |

**css-only components still win:** swapping their bespoke readout for `<CssOutput property={null}>` gives them a **copy button for free** (most lack one today), with no toggle shown.

**`registry.json`:** add `"css-output"` to the `registryDependencies` of every consuming component (all except unit-input), register the new `css-output` `registry:ui` item and the new `tailwind.ts` file under `ridiculous-type-kit`, and add `css-output` to the `all` bundle.

---

## 7. easing-picker reconciliation (intentional behavior change)

easing-picker today ships a bespoke `OutputPanel` (`preview/output-panel.tsx`) with a `css / tailwind-v3 / tailwind-v4` toggle and a v4 var-name input. Replace its internals with `<CssOutput value={easing} property="transition-timing-function" output="both" />`.

- **tw-v3 is removed** (decision §3). Net effect for users: the v3 arbitrary-class line disappears; the v4 token path is preserved (now via the shared token disclosure); raw CSS preserved.
- This deletes bespoke formatting/encoding code from easing-picker in favor of the shared converter — the consistency win.
- Call this out in the changelog/PR as an intentional, breaking-ish change to easing-picker's output UI.

---

## 8. Architecture & data flow

```
ridiculous-type-kit (registry:lib)
  └─ tailwind.ts ──> cssToTailwind(property, value, opts) : TailwindForm | null
                         ▲
css-output (registry:ui)  │ pure call
  └─ CssOutput ───────────┘  renders readout + toggle + copy + token disclosure
        ▲
        │ <CssOutput value property output? colorPrefix? />
   each editor (box-shadow-editor, filter-builder, …)
        passes its formatted value + (mode-derived) property
```

- Logic flows **one way**: editor → `CssOutput` → `cssToTailwind`. No editor imports another editor's internals; sharing is via declared registry deps only.
- `cssToTailwind` is pure and stateless — trivially testable, no React.
- `CssOutput` owns all interaction state (current format, var-name, color prefix, copy status).

---

## 9. Testing strategy

**Converter (`tailwind.test.ts`) — pure, fast, no jsdom. The exhaustive brain-test.**

- Table-driven: every row of §4.2 × a representative real value → asserted `{ inline, theme? }` (or `null`).
- Encoding edges: comma-space collapse, whitespace→`_`, `rgb(… / α)` slash, nested parens (`drop-shadow(...)`), literal `_` escaping, `url(...)` underscore preservation, multi-layer comma lists (shadow stacks, transition lists).
- `null` cases: at-rule, query, and `property == null/undefined`.
- Token construction: var-name suffix, default `"custom"`, color `className` per `colorPrefix`, raw (un-encoded) value inside `@theme`.

**`CssOutput` component tests** (existing vitest + jsdom setup, `@testing-library/react`):

- default `"both"` shows css first; toggle switches to tailwind and back.
- copy writes the **current view's** string (mock `navigator.clipboard.writeText`); shows `Copied`.
- `output="css"` and `property={null}` both hide the toggle (css-only).
- `output="tailwind"` pins to tailwind, hides toggle.
- color: prefix selector switches `bg`/`text`/`border` in both inline and token class.
- token disclosure: editing var-name updates the `@theme` block + className; block copy copies the `@theme` string.
- empty/`none` value disables copy.

**Coverage:** repo enforces branch coverage (`pnpm test:coverage`); new files must clear the bar. Per-editor integration is light (they just pass two props) — no new per-editor tests beyond confirming mode→property derivation for the mode-dependent ones.

---

## 10. Edge cases & known limits

- **Mode-dependent property derivation** is the host's responsibility; the spec fixes the exact mapping per component (§6) so it isn't guessed at implementation time.
- **query-builder** values are Tailwind *variants* (`@max-md:`, `@container`), not classes — css-only; a future enhancement could emit a variant string.
- **keyframes-editor** emits a `@keyframes` *body*; a future enhancement could wrap it as `@theme { @keyframes name { … } }` paired with an `--animate-*` token. css-only for now.
- **anchor-position-editor** anchor()/position-try modes target an ambiguous host property (which inset side?) → css-only; only position-area mode is class-expressible.
- **CSS-var ambiguity** (`text-[var(--x)]`): avoided because the generic fallback always uses the unambiguous `[property:value]` form, and `color` uses `bg/text/border` prefixes which are unambiguous. No data-type hints needed.
- **`url()` underscores** in gradient/background values are preserved (not escaped) per Tailwind's context-sensitive rule.

---

## 11. Implementation order (for the plan)

1. `cssToTailwind()` + `tailwind.test.ts` in `ridiculous-type-kit` (pure, fully tested first — it's the contract everything else depends on).
2. `<CssOutput>` primitive + component tests; register `css-output` in `registry.json` + nav + `all` bundle.
3. Roll out to editors in waves: (a) simple single-property swaps (box-shadow, transform, color-function), (b) mode-dependent (grid, transition, filter, clip-path, shape-path, anchor, background), (c) **add** to color-picker & gradient-editor, (d) css-only swaps (keyframes, property-syntax, query, if, calc), (e) easing-picker reconciliation (§7).
4. Each wave: add `css-output` to the component's `registryDependencies`, run `pnpm registry:build` + typecheck + tests.

---

## 12. Authoring-mode judgement calls

Decisions taken on the user's behalf where the brainstorm didn't pin them explicitly:

- **Initial format = `css`** in `"both"` mode (least surprise; one click to Tailwind). Not `tailwind`-first.
- **Generic `[property:value]` fallback** makes "expressible" = "is a concrete CSS property," so the only css-only cases are at-rules / queries / context-free / ambiguous-host.
- **`@theme` raw value is NOT underscore-encoded** (it's real CSS); only the inline arbitrary value is encoded.
- **Comma-space collapsed to comma** before encoding, for readable output (`,inset` not `,_inset`).
- **unit-input excluded** from `CssOutput` (its readout is an editable numeric input, not a code block).
- **easing-picker's property = `transition-timing-function`** (canonical Tailwind `ease-*` target) even though the component also serves animation-timing-function contexts.
