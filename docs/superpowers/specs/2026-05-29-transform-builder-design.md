# transform-builder — Component Design Spec

**Date:** 2026-05-29
**Phase:** 2 of 11 (per `2026-05-29-ridiculous-component-roadmap-design.md`)
**Status:** Design — autonomous; all open questions resolved in §10 (Assumptions).
**Type-spectacle:** ★★★★ — **function-name dispatch** → per-argument unit typing & arity. Establishes the function-list dispatch pattern Phase 3 (filter) reuses.

---

## 1. What it edits

The CSS `transform` property: a **space-separated list of transform functions**, e.g.

```
translateX(10px) rotate(45deg) scale(1.5)
```

Supported functions (the full 2D + 3D set):

| Group | Functions |
|-------|-----------|
| translate | `translate` `translateX` `translateY` `translateZ` `translate3d` |
| scale | `scale` `scaleX` `scaleY` `scaleZ` `scale3d` |
| rotate | `rotate` `rotateX` `rotateY` `rotateZ` `rotate3d` |
| skew | `skew` `skewX` `skewY` |
| matrix | `matrix` `matrix3d` |
| perspective | `perspective` |

Plus the single keyword `none` (the CSS initial value — a valid `transform`).

---

## 2. The namesake — strict tier = function-name DISPATCH

The strict validator `TransformLiteral<S>` parses the space-separated list with kit `SplitBySpace`, parses each function with kit `ParseFunction` → `{ name; args }`, splits args with kit `SplitByComma`, then **dispatches on `name`** into a signature table that validates:

1. **arity** (arg count), and
2. **each argument's dimension** via kit `DimensionOf` / `IsLength` / `IsAngle` / `IsNumber` / `IsPercentage`.

Per-function signatures (the dispatch table):

| Function(s) | Arity | Argument types |
|-------------|:-----:|----------------|
| `translateX` `translateY` | 1 | length-percentage |
| `translateZ` `perspective` | 1 | length |
| `translate` | 1–2 | length-percentage (each) |
| `translate3d` | 3 | x,y length-percentage; z length |
| `rotate` `rotateX` `rotateY` `rotateZ` | 1 | angle |
| `rotate3d` | 4 | n,n,n number; angle |
| `scaleX` `scaleY` `scaleZ` | 1 | number or percentage |
| `scale` | 1–2 | number or percentage (each) |
| `scale3d` | 3 | number or percentage (each) |
| `skew` | 1–2 | angle (each) |
| `skewX` `skewY` | 1 | angle |
| `matrix` | 6 | number (each) |
| `matrix3d` | 16 | number (each) |

`none` (whole-string keyword) is also accepted.

**Resolution.** Every function in the list must validate → keep the literal `S`. Any violation → `never`.

```ts
TransformLiteral<"translateX(10px) rotate(45deg) scale(1.5)"> // ✓ the literal
TransformLiteral<"rotate(10px)">      // never — rotate wants an angle
TransformLiteral<"translateX(45deg)"> // never — translateX wants length-%
TransformLiteral<"none">              // "none"
TransformLiteral<"scale(50%)">        // ✓ scale accepts %
TransformLiteral<"matrix(1, 0, 0, 1, 0, 0)"> // ✓ 6 numbers
TransformLiteral<"matrix(1, 0, 0, 1, 0)">    // never — arity 5 ≠ 6
```

### 2.1 Strict-tier scope shipped (compile-budget decision)

Risk §7 of the roadmap flags long arg lists (here `matrix3d` = 16) as a `tsc` blow-up vector. Decision: **ship FULL dispatch with full per-arg dimension validation for every function, including `matrix` (6) and `matrix3d` (16).**

Rationale: argument validation here is a **flat fold** over a small comma-list (≤16) checking one cheap predicate per element — not the recursive expression tree that made calc expensive. `SplitByComma` already exists and is paren-aware; `AllArgsAre<Args, Pred>` is tail-recursive over ≤16 items. This is well inside budget. The strict tier validates the *space-separated list depth* implicitly (a transform list is flat — functions do not nest), so there is no recursion-depth cap to apply here.

