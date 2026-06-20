"use client"

import { cn } from "@/lib/utils"
import {
  cellToKeywords,
  formatPositionArea,
} from "./anchor-position-editor.helpers"
import type { PositionAreaState } from "./anchor-position-editor.types"
import { AnchorPreview } from "./anchor-preview"

// ---------------------------------------------------------------------------
// PositionAreaGrid (public) — the 3×3 clickable placement grid à la
// grid-builder's AreasPainter. Each cell is a labelled `<button>` (the
// stable physical name, e.g. "place at top left") with `aria-pressed`. A
// logical/physical header toggle swaps the EMITTED vocabulary to block/inline
// for the same cells; a span toggle switches the emitted keywords to their
// `span-` reach forms. Editing one coordinate system at a time guarantees the
// cross-axis type rule by construction — the grid never mixes systems.
// A live mini snap-preview (AnchorPreview) reflects the current cell.
// ---------------------------------------------------------------------------

type Cell = 0 | 1 | 2

const ROW_LABELS = ["top", "center", "bottom"] as const
const COL_LABELS = ["left", "center", "right"] as const

/** Re-express a physical keyword in the logical (block/inline) vocabulary. */
function toLogical(keyword: string): string {
  switch (keyword) {
    case "top":
      return "block-start"
    case "bottom":
      return "block-end"
    case "left":
      return "inline-start"
    case "right":
      return "inline-end"
    default:
      return keyword // center stays neutral
  }
}

/** Apply the `span-` reach prefix (center / neutral keywords stay as-is). */
function toSpan(keyword: string): string {
  if (keyword === "center") return keyword
  return `span-${keyword}`
}

/**
 * The emitted keyword list for a grid state — the row+col pair mapped through
 * the system + span toggles, then collapsed (`center center` → `center`).
 */
export function stateToKeywords(state: PositionAreaState): string[] {
  let [rowKw, colKw] = cellToKeywords(state.row, state.col)
  if (state.system === "logical") {
    rowKw = toLogical(rowKw)
    colKw = toLogical(colKw)
  }
  if (state.span) {
    rowKw = toSpan(rowKw)
    colKw = toSpan(colKw)
  }
  return [rowKw, colKw]
}

export interface PositionAreaGridProps {
  system: "physical" | "logical"
  span: boolean
  row: Cell
  col: Cell
  onChange: (next: PositionAreaState) => void
  className?: string
}

export function PositionAreaGrid({
  system,
  span,
  row,
  col,
  onChange,
  className,
}: PositionAreaGridProps) {
  const state: PositionAreaState = { system, span, row, col }
  const live = formatPositionArea(stateToKeywords(state))

  const pick = (r: Cell, c: Cell) => onChange({ ...state, row: r, col: c })

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="flex h-8 items-center gap-1.5 rounded-md border border-input px-2 font-mono text-muted-foreground">
          <input
            type="checkbox"
            aria-label="use the logical (block / inline) coordinate system"
            checked={system === "logical"}
            onChange={(e) =>
              onChange({
                ...state,
                system: e.target.checked ? "logical" : "physical",
              })
            }
            className="size-3.5"
          />
          logical
        </label>
        <label className="flex h-8 items-center gap-1.5 rounded-md border border-input px-2 font-mono text-muted-foreground">
          <input
            type="checkbox"
            aria-label="span the chosen edges (span- reach)"
            checked={span}
            onChange={(e) => onChange({ ...state, span: e.target.checked })}
            className="size-3.5"
          />
          span
        </label>
      </div>

      <div data-position-area-grid className="grid w-fit grid-cols-3 gap-1">
        {([0, 1, 2] as const).map((r) =>
          ([0, 1, 2] as const).map((c) => {
            const label = `place at ${ROW_LABELS[r]} ${COL_LABELS[c]}`
            const selected = r === row && c === col
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                aria-label={label}
                aria-pressed={selected}
                onClick={() => pick(r, c)}
                className={cn(
                  "size-12 rounded border font-mono text-[10px]",
                  selected
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-input bg-background text-muted-foreground hover:bg-muted/50",
                )}
              >
                {r === 1 && c === 1 ? "•" : ""}
              </button>
            )
          }),
        )}
      </div>

      <AnchorPreview value={live} />
    </div>
  )
}
