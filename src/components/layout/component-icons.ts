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
  "color-picker": Pipette,
  "unit-input": Ruler,
  "gradient-editor": Blend,
  "easing-picker": Spline,
  "calc-editor": Calculator,
  "transform-builder": Axis3d,
  "filter-builder": Aperture,
  "grid-builder": Grid3x3,
  "clip-path-editor": Scissors,
  "box-shadow-editor": SquareStack,
  "transition-editor": Clapperboard,
  "font-editor": Type,
  "color-function": SwatchBook,
  "if-function": GitBranch,
  "query-builder": MonitorSmartphone,
}

/**
 * Resolve a component `name` to its icon. Unknown names fall back to the generic
 * `Component` glyph so a newly-added component never breaks the page before its
 * mapping lands (the icon-map test guards against shipping that fallback).
 */
export function iconForComponent(name: string): LucideIcon {
  return COMPONENT_ICONS[name] ?? Component
}
