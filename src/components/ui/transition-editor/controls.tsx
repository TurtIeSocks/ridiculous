"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { parseTime } from "./transition-editor.helpers"

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const TIME_UNITS = ["ms", "s"] as const

// ---------------------------------------------------------------------------
// KeywordSelect — a labelled native select with an empty option
// ---------------------------------------------------------------------------

export interface KeywordSelectProps<T extends string = string> {
  label: string
  value: T | undefined
  options: readonly T[]
  onChange: (value: T | undefined) => void
  className?: string
}

export function KeywordSelect<T extends string = string>({
  label,
  value,
  options,
  onChange,
  className,
}: KeywordSelectProps<T>) {
  return (
    <select
      aria-label={label}
      value={value ?? ""}
      onChange={(e) =>
        // `HTMLSelectElement.value` is necessarily `string`; the rendered
        // <option>s are exactly `options`, so the value is a `T` or "".
        onChange(e.target.value === "" ? undefined : (e.target.value as T))
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
// TimeField — a UnitInput for <time>, with opaque passthrough
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
  // Split "200ms" / "0.3s" into number + unit (shared `<time>` parser).
  const t = parseTime(value)
  const opaque = value !== "" && t === null // calc()/var() etc — raw text
  const numPart = t ? t.num : ""
  const unitPart = t ? t.unit : "ms"

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
        onChange={(e) =>
          // Picking a concrete unit is an explicit intent to set a time, so an
          // empty field seeds 0 (`numPart || "0"`) rather than emitting "".
          onChange(`${numPart || "0"}${e.target.value}`)
        }
        className="h-8 rounded-r-md rounded-l-none border border-input bg-background px-1 font-mono text-xs"
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
// AddLayerButton
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
