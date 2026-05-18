"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import type { ColorString } from "@/components/ui/color-picker"
import { ColorPicker } from "@/components/ui/color-picker"
import { parseColor } from "@/components/ui/color-picker/color-picker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type {
  ConicGradientString,
  GradientStop,
  GradientString,
  GradientStringMap,
  GradientType,
  InterpolationHueMethod,
  InterpolationSpace,
  LinearGradientString,
  PolarSpace,
  RadialGradientString,
} from "./gradient-editor.types"

export interface InternalState {
  type: GradientType
  stops: GradientStop[]
  /** Linear only. Degrees, 0 = to top, 90 = to right, 180 = to bottom (CSS default), 270 = to left. */
  angle: number
  /** Radial only. */
  shape: "circle" | "ellipse"
  /** Radial only. */
  size: "closest-side" | "closest-corner" | "farthest-side" | "farthest-corner"
  /** Radial + conic. Percentages 0..100. */
  position: { x: number; y: number }
  /** Conic only. Degrees. */
  fromAngle: number
  interpolation: {
    space: InterpolationSpace
    hueMethod?: InterpolationHueMethod
  }
}

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
  const parsedFromValue = parseGradient(value)

  // Internal state mirrors color-picker's hybrid pattern. We do NOT derive
  // marker/handle positions from each re-parse of `value`, because round-tripping
  // through CSS gradient strings rounds sub-percent positions/angles to integers.
  const [internal, setInternal] = useState<InternalState>(
    () =>
      parsedFromValue ?? {
        type: "linear",
        stops: [
          { color: "#000000", position: 0 },
          { color: "#ffffff", position: 100 },
        ],
        angle: 90,
        shape: "ellipse",
        size: "farthest-corner",
        position: { x: 50, y: 50 },
        fromAngle: 0,
        interpolation: { space: "oklch" },
      },
  )
  const [selectedStopIndex, setSelectedStopIndex] = useState(0)
  const lastEmittedRef = useRef<string | null>(null)

  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const parsed = parseGradient(value)
    if (parsed) setInternal(parsed)
  }, [value])

  if (!parsedFromValue) {
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

  const activeType: GradientType = typeProp ?? internal.type
  const showTypeSwitcher = typeProp == null

  const emit = (next: InternalState) => {
    setInternal(next)
    const formatted = formatGradient(next)
    lastEmittedRef.current = formatted
    onChange(formatted as Parameters<typeof onChange>[0])
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
              if (internal.stops.length >= maxStops) return
              // Pick interpolated color from neighbors; fallback to last stop's color.
              const newColor =
                internal.stops[internal.stops.length - 1]?.color ?? "#000000"
              const newStop = { color: newColor, position }
              const stops = [...internal.stops, newStop].sort(
                (a, b) => a.position - b.position,
              )
              // Find by reference (handles duplicate positions correctly).
              setSelectedStopIndex(stops.indexOf(newStop))
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
// Parsing / formatting
// ---------------------------------------------------------------------------

/**
 * Split a string on commas, ignoring commas inside parens. Trims each segment.
 *
 * @example
 * splitTopLevelCommas("rgb(1, 2, 3), red") // ["rgb(1, 2, 3)", "red"]
 */
export function splitTopLevelCommas(input: string): string[] {
  const trimmed = input.trim()
  if (trimmed === "") return []
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i]
    if (ch === "(") depth++
    else if (ch === ")") depth--
    else if (ch === "," && depth === 0) {
      out.push(trimmed.slice(start, i).trim())
      start = i + 1
    }
  }
  out.push(trimmed.slice(start).trim())
  return out
}

/**
 * Parse a single gradient stop. The position is optional; when absent,
 * returns `position: null` so the caller can auto-distribute.
 *
 * @example
 * parseStop("#ff0000 50%") // { color: "#ff0000", position: 50 }
 * parseStop("oklch(0.5 0.1 240)") // { color: "oklch(0.5 0.1 240)", position: null }
 */
