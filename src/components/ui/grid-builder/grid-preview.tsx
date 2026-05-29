"use client"

import { cn } from "@/lib/utils"
import { PREVIEW_BG } from "./grid-builder.constants"
import {
  areaNames,
  gridAreaFor,
  parseAreas,
  parseTracks,
} from "./grid-builder.helpers"
import type { GridMode } from "./grid-builder.types"

// ---------------------------------------------------------------------------
// GridPreview (public) — the showcase. Pure inline-style display:grid.
// ---------------------------------------------------------------------------

export interface GridPreviewProps {
  mode: GridMode
  columns: string
  rows: string
  areas: string
  className?: string
}

export function GridPreview({
  mode,
  columns,
  rows,
  areas,
  className,
}: GridPreviewProps) {
  if (mode === "areas") {
    const matrix = parseAreas(areas) ?? []
    const names = areaNames(matrix)
    const cols = matrix[0]?.length ?? 1
    const rowCount = matrix.length || 1
    return (
      <div className={cn("space-y-2 rounded-lg border p-3", className)}>
        <div className="text-muted-foreground text-xs">preview · areas</div>
        <div
          data-grid-preview
          className="gap-1.5"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rowCount}, 40px)`,
          }}
        >
          {names.map((name, i) => {
            const area = gridAreaFor(matrix, name)
            return (
              <div
                key={name}
                className={cn(
                  "flex items-center justify-center rounded font-mono text-[11px]",
                  PREVIEW_BG[i % PREVIEW_BG.length],
                )}
                style={{ gridArea: area ?? undefined }}
              >
                {name}
              </div>
            )
          })}
          {names.length === 0 ? (
            <div className="flex h-10 items-center justify-center text-muted-foreground text-xs">
              empty
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  // columns / rows: render N numbered cells in the track layout.
  const tokens = parseTracks(mode === "rows" ? rows : columns) ?? []
  const trackCount = Math.max(1, tokens.filter((t) => t.kind !== "line").length)

  return (
    <div className={cn("space-y-2 rounded-lg border p-3", className)}>
      <div className="text-muted-foreground text-xs">preview · {mode}</div>
      <div
        data-grid-preview
        className="gap-1.5"
        style={{
          display: "grid",
          gridTemplateColumns: mode === "rows" ? undefined : columns,
          gridTemplateRows: mode === "rows" ? rows : undefined,
          gridAutoRows: mode === "rows" ? undefined : "40px",
          gridAutoColumns: mode === "rows" ? "60px" : undefined,
          gridAutoFlow: "row",
          minHeight: 40,
        }}
      >
        {Array.from({ length: trackCount }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional preview cells
            key={i}
            className={cn(
              "flex h-10 items-center justify-center rounded font-mono text-[11px]",
              PREVIEW_BG[i % PREVIEW_BG.length],
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}
