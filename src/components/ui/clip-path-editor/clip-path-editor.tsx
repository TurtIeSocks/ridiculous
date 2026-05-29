"use client"

import type * as React from "react"
import { useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { UnitInput } from "@/components/ui/unit-input"
import { cn } from "@/lib/utils"
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHAPES: readonly BasicShapeName[] = [
  "inset",
  "circle",
  "ellipse",
  "polygon",
]

const GEOMETRY_BOXES: readonly GeometryBox[] = [
  "margin-box",
  "border-box",
  "padding-box",
  "content-box",
  "fill-box",
  "stroke-box",
  "view-box",
]

const LP_UNITS = ["%", "px", "rem", "em", "vw", "vh"] as const
const RADIUS_KEYWORDS = ["closest-side", "farthest-side"] as const

type ClipMode = "clip-path" | "shape-outside"

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
// ShapeSelect (public)
// ---------------------------------------------------------------------------

export interface ShapeSelectProps {
  value: BasicShapeName | undefined
  onChange: (value: BasicShapeName | "none") => void
  className?: string
}

export function ShapeSelect({ value, onChange, className }: ShapeSelectProps) {
  return (
    <select
      aria-label="Basic shape"
      value={value ?? "none"}
      onChange={(e) => onChange(e.target.value as BasicShapeName | "none")}
      className={cn(
        "h-8 rounded border bg-background px-1.5 font-mono text-xs",
        className,
      )}
    >
      <option value="none">none / box only</option>
      {SHAPES.map((shape) => (
        <option key={shape} value={shape}>
          {shape}()
        </option>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// GeometryBoxSelect (public)
// ---------------------------------------------------------------------------

export interface GeometryBoxSelectProps {
  value: GeometryBox | undefined
  onChange: (value: GeometryBox | undefined) => void
  className?: string
}

export function GeometryBoxSelect({
  value,
  onChange,
  className,
}: GeometryBoxSelectProps) {
  return (
    <select
      aria-label="Geometry box"
      value={value ?? ""}
      onChange={(e) =>
        onChange(
          e.target.value === "" ? undefined : (e.target.value as GeometryBox),
        )
      }
      className={cn(
        "h-8 rounded border bg-background px-1.5 font-mono text-xs",
        className,
      )}
    >
      <option value="">no box</option>
      {GEOMETRY_BOXES.map((box) => (
        <option key={box} value={box}>
          {box}
        </option>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// ShapeControls — dispatch to the right per-shape control set
// ---------------------------------------------------------------------------

interface ShapeControlsProps {
  shape: ClipPathShapeState
  onChange: (shape: ClipPathShapeState) => void
}

function ShapeControls({ shape, onChange }: ShapeControlsProps) {
  switch (shape.shape) {
    case "inset":
      return <InsetControls state={shape} onChange={onChange} />
    case "circle":
      return <CircleControls state={shape} onChange={onChange} />
    case "ellipse":
      return <EllipseControls state={shape} onChange={onChange} />
    case "polygon":
      return <PolygonControls state={shape} onChange={onChange} />
  }
}

// ---------------------------------------------------------------------------
// LengthPctEditor (public) — number + unit select, opaque calc()/var() passthrough
// ---------------------------------------------------------------------------

export interface LengthPctEditorProps {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
}

export function LengthPctEditor({
  label,
  value,
  onChange,
  className,
}: LengthPctEditorProps) {
  const m = value.match(/^(-?\d*\.?\d*)([a-z%]*)$/i)
  const numPart = m ? m[1] : value
  const unitPart = m ? m[2] : ""
  const opaque = m === null // calc()/var() etc — raw text

  if (opaque) {
    return (
      <Input
        aria-label={label}
        value={value}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-8 w-[130px] font-mono text-xs", className)}
      />
    )
  }

  return (
    <span className={cn("inline-flex items-center", className)}>
      <Input
        aria-label={label}
        value={numPart}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(`${e.target.value}${unitPart || "%"}`)}
        className="h-8 w-[68px] rounded-r-none border-r-0 font-mono text-xs"
      />
      <select
        aria-label={`${label} unit`}
        value={unitPart || "%"}
        onChange={(e) => onChange(`${numPart || "0"}${e.target.value}`)}
        className="h-8 rounded-l-none rounded-r-md border border-input bg-background px-1 font-mono text-xs"
      >
        {LP_UNITS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </span>
  )
}

// ---------------------------------------------------------------------------
// RadiusEditor (internal) — a length-% editor OR a sizing keyword
// ---------------------------------------------------------------------------

function RadiusEditor({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const isKeyword = (RADIUS_KEYWORDS as readonly string[]).includes(value)
  return (
    <span className="inline-flex items-center gap-1">
      {isKeyword ? (
        <select
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 rounded border bg-background px-1 font-mono text-xs"
        >
          {RADIUS_KEYWORDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      ) : (
        <LengthPctEditor label={label} value={value} onChange={onChange} />
      )}
      <button
        type="button"
        aria-label={`${label} toggle keyword`}
        onClick={() => onChange(isKeyword ? "50%" : "closest-side")}
        className="rounded border px-1 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-muted"
      >
        {isKeyword ? "lp" : "kw"}
      </button>
    </span>
  )
}

// ---------------------------------------------------------------------------
// PositionControls (internal) — `at <x> <y>`
// ---------------------------------------------------------------------------

function PositionControls({
  atX,
  atY,
  onChange,
}: {
  atX?: string
  atY?: string
  onChange: (atX: string | undefined, atY: string | undefined) => void
}) {
  const has = atX !== undefined && atY !== undefined
  if (!has) {
    return (
      <button
        type="button"
        aria-label="Add position"
        onClick={() => onChange("50%", "50%")}
        className="h-8 rounded border border-dashed px-2 font-mono text-[10px] text-muted-foreground"
      >
        + at position
      </button>
    )
  }
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-[10px] text-muted-foreground">at</span>
      <LengthPctEditor
        label="position x"
        value={atX ?? "50%"}
        onChange={(x) => onChange(x, atY)}
      />
      <LengthPctEditor
        label="position y"
        value={atY ?? "50%"}
        onChange={(y) => onChange(atX, y)}
      />
      <button
        type="button"
        aria-label="Remove position"
        onClick={() => onChange(undefined, undefined)}
        className="rounded p-0.5 text-[10px] text-muted-foreground hover:text-destructive"
      >
        ×
      </button>
    </span>
  )
}

// ---------------------------------------------------------------------------
// InsetControls (public)
// ---------------------------------------------------------------------------

export interface InsetControlsProps {
  state: Extract<ClipPathShapeState, { shape: "inset" }>
  onChange: (state: ClipPathShapeState) => void
}

export function InsetControls({ state, onChange }: InsetControlsProps) {
  const set = (patch: Partial<typeof state>) => onChange({ ...state, ...patch })
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <LabeledField label="top">
          <LengthPctEditor
            label="inset top"
            value={state.top}
            onChange={(top) => set({ top })}
          />
        </LabeledField>
        <LabeledField label="right">
          <LengthPctEditor
            label="inset right"
            value={state.right ?? ""}
            onChange={(right) =>
              set({ right: right === "" ? undefined : right })
            }
          />
        </LabeledField>
        <LabeledField label="bottom">
          <LengthPctEditor
            label="inset bottom"
            value={state.bottom ?? ""}
            onChange={(bottom) =>
              set({ bottom: bottom === "" ? undefined : bottom })
            }
          />
        </LabeledField>
        <LabeledField label="left">
          <LengthPctEditor
            label="inset left"
            value={state.left ?? ""}
            onChange={(left) => set({ left: left === "" ? undefined : left })}
          />
        </LabeledField>
      </div>
      <LabeledField label="round">
        {state.round === undefined ? (
          <button
            type="button"
            aria-label="Add round radius"
            onClick={() => set({ round: "8px" })}
            className="h-8 rounded border border-dashed px-2 font-mono text-[10px] text-muted-foreground"
          >
            + round
          </button>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Input
              aria-label="inset round radius"
              value={state.round}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => set({ round: e.target.value })}
              className="h-8 w-[140px] font-mono text-xs"
            />
            <button
              type="button"
              aria-label="Remove round radius"
              onClick={() => set({ round: undefined })}
              className="rounded p-0.5 text-[10px] text-muted-foreground hover:text-destructive"
            >
              ×
            </button>
          </span>
        )}
      </LabeledField>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CircleControls (public)
// ---------------------------------------------------------------------------

export interface CircleControlsProps {
  state: Extract<ClipPathShapeState, { shape: "circle" }>
  onChange: (state: ClipPathShapeState) => void
}

export function CircleControls({ state, onChange }: CircleControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <LabeledField label="radius">
        <RadiusEditor
          label="circle radius"
          value={state.radius ?? "50%"}
          onChange={(radius) => onChange({ ...state, radius })}
        />
      </LabeledField>
      <LabeledField label="position">
        <PositionControls
          atX={state.atX}
          atY={state.atY}
          onChange={(atX, atY) => onChange({ ...state, atX, atY })}
        />
      </LabeledField>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EllipseControls (public)
// ---------------------------------------------------------------------------

export interface EllipseControlsProps {
  state: Extract<ClipPathShapeState, { shape: "ellipse" }>
  onChange: (state: ClipPathShapeState) => void
}

export function EllipseControls({ state, onChange }: EllipseControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <LabeledField label="radius x">
        <RadiusEditor
          label="ellipse radius x"
          value={state.rx ?? "50%"}
          onChange={(rx) => onChange({ ...state, rx })}
        />
      </LabeledField>
      <LabeledField label="radius y">
        <RadiusEditor
          label="ellipse radius y"
          value={state.ry ?? "35%"}
          onChange={(ry) => onChange({ ...state, ry })}
        />
      </LabeledField>
      <LabeledField label="position">
        <PositionControls
          atX={state.atX}
          atY={state.atY}
          onChange={(atX, atY) => onChange({ ...state, atX, atY })}
        />
      </LabeledField>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PolygonControls (public)
// ---------------------------------------------------------------------------

export interface PolygonControlsProps {
  state: Extract<ClipPathShapeState, { shape: "polygon" }>
  onChange: (state: ClipPathShapeState) => void
}

export function PolygonControls({ state, onChange }: PolygonControlsProps) {
  const { vertices } = state
  const setVertices = (next: Array<{ x: string; y: string }>) =>
    onChange({ ...state, vertices: next })

  const updateVertex = (index: number, x: string, y: string) => {
    setVertices(vertices.map((v, i) => (i === index ? { x, y } : v)))
  }
  const addVertex = () => {
    setVertices([...vertices, { x: "50%", y: "50%" }])
  }
  const removeVertex = (index: number) => {
    if (vertices.length <= 3) return
    setVertices(vertices.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-muted-foreground">
          fill-rule
        </span>
        <select
          aria-label="Fill rule"
          value={state.fillRule ?? ""}
          onChange={(e) =>
            onChange({
              ...state,
              fillRule:
                e.target.value === ""
                  ? undefined
                  : (e.target.value as "nonzero" | "evenodd"),
            })
          }
          className="h-8 rounded border bg-background px-1.5 font-mono text-xs"
        >
          <option value="">(default)</option>
          <option value="nonzero">nonzero</option>
          <option value="evenodd">evenodd</option>
        </select>
      </div>
      <div className="max-h-[180px] space-y-1.5 overflow-y-auto pr-1">
        {vertices.map((v, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: vertices are positional and reorder only via add/remove
            key={i}
            className="flex items-center gap-1.5"
          >
            <span className="w-6 font-mono text-[10px] text-muted-foreground">
              {i + 1}
            </span>
            <LengthPctEditor
              label={`vertex ${i + 1} x`}
              value={v.x}
              onChange={(x) => updateVertex(i, x, v.y)}
            />
            <LengthPctEditor
              label={`vertex ${i + 1} y`}
              value={v.y}
              onChange={(y) => updateVertex(i, v.x, y)}
            />
            <button
              type="button"
              aria-label={`Remove vertex ${i + 1}`}
              disabled={vertices.length <= 3}
              onClick={() => removeVertex(i)}
              className="rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-30"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Add vertex"
        onClick={addVertex}
        className="h-8 w-full rounded border border-dashed font-mono text-[10px] text-muted-foreground"
      >
        + add vertex
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// LabeledField / LiveString (internal)
// ---------------------------------------------------------------------------

function LabeledField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 text-[10px] text-muted-foreground">
      <span className="font-mono uppercase tracking-wide">{label}</span>
      {children}
    </div>
  )
}

function LiveString({ value }: { value: string }) {
  return (
    <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
      {value}
    </code>
  )
}

// ---------------------------------------------------------------------------
// ClipPathPreview (public) — the showcase, with draggable polygon vertices
// ---------------------------------------------------------------------------

export interface ClipPathPreviewProps {
  value: string
  mode?: ClipMode
  onChange?: (value: string) => void
  className?: string
}

/** Round to 1 decimal place, dropping a trailing ".0". */
function pct(n: number): string {
  const clamped = Math.max(0, Math.min(100, n))
  const rounded = Math.round(clamped * 10) / 10
  return `${rounded}%`
}

export function ClipPathPreview({
  value,
  mode: modeProp = "clip-path",
  onChange,
  className,
}: ClipPathPreviewProps) {
  const id = useId()
  const [mode, setMode] = useState<ClipMode>(modeProp)
  useEffect(() => setMode(modeProp), [modeProp])

  const stageRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ index: number } | null>(null)

  const state = parseClipPath(value)
  const polygon =
    state !== null && state.shape !== null && state.shape.shape === "polygon"
      ? state.shape
      : null

  const applied = value === "none" || state === null ? undefined : value
  const styleProp =
    mode === "clip-path"
      ? { clipPath: applied }
      : { shapeOutside: applied, float: "left" as const }

  // --- drag math: client coords → percentage vertex ----------------------
  const moveVertex = (clientX: number, clientY: number) => {
    const drag = dragRef.current
    const stage = stageRef.current
    if (drag === null || stage === null || polygon === null || !onChange) return
    const rect = stage.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const x = pct(((clientX - rect.left) / rect.width) * 100)
    const y = pct(((clientY - rect.top) / rect.height) * 100)
    const next = {
      ...polygon,
      vertices: polygon.vertices.map((v, i) =>
        i === drag.index ? { x, y } : v,
      ),
    }
    onChange(formatClipPath({ ...state, shape: next }))
  }

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => moveVertex(e.clientX, e.clientY)
    const onPointerUp = () => {
      dragRef.current = null
    }
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
    // moveVertex closes over the latest value/state via render; the listeners
    // are re-registered each render so they always see fresh data.
  })

  const nudge = (index: number, dx: number, dy: number) => {
    if (polygon === null || !onChange) return
    const v = polygon.vertices[index]
    const nx = pct(Number.parseFloat(v.x) + dx)
    const ny = pct(Number.parseFloat(v.y) + dy)
    const next = {
      ...polygon,
      vertices: polygon.vertices.map((vv, i) =>
        i === index ? { x: nx, y: ny } : vv,
      ),
    }
    onChange(formatClipPath({ ...state, shape: next }))
  }

  return (
    <div className={cn("space-y-2 rounded-lg border p-3", className)}>
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">preview</div>
        <div className="inline-flex overflow-hidden rounded-md border text-[10px]">
          {(["clip-path", "shape-outside"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "px-2 py-1 font-mono",
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={stageRef}
        data-testid="clip-preview-stage"
        className="relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-md bg-[conic-gradient(at_30%_30%,#6366f1,#ec4899,#f59e0b,#10b981,#6366f1)]"
      >
        <div
          data-clip-target
          className="absolute inset-0 bg-[linear-gradient(135deg,#0ea5e9,#8b5cf6,#ec4899)]"
          style={styleProp}
          aria-hidden="true"
        />
        {polygon !== null && onChange ? (
          <svg
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <title>polygon outline</title>
            <polygon
              points={polygon.vertices
                .map(
                  (v) => `${Number.parseFloat(v.x)},${Number.parseFloat(v.y)}`,
                )
                .join(" ")}
              fill="none"
              stroke="white"
              strokeOpacity="0.7"
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : null}
        {polygon !== null && onChange
          ? polygon.vertices.map((v, i) => (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: handles are positional
                key={i}
                type="button"
                aria-label={`Vertex ${i + 1} at ${v.x} ${v.y}`}
                onPointerDown={(e) => {
                  dragRef.current = { index: i }
                  if (e.currentTarget.setPointerCapture) {
                    e.currentTarget.setPointerCapture(e.pointerId)
                  }
                }}
                onKeyDown={(e) => {
                  const big = e.shiftKey ? 10 : 1
                  if (e.key === "ArrowLeft") {
                    e.preventDefault()
                    nudge(i, -big, 0)
                  } else if (e.key === "ArrowRight") {
                    e.preventDefault()
                    nudge(i, big, 0)
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault()
                    nudge(i, 0, -big)
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault()
                    nudge(i, 0, big)
                  }
                }}
                className="-translate-x-1/2 -translate-y-1/2 absolute h-3.5 w-3.5 cursor-grab rounded-full border-2 border-white bg-primary shadow focus:outline-none focus:ring-2 focus:ring-white active:cursor-grabbing"
                style={{
                  left: `${Number.parseFloat(v.x)}%`,
                  top: `${Number.parseFloat(v.y)}%`,
                }}
              />
            ))
          : null}
      </div>

      {polygon !== null && onChange ? (
        <p className="text-center text-[10px] text-muted-foreground">
          drag a handle to move a vertex · arrow keys nudge (⇧ = 10%)
        </p>
      ) : null}

      <CircleScrubs state={state} onChange={onChange} id={id} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// CircleScrubs (internal) — radius scrub for circle/ellipse using UnitInput
// ---------------------------------------------------------------------------

function CircleScrubs({
  state,
  onChange,
  id,
}: {
  state: ClipPathState | null
  onChange?: (value: string) => void
  id: string
}) {
  if (
    state === null ||
    state.shape === null ||
    !onChange ||
    (state.shape.shape !== "circle" && state.shape.shape !== "ellipse")
  ) {
    return null
  }
  const shape = state.shape

  if (shape.shape === "circle") {
    const radius = shape.radius ?? "50%"
    // Only scrub a percentage radius (the common case); keyword/length stays as-is.
    if (!radius.endsWith("%")) return null
    return (
      <label
        htmlFor={`${id}-r`}
        className="flex items-center gap-2 text-muted-foreground text-xs"
      >
        <span className="w-16 font-mono">radius</span>
        <UnitInput
          aria-label="circle radius scrub"
          unit="%"
          min={0}
          max={100}
          value={radius as `${number}%`}
          onChange={(r) =>
            onChange(
              formatClipPath({ ...state, shape: { ...shape, radius: r } }),
            )
          }
        />
      </label>
    )
  }

  // ellipse: scrub rx + ry when both are percentages
  const rx = shape.rx ?? "50%"
  const ry = shape.ry ?? "35%"
  if (!rx.endsWith("%") || !ry.endsWith("%")) return null
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={`${id}-rx`}
        className="flex items-center gap-2 text-muted-foreground text-xs"
      >
        <span className="w-16 font-mono">radius x</span>
        <UnitInput
          aria-label="ellipse radius x scrub"
          unit="%"
          min={0}
          max={100}
          value={rx as `${number}%`}
          onChange={(v) =>
            onChange(formatClipPath({ ...state, shape: { ...shape, rx: v } }))
          }
        />
      </label>
      <label
        htmlFor={`${id}-ry`}
        className="flex items-center gap-2 text-muted-foreground text-xs"
      >
        <span className="w-16 font-mono">radius y</span>
        <UnitInput
          aria-label="ellipse radius y scrub"
          unit="%"
          min={0}
          max={100}
          value={ry as `${number}%`}
          onChange={(v) =>
            onChange(formatClipPath({ ...state, shape: { ...shape, ry: v } }))
          }
        />
      </label>
    </div>
  )
}

// Keep `shapeToCss` reachable as a named import for advanced consumers.
export { shapeToCss }
