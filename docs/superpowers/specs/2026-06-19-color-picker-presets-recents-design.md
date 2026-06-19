# ColorPicker: `presets` + controllable `history` — Design

Date: 2026-06-19
Component: `src/components/ui/color-picker/`
Status: approved (delegate brainstorm)

## Goal

Expand `ColorPicker` with two consumer-facing capabilities:

1. **`presets`** (new prop) — replace the hardcoded 10-swatch palette with a
   consumer-supplied list. Each entry is either a color value **or** a CSS
   variable reference. `undefined` keeps current behavior.
2. **History / recents** — a row of recently picked colors, supporting both
   **controlled** and **uncontrolled** usage. Element type mirrors the
   `value`/`onChange` mode discrimination.

All new props are optional; existing call sites compile and behave identically.

## Background (current state)

- `ColorPickerProps<TMode extends ColorMode | undefined = undefined>` is generic
  over the output mode. `onChange`'s parameter is
  `TMode extends ColorMode ? ColorStringMap[TMode] : ColorString` — strict when
  `mode` is set, the broad `ColorString` union when unset.
- Internal canonical state is `Oklch {l,c,h,a}`. `emit(next: Oklch, mode?)`
  formats via `formatColor` and calls `onChange`; `lastEmittedRef` guards the
  `value`→internal resync `useEffect`.
- `parseColor(value)` returns `{oklch, mode} | null`. It does **not** understand
  CSS variables — `parseColor("var(--x)") === null`. Unparseable `value` renders
  a fallback swatch and the picker does not open.
- Presets today: 10 hardcoded oklch colors in `color-picker.constants.ts`
  (`PRESETS`), rendered by `preset-palette.tsx` calling `onPick({l,c,h,a:1})`.
  No prop to customize.
- No history/recents. No controllable-state hook anywhere in the repo. The
  shadcn `<Popover>` is currently used uncontrolled.
- Project is a shadcn registry: every component must stay **self-contained** (no
  shared-internal DRY across components, no new external deps for what a few
  local lines can do).
- Project uses Tailwind v4 `@theme`; theme tokens are namespaced `--color-*`
  (e.g. `--color-primary: oklch(0.85 0.15 290)` in `src/index.css`).

## API

### New exported type alias

In `color-picker.types.ts` (a `type`, not `interface` — it is a conditional):

```ts
export type ColorValue<TMode extends ColorMode | undefined = undefined> =
  TMode extends ColorMode ? ColorStringMap[TMode] : ColorString
```

This is the extraction of the conditional currently inlined in `onChange`.
`onChange` is refactored to consume it, so `onChange`, `history`,
`defaultHistory`, and `onHistoryChange` share one byte-for-byte source of truth
and cannot drift. Verified with `tsc --noEmit` against the real file: the
extraction plus the three new history props compiles with zero regression.

Exported from `index.ts`.

### Props

```ts
export interface ColorPickerProps<TMode extends ColorMode | undefined = undefined> {
  value: ColorString | (string & {})
  onChange: (value: ColorValue<TMode>) => void
  mode?: TMode
  native?: boolean
  className?: string
  "aria-label"?: string

  /**
   * Preset swatches. Each entry is a color value OR a CSS variable reference
   * (`"var(--color-primary)"` or bare `"--color-primary"`).
   *
   * - `undefined` → the built-in default palette (current behavior).
   * - `[]` → no preset row.
   *
   * NOTE: in this project theme tokens are Tailwind v4 `--color-*`; pass the
   * full name, e.g. `var(--color-primary)`. A CSS-var entry must resolve to an
   * sRGB-representable color; wide-gamut `color(display-p3 ...)` tokens are not
   * supported (see Limitations).
   */
  presets?: ReadonlyArray<ColorString | (string & {})>

  /** Controlled recents. When provided, the component does not own this state. */
  history?: ReadonlyArray<ColorValue<TMode>>
  /** Uncontrolled initial recents. Ignored if `history` is provided. */
  defaultHistory?: ReadonlyArray<ColorValue<TMode>>
  /**
   * Fired when recents change (a color committed on popover close). Fires in
   * both controlled and uncontrolled modes. Passing `history` WITHOUT
   * `onHistoryChange` yields a read-only (frozen) recents row.
   */
  onHistoryChange?: (history: ColorValue<TMode>[]) => void
}
```