export function parseStop(
  input: string,
): { color: ColorString; position: number | null } | null {
  // The position (if present) is the LAST whitespace-separated token outside parens.
  // Walk backwards, find the split point.
  const trimmed = input.trim()
  let depth = 0
  let splitAt = -1
  for (let i = trimmed.length - 1; i >= 0; i--) {
    const ch = trimmed[i]
    if (ch === ")") depth++
    else if (ch === "(") depth--
    else if (ch === " " && depth === 0) {
      splitAt = i
      break
    }
  }

  let colorPart = trimmed
  let positionPart: string | null = null
  if (splitAt !== -1) {
    const tail = trimmed.slice(splitAt + 1).trim()
    if (tail.endsWith("%")) {
      const n = parseFloat(tail.slice(0, -1))
      if (!Number.isNaN(n)) {
        colorPart = trimmed.slice(0, splitAt).trim()
        positionPart = tail
      }
    }
  }

  if (parseColor(colorPart) == null) return null
  return {
    color: colorPart as ColorString,
    position: positionPart == null ? null : parseFloat(positionPart),
  }
}

export function formatStop(stop: GradientStop): string {
  return `${stop.color} ${Math.round(stop.position)}%`
}

const INTERPOLATION_SPACES = ["srgb", "oklch", "oklab", "hsl", "hwb"] as const
const POLAR_SPACES: readonly PolarSpace[] = ["oklch", "hsl", "hwb"]
const GRADIENT_TYPES: readonly GradientType[] = ["linear", "radial", "conic"]

interface Interpolation {
  space: InterpolationSpace
  hueMethod?: InterpolationHueMethod
}

/**
 * Parse a CSS interpolation clause like `in oklch longer hue`.
 * Returns null if the prefix is missing or the space is unrecognized.
 */
export function parseInterpolation(input: string): Interpolation | null {
  const trimmed = input.trim()
  if (!trimmed.startsWith("in ")) return null
  const body = trimmed.slice(3).trim()
  // Possible forms: "<space>", "<space> longer hue", "<space> shorter hue"
  const huePartMatch = body.match(/^(\S+)\s+(longer|shorter)\s+hue$/)
  if (huePartMatch) {
    const space = huePartMatch[1] as InterpolationSpace
    if (!INTERPOLATION_SPACES.includes(space)) return null
    return { space, hueMethod: huePartMatch[2] as InterpolationHueMethod }
  }
  const space = body as InterpolationSpace
  if (!INTERPOLATION_SPACES.includes(space)) return null
  return { space, hueMethod: undefined }
}

/**
 * Format an interpolation as a token for inclusion in a gradient prelude.
 * Returns the bare token (e.g. `"in oklch"` or `"in oklch longer hue"`) with
 * NO comma — the caller decides how to join it with the rest of the prelude.
 * Returns empty string when the space is `srgb` with no hue method
 * (CSS default — keep output clean).
 *
 * Important: the `in <space>` clause must be adjacent to the prelude (no
 * comma separating them). Browsers reject e.g.
 * `radial-gradient(in oklch, ellipse at 50% 50%, …)` as invalid CSS — the
 * `in oklch` must instead sit next to the shape/at-position prelude:
 * `radial-gradient(ellipse at 50% 50% in oklch, …)`.
 */
export function formatInterpolation(interp: Interpolation): string {
  // srgb is CSS default — omit unless hue method is set (which is N/A for cartesian).
  if (interp.space === "srgb") return ""
  const isPolar = POLAR_SPACES.includes(interp.space as PolarSpace)
  if (isPolar && interp.hueMethod) {
    return `in ${interp.space} ${interp.hueMethod} hue`
  }
  return `in ${interp.space}`
}

const SIDE_TO_ANGLE: Record<string, number> = {
  "to top": 0,
  "to top right": 45,
  "to right": 90,
  "to bottom right": 135,
  "to bottom": 180,
  "to bottom left": 225,
  "to left": 270,
  "to top left": 315,
}

