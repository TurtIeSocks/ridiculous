"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"
import { SCRUBS, type Scrub } from "./transform-builder.constants"
import {
  formatTransform,
  itemArgs,
  itemFromArgs,
  parseTransform,
} from "./transform-builder.helpers"
import type { TransformItem } from "./transform-builder.types"

// ---------------------------------------------------------------------------
// TransformPreview3D (public) — the showcase 3D scene + scrubbers
// ---------------------------------------------------------------------------

export interface TransformPreview3DProps {
  value: string
  onChange?: (value: string) => void
  className?: string
}

/** Read the current scalar for a scrub fn from a parsed list (or a default). */
function scrubValue(items: TransformItem[], scrub: Scrub): number {
  const item = items.find((it) => it.fn === scrub.fn)
  if (!item) return scrub.fn === "scale" ? 1 : 0
  const raw =
    "angle" in item
      ? item.angle
      : "value" in item
        ? item.value
        : "x" in item
          ? item.x
          : "0"
  const n = Number.parseFloat(raw)
  return Number.isNaN(n) ? (scrub.fn === "scale" ? 1 : 0) : n
}

/**
 * Merge a scrub change into the list. A scrub retunes only the primary
 * (slot-0) scalar of its function: when that function already exists we keep
 * its remaining args (e.g. the optional `y` of `scale(x, y)`) and rewrite just
 * slot 0; otherwise we append a fresh single-arg item.
 */
function applyScrub(
  items: TransformItem[],
  scrub: Scrub,
  n: number,
): TransformItem[] {
  const slot0 = `${n}${scrub.unit}`
  const idx = items.findIndex((it) => it.fn === scrub.fn)
  if (idx === -1) {
    return [...items, itemFromArgs(scrub.fn, [slot0])]
  }
  return items.map((it, i) => {
    if (i !== idx) return it
    // Copy first: itemArgs can return the live array (valuesShape returns
    // `item.values` by reference), so mutating in place would corrupt state.
    const args = [...itemArgs(it)]
    args[0] = slot0
    return itemFromArgs(scrub.fn, args)
  })
}

export function TransformPreview3D({
  value,
  onChange,
  className,
}: TransformPreview3DProps) {
  const id = useId()
  const items = parseTransform(value) ?? []

  return (
    <div className={cn("space-y-3 rounded-lg border p-3", className)}>
      <div className="text-muted-foreground text-xs">3D preview</div>
      <div
        className="flex h-40 items-center justify-center rounded-md bg-muted/30"
        style={{ perspective: "600px" }}
      >
        <div
          data-transform-card
          className="flex h-20 w-28 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 font-mono text-[10px] text-primary-foreground shadow-lg"
          style={{ transform: value === "none" ? undefined : value }}
          aria-hidden="true"
        >
          transform
        </div>
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
                      formatTransform(
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
