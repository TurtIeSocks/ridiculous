# query-builder — Design Spec (Phase 11 / 11)

**Date:** 2026-05-29
**Status:** Draft for implementation
**Type:** Per-component design spec (scoped by the roadmap spec §5 + §7)
**Component:** `query-builder` — edits CSS **media queries** AND **container queries**.
**Phase:** 11 of 11 — the final core component. Rounds out the set (roadmap §3).
**Authoring mode:** Delegated. The human delegated all design calls; every judgement
call is recorded in §11 (Assumptions). No clarifying questions were asked.

---

## 1. What it is

`query-builder` is a controlled editor for a CSS query condition string — either a
**media query** (the body of `@media …`) or a **container query** (the body of
`@container …`). A `mode?: "media" | "container"` prop selects the dialect; it
defaults to `"media"`.

The namesake — *ridiculously precise template-literal types* — lands on the **query
structure**: the strict tier validates the optional leading type/name, the boolean
combination of parenthesized feature tests (enforcing the CSS *no-mixing-`and`-and-
`or`-at-one-level* rule), and **each feature test's value dimension** against a known
feature table via the kit's `DimensionOf` (a length feature wants a `<length>`, a
resolution feature wants a `<resolution>`, `aspect-ratio` wants a `<ratio>`, an enum
feature wants one of its keywords).

It is the **boolean-logic + feature→value-typing** component (roadmap §2 row 6). It
reuses the boolean/parenthesized structural approach proven by `if-function` (Phase
10) — local paren-aware splitters mirroring the kit's char-walk — and the
dimension engine (`DimensionOf`) proven by `calc-editor` / `transform-builder`.

### 1.1 Grammar (the dialect this validates)

Media mode (`@media` condition, modern Level-4 syntax + legacy `min-/max-` prefixes):

```
<media-query>      = [ <modifier> <media-type> [ and <condition-no-or> ]? ]
                   | <condition>
<modifier>         = only | not                       (optional)
<media-type>       = all | screen | print             (tty/projection/etc. are obsolete)
<condition>        = <test> [ (and|or) <test> ]*       (NO mixing and/or at one level)
                   | not <test>
<condition-no-or>  = <test> [ and <test> ]*            (after a media-type, only `and`)
<test>             = "(" <feature-test> ")"
                   | "(" <condition> ")"               (nested group, depth-capped)
<feature-test>     = <feature>                         (boolean: (hover), (color))
                   | <feature> : <value>               (plain / legacy min-/max-)
                   | <feature> <op> <value>            (range:  (width >= 600px))
                   | <value> <op> <feature> <op> <value>(range:  (400px <= width <= 700px))
<op>               = "<" | "<=" | ">" | ">=" | "="
```

Container mode (`@container` condition):

```
<container-query>  = [ <container-name> ]? <condition>
<container-name>   = <custom-ident>                    (optional, before the first test)
<condition>        = same boolean grammar as media
<feature-test>     = same shapes, but the feature set is the SIZE/STYLE subset
```

### 1.2 Examples (strict tier)

Media — accepted (resolves to the literal `S`):

```ts
cssMediaQuery("screen and (min-width: 600px)")
cssMediaQuery("(width >= 600px)")
cssMediaQuery("(400px <= width <= 700px)")
cssMediaQuery("(orientation: landscape)")
cssMediaQuery("(min-resolution: 2dppx)")
cssMediaQuery("(aspect-ratio: 16/9)")
cssMediaQuery("(prefers-color-scheme: dark)")
cssMediaQuery("(hover) and (pointer: fine)")
cssMediaQuery("not (monochrome)")
cssMediaQuery("only screen")
cssMediaQuery("screen and (min-width: 600px) and (max-width: 900px)")
```

Media — rejected (→ `never`):

```ts
cssMediaQuery("(width: 16/9)")                  // length feature, ratio value
cssMediaQuery("(min-resolution: 600px)")        // resolution feature, length value
cssMediaQuery("(width: red)")                   // length feature, keyword value
cssMediaQuery("(orientation: sideways)")        // not a valid orientation keyword
cssMediaQuery("(width > 600px) or (hover)")     // … then `and` at same level (see below)
cssMediaQuery("(min-width: 600px) and (max-width: 900px) or (hover)") // MIXES and/or
cssMediaQuery("(width >= 600px) and (height <= 9001px) or (hover)")   // MIXES and/or
```