const RADIAL_SHAPES = ["circle", "ellipse"] as const
const RADIAL_SIZES = [
  "closest-side",
  "closest-corner",
  "farthest-side",
  "farthest-corner",
] as const

/**
 * Parse a CSS gradient string into the editor's internal state.
 * Returns null on parse failure or when the gradient has fewer than 2 stops.
 */
export function parseGradient(value: string): InternalState | null {
  const trimmed = value.trim()
  const prefixMatch = trimmed.match(/^(linear|radial|conic)-gradient\((.*)\)$/s)
  if (!prefixMatch) return null
  const type = prefixMatch[1] as GradientType
  const body = prefixMatch[2]

  const segments = splitTopLevelCommas(body)
  if (segments.length === 0) return null

  // Try to extract interpolation. Two forms accepted:
  //   Form A — first segment is the bare `in <space>[ <method> hue]?` clause
  //            (e.g. `linear-gradient(in oklch, red, blue)` when no prelude).
  //   Form B — interpolation token is suffixed onto the prelude, separated by
  //            whitespace (e.g. `radial-gradient(ellipse at 50% 50% in oklch, …)`).
  //            This is the canonical CSS-valid form for radial/conic.
  let interpolation: {
    space: InterpolationSpace
    hueMethod?: InterpolationHueMethod
  } = {
    space: "srgb",
  }
  let preludeAndStops = segments
  const interpFromFirst = parseInterpolation(segments[0])
  if (interpFromFirst) {
    interpolation = interpFromFirst
    preludeAndStops = segments.slice(1)
  } else {
    // Try Form B: extract trailing `in <space>[ <method> hue]?` from segment 0.
    const suffixMatch = segments[0].match(
      /\s+(in\s+(?:srgb|oklch|oklab|hsl|hwb)(?:\s+(?:shorter|longer)\s+hue)?)$/i,
    )
    if (suffixMatch) {
      const parsed = parseInterpolation(suffixMatch[1])
      if (parsed) {
        interpolation = parsed
        preludeAndStops = [
          segments[0].slice(0, suffixMatch.index ?? 0).trim(),
          ...segments.slice(1),
        ]
      }
    }
  }

  // Determine if the next segment is a prelude (angle/shape/from) or a stop.
  let preludeIndex = 0
  const first = preludeAndStops[0] ?? ""
  const looksLikePrelude =
    /^(-?\d+(\.\d+)?deg|to )/.test(first) || // linear angle (signed)
    /^(circle|ellipse|closest|farthest)/.test(first) || // radial shape/size
    first.startsWith("at ") || // radial position alone
    first.startsWith("from ") // conic

  // Type-specific prelude extraction
  let angle = 180 // linear default = to bottom
  let shape: InternalState["shape"] = "ellipse"
  let size: InternalState["size"] = "farthest-corner"
  let position = { x: 50, y: 50 }
  let fromAngle = 0

  if (looksLikePrelude && type === "linear") {
    const prelude = preludeAndStops[0]
    if (SIDE_TO_ANGLE[prelude] != null) {
      angle = SIDE_TO_ANGLE[prelude]
    } else {
      const m = prelude.match(/^(-?\d+(?:\.\d+)?)deg$/)
      if (m) angle = parseFloat(m[1])
      else return null
    }
    preludeIndex = 1
  } else if (looksLikePrelude && type === "radial") {
    const prelude = preludeAndStops[0]
    // Tokens: [shape] [size] [at <pos>]
    const tokens = prelude.split(/\s+/)
    let i = 0
    if (RADIAL_SHAPES.includes(tokens[i] as (typeof RADIAL_SHAPES)[number])) {
      shape = tokens[i] as InternalState["shape"]
      i++
    }
    if (RADIAL_SIZES.includes(tokens[i] as (typeof RADIAL_SIZES)[number])) {
      size = tokens[i] as InternalState["size"]
      i++
    }
    if (tokens[i] === "at") {
      i++
      const x = parsePercent(tokens[i++])
      const y = parsePercent(tokens[i++])
      if (x == null || y == null) return null
      position = { x, y }
    }
    preludeIndex = 1
  } else if (looksLikePrelude && type === "conic") {
    const prelude = preludeAndStops[0]
    // Tokens: [from <angle>] [at <pos>]
    const tokens = prelude.split(/\s+/)
    let i = 0
    if (tokens[i] === "from") {
      i++
      const m = tokens[i++].match(/^(-?\d+(?:\.\d+)?)deg$/)
      if (!m) return null
      fromAngle = parseFloat(m[1])
    }
    if (tokens[i] === "at") {
      i++
      const x = parsePercent(tokens[i++])
      const y = parsePercent(tokens[i++])
      if (x == null || y == null) return null
      position = { x, y }
    }
    preludeIndex = 1
  }

  // Remaining segments are stops.
  const stopSegments = preludeAndStops.slice(preludeIndex)
  if (stopSegments.length < 2) return null

  const rawStops = stopSegments.map(parseStop)
  if (rawStops.some((s) => s == null)) return null

  // Auto-distribute positions when null.
  const count = rawStops.length
  const stops: GradientStop[] = rawStops.map((raw, i) => ({
    color: raw!.color,
    position: raw!.position != null ? raw!.position : (i / (count - 1)) * 100,
  }))

  return {
    type,
    stops,
    angle,
    shape,
    size,
    position,
    fromAngle,
    interpolation,
  }
}

