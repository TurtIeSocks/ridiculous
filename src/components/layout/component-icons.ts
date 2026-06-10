import {
  Aperture,
  Axis3d,
  Blend,
  Braces,
  Calculator,
  Clapperboard,
  Component,
  GitBranch,
  Grid3x3,
  type LucideIcon,
  Map as MapIcon,
  MapPin,
  MonitorSmartphone,
  Pipette,
  Ruler,
  Scissors,
  Spline,
  SquareStack,
  SwatchBook,
  Type,
} from "lucide-react"

/**
 * Lucide icon per registry component, keyed by the component `name` (the same
 * slug used in `registry.json`, the site NAV, and the route path). Each icon is
 * chosen to evoke the CSS feature the component edits.
 *
 * Docs-site concern only — intentionally NOT a field on `registry.json`, so the
 * published registry stays schema-pure for `shadcn add` consumers.
 */
export const COMPONENT_ICONS: Record<string, LucideIcon> = {
  "ridiculous-type-kit": Braces,
  "box-shadow-editor": SquareStack,
  "calc-editor": Calculator,
  "clip-path-editor": Scissors,
  "color-function": SwatchBook,
  "color-picker": Pipette,
  "coordinate-input": MapPin,
  "easing-picker": Spline,
  "filter-builder": Aperture,
  "font-editor": Type,
  "geojson-editor": MapIcon,
  "gradient-editor": Blend,
  "grid-builder": Grid3x3,
  "if-function": GitBranch,
  "query-builder": MonitorSmartphone,
  "transform-builder": Axis3d,
  "transition-editor": Clapperboard,
  "unit-input": Ruler,
}

/**
 * Resolve a component `name` to its icon. Unknown names fall back to the generic
 * `Component` glyph so a newly-added component never breaks the page before its
 * mapping lands (the icon-map test guards against shipping that fallback).
 */
export function iconForComponent(name: string): LucideIcon {
  return COMPONENT_ICONS[name] ?? Component
}
