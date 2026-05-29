"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { ClipMode } from "./clip-path-editor.constants"
import {
  defaultShape,
  formatClipPath,
  parseClipPath,
  shapeToCss,
} from "./clip-path-editor.helpers"
import type {
  BasicShapeName,
  ClipPathShapeState,
  ClipPathState,
  ClipPathString,
  GeometryBox,
} from "./clip-path-editor.types"
import { ShapeControls } from "./controls/shape-controls"
import { ClipPathPreview } from "./preview/clip-path-preview"
import { GeometryBoxSelect } from "./primitives/geometry-box-select"
import { LiveString } from "./primitives/live-string"
import { ShapeSelect } from "./primitives/shape-select"

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------

export interface ClipPathEditorPanelProps {
  value: ClipPathString | (string & {})
  onChange: (value: ClipPathString) => void
  /**
   * Which CSS property the live preview targets. Both `clip-path` and
   * `shape-outside` share the identical basic-shape grammar, so this does NOT
   * change validation or narrow the `onChange` output — it only drives the
   * preview render target + labels. Defaults to `"clip-path"`.
   */
  mode?: ClipMode
  className?: string
  "aria-label"?: string
}

export interface ClipPathEditorProps extends ClipPathEditorPanelProps {}

// ---------------------------------------------------------------------------
// ClipPathEditor — popover-wrapped
// ---------------------------------------------------------------------------

export function ClipPathEditor(props: ClipPathEditorProps) {
  const {
    value,
    className,
    "aria-label": ariaLabel = "Edit a clip-path",
  } = props
  const state = parseClipPath(String(value))
  const label =
    state === null
      ? "invalid"
      : state.shape === null
        ? (state.box ?? "none")
        : state.shape.shape

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 px-3 font-mono", className)}
          aria-label={ariaLabel}
        >
          <span aria-hidden="true" className="text-foreground/60">
            ⬡
          </span>
          <span className="text-[10px] text-muted-foreground">{label}</span>
          <span className="max-w-[180px] truncate text-xs">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <ClipPathEditorPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// ClipPathEditorPanel — inline
// ---------------------------------------------------------------------------

export function ClipPathEditorPanel({
  value,
  onChange,
  mode = "clip-path",
  className,
  "aria-label": ariaLabel = "CSS clip-path editor",
}: ClipPathEditorPanelProps) {
  const [state, setState] = useState<ClipPathState>(
    () => parseClipPath(String(value)) ?? { shape: null },
  )
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from external value (skip our own emits).
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const parsed = parseClipPath(String(value))
    if (parsed !== null) setState(parsed)
  }, [value])

  const commit = (next: ClipPathState) => {
    setState(next)
    const str = formatClipPath(next)
    lastEmittedRef.current = str
    onChange(str as ClipPathString)
  }

  const setShape = (shape: ClipPathShapeState | null) => {
    commit({ ...state, shape })
  }

  const changeShapeKind = (kind: BasicShapeName) => {
    commit({ ...state, shape: defaultShape(kind) })
  }

  const setBox = (box: GeometryBox | undefined) => {
    if (box === undefined) {
      const { box: _drop, boxPosition: _dropPos, ...rest } = state
      commit(rest)
    } else {
      commit({
        ...state,
        box,
        boxPosition: state.boxPosition ?? "trailing",
      })
    }
  }

  const setBoxPosition = (position: "leading" | "trailing") => {
    if (state.box === undefined) return
    commit({ ...state, boxPosition: position })
  }

  const currentShapeKind = state.shape?.shape

  return (
    <fieldset
      className={cn(
        "m-0 w-[480px] space-y-3 border-0 bg-background p-3",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ShapeSelect
          value={currentShapeKind}
          onChange={(kind) => {
            if (kind === "none") setShape(null)
            else changeShapeKind(kind)
          }}
        />
        <GeometryBoxSelect value={state.box} onChange={setBox} />
        {state.box !== undefined ? (
          <select
            aria-label="Box position"
            value={state.boxPosition ?? "trailing"}
            onChange={(e) =>
              setBoxPosition(e.target.value as "leading" | "trailing")
            }
            className="h-8 rounded border bg-background px-1.5 font-mono text-xs"
          >
            <option value="leading">leading</option>
            <option value="trailing">trailing</option>
          </select>
        ) : null}
      </div>

      {state.shape !== null ? (
        <div className="rounded-md border p-2">
          <ShapeControls shape={state.shape} onChange={setShape} />
        </div>
      ) : (
        <p className="rounded-md border border-dashed p-3 text-center text-muted-foreground text-xs">
          {state.box !== undefined
            ? "A bare geometry box. Pick a shape to add a basic-shape function."
            : "No shape (none). Pick a basic shape above."}
        </p>
      )}

      <LiveString value={formatClipPath(state)} />

      <ClipPathPreview
        value={formatClipPath(state)}
        mode={mode}
        onChange={(str) => {
          const parsed = parseClipPath(str)
          if (parsed !== null) commit(parsed)
        }}
      />
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// Public re-exports — these named exports keep
// `@/components/ui/clip-path-editor/clip-path-editor` import-compatible.
// ---------------------------------------------------------------------------

export type { CircleControlsProps } from "./controls/circle"
export { CircleControls } from "./controls/circle"
export type { EllipseControlsProps } from "./controls/ellipse"
export { EllipseControls } from "./controls/ellipse"
export type { InsetControlsProps } from "./controls/inset"
export { InsetControls } from "./controls/inset"
export type { LengthPctEditorProps } from "./controls/length-pct"
export { LengthPctEditor } from "./controls/length-pct"
export type { PolygonControlsProps } from "./controls/polygon"
export { PolygonControls } from "./controls/polygon"
export type { ClipPathPreviewProps } from "./preview/clip-path-preview"
export { ClipPathPreview } from "./preview/clip-path-preview"
export type { GeometryBoxSelectProps } from "./primitives/geometry-box-select"
export { GeometryBoxSelect } from "./primitives/geometry-box-select"
export type { ShapeSelectProps } from "./primitives/shape-select"
export { ShapeSelect } from "./primitives/shape-select"

// Keep `shapeToCss` reachable as a named import for advanced consumers.
export { shapeToCss }
