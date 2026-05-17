# Design — `ridiculous` registry, v0 (Color Picker)

**Date:** 2026-05-17
**Author:** Rin (@TurtIeSocks) + Claude
**Status:** Draft pending user review

## Goal

Bootstrap a new shadcn-compatible component registry named `ridiculous`. The project's identity is **components with ridiculously precise types**: template-literal validators that catch invalid color literals at compile time, range-checked numeric tokens, and tiered ergonomics that don't force the strictness on callers who don't want it.

The first component is a color picker, ported and reworked from `shadcn-admin-kit/src/components/ui/color-picker.tsx`. The source already contains a draft of the type machinery (`Digit`, `HexDigit`, `IsByte`, `HexColor<S>`, `RGBColor<S>`, `ColorValue<S>`, etc.) tacked onto the bottom of the file unused. This spec integrates that machinery into the public API of a multi-file component, splits the file by responsibility, and establishes the registry tooling, demo, deploy pipeline, and tests that future components will follow.

## Non-goals (v0)

- Wide-gamut color spaces (`display-p3`, `rec2020`, `a98-rgb`, `prophoto-rgb`, `xyz`, `xyz-d50`) — these require gamut-aware UI rendering, not just parser/formatter math. Punted to v1.
- CIE Lab/LCh — older perceptual space, less demand now that oklab exists. Punted.
- CSS named colors (`red`, `blue`, `rebeccapurple`) — parse-only convenience, doesn't fit the mode-switcher model. Punted.
- npm publication — `ridiculous` is consumed only via `npx shadcn add <url>`. No `npm install ridiculous`. shadcn's "own your code" model is intentional.
- A separate docs site (MDX, etc.). The demo app is the docs.
- Visual regression / screenshot testing. Browser-provider tests. PR preview deploys. Custom domain.
- Pointer-event interaction tests on the LcPad / HueStrip / AlphaStrip (jsdom pointer simulation is unreliable; needs Playwright).
- Versioned registry URLs (e.g. `color-picker@1.0.0.json`). Single canonical URL, mutate freely. Add semver if/when consumers complain about breaking changes.

## Design philosophy

### "Garbage in, garbage out" public API

The component's public types do **not** force strict literal validation onto callers. Reasoning:

- React state (`const [v, setV] = useState("#fff")`) widens literals to `string` immediately. A strict prop type would break the most common usage pattern.
- Strict validators (the "ridiculous" `ColorLiteral<S>` family) are a power-user opt-in via the exported `color()` helper.
- IntelliSense gets a separate set of *suggestion* types — non-generic template literal flavors like `` `#${string}` `` — that hint at literal shapes in autocomplete without rejecting any string.

The validator types are not wasted; they:
- Power the `color()` helper (literal validation at the call site)
- Are exported for users who want to type their own state strictly
- Are tested at the type level

### Three usage tiers

| Tier | Typing | Example |
|---|---|---|
| Casual | `string` accepted (via `(string & {})` trick) | `<ColorPicker value={state} onChange={setState} />` |
| IntelliSense | `ColorString` suggestion literals show in autocomplete | `<ColorPicker value="oklch(0.5 0.1 240)" />` |
| Strict | `color()` helper validates ranges at compile time | `const c = color("oklch(0.5 0.1 240)")` |

### `onChange` discriminated by `mode`, **not** by `value`

Earlier draft proposed coupling `onChange`'s emitted type to `typeof value`. Rejected because the in-picker mode switcher can change emission mode at runtime, breaking that type contract. Final rule:

- `mode` prop unset → switcher visible → `onChange` emits `ColorString` (the union)
- `mode` prop set → switcher hidden → `onChange` emits `ColorStringMap[TMode]` (locked)

This is sound: the runtime never emits in a mode the type system doesn't expect.

### Multi-file pattern with barrel

Every component in `ridiculous` follows this directory structure:

```
components/ui/<component>/
├── index.ts                       ← barrel: re-exports component + public types
├── <component>.tsx                ← component, sub-components inline
└── <component>.types.ts           ← template literal types, validators, helpers
```

