# property-syntax-editor — Design Spec

**Date:** 2026-06-19
**Status:** Draft for implementation
**Type:** Per-component design spec (roadmap §5; promotes the §2.2 stretch-bench "typed @property syntax descriptor" item)
**Component:** `property-syntax-editor` — edits the CSS `@property` `syntax:` descriptor string, and validates a candidate `initial-value` **against that syntax** at compile time.
**Authoring mode:** Delegated. Judgement calls in §11.

---

## 1. What it is

`property-syntax-editor` is a controlled editor for a CSS `@property` **`syntax`** descriptor string — the meta type-grammar that declares what values a registered custom property accepts (e.g. `"<length>+"`, `"<color>"`, `"<length> | auto"`, `"*"`).

The namesake spectacle is **one CSS string typing another**: the exported dependent validator `InitialValueLiteral<Syntax, V>` checks a candidate `initial-value` string `V` against an already-validated `Syntax` string, and the call-site helper `cssProperty(syntax, initialValue)` type-checks **only** when the initial value satisfies the declared syntax. This is the only component in the registry where one validated value string constrains another's type.

The controlled `value` is the **syntax string**. The panel's secondary "initial-value" field is a live demo of the dependency: it turns green/red in real time as `matchesSyntax(syntax, value)` runs — the user watches CSS's own type checker execute, mirroring the registry's compile-time gimmick.

It reuses the keyword-table + tier approach of `query-builder`, the kit's `SplitTopLevel`/`SplitBySpace`/`SplitByComma`, and **color-picker's `ColorLiteral` + `isColorString`** for the `<color>` data-type (type + runtime).

### 1.1 Grammar (the `<syntax>` meta-grammar this validates)

```
<syntax>            = "*"                                    (universal — accepts anything)
                    | <syntax-component> [ "|" <syntax-component> ]*
<syntax-component>  = <syntax-single> <multiplier>?
<syntax-single>     = "<" <data-type> ">" | <custom-ident>   (a type or a literal keyword)
<multiplier>        = "+"   (space-separated list)
                    | "#"   (comma-separated list)
<data-type>         = length | number | percentage | length-percentage | color
                    | integer | angle | time | resolution | image | url
                    | transform-function | transform-list | custom-ident
```

Dependent rule (`initial-value` vs `syntax`):
```
matches(V, "*")                = true
matches(V, "<T>")              = predicate-of(T)(V)
matches(V, "<T>+")             = every space-token of V satisfies <T>
matches(V, "<T>#")             = every comma-token of V satisfies <T>
matches(V, "ident")            = V === "ident"
matches(V, "A | B | …")        = matches(V, A) OR matches(V, B) OR …
```

### 1.2 Examples (strict tier)

```ts
// syntax — accepted
cssSyntax("<length>")
cssSyntax("<length>+")
cssSyntax("<color>")
cssSyntax("<length> | auto")
cssSyntax("*")
// syntax — rejected (→ never)
cssSyntax("<length>++")        // double multiplier
cssSyntax("<bogus>")           // unknown data type
cssSyntax("<length> |")        // empty alternative

// cssProperty(syntax, initialValue) — the dependent showcase
cssProperty("<length>", "0px")           // ✓
cssProperty("<length>+", "0px 4px 8px")  // ✓ every space-token is a <length>
cssProperty("<color>", "#ff0000")        // ✓ via color-picker ColorLiteral
cssProperty("<length> | auto", "auto")   // ✓ alternation
cssProperty("<length>", "red")           // ✗ "red" is not a <length>  → never at arg
cssProperty("<length>+", "0px red")      // ✗ second token not a <length>
cssProperty("<color>", "notacolor")      // ✗
```

---

## 2. Three-tier typing model (roadmap §5.2)

1. **Casual** — `value: string`. Runtime parser drives the chip UI.
2. **IntelliSense** — `SyntaxString` suggestion union (`` `<${DataTypeName}>` `` | `` `<${DataTypeName}>+` `` | `` `<${DataTypeName}>#` `` | `"*"` | `(string & {})`); the `onChange` return.
3. **Strict** — `SyntaxLiteral<S>` validator + `cssSyntax` helper; PLUS the dependent `InitialValueLiteral<Syntax, V>` + `cssProperty(syntax, initialValue)` helper (the spectacle).

---

## 3. Strict-tier design

### 3.1 `SyntaxLiteral<S>`
```
SyntaxLiteral<S> =
  Trim<S> = "*"                              → S
  else SplitTopLevel<S, "|"> → components (≥1, no empty)
       every component ValidateComponent → S, else never
ValidateComponent<C> =
  strip a single trailing "+" | "#"  (a second multiplier → never)
  base "<T>"  → T ∈ DataTypeName
  base ident  → NonEmptyAllChars over ident chars (letters/digits/-/_), lenient
```

