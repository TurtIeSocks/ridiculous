"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { UnitInput } from "@/components/ui/unit-input"
import { cn } from "@/lib/utils"
import {
  formatGradient,
  fromUnitString,
  GRADIENT_TYPES,
  INTERPOLATION_SPACES,
  type InternalState,
  parseGradient,
  POLAR_SPACES,
  toDeg,
  toPct,
} from "./gradient-editor.helpers"
import type {
  GradientStop,
  GradientString,
  GradientStringMap,
  GradientType,
  InterpolationHueMethod,
  InterpolationSpace,
  PolarSpace,
} from "./gradient-editor.types"

// ---------------------------------------------------------------------------
// Component (top of file)
// ---------------------------------------------------------------------------

export interface GradientEditorProps<
  TType extends GradientType | undefined = undefined,
> {
  value: GradientString | (string & {})
  onChange: (
    value: TType extends GradientType
      ? GradientStringMap[TType]
      : GradientString,
  ) => void
  type?: TType
  maxStops?: number
  className?: string
  "aria-label"?: string
}

export function GradientEditor<TType extends GradientType | undefined>({
  value,
  onChange,
  type: typeProp,
  maxStops = 8,
  className,
  "aria-label": ariaLabel = "Edit gradient",
}: GradientEditorProps<TType>) {
  const parsed = parseGradient(value)
  if (!parsed) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-5 w-12 rounded border bg-muted",
          className,
        )}
        style={{ backgroundColor: value }}
        data-slot="gradient-editor-fallback"
      />
    )
  }
  return (
    <GradientEditorBody
      value={value}
      initial={parsed}
      onChange={onChange as (next: string) => void}
      typeProp={typeProp}
      maxStops={maxStops}
      className={className}
      ariaLabel={ariaLabel}
    />
  )
}

interface GradientEditorBodyProps {
  value: string
  initial: InternalState
  onChange: (next: string) => void
  typeProp: GradientType | undefined
  maxStops: number
  className: string | undefined
  ariaLabel: string
}