Rationale:
- Splits the ~300 lines of type machinery out of the component file.
- Barrel preserves clean import paths for consumers (`@/components/ui/color-picker`).
- shadcn registry items can declare multiple `files` — multi-file is supported by the tooling.
- Trade-off: consumer's `components/ui/` gains one directory per component instead of one file. Accepted in exchange for keeping component files focused.

Sub-components that are not independently consumable (e.g. `LcPad`, `HueStrip`, `AlphaStrip` inside the color picker) **stay inline** in the component `.tsx`. They are private. Only when a sub-component is intended for consumer composition does it deserve its own file.

## Project layout

```
ridiculous/
├── README.md
├── LICENSE
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── eslint.config.js
├── components.json                ← shadcn config for our demo app's own use
├── registry.json                  ← shadcn registry source-of-truth
├── postcss.config.js              (if Tailwind v4 setup requires it)
├── index.html                     ← demo app entry
├── public/
│   └── r/                         ← built registry JSON, served as static (generated)
│       └── color-picker.json      ← (output of `shadcn build`)
├── src/
│   ├── main.tsx                   ← demo app bootstrap
│   ├── app.tsx                    ← demo routes / examples (kebab filename, App component inside)
│   ├── index.css                  ← tailwind + theme (@theme block, Tailwind v4)
│   ├── lib/
│   │   └── utils.ts               ← cn() helper
│   ├── components/
│   │   └── ui/
│   │       ├── button/            ← shadcn primitive (added locally for demo)
│   │       ├── popover/           ← shadcn primitive (added locally for demo)
│   │       └── color-picker/
│   │           ├── index.ts                 ← barrel
│   │           ├── color-picker.tsx         ← component
│   │           └── color-picker.types.ts    ← types
│   └── examples/
│       └── color-picker/
│           ├── basic-usage.tsx
│           ├── mode-locked.tsx
│           ├── native.tsx
│           ├── tier-casual.tsx
│           ├── tier-intellisense.tsx
│           └── tier-strict.tsx
├── tests/
│   ├── setup.ts                   ← @testing-library/jest-dom + canvas mock
│   ├── color-parse.test.ts
│   ├── color-format.test.ts
│   ├── color-conversions.test.ts
│   ├── color-picker.test.tsx
│   └── color-types.test-d.ts
└── .github/
    └── workflows/
        └── deploy.yml             ← GH Pages on main push
```

**Notes:**
- `button` and `popover` are listed in the color picker's `registryDependencies`. They are **not** re-shipped from the `ridiculous` registry — `npx shadcn add` resolves them against the user's configured shadcn registry (default: shadcn-ui).
- `src/components/ui/button/` and `popover/` exist locally **only for the demo app's own use**. They are added via `npx shadcn add button popover` during project setup, just like any shadcn consumer would.
- Kebab-case for all filenames. PascalCase only for React component identifiers inside the files (`App`, `ColorPicker`).
- `examples/` is for demo-app pages, distinct from the registry component itself.
- `tests/` at repo root, separate from `src/`. Vitest globs `tests/**/*.test.ts` and `tests/**/*.test.tsx` and `tests/**/*.test-d.ts`.

## Type system (`color-picker.types.ts`)

Three named sections, in order:

### 1. Primitives (private)

Building blocks not exported. These re-use the existing draft machinery from the source file (lines 732+):

- `Digit` — `"0" | "1" | ... | "9"`
- `HexDigit` — `Digit | "a" | ... | "f" | "A" | ... | "F"`
- `WS` — whitespace chars
- `TrimLeft<S>`, `TrimRight<S>`, `Trim<S>`
- `AllChars<S, Allowed>`, `NonEmptyAllChars<S, Allowed>`
- `Length<S, A>` — tuple-based string length
- `And<A, B>`, `Or<A, B>` — boolean type logic
- `Enumerate<N, A>`, `IntRange<From, To>` — number range generation
- `StripLeadingZeros<S>`, `NormalizeInt<S>`, `IsIntPart<S>` — integer parsing
- `IsByte<S>` — 0–255
- `IsNumber0To1<S>`, `IsNumber0To100<S>`, `IsNumber0To360<S>`, `IsNumber0To400<S>` — bounded numeric ranges
- `IsPercent0To100<S>` — percentage variant
- `IsAlpha<S>` — 0–1 or 0%–100%
- `IsRgbChannel<S>` — byte or percent
- `IsHue<S>` — bare 0–360, or `deg` / `turn` / `grad` suffix variants
- `IsNonNegativeNumber<S>` — for chroma in oklch
- `KeepIf<B, S>` — conditional `S | never`

