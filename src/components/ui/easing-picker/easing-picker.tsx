"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface EasingPickerProps<
  TBasis extends EasingBasis | undefined = undefined,
> extends EasingPanelProps<TBasis> {}

export function EasingPicker<
  TBasis extends EasingBasis | undefined = undefined,
>({
  value,
  onChange,
  basis,
  output,
  className,
  "aria-label": ariaLabel = "Pick an easing",
}: EasingPickerProps<TBasis>) {
  const parsed = parseEasing(value)
  const label = computeTriggerLabel(parsed)
  const thumb = computeTriggerThumb(parsed)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 px-3", className)}
          aria-label={ariaLabel}
        >
          <div className="size-5 text-foreground/70">{thumb}</div>
          <span className="text-xs font-mono">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <EasingPanel
          value={value}
          onChange={onChange}
          basis={basis}
          output={output}
        />
      </PopoverContent>
    </Popover>
  )
}

function computeTriggerLabel(state: EasingState | null): string {
  if (!state) return "(invalid)"
  switch (state.basis) {
    case "bezier": {
      const name = matchPreset(state.x1, state.y1, state.x2, state.y2)
      return name ?? "cubic-bezier"
    }
    case "spring":
      return "spring"
    case "bounce":
      return "bounce"
    case "wiggle":
      return "wiggle"
    case "steps":
      return `steps(${state.n})`
  }
}