**One documented punt:** the strict tier does **not** range-check numeric values (e.g. it does not reject a `perspective(0px)` or a negative scale) and does not reject `var()`/`env()`/`calc()` *inside* an argument — those resolve to `never` at strict tier because `DimensionOf` only classifies bare dimensioned values. Consumers needing `calc()`/`var()` inside a transform use the casual or IntelliSense tier; the runtime parser accepts them. This mirrors `CalcLiteral` rejecting `var()` and `OklabLiteral` not range-checking axes.

If a future `tsc` perf regression appears, the fallback (documented but not currently active) is: weak-validate `matrix3d` to arity-only (16 commas, args unchecked). Not needed at ship.

---

## 3. File layout (per roadmap §5.1)

```
src/components/ui/transform-builder/
  transform-builder.tsx        // components + small UI-local helpers
  transform-builder.types.ts   // TransformLiteral + cssTransform + suggestion strings + util types + state
  transform-builder.helpers.ts // pure runtime parse / format / sample-matrix
  index.ts                     // barrel
```

`transform-builder.helpers.ts` IS included (this component needs a real runtime parser for arbitrary lists + a CSS-matrix composer for the 3D preview, mirroring calc/color/gradient which all have a `.helpers.ts`).

---

## 4. Three-tier typing model (roadmap §5.2)

1. **Casual** — `value: string`. No validation. Runtime parser handles anything (incl. `calc()`, `var()`).
2. **IntelliSense** — `TransformString` suggestion union (e.g. `` `translate(${string})` `` | `` `rotate(${string})` `` | … | `"none"` | the multi-function `` `${string}` `` fallback). This is the `onChange` return type. A `TransformStringMap` keyed by function name + a `TransformFn` key type back an optional `fn?` *seed* affordance — but unlike calc, transform is a **list**, so `fn?` does NOT narrow `onChange` (a list of one function is still the open `TransformString`); `fn?` only seeds the initial inserted function. (Decision recorded in §10.)
3. **Strict** — `TransformLiteral<S>` + call-site helper `cssTransform`.

```ts
export const cssTransform = <S extends string>(value: S & TransformLiteral<S>): S => value
```

## 4.1 Required type surface (roadmap §5.3)

- **Strict validator:** `TransformLiteral<S>`.
- **Call-site helper:** `cssTransform`.
- **Suggestion strings:** `TransformString` union, `TransformStringMap` interface, `TransformFn` key type, `TransformFunctionName` union.
- **Utility types:**
  - `FunctionsOf<S>` → tuple of function-name literals in a transform string (e.g. `["translateX", "rotate", "scale"]`). The dispatch-pattern showcase utility.
  - `FunctionCountOf<S>` → number of functions in the list.
  - `TransformFunctionName` → union of every supported function name.
- **Internal state:** `TransformItem` discriminated union (one variant per function-group, discriminated by `fn`), exported. The editor's state is `TransformItem[]`. Plus a re-export of kit `Dimension` for consumers of parse output if needed (the parse output uses `TransformItem`, so this is optional — included for parity).

---

## 5. Component API (roadmap §5.6)

Controlled-only. Two top-level exports + named sub-components.

```tsx
<TransformBuilder        // popover-wrapped
  value: TransformString | (string & {})
  onChange: (next: TransformString) => void
  className?
  aria-label?
/>

<TransformBuilderPanel … /> // identical props, inline
```

### Sub-components (named exports, for composition)

- `TransformFunctionRow` — one editable function row: a function-name `<select>` + the right argument editors for that function + remove button. The dispatch made visible.
- `AddFunctionMenu` — the "+ add function" control (grouped select of all supported functions).
- `TransformPreview3D` — **the live 3D showcase.** A card in a `perspective` scene whose `transform` is driven by the current value; the user manipulates it via the rows and the typed string writes back. Also offers quick slider scrubbers (translateX/Y, rotate, scale, skewX) that compose into the value.
- `ArgEditor` — a single argument editor (numeric input + optional unit select) used inside a row; the per-dimension input.

### Panel layout

```
┌ TransformBuilderPanel ─────────────────────────┐
│ [ list of TransformFunctionRow … ]            │
│ [ + AddFunctionMenu ]                          │
│ ── live string (mono, copyable) ──             │
│ [ TransformPreview3D : perspective card ]      │
└────────────────────────────────────────────────┘
```

Popover trigger button shows a tiny iconographic summary (e.g. `⤡ 3 fns`) + truncated value, mirroring `CalcEditor`'s trigger.

