"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { areaNames } from "./grid-builder.helpers"

// ---------------------------------------------------------------------------
// AreasEditor + AreasPainter (public)
// ---------------------------------------------------------------------------

export interface AreasEditorProps {
  matrix: string[][]
  onChange: (matrix: string[][]) => void
  className?: string
}

export function AreasEditor({ matrix, onChange, className }: AreasEditorProps) {
  const rows = matrix.length
  const cols = rows > 0 ? matrix[0].length : 0

  const resize = (nextRows: number, nextCols: number) => {
    const r = Math.max(1, nextRows)
    const c = Math.max(1, nextCols)
    const next: string[][] = []
    for (let i = 0; i < r; i++) {
      const row: string[] = []
      for (let j = 0; j < c; j++) {
        row.push(matrix[i]?.[j] ?? ".")
      }
      next.push(row)
    }
    onChange(next)
  }

  if (rows === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <p className="px-1 py-2 text-muted-foreground text-xs">No areas yet.</p>
        <button
          type="button"
          onClick={() =>
            onChange([
              ["a", "a"],
              ["b", "b"],
            ])
          }
          className="rounded-md border border-dashed bg-background px-2.5 py-1.5 font-mono text-muted-foreground text-xs hover:bg-muted/50"
        >
          + start a 2×2 grid
        </button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <AreasPainter matrix={matrix} onChange={onChange} />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono text-muted-foreground">
          {rows}×{cols}
        </span>
        <Stepper
          label="rows"
          unit="row"
          onDec={() => resize(rows - 1, cols)}
          onInc={() => resize(rows + 1, cols)}
        />
        <Stepper
          label="cols"
          unit="column"
          onDec={() => resize(rows, cols - 1)}
          onInc={() => resize(rows, cols + 1)}
        />
      </div>
    </div>
  )
}

function Stepper({
  label,
  unit,
  onDec,
  onInc,
}: {
  label: string
  unit: string
  onDec: () => void
  onInc: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-muted-foreground">{label}</span>
      <button
        type="button"
        aria-label={`Remove ${unit}`}
        onClick={onDec}
        className="h-6 w-6 rounded border font-mono hover:bg-muted/50"
      >
        −
      </button>
      <button
        type="button"
        aria-label={`Add ${unit}`}
        onClick={onInc}
        className="h-6 w-6 rounded border font-mono hover:bg-muted/50"
      >
        +
      </button>
    </span>
  )
}

export interface AreasPainterProps {
  matrix: string[][]
  onChange: (matrix: string[][]) => void
  className?: string
}

/**
 * A grid of clickable cells. Clicking a cell cycles it through the current
 * palette of area names plus `.` (null cell). Writes the new matrix back —
 * a pure inline-style React grid (no browser automation).
 */
export function AreasPainter({
  matrix,
  onChange,
  className,
}: AreasPainterProps) {
  const cols = matrix[0]?.length ?? 0
  const palette = useMemo(() => {
    const names = areaNames(matrix)
    const base = names.length > 0 ? names : ["a"]
    return [...base, "."]
  }, [matrix])

  const cycle = (r: number, c: number) => {
    const current = matrix[r][c]
    const idx = palette.indexOf(current)
    const nextName = palette[(idx + 1) % palette.length]
    onChange(
      matrix.map((row, ri) =>
        row.map((cell, ci) => (ri === r && ci === c ? nextName : cell)),
      ),
    )
  }

  return (
    <div
      data-grid-painter
      className={cn("grid gap-1", className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {matrix.map((row, r) =>
        row.map((cell, c) => {
          const isNull = /^\.+$/.test(cell)
          return (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: cells are positional in a fixed grid
              key={`${r}-${c}`}
              type="button"
              aria-label={`Cell row ${r + 1} column ${c + 1}: ${isNull ? "empty" : cell}`}
              onClick={() => cycle(r, c)}
              className={cn(
                "flex h-12 items-center justify-center rounded border font-mono text-xs",
                isNull
                  ? "border-dashed bg-muted/30 text-muted-foreground"
                  : "border-primary/40 bg-primary/10 text-foreground",
              )}
            >
              {isNull ? "." : cell}
            </button>
          )
        }),
      )}
    </div>
  )
}
