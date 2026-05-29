"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { EasingPicker } from "@/components/ui/easing-picker"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { UnitInput } from "@/components/ui/unit-input"
import { cn } from "@/lib/utils"
import {
  defaultAnimationLayer,
  defaultTransitionLayer,
  formatAnimation,
  formatTransition,
  layerCount,
  parseAnimation,
  parseTransition,
} from "./transition-editor.helpers"
import type {
  AnimationDirection,
  AnimationFillMode,
  AnimationLayer,
  AnimationPlayState,
  AnimationString,
  EditorMode,
  TransitionEditorStringMap,
  TransitionLayer,
  TransitionString,
} from "./transition-editor.types"

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const TIME_UNITS = ["ms", "s"] as const

const COMMON_PROPERTIES = [
  "all",
  "none",
  "opacity",
  "transform",
  "color",
  "background-color",
  "width",
  "height",
  "box-shadow",
  "filter",
] as const

const DIRECTIONS: readonly AnimationDirection[] = [
  "normal",
  "reverse",
  "alternate",
  "alternate-reverse",
]
const FILL_MODES: readonly AnimationFillMode[] = [
  "none",
  "forwards",
  "backwards",
  "both",
]
const PLAY_STATES: readonly AnimationPlayState[] = ["running", "paused"]

// Demo keyframes for the preview (animation mode needs @keyframes to exist).
const PREVIEW_KEYFRAMES = `
@keyframes te-slide { from { transform: translateX(0); } to { transform: translateX(96px); } }
@keyframes te-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }
@keyframes te-spin { to { transform: rotate(360deg); } }
`

// ---------------------------------------------------------------------------
// Mode-keyed helper indirection
// ---------------------------------------------------------------------------

type AnyLayer = TransitionLayer | AnimationLayer

function parseValue(mode: EditorMode, value: string): AnyLayer[] | null {
  return mode === "transition" ? parseTransition(value) : parseAnimation(value)
}

function formatValue(mode: EditorMode, layers: AnyLayer[]): string {
  return mode === "transition"
    ? formatTransition(layers as TransitionLayer[])
    : formatAnimation(layers as AnimationLayer[])
}