### 2. Strict validators (exported, generic)

Built on the primitives. These are the "ridiculous" feature: literal validation with range checking.

- `HexLiteral<S extends string>` — `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`
- `RGBLiteral<S extends string>` — `rgb(r, g, b)` and `rgb(r g b)` syntaxes
- `RGBALiteral<S extends string>` — `rgba(...)` variants and `rgb(r g b / a)`
- `HSLLiteral<S extends string>` — `hsl(...)` variants
- `OKLCHLiteral<S extends string>` — `oklch(...)` variants
- `OklabLiteral<S extends string>` — `oklab(L A B / alpha)`, new for v0
- `HWBLiteral<S extends string>` — `hwb(H W% B% / alpha)`, new for v0
- `ColorLiteral<S extends string>` — union of all validators above

Helper:

```ts
/** Validate a color literal at the call site. */
export const color = <S extends string>(value: S & ColorLiteral<S>): S => value
```

### 3. Suggestion strings (exported, non-generic)

Lightweight template-literal types that show in IntelliSense and are usable as concrete `onChange` return types. **Not** range-validated — those duties belong to the strict validators.

- `HexString` — `` `#${string}` ``
- `RgbString` — variants of `rgb(...)` and `rgba(...)`
- `HslString` — `hsl(...)` variants
- `OklchString` — `oklch(...)` variants
- `OklabString` — `oklab(...)` variants (new)
- `HwbString` — `hwb(...)` variants (new)
- `ColorString` — union of all six

```ts
export interface ColorStringMap {
  hex: HexString
  rgb: RgbString
  hsl: HslString
  oklch: OklchString
  oklab: OklabString
  hwb: HwbString
}

export type ColorMode = keyof ColorStringMap
```

`ColorMode` is derived — single source of truth.

### Resolution of duplicate `ColorValue` from source

The source file declares `ColorValue` twice (line 22 as opaque union, line 1034 as generic validator). The new design eliminates the name conflict:

- The opaque draft union becomes `ColorString` (renamed, narrowed to suggestion role).
- The generic validator becomes `ColorLiteral<S>` (renamed for clarity).
- Both coexist under different names. Each has a distinct role.

## Component API (`color-picker.tsx`)

### Props

```ts
import type {
  ColorString,
  ColorStringMap,
  ColorMode,
} from "./color-picker.types"

export interface ColorPickerProps<
  TMode extends ColorMode | undefined = undefined,
> {
  /** Current color. Accepts any string; IntelliSense suggests literal shapes. */
  value: ColorString | (string & {})

  /**
   * Lock output format. When set, in-picker mode switcher is hidden and
   * onChange always emits in this format. When unset, the switcher is shown
   * and emitted format follows the active switcher selection.
   */
  mode?: TMode

  /**
   * Emits the next color value.
   * - If `mode` is set, value is typed as that mode's string.
   * - If `mode` is unset, value is typed as `ColorString` (union of all modes).
   */
  onChange: (
    value: TMode extends ColorMode ? ColorStringMap[TMode] : ColorString
  ) => void

  /**
   * Render native `<input type="color">` instead of the popover picker.
   * Native input has no alpha and clips to sRGB; wide-gamut and transparent
   * values lose information on edit.
   */
  native?: boolean

  /** Class applied to the trigger swatch (or the native input). */
  className?: string

  /** Accessible label for the trigger. */
  "aria-label"?: string
}
```

