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
import {
  ALL_BASES,
  DEFAULT_BEZIER_STATE,
  DEFAULT_BY_BASIS,
} from "./easing-picker.constants"
import { formatEasing, matchPreset, parseEasing } from "./easing-picker.helpers"
import type {
  EasingBasis,
  EasingState,
  EasingString,
  EasingStringMap,
} from "./easing-picker.types"
import { BasisControls } from "./panel/basis-controls"
import { PreviewSection } from "./panel/preview-section"
import type { PreviewProperty } from "./preview/easing-preview"
import type { OutputFormat } from "./preview/output-panel"

// ---------------------------------------------------------------------------
// Public re-exports — keep the barrel surface stable for tests + examples.
// ---------------------------------------------------------------------------

export type { BezierCanvasProps } from "./controls/bezier-canvas"
export { BezierCanvas } from "./controls/bezier-canvas"
export type {
  BounceControlsProps,
  SpringControlsProps,
  WiggleControlsProps,
} from "./controls/physics-controls"
export {
  BounceControls,
  SpringControls,
  WiggleControls,
} from "./controls/physics-controls"
export type { PresetGalleryProps } from "./controls/preset-gallery"
export { PresetGallery } from "./controls/preset-gallery"
export type { StepsControlsProps } from "./controls/steps-controls"
export { StepsControls } from "./controls/steps-controls"
export type { Sample } from "./easing-picker.helpers"
export {
  bakeLinear,
  bezierFromPreset,
  formatEasing,
  matchPreset,
  PRESETS,
  parseEasing,
  sampleBounce,
  sampleSpring,
  sampleWiggle,
} from "./easing-picker.helpers"
export type {
  EasingPreviewProps,
  PreviewProperty,
} from "./preview/easing-preview"
export { EasingPreview } from "./preview/easing-preview"

// ---------------------------------------------------------------------------
// EasingPicker — popover trigger wrapping the panel
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
          <span className="font-mono text-xs">{label}</span>
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
// EasingPanel — the full editor (basis controls + preview + output)
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
  const [previewProperty, setPreviewProperty] =
    useState<PreviewProperty>("moveX")
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

  const easing = formatEasing(internal)

  return (
    <fieldset
      className={cn(
        "m-0 w-[480px] space-y-3 border-0 bg-background p-3",
        className,
      )}
      aria-label={ariaLabel}
    >
      <BasisControls
        state={internal}
        available={available}
        onSwitchBasis={switchBasis}
        onChangeState={setAndEmit}
      />
      <PreviewSection
        easing={easing}
        previewProperty={previewProperty}
        onPreviewPropertyChange={setPreviewProperty}
        outputFormat={outputFormat}
        onOutputFormatChange={setOutputFormat}
      />
    </fieldset>
  )
}
