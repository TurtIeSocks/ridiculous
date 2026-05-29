"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  areaNames,
  defaultTrack,
  formatAreas,
  formatTracks,
  gridAreaFor,
  parseAreas,
  parseTracks,
  type TrackToken,
} from "./grid-builder.helpers"
import type { GridMode, GridTemplateString } from "./grid-builder.types"

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------

export interface GridBuilderPanelProps {
  value: GridTemplateString | (string & {})
  onChange: (value: GridTemplateString) => void
  /**
   * Which template property the editor targets and the live preview renders.
   * `columns`/`rows` share the track-list grammar; `areas` is the painter.
   * This selects the active tab + preview target — it does not change
   * validation. Defaults to `"columns"`.
   */
  mode?: GridMode
  className?: string
  "aria-label"?: string
}

export interface GridBuilderProps extends GridBuilderPanelProps {}

const MODES: readonly { id: GridMode; label: string }[] = [
  { id: "columns", label: "columns" },
  { id: "rows", label: "rows" },
  { id: "areas", label: "areas" },
]

const LENGTH_UNITS = ["fr", "px", "rem", "em", "%", "vw", "vh"] as const
const TRACK_KEYWORDS = ["auto", "min-content", "max-content"] as const

// ---------------------------------------------------------------------------
// GridBuilder — popover-wrapped
// ---------------------------------------------------------------------------

