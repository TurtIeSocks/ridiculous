"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { CssOutput } from "@/components/ui/css-output"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CommandRow } from "./command-row"
import { ShapeCanvas } from "./shape-canvas"
import {
  defaultShape,
  formatShape,
  parseShape,
} from "./shape-path-editor.helpers"
import type {
  ShapeCommand,
  ShapeString,
  ShapeValue,
} from "./shape-path-editor.types"
import { ShapePreview } from "./shape-preview"

// Re-export the public sub-components + their prop types so consumers (and the
// barrel) can import them from `./shape-path-editor`.
export type { CommandRowProps } from "./command-row"
export { CommandRow } from "./command-row"
export type { MiniSelectProps } from "./mini-select"
export { MiniSelect } from "./mini-select"
export type { ShapeCanvasProps } from "./shape-canvas"
export { ShapeCanvas } from "./shape-canvas"
export type { ShapePreviewMode, ShapePreviewProps } from "./shape-preview"
export { ShapePreview } from "./shape-preview"

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------

export type ShapePathEditorMode = "clip-path" | "offset-path"

export interface ShapePathEditorPanelProps {
  value: ShapeString | (string & {})
  onChange: (value: ShapeString) => void
  /**
   * Which CSS property the live preview targets. Both `clip-path` and
   * `offset-path` share the identical `shape()` grammar, so this does NOT
   * change validation or narrow the `onChange` output — it only drives the
   * preview render. Defaults to `"clip-path"`.
   */
  mode?: ShapePathEditorMode
  className?: string
  "aria-label"?: string
}

export interface ShapePathEditorProps extends ShapePathEditorPanelProps {}

// ---------------------------------------------------------------------------
// ShapePathEditor — popover-wrapped
// ---------------------------------------------------------------------------

export function ShapePathEditor(props: ShapePathEditorProps) {
  const {
    value,
    className,
    "aria-label": ariaLabel = "Edit a shape() path",
  } = props
  const parsed = parseShape(String(value))
  const label =
    parsed.error !== null
      ? "invalid"
      : `${parsed.commands.length} cmd${parsed.commands.length === 1 ? "" : "s"}`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 px-3 font-mono", className)}
          aria-label={ariaLabel}
        >
          <span aria-hidden="true" className="text-foreground/60">
            ✎
          </span>
          <span className="text-[10px] text-muted-foreground">{label}</span>
          <span className="max-w-[220px] truncate text-xs">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <ShapePathEditorPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// ShapePathEditorPanel — inline
// ---------------------------------------------------------------------------

function toValue(parsed: ReturnType<typeof parseShape>): ShapeValue {
  return {
    fillRule: parsed.fillRule,
    from: parsed.from,
    commands: parsed.commands,
  }
}

export function ShapePathEditorPanel({
  value,
  onChange,
  mode = "clip-path",
  className,
  "aria-label": ariaLabel = "CSS shape() path editor",
}: ShapePathEditorPanelProps) {
  const [shape, setShape] = useState<ShapeValue>(() =>
    toValue(parseShape(String(value) || defaultShape())),
  )
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from an external value (skip our own emits).
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const parsed = parseShape(String(value))
    if (parsed.error === null) setShape(toValue(parsed))
  }, [value])

  const commit = (next: ShapeValue) => {
    setShape(next)
    const str = formatShape(next)
    lastEmittedRef.current = str
    onChange(str as ShapeString)
  }

  // canvas drag/nudge passes a fully-formatted string; re-parse + commit.
  const commitString = (str: string) => {
    const parsed = parseShape(str)
    if (parsed.error === null) commit(toValue(parsed))
  }

  const updateCommand = (index: number, cmd: ShapeCommand) => {
    commit({
      ...shape,
      commands: shape.commands.map((c, i) => (i === index ? cmd : c)),
    })
  }

  const addCommand = () => {
    // Insert a fresh `line` before a trailing `close` (or at the end).
    const fresh: ShapeCommand = {
      kind: "line",
      by: false,
      to: { x: "50px", y: "50px" },
    }
    const cmds = shape.commands
    const lastIsClose =
      cmds.length > 0 && cmds[cmds.length - 1].kind === "close"
    const at = lastIsClose ? cmds.length - 1 : cmds.length
    const next = [...cmds.slice(0, at), fresh, ...cmds.slice(at)]
    commit({ ...shape, commands: next })
  }

  const removeCommand = (index: number) => {
    commit({
      ...shape,
      commands: shape.commands.filter((_, i) => i !== index),
    })
  }

  const moveCommand = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= shape.commands.length) return
    const next = [...shape.commands]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    commit({ ...shape, commands: next })
  }

  const produced = formatShape(shape)

  return (
    <fieldset
      className={cn(
        "m-0 w-[520px] space-y-3 border-0 bg-background p-3",
        className,
      )}
      aria-label={ariaLabel}
    >
      <ShapeCanvas value={produced} onChange={commitString} />

      <div className="space-y-1.5">
        <div className="max-h-[220px] space-y-1.5 overflow-y-auto pr-1">
          {shape.commands.map((cmd, i) => (
            <CommandRow
              // biome-ignore lint/suspicious/noArrayIndexKey: commands are a positional list edited in place; index is the stable identity.
              key={i}
              index={i}
              command={cmd}
              onChange={(next) => updateCommand(i, next)}
              onRemove={() => removeCommand(i)}
              onMoveUp={() => moveCommand(i, -1)}
              onMoveDown={() => moveCommand(i, 1)}
              canMoveUp={i > 0}
              canMoveDown={i < shape.commands.length - 1}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Add command"
          onClick={addCommand}
          className="h-8 w-full rounded border border-dashed font-mono text-[10px] text-muted-foreground hover:text-foreground"
        >
          + add command
        </button>
      </div>

      <CssOutput
        value={produced}
        property={mode === "offset-path" ? "offset-path" : "clip-path"}
      />

      <ShapePreview value={produced} mode={mode} />
    </fieldset>
  )
}