### a11y

- Each row's function select + arg inputs are labelled (`aria-label`).
- The preview card is `aria-hidden` decoration; the authoritative control is the row list.
- Sliders are native `<input type="range">` with `aria-label` (precedent: calc-editor `FluidTypePlayground`; no shadcn `slider` file is installed locally).

---

## 6. Runtime helpers (`transform-builder.helpers.ts`)

Pure, framework-free. The SUPERSET of the strict tier (accepts `calc()`/`var()` args as opaque, validates dimensions where it can, gives friendly errors).

- `parseTransform(src: string): TransformItem[] | null` — split top-level by space, parse each `name(args)`, build typed items. `none`/empty → `[]`. Unknown function or arity violation → `null`.
- `formatTransform(items: TransformItem[]): TransformString` — canonical serialization (single spaces; `[]` → `"none"`).
- `transformFunctions(src): string[]` — runtime mirror of `FunctionsOf`.
- `defaultItem(fn: TransformFunctionName): TransformItem` — seed a new row with sensible defaults (`translateX(0px)`, `rotate(0deg)`, `scale(1)`, `matrix(1,0,0,1,0,0)`, …).
- `itemToCss(item): string` — one item → its CSS string.
- `argSpec(fn): { count, kind, labels }` — the runtime dispatch table (drives the UI: how many args, what dimension/units each takes, axis labels). Single source of truth the rows render from.

The runtime arg "kind" enum mirrors the type predicates: `"length-percentage" | "length" | "angle" | "number" | "number-percentage"`.

---

## 7. Demo (roadmap §5.4)

- **MPA entry:** `pages/transform-builder/{index.html,main.tsx}` (favicon emoji: 🧊 or ⤡).
- **Page:** `src/pages/transform-builder/page.tsx` (Layout `compact`, SectionHeaders, InstallCta).
- **Examples** `src/examples/transform-builder/`:
  - `basic-usage.tsx`
  - `tier-casual.tsx`
  - `tier-intellisense.tsx`
  - `tier-strict.tsx` (with `@ts-expect-error` rejection lines — `rotate(10px)`, `translateX(45deg)`, `matrix(…5 args)`)
  - `api-reference.tsx`
  - `preview-3d.tsx` — **the live 3D card** showcase (translate/rotate/scale/skew sliders → typed string written back).
- **Vite MPA:** add `"transform-builder": path.resolve(__dirname, "pages/transform-builder/index.html")` to `vite.config.ts` `rollupOptions.input`.
- **Nav:** auto-generated from `registry.json` via `pnpm nav:build`.

---

## 8. Registry (roadmap §5.4)

Add a `transform-builder` item (after `calc-editor`, before `all`):

```jsonc
{
  "name": "transform-builder",
  "type": "registry:ui",
  "registryDependencies": ["ridiculous-type-kit", "button", "popover", "input", "label", "slider"],
  "files": [ index.ts, transform-builder.tsx, transform-builder.types.ts, transform-builder.helpers.ts ]
}
```

`registryDependencies` MUST include `ridiculous-type-kit`. We declare `button`, `popover`, `input` (used directly), plus `label` and `slider` (the shadcn primitives a consumer would want for the row/preview controls — declared for install ergonomics even though our own files use native `<label>`/`<input type=range>`, matching how calc-editor declared only what it imports). **Decision (§10):** declare `button`, `popover`, `input` only (what we actually import), and additionally `label` + `slider` per the phase brief's explicit allowance — kept minimal-but-as-instructed.

Add `transform-builder` to the `all` bundle `registryDependencies` and update its description.

`pnpm registry:build` regenerates `public/r/*.json` (gitignored — do NOT commit). Commit only `registry.json`.

---

## 9. Tests (roadmap §5.5)

- `tests/transform-builder-types.test-d.ts` — accept AND reject for every function group (`@ts-expect-error` / `toBeNever`), plus `FunctionsOf`/`FunctionCountOf`, suggestion strings, state union, and the component `onChange` return type.
- `tests/transform-builder-parse.test.ts` — `parseTransform` / `transformFunctions` / `defaultItem` / `argSpec` runtime behavior incl. rejection cases.
- `tests/transform-builder-format.test.ts` — `formatTransform` / `itemToCss` round-trips + `none` handling.
- `tests/transform-builder.test.tsx` — jsdom render/interaction (add/remove rows, edit args emit onChange, function-select dispatch swaps arg editors, preview renders, slider updates).
- `vitest.config.ts`: add `"src/components/ui/transform-builder/**"` to `coverage.include`. Thresholds unchanged (90/85/90/90).