`presets`, `history`, `defaultHistory` are `ReadonlyArray` so callers can pass
`as const`/frozen arrays without variance complaints.

## Behavior

### Presets

- `presets === undefined` → render the existing default palette unchanged.
- `presets === []` → render no preset row.
- otherwise → render the supplied list in order.

### CSS-variable presets

Display and click-resolution are separable:

- **Display** — the swatch is `style={{ backgroundColor: normalizeCssVar(entry) }}`.
  The browser resolves `var(...)` natively against the cascade; theme-reactive,
  no JS. `normalizeCssVar` maps a bare `--x` to `var(--x)` and passes everything
  else through.
- **Click → resolve to a concrete color** (onChange cannot receive a `var()`):
  - **Non-var entry** → `parseColor(entry)` directly. Lossless — preserves
    wide-gamut oklch and avoids a forced style flush.
  - **Var entry** → set `probe.style.color = var(...)`, read
    `getComputedStyle(probe).color` (a concrete `rgb()`/`oklch()` string), feed
    to `parseColor`. The probe lives **inside `PopoverContent`** (via a ref) so
    component-scoped theme vars are in cascade scope. SSR-guarded
    (`typeof document !== "undefined"`). Resolve only at click time (post-mount).
  - If resolution yields an unparseable / empty / transparent-sentinel value,
    the click is a no-op (swatch inert) — matching the component's existing
    "unparseable → do nothing" posture.

### Click-emit semantics (presets + recents)

Every swatch click routes through the existing `emit(oklch)`, which formats via
`formatColor(_, activeMode)` and calls `onChange`. So `onChange` always receives
a value in the **active mode** (`modeProp ?? internalMode`) — never the raw
`var(...)` or the entry's original format. This is the only branch that keeps
`onChange`'s declared `ColorValue<TMode>` return type sound (a raw var string is
not a `ColorString`). The single bridge is the pre-existing
`as Parameters<typeof onChange>[0]` cast in `emit`.

### History / recents

- **Controlled vs uncontrolled** via a self-contained `useControllableState<T>`
  hook (new `color-picker.hooks.ts`). No external dependency; consistent with
  registry self-containment. Discriminated at runtime by `history !== undefined`.
- **Storage** — internally `string[]`. The conditional `ColorValue<TMode>` is
  confined to the prop surface; one explicit `as ColorValue<TMode>[]` cast at the
  `onHistoryChange` boundary, mirroring the existing line-130 emit cast. The hook
  is instantiated `useControllableState<string[]>`, not the conditional type, to
  avoid threading conditional-type variance through every setter call. (Safe
  because every member of `ColorString` is a `string` subtype; a code comment
  asserts this invariant.)
- **Commit trigger = popover close.** The component takes ownership of popover
  open state (`<Popover open={open} onOpenChange={...}>`). The pad/hue/alpha
  strips fire `onChange` on every pointer-move; committing per frame would flood
  recents with intermediate colors. One commit per open→closed edge captures the
  user's final color. An `openValueRef` snapshot taken at open is compared on
  close so opening-without-editing records nothing, and a stale `lastEmittedRef`
  from a prior session is never recorded.
- **Dedup = raw active-mode string equality**, move-to-front on re-pick.
  Canonical-key dedup was rejected: hex8 keys over-merge wide-gamut oklch (both
  clamp to the same `#rrggbbaa`), and rounded-oklch keys under-merge across modes
  (sRGB round-trip drift makes the same color key differently from hex vs oklch
  origin). Raw-string dedup matches the "recents = the strings I picked" mental
  model and lets distinct notations of the same color coexist if the user chose
  them. Entries `parseColor` cannot parse are never deduped (no oklch to key).
- **Cap = `MAX_RECENTS = 8`** (fixed constant; no `maxHistory` prop — YAGNI, can
  be promoted later without a breaking change). `slice(0, MAX_RECENTS)` after
  unshift.
- **Native `<input type=color>` mode** has no popover lifecycle and records no
  recents.

### Render layout

- A reusable `SwatchRow` component (renamed from `preset-palette.tsx` →
  `swatch-row.tsx`) renders a row of color swatches from raw strings, css-var
  aware, returning `null` when empty. Used for **both** presets and recents
  (intra-component DRY is allowed; only cross-component DRY is forbidden).