function GradientEditorBody({
  value,
  initial,
  onChange,
  typeProp,
  maxStops,
  className,
  ariaLabel,
}: GradientEditorBodyProps) {
  // Internal state owns marker/handle positions. We do NOT derive them from
  // each re-parse of `value`, because round-tripping through CSS gradient
  // strings rounds sub-percent positions/angles to integers. Resync only when
  // `value` changes from outside (not from our own emit, guarded by ref).
  const [internal, setInternal] = useState<InternalState>(initial)
  const [selectedStopIndex, setSelectedStopIndex] = useState(0)
  const lastEmittedRef = useRef<string | null>(null)

  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const next = parseGradient(value)
    if (next) setInternal(next)
  }, [value])

  const activeType: GradientType = typeProp ?? internal.type
  const showTypeSwitcher = typeProp == null

  const emit = (next: InternalState) => {
    setInternal(next)
    const formatted = formatGradient(next)
    lastEmittedRef.current = formatted
    onChange(formatted)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "h-5 w-12 shrink-0 cursor-pointer rounded outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          data-slot="gradient-editor-trigger"
        >
          <span
            aria-hidden="true"
            className="block h-full w-full rounded border"
            style={{ background: value }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-fit min-w-[320px] p-3"
        align="start"
        data-slot="gradient-editor"
      >
        <div className="flex flex-col gap-3">
          {showTypeSwitcher && (
            <TypeSwitcher
              type={activeType}
              onChange={(next) => emit({ ...internal, type: next })}
            />
          )}
          <GradientPreview
            state={{ ...internal, type: activeType }}
            selectedIndex={selectedStopIndex}
            onSelectStop={setSelectedStopIndex}
            onMoveStop={(i, position) => {
              const stops = internal.stops.map((s, idx) =>
                idx === i ? { ...s, position } : s,
              )
              emit({ ...internal, stops })
            }}
            onAddStop={(position) => {
              if (internal.stops.length >= maxStops) return -1
              // Pick interpolated color from neighbors; fallback to last stop's color.
              const newColor =
                internal.stops[internal.stops.length - 1]?.color ?? "#000000"
              const newStop = { color: newColor, position }
              const stops = [...internal.stops, newStop].sort(
                (a, b) => a.position - b.position,
              )
              // Find by reference (handles duplicate positions correctly).
              const newIndex = stops.indexOf(newStop)
              setSelectedStopIndex(newIndex)
              emit({ ...internal, stops })
              return newIndex
            }}
            onDeleteStop={(i) => {
              if (internal.stops.length <= 2) return
              const stops = internal.stops.filter((_, idx) => idx !== i)
              // Clamp selection to remaining range; prefer the previous
              // sibling so the detail row tracks the deleted stop's neighbor.
              setSelectedStopIndex(
                Math.max(
                  0,
                  Math.min(selectedStopIndex, stops.length - 1, i - 1),
                ),
              )
              emit({ ...internal, stops })
            }}
            maxStops={maxStops}
          />
          <StopDetailRow
            stop={internal.stops[selectedStopIndex] ?? internal.stops[0]}
            canDelete={internal.stops.length > 2}
            onChange={(next) => {
              const stops = internal.stops.map((s, idx) =>
                idx === selectedStopIndex ? next : s,
              )
              emit({ ...internal, stops })
            }}
            onDelete={() => {
              if (internal.stops.length <= 2) return
              const stops = internal.stops.filter(
                (_, idx) => idx !== selectedStopIndex,
              )
              setSelectedStopIndex(Math.max(0, selectedStopIndex - 1))
              emit({ ...internal, stops })
            }}
          />
          {activeType === "linear" && (
            <LinearControls
              angle={internal.angle}
              onChange={(angle) => emit({ ...internal, angle })}
            />
          )}
          {activeType === "radial" && (
            <RadialControls
              state={{
                shape: internal.shape,
                size: internal.size,
                position: internal.position,
              }}
              onChange={(partial) => emit({ ...internal, ...partial })}
            />
          )}
          {activeType === "conic" && (
            <ConicControls
              fromAngle={internal.fromAngle}
              position={internal.position}
              onChange={(partial) => emit({ ...internal, ...partial })}
            />
          )}
          <InterpolationPicker
            space={internal.interpolation.space}
            hueMethod={internal.interpolation.hueMethod}
            onSpaceChange={(space) =>
              emit({
                ...internal,
                interpolation: { ...internal.interpolation, space },
              })
            }
            onHueMethodChange={(hueMethod) =>
              emit({
                ...internal,
                interpolation: { ...internal.interpolation, hueMethod },
              })
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InterpolationPicker({
  space,
  hueMethod,
  onSpaceChange,
  onHueMethodChange,
}: {
  space: InterpolationSpace
  hueMethod?: InterpolationHueMethod
  onSpaceChange: (next: InterpolationSpace) => void
  onHueMethodChange: (next: InterpolationHueMethod) => void
}) {
  const isPolar = POLAR_SPACES.includes(space as PolarSpace)
  return (
    <div
      className="flex items-center gap-2"
      data-slot="gradient-editor-interpolation"
    >
      <select
        value={space}
        onChange={(e) => onSpaceChange(e.target.value as InterpolationSpace)}
        className="h-7 rounded border bg-background px-2 font-mono text-xs"
        aria-label="Interpolation space"
      >
        {INTERPOLATION_SPACES.map((s) => (
          <option key={s} value={s}>
            in {s}
          </option>
        ))}
      </select>
      {isPolar && (
        <select
          value={hueMethod ?? "shorter"}
          onChange={(e) =>
            onHueMethodChange(e.target.value as InterpolationHueMethod)
          }
          className="h-7 rounded border bg-background px-2 font-mono text-xs"
          aria-label="Hue method"
        >
          <option value="shorter">shorter hue</option>
          <option value="longer">longer hue</option>
        </select>
      )}
    </div>
  )
}

function AngleDial({
  angle,
  onChange,
}: {
  angle: number
  onChange: (next: number) => void
}) {
  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = event.clientX - cx
    const dy = event.clientY - cy
    // 0deg = up; rotate by -90 to align CSS angle convention
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90
    if (deg < 0) deg += 360
    if (event.shiftKey) deg = Math.round(deg / 15) * 15
    onChange(Math.round(deg) % 360)
  }
  // Convert to radians for the indicator line; CSS 0deg = up means angle-90 in atan2 terms.
  const rad = ((angle - 90) * Math.PI) / 180
  const x = 20 + 16 * Math.cos(rad)
  const y = 20 + 16 * Math.sin(rad)
  return (
    <div
      role="slider"
      aria-label="Angle"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(angle)}
      tabIndex={0}
      className="size-10 shrink-0 touch-none cursor-grab rounded-full border bg-muted/40"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        handlePointer(event)
      }}
      onPointerMove={(event) => {
        if (event.buttons) handlePointer(event)
      }}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 15 : 1
        if (event.key === "ArrowLeft") onChange((angle - step + 360) % 360)
        if (event.key === "ArrowRight") onChange((angle + step) % 360)
      }}
      data-slot="gradient-editor-angle-dial"
    >
      <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden="true">
        <title>Angle dial</title>
        <circle cx="20" cy="20" r="1.5" fill="currentColor" />
        <line
          x1="20"
          y1="20"
          x2={x}
          y2={y}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  )
}