---

## 10. Assumptions (every autonomous decision)

1. **`none` is supported** as a whole-string keyword (it is a valid `transform` value and the natural empty state). `TransformLiteral<"none"> = "none"`; empty list serializes to `"none"`.
2. **No `fn?` onChange-narrowing prop.** Unlike calc (single function), transform is a *list*; narrowing `onChange` by a single function name is meaningless. `fn?` is dropped from the public API. `TransformStringMap`/`TransformFn` still exist as type surface (per §5.3 requirement) and key the per-function suggestion strings + seed defaults, but no prop consumes them for narrowing. (Satisfies "mode/basis key type where a mode prop narrows output" vacuously — transform has no such narrowing mode; documented here.)
3. **Strict tier validates 16-arg `matrix3d` fully** (flat fold is cheap). Documented fallback to arity-only exists but is not activated. (§2.1)
4. **Strict tier rejects `calc()`/`var()`/`env()` inside args** (→ `never`), same posture as `CalcLiteral` rejecting `var()`. Runtime accepts them as opaque. (§2.1)
5. **Strict tier does NOT range-check numbers** (no "perspective must be positive", no scale bounds). Dimension + arity only. (§2.1)
6. **`scale*` accepts percentage** (`scale(50%)` ✓) in addition to number, per CSS Transforms L2. `scaleZ`/`scale3d` likewise.
7. **`translate`/`translateX`/`translateY` accept length-percentage; `translateZ` length-only; `translate3d` z is length-only** (percentages are undefined for the z-axis in CSS).
8. **Both comma-and-space argument forms** are NOT both supported for multi-arg functions — CSS transform functions use **comma-separated** args only (`translate(1px, 2px)`), so the strict tier and parser use comma separation via `SplitByComma`. (Single-arg functions have no separator.)
9. **Whitespace tolerance:** leading/trailing/inter-function whitespace is collapsed by `SplitBySpace` (already drops empties) and `Trim`; the literal is preserved verbatim on success (we keep `S`, not a normalized form), mirroring `CalcLiteral`.
10. **Trigger summary** shows function count + a short glyph; exact glyph is cosmetic (`⤡`).
11. **Registry deps:** include `ridiculous-type-kit` + `button` + `popover` + `input` (imported) + `label` + `slider` (per brief's explicit allowance). (§8)
12. **`unit-input` registry item is NOT depended on.** The brief says "MAY"; our `ArgEditor` is a thin numeric-input-plus-unit-select that does not need unit-input's pointer-lock scrubbing, and adding the dep would pull `input` transitively anyway. Keeping the dep graph lean. (Recorded deviation-from-option, not from a requirement.)
13. **Preview uses CSS `transform` directly** (the browser composes the matrix); the helpers also expose `itemToCss` so the preview string is exactly the edited value — no separate matrix math needed for the visual. A `sampleMatrix`/numeric composer is therefore NOT built (would be dead weight); decision recorded.
14. **Single-file `.tsx`** even past 500 lines, per roadmap §5.1 precedent (color-picker 1013, gradient-editor 1140). Will split only past ~2000 lines.

---

## 11. Pattern hand-off to Phase 3 (filter)

The dispatch engine is intentionally factored as:

- `SplitBySpace` → list of calls (filter is also space-separated → identical),
- `ParseFunction` per call → `{ name, args }`,
- a **signature-table conditional** `ValidateFn<Name, Args>` keyed by function name,
- `AllArgsAre<Args, Pred>` flat-fold arg validators (reused verbatim by filter — `blur(length)`, `brightness(number|percentage)`, `hue-rotate(angle)`, `drop-shadow(…)`).

Phase 3 swaps only the `ValidateFn` table + the suggestion-string set. Keep `AllArgsAre` and the per-dimension predicate aliases (`IsLengthPct`, `IsNumberPct`) clean and self-contained in `transform-builder.types.ts` (filter will copy the shape, not import — components don't import each other's types).
