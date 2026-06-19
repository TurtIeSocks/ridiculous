"use client"

import { Input } from "@/components/ui/input"
import { UnitInput } from "@/components/ui/unit-input"
import { cn } from "@/lib/utils"
import { anchorSides, anchorSizes } from "./anchor-position-editor.helpers"
import type { AnchorExpr } from "./anchor-position-editor.types"
import { MiniSelect } from "./mini-select"

// ---------------------------------------------------------------------------
// AnchorExprFields (public) — the `anchor()` / `anchor-size()` editor: an
// optional `--name` ident input, the function `<select>` (anchor / anchor-size),
// the side/size `<select>` whose options swap with the function, and an
// optional `<length-percentage>` fallback driven by `unit-input`. The container
// owns the `AnchorExpr`; this is presentational.
// ---------------------------------------------------------------------------

/** A length-only default + the supported fallback unit (px). */
const FALLBACK_UNIT = "px"

function snapSide(fn: AnchorExpr["fn"], current: string): string {
  const options = fn === "anchor" ? anchorSides() : anchorSizes()
  return options.includes(current) ? current : options[0]
}

export interface AnchorExprFieldsProps {
  expr: AnchorExpr
  onChange: (next: AnchorExpr) => void
  className?: string
}

export function AnchorExprFields({
  expr,
  onChange,
  className,
}: AnchorExprFieldsProps) {
  const sideOptions = expr.fn === "anchor" ? anchorSides() : anchorSizes()
  const hasFallback = expr.fallback !== undefined && expr.fallback !== ""

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <MiniSelect
        aria-label="anchor function"
        value={expr.fn}
        onValueChange={(v) => {
          const fn = v as AnchorExpr["fn"]
          onChange({ ...expr, fn, side: snapSide(fn, expr.side) })
        }}
      >
        <option value="anchor">anchor</option>
        <option value="anchor-size">anchor-size</option>
      </MiniSelect>

      <Input
        aria-label="anchor name (optional dashed-ident)"
        value={expr.name ?? ""}
        spellCheck={false}
        autoComplete="off"
        placeholder="--name (optional)"
        onChange={(e) => {
          const name = e.target.value
          onChange({ ...expr, name: name === "" ? undefined : name })
        }}
        className="h-8 w-[140px] font-mono text-xs"
      />

      <MiniSelect
        aria-label={expr.fn === "anchor" ? "anchor side" : "anchor size"}
        value={sideOptions.includes(expr.side) ? expr.side : sideOptions[0]}
        onValueChange={(v) => onChange({ ...expr, side: v })}
      >
        {sideOptions.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </MiniSelect>

      <label className="flex h-8 items-center gap-1.5 rounded-md border border-input px-2 font-mono text-muted-foreground text-xs">
        <input
          type="checkbox"
          aria-label="add a fallback length"
          checked={hasFallback}
          onChange={(e) =>
            onChange({
              ...expr,
              fallback: e.target.checked ? `0${FALLBACK_UNIT}` : undefined,
            })
          }
          className="size-3.5"
        />
        fallback
      </label>

      {hasFallback && (
        <UnitInput
          aria-label="fallback length"
          unit={FALLBACK_UNIT}
          value={expr.fallback ?? `0${FALLBACK_UNIT}`}
          onChange={(next) => onChange({ ...expr, fallback: next })}
          className="w-[120px]"
        />
      )}
    </div>
  )
}