function parsePercent(input: string | undefined): number | null {
  if (!input) return null
  if (!input.endsWith("%")) return null
  const n = parseFloat(input.slice(0, -1))
  return Number.isNaN(n) ? null : n
}

/**
 * Runtime type guard. Narrows wide `string` to `GradientString`.
 *
 * @example
 * const v: string = userInput
 * if (isGradientString(v)) {
 *   // v is now GradientString
 * }
 */
export function isGradientString(value: string): value is GradientString
export function isGradientString<S extends string>(
  value: S,
): value is S &
  (LinearGradientString | RadialGradientString | ConicGradientString)
export function isGradientString(value: string): boolean {
  return parseGradient(value) !== null
}

/**
 * Serialize internal state to a CSS gradient string.
 *
 * Emission rule: the interpolation `in <space>` clause sits adjacent to the
 * prelude with a space separator, NOT comma-separated. Browsers reject
 * `radial-gradient(in oklch, ellipse at 50% 50%, …)` as invalid syntax;
 * the correct form is `radial-gradient(ellipse at 50% 50% in oklch, …)`.
 */
export function formatGradient(state: InternalState): string {
  const interpToken = formatInterpolation(state.interpolation)
  const stops = state.stops.map(formatStop).join(", ")
  const joinInterp = (positional: string) =>
    interpToken ? `${positional} ${interpToken}` : positional
  switch (state.type) {
    case "linear":
      return `linear-gradient(${joinInterp(`${state.angle}deg`)}, ${stops})`
    case "radial":
      return `radial-gradient(${joinInterp(
        `${state.shape} ${state.size} at ${Math.round(state.position.x)}% ${Math.round(state.position.y)}%`,
      )}, ${stops})`
    case "conic":
      return `conic-gradient(${joinInterp(
        `from ${state.fromAngle}deg at ${Math.round(state.position.x)}% ${Math.round(state.position.y)}%`,
      )}, ${stops})`
  }
}

