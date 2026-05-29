// =====================================================================
// filter-builder.constants.ts
//
// Shared, render-free constants and small types/helpers for the filter
// builder UI: the function option-groups, the unit lists, the live
// preview mode type, the scrub descriptors, and the item ↔ single-value
// helpers used by both the row editors and the preview scrubbers. Kept in
// a non-component module so the .tsx files stay component-only (avoids
// react-refresh/only-export-components churn).
// =====================================================================

import type { FilterFunctionName, FilterItem } from "./filter-builder.types"

// ---------------------------------------------------------------------------
// Function groups (for the <select> option-groups)
// ---------------------------------------------------------------------------

export const FUNCTION_GROUPS: ReadonlyArray<{
  label: string
  fns: readonly FilterFunctionName[]
}> = [
  { label: "blur", fns: ["blur"] },
  {
    label: "color",
    fns: [
      "brightness",
      "contrast",
      "grayscale",
      "invert",
      "opacity",
      "saturate",
      "sepia",
      "hue-rotate",
    ],
  },
  { label: "shadow", fns: ["drop-shadow"] },
  { label: "svg", fns: ["url"] },
]

// ---------------------------------------------------------------------------
// Unit lists (per argument kind)
// ---------------------------------------------------------------------------

export const LENGTH_UNITS = ["px", "rem", "em", "%", "vw", "vh"] as const
export const ANGLE_UNITS = ["deg", "grad", "rad", "turn"] as const
export const AMOUNT_UNITS = ["", "%"] as const

// ---------------------------------------------------------------------------
// Live-preview mode
// ---------------------------------------------------------------------------

export type FilterMode = "filter" | "backdrop-filter"

// ---------------------------------------------------------------------------
// item ↔ single-value helpers (UI-local)
// ---------------------------------------------------------------------------

/** The single editable value for the non-shadow / non-url families. */
export function singleValue(
  item: Exclude<FilterItem, { fn: "drop-shadow" | "url" }>,
): string {
  return item.value
}

/** Rebuild a single-arg item from an edited value string. */
export function withSingleValue(
  fn: FilterFunctionName,
  value: string,
): FilterItem {
  if (fn === "url") return { fn, url: value }
  // blur / hue-rotate / amount families all carry `value`
  return { fn, value } as FilterItem
}

// ---------------------------------------------------------------------------
// Preview scrub descriptors
// ---------------------------------------------------------------------------

export interface Scrub {
  fn: FilterFunctionName
  label: string
  min: number
  max: number
  step: number
  unit: string
}

export const SCRUBS: readonly Scrub[] = [
  { fn: "blur", label: "blur", min: 0, max: 20, step: 0.5, unit: "px" },
  {
    fn: "brightness",
    label: "brightness",
    min: 0,
    max: 3,
    step: 0.05,
    unit: "",
  },
  { fn: "contrast", label: "contrast", min: 0, max: 3, step: 0.05, unit: "" },
  { fn: "saturate", label: "saturate", min: 0, max: 3, step: 0.05, unit: "" },
  {
    fn: "hue-rotate",
    label: "hue-rotate",
    min: 0,
    max: 360,
    step: 1,
    unit: "deg",
  },
]