function computeTriggerThumb(state: EasingState | null): React.ReactNode {
  if (!state || state.basis !== "bezier") {
    return (
      <svg viewBox="0 0 48 32" aria-hidden="true">
        <title>Easing curve preview</title>
        <line
          x1="0"
          y1="16"
          x2="48"
          y2="16"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    )
  }
  const path = `M 0 32 C ${state.x1 * 48} ${(1 - state.y1) * 32}, ${state.x2 * 48} ${(1 - state.y2) * 32}, 48 0`
  return (
    <svg viewBox="0 0 48 32" aria-hidden="true">
      <title>Easing curve preview</title>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Composed: EasingPanel
// ---------------------------------------------------------------------------

export interface EasingPanelProps<
  TBasis extends EasingBasis | undefined = undefined,
> {
  value: EasingString | (string & {})
  onChange: (
    value: TBasis extends EasingBasis ? EasingStringMap[TBasis] : EasingString,
  ) => void
  basis?: TBasis
  output?: OutputFormat
  className?: string
  "aria-label"?: string
}

const DEFAULT_SPRING_STATE: Extract<EasingState, { basis: "spring" }> = {
  basis: "spring",
  stiffness: 100,
  damping: 10,
  mass: 1,
}
const DEFAULT_BOUNCE_STATE: Extract<EasingState, { basis: "bounce" }> = {
  basis: "bounce",
  bounces: 3,
  stiffness: 0.5,
}
const DEFAULT_WIGGLE_STATE: Extract<EasingState, { basis: "wiggle" }> = {
  basis: "wiggle",
  wiggles: 4,
  damping: 5,
}
const DEFAULT_BEZIER_STATE: Extract<EasingState, { basis: "bezier" }> = {
  basis: "bezier",
  x1: 0.42,
  y1: 0,
  x2: 0.58,
  y2: 1,
  extraTop: 0.25,
  extraBottom: 0.25,
}
const DEFAULT_STEPS_STATE: Extract<EasingState, { basis: "steps" }> = {
  basis: "steps",
  n: 4,
  position: "end",
}

const DEFAULT_BY_BASIS: Record<EasingBasis, EasingState> = {
  bezier: DEFAULT_BEZIER_STATE,
  spring: DEFAULT_SPRING_STATE,
  bounce: DEFAULT_BOUNCE_STATE,
  wiggle: DEFAULT_WIGGLE_STATE,
  steps: DEFAULT_STEPS_STATE,
}

export function EasingPanel<
  TBasis extends EasingBasis | undefined = undefined,
>({
  value,
  onChange,
  basis: basisProp,
  output: outputProp = "css",
  className,
  "aria-label": ariaLabel = "Pick an easing",
}: EasingPanelProps<TBasis>) {
  const parsed = parseEasing(value) ?? DEFAULT_BEZIER_STATE
  const [internal, setInternal] = useState<EasingState>(parsed)
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(outputProp)
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from external value (skip our own emits)
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const next = parseEasing(value)
    if (next) setInternal(next)
  }, [value])

  const setAndEmit = (updater: (prev: EasingState) => EasingState) => {
    setInternal((prev) => {
      const next = updater(prev)
      const s = formatEasing(next)
      lastEmittedRef.current = s
      onChange(s as never)
      return next
    })
  }

  const switchBasis = (basis: EasingBasis) => {
    setAndEmit(() => DEFAULT_BY_BASIS[basis])
  }

  const available: readonly EasingBasis[] = basisProp
    ? ([basisProp] as const)
    : ALL_BASES

  const currentName =
    internal.basis === "bezier"
      ? matchPreset(internal.x1, internal.y1, internal.x2, internal.y2)
      : null

  return (
    <fieldset
      className={cn(
        "w-[480px] space-y-3 p-3 bg-background border-0 m-0",
        className,
      )}
      aria-label={ariaLabel}
    >
      <BasisTabs
        value={internal.basis}
        onChange={switchBasis}
        available={available}
      />
      {internal.basis === "bezier" && (
        <>
          <PresetGallery
            value={currentName ?? undefined}
            onChange={(_, bezier) => {
              const next = parseEasing(bezier)
              if (next) setAndEmit(() => next)
            }}
          />
          <div className="grid grid-cols-[1fr_180px] gap-3">
            <div className="size-60">
              <BezierCanvas
                value={{
                  x1: internal.x1,
                  y1: internal.y1,
                  x2: internal.x2,
                  y2: internal.y2,
                }}
                extraTop={internal.extraTop}
                extraBottom={internal.extraBottom}
                onChange={(v) =>
                  setAndEmit((prev) =>
                    prev.basis === "bezier" ? { ...prev, ...v } : prev,
                  )
                }
              />
            </div>
            <BezierInputs
              value={internal}
              onChange={(v) => setAndEmit(() => ({ basis: "bezier", ...v }))}
            />
          </div>
        </>
      )}
      {internal.basis === "spring" && (
        <SpringControls
          value={internal}
          onChange={(v) => setAndEmit(() => ({ basis: "spring", ...v }))}
        />
      )}
      {internal.basis === "bounce" && (
        <BounceControls
          value={internal}
          onChange={(v) => setAndEmit(() => ({ basis: "bounce", ...v }))}
        />
      )}
      {internal.basis === "wiggle" && (
        <WiggleControls
          value={internal}
          onChange={(v) => setAndEmit(() => ({ basis: "wiggle", ...v }))}
        />
      )}
      {internal.basis === "steps" && (
        <StepsControls
          value={internal}
          onChange={(v) => setAndEmit(() => ({ basis: "steps", ...v }))}
        />
      )}
      <EasingPreview easing={formatEasing(internal)} />
      <OutputPanel
        easing={formatEasing(internal)}
        format={outputFormat}
        onFormatChange={setOutputFormat}
      />
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// Internal: OutputPanel
// ---------------------------------------------------------------------------

type OutputFormat = "css" | "tailwind-v3" | "tailwind-v4"

interface OutputPanelProps {
  easing: string
  format: OutputFormat
  onFormatChange: (format: OutputFormat) => void
}

function OutputPanel({ easing, format, onFormatChange }: OutputPanelProps) {
  const [varName, setVarName] = useState("ease-custom")
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  const snippet = formatSnippet(easing, format, varName)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopyError(true)
      setTimeout(() => setCopyError(false), 1500)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 text-xs">
        {(["css", "tailwind-v3", "tailwind-v4"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFormatChange(f)}
            className={cn(
              "px-2 py-1 rounded border",
              format === f
                ? "bg-accent border-accent-foreground/20"
                : "border-transparent hover:bg-accent/50",
            )}
          >
            {f}
          </button>
        ))}
      </div>
      {format === "tailwind-v4" && (
        <label className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">--var name:</span>
          <input
            type="text"
            value={varName}
            onChange={(e) =>
              setVarName(
                e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
              )
            }
            className="px-2 py-1 bg-muted rounded text-foreground flex-1"
          />
        </label>
      )}
      <pre className="text-xs bg-muted rounded p-2 overflow-auto whitespace-pre-wrap font-mono">
        {snippet}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="w-full px-2 py-1 text-xs bg-primary text-primary-foreground rounded"
      >
        {copyError ? "Failed" : copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}

function formatSnippet(
  easing: string,
  format: OutputFormat,
  varName: string,
): string {
  switch (format) {
    case "css":
      return easing
    case "tailwind-v3": {
      // Tailwind v3 arbitrary values: spaces become _ (Tailwind decodes back)
      const encoded = easing.replace(/\s+/g, "_")
      return `class="ease-[${encoded}]"`
    }
    case "tailwind-v4":
      return `@theme {\n  --${varName}: ${easing};\n}\n/* usage: class="${varName.replace(/^ease-/, "ease-")}" */`
  }
}

// ---------------------------------------------------------------------------
// Internal: BasisTabs
// ---------------------------------------------------------------------------

interface BasisTabsProps {
  value: EasingBasis
  onChange: (basis: EasingBasis) => void
  available?: readonly EasingBasis[]
}

const ALL_BASES: readonly EasingBasis[] = [
  "bezier",
  "spring",
  "bounce",
  "wiggle",
  "steps",
] as const

function BasisTabs({ value, onChange, available = ALL_BASES }: BasisTabsProps) {
  return (
    <div className="flex gap-1 text-xs border-b">
      {available.map((basis) => (
        <button
          key={basis}
          type="button"
          onClick={() => onChange(basis)}
          className={cn(
            "px-3 py-1.5 capitalize transition-colors",
            value === basis
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {basis}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components (filled in Phases 3-7)
// ---------------------------------------------------------------------------

export interface PresetGalleryProps {
  value?: PresetName
  onChange: (preset: PresetName, bezier: string) => void
  className?: string
}

function PresetThumb({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
}) {
  const path = `M 0 32 C ${x1 * 48} ${(1 - y1) * 32}, ${x2 * 48} ${(1 - y2) * 32}, 48 0`
  return (
    <svg viewBox="0 0 48 32" className="size-full" aria-hidden="true">
      <title>Preset curve thumbnail</title>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function PresetGallery({
  value,
  onChange,
  className,
}: PresetGalleryProps) {
  const keywords = PRESETS.filter(
    (p) => !p.family && p.name !== "anticipate" && p.name !== "smoothStep",
  )
  const polynomials = PRESETS.filter((p) => p.family)
  const specials = PRESETS.filter(
    (p) => p.name === "anticipate" || p.name === "smoothStep",
  )

  return (
    <div className={cn("space-y-3", className)}>
      <PresetRow
        label="Keywords"
        presets={keywords}
        value={value}
        onChange={onChange}
      />
      <PresetGrid presets={polynomials} value={value} onChange={onChange} />
      <PresetRow
        label="Special"
        presets={specials}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

function PresetRow({
  label,
  presets,
  value,
  onChange,
}: {
  label: string
  presets: readonly PresetEntry[]
  value?: PresetName
  onChange: (preset: PresetName, bezier: string) => void
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <PresetCard
            key={p.name}
            preset={p}
            active={value === p.name}
            onClick={() => onChange(p.name, bezierFromPreset(p.name))}
          />
        ))}
      </div>
    </div>
  )
}

function PresetGrid({
  presets,
  value,
  onChange,
}: {
  presets: readonly PresetEntry[]
  value?: PresetName
  onChange: (preset: PresetName, bezier: string) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-1">
      {presets.map((p) => (
        <PresetCard
          key={p.name}
          preset={p}
          active={value === p.name}
          onClick={() => onChange(p.name, bezierFromPreset(p.name))}
        />
      ))}
    </div>
  )
}

function PresetCard({
  preset,
  active,
  onClick,
}: {
  preset: PresetEntry
  active: boolean
  onClick: () => void
}) {
  const [x1, y1, x2, y2] = preset.bezier
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 p-1.5 rounded text-xs border transition-colors",
        active
          ? "bg-accent border-accent-foreground/20"
          : "bg-transparent border-transparent hover:bg-accent/50",
      )}
      title={preset.name}
    >
      <div className="size-10 text-muted-foreground">
        <PresetThumb x1={x1} y1={y1} x2={x2} y2={y2} />
      </div>
      <span className="text-[10px] truncate w-full text-center">
        {preset.name}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// BezierCanvas
// ---------------------------------------------------------------------------

export interface BezierCanvasProps {
  value: { x1: number; y1: number; x2: number; y2: number }
  onChange: (v: { x1: number; y1: number; x2: number; y2: number }) => void
  extraTop?: number
  extraBottom?: number
  showLinearReference?: boolean
  className?: string
}

const CANVAS_SIZE = 240
const CANVAS_PAD = 8

export function BezierCanvas({
  value,
  onChange,
  extraTop = 0.25,
  extraBottom = 0.25,
  showLinearReference = true,
  className,
}: BezierCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const draggingRef = useRef<"p1" | "p2" | null>(null)

  const yMin = -extraBottom
  const yMax = 1 + extraTop
  const yRange = yMax - yMin
  const innerSize = CANVAS_SIZE - 2 * CANVAS_PAD

  const toScreen = (x: number, y: number) => ({
    sx: CANVAS_PAD + x * innerSize,
    sy: CANVAS_PAD + (yMax - y) * (innerSize / yRange),
  })

  const fromScreen = (sx: number, sy: number) => ({
    x: clamp((sx - CANVAS_PAD) / innerSize, 0, 1),
    y: yMax - ((sy - CANVAS_PAD) / innerSize) * yRange,
  })

  const p0 = toScreen(0, 0)
  const p3 = toScreen(1, 1)
  const p1 = toScreen(value.x1, value.y1)
  const p2 = toScreen(value.x2, value.y2)

  const pathD = `M ${p0.sx} ${p0.sy} C ${p1.sx} ${p1.sy}, ${p2.sx} ${p2.sy}, ${p3.sx} ${p3.sy}`

  const handlePointerDown = (which: "p1" | "p2") => (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    draggingRef.current = which
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const active = draggingRef.current
    if (!active || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scale = rect.width > 0 ? CANVAS_SIZE / rect.width : 1
    const sx = (e.clientX - rect.left) * scale
    const sy = (e.clientY - rect.top) * scale
    const { x, y } = fromScreen(sx, sy)
    if (active === "p1") onChange({ ...value, x1: x, y1: y })
    else onChange({ ...value, x2: x, y2: y })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    draggingRef.current = null
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      className={cn("size-full bg-muted/30 rounded", className)}
      role="img"
      aria-label="Cubic bezier curve editor — drag the two handles to shape the curve"
    >
      <title>Cubic bezier curve editor</title>
      {showLinearReference && (
        <line
          x1={p0.sx}
          y1={p0.sy}
          x2={p3.sx}
          y2={p3.sy}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeDasharray="2 2"
        />
      )}
      <line
        x1={p0.sx}
        y1={p0.sy}
        x2={p1.sx}
        y2={p1.sy}
        stroke="currentColor"
        strokeOpacity={0.4}
      />
      <line
        x1={p3.sx}
        y1={p3.sy}
        x2={p2.sx}
        y2={p2.sy}
        stroke="currentColor"
        strokeOpacity={0.4}
      />
      <path
        data-curve
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        data-handle="p1"
        cx={p1.sx}
        cy={p1.sy}
        r="6"
        fill="currentColor"
        className="cursor-grab"
        onPointerDown={handlePointerDown("p1")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <circle
        data-handle="p2"
        cx={p2.sx}
        cy={p2.sy}
        r="6"
        fill="currentColor"
        className="cursor-grab"
        onPointerDown={handlePointerDown("p2")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </svg>
  )
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

// ---------------------------------------------------------------------------
// BezierInputs (internal)
// ---------------------------------------------------------------------------

interface BezierInputsProps {
  value: {
    x1: number
    y1: number
    x2: number
    y2: number
    extraTop: number
    extraBottom: number
  }
  onChange: (v: BezierInputsProps["value"]) => void
}

function BezierInputs({ value, onChange }: BezierInputsProps) {
  const set =
    (k: keyof BezierInputsProps["value"]) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value)
      if (!Number.isFinite(n)) return
      onChange({ ...value, [k]: n })
    }
  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <Field
        label="X1"
        value={value.x1}
        min={0}
        max={1}
        step={0.01}
        onChange={set("x1")}
      />
      <Field label="Y1" value={value.y1} step={0.01} onChange={set("y1")} />
      <Field
        label="X2"
        value={value.x2}
        min={0}
        max={1}
        step={0.01}
        onChange={set("x2")}
      />
      <Field label="Y2" value={value.y2} step={0.01} onChange={set("y2")} />
      <Field
        label="Extra Top"
        value={value.extraTop}
        min={0}
        step={0.05}
        onChange={set("extraTop")}
      />
      <Field
        label="Extra Bottom"
        value={value.extraBottom}
        min={0}
        step={0.05}
        onChange={set("extraBottom")}
      />
    </div>
  )
}

function Field({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        className="px-2 py-1 bg-muted rounded text-foreground"
      />
    </label>
  )
}

// ---------------------------------------------------------------------------
// StepsControls
// ---------------------------------------------------------------------------

export interface StepsControlsProps {
  value: { n: number; position: StepPosition }
  onChange: (v: { n: number; position: StepPosition }) => void
  minSteps?: number
  maxSteps?: number
  className?: string
}

const STEP_POSITIONS_ARR: StepPosition[] = [
  "start",
  "end",
  "jump-start",
  "jump-end",
  "jump-both",
  "jump-none",
]

export function StepsControls({
  value,
  onChange,
  minSteps = 1,
  maxSteps = 100,
  className,
}: StepsControlsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2 text-xs", className)}>
      <label className="flex flex-col gap-0.5">
        <span className="text-muted-foreground">Steps</span>
        <input
          type="number"
          aria-label="Steps"
          min={minSteps}
          max={maxSteps}
          step={1}
          value={value.n}
          onChange={(e) => {
            const n = Math.max(
              minSteps,
              Math.min(maxSteps, Math.floor(Number(e.target.value))),
            )
            if (Number.isFinite(n)) onChange({ ...value, n })
          }}
          className="px-2 py-1 bg-muted rounded text-foreground"
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-muted-foreground">Position</span>
        <select
          aria-label="Position"
          value={value.position}
          onChange={(e) =>
            onChange({ ...value, position: e.target.value as StepPosition })
          }
          className="px-2 py-1 bg-muted rounded text-foreground"
        >
          {STEP_POSITIONS_ARR.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SpringControls / BounceControls / WiggleControls (Phase 7)
// ---------------------------------------------------------------------------

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-0.5 text-xs">
      <span className="flex justify-between text-muted-foreground">
        <span>{label}</span>
        <span>{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

export interface SpringControlsProps {
  value: { stiffness: number; damping: number; mass: number }
  onChange: (v: SpringControlsProps["value"]) => void
  className?: string
}

export function SpringControls({
  value,
  onChange,
  className,
}: SpringControlsProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Slider
        label="Stiffness"
        value={value.stiffness}
        min={1}
        max={500}
        step={1}
        onChange={(v) => onChange({ ...value, stiffness: v })}
      />
      <Slider
        label="Damping"
        value={value.damping}
        min={1}
        max={100}
        step={1}
        onChange={(v) => onChange({ ...value, damping: v })}
      />
      <Slider
        label="Mass"
        value={value.mass}
        min={0.5}
        max={5}
        step={0.1}
        onChange={(v) => onChange({ ...value, mass: v })}
      />
    </div>
  )
}

export interface BounceControlsProps {
  value: { bounces: number; stiffness: number }
  onChange: (v: BounceControlsProps["value"]) => void
  className?: string
}

export function BounceControls({
  value,
  onChange,
  className,
}: BounceControlsProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Slider
        label="Bounces"
        value={value.bounces}
        min={1}
        max={6}
        step={1}
        onChange={(v) => onChange({ ...value, bounces: v })}
      />
      <Slider
        label="Stiffness"
        value={value.stiffness}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => onChange({ ...value, stiffness: v })}
      />
    </div>
  )
}

export interface WiggleControlsProps {
  value: { wiggles: number; damping: number }
  onChange: (v: WiggleControlsProps["value"]) => void
  className?: string
}

export function WiggleControls({
  value,
  onChange,
  className,
}: WiggleControlsProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Slider
        label="Wiggles"
        value={value.wiggles}
        min={1}
        max={10}
        step={1}
        onChange={(v) => onChange({ ...value, wiggles: v })}
      />
      <Slider
        label="Damping"
        value={value.damping}
        min={1}
        max={30}
        step={0.5}
        onChange={(v) => onChange({ ...value, damping: v })}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Parsing / formatting (Phase 2)
// ---------------------------------------------------------------------------

import type {
  Direction,
  EasingBasis,
  EasingState,
  EasingString,
  EasingStringMap,
  PolynomialFamily,
  PresetName,
  StepPosition,
} from "./easing-picker.types"

const KEYWORD_BEZIER: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
}

const STEP_POSITIONS: ReadonlySet<StepPosition> = new Set([
  "start",
  "end",
  "jump-start",
  "jump-end",
  "jump-both",
  "jump-none",
])

const DEFAULT_EXTRA = 0.25

const DEFAULT_SPRING = { stiffness: 100, damping: 10, mass: 1 } as const

function parseNumber(s: string): number | null {
  const t = s.trim()
  if (t === "" || t === "-") return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function parseEasing(value: string): EasingState | null {
  const v = value.trim()

  // Keywords
  if (v in KEYWORD_BEZIER) {
    const [x1, y1, x2, y2] = KEYWORD_BEZIER[v]
    return {
      basis: "bezier",
      x1,
      y1,
      x2,
      y2,
      extraTop: DEFAULT_EXTRA,
      extraBottom: DEFAULT_EXTRA,
    }
  }
  if (v === "step-start")
    return { basis: "steps", n: 1, position: "jump-start" }
  if (v === "step-end") return { basis: "steps", n: 1, position: "jump-end" }

  // cubic-bezier(...)
  const cb = v.match(/^cubic-bezier\((.+)\)$/)
  if (cb) {
    const body = cb[1]
    const parts = body.includes(",")
      ? body.split(",").map((p) => p.trim())
      : body.split(/\s+/).filter(Boolean)
    if (parts.length !== 4) return null
    const nums = parts.map(parseNumber)
    if (nums.some((n) => n === null)) return null
    const [x1, y1, x2, y2] = nums as [number, number, number, number]
    if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) return null
    return {
      basis: "bezier",
      x1,
      y1,
      x2,
      y2,
      extraTop: DEFAULT_EXTRA,
      extraBottom: DEFAULT_EXTRA,
    }
  }

  // steps(...)
  const st = v.match(/^steps\((.+)\)$/)
  if (st) {
    const body = st[1]
    const parts = body.split(",").map((p) => p.trim())
    if (parts.length < 1 || parts.length > 2) return null
    const n = parseNumber(parts[0])
    if (n === null || !Number.isInteger(n) || n < 1) return null
    if (parts.length === 1) return { basis: "steps", n, position: "end" }
    const pos = parts[1] as StepPosition
    if (!STEP_POSITIONS.has(pos)) return null
    return { basis: "steps", n, position: pos }
  }

  // linear(...)
  const ln = v.match(/^linear\((.+)\)$/)
  if (ln) {
    const body = ln[1].trim()
    if (body === "") return null
    return { basis: "spring", ...DEFAULT_SPRING }
  }

  return null
}

/** Round to up to 4 decimal places, strip trailing zeros + bare decimal point. */
function fmtNum(n: number): string {
  const rounded = Math.round(n * 10000) / 10000
  return rounded.toString()
}

export function formatEasing(state: EasingState): EasingString {
  switch (state.basis) {
    case "bezier": {
      const { x1, y1, x2, y2 } = state
      return `cubic-bezier(${fmtNum(x1)}, ${fmtNum(y1)}, ${fmtNum(x2)}, ${fmtNum(y2)})` as EasingString
    }
    case "steps": {
      const { n, position } = state
      return position === "end" ? `steps(${n})` : `steps(${n}, ${position})`
    }
    case "spring": {
      const { stiffness, damping, mass } = state
      return bakeLinear(
        sampleSpring(stiffness, damping, mass, 60),
      ) as EasingString
    }
    case "bounce": {
      const { bounces, stiffness } = state
      return bakeLinear(sampleBounce(bounces, stiffness)) as EasingString
    }
    case "wiggle": {
      const { wiggles, damping } = state
      return bakeLinear(sampleWiggle(wiggles, damping)) as EasingString
    }
  }
}

// ---------------------------------------------------------------------------
// Physics samplers + baking (Phase 5)
// ---------------------------------------------------------------------------

export interface Sample {
  y: number
  t: number
}

const SETTLE_EPSILON = 0.001

export function sampleSpring(
  stiffness: number,
  damping: number,
  mass: number,
  samples: number,
): Sample[] {
  const k = stiffness
  const c = damping
  const m = mass
  const w0 = Math.sqrt(k / m)
  const zeta = c / (2 * Math.sqrt(k * m))

  // Total simulation time scales inversely with natural frequency.
  // Pick a window long enough for the curve to settle.
  const tMax = Math.max(3 / (zeta * w0), 5) // seconds-equivalent; normalized below
  const dt = tMax / samples

  const out: Sample[] = []
  for (let i = 0; i < samples; i++) {
    const t = i * dt
    let y: number
    if (zeta < 1) {
      // Underdamped
      const wd = w0 * Math.sqrt(1 - zeta * zeta)
      y =
        1 -
        Math.exp(-zeta * w0 * t) *
          (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
    } else if (zeta === 1) {
      // Critically damped
      y = 1 - Math.exp(-w0 * t) * (1 + w0 * t)
    } else {
      // Overdamped
      const r1 = -w0 * (zeta - Math.sqrt(zeta * zeta - 1))
      const r2 = -w0 * (zeta + Math.sqrt(zeta * zeta - 1))
      y = 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1)
    }
    out.push({ y, t: i / (samples - 1) })
    // Early-exit once settled within epsilon for several consecutive samples
    if (
      i > samples / 4 &&
      Math.abs(y - 1) < SETTLE_EPSILON &&
      out.slice(-3).every((s) => Math.abs(s.y - 1) < SETTLE_EPSILON)
    ) {
      // Force last sample to exactly 1, t=1
      out[out.length - 1] = { y: 1, t: 1 }
      break
    }
  }
  // Always force endpoint t=1, y=1
  if (out[out.length - 1].t < 1) out.push({ y: 1, t: 1 })
  return out
}

const PRUNE_TOLERANCE = 0.005

/** Drop stops that fall on the line between their neighbors within tolerance. */
function pruneCollinear(samples: Sample[]): Sample[] {
  if (samples.length <= 3) return samples
  const out: Sample[] = [samples[0]]
  for (let i = 1; i < samples.length - 1; i++) {
    const prev = out[out.length - 1]
    const curr = samples[i]
    const next = samples[i + 1]
    const slope = (next.y - prev.y) / (next.t - prev.t)
    const expectedY = prev.y + slope * (curr.t - prev.t)
    if (Math.abs(curr.y - expectedY) >= PRUNE_TOLERANCE) {
      out.push(curr)
    }
  }
  out.push(samples[samples.length - 1])
  return out
}

export function bakeLinear(samples: Sample[]): string {
  const pruned = pruneCollinear(samples)
  const parts = pruned.map((s, i) => {
    if (i === 0 || i === pruned.length - 1) return fmtNum(s.y)
    return `${fmtNum(s.y)} ${fmtNum(s.t * 100)}%`
  })
  return `linear(${parts.join(", ")})`
}

export function sampleBounce(bounces: number, stiffness: number): Sample[] {
  // Parabolic-bounce model. Restitution decreases per bounce; each bounce
  // is half a parabola (descending → contact → ascending).
  const restitution = 0.4 + 0.5 * stiffness // 0.4..0.9
  const out: Sample[] = []

  // Compute durations such that total = 1
  const segDurations: number[] = []
  let energy = 1
  for (let i = 0; i <= bounces; i++) {
    segDurations.push(Math.sqrt(energy))
    energy *= restitution
  }
  const totalDur = segDurations.reduce((a, b) => a + b, 0)
  for (let i = 0; i < segDurations.length; i++) segDurations[i] /= totalDur

  let t = 0
  // Initial drop: descend from y=0 (start) to y=1 (ground)
  const samplesPerSeg = 12
  for (let i = 0; i < samplesPerSeg; i++) {
    const localT = i / samplesPerSeg
    out.push({ y: localT * localT, t: t + localT * segDurations[0] })
  }
  t += segDurations[0]
  out.push({ y: 1, t })

  // Bounces: rise to peak, fall back to ground
  let energyTracker = restitution
  for (let b = 0; b < bounces; b++) {
    const segDur = segDurations[b + 1]
    for (let i = 1; i <= samplesPerSeg; i++) {
      const localT = i / samplesPerSeg
      // y = 1 - peak*(1 - (2*localT - 1)^2) — inverted parabola from 1 to 1-peak to 1
      const u = 2 * localT - 1
      const y = 1 - (1 - energyTracker) * (1 - u * u)
      out.push({ y, t: t + localT * segDur })
    }
    t += segDur
    energyTracker *= restitution
  }
  // Ensure exactly ends at y=1, t=1
  out.push({ y: 1, t: 1 })
  return out
}

export function sampleWiggle(wiggles: number, damping: number): Sample[] {
  // Decaying cosine wave around y=1. After settling, y=1.
  const samples = 80
  const out: Sample[] = []
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1)
    const decay = Math.exp(-damping * t)
    const y = 1 - decay * Math.cos(wiggles * 2 * Math.PI * t)
    out.push({ y, t })
  }
  // Force endpoint
  out[out.length - 1] = { y: 1, t: 1 }
  return out
}

// ---------------------------------------------------------------------------
// Preset table (Phase 3)
// ---------------------------------------------------------------------------

interface PresetEntry {
  readonly name: PresetName
  readonly bezier: readonly [number, number, number, number]
  readonly family?: PolynomialFamily
  readonly direction?: Direction
}

export const PRESETS: readonly PresetEntry[] = [
  // CSS keywords (5)
  { name: "linear", bezier: [0, 0, 1, 1] },
  { name: "ease", bezier: [0.25, 0.1, 0.25, 1] },
  { name: "ease-in", bezier: [0.42, 0, 1, 1] },
  { name: "ease-out", bezier: [0, 0, 0.58, 1] },
  { name: "ease-in-out", bezier: [0.42, 0, 0.58, 1] },

  // Sine
  {
    name: "easeInSine",
    bezier: [0.12, 0, 0.39, 0],
    family: "Sine",
    direction: "In",
  },
  {
    name: "easeOutSine",
    bezier: [0.61, 1, 0.88, 1],
    family: "Sine",
    direction: "Out",
  },
  {
    name: "easeInOutSine",
    bezier: [0.37, 0, 0.63, 1],
    family: "Sine",
    direction: "InOut",
  },
  {
    name: "easeOutInSine",
    bezier: [0.45, 1, 0.55, 0],
    family: "Sine",
    direction: "OutIn",
  },

  // Quad
  {
    name: "easeInQuad",
    bezier: [0.11, 0, 0.5, 0],
    family: "Quad",
    direction: "In",
  },
  {
    name: "easeOutQuad",
    bezier: [0.5, 1, 0.89, 1],
    family: "Quad",
    direction: "Out",
  },
  {
    name: "easeInOutQuad",
    bezier: [0.45, 0, 0.55, 1],
    family: "Quad",
    direction: "InOut",
  },
  {
    name: "easeOutInQuad",
    bezier: [0.5, 1, 0.5, 0],
    family: "Quad",
    direction: "OutIn",
  },

  // Cubic
  {
    name: "easeInCubic",
    bezier: [0.32, 0, 0.67, 0],
    family: "Cubic",
    direction: "In",
  },
  {
    name: "easeOutCubic",
    bezier: [0.33, 1, 0.68, 1],
    family: "Cubic",
    direction: "Out",
  },
  {
    name: "easeInOutCubic",
    bezier: [0.65, 0, 0.35, 1],
    family: "Cubic",
    direction: "InOut",
  },
  {
    name: "easeOutInCubic",
    bezier: [0.5, 1, 0.5, 0],
    family: "Cubic",
    direction: "OutIn",
  },

  // Quart
  {
    name: "easeInQuart",
    bezier: [0.5, 0, 0.75, 0],
    family: "Quart",
    direction: "In",
  },
  {
    name: "easeOutQuart",
    bezier: [0.25, 1, 0.5, 1],
    family: "Quart",
    direction: "Out",
  },
  {
    name: "easeInOutQuart",
    bezier: [0.76, 0, 0.24, 1],
    family: "Quart",
    direction: "InOut",
  },
  {
    name: "easeOutInQuart",
    bezier: [0.5, 1, 0.5, 0],
    family: "Quart",
    direction: "OutIn",
  },

  // Quint
  {
    name: "easeInQuint",
    bezier: [0.64, 0, 0.78, 0],
    family: "Quint",
    direction: "In",
  },
  {
    name: "easeOutQuint",
    bezier: [0.22, 1, 0.36, 1],
    family: "Quint",
    direction: "Out",
  },
  {
    name: "easeInOutQuint",
    bezier: [0.83, 0, 0.17, 1],
    family: "Quint",
    direction: "InOut",
  },
  {
    name: "easeOutInQuint",
    bezier: [0.5, 1, 0.5, 0],
    family: "Quint",
    direction: "OutIn",
  },

  // Expo
  {
    name: "easeInExpo",
    bezier: [0.7, 0, 0.84, 0],
    family: "Expo",
    direction: "In",
  },
  {
    name: "easeOutExpo",
    bezier: [0.16, 1, 0.3, 1],
    family: "Expo",
    direction: "Out",
  },
  {
    name: "easeInOutExpo",
    bezier: [0.87, 0, 0.13, 1],
    family: "Expo",
    direction: "InOut",
  },
  {
    name: "easeOutInExpo",
    bezier: [0.5, 1, 0.5, 0],
    family: "Expo",
    direction: "OutIn",
  },

  // Circ
  {
    name: "easeInCirc",
    bezier: [0.55, 0, 1, 0.45],
    family: "Circ",
    direction: "In",
  },
  {
    name: "easeOutCirc",
    bezier: [0, 0.55, 0.45, 1],
    family: "Circ",
    direction: "Out",
  },
  {
    name: "easeInOutCirc",
    bezier: [0.85, 0, 0.15, 1],
    family: "Circ",
    direction: "InOut",
  },
  {
    name: "easeOutInCirc",
    bezier: [0.5, 1, 0.5, 0],
    family: "Circ",
    direction: "OutIn",
  },

  // Back (overshoot)
  {
    name: "easeInBack",
    bezier: [0.36, 0, 0.66, -0.56],
    family: "Back",
    direction: "In",
  },
  {
    name: "easeOutBack",
    bezier: [0.34, 1.56, 0.64, 1],
    family: "Back",
    direction: "Out",
  },
  {
    name: "easeInOutBack",
    bezier: [0.68, -0.6, 0.32, 1.6],
    family: "Back",
    direction: "InOut",
  },
  {
    name: "easeOutInBack",
    bezier: [0.5, 1.6, 0.5, -0.6],
    family: "Back",
    direction: "OutIn",
  },

  // Special
  { name: "anticipate", bezier: [0.45, -0.5, 0.55, 1] },
  { name: "smoothStep", bezier: [0.45, 0, 0.55, 1] },
] as const

export function bezierFromPreset(name: PresetName): string {
  const preset = PRESETS.find((p) => p.name === name)
  if (!preset) throw new Error(`Unknown preset: ${name}`)
  const [x1, y1, x2, y2] = preset.bezier
  return `cubic-bezier(${fmtNum(x1)}, ${fmtNum(y1)}, ${fmtNum(x2)}, ${fmtNum(y2)})`
}

const PRESET_MATCH_TOLERANCE = 0.005

export function matchPreset(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): PresetName | null {
  for (const p of PRESETS) {
    const [px1, py1, px2, py2] = p.bezier
    if (
      Math.abs(x1 - px1) < PRESET_MATCH_TOLERANCE &&
      Math.abs(y1 - py1) < PRESET_MATCH_TOLERANCE &&
      Math.abs(x2 - px2) < PRESET_MATCH_TOLERANCE &&
      Math.abs(y2 - py2) < PRESET_MATCH_TOLERANCE
    ) {
      return p.name
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// EasingPreview
// ---------------------------------------------------------------------------

export type PreviewProperty =
  | "moveX"
  | "moveY"
  | "scale"
  | "rotate"
  | "opacity"
  | "width"

export interface EasingPreviewProps {
  easing: string
  property?: PreviewProperty
  duration?: number
  loop?: boolean
  showLinearComparison?: boolean
  className?: string
}

const PROP_KEYFRAMES: Record<PreviewProperty, { from: string; to: string }> = {
  moveX: {
    from: "transform: translateX(0)",
    to: "transform: translateX(200px)",
  },
  moveY: {
    from: "transform: translateY(0)",
    to: "transform: translateY(100px)",
  },
  scale: { from: "transform: scale(0.5)", to: "transform: scale(1.5)" },
  rotate: { from: "transform: rotate(0)", to: "transform: rotate(360deg)" },
  opacity: { from: "opacity: 0", to: "opacity: 1" },
  width: { from: "width: 50px", to: "width: 200px" },
}

export function EasingPreview({
  easing,
  property = "moveX",
  duration = 800,
  loop = false,
  showLinearComparison = false,
  className,
}: EasingPreviewProps) {
  const [animKey, setAnimKey] = useState(0)
  const animName = `easing-preview-${property}`

  return (
    <div
      className={cn(
        "relative w-full h-[120px] bg-muted/30 rounded overflow-hidden",
        className,
      )}
    >
      <style>
        {`@keyframes ${animName} {
          from { ${PROP_KEYFRAMES[property].from}; }
          to { ${PROP_KEYFRAMES[property].to}; }
        }`}
      </style>
      {showLinearComparison && (
        <div
          key={`ghost-${animKey}`}
          data-preview-ghost
          className="absolute top-6 left-4 size-8 rounded bg-muted-foreground/35"
          style={{
            animation: `${animName} ${duration}ms ${loop ? "infinite" : "1"} linear`,
          }}
        />
      )}
      <div
        key={`target-${animKey}`}
        data-preview-target
        data-animation-key={animKey}
        className="absolute top-6 left-4 size-8 rounded bg-primary"
        style={{
          animation: `${animName} ${duration}ms ${loop ? "infinite" : "1"} ${easing}`,
        }}
      />
      <div className="absolute bottom-2 right-2 flex gap-1">
        <button
          type="button"
          onClick={() => setAnimKey((k) => k + 1)}
          className="px-2 py-1 text-xs bg-background border rounded"
        >
          Replay
        </button>
      </div>
    </div>
  )
}