### Behavior contract

| `mode` prop | Switcher UI | Active mode source | `onChange` type |
|---|---|---|---|
| `undefined` | visible | auto-detected from `value`, user can change via switcher | `ColorString` |
| `"hex" \| "rgb" \| "hsl" \| "oklch" \| "oklab" \| "hwb"` | hidden | locked to prop | `ColorStringMap[TMode]` |

### Parsing

- `value` parsed once per render via `parseColor()` which returns `{oklch, mode}`.
- Canonical internal representation: oklab/oklch in `{l, c, h, a}`.
- Unparseable `value` → render a static fallback swatch using inline CSS `background-color: value`. No popover. Matches current source behavior.
- `native` mode: parse → format as hex for the `<input type="color">` round-trip. Native input has no alpha; alpha is dropped during native edits.

### Internal sub-components (inline, not exported)

- `LcPad` — L×C canvas for the current hue. Renders a 240×160 px gradient via `oklchToSrgb` over a `<canvas>`.
- `HueStrip` — hue slider 0–360 with `linear-gradient` background.
- `AlphaStrip` — alpha slider 0–1, checkerboard-backed transparent-to-opaque gradient.
- `ModeButtonGroup` — switcher tabs, only rendered when `mode` prop is unset. Shows 6 tabs in v0.

### Emission semantics

- Any slider interaction calls `emit(...)` with the active oklch state.
- `emit(next, mode = activeMode)` → calls `onChange(formatColor(next, mode))`.
- Switcher click → `emit(parsed.oklch, nextMode)` immediately, so the parent state catches up to the new format on the same tick.

### Parse / format / conversion functions (inline in `color-picker.tsx`)

These stay in the component file, **not** split to a separate file. Reasoning: they're tightly coupled to the component's internal canonical representation and not intended for reuse outside it. Functions:

- Parsers: `parseColor`, `parseOklch`, `parseOklab`, `parseHex`, `parseRgb`, `parseHsl`, `parseHwb`
- Formatters: `formatColor`, `formatOklch`, `formatOklab`, `formatHex`, `formatRgb`, `formatHsl`, `formatHwb`
- Conversions: `oklchToSrgb`, `srgbToOklch`, `oklchToOklab`, `oklabToOklch`, `linearToSrgb`, `srgbToLinear`, `hslToSrgb`, `srgbToHsl`, `hwbToSrgb`, `srgbToHwb`
- Helpers: `parseAlphaToken`, `trimNumber`, `clamp01`

### Barrel (`index.ts`)

Re-exports:
- `ColorPicker` (default + named)
- All exported types from `color-picker.types`: `ColorString`, `ColorStringMap`, `ColorMode`, `ColorLiteral`, `HexLiteral`, `RGBLiteral`, `RGBALiteral`, `HSLLiteral`, `OKLCHLiteral`, `OklabLiteral`, `HWBLiteral`, `HexString`, `RgbString`, `HslString`, `OklchString`, `OklabString`, `HwbString`
- `color` helper

Internal helpers (`parseColor`, `formatColor`, etc.) are **not** re-exported.

## Registry (`registry.json`)

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "ridiculous",
  "homepage": "https://turtiesocks.github.io/ridiculous",
  "items": [
    {
      "name": "color-picker",
      "type": "registry:ui",
      "title": "Color Picker",
      "description": "Ridiculously typed color picker with oklch L×C pad, hue/alpha strips, and 6-mode round-trip (oklch, oklab, hex, rgb, hsl, hwb).",
      "registryDependencies": ["button", "popover"],
      "dependencies": [],
      "files": [
        {
          "path": "src/components/ui/color-picker/index.ts",
          "type": "registry:ui",
          "target": "components/ui/color-picker/index.ts"
        },
        {
          "path": "src/components/ui/color-picker/color-picker.tsx",
          "type": "registry:ui",
          "target": "components/ui/color-picker/color-picker.tsx"
        },
        {
          "path": "src/components/ui/color-picker/color-picker.types.ts",
          "type": "registry:ui",
          "target": "components/ui/color-picker/color-picker.types.ts"
        }
      ]
    }
  ]
}
```

**Build:** `pnpm shadcn build` reads `registry.json`, emits `public/r/color-picker.json` containing inlined file contents per `files[].path`. Vite copies `public/` into `dist/` on `pnpm build`. The GH Pages site serves the JSON at `https://turtiesocks.github.io/ridiculous/r/color-picker.json`.