function LinearControls({
  angle,
  onChange,
}: {
  angle: number
  onChange: (next: number) => void
}) {
  return (
    <div
      className="flex items-center gap-3"
      data-slot="gradient-editor-linear-controls"
    >
      <AngleDial angle={angle} onChange={onChange} />
      <UnitInput
        unit="deg"
        value={toDeg(angle)}
        onChange={(v) => onChange(fromUnitString(v))}
        min={0}
        max={360}
        aria-label="Angle in degrees"
        className="h-7 w-16"
      />
    </div>
  )
}

function PositionPicker({
  x,
  y,
  onChange,
}: {
  x: number
  y: number
  onChange: (next: { x: number; y: number }) => void
}) {
  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const nx = Math.max(
      0,
      Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
    )
    const ny = Math.max(
      0,
      Math.min(100, ((event.clientY - rect.top) / rect.height) * 100),
    )
    onChange({ x: Math.round(nx), y: Math.round(ny) })
  }
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative size-16 shrink-0 touch-none cursor-crosshair rounded border bg-muted/40"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          handlePointer(event)
        }}
        onPointerMove={(event) => {
          if (event.buttons) handlePointer(event)
        }}
        data-slot="gradient-editor-position-pad"
      >
        <div
          aria-hidden="true"
          className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/40"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
          <span aria-hidden="true">x:</span>
          <UnitInput
            unit="%"
            value={toPct(x)}
            onChange={(v) => onChange({ x: fromUnitString(v), y })}
            min={0}
            max={100}
            aria-label="Position x"
            className="h-6 w-12"
          />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
          <span aria-hidden="true">y:</span>
          <UnitInput
            unit="%"
            value={toPct(y)}
            onChange={(v) => onChange({ x, y: fromUnitString(v) })}
            min={0}
            max={100}
            aria-label="Position y"
            className="h-6 w-12"
          />
        </div>
      </div>
    </div>
  )
}

