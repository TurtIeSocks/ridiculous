"use client"

import { cn } from "@/lib/utils"
import { selectorToPercent } from "./keyframes-editor.helpers"
import type { KeyframeBlock } from "./keyframes-editor.types"

// ---------------------------------------------------------------------------
// KeyframeTimeline (public) — a horizontal 0–100% track with one draggable stop
// marker per keyframe block (`from`=0%, `to`=100%, `N%` in between) plus an
// add-stop control and a labelled play-head slider that scrubs the live
// preview. Selecting a marker raises `onSelect`; the container reveals that
// stop's declaration list. The container owns the `KeyframeBlock[]`; this is
// presentational. a11y: every marker is a labelled button; the play head is a
// labelled `<input type=range>`.
// ---------------------------------------------------------------------------

/** A marker's label percent — the first selector's position on the track. */
function blockPercent(block: KeyframeBlock): number {
  return selectorToPercent(block.selectors[0] ?? "from")
}

export interface KeyframeTimelineProps {
  blocks: KeyframeBlock[]
  selected: number
  position: number
  onSelect: (index: number) => void
  onPosition: (percent: number) => void
  onAddStop: () => void
  onRemoveStop: (index: number) => void
  className?: string
}

export function KeyframeTimeline({
  blocks,
  selected,
  position,
  onSelect,
  onPosition,
  onAddStop,
  onRemoveStop,
  className,
}: KeyframeTimelineProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground uppercase">
          timeline
        </span>
        <button
          type="button"
          aria-label="Add stop"
          onClick={onAddStop}
          className="rounded border border-dashed px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground"
        >
          + stop
        </button>
      </div>

      {/* The 0–100% track. Markers are absolutely positioned by percent. */}
      <div className="relative h-10 rounded-md border bg-muted/30">
        {/* The play head — a vertical line at the scrub position. */}
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-0 w-px bg-primary"
          style={{ left: `${position}%` }}
        />
        {blocks.map((block, i) => {
          const pct = blockPercent(block)
          const isSelected = i === selected
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: stops are a positional list reordered only by add/remove; index is the stable identity.
              key={`stop-${i}`}
              className="absolute top-1.5 flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${pct}%` }}
            >
              <button
                type="button"
                aria-label={`stop at ${pct}%`}
                aria-pressed={isSelected}
                onClick={() => onSelect(i)}
                className={cn(
                  "size-4 rounded-full border-2 bg-background transition-colors",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/50 hover:border-primary",
                )}
              />
              <span className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                {pct}%
              </span>
              {blocks.length > 1 && (
                <button
                  type="button"
                  aria-label={`remove stop at ${pct}%`}
                  onClick={() => onRemoveStop(i)}
                  className="absolute -top-1.5 -right-2 rounded text-[9px] text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* The play head slider — scrubs the preview. */}
      <input
        type="range"
        aria-label="Play head position"
        min={0}
        max={100}
        step={1}
        value={position}
        onChange={(e) => onPosition(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  )
}