// ---------------------------------------------------------------------------
// Sub-components (filled in Phase 4)
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
      className="h-10 w-10 shrink-0 touch-none cursor-grab rounded-full border bg-muted/40"
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
      <input
        type="number"
        min={0}
        max={360}
        value={Math.round(angle)}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10) || 0)}
        className="h-7 w-16 rounded border bg-background px-2 font-mono text-xs"
        aria-label="Angle in degrees"
      />
      <span className="font-mono text-xs text-muted-foreground">deg</span>
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
        className="relative h-16 w-16 shrink-0 touch-none cursor-crosshair rounded border bg-muted/40"
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
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/40"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
          x:
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(x)}
            onChange={(e) =>
              onChange({ x: Number.parseInt(e.target.value, 10) || 0, y })
            }
            className="h-6 w-12 rounded border bg-background px-1 font-mono text-xs"
          />
          %
        </label>
        <label className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
          y:
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(y)}
            onChange={(e) =>
              onChange({ x, y: Number.parseInt(e.target.value, 10) || 0 })
            }
            className="h-6 w-12 rounded border bg-background px-1 font-mono text-xs"
          />
          %
        </label>
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
        <input
          type="number"
          min={0}
          max={360}
          value={Math.round(fromAngle)}
          onChange={(e) =>
            onChange({
              fromAngle: Number.parseInt(e.target.value, 10) || 0,
              position,
            })
          }
          className="h-7 w-16 rounded border bg-background px-2 font-mono text-xs"
          aria-label="Conic from-angle in degrees"
        />
        <span className="font-mono text-xs text-muted-foreground">deg</span>
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
      <input
        type="number"
        min={0}
        max={100}
        value={Math.round(stop.position)}
        onChange={(e) =>
          onChange({
            ...stop,
            position: Math.max(
              0,
              Math.min(100, Number.parseInt(e.target.value, 10) || 0),
            ),
          })
        }
        className="h-7 w-16 rounded border bg-background px-2 font-mono text-xs"
        aria-label="Stop position"
      />
      <span className="font-mono text-xs text-muted-foreground">%</span>
      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete}
        aria-label="Delete stop"
        className="ml-auto flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground transition hover:border-white/25 hover:text-foreground disabled:opacity-30 disabled:hover:border-current disabled:hover:text-current"
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
  maxStops,
}: {
  state: InternalState
  selectedIndex: number
  onSelectStop: (i: number) => void
  onMoveStop: (i: number, position: number) => void
  onAddStop: (position: number) => void
  maxStops: number
}) {
  // Always render as horizontal linear during editing so the 1D stop track makes sense.
  const previewBg = formatGradient({
    ...state,
    type: "linear",
    angle: 90,
  })
  const handleTrackPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (state.stops.length >= maxStops) return
    const rect = event.currentTarget.getBoundingClientRect()
    const pct = Math.max(
      0,
      Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
    )
    onAddStop(Math.round(pct))
  }
  return (
    <div className="flex flex-col gap-1" data-slot="gradient-editor-preview">
      <div
        className="relative h-20 w-full rounded border"
        style={{ background: previewBg }}
        data-slot="gradient-editor-track"
        onPointerDown={handleTrackPointer}
      >
        {state.stops.map((stop, i) => (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: stops have no stable id; index is the canonical identity here
            key={i}
            type="button"
            aria-label={`Stop ${i + 1} at ${Math.round(stop.position)}%`}
            onClick={() => onSelectStop(i)}
            onPointerDown={(event) => {
              event.stopPropagation()
              event.currentTarget.setPointerCapture(event.pointerId)
              onSelectStop(i)
            }}
            onPointerMove={(event) => {
              if (event.buttons) {
                const trackRect =
                  event.currentTarget.parentElement!.getBoundingClientRect()
                const pct = Math.max(
                  0,
                  Math.min(
                    100,
                    ((event.clientX - trackRect.left) / trackRect.width) * 100,
                  ),
                )
                onMoveStop(i, Math.round(pct))
              }
            }}
            className={cn(
              "absolute bottom-1 h-4 w-4 -translate-x-1/2 cursor-grab rounded-sm border-2 border-white shadow ring-1 ring-black/40 transition",
              i === selectedIndex && "ring-2 ring-primary scale-110",
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
