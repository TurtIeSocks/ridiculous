# EasingPicker API Reference

CSS easing function picker with bezier, steps, spring/bounce/wiggle physics, polynomial preset gallery, and animation preview.

## Install

```bash
npx shadcn add https://turtiesocks.github.io/ridiculous/r/easing-picker.json
```

## Components

### `EasingPicker`

Popover-wrapped composed wizard.

**Props:**
- `value: EasingString | (string & {})` — required. CSS easing function or keyword.
- `onChange: (value) => void` — required. Type narrows based on `basis` prop.
- `basis?: EasingBasis` — optional. Lock to one of `"bezier" | "spring" | "bounce" | "wiggle" | "steps"`. Narrows `onChange` parameter type.
- `output?: "css" | "tailwind-v3" | "tailwind-v4"` — default snippet format in the OutputPanel.
- `className?: string`
- `aria-label?: string`

### `EasingPanel`

Same as `EasingPicker` but renders the wizard inline without a popover wrapper.

### Sub-components

All controlled-only — `value` + `onChange` required.

- `BezierCanvas` — draggable P1/P2 SVG canvas.
- `PresetGallery` — 39-preset card grid.
- `EasingPreview` — CSS-animated preview with 6 property options.
- `StepsControls` — n + position editor.
- `SpringControls` — stiffness/damping/mass sliders.
- `BounceControls` — bounces/stiffness sliders.
- `WiggleControls` — wiggles/damping sliders.

## Types

- `EasingString` — union of all valid output strings.
- `EasingLiteral<S>` — strict literal validator for call-site validation.
- `easing()` — call-site validator helper, mirrors `color()` and `gradient()`.
- `PresetName` — named preset union.
- `EasingState` — internal discriminated union (exported for advanced use).
- `EasingStringMap` / `EasingBasis` — basis → output-string map for type narrowing.

## Helpers

- `parseEasing(s)` — string → `EasingState | null`.
- `formatEasing(state)` — `EasingState` → CSS-valid string.
- `bezierFromPreset(name)` — preset name → `cubic-bezier(...)` literal.
- `matchPreset(x1, y1, x2, y2)` — reverse lookup by coords with tolerance 0.005.
- `sampleSpring(k, c, m, n)` / `sampleBounce(n, k)` / `sampleWiggle(n, d)` — physics samplers.
- `bakeLinear(samples)` — sample array → `linear(...)` string with collinear-prune pass.

## Limitations

- Round-trip from `linear()` back to physics params is lossy — the baked output erases the source `{stiffness, damping, mass}`.
- Preset selection emits the underlying `cubic-bezier(...)` literal, never the keyword form.
- `LinearLiteral<S>` does weak validation (variadic stop ranges not checked at type level); runtime parser is authoritative.

## Out of scope (v1)

- `linear()` multi-stop direct editor.
- Share-link URL state encoding.
- RotateX / RotateY preview properties.
- Shape morph preview.
- Custom preset / property registration.
