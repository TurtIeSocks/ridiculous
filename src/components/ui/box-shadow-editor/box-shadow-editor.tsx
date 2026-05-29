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
  boxShadowLayerCount,
  defaultLayer,
  formatBoxShadow,
  parseBoxShadow,
} from "./box-shadow-editor.helpers"
import type { BoxShadowString, ShadowLayer } from "./box-shadow-editor.types"
import { BoxShadowPreview } from "./box-shadow-preview"
import { ShadowLayerRow } from "./shadow-layer-row"

// Re-export the extracted sub-components + their prop types so the public
// entry surface (and existing deep imports) is unchanged by the file split.
export type { BoxShadowPreviewProps } from "./box-shadow-preview"
export { BoxShadowPreview } from "./box-shadow-preview"
export type { ShadowLayerRowProps } from "./shadow-layer-row"
export { ShadowLayerRow } from "./shadow-layer-row"
export type { ShadowLengthEditorProps } from "./shadow-length-editor"
export { ShadowLengthEditor } from "./shadow-length-editor"

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------

export interface BoxShadowEditorPanelProps {
  value: BoxShadowString | (string & {})
  onChange: (value: BoxShadowString) => void
  className?: string
  "aria-label"?: string
}

export type BoxShadowEditorProps = BoxShadowEditorPanelProps

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