- Presets row keeps its current position (in the eyedropper row,
  `data-slot="color-picker-presets"`). Recents row renders directly below,
  `data-slot="color-picker-recents"`, only when non-empty.
- Empty-row guards: when `presets === []` **and** the eyedropper is unavailable,
  the top row does not render (no stray flex gap). The recents row renders only
  when `recents.length > 0`.
- A11y: each swatch is a `type="button"` with a per-color `aria-label`
  (`preset <name|string>` / `recent <string>`); containers keep `data-slot`
  hooks. Default presets keep their color names for the label; custom presets and
  recents use the entry string as its own label.

## Files

| File | Change |
|------|--------|
| `color-picker.types.ts` | add exported `ColorValue<TMode>`; refactor `onChange` to use it; add `presets`, `history`, `defaultHistory`, `onHistoryChange` to `ColorPickerProps` |
| `color-picker.tsx` | own popover `open`/`onOpenChange`; `useControllableState` for recents; `openValueRef` snapshot + commit-on-close (dedup + cap); `handlePickString` resolver; probe span inside `PopoverContent`; render presets + recents `SwatchRow`s |
| `color-picker.hooks.ts` | **NEW** — `useControllableState<T>` (~25 lines: memoized setter via `useCallback`, ref to avoid stale `onChange`/value, functional-updater support) |
| `color-picker.helpers.ts` | add `isCssVar(s)`, `normalizeCssVar(s)`, `resolveCssColor(raw, probe)` (SSR-guarded, parseColor-first) |
| `color-picker.constants.ts` | add `MAX_RECENTS = 8` |
| `preset-palette.tsx` → `swatch-row.tsx` | generalize to `SwatchRow` (raw strings, css-var-aware display, `onPick(raw)`, `null` when empty) |
| `index.ts` | export `ColorValue` type |
| `registry.json` | swap `preset-palette.tsx` → `swatch-row.tsx`; add `color-picker.hooks.ts` to the color-picker `files` array |
| `color-picker.spec.tsx` | **NEW** — jsdom spec locking dedup/cap + controlled/uncontrolled history logic |

`registryDependencies: ["button", "popover"]` unchanged — no new external dep.

## Testing

- **jsdom spec** (`color-picker.spec.tsx`): `useControllableState` controlled vs
  uncontrolled transitions; recents dedup (move-to-front) and cap at
  `MAX_RECENTS`; commit-on-close fires once with the final color and no-ops on
  open-without-edit.
- **CSS-var resolution** needs a real browser cascade (`getComputedStyle`) — left
  to manual / Claude Preview verification, not the jsdom spec.

## Backward compatibility

- All new props optional with `undefined` defaults reproducing current behavior:
  `presets` undefined → default palette; history props undefined → uncontrolled
  empty recents, row hidden until first pick.
- The `onChange` refactor is referentially transparent (`ColorValue<TMode>` *is*
  the former inline conditional), so every existing consumer
  (gradient-editor, color-function editors, filter-builder, box-shadow-editor)
  compiles unchanged.
- Popover moving from uncontrolled to controlled-open is internal; external
  behavior (trigger opens, Esc/outside-click closes) is preserved by Radix since
  both `open` and `onOpenChange` are wired.
- Registry entry only gains/renames file rows; component stays installable and
  self-contained.

## Limitations

- **CSS-var emit is a snapshot, not a binding.** Clicking a `var(--x)` preset
  emits the resolved concrete color; the emitted value does not stay bound to the
  variable if the theme later changes. Unavoidable given `onChange`'s concrete
  return type.
- **Wide-gamut P3 vars are unsupported.** `parseColor` has no `color()` branch;
  a var resolving to `color(display-p3 ...)` returns `null` and its swatch is
  inert on click. In-gamut oklch/rgb/hsl/hex vars resolve fine. (A `color()`
  parse branch can be added later if needed.)
- **Probe cascade scope.** CSS-var resolution reads from a probe mounted inside
  `PopoverContent` (Radix portals to `document.body` by default). Theme vars on
  `:root`/`body` resolve correctly; a var defined only on a deeper themed wrapper
  that does not reach the portal will resolve to inherited/default.
- **Auto-mode cross-mode duplicates.** With raw-string dedup, the same color
  picked in two different modes (e.g. `#ff0000` then `rgb(255 0 0)`) coexists as
  two recents entries. Intended.