function RadialControls({
  state,
  onChange,
}: {
  state: Pick<InternalState, "shape" | "size" | "position">
  onChange: (next: Pick<InternalState, "shape" | "size" | "position">) => void
}) {
  return (
    <div
      className="flex flex-col gap-3"
      data-slot="gradient-editor-radial-controls"
    >
      <div className="flex items-center gap-2">
        <select
          value={state.shape}
          onChange={(e) =>
            onChange({
              ...state,
              shape: e.target.value as "circle" | "ellipse",
            })
          }
          className="h-7 rounded border bg-background px-2 font-mono text-xs"
          aria-label="Radial shape"
        >
          <option value="ellipse">ellipse</option>
          <option value="circle">circle</option>
        </select>
        <select
          value={state.size}
          onChange={(e) =>
            onChange({
              ...state,
              size: e.target.value as InternalState["size"],
            })
          }
          className="h-7 rounded border bg-background px-2 font-mono text-xs"
          aria-label="Radial size"
        >
          <option value="farthest-corner">farthest-corner</option>
          <option value="closest-corner">closest-corner</option>
          <option value="farthest-side">farthest-side</option>
          <option value="closest-side">closest-side</option>
        </select>
      </div>
      <PositionPicker
        x={state.position.x}
        y={state.position.y}
        onChange={(pos) => onChange({ ...state, position: pos })}
      />
    </div>
  )
}

function ConicControls({
  fromAngle,
  position,
  onChange,
}: {
  fromAngle: number
  position: { x: number; y: number }
  onChange: (next: {
    fromAngle: number
    position: { x: number; y: number }
  }) => void
}) {
  return (
    <div
      className="flex flex-col gap-3"
      data-slot="gradient-editor-conic-controls"
    >
      <div className="flex items-center gap-3">
        <AngleDial
          angle={fromAngle}
          onChange={(next) => onChange({ fromAngle: next, position })}
        />
        <UnitInput
          unit="deg"
          value={toDeg(fromAngle)}
          onChange={(v) => onChange({ fromAngle: fromUnitString(v), position })}
          min={0}
          max={360}
          aria-label="Conic from-angle in degrees"
          className="h-7 w-16"
        />
      </div>
      <PositionPicker
        x={position.x}
        y={position.y}
        onChange={(pos) => onChange({ fromAngle, position: pos })}
      />
    </div>
  )
}

function TypeSwitcher({
  type,
  onChange,
}: {
  type: GradientType
  onChange: (next: GradientType) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Gradient type"
      className="flex gap-1"
      data-slot="gradient-editor-types"
    >
      {GRADIENT_TYPES.map((t) => (
        <Button
          key={t}
          type="button"
          role="tab"
          aria-selected={t === type}
          size="sm"
          variant={t === type ? "secondary" : "ghost"}
          onClick={() => onChange(t)}
          className="h-7 px-2 font-mono text-xs"
        >
          {t}
        </Button>
      ))}
    </div>
  )
}

function StopDetailRow({
  stop,
  canDelete,
  onChange,
  onDelete,
}: {
  stop: GradientStop
  canDelete: boolean
  onChange: (next: GradientStop) => void
  onDelete: () => void
}) {
  return (
    <div
      className="flex items-center gap-2"
      data-slot="gradient-editor-detail-row"
    >
      <ColorPicker
        value={stop.color}
        onChange={(next) => onChange({ ...stop, color: next })}
      />
      <UnitInput
        unit="%"
        value={toPct(stop.position)}
        onChange={(v) =>
          onChange({
            ...stop,
            position: Math.max(0, Math.min(100, fromUnitString(v))),
          })
        }
        min={0}
        max={100}
        aria-label="Stop position"
        className="h-7 w-16"
      />
      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete}
        aria-label="Delete stop"
        className="ml-auto flex size-7 items-center justify-center rounded-md border text-muted-foreground transition hover:border-white/25 hover:text-foreground disabled:opacity-30 disabled:hover:border-current disabled:hover:text-current"
        data-slot="gradient-editor-delete-stop"
      >
        ×
      </button>
    </div>
  )
}