### 3.2 `InitialValueLiteral<Syntax, V>` (dependent — the crown jewel)
```
InitialValueLiteral<Syntax, V> =
  Syntax = "*"                               → V
  SplitTopLevel<Syntax, "|"> → comps
  V satisfies ANY comp  → V, else never
SatisfiesComp<V, Comp> =
  multiplier "+" → every SplitBySpace<V> token SatisfiesBase
  multiplier "#" → every SplitByComma<V> token SatisfiesBase
  none           → SatisfiesBase<Trim<V>, base>
SatisfiesBase<Tok, base> =
  base "<length>"            → IsLength
  base "<number>"            → IsNumber
  base "<percentage>"        → IsPercentage
  base "<length-percentage>" → Or<IsLength, IsPercentage>
  base "<integer>"           → IsNumber           (lenient; A4)
  base "<angle>"             → IsAngle
  base "<time>"              → IsTime
  base "<resolution>"        → IsResolution
  base "<color>"             → ColorLiteral<Tok> extends Tok ? true : false   (color-picker)
  base "<image>"/"<url>"/"<transform-*>" → true   (lenient; A5)
  base ident                 → Tok extends base ? true : false
```

`cssSyntax<S>(value: S & SyntaxLiteral<S>): S`
`cssProperty<Syn, Init>(syntax: Syn & SyntaxLiteral<Syn>, initialValue: Init & InitialValueLiteral<Syn, Init>): { syntax: Syn; initialValue: Init }`

### 3.3 Validated vs deferred
**Validates:** the full `<syntax>` grammar (universal, `|` alternation, `+`/`#` multipliers, known data types, literal idents); and `initial-value` against syntax for the dimensional types + `<color>` + idents + alternation + multipliers.
**Defers (lenient):**
1. **A4 — `<integer>` checked as `<number>`** (not strictly integer). Runtime `matchesSyntax` checks integer-ness.
2. **A5 — `<image>`/`<url>`/`<transform-function>`/`<transform-list>`** accept any token at the type level (their value grammars are large/undecidable). Runtime is also lenient.
3. **`calc()`/`var()`** initial values → `never` in strict (undecidable); casual + runtime accept.
4. **Whitespace-significant edge cases** in multi-token values are handled by the kit splitters (the proven behavior).
5. The `inherits` descriptor (`true`/`false`) is a simple UI toggle, not part of the strict string (the component edits `syntax`).

---

## 4. Runtime helpers (`property-syntax-editor.helpers.ts`)
- `parseSyntax(src): { universal: boolean; components: SyntaxComponent[]; error: string | null }` — `SyntaxComponent = { base: string; isType: boolean; multiplier: "" | "+" | "#" }`.
- `formatSyntax(universal, components): string`.
- `matchesSyntax(syntax: string, value: string): boolean` — runtime mirror of `InitialValueLiteral`; uses `isColorString` (color-picker) for `<color>`, a real integer check for `<integer>`, and the kit-equivalent dimension regexes for the rest.
- `dataTypeNames(): readonly string[]` — the palette options.
- `defaultSyntax(): string`, `defaultInitialValue(syntax: string): string`.

One shared `DATA_TYPE_TABLE` feeds the palette + `matchesSyntax`, authored adjacent to the type `SatisfiesBase` (query-builder precedent — same example types in both tests).

---

## 5. Component (`property-syntax-editor.tsx`)
Controlled `value` (syntax string) + `onChange`. `PropertySyntaxEditor` (popover, shows the syntax string in the trigger) + `PropertySyntaxEditorPanel` (inline).

**Sub-components (named exports):**
- `SyntaxChipBuilder` — a palette of data-types + an "add literal ident" input; each chosen chip is a pill with a none/`+`/`#` multiplier toggle; chips are OR'd with visible `|` separators; a `*` (universal) exclusive switch clears the chips. Reorder/remove per chip.
- `InitialValueField` — a demo `<input>` + a live green/red status badge (`matchesSyntax`) + the `inherits` toggle. `role="status"` on the badge.
- `MiniSelect` — local copy.
- `LiveString` — the produced syntax string in a `<code>`.

**State:** `{ universal: boolean; components: SyntaxComponent[]; initialValue: string; inherits: boolean }`; the controlled `value` reflects `formatSyntax(...)`. `commit` + `lastEmittedRef` resync (query-builder precedent).

a11y: palette buttons labelled; multiplier toggles are a labelled segmented control; initial-value badge `role="status"`.

---

## 6. Demo, registry, navigation
- **Page:** `src/pages/property-syntax-editor/page.tsx` (mirror query-builder; intro covers the dependent type + validated/deferred). Route auto-registers via NAV.
- **Examples** (`src/examples/property-syntax-editor/`): `basic-usage`, `tier-casual`, `tier-intellisense`, `tier-strict`, `api-reference`, plus **`dependent-initial-value`** (the hero: the chip builder beside the live-checked initial-value field; tier-strict additionally shows `cssProperty(...)` compile-time rejection).
- **Registry:** `property-syntax-editor` item — `registryDependencies`: `ridiculous-type-kit`, `color-picker`, `button`, `popover`, `input`. Files = index + tsx + types + helpers + sub-component tsx. Append `.json` URL to `all` bundle.
- **Coverage:** add `src/components/ui/property-syntax-editor/**` to vitest `coverage.include`. **Nav:** `pnpm nav:build`.

---

