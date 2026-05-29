import type { GridMode } from "./grid-builder.types"

// ---------------------------------------------------------------------------
// Shared constants for the grid-builder editor + preview.
// ---------------------------------------------------------------------------

export const MODES: readonly { id: GridMode; label: string }[] = [
  { id: "columns", label: "columns" },
  { id: "rows", label: "rows" },
  { id: "areas", label: "areas" },
]

export const LENGTH_UNITS = ["fr", "px", "rem", "em", "%", "vw", "vh"] as const
export const TRACK_KEYWORDS = ["auto", "min-content", "max-content"] as const

export const PREVIEW_BG = [
  "bg-indigo-500/30",
  "bg-pink-500/30",
  "bg-amber-500/30",
  "bg-emerald-500/30",
  "bg-sky-500/30",
  "bg-rose-500/30",
]
