"use client"

import { ColorPicker } from "@/components/ui/color-picker"
import { cn } from "@/lib/utils"
import type { ShadowLayer } from "./box-shadow-editor.types"
import { ShadowLengthEditor } from "./shadow-length-editor"

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
