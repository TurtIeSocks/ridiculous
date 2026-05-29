"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { UnitInput } from "@/components/ui/unit-input"
import { cn } from "@/lib/utils"
import {
  boxShadowLayerCount,
  defaultLayer,
  formatBoxShadow,
  parseBoxShadow,
} from "./box-shadow-editor.helpers"
import type { BoxShadowString, ShadowLayer } from "./box-shadow-editor.types"

// ---------------------------------------------------------------------------
// Length units offered by the per-slot editor.
// ---------------------------------------------------------------------------

const LENGTH_UNITS = ["px", "rem", "em", "%", "vw", "vh"] as const

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------

export interface BoxShadowEditorPanelProps {
  value: BoxShadowString | (string & {})
  onChange: (value: BoxShadowString) => void
  className?: string
  "aria-label"?: string
}

export interface BoxShadowEditorProps extends BoxShadowEditorPanelProps {}

// ---------------------------------------------------------------------------
// BoxShadowEditor — popover-wrapped
// ---------------------------------------------------------------------------

export function BoxShadowEditor(props: BoxShadowEditorProps) {
  const {
    value,
    className,
    "aria-label": ariaLabel = "Edit a CSS box-shadow",
  } = props
  const count = boxShadowLayerCount(String(value))
  const applied = String(value) === "none" ? undefined : String(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 px-3 font-mono", className)}
          aria-label={ariaLabel}
        >
          <span
            aria-hidden="true"
            className="inline-block h-4 w-4 rounded-sm bg-background"
            style={{ boxShadow: applied }}
          />
          <span className="text-[10px] text-muted-foreground">
            {count} {count === 1 ? "layer" : "layers"}
          </span>
          <span className="max-w-[180px] truncate text-xs">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <BoxShadowEditorPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// BoxShadowEditorPanel — inline
// ---------------------------------------------------------------------------

export function BoxShadowEditorPanel({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "CSS box-shadow editor",
}: BoxShadowEditorPanelProps) {
  const [layers, setLayers] = useState<ShadowLayer[]>(
    () => parseBoxShadow(String(value)) ?? [],
  )
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from external value (skip our own emits).
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const parsed = parseBoxShadow(String(value))
    if (parsed !== null) setLayers(parsed)
  }, [value])

  const commit = (next: ShadowLayer[]) => {
    setLayers(next)
    const str = formatBoxShadow(next)
    lastEmittedRef.current = str
    onChange(str as BoxShadowString)
  }

  const updateAt = (index: number, layer: ShadowLayer) => {
    commit(layers.map((it, i) => (i === index ? layer : it)))
  }
  const removeAt = (index: number) => {
    commit(layers.filter((_, i) => i !== index))
  }
  const add = () => {
    commit([...layers, defaultLayer()])
  }

  return (
    <fieldset
      className={cn(
        "m-0 w-[480px] space-y-3 border-0 bg-background p-3",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div className="space-y-2">
        {layers.map((layer, i) => (
          <ShadowLayerRow
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and reorderable only by add/remove
            key={`layer-${i}`}
            index={i}
            layer={layer}
            onChange={(next) => updateAt(i, next)}
            onRemove={() => removeAt(i)}
          />
        ))}
      </div>
      <AddLayerButton onAdd={add} />
      <LiveString value={formatBoxShadow(layers)} />
      <BoxShadowPreview
        value={formatBoxShadow(layers)}
        onChange={(str) => {
          const parsed = parseBoxShadow(str)
          if (parsed !== null) commit(parsed)
        }}
      />
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// ShadowLayerRow (public)
// ---------------------------------------------------------------------------

export interface ShadowLayerRowProps {
  layer: ShadowLayer
  onChange: (layer: ShadowLayer) => void
  onRemove: () => void
  /** Positional index — used only for stable control labels. */
  index?: number
  className?: string
}

export function ShadowLayerRow({
  layer,
  onChange,
  onRemove,
  index,
  className,
}: ShadowLayerRowProps) {
  const n = index === undefined ? "" : ` ${index + 1}`
  const setField = (patch: Partial<ShadowLayer>) => {
    onChange({ ...layer, ...patch })
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
        className,
      )}
    >
      <button
        type="button"
        aria-label={`Inset shadow${n}`}
        aria-pressed={layer.inset}
        onClick={() => setField({ inset: !layer.inset })}
        className={cn(
          "h-8 rounded border px-2 font-mono text-[10px]",
          layer.inset
            ? "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground",
        )}
      >
        inset
      </button>
      <ShadowLengthEditor
        label={`offset-x${n}`}
        value={layer.offsetX}
        allowNegative
        onChange={(offsetX) => setField({ offsetX })}
      />
      <ShadowLengthEditor
        label={`offset-y${n}`}
        value={layer.offsetY}
        allowNegative
        onChange={(offsetY) => setField({ offsetY })}
      />
      <ShadowLengthEditor
        label={`blur${n}`}
        value={layer.blur ?? ""}
        onChange={(blur) => setField({ blur: blur === "" ? undefined : blur })}
      />
      <ShadowLengthEditor
        label={`spread${n}`}
        value={layer.spread ?? ""}
        allowNegative
        onChange={(spread) =>
          setField({ spread: spread === "" ? undefined : spread })
        }
      />
      {layer.color === undefined ? (
        <button
          type="button"
          aria-label={`Add color${n}`}
          onClick={() => setField({ color: "rgb(0 0 0 / 0.5)" })}
          className="h-8 rounded border border-dashed px-2 font-mono text-[10px] text-muted-foreground"
        >
          + color
        </button>
      ) : (
        <span className="inline-flex items-center gap-1">
          <ColorPicker
            native
            value={layer.color}
            onChange={(color) => setField({ color })}
            aria-label={`color${n}`}
          />
          <button
            type="button"
            aria-label={`Remove color${n}`}
            onClick={() => setField({ color: undefined })}
            className="rounded p-0.5 text-[10px] text-muted-foreground hover:text-destructive"
          >
            ×
          </button>
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove layer${n}`}
        className="ml-auto rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ShadowLengthEditor (public)
// ---------------------------------------------------------------------------

export interface ShadowLengthEditorProps {
  label: string
  value: string
  onChange: (value: string) => void
  /** Allow a leading minus sign (offsets + spread). Blur disallows it. */
  allowNegative?: boolean
  className?: string
}

export function ShadowLengthEditor({
  label,
  value,
  onChange,
  allowNegative = false,
  className,
}: ShadowLengthEditorProps) {
  // Split "10px" / "-2px" / "150%" into number + unit.
  const m = value.match(/^(-?\d*\.?\d*)([a-z%]*)$/i)
  const numPart = m ? m[1] : value
  const unitPart = m ? m[2] : ""
  const opaque = value !== "" && m === null // calc()/var() etc — show raw

  if (opaque) {
    return (
      <Input
        aria-label={label}
        value={value}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-8 w-[110px] font-mono text-xs", className)}
      />
    )
  }

  return (
    <span className={cn("inline-flex items-center", className)}>
      <Input
        aria-label={label}
        value={value}
        spellCheck={false}
        autoComplete="off"
        inputMode={allowNegative ? "text" : "decimal"}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-[56px] rounded-r-none border-r-0 font-mono text-xs"
      />
      <select
        aria-label={`${label} unit`}
        value={unitPart || LENGTH_UNITS[0]}
        onChange={(e) => onChange(`${numPart || "0"}${e.target.value}`)}
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
// AddLayerButton (public)
// ---------------------------------------------------------------------------

export interface AddLayerButtonProps {
  onAdd: () => void
  className?: string
}

export function AddLayerButton({ onAdd, className }: AddLayerButtonProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label="Add a shadow layer"
      className={cn(
        "h-9 w-full rounded-md border border-dashed bg-background px-2 font-mono text-muted-foreground text-xs hover:text-foreground",
        className,
      )}
    >
      + add layer
    </button>
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
// BoxShadowPreview (public) — the showcase, with a draggable light source
// ---------------------------------------------------------------------------

export interface BoxShadowPreviewProps {
  value: string
  onChange?: (value: string) => void
  className?: string
}

// The "light" is a point in the stage; the shadow is cast OPPOSITE to it.
// We map the light's offset from center to a per-layer offset, scaled so a
// stack reads as one coherent light. Magnitude scales gently with each
// layer's blur (deeper/softer layers cast a longer shadow).
const LIGHT_GAIN = 24 // px of shadow offset at the stage edge

/** Pull the dominant blur (px) from the first layer, defaulting to 8. */
function dominantBlur(layers: ShadowLayer[]): number {
  for (const layer of layers) {
    if (layer.blur) {
      const n = Number.parseFloat(layer.blur)
      if (!Number.isNaN(n)) return n
    }
  }
  return 8
}

/**
 * Re-cast every layer's offset from a light vector in [-1, 1] (x,y from the
 * stage center). Shadow is opposite the light. Blur / spread / color / inset
 * are preserved.
 */
function castFromLight(
  layers: ShadowLayer[],
  lx: number,
  ly: number,
): ShadowLayer[] {
  return layers.map((layer, i) => {
    const depth = 1 + i * 0.6 // stacked layers fan out a touch
    const ox = Math.round(-lx * LIGHT_GAIN * depth)
    const oy = Math.round(-ly * LIGHT_GAIN * depth)
    return { ...layer, offsetX: `${ox}px`, offsetY: `${oy}px` }
  })
}

/** Scale blur (and a touch of y-offset) across all layers — "elevation". */
function applyElevation(layers: ShadowLayer[], blurPx: number): ShadowLayer[] {
  if (layers.length === 0) {
    return [
      {
        inset: false,
        offsetX: "0px",
        offsetY: `${Math.round(blurPx / 2)}px`,
        blur: `${blurPx}px`,
        color: "rgb(0 0 0 / 0.25)",
      },
    ]
  }
  return layers.map((layer, i) => ({
    ...layer,
    blur: `${Math.round(blurPx * (1 + i * 0.5))}px`,
  }))
}

export function BoxShadowPreview({
  value,
  onChange,
  className,
}: BoxShadowPreviewProps) {
  const id = useId()
  const stageRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  const layers = parseBoxShadow(value) ?? []
  const applied = value === "none" ? undefined : value
  const blurPx = dominantBlur(layers)

  // Light position in [0,1] across the stage, derived from the cast offset of
  // the first layer so the dot tracks the shadow. Default: top-left.
  const first = layers[0]
  const lightFromState = (() => {
    if (!first) return { x: 0.3, y: 0.3 }
    const ox = Number.parseFloat(first.offsetX) || 0
    const oy = Number.parseFloat(first.offsetY) || 0
    // invert the cast: light = -offset / gain, mapped back to [0,1]
    const lx = clamp01(0.5 - ox / (LIGHT_GAIN * 2))
    const ly = clamp01(0.5 - oy / (LIGHT_GAIN * 2))
    return { x: lx, y: ly }
  })()

  const moveLight = (clientX: number, clientY: number) => {
    const stage = stageRef.current
    if (stage === null || !onChange) return
    const rect = stage.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const px = clamp01((clientX - rect.left) / rect.width)
    const py = clamp01((clientY - rect.top) / rect.height)
    // light vector from center in [-1, 1]
    const lx = (px - 0.5) * 2
    const ly = (py - 0.5) * 2
    onChange(formatBoxShadow(castFromLight(layers, lx, ly)))
  }

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return
      moveLight(e.clientX, e.clientY)
    }
    const onPointerUp = () => {
      draggingRef.current = false
    }
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
  })

  const nudgeLight = (dx: number, dy: number) => {
    if (!onChange) return
    const lx = clamp(lightFromState.x * 2 - 1 + dx, -1, 1)
    const ly = clamp(lightFromState.y * 2 - 1 + dy, -1, 1)
    onChange(formatBoxShadow(castFromLight(layers, lx, ly)))
  }

  return (
    <div className={cn("space-y-3 rounded-lg border p-3", className)}>
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">preview</div>
        <div className="text-[10px] text-muted-foreground">drag the light</div>
      </div>

      <div
        ref={stageRef}
        data-testid="box-shadow-stage"
        className="relative flex h-44 items-center justify-center overflow-hidden rounded-md bg-[radial-gradient(circle_at_50%_40%,#1e293b,#0f172a)]"
      >
        <div
          data-shadow-target
          className="h-20 w-28 rounded-xl bg-white"
          style={{ boxShadow: applied }}
          aria-hidden="true"
        />
        {onChange ? (
          <button
            type="button"
            role="slider"
            aria-label="Light source position"
            aria-valuetext={`x ${Math.round(lightFromState.x * 100)}%, y ${Math.round(lightFromState.y * 100)}%`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(lightFromState.x * 100)}
            onPointerDown={(e) => {
              draggingRef.current = true
              if (e.currentTarget.setPointerCapture) {
                e.currentTarget.setPointerCapture(e.pointerId)
              }
              moveLight(e.clientX, e.clientY)
            }}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 0.2 : 0.06
              if (e.key === "ArrowLeft") {
                e.preventDefault()
                nudgeLight(-step, 0)
              } else if (e.key === "ArrowRight") {
                e.preventDefault()
                nudgeLight(step, 0)
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                nudgeLight(0, -step)
              } else if (e.key === "ArrowDown") {
                e.preventDefault()
                nudgeLight(0, step)
              }
            }}
            className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-yellow-300 bg-yellow-200 shadow-[0_0_12px_4px_rgba(253,224,71,0.7)] active:cursor-grabbing"
            style={{
              left: `${lightFromState.x * 100}%`,
              top: `${lightFromState.y * 100}%`,
            }}
          >
            <span className="sr-only">light source</span>
          </button>
        ) : null}
      </div>

      {onChange ? (
        <label
          htmlFor={`${id}-elevation`}
          className="flex items-center gap-2 text-xs"
        >
          <span className="w-20 font-mono text-muted-foreground">
            elevation
          </span>
          <UnitInput
            unit="px"
            value={`${blurPx}px`}
            min={0}
            max={80}
            aria-label="Elevation (blur) in px"
            className="h-7 w-20"
            onChange={(next) => {
              const n = Number.parseFloat(next)
              onChange(
                formatBoxShadow(
                  applyElevation(layers, Number.isNaN(n) ? 0 : n),
                ),
              )
            }}
          />
        </label>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// small numeric helpers
// ---------------------------------------------------------------------------

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function clamp01(n: number): number {
  return clamp(n, 0, 1)
}
