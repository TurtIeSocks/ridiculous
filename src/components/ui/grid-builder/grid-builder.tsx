"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { AreasEditor } from "./areas-editor"
import { MODES } from "./grid-builder.constants"
import {
  formatAreas,
  formatTracks,
  parseAreas,
  parseTracks,
  type TrackToken,
} from "./grid-builder.helpers"
import type { GridMode, GridTemplateString } from "./grid-builder.types"
import { GridPreview } from "./grid-preview"
import { TrackListEditor } from "./track-list-editor"

export type { AreasEditorProps, AreasPainterProps } from "./areas-editor"
// Re-export the sub-component public API so the entry module remains the
// single import surface (`./grid-builder`) for consumers + tests.
export { AreasEditor, AreasPainter } from "./areas-editor"
export type { GridPreviewProps } from "./grid-preview"
export { GridPreview } from "./grid-preview"
export type {
  TrackListEditorProps,
  TrackTokenRowProps,
} from "./track-list-editor"
export { TrackListEditor, TrackTokenRow } from "./track-list-editor"

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

export type GridBuilderProps = GridBuilderPanelProps

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
    onChange(out as GridTemplateString)
  }
  const commitAreas = (next: string[][]) => {
    const out = formatAreas(next)
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
// LiveString (internal)
// ---------------------------------------------------------------------------

function LiveString({ value }: { value: string }) {
  return (
    <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
      {value}
    </code>
  )
}
