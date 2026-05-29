"use client"

import { useEffect, useId, useState } from "react"
import { cn } from "@/lib/utils"
import {
  type FilterMode,
  SCRUBS,
  type Scrub,
  withSingleValue,
} from "./filter-builder.constants"
import { formatFilter, parseFilter } from "./filter-builder.helpers"
import type { FilterItem } from "./filter-builder.types"

// ---------------------------------------------------------------------------
// Scrub helpers (UI-local)
// ---------------------------------------------------------------------------

/** Read the current scalar for a scrub fn from a parsed list (or a default). */
function scrubValue(items: FilterItem[], scrub: Scrub): number {
  const item = items.find((it) => it.fn === scrub.fn)
  if (!item || !("value" in item)) {
    return scrub.fn === "blur" || scrub.fn === "hue-rotate" ? 0 : 1
  }
  const n = Number.parseFloat(item.value)
  if (Number.isNaN(n)) {
    return scrub.fn === "blur" || scrub.fn === "hue-rotate" ? 0 : 1
  }
  return n
}

/** Merge a scrub change into the list (replace or append the function). */
function applyScrub(
  items: FilterItem[],
  scrub: Scrub,
  n: number,
): FilterItem[] {
  const next = withSingleValue(scrub.fn, `${n}${scrub.unit}`)
  const idx = items.findIndex((it) => it.fn === scrub.fn)
  if (idx === -1) return [...items, next]
  return items.map((it, i) => (i === idx ? next : it))
}

// ---------------------------------------------------------------------------
// FilterPreview (public) — the showcase
// ---------------------------------------------------------------------------

export interface FilterPreviewProps {
  value: string
  mode?: FilterMode
  onChange?: (value: string) => void
  className?: string
}

export function FilterPreview({
  value,
  mode: modeProp = "filter",
  onChange,
  className,
}: FilterPreviewProps) {
  const id = useId()
  const [mode, setMode] = useState<FilterMode>(modeProp)
  useEffect(() => setMode(modeProp), [modeProp])

  const items = parseFilter(value) ?? []
  const applied = value === "none" ? undefined : value

  return (
    <div className={cn("space-y-3 rounded-lg border p-3", className)}>
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">preview</div>
        <div className="inline-flex overflow-hidden rounded-md border text-[10px]">
          {(["filter", "backdrop-filter"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "px-2 py-1 font-mono",
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div
        className="relative flex h-40 items-center justify-center overflow-hidden rounded-md bg-[conic-gradient(at_30%_30%,#6366f1,#ec4899,#f59e0b,#10b981,#6366f1)]"
        aria-hidden="true"
      >
        {mode === "filter" ? (
          <div
            data-filter-target
            className="flex h-24 w-40 items-center justify-center rounded-lg bg-white/90 font-mono text-[10px] text-black shadow-lg"
            style={{ filter: applied }}
          >
            filter
          </div>
        ) : (
          <div
            data-backdrop-target
            className="flex h-24 w-40 items-center justify-center rounded-lg border border-white/30 bg-white/10 font-mono text-[10px] text-white"
            style={{ backdropFilter: applied }}
          >
            backdrop-filter
          </div>
        )}
      </div>

      {onChange ? (
        <div className="space-y-1.5">
          {SCRUBS.map((scrub) => {
            const current = scrubValue(items, scrub)
            return (
              <label
                key={scrub.fn}
                htmlFor={`${id}-${scrub.fn}`}
                className="flex items-center gap-2 text-xs"
              >
                <span className="w-20 font-mono text-muted-foreground">
                  {scrub.label}
                </span>
                <input
                  id={`${id}-${scrub.fn}`}
                  type="range"
                  aria-label={scrub.label}
                  min={scrub.min}
                  max={scrub.max}
                  step={scrub.step}
                  value={current}
                  onChange={(e) =>
                    onChange(
                      formatFilter(
                        applyScrub(items, scrub, Number(e.target.value)),
                      ),
                    )
                  }
                  className="flex-1"
                />
                <span className="w-14 text-right font-mono text-muted-foreground">
                  {current}
                  {scrub.unit}
                </span>
              </label>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