export function GridBuilder(props: GridBuilderProps) {
  const {
    value,
    className,
    mode = "columns",
    "aria-label": ariaLabel = "Edit a CSS grid template",
  } = props

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 px-3 font-mono", className)}
          aria-label={ariaLabel}
        >
          <span aria-hidden="true" className="text-foreground/60">
            ▦
          </span>
          <span className="text-[10px] text-muted-foreground">{mode}</span>
          <span className="max-w-[200px] truncate text-xs">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <GridBuilderPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// GridBuilderPanel — inline
// ---------------------------------------------------------------------------

export function GridBuilderPanel({
  value,
  onChange,
  mode: modeProp = "columns",
  className,
  "aria-label": ariaLabel = "CSS grid template builder",
}: GridBuilderPanelProps) {
  const [mode, setMode] = useState<GridMode>(modeProp)
  useEffect(() => setMode(modeProp), [modeProp])

  const lastEmittedRef = useRef<string | null>(null)
  const str = String(value)

  // Derive the editable model from the incoming value, by mode.
  const tokens = useMemo<TrackToken[]>(
    () => (mode === "areas" ? [] : (parseTracks(str) ?? [])),
    [str, mode],
  )
  const matrix = useMemo<string[][]>(
    () => (mode === "areas" ? (parseAreas(str) ?? []) : []),
    [str, mode],
  )

  const commitTracks = (next: TrackToken[]) => {
    const out = formatTracks(next)
    lastEmittedRef.current = out
    onChange(out as GridTemplateString)
  }
  const commitAreas = (next: string[][]) => {
    const out = formatAreas(next)
    lastEmittedRef.current = out
    onChange(out as GridTemplateString)
  }

  return (
    <fieldset
      className={cn(
        "m-0 w-[520px] space-y-3 border-0 bg-background p-3",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div
        role="tablist"
        aria-label="Grid template mode"
        className="flex gap-1"
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "flex-1 rounded-md border px-2 py-1.5 font-mono text-xs",
              mode === m.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background text-muted-foreground hover:bg-muted/50",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "areas" ? (
        <AreasEditor matrix={matrix} onChange={commitAreas} />
      ) : (
        <TrackListEditor tokens={tokens} onChange={commitTracks} />
      )}

      <LiveString
        value={mode === "areas" ? formatAreas(matrix) : formatTracks(tokens)}
      />
      <GridPreview
        mode={mode}
        columns={mode === "rows" ? "none" : formatTracks(tokens)}
        rows={mode === "rows" ? formatTracks(tokens) : "none"}
        areas={formatAreas(matrix)}
      />
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// TrackListEditor (public)
// ---------------------------------------------------------------------------

export interface TrackListEditorProps {
  tokens: TrackToken[]
  onChange: (tokens: TrackToken[]) => void
  className?: string
}

export function TrackListEditor({
  tokens,
  onChange,
  className,
}: TrackListEditorProps) {
  const updateAt = (i: number, token: TrackToken) => {
    onChange(tokens.map((t, idx) => (idx === i ? token : t)))
  }
  const removeAt = (i: number) => {
    onChange(tokens.filter((_, idx) => idx !== i))
  }
  const add = (kind: TrackToken["kind"]) => {
    onChange([...tokens, defaultTrack(kind)])
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1.5">
        {tokens.map((token, i) => (
          <TrackTokenRow
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional, reordered only by add/remove
            key={`${token.kind}-${i}`}
            token={token}
            onChange={(next) => updateAt(i, next)}
            onRemove={() => removeAt(i)}
          />
        ))}
        {tokens.length === 0 ? (
          <p className="px-1 py-2 text-muted-foreground text-xs">
            No tracks yet — add a size, function, or named line.
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <AddButton label="+ size" onClick={() => add("size")} />
        <AddButton label="+ function" onClick={() => add("fn")} />
        <AddButton label="+ [line]" onClick={() => add("line")} />
      </div>
    </div>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-dashed bg-background px-2.5 py-1.5 font-mono text-muted-foreground text-xs hover:bg-muted/50"
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// TrackTokenRow (public)
// ---------------------------------------------------------------------------

export interface TrackTokenRowProps {
  token: TrackToken
  onChange: (token: TrackToken) => void
  onRemove: () => void
  className?: string
}

/** Split "10px"/"1fr"/"50%" into number + unit; opaque (calc/keyword) → null. */
function splitSize(value: string): { num: string; unit: string } | null {
  const m = value.match(/^(-?\d*\.?\d+)([a-z%]*)$/i)
  if (!m) return null
  return { num: m[1], unit: m[2] }
}

export function TrackTokenRow({
  token,
  onChange,
  onRemove,
  className,
}: TrackTokenRowProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
        className,
      )}
    >
      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
        {token.kind}
      </span>
      <div className="flex flex-1 flex-wrap items-center gap-1">
        {token.kind === "size" ? (
          <SizeEditor
            value={token.value}
            onChange={(value) => onChange({ kind: "size", value })}
          />
        ) : token.kind === "line" ? (
          <Input
            aria-label="line names"
            value={token.names.join(" ")}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => {
              const names = e.target.value.split(/\s+/).filter(Boolean)
              onChange({
                kind: "line",
                names,
                value: `[${names.join(" ")}]`,
              })
            }}
            className="h-8 w-full font-mono text-xs"
          />
        ) : (
          <Input
            aria-label="function track"
            value={token.value}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => {
              const value = e.target.value
              const name = value.match(/^([a-zA-Z-]+)\(/)?.[1] ?? token.name
              onChange({ kind: "fn", name, value })
            }}
            className="h-8 w-full font-mono text-xs"
          />
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${token.kind} track`}
        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}

function SizeEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const parts = splitSize(value)
  const isKeyword = (TRACK_KEYWORDS as readonly string[]).includes(value)

  if (parts === null || isKeyword) {
    // keyword or opaque (calc/var) — raw input + keyword shortcut select
    return (
      <span className="inline-flex w-full items-center gap-1">
        <Input
          aria-label="track size"
          value={value}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          className="h-8 flex-1 font-mono text-xs"
        />
        <select
          aria-label="track keyword"
          value={isKeyword ? value : ""}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="h-8 rounded border bg-background px-1 font-mono text-xs"
        >
          <option value="">kw…</option>
          {TRACK_KEYWORDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center">
      <Input
        aria-label="track size"
        value={value}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-[80px] rounded-r-none border-r-0 font-mono text-xs"
      />
      <select
        aria-label="track size unit"
        value={parts.unit || LENGTH_UNITS[0]}
        onChange={(e) => onChange(`${parts.num || "1"}${e.target.value}`)}
        className="h-8 rounded-l-none rounded-r-md border border-input bg-background px-1 font-mono text-xs"
      >
        {LENGTH_UNITS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </span>
  )
}

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
          onDec={() => resize(rows - 1, cols)}
          onInc={() => resize(rows + 1, cols)}
        />
        <Stepper
          label="cols"
          onDec={() => resize(rows, cols - 1)}
          onInc={() => resize(rows, cols + 1)}
        />
      </div>
    </div>
  )
}

function Stepper({
  label,
  onDec,
  onInc,
}: {
  label: string
  onDec: () => void
  onInc: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-muted-foreground">{label}</span>
      <button
        type="button"
        aria-label={`Remove ${label.slice(0, -1)}`}
        onClick={onDec}
        className="h-6 w-6 rounded border font-mono hover:bg-muted/50"
      >
        −
      </button>
      <button
        type="button"
        aria-label={`Add ${label.slice(0, -1)}`}
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

// ---------------------------------------------------------------------------
// LiveString (internal)
// ---------------------------------------------------------------------------

function LiveString({ value }: { value: string }) {
  return (
    <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
      {value}
    </code>
  )
}

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

const PREVIEW_BG = [
  "bg-indigo-500/30",
  "bg-pink-500/30",
  "bg-amber-500/30",
  "bg-emerald-500/30",
  "bg-sky-500/30",
  "bg-rose-500/30",
]

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