Container — accepted:

```ts
cssContainerQuery("(min-width: 400px)")
cssContainerQuery("sidebar (width > 400px)")
cssContainerQuery("(inline-size > 30rem) and (aspect-ratio: 1/1)")
```

Container — rejected:

```ts
cssContainerQuery("(min-resolution: 2dppx)")    // resolution is not a container feature
cssContainerQuery("(hover: hover)")             // interaction features are media-only
```

---

## 2. Three-tier typing model

Per roadmap §5.2, mirrored from the existing 14 components.

1. **Casual** — `value: string`. No validation. The runtime parser still parses +
   classifies (drives the UI). Escape hatch for "just give me JavaScript".
2. **IntelliSense** — suggestion-string unions that are the `onChange` return type.
   Because output shape depends on `mode`, there is a `QueryStringMap` keyed by
   `QueryMode` (mirrors `TransformStringMap` / the roadmap's "StringMap + mode key").
   `MediaQueryString` and `ContainerQueryString` are permissive (`string & {}`
   intersection so any string still flows; the strict tier is the real gate).
3. **Strict** — `MediaQueryLiteral<S>` and `ContainerQueryLiteral<S>` template-literal
   validators + call-site helpers `cssMediaQuery` / `cssContainerQuery` that resolve
   invalid input to `never` at the argument.

---

## 3. Strict-tier design (the namesake)

This is the spectacle. Built entirely on `ridiculous-type-kit`. Structure mirrors
`if-function.types.ts` (local paren-aware splitters + balance check) fused with
`transform-builder.types.ts` (dimension dispatch table).

### 3.1 Pipeline

```
MediaQueryLiteral<S> =
  Trim<S>
  → strip optional leading modifier (only|not) + media-type (all|screen|print)
      • "only screen"               → media-type only, no trailing condition  → OK
      • "screen and <cond-no-or>"   → validate the post-`and` condition (AND-only)
      • "not <test>"                → top-level negation of a single test
      • bare <condition>            → validate the condition
  → ValidateCondition<rest>
ContainerQueryLiteral<S> =
  Trim<S>
  → strip optional leading <container-name> ident (if the head isn't `(` / `not`)
  → ValidateCondition<rest, ContainerFeatureTable>
```

`ValidateCondition` is shared (one generic parameterised by the **feature table**,
so media and container differ only by which features + value-dimensions are legal):

```
ValidateCondition<S, Table> =
  Trim<S>
  → if `not <X>`            → ValidateTest<X, Table>           (single negated test)
  → SplitTopLevel on the FIRST joiner found (and | or):
      • split on " and " at depth 0 → parts; if >1 part, EVERY part is a test,
        AND there is NO top-level " or " anywhere (no-mix rule) → all ValidateTest
      • else split on " or " at depth 0 → parts; if >1 part, EVERY part is a test,
        AND there is NO top-level " and " (no-mix) → all ValidateTest
      • else (single token) → ValidateTest<S, Table>
```

The **no-mix rule** is enforced by checking, when we split on one joiner, that the
*other* joiner does not also appear at top level. CSS requires parens to mix, so
`(a) and (b) or (c)` is invalid but `((a) and (b)) or (c)` is valid (the inner group
is a nested `<test>` → `(<condition>)`).

### 3.2 `ValidateTest` — one parenthesized test

```
ValidateTest<S, Table> =
  Trim<S> extends `(${infer Inner})`  // must be parenthesized + balanced
    ? IsBalanced<Inner> extends true
      ? // (a) nested group?  Inner starts with `(` or `not (` or contains a
        //     top-level and/or  → recurse as a condition (depth-capped)
        IsGroup<Inner> extends true
          ? ValidateCondition<Inner, Table>            // depth cap applies
        : ValidateFeatureTest<Inner, Table>
      : never
    : never
```

`ValidateFeatureTest<Inner, Table>` dispatches on the three feature-test shapes:

- **range, 3-part** `<value> <op> <feature> <op> <value>`: split on the operators;
  middle token is the feature; both outer tokens' `DimensionOf` must equal the
  feature's expected dimension. (Both ops must be the SAME direction in CSS, e.g.
  `<` / `<=` together or `>` / `>=` together; we validate the *dimensions* strictly
  and the *operator consistency* leniently — documented in §7.)
- **range, 2-part** `<feature> <op> <value>`: feature dimension vs value dimension.
- **plain** `<feature> : <value>`: feature (incl. `min-`/`max-` legacy prefixes)
  dimension vs value dimension.
- **boolean** `<feature>`: the feature must be a known **boolean-capable** feature
  (e.g. `hover`, `color`, `monochrome`, `grid`); resolves to the literal.

Value validation per dimension uses the kit:

| Feature class | Expected value | Kit predicate |
|---|---|---|
| length (`width`,`height`,`inline-size`,`block-size`, + `min-/max-`) | `<length>` | `IsLength` |
| resolution (`resolution`, + `min-/max-`) | `<resolution>` | `IsResolution` |
| aspect-ratio (`aspect-ratio`, + `min-/max-`) | `<ratio>` (`<n>` or `<n>/<n>`) | local `IsRatio` (built on `IsNumber`) |
| color depth (`color`,`monochrome`,`color-index`, + `min-/max-`) | `<integer>` | `IsNumber` (lenient) |
| enum (`orientation`,`prefers-color-scheme`,`hover`,`pointer`,…) | one keyword | union membership |

`DimensionOf` returns `"length"` / `"resolution"` / `"number"` etc.; the table maps
each feature to the dimension tag (or keyword union) its value must match. For
length/resolution we compare `DimensionOf<Value>` to the expected tag so e.g.
`(min-resolution: 600px)` → `DimensionOf<"600px"> = "length" ≠ "resolution"` → `never`.

### 3.3 Feature tables

**Media feature table** (KNOWN set — strict). Each entry is `feature → kind`:

- **length** (range + `min-`/`max-` + plain): `width`, `height`, `device-width`,
  `device-height`.
- **ratio**: `aspect-ratio`, `device-aspect-ratio`.
- **resolution**: `resolution`.
- **integer** (lenient `<number>`): `color`, `color-index`, `monochrome`,
  `device-pixel-ratio` (number, non-standard but common).
- **enum**:
  - `orientation` → `portrait | landscape`
  - `prefers-color-scheme` → `light | dark`
  - `prefers-reduced-motion` → `no-preference | reduce`
  - `prefers-reduced-transparency` → `no-preference | reduce`
  - `prefers-contrast` → `no-preference | more | less | custom`
  - `forced-colors` → `none | active`
  - `hover` → `none | hover`
  - `any-hover` → `none | hover`
  - `pointer` → `none | coarse | fine`
  - `any-pointer` → `none | coarse | fine`
  - `color-gamut` → `srgb | p3 | rec2020`
  - `dynamic-range` → `standard | high`
  - `video-dynamic-range` → `standard | high`
  - `scripting` → `none | initial-only | enabled`
  - `update` → `none | slow | fast`
  - `overflow-block` → `none | scroll | paged`
  - `overflow-inline` → `none | scroll`
  - `display-mode` → `fullscreen | standalone | minimal-ui | browser | window-controls-overlay`
- **boolean-capable** (valid as a bare `(feature)`): every enum feature above (its
  presence is a boolean test), plus `color`, `monochrome`, `color-index`, `grid`,
  `hover`, `pointer`. (CSS: most discrete features double as boolean tests.)

**Container feature table** (SIZE/STYLE subset — strict, per the contract):

- **length** (range + `min-`/`max-` + plain): `width`, `height`, `inline-size`,
  `block-size`.
- **ratio**: `aspect-ratio`.
- **enum**: `orientation` → `portrait | landscape`.
- **boolean-capable**: `orientation` (and the length features are NOT boolean —
  a size feature with no value is meaningless; we reject bare `(width)` in container
  mode to be slightly stricter, matching CSS).

Note: media's length features also accept the legacy `min-`/`max-` prefix; container
features likewise (`min-width`, `max-inline-size`, …). The prefix is stripped and the
base feature looked up in the table; a prefixed feature only accepts the `:` (plain)
shape, never a range op (CSS rule — documented, enforced leniently per §7).

### 3.4 Validated vs deferred (roadmap §7 — explicit boundary)

**Strict tier VALIDATES:**

- The `if()`-style structural skeleton: balanced parens, top-level boolean split,
  the no-mix `and`/`or` rule, optional leading modifier + media-type / container-name.
- Each feature is in the KNOWN table for the active mode.
- Each value's **dimension** matches the feature (length/resolution/ratio/integer),
  or each enum value is in the feature's keyword union.
- Boolean tests only for boolean-capable features.

**Strict tier DEFERS (lenient / runtime parser does the fuller job):**

1. **Unknown / exotic features** → `never` in strict (we do not accept what we can't
   type). The casual + IntelliSense tiers accept them; the runtime parser parses them
   structurally (it does not gate on a known-feature whitelist — it classifies and
   keeps the literal). Documented so authors of bleeding-edge features use casual.
2. **Operator-direction consistency in a 3-part range** (e.g. rejecting
   `(600px < width > 700px)`): validated **leniently** — we check both values'
   dimensions but not that the two operators point the same way. The runtime parser
   flags inconsistent directions.
3. **`min-`/`max-` prefix used with a range operator** (CSS disallows
   `(min-width > 600px)`): lenient at type level (we strip the prefix and validate the
   value); runtime parser flags it.
4. **`calc()` / `var()` / `env()` values** → `never` in strict (undecidable
   dimension); accepted by casual + the runtime parser.
5. **Deep nesting**: nested groups are validated, but with a **depth cap of 4**. Past
   the cap we stop recursing and accept the tail leniently (keeps `tsc` bounded — the
   roadmap's top risk §7). The runtime parser has no cap.
6. **Numeric range of integer features** (`color`, `monochrome`): we check it is a
   `<number>`, not that it is a non-negative integer specifically. Lenient.
7. **`<ratio>` second term zero / negatives**: `IsRatio` accepts `<number>` or
   `<number>/<number>`; it does not reject `16/0`. Lenient (matches how
   `OklabLiteral` does not range-check axes — roadmap §7 precedent).

This boundary is the spec's contract; the type-tests in §8 assert both sides.

---

## 4. Runtime helpers (`query-builder.helpers.ts`)

Pure parse/format — the **superset** of the strict tier (it parses the structure but
does not gate on the known-feature whitelist, mirroring `if-function.helpers.ts`).
Single source of truth the UI drives off.

- `parseQuery(src: string, mode: QueryMode): QueryParseResult` — splits the optional
  leading modifier/type (media) or name (container), then recursively parses the
  condition into a `QueryNode` tree (group | test). Returns `{ node, error }`.
- `formatQuery(node, mode): string` — canonical re-serialization.
- `parseFeatureTest(inner: string): FeatureTest | null` — classify one test into
  `{ kind: "boolean" | "plain" | "range2" | "range3"; feature; op?; op2?; value?;
  value2? }`.
- `defaultFeatureTest(mode): FeatureTest` — seed (`width >= 600px` media / `inline-size
  > 400px` container).
- `defaultQuery(mode): QueryState` — a one-test condition.
- `featureKind(feature, mode): "length" | "resolution" | "ratio" | "integer" | "enum"
  | "unknown"` — table lookup (runtime mirror of the type table).
- `featuresFor(mode): readonly string[]` — the feature `<select>` options.
- `enumOptionsFor(feature): readonly string[] | null` — keyword options for an enum.
- `matchesNow(query, mode): boolean | null` — media mode only: wraps the produced
  string in `window.matchMedia(...)` and returns `.matches`; returns `null` for
  container mode or when `matchMedia` is unavailable (SSR / older jsdom).
- `ParseResult` facade + `queryToString` convenience.

The runtime tables are derived from one shared `FEATURE_TABLE` data structure so the
type table and runtime table can't drift in spirit (they are separately authored —
TS types and JS data — but documented as the same source).

---

## 5. Component (`query-builder.tsx`)

Single-file, mirrors `if-function.tsx`. Controlled `value` + `onChange`, plus `mode`.

**Top-level exports:**

- `QueryBuilder` — popover-wrapped (`<Button>` trigger showing the mode badge + a
  short summary, `<Popover>` + `<PopoverContent>` → `QueryBuilderPanel`).
- `QueryBuilderPanel` — inline editor.

**Sub-components (named exports, for composition):**

- `MediaTypeSelect` — media mode only: `only`/`not` modifier + `all`/`screen`/`print`
  type (plus an "(any)" no-type option).
- `ContainerNameInput` — container mode only: optional name `<input>`.
- `JoinerSelect` — the `and` / `or` combiner between tests (enforces no-mix by being
  a single shared joiner for the flat list — see §6).
- `FeatureTestRow` — one parenthesized test: feature `<select>` + shape selector
  (boolean / plain `:` / range `op`) + operator `<select>` + value input(s). For an
  enum feature the value input becomes a keyword `<select>`; for a length/ratio/
  resolution feature it is a `unit-input` (length) or plain `<input>` (ratio /
  resolution / integer). Uses `unit-input` for length values (registry dep).
- `NotToggle` — top-level `not` toggle.
- `QueryPreview` — shows the produced string and, in media mode, a **live "matches
  now?"** indicator via `window.matchMedia` (updates on a `change` listener).
- `LiveString` (internal) — the produced query string in a `<code>`.

**State model (flat, MVP).** The editor's *interactive* model is intentionally flat:
an optional leading modifier/type (or container name), a single boolean joiner
(`and`/`or`), and a list of feature tests. This guarantees the no-mix rule by
construction (one joiner for the whole flat list) and keeps the UI tractable. The
**runtime parser** and the **strict types** handle the full nested grammar (so
hand-written nested strings still validate / parse), but the *builder UI* edits the
flat case. Nested groups pasted into the casual `value` are preserved verbatim and
shown in the live string; editing controls operate on the flat top level. This is the
same pragmatic split `if-function` uses (types are richer than the row UI). Documented
as Assumption A8.

`unit-input` is reused for length-valued features (contract requirement).

a11y: every control labelled; `not` is a real checkbox; selects are native
`<select>` with `aria-label`; the matches-now indicator has `role="status"`.

---

## 6. The no-mix rule in the UI

CSS forbids `(a) and (b) or (c)` without parens. The flat builder enforces this by
exposing **one** joiner (`JoinerSelect`) that applies to the whole test list — you
either AND all the tests or OR all of them. To mix, the author drops to the casual
string tier and adds explicit parens (the runtime parser + strict types accept the
nested form). This is the simplest correct model and matches the spec's "do NOT allow
mixing and and or at the same level without parens" requirement at the builder level,
while the *types* enforce it for arbitrary hand-written strings.

---

## 7. Demo, registry, navigation

**MPA:** `pages/query-builder/{index.html, main.tsx}` + Vite input entry in
`vite.config.ts` (`"query-builder": resolve(__dirname, "pages/query-builder/index.html")`).

**Page:** `src/pages/query-builder/page.tsx` (mirrors `if-function` page; intro
describes the mode prop + the no-mix rule + the validated/deferred boundary).

**Examples** (`src/examples/query-builder/`): `basic-usage`, `tier-casual`,
`tier-intellisense`, `tier-strict`, `api-reference`, plus **`condition-builder`** —
the contract's required demo: a feature `<select>` + operator + value + `and`/`or`/
`not` combiners, showing the produced query string, and for media mode a live
"matches now?" indicator using `window.matchMedia`.

**Registry:** add a `query-builder` item to `registry.json` —
`type: registry:ui`; `registryDependencies`: `ridiculous-type-kit`, `unit-input`,
`button`, `popover`, `input`, `label`, `select`; four files. Add its `.json` URL to
the `all` bundle. `pnpm registry:build` regenerates `public/r/*.json` (gitignored —
not committed; only `registry.json` is committed).

**Nav:** `pnpm nav:build`.

---

## 8. Testing

- **`tests/query-builder-types.test-d.ts`** (primary gate). Accept + reject for:
  - length feature plain / range2 / range3 (`width`, `min-width`, `inline-size`);
  - ratio feature (`aspect-ratio: 16/9` accept; `aspect-ratio: 600px` reject);
  - resolution feature (`min-resolution: 2dppx` accept; `min-resolution: 600px` reject);
  - enum feature (`orientation: landscape` accept; `orientation: sideways` reject);
  - boolean feature (`(hover)` accept; `(width)` reject in container mode);
  - media-type + modifier (`only screen`, `screen and (min-width: 600px)`,
    `not (monochrome)`);
  - the **and/or no-mix rule** (`(a) and (b)` accept; `(a) and (b) or (c)` reject;
    nested `((a) and (b)) or (c)` accept);
  - **unknown feature** → `never`;
  - **container subset** (`min-resolution` / `hover` rejected in container mode;
    `inline-size` accepted);
  - call-site helper return types;
  - utility types (`QueryMode`, `FeaturesOf`, `FeatureCountOf`);
  - suggestion unions + `QueryStringMap`.
- **`tests/query-builder-parse.test.ts`** — `parseQuery` (both modes), modifier/type
  and container-name stripping, the three test shapes, nested groups, invalid → error,
  `featureKind` / `featuresFor` / `enumOptionsFor`.
- **`tests/query-builder-format.test.ts`** — `formatQuery` round-trips; canonical
  serialization (`min-width: 600px`, `width >= 600px`, `400px <= width <= 700px`,
  `screen and (…)`, `name (…)`).
- **`tests/query-builder.test.tsx`** (jsdom; **mocks `window.matchMedia`** via
  `vi.stubGlobal` / `Object.defineProperty` since jsdom lacks it) — panel renders
  tests, feature/op/value editing emits strings, joiner + not toggles, mode switching
  (media ↔ container changes the feature options + hides type/name controls), the
  matches-now indicator reads the mock, popover trigger summary.
- **Coverage:** add `src/components/ui/query-builder/**` to `coverage.include` in
  `vitest.config.ts`; thresholds stay 90/85/90/90.

---

## 9. File layout (deliverables)

```
src/components/ui/query-builder/
  query-builder.tsx
  query-builder.types.ts
  query-builder.helpers.ts
  index.ts
pages/query-builder/{index.html, main.tsx}
src/pages/query-builder/page.tsx
src/examples/query-builder/{basic-usage,tier-casual,tier-intellisense,
  tier-strict,api-reference,condition-builder}.tsx
tests/{query-builder-types.test-d.ts, query-builder-parse.test.ts,
  query-builder-format.test.ts, query-builder.test.tsx}
```

Modified existing files (allowed surface only): `registry.json` (append item + bundle
URL), `vite.config.ts` (append MPA entry), `vitest.config.ts` (append coverage path),
plus `pnpm nav:build` regen of `@/generated/nav`.

---

## 10. Type surface (exports from `query-builder.types.ts`)

- **Validators:** `MediaQueryLiteral<S>`, `ContainerQueryLiteral<S>`.
- **Call-site helpers:** `cssMediaQuery`, `cssContainerQuery`.
- **Suggestion strings:** `MediaQueryString`, `ContainerQueryString`,
  `QueryString` (union), `QueryStringMap` (keyed by `QueryMode`), `QueryMode`,
  `FeatureOperator` (`"<" | "<=" | ">" | ">=" | "="`), `MediaType`, `MediaModifier`,
  enum-keyword unions (`Orientation`, `Hover`, `Pointer`, `ColorGamut`,
  `PrefersColorScheme`, …).
- **Utility types:** `FeaturesOf<S>` (the feature names used in a query),
  `FeatureCountOf<S>`, `ModeFeatureNames` helpers.
- **Internal state (discriminated union, exported):** `FeatureTest` (discriminated by
  `kind`), `QueryNode` (`group` | `test`), `QueryState` (the flat editor state:
  `{ mode; modifier?; mediaType?; containerName?; joiner; tests: FeatureTest[]; not }`).
- Re-export the kit's `Dimension` for convenience.

---

## 11. Assumptions (delegated decisions — the human's review checkpoint)

- **A1 — `mode` default = `"media"`.** Most common use; matches the contract's
  `mode?` optionality. Switching to `"container"` swaps the feature table + UI.
- **A2 — Two strict validators, not one `QueryLiteral<S, Mode>`.** Mirrors how the
  contract names `MediaQueryLiteral<S>` + `ContainerQueryLiteral<S>` and the call-site
  helpers `cssMediaQuery` / `cssContainerQuery`. A mode-generic single type is harder
  to use at call sites (you'd pass the mode as a type arg). Two helpers read cleaner
  and match the existing `cssX` idiom. The shared machinery is one internal
  `ValidateCondition<S, Table>` parameterised by the feature table.
- **A3 — Known-feature whitelist in strict; unknown → `never`.** The contract says
  "validate a solid KNOWN feature set … and be lenient on exotic/unknown features."
  Strict rejects unknown (we can't type a value we don't know the dimension of);
  casual + IntelliSense + the runtime parser accept them. This is the §7 deferral.
- **A4 — Media type set = `all | screen | print`.** `tty`, `tv`, `projection`,
  `handheld`, `speech`, etc. are deprecated/obsolete (Media Queries Level 4). Keeping
  the modern three is correct and keeps the union small.
- **A5 — Feature table scope.** Media: the length/ratio/resolution/integer features +
  the full modern enum set (orientation, prefers-*, hover/any-hover, pointer/
  any-pointer, color-gamut, dynamic-range, scripting, update, overflow-*, forced-
  colors, display-mode). Container: the SIZE subset (`width`, `height`, `inline-size`,
  `block-size`, `aspect-ratio`) + `orientation`. `min-`/`max-` legacy prefixes
  accepted (stripped + base looked up). This is "a solid KNOWN set," not exhaustive.
- **A6 — Style-query container features (`style(--x: 1)`) are OUT of strict scope.**
  Container *style* queries exist but are bleeding-edge and overlap the `if-function`
  `style()` grammar. The contract scopes container mode to "size/style features
  subset" but lists only size features concretely; we implement the **size** subset
  strictly and treat `style(...)` as lenient/unknown (casual tier). Documented
  deferral (§3.4 + §7). The runtime parser keeps a `style(...)` token verbatim.
- **A7 — Operator-direction + `min-`/`max-`-with-range consistency are lenient.**
  Dimensions are validated strictly; the *direction* of a 3-part range and the
  illegal `(min-width > 600px)` combo are not type-gated (the runtime parser flags
  them). Keeps the type small and matches roadmap §7 ("validate units present, defer
  the exotic structural rule").
- **A8 — The builder UI edits the FLAT top-level case; types/runtime handle nesting.**
  One shared joiner (no-mix by construction) + a flat test list. Nested groups in a
  pasted string are preserved + shown but not decomposed into rows. This mirrors
  `if-function` (richer types than the row editor) and keeps the component well under
  the ~2000-line split threshold (roadmap §5.1).
- **A9 — `matchMedia` is the only browser API touched; container mode has no live
  match.** There is no standard "does this container query match right now?" API
  without an actual sized container element, so the live indicator is **media-only**;
  `matchesNow` returns `null` in container mode. Documented in the demo.
- **A10 — Depth cap = 4 for nested groups in the strict tier.** Bounds `tsc` (roadmap
  top risk §7). Past depth 4 the tail is accepted leniently. 4 covers every realistic
  hand-written query; the runtime parser is uncapped.
- **A11 — `<ratio>` accepts `<number>` or `<number>/<number>`** (e.g. `16/9`, `1`,
  `1.5`), no zero/negative range-check on the second term (lenient, §7 precedent).
- **A12 — Integer features (`color`, `monochrome`, `color-index`) validated as
  `<number>`**, not strictly non-negative integer. Lenient (§7).
- **A13 — `not` at top level applies to a single test or group** (CSS:
  `@media not (…)`). The flat UI exposes a top-level `not` toggle; combined with the
  flat joiner it negates the whole flat condition by wrapping it (serialized as
  `not (…)` when more than one test, since `not` binds one operand).
- **A14 — Suggestion strings are permissive** (`\`(${string})\` | (string & {})`
  shaped). The strict tier is the gate (mirrors `if-function`'s `IfFunctionString`).
- **A15 — Reuse `unit-input` for length values only.** Ratio / resolution / integer /
  enum values use a plain `<input>` or `<select>` (no length unit semantics). Matches
  the contract ("Reuse unit-input for length-valued features").

---

## 12. Risks specific to this component

- **Type-budget (roadmap top risk).** Two validators × a feature table × recursive
  condition splitting. Mitigation: depth cap (A10), lenient tails (§3.4), flat folds
  (no higher-kinded gymnastics), and the no-mix check done by a cheap "does the other
  joiner appear at top level" scan rather than a full re-parse. Watch `tsc` wall-time;
  if it spikes, trim the enum feature set first (the enum unions are the cheapest to
  shrink) — but the dispatch table is mostly `extends` chains like `transform-builder`,
  which compiled fine.
- **Feature-table drift (type vs runtime).** Two authorings of the same data.
  Mitigation: one documented `FEATURE_TABLE` shape; the type table and the runtime
  `FEATURE_TABLE` constant sit adjacent and are reviewed together; the parse tests +
  type tests cover the same example features so drift surfaces as a test failure.
- **`matchMedia` in jsdom.** Not implemented. Mitigation: the component guards
  (`typeof window.matchMedia === "function"`) and the test mocks it; `matchesNow`
  returns `null` when absent.
```