## 7. Testing (roadmap §5.5)
- **`tests/property-syntax-editor-types.test-d.ts`** (primary gate): `SyntaxLiteral` accept/reject (universal, alternation, multipliers, unknown type, double multiplier, empty alt); `InitialValueLiteral`/`cssProperty` dependent accept/reject (`<length>`/`<length>+`/`<color>`/alternation/ident matches; mismatches → never); `SyntaxString`, `DataTypeName`, `cssSyntax` returns.
- **`tests/property-syntax-editor-parse.test.ts`** — `parseSyntax` (universal, components, multipliers, idents, errors), `dataTypeNames`, `defaultSyntax`/`defaultInitialValue`.
- **`tests/property-syntax-editor-format.test.ts`** — `formatSyntax` round-trips; `matchesSyntax` truth table (every data type + multiplier + alternation + ident + `*`).
- **`tests/property-syntax-editor.test.tsx`** (jsdom) — chip add/remove/multiplier toggle emits syntax; `*` switch; initial-value field live badge flips on match/mismatch; inherits toggle; popover summary.
- **Coverage:** thresholds 90/85/90/90.

---

## 8. File layout
```
src/components/ui/property-syntax-editor/
  index.ts, property-syntax-editor.tsx, property-syntax-editor.types.ts,
  property-syntax-editor.helpers.ts, syntax-chip-builder.tsx,
  initial-value-field.tsx, mini-select.tsx
src/pages/property-syntax-editor/page.tsx
src/examples/property-syntax-editor/{basic-usage,tier-casual,tier-intellisense,
  tier-strict,api-reference,dependent-initial-value}.tsx
tests/{property-syntax-editor-types.test-d.ts, -parse.test.ts, -format.test.ts, .test.tsx}
```
Modified: `registry.json`, `vitest.config.ts`, `@/generated/nav` (via build).

---

## 9. Type surface (exports from `property-syntax-editor.types.ts`)
- **Validators:** `SyntaxLiteral<S>`, `InitialValueLiteral<Syntax, V>`.
- **Helpers:** `cssSyntax`, `cssProperty`.
- **Suggestion strings:** `SyntaxString`, `DataTypeName` (the type-name union), `MultiplierToken` (`"" | "+" | "#"`).
- **Util:** `ComponentsOf<S>` (the syntax components), `SatisfiesBase` exported for advanced use.
- **State:** `SyntaxComponent`, `PropertySyntaxState`.

---

## 10. Component API conventions
Controlled-only; `PropertySyntaxEditor` + `PropertySyntaxEditorPanel`; sub-components named-exported; a11y parity.

---

## 11. Assumptions (delegated — review checkpoint)
- **A1 — The controlled value is the `syntax` STRING.** The dependent `initial-value` lives as a live-demo field (runtime check) + the exported `cssProperty` compile-time helper. Keeps the component single-valued like every other registry component while still showcasing the dependency.
- **A2 — Two validators (`SyntaxLiteral` + dependent `InitialValueLiteral`), two helpers (`cssSyntax` + `cssProperty`).** `cssProperty` is the spectacle; `cssSyntax` is the component's strict tier.
- **A3 — `<color>` defers to color-picker's `ColorLiteral` (type) + `isColorString` (runtime).** Registry dep on `color-picker`. This is the honest cross-component showcase the workflow called for. Note: color-picker's `ColorLiteral` covers the functional + hex forms (hex / rgb / hsl / oklch / oklab / hwb), **not** the 148 named colors — so examples use `#ff0000` / `oklch(...)`, and a named color like `red` is (correctly) rejected by the strict `<color>` check. Documented in the demo.
- **A4 — `<integer>` validated as `<number>` at the type level** (no integer-only type predicate in the kit); runtime `matchesSyntax` checks integer-ness. Lenient, documented.
- **A5 — `<image>`/`<url>`/`<transform-function>`/`<transform-list>` accept any token** (large/undecidable grammars). Lenient both tiers.
- **A6 — `InitialValueLiteral` is bounded:** flat `|` alternation, single `+`/`#` multiplier, per-token predicate. No nested combinators (CSS @property syntax forbids them anyway — no parens/nesting in the descriptor). Keeps `tsc` bounded — the roadmap top risk.
- **A7 — `inherits` is a UI toggle**, serialized only in the example's full `@property` block, not in the controlled `syntax` value.
- **A8 — Each component owns its `mini-select.tsx` copy** (registry self-containment).

---

## 12. Risks
- **Type budget (top risk).** The dependent `InitialValueLiteral` runs predicate checks per token per alternative. Bounded by A6 (flat splits, no nesting) and the lenient `<image>`/`<url>` shortcut. Watch `tsc`; if it spikes, drop `<color>` to lenient (removes the color-picker type import) as the escape valve.
- **Type vs runtime drift** (`SatisfiesBase` vs `matchesSyntax`). Mitigation: adjacent `DATA_TYPE_TABLE`; shared example types in both type-test and format-test.
- **color-picker `ColorLiteral` coupling.** If its signature shifts, this type breaks. Mitigation: it is a stable shipped export; the type-test pins a `<color>` accept + reject.
