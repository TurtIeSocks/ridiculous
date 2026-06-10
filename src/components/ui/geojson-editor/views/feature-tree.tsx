"use client"

import { cn } from "@/lib/utils"
import { useGeojsonEditorContext } from "../context"
import type { Feature, GeojsonPath } from "../geojson-editor.types"

function geomLabel(f: Feature): string {
  return f.geometry ? f.geometry.type : "null"
}

export function FeatureTree({ className }: { className?: string }) {
  const { value, selection, select, addFeature, removeFeature, errors } =
    useGeojsonEditorContext()

  const features: Feature[] =
    value.type === "FeatureCollection"
      ? value.features
      : value.type === "Feature"
        ? [value]
        : []

  const isFC = value.type === "FeatureCollection"
  const pathFor = (i: number): GeojsonPath => (isFC ? ["features", i] : [])
  const hasError = (i: number) =>
    errors.some(
      (e) =>
        e.severity === "error" &&
        (isFC ? e.path[0] === "features" && e.path[1] === i : true),
    )
  const isSelected = (p: GeojsonPath) =>
    selection !== null && p.every((seg, i) => selection[i] === seg)

  return (
    <div
      data-slot="feature-tree"
      className={cn("flex flex-col gap-1 text-sm", className)}
    >
      {features.map((f, i) => {
        const p = pathFor(i)
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: MVP list, no stable feature ids
          <div key={i} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => select(p)}
              className={cn(
                "flex flex-1 items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-muted/50",
                isSelected(p) && "bg-muted",
              )}
            >
              <span>Feature</span>
              <span className="text-muted-foreground text-xs">
                · {geomLabel(f)}
              </span>
              {hasError(i) && (
                <span className="ml-auto size-1.5 rounded-full bg-destructive" />
              )}
            </button>
            {isFC && (
              <button
                type="button"
                aria-label={`Remove feature ${i + 1}`}
                onClick={() => removeFeature(i)}
                className="px-2 py-1 text-muted-foreground hover:text-destructive"
              >
                ✕
              </button>
            )}
          </div>
        )
      })}
      {isFC && (
        <button
          type="button"
          onClick={() => addFeature()}
          className="rounded-md border border-input border-dashed px-2 py-1 text-left text-muted-foreground hover:bg-muted/50"
        >
          + add feature
        </button>
      )}
    </div>
  )
}