**Consumer install:**

```bash
npx shadcn add https://turtiesocks.github.io/ridiculous/r/color-picker.json
```

**Versioning:** mutate single canonical URL freely (v0). Users re-run `shadcn add` to pull updates. Defer semver until consumers complain about breakage.

## Demo app (`components.json`)

The demo app uses shadcn locally to install its own copies of button + popover. `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- Tailwind v4 (config-less, `@theme` in `src/index.css`).
- `style: "default"`, `baseColor: "neutral"`.
- Aliases map to `src/`.

### Demo app structure (`src/app.tsx`)

Single-page scroll-anchored layout, no router:

- **Hero** — title `ridiculous`, tagline "ridiculously typed shadcn components", GitHub link.
- **Color Picker section**, with sub-sections:
  - Basic Usage (mode unset, onChange logged via small console preview)
  - Mode-Locked (one card per mode: oklch, oklab, hex, rgb, hsl, hwb)
  - Native Variant (native fallback for sRGB-only use cases)
  - Type Tier Showcase:
    - Tier 1 — Casual (`useState("#fff")`)
    - Tier 2 — IntelliSense (literal in JSX, screenshot of autocomplete)
    - Tier 3 — Strict (`color()` helper with a deliberate broken example shown as a code block with `@ts-expect-error`)
  - Install instructions (the `npx shadcn add` URL)
- **Footer** — source link, license.

Demo pages live in `src/examples/color-picker/`. Each is a small self-contained component imported into `app.tsx`. Examples double as living documentation and as smoke-test fixtures.

Switch to a router when the registry grows past ~3 components.

## Build pipeline & deploy

### `vite.config.ts`

```ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

export default defineConfig({
  base: "/ridiculous/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- `base: "/ridiculous/"` because GH Pages serves from `https://turtiesocks.github.io/ridiculous/`.
- Vite handles asset path prefixing.

### Scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "pnpm registry:build && tsc -b && vite build",
    "preview": "vite preview",
    "registry:build": "shadcn build",
    "test": "vitest run",
    "test:watch": "vitest watch",
    "typecheck": "tsc --noEmit -p tsconfig.app.json",
    "lint": "eslint ."
  }
}
```

Order in `build` matters: registry JSON must exist before Vite copies `public/r/` into `dist/`.

### `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- GitHub's native Pages action (replaces the older `gh-pages` branch approach).
- CI gate: lint + typecheck + test must all pass before build.
- No PR preview deploys in v0.

### One-time manual setup

- Repo Settings → Pages → Source: "GitHub Actions" (not branch-based).

## Testing strategy

### Three layers

| Layer | Env | File pattern | Goal |
|---|---|---|---|
| Pure unit (parse/format/convert) | jsdom (or node) | `tests/color-*.test.ts` | 100% line coverage on math |
| Component | jsdom + canvas mock | `tests/color-picker.test.tsx` | Smoke + behavior, not pixel fidelity |
| Type-level | tsc typecheck via vitest | `tests/color-types.test-d.ts` | Validators accept/reject correct literals |

