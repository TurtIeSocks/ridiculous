"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { AddLayerButton } from "./controls"
import { AnimationFields, TransitionFields } from "./fields"
import { TransitionPreview } from "./preview"
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
  AnimationLayer,
  AnimationString,
  EditorMode,
  TransitionEditorState,
  TransitionEditorStringMap,
  TransitionLayer,
  TransitionString,
} from "./transition-editor.types"

// ---------------------------------------------------------------------------
// Mode-keyed helper indirection
// ---------------------------------------------------------------------------

type AnyLayer = TransitionLayer | AnimationLayer

/**
 * Parse a value into a discriminated `{ mode, layers }` state, or `null` on a
 * parse error. The `mode` literal tags the layer list so downstream `format`
 * narrows the element type without a cast.
 */
function parseState(
  mode: EditorMode,
  value: string,
): TransitionEditorState | null {
  if (mode === "transition") {
    const layers = parseTransition(value)
    return layers === null ? null : { mode, layers }
  }
  const layers = parseAnimation(value)
  return layers === null ? null : { mode, layers }
}

/** Serialize a discriminated editor state. The `mode` tag narrows `layers`. */
function formatState(state: TransitionEditorState): string {
  return state.mode === "transition"
    ? formatTransition(state.layers)
    : formatAnimation(state.layers)
}

/** A fresh default layer for the mode. */
function defaultLayerFor(mode: EditorMode): AnyLayer {
  return mode === "transition"
    ? defaultTransitionLayer()
    : defaultAnimationLayer()
}

/**
 * Re-tag a working `AnyLayer[]` as a discriminated `{ mode, layers }` state.
 *
 * This is the ONE place the editor asserts the layer kind matches the mode —
 * unavoidable because the public `TransitionLayerRow` exposes an untagged
 * `layer: AnyLayer` alongside a separate `mode` prop, so the type system cannot
 * prove their correspondence. The editor only ever stores layers of the
 * matching kind (parse + defaults + per-mode fields all produce them), so the
 * per-branch assertion is sound. Routing every serialization through this one
 * boundary keeps `formatState` / `parseState` / the field dispatch cast-free.
 */
function toState(mode: EditorMode, layers: AnyLayer[]): TransitionEditorState {
  return mode === "transition"
    ? { mode, layers: layers as TransitionLayer[] }
    : { mode, layers: layers as AnimationLayer[] }
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

export type TransitionEditorProps<TMode extends EditorMode = "transition"> =
  TransitionEditorPanelProps<TMode>

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
    () => parseState(mode, String(value))?.layers ?? [],
  )
  const lastEmittedRef = useRef<string | null>(null)

  // Resync from external value (skip our own emits).
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const parsed = parseState(mode, String(value))
    if (parsed !== null) setLayers(parsed.layers)
  }, [value, mode])

  const commit = (next: AnyLayer[]) => {
    setLayers(next)
    const str = formatState(toState(mode, next))
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

  const live = formatState(toState(mode, layers))

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
      <LiveString value={live} />
      <TransitionPreview
        mode={mode}
        value={live}
        onChange={(str) => {
          const parsed = parseState(mode, str)
          if (parsed !== null) commit(parsed.layers)
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
  // Re-tag the untagged props as a discriminated state once, so the per-mode
  // field group receives a properly-narrowed layer with no cast at the call
  // site. `onChange` (taking the wider `AnyLayer`) is assignable to a handler
  // taking the narrower per-mode layer by parameter contravariance.
  const state = toState(mode, [layer])

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
        className,
      )}
    >
      {state.mode === "transition" ? (
        <TransitionFields n={n} layer={state.layers[0]} onChange={onChange} />
      ) : (
        <AnimationFields n={n} layer={state.layers[0]} onChange={onChange} />
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
// LiveString (internal)
// ---------------------------------------------------------------------------

function LiveString({ value }: { value: string }) {
  return (
    <code className="block overflow-x-auto rounded bg-muted/50 px-2 py-1.5 font-mono text-foreground text-xs">
      {value}
    </code>
  )
}

// Re-export the extracted controls / preview so the component module keeps the
// same public surface after the internal split (the index barrel re-exports the
// same names from their new homes).
export type {
  AddLayerButtonProps,
  KeywordSelectProps,
  TimeFieldProps,
} from "./controls"
export { AddLayerButton, KeywordSelect, TimeField } from "./controls"
export type { TransitionPreviewProps } from "./preview"
export { TransitionPreview } from "./preview"
// Re-export the suggestion-string types so consumers can pull everything from
// the component module if they prefer (the barrel also re-exports them).
export type { AnimationString, TransitionString }
