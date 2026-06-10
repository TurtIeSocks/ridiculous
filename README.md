# ridiculous

Ridiculously typed [shadcn](https://ui.shadcn.com) components.

A shadcn-compatible component registry. Each component is built to be
**ridiculously precise** at the type level: template-literal validators
that range-check color tokens, IntelliSense hints for literal shapes, and
ergonomic escape hatches when you just want JavaScript.

## Components

- **Color Picker** — oklch L×C pad, hue/alpha strips, 6 modes (oklch, oklab,
  hex, rgb, hsl, hwb), tiered typing (casual / IntelliSense / strict).
- **Gradient Editor** — linear / radial / conic editor with draggable stops,
  position picker, oklch interpolation, reusable color-picker stops.
- **Unit Input** — typed CSS-unit input (deg / % / px / rem / em / vw / vh)
  with pointer-locked drag scrubbing, Shift / Alt step modifiers, and a
  call-site validator helper per unit.
- **Coordinate Input** — typed lon/lat/alt Position input with pointer-lock
  drag scrubbing, per-axis clamp (±180 / ±90), and a compile-time
  `coordinate()` call-site validator for numeric literals.
- **GeoJSON Editor** — RFC 7946 GeoJSON editor with a headless core, five
  composable view parts (FeatureTree, GeometryFields, PropertiesGrid,
  RawJsonPane, ErrorRail), three layout presets (drill-down / dual-pane /
  toggle), and a `geojson()` call-site helper for geometry-deep compile-time
  validation.

## Install

```bash
npx shadcn add https://turtiesocks.github.io/ridiculous/r/color-picker.json
```

Browse the live demo at <https://turtiesocks.github.io/ridiculous>.

## Development

```bash
pnpm install
pnpm dev               # demo at http://localhost:5173/ridiculous/
pnpm test              # vitest with jsdom + canvas mock
pnpm typecheck         # tsc -b
pnpm check             # biome lint + format check
pnpm build             # registry:build + tsc + vite build → dist/
pnpm registry:build    # emits public/r/*.json
```

## License

MIT