function GradientPreview({
  state,
  selectedIndex,
  onSelectStop,
  onMoveStop,
  onAddStop,
  onDeleteStop,
  maxStops,
}: {
  state: InternalState
  selectedIndex: number
  onSelectStop: (i: number) => void
  onMoveStop: (i: number, position: number) => void
  /** Returns the new stop's sorted index, or -1 if not added. */
  onAddStop: (position: number) => number
  onDeleteStop: (i: number) => void
  maxStops: number
}) {
  // Always render as horizontal linear during editing so the 1D stop track makes sense.
  const previewBg = formatGradient({
    ...state,
    type: "linear",
    angle: 90,
  })

  // Track-level pointer drag: when user clicks empty area to add a stop,
  // continue dragging the new stop within the same press.
  const dragStateRef = useRef<{ stopIndex: number; pointerId: number } | null>(
    null,
  )
  // Across-press drag detection — needed to distinguish click-add → quick
  // click-drag (where browser fires dblclick at the end because both clicks
  // land near each other) from true double-clicks. Either click in the pair
  // having a drag suppresses the dblclick-delete.
  const wasDraggedThisPressRef = useRef(false)
  const previousPressWasDragRef = useRef(false)

  const captureDragHistoryAtPointerDown = () => {
    previousPressWasDragRef.current = wasDraggedThisPressRef.current
    wasDraggedThisPressRef.current = false
  }

  const computePct = (clientX: number, rect: DOMRect) =>
    Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))

  const handleTrackPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.target !== event.currentTarget) return
    captureDragHistoryAtPointerDown()
    if (state.stops.length >= maxStops) return
    const rect = event.currentTarget.getBoundingClientRect()
    const pct = computePct(event.clientX, rect)
    const newIndex = onAddStop(Math.round(pct))
    if (newIndex < 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStateRef.current = {
      stopIndex: newIndex,
      pointerId: event.pointerId,
    }
  }

  const handleTrackPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!dragStateRef.current) return
    if (event.pointerId !== dragStateRef.current.pointerId) return
    wasDraggedThisPressRef.current = true
    const rect = event.currentTarget.getBoundingClientRect()
    const pct = computePct(event.clientX, rect)
    onMoveStop(dragStateRef.current.stopIndex, Math.round(pct))
  }

  const handleTrackPointerUp = () => {
    dragStateRef.current = null
  }

  return (
    <div className="flex flex-col gap-1" data-slot="gradient-editor-preview">
      <div
        className="relative h-20 w-full rounded border"
        style={{ background: previewBg }}
        data-slot="gradient-editor-track"
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerUp}
        onPointerCancel={handleTrackPointerUp}
      >
        {state.stops.map((stop, i) => (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: stops have no stable id; index is the canonical identity here
            key={i}
            type="button"
            aria-label={`Stop ${i + 1} at ${Math.round(stop.position)}%`}
            onClick={() => onSelectStop(i)}
            onDoubleClick={() => {
              if (
                wasDraggedThisPressRef.current ||
                previousPressWasDragRef.current
              ) {
                // User dragged during one of the two clicks; treat as a
                // drag gesture, not a double-click. Don't delete.
                return
              }
              if (state.stops.length > 2) onDeleteStop(i)
            }}
            onPointerDown={(event) => {
              event.stopPropagation()
              event.currentTarget.setPointerCapture(event.pointerId)
              captureDragHistoryAtPointerDown()
              onSelectStop(i)
            }}
            onPointerMove={(event) => {
              if (event.buttons) {
                wasDraggedThisPressRef.current = true
                const trackRect =
                  event.currentTarget.parentElement!.getBoundingClientRect()
                const pct = computePct(event.clientX, trackRect)
                onMoveStop(i, Math.round(pct))
              }
            }}
            className={cn(
              "absolute inset-y-0 -translate-x-1/2 cursor-grab rounded-sm border border-black/40 shadow-[0_0_0_1px_white] transition",
              i === selectedIndex
                ? "w-1.5 ring-2 ring-primary z-10"
                : "w-1 hover:w-1.5",
            )}
            style={{
              left: `${stop.position}%`,
              backgroundColor: stop.color,
            }}
            data-slot="gradient-editor-handle"
            data-selected={i === selectedIndex || undefined}
          />
        ))}
      </div>
    </div>
  )
}