function defaultLayerFor(mode: EditorMode): AnyLayer {
  return mode === "transition"
    ? defaultTransitionLayer()
    : defaultAnimationLayer()
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TransitionEditorPanelProps<
  TMode extends EditorMode = "transition",
> {
  /** Which shorthand to edit. Defaults to `"transition"`. */
  mode?: TMode
  value: TransitionEditorStringMap[TMode] | (string & {})
  onChange: (value: TransitionEditorStringMap[TMode]) => void
  className?: string
  "aria-label"?: string
}

export interface TransitionEditorProps<TMode extends EditorMode = "transition">
  extends TransitionEditorPanelProps<TMode> {}

// ---------------------------------------------------------------------------
// TransitionEditor — popover-wrapped
// ---------------------------------------------------------------------------

export function TransitionEditor<TMode extends EditorMode = "transition">(
  props: TransitionEditorProps<TMode>,
) {
  const {
    value,
    mode = "transition" as TMode,
    className,
    "aria-label": ariaLabel = "Edit a CSS transition or animation",
  } = props
  const count = layerCount(mode, String(value))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-9 gap-2 px-3 font-mono", className)}
          aria-label={ariaLabel}
        >
          <span className="text-[10px] text-muted-foreground uppercase">
            {mode}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {count} {count === 1 ? "layer" : "layers"}
          </span>
          <span className="max-w-[180px] truncate text-xs">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <TransitionEditorPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// TransitionEditorPanel — inline
// ---------------------------------------------------------------------------

export function TransitionEditorPanel<TMode extends EditorMode = "transition">({
  value,
  onChange,
  mode = "transition" as TMode,
  className,
  "aria-label": ariaLabel = "CSS transition / animation editor",
}: TransitionEditorPanelProps<TMode>) {
  const [layers, setLayers] = useState<AnyLayer[]>(
    () => parseValue(mode, String(value)) ?? [],
  )
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from external value (skip our own emits).
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const parsed = parseValue(mode, String(value))
    if (parsed !== null) setLayers(parsed)
  }, [value, mode])

  const commit = (next: AnyLayer[]) => {
    setLayers(next)
    const str = formatValue(mode, next)
    lastEmittedRef.current = str
    onChange(str as TransitionEditorStringMap[TMode])
  }

  const updateAt = (index: number, layer: AnyLayer) => {
    commit(layers.map((it, i) => (i === index ? layer : it)))
  }
  const removeAt = (index: number) => {
    commit(layers.filter((_, i) => i !== index))
  }
  const add = () => {
    commit([...layers, defaultLayerFor(mode)])
  }

  return (
    <fieldset
      className={cn(
        "m-0 w-[520px] space-y-3 border-0 bg-background p-3",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div className="space-y-2">
        {layers.map((layer, i) => (
          <TransitionLayerRow
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and reorderable only by add/remove
            key={`layer-${i}`}
            mode={mode}
            index={i}
            layer={layer}
            onChange={(next) => updateAt(i, next)}
            onRemove={() => removeAt(i)}
          />
        ))}
      </div>
      <AddLayerButton onAdd={add} />
      <LiveString value={formatValue(mode, layers)} />
      <TransitionPreview
        mode={mode}
        value={formatValue(mode, layers)}
        onChange={(str) => {
          const parsed = parseValue(mode, str)
          if (parsed !== null) commit(parsed)
        }}
      />
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// TransitionLayerRow (public)
// ---------------------------------------------------------------------------

export interface TransitionLayerRowProps {
  mode: EditorMode
  layer: AnyLayer
  onChange: (layer: AnyLayer) => void
  onRemove: () => void
  /** Positional index — used only for stable control labels. */
  index?: number
  className?: string
}

export function TransitionLayerRow({
  mode,
  layer,
  onChange,
  onRemove,
  index,
  className,
}: TransitionLayerRowProps) {
  const n = index === undefined ? "" : ` ${index + 1}`

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
        className,
      )}
    >
      {mode === "transition" ? (
        <TransitionFields
          n={n}
          layer={layer as TransitionLayer}
          onChange={onChange as (l: TransitionLayer) => void}
        />
      ) : (
        <AnimationFields
          n={n}
          layer={layer as AnimationLayer}
          onChange={onChange as (l: AnimationLayer) => void}
        />
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
// TransitionFields (internal) — the transition-mode controls
// ---------------------------------------------------------------------------

function TransitionFields({
  n,
  layer,
  onChange,
}: {
  n: string
  layer: TransitionLayer
  onChange: (layer: TransitionLayer) => void
}) {
  const setField = (patch: Partial<TransitionLayer>) => {
    onChange({ ...layer, ...patch })
  }
  return (
    <>
      <Input
        aria-label={`transition-property${n}`}
        list="te-property-list"
        value={layer.property ?? ""}
        spellCheck={false}
        autoComplete="off"
        placeholder="property"
        onChange={(e) =>
          setField({
            property: e.target.value === "" ? undefined : e.target.value,
          })
        }
        className="h-8 w-[120px] font-mono text-xs"
      />
      <datalist id="te-property-list">
        {COMMON_PROPERTIES.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <TimeField
        label={`duration${n}`}
        value={layer.duration ?? ""}
        onChange={(duration) =>
          setField({ duration: duration === "" ? undefined : duration })
        }
      />
      <TimeField
        label={`delay${n}`}
        value={layer.delay ?? ""}
        onChange={(delay) =>
          setField({ delay: delay === "" ? undefined : delay })
        }
      />
      <EasingPicker
        value={layer.easing ?? "ease"}
        onChange={(easing) => setField({ easing })}
        aria-label={`easing${n}`}
        className="h-8"
      />
      <button
        type="button"
        aria-label={`allow-discrete${n}`}
        aria-pressed={layer.allowDiscrete ?? false}
        onClick={() => setField({ allowDiscrete: !layer.allowDiscrete })}
        className={cn(
          "h-8 rounded border px-2 font-mono text-[10px]",
          layer.allowDiscrete
            ? "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground",
        )}
      >
        allow-discrete
      </button>
    </>
  )
}

// ---------------------------------------------------------------------------
// AnimationFields (internal) — the animation-mode controls
// ---------------------------------------------------------------------------

function AnimationFields({
  n,
  layer,
  onChange,
}: {
  n: string
  layer: AnimationLayer
  onChange: (layer: AnimationLayer) => void
}) {
  const setField = (patch: Partial<AnimationLayer>) => {
    onChange({ ...layer, ...patch })
  }
  const isInfinite = layer.iterationCount === "infinite"
  return (
    <>
      <Input
        aria-label={`animation-name${n}`}
        value={layer.name ?? ""}
        spellCheck={false}
        autoComplete="off"
        placeholder="name"
        onChange={(e) =>
          setField({ name: e.target.value === "" ? undefined : e.target.value })
        }
        className="h-8 w-[110px] font-mono text-xs"
      />
      <TimeField
        label={`duration${n}`}
        value={layer.duration ?? ""}
        onChange={(duration) =>
          setField({ duration: duration === "" ? undefined : duration })
        }
      />
      <TimeField
        label={`delay${n}`}
        value={layer.delay ?? ""}
        onChange={(delay) =>
          setField({ delay: delay === "" ? undefined : delay })
        }
      />
      <EasingPicker
        value={layer.easing ?? "ease"}
        onChange={(easing) => setField({ easing })}
        aria-label={`easing${n}`}
        className="h-8"
      />
      <span className="inline-flex items-center">
        <Input
          aria-label={`iteration-count${n}`}
          value={isInfinite ? "" : (layer.iterationCount ?? "")}
          disabled={isInfinite}
          inputMode="decimal"
          spellCheck={false}
          autoComplete="off"
          placeholder="count"
          onChange={(e) =>
            setField({
              iterationCount:
                e.target.value === "" ? undefined : e.target.value,
            })
          }
          className="h-8 w-[56px] rounded-r-none border-r-0 font-mono text-xs"
        />
        <button
          type="button"
          aria-label={`infinite${n}`}
          aria-pressed={isInfinite}
          onClick={() =>
            setField({ iterationCount: isInfinite ? "1" : "infinite" })
          }
          className={cn(
            "h-8 rounded-r-md border px-1.5 font-mono text-[10px]",
            isInfinite
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground",
          )}
        >
          ∞
        </button>
      </span>
      <KeywordSelect
        label={`direction${n}`}
        value={layer.direction}
        options={DIRECTIONS}
        onChange={(direction) =>
          setField({ direction: direction as AnimationDirection | undefined })
        }
      />
      <KeywordSelect
        label={`fill-mode${n}`}
        value={layer.fillMode}
        options={FILL_MODES}
        onChange={(fillMode) =>
          setField({ fillMode: fillMode as AnimationFillMode | undefined })
        }
      />
      <KeywordSelect
        label={`play-state${n}`}
        value={layer.playState}
        options={PLAY_STATES}
        onChange={(playState) =>
          setField({ playState: playState as AnimationPlayState | undefined })
        }
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// KeywordSelect (public) — a labelled native select with an empty option
// ---------------------------------------------------------------------------

export interface KeywordSelectProps {
  label: string
  value: string | undefined
  options: readonly string[]
  onChange: (value: string | undefined) => void
  className?: string
}

export function KeywordSelect({
  label,
  value,
  options,
  onChange,
  className,
}: KeywordSelectProps) {
  return (
    <select
      aria-label={label}
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? undefined : e.target.value)
      }
      className={cn(
        "h-8 rounded-md border border-input bg-background px-1 font-mono text-xs",
        className,
      )}
    >
      <option value="">{label.replace(/\s\d+$/, "")}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// TimeField (public) — a UnitInput for <time>, with opaque passthrough
// ---------------------------------------------------------------------------

export interface TimeFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
}

export function TimeField({
  label,
  value,
  onChange,
  className,
}: TimeFieldProps) {
  // Split "200ms" / "0.3s" into number + unit.
  const m = value.match(/^(-?\d*\.?\d*)(ms|s)$/i)
  const opaque = value !== "" && m === null // calc()/var() etc — raw text
  const numPart = m ? m[1] : ""
  const unitPart = (m ? m[2] : "ms").toLowerCase()

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
        value={value === "" ? "" : numPart}
        spellCheck={false}
        autoComplete="off"
        inputMode="decimal"
        placeholder="—"
        onChange={(e) => {
          const v = e.target.value
          onChange(v === "" ? "" : `${v}${unitPart}`)
        }}
        className="h-8 w-[56px] rounded-r-none border-r-0 font-mono text-xs"
      />
      <select
        aria-label={`${label} unit`}
        value={unitPart}
        onChange={(e) => onChange(`${numPart || "0"}${e.target.value}`)}
        className="h-8 rounded-l-none rounded-r-md border border-input bg-background px-1 font-mono text-xs"
      >
        {TIME_UNITS.map((u) => (
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
      aria-label="Add a layer"
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
// TransitionPreview (public) — the live showcase
// ---------------------------------------------------------------------------

export interface TransitionPreviewProps {
  mode: EditorMode
  value: string
  onChange?: (value: string) => void
  className?: string
}

// Map a demo keyframes-name to the @keyframes we actually ship in the preview.
const KEYFRAME_ALIAS: Record<string, string> = {
  slide: "te-slide",
  pulse: "te-pulse",
  spin: "te-spin",
}

/** Rewrite each animation layer's name to the preview's prefixed @keyframes. */
function aliasAnimation(value: string): string {
  const layers = parseAnimation(value)
  if (layers === null) return value
  return formatAnimation(
    layers.map((l) =>
      l.name && KEYFRAME_ALIAS[l.name]
        ? { ...l, name: KEYFRAME_ALIAS[l.name] }
        : l,
    ),
  )
}

/** Replace the first layer's duration with `ms` while preserving the rest. */
function setFirstDuration(mode: EditorMode, value: string, ms: number): string {
  const dur = `${ms}ms`
  if (mode === "transition") {
    const layers = parseTransition(value)
    if (layers === null || layers.length === 0) {
      return formatTransition([{ property: "all", duration: dur }])
    }
    return formatTransition(
      layers.map((l, i) => (i === 0 ? { ...l, duration: dur } : l)),
    )
  }
  const layers = parseAnimation(value)
  if (layers === null || layers.length === 0) {
    return formatAnimation([{ name: "slide", duration: dur }])
  }
  return formatAnimation(
    layers.map((l, i) => (i === 0 ? { ...l, duration: dur } : l)),
  )
}

/** Pull the first layer's duration in ms, defaulting to 200. */
function firstDurationMs(mode: EditorMode, value: string): number {
  const layers =
    mode === "transition" ? parseTransition(value) : parseAnimation(value)
  const d = layers?.[0]?.duration
  if (!d) return 200
  const m = d.match(/^([\d.]+)(ms|s)$/i)
  if (!m) return 200
  const n = Number.parseFloat(m[1])
  if (Number.isNaN(n)) return 200
  return m[2].toLowerCase() === "s" ? n * 1000 : n
}

export function TransitionPreview({
  mode,
  value,
  onChange,
  className,
}: TransitionPreviewProps) {
  // `tick` remounts the animation target to restart it; `toggled` flips the
  // transition target so the transition fires on each play press.
  const [tick, setTick] = useState(0)
  const [toggled, setToggled] = useState(false)

  const applied = value === "none" ? "" : value
  const durationMs = firstDurationMs(mode, value)

  const transitionStyle =
    mode === "transition"
      ? {
          transition: applied,
          transform: toggled ? "translateX(96px)" : "translateX(0)",
        }
      : { animation: aliasAnimation(applied) }

  const replay = () => {
    if (mode === "transition") {
      setToggled((t) => !t)
    } else {
      setTick((t) => t + 1)
    }
  }

  return (
    <div className={cn("space-y-3 rounded-lg border p-3", className)}>
      {/* Static demo keyframes (no user input); rendered as a text child, not
          dangerouslySetInnerHTML, so there is no injection surface. */}
      <style>{PREVIEW_KEYFRAMES}</style>
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">preview</div>
        <button
          type="button"
          onClick={replay}
          aria-label={
            mode === "transition" ? "Play transition" : "Replay animation"
          }
          className="rounded border px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground"
        >
          {mode === "transition" ? "play" : "replay"}
        </button>
      </div>

      <div className="flex h-28 items-center overflow-hidden rounded-md bg-[radial-gradient(circle_at_30%_40%,#1e293b,#0f172a)] px-4">
        <div
          key={mode === "animation" ? `anim-${tick}` : "trans"}
          data-preview-target
          className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-300 to-violet-400"
          style={transitionStyle}
          aria-hidden="true"
        />
      </div>

      {onChange ? (
        <div className="flex items-center gap-2 text-xs">
          <span className="w-16 font-mono text-muted-foreground">duration</span>
          <UnitInput
            unit="ms"
            value={`${Math.round(durationMs)}ms`}
            min={0}
            max={5000}
            step={50}
            aria-label="Duration (first layer) in ms"
            className="h-7 w-24"
            onChange={(next) => {
              const n = Number.parseFloat(next)
              onChange(setFirstDuration(mode, value, Number.isNaN(n) ? 0 : n))
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

// Re-export the suggestion-string types so consumers can pull everything from
// the component module if they prefer (the barrel also re-exports them).
export type { AnimationString, TransitionString }