### `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.app.json",
      include: ["tests/**/*.test-d.ts"],
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/components/ui/color-picker/**"],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
})
```

### `tests/setup.ts`

```ts
import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

// jsdom has no canvas. LcPad calls getContext + putImageData on render.
// Without this stub, mount crashes.
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  createImageData: vi.fn((w: number, h: number) => ({
    data: new Uint8ClampedArray(w * h * 4),
    width: w,
    height: h,
    colorSpace: "srgb" as const,
  })),
  putImageData: vi.fn(),
})) as unknown as HTMLCanvasElement["getContext"]
```

DIY canvas stub instead of `vitest-canvas-mock` dependency — only two methods are needed.

### Type-level tests

```ts
// tests/color-types.test-d.ts
import { expectTypeOf, test } from "vitest"
import type { HexLiteral, ColorLiteral } from "@/components/ui/color-picker"
import { color } from "@/components/ui/color-picker"

test("HexLiteral accepts valid hex", () => {
  expectTypeOf<HexLiteral<"#ff0000">>().toEqualTypeOf<"#ff0000">()
  expectTypeOf<HexLiteral<"#fff">>().toEqualTypeOf<"#fff">()
  expectTypeOf<HexLiteral<"#ff0000ff">>().toEqualTypeOf<"#ff0000ff">()
})

test("HexLiteral rejects invalid hex", () => {
  expectTypeOf<HexLiteral<"#zzz">>().toBeNever()
  expectTypeOf<HexLiteral<"#ff">>().toBeNever()
  expectTypeOf<HexLiteral<"ff0000">>().toBeNever()
})

test("color() rejects out-of-range RGB", () => {
  // @ts-expect-error 256 > 255
  color("rgb(256 0 0)")
  // @ts-expect-error 110% > 100%
  color("rgb(110% 0% 0%)")
})
```

### Coverage targets

- **100% line coverage** on parse / format / conversion functions. Math is bug-prone.
- **~70%** on the component itself: renders, mode switcher visibility, fallback path, onChange firing.
- **Type tests:** at least 2 valid + 2 invalid cases per `*Literal<S>` family, plus 1 `@ts-expect-error` per mode for `color()`.

### Implementation order (TDD)

1. Pure math (parse/format/convert) — write tests first, implement, verify.
2. Type machinery (primitives, then validators) — write `.test-d.ts` assertions, implement.
3. Component shell — write smoke tests, implement scaffolding.
4. Sub-components (LcPad / HueStrip / AlphaStrip) — render tests with canvas mock.
5. Integration via `ColorPicker` — interaction tests.

### Deferred to v1

- Pointer-event simulation tests on LcPad / HueStrip / AlphaStrip.
- Visual regression / screenshot tests.
- Browser-provider tests (jsdom only for v0).

## Open questions for implementation phase

The following are deliberate design choices that defer decisions to writing-plans / implementation:

- **Exact `OklabLiteral<S>` and `HWBLiteral<S>` shape.** The primitives can be reused (`IsNumber0To1` for L, `IsPercent0To100` for HWB's W/B, ad-hoc bounded number type for oklab a/b which range roughly -0.4 to 0.4). Plan should define the exact bounds and template shapes.
- **`oklab` and `hwb` parser regexes.** Mirror the existing `OKLCH_RE` and `parseHsl` regex patterns. Plan should list them.
- **`oklab` and `hwb` mode-switcher labels.** "oklab" / "hwb" (lowercase, mono font), matching existing tab style.
- **HWB ↔ sRGB conversion math.** Standard CSS Color 4 formulae. Plan should reference the spec section.
- **`shadcn build` CLI invocation details.** Whether it runs from a global `shadcn` install or via `npx shadcn` or via `pnpm dlx shadcn`. Plan should pick one for the workflow.

## Implementation plan reference

After this spec is approved by the user, the writing-plans skill produces a step-by-step plan covering:

1. Repo scaffolding (Vite + React 19 + TS + Tailwind v4 + pnpm).
2. shadcn init + button/popover install.
3. Test infra (vitest config, setup file, canvas mock).
4. Port pure functions (parse/format/convert) with TDD.
5. Add `oklab` + `hwb` to existing 4 modes.
6. Port + restructure type machinery into `color-picker.types.ts` with `.test-d.ts` assertions.
7. Port component + sub-components into `color-picker.tsx` with smoke tests.
8. Wire barrel `index.ts`.
9. Build registry config + verify `shadcn build` output.
10. Build demo app pages.
11. Wire CI workflow.
12. Verify GH Pages deploy + consumer install flow end-to-end.
