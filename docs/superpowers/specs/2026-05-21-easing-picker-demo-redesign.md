# Easing Picker Demo Redesign

**Date:** 2026-05-21
**Status:** Spec — ready for implementation plan
**Branch:** `claude/distracted-goldberg-cb6a06`

## Problem

The current Easing Picker section in the demo site is structurally identical to the other components' sections: a `SectionHeader` followed by 6 small example cards (`basic-usage`, `type-locked`, `output-formats`, `inline-panel`, `sub-component-bezier`, `sub-component-spring`). It reads as an API reference, not as a sales pitch. The component is the most "playful" of the four (it animates, has presets, has multiple bases), but the demo treats it like the others — quiet, code-snippet-first.

Reference inspiration: [easingwizard.com](https://easingwizard.com/). Single integrated playground with type/basis/preset switchers, a bezier canvas, and a large animated preview with property toggles, duration, and replay controls. The preview is the hook — you can't stop playing with it.

## Goal

Front the Easing Picker section with a hero **playground** that visually sells what the component does, then keep the 6 small examples below as API-surface documentation.

## Non-goals

- Shippable `<EasingPlayground />` registry component. The playground lives in `src/examples/` only.
- Shareable URL hashes / persistent state. Playground state is ephemeral per page load.
- Redesigning the other sections (Color Picker, Gradient Editor, Unit Input). Out of scope.
- Renaming or breaking existing `EasingPicker`, `EasingPanel`, sub-component exports. The registry surface stays stable.

## Architecture

### New component: `EasingPlayground`

Location: `src/examples/easing-picker/playground.tsx`

Demo-only React component. Composes registry sub-components into a 2-column hero layout. Owns its own state. Not exported from the registry, not added to `registry.json`.

### Registry extension: `PreviewProperty`

`src/components/ui/easing-picker/easing-picker.tsx` — extend the `PreviewProperty` union and the `PROP_KEYFRAMES` record to add 4 properties: `scaleX`, `scaleY`, `color`, `blur`.

This is purely additive: existing consumers and existing component internals (`EasingPanel`'s preview dropdown, `EasingPicker`'s popover dropdown) gain the new options automatically because they already read from `PreviewProperty`.

### Demo wiring: `src/app.tsx`

The current Easing Picker section block becomes:

```tsx
<SectionHeader eyebrow="component" title="Easing Picker" description="..." />
<div className="mt-12 space-y-10">
  <EasingPlayground />                                {/* hero */}
  <div className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
    <span className="text-gradient">/</span> API surface
  </div>
  <div className="grid gap-8 lg:grid-cols-2">         {/* examples as catalog */}
    <EasingBasicUsage />
    <EasingTypeLocked />
    <EasingOutputFormats />
    <EasingInlinePanel />
    <EasingSubBezier />
    <EasingSubSpring />
  </div>
</div>
```

All 6 existing examples retained. Section description on `SectionHeader` unchanged.

## Component anatomy

### Container

Single `<section>` (or `<div>`) with the existing `glass-card rounded-2xl` aesthetic:

- Backdrop: 135° gradient from `oklch(0.18 0.04 290)` → `oklch(0.14 0.03 270)` (matches site header tone)
- Border: `border border-white/10`
- Padding: `p-6 md:p-8`
- Width: full container; max-width inherited from parent `max-w-6xl`

### Top strip (full-width row)

- Left: eyebrow `/  component · playground` (mono small-caps) + heading "Easing Picker"
- Right: live emitted easing string in mono (e.g. `cubic-bezier(0.42, 0, 0.58, 1)`), text-muted-foreground

### Two-column grid below the strip

`grid-template-columns: 0.7fr 1fr` on `lg+`, single column below. `align-items: stretch` so columns share height; the preview pane on the right uses `flex-1` to absorb height delta.

### Left column

1. **Basis tabs** — pills: `bezier`, `spring`, `steps`. Uses existing `<BasisTabs />`.
2. **Direction toggle** — pills: `In`, `Out`, `InOut`. Visible only when `basis === "bezier"`. Drives preset variant lookup.
3. **Preset gallery** — custom family-pill row built inside the playground component (NOT the existing `<PresetGallery />`, which is grouped Keywords/Grid/Specials and used by the compact panel). Family pills: `Sine`, `Quad`, `Cubic`, `Quart`, `Quint`, `Expo`, `Circ`, `Back`, plus specials `Anticipate`, `SmoothStep` rendered as a small trailing row. Click resolves the bezier via `PRESETS.find(p => p.family === family && p.direction === direction)`. The PRESETS table has 4 directions (`In`/`Out`/`InOut`/`OutIn`); the playground UX exposes only the first 3 to match Easing Wizard's convention. Visible only when `basis === "bezier"`.
4. **Per-basis editor** —
   - `basis === "bezier"` → `<BezierCanvas />` ~240×240px + `<BezierInputs />` numeric grid
   - `basis === "spring"` → `<SpringControls />`
   - `basis === "steps"` → `<StepsControls />`

### Right column

1. **Animated preview** — `<EasingPreview />` mounted with `showLinearComparison={true}`. The component renders two stacked tracks (curve + linear ghost) so the user can feel the easing's effect.
2. **Property toggles** — pill row of 10: `moveX`, `moveY`, `scale`, `scaleX`, `scaleY`, `rotate`, `opacity`, `width`, `color`, `blur`. Active pill bound to `state.property`.
3. **Controls row** — `▶ replay` button · `loop` checkbox (default checked) · `duration` slider (100ms–2000ms, default 600ms).
4. **Code output block** —
   - Format tabs (`CSS` / `Tailwind v3` / `Tailwind v4`) + copy button
   - Mono code box rendering the format-adapted easing string

## State

Single `useState<PlaygroundState>` owns everything. `PresetFamily` is the union of family strings used in `PRESETS[].family` (`"Sine" | "Quad" | "Cubic" | "Quart" | "Quint" | "Expo" | "Circ" | "Back"`), declared locally in `playground.tsx`:

```ts
interface PlaygroundState {
  basis: "bezier" | "spring" | "steps"

  // bezier
  x1: number
  y1: number
  x2: number
  y2: number
  family: PresetFamily | null         // selected family pill or null (manual edit)
  direction: "In" | "Out" | "InOut"   // matches PresetEntry.direction casing

  // spring
  stiffness: number
  damping: number
  mass: number

  // steps
  steps: number
  position: "start" | "end" | "jump-none" | "jump-both"

  // preview-side
  property: PreviewProperty
  duration: number                    // ms
  loop: boolean
  replayKey: number                   // bumped to remount EasingPreview

  // output
  format: "css" | "tailwind-v3" | "tailwind-v4"
}
```

Derived values (computed each render, not stored):

- `easing: EasingString` — `formatEasing({ basis, ...basisFields })`
- `displayCode: string` — `easing` piped through format adapter:
  - `css` → as-is
  - `tailwind-v3` → wrapped in `transition-timing-function: <s>;`
  - `tailwind-v4` → emitted as a CSS custom property token (matches existing `OutputFormat` behavior in the registry)

## Update flows

| User action | State change |
|-------------|--------------|
| Click family pill | `family = <name>`; resolve preset via `PRESETS.find(p => p.family === family && p.direction === state.direction)`; write `(x1,y1,x2,y2)` from its `bezier` tuple |
| Click direction | If `family != null`, re-lookup at new direction. Always write `direction` |
| Drag bezier canvas | Write `(x1,y1,x2,y2)`; set `family = null` (manual edit invalidates preset match) |
| Edit spring/steps controls | Write basis-specific fields |
| Click property toggle | Write `property` |
| Drag duration slider | Write `duration` |
| Toggle loop | Write `loop` |
| Click format tab | Write `format` |
| Click replay | `replayKey++` — remounts `<EasingPreview key={replayKey} />` to restart the CSS animation |

No URL sync. No localStorage. State is fresh on every page load.

## Registry-side changes

`src/components/ui/easing-picker/easing-picker.tsx`:

```ts
export type PreviewProperty =
  | "moveX" | "moveY"
  | "scale" | "scaleX" | "scaleY"
  | "rotate"
  | "opacity"
  | "width"
  | "color"
  | "blur"

const PROP_KEYFRAMES: Record<PreviewProperty, { from: string; to: string }> = {
  moveX:   { from: "transform: translateX(0)",                    to: "transform: translateX(200px)" },
  moveY:   { from: "transform: translateY(0)",                    to: "transform: translateY(100px)" },
  scale:   { from: "transform: scale(0.5)",                       to: "transform: scale(1.5)" },
  scaleX:  { from: "transform: scaleX(0.5)",                      to: "transform: scaleX(1.5)" },
  scaleY:  { from: "transform: scaleY(0.5)",                      to: "transform: scaleY(1.5)" },
  rotate:  { from: "transform: rotate(0)",                        to: "transform: rotate(360deg)" },
  opacity: { from: "opacity: 0",                                  to: "opacity: 1" },
  width:   { from: "width: 50px",                                 to: "width: 200px" },
  color:   { from: "background-color: oklch(0.55 0.2 300)",       to: "background-color: oklch(0.55 0.2 30)" },
  blur:    { from: "filter: blur(0px)",                           to: "filter: blur(8px)" },
}
```

`PreviewProperty` is already exported via `src/components/ui/easing-picker/index.ts`; extension is purely additive.

`registry.json` does not need updating — `easing-picker.tsx` is already a registry file; rebuilding via `pnpm registry:build` regenerates `public/r/easing-picker.json` with the extended union automatically.

## Visual style

Reuses existing site palette and utility classes. No new design tokens.

| Element | Style |
|---------|-------|
| Container | `glass-card rounded-2xl p-6 md:p-8 border border-white/10` |
| Eyebrow / curve string | `font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground` |
| Section labels (left col) | `font-mono text-[10px] uppercase tracking-widest text-muted-foreground` |
| Code block | `font-mono text-sm bg-background/60 rounded-lg p-3` |
| Pill (default) | `bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs font-mono` |
| Pill (active) | `bg-linear-to-br from-violet-glow to-pink-glow text-background border-transparent` |
| Pill (hover) | `hover:bg-white/10` |
| Bezier canvas bg | `bg-background/40` |
| Bezier curve stroke | `oklch(0.7 0.2 300)` (violet-glow) |
| Bezier linear ghost | `oklch(0.4 0.05 290)` dashed |
| Bezier handles | `oklch(0.8 0.2 340)` filled circles |
| Preview animating box | `bg-linear-to-br from-violet-glow to-pink-glow size-12 rounded-lg shadow-[0_4px_24px_oklch(0.5_0.2_300/0.5)]` |
| Linear ghost box | `bg-muted size-12 rounded-lg opacity-40` |
| Duration slider track | `h-1 rounded-full bg-white/10` |
| Duration slider thumb | `size-3 bg-violet-glow rounded-full` |

### Responsive

- `lg+`: 2-col grid `[0.7fr_1fr]`
- Below `lg`: stacks (left over right), columns full-width
- All controls remain reachable at narrow widths; preview reflows to full container width
- No mobile-specific overrides beyond the implicit column stack

## Testing

### Registry-side (required)

`tests/easing-preview.test.tsx` (or new file if absent):

- For each new property (`scaleX`, `scaleY`, `color`, `blur`):
  - Mount `<EasingPreview easing="ease" property={prop} />`
  - Assert injected `<style>` contains the expected keyframe rule for that property
- Loop the assertion via `it.each([...])` to keep it concise

`tests/easing-preview.test-d.ts` (type-level):

- Assert `PreviewProperty` is structurally equal to `keyof typeof PROP_KEYFRAMES`. Catches future drift where one is updated without the other.

### Playground (light — demo-only)

`tests/easing-playground.test.tsx`:

- Renders without crash (smoke)
- Click a family pill → assert displayed code string updates
- Click a property toggle → assert preview surfaces the new property (via `data-property` attribute on the animating element, or matching CSS rule selector)
- Click replay → assert `<EasingPreview />` remounts (verify via `data-testid` or `key` changes)
- Do NOT cover bezier drag, spring control math, or format conversion — already tested in registry-side suites

### Out of scope for tests

- Layout / CSS visual correctness — verify in dev preview server (`pnpm dev` + `preview_start`)
- Format adapter logic for Tailwind v3 / v4 — covered by existing easing-picker output tests
- Bezier canvas drag mechanics — existing sub-component tests cover

### Vitest configuration

No config changes required. New tests land in `tests/` and are picked up by the existing `vitest run` glob (worktrees already excluded via prior cleanup).

## Risk / migration

- **No breaking changes.** Registry surface gains 4 new `PreviewProperty` members; consumers using narrowing on a subset get a type error only if they exhaustively listed members (rare). Recommend a single `CHANGELOG` line note when publishing.
- **No data migration.** Demo state is ephemeral.
- **Performance:** preview restart via `key` bump remounts `<EasingPreview />` on each replay click. This is the existing pattern; no new heap pressure.
- **Bundle size:** playground is demo-only, not shipped to consumers. Registry bundle gains ~400 bytes from the 4 new `PROP_KEYFRAMES` entries — negligible.

## Acceptance criteria

- [ ] `src/examples/easing-picker/playground.tsx` exists and renders the 2-col hero
- [ ] `PreviewProperty` includes `scaleX`, `scaleY`, `color`, `blur`; `PROP_KEYFRAMES` covers all 10
- [ ] `src/app.tsx` imports + renders `EasingPlayground` above the existing 6 examples
- [ ] Existing 6 examples wrapped in `<div className="grid gap-8 lg:grid-cols-2">` with `/  API surface` label above
- [ ] `pnpm test` passes (all existing + new tests)
- [ ] `pnpm typecheck` clean
- [ ] `pnpm lint` no new warnings
- [ ] `pnpm registry:build` succeeds
- [ ] Manual: open `pnpm dev`, scroll to Easing Picker section, verify playground renders, every basis switches, every property toggle animates a different visual, replay restarts cleanly, code box updates live
