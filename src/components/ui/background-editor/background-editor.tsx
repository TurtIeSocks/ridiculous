"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  defaultBackground,
  formatBackground,
  parseBackground,
} from "./background-editor.helpers"
import type { BackgroundString, BgLayer } from "./background-editor.types"
import { BackgroundPreview } from "./background-preview"
import { LayerStack } from "./layer-stack"

// Re-export the public sub-components + their prop types so consumers (and the
// barrel) can import them from `./background-editor`.
export type { BackgroundPreviewProps } from "./background-preview"
export { BackgroundPreview } from "./background-preview"
export type { LayerCardProps } from "./layer-card"
export { LayerCard } from "./layer-card"
export type { LayerStackProps } from "./layer-stack"
export { LayerStack } from "./layer-stack"
export type { MiniSelectProps } from "./mini-select"
export { MiniSelect } from "./mini-select"
export type { PositionPadProps } from "./position-pad"
export { PositionPad } from "./position-pad"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BackgroundEditorPanelProps {
  value: BackgroundString | (string & {})
  onChange: (value: BackgroundString) => void
  className?: string
  "aria-label"?: string
}

export interface BackgroundEditorProps extends BackgroundEditorPanelProps {}

// ---------------------------------------------------------------------------
// color re-homing — the index-aware invariant, kept true under reorder
// ---------------------------------------------------------------------------

/**
 * Keep the `<color>` on the FINAL layer no matter how the stack is reordered.
 * A reorder swaps whole layer objects, so a color that was on the last layer
 * would otherwise travel with its object into a non-final slot and be dropped
 * by `formatBackground` (which only emits a color on the last layer). This
 * collects any color found anywhere in the stack and re-homes it onto the last
 * layer, stripping it from every other — so the invariant survives a reorder.
 */
function migrateColorToFinal(layers: BgLayer[]): BgLayer[] {
  if (layers.length === 0) return layers
  // The last non-empty color wins (mirrors CSS: only the final layer's color
  // is meaningful, but a user-edited color should not be silently lost).
  let color: string | undefined
  for (const layer of layers) {
    if (layer.color !== undefined && layer.color !== "") color = layer.color
  }
  return layers.map((layer, i) => {
    const isFinal = i === layers.length - 1
    if (isFinal) return color === undefined ? layer : { ...layer, color }
    if (layer.color === undefined) return layer
    const { color: _drop, ...rest } = layer
    return rest
  })
}

// ---------------------------------------------------------------------------
// BackgroundEditor — popover-wrapped
// ---------------------------------------------------------------------------

export function BackgroundEditor(props: BackgroundEditorProps) {
  const {
    value,
    className,
    "aria-label": ariaLabel = "Edit a CSS background shorthand",
  } = props
  const { layers, error } = parseBackground(String(value))
  const label =
    error !== null
      ? "invalid"
      : `${layers.length} layer${layers.length === 1 ? "" : "s"}`

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
          <span className="text-[10px] text-muted-foreground">{label}</span>
          <span className="max-w-[220px] truncate text-xs">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <BackgroundEditorPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// BackgroundEditorPanel — inline
// ---------------------------------------------------------------------------

export function BackgroundEditorPanel({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "CSS background editor",
}: BackgroundEditorPanelProps) {
  const [layers, setLayers] = useState<BgLayer[]>(() => {
    const parsed = parseBackground(String(value) || defaultBackground())
    return parsed.error === null && parsed.layers.length > 0
      ? parsed.layers
      : parseBackground(defaultBackground()).layers
  })
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from an external value (skip our own emits).
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const parsed = parseBackground(String(value))
    if (parsed.error === null && parsed.layers.length > 0) {
      setLayers(parsed.layers)
    }
  }, [value])

  const commit = (next: BgLayer[]) => {
    const homed = migrateColorToFinal(next)
    setLayers(homed)
    const str = formatBackground(homed)
    lastEmittedRef.current = str
    onChange(str as BackgroundString)
  }

  const produced = formatBackground(layers)

  return (
    <fieldset
      className={cn(
        "m-0 w-[460px] space-y-3 border-0 bg-background p-3",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        <LayerStack layers={layers} onChange={commit} />
      </div>

      <LiveString value={produced} />

      <BackgroundPreview value={produced} />
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// LiveString — the produced `background` value in a `<code>` (internal helper,
// exported for parity with the sibling sub-components and demos).
// ---------------------------------------------------------------------------

export function LiveString({ value }: { value: string }) {
  return (
    <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
      {value || " "}
    </code>
  )
}
