"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Length units offered by the per-slot editor.
// ---------------------------------------------------------------------------

export const LENGTH_UNITS = ["px", "rem", "em", "%", "vw", "vh"] as const

// A non-empty value that splits into a numeric part (≥1 digit, optional
// exponent) followed by an optional unit. A lone sign, a bare unit, or a
// solitary "." does NOT match — those are treated as opaque (raw) values.
const NUMBER_UNIT_RE = /^(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([a-z%]*)$/i

export interface ShadowLengthEditorProps {
  label: string
  value: string
  onChange: (value: string) => void
  /** Allow a leading minus sign (offsets + spread). Blur disallows it. */
  allowNegative?: boolean
  className?: string
}

export function ShadowLengthEditor({
  label,
  value,
  onChange,
  allowNegative = false,
  className,
}: ShadowLengthEditorProps) {
  // Split "10px" / "-2px" / "150%" / "1e3px" into number + unit. The number
  // part requires AT LEAST ONE digit (so a lone "-", a bare unit, or "." is
  // NOT a match) and accepts an optional exponent. An empty slot stays in the
  // split editor (the unit select seeds "0"); any non-empty, non-matching
  // value (calc()/var()/lone-sign/bare-unit) is shown raw.
  const m = value.match(NUMBER_UNIT_RE)
  const numPart = m ? m[1] : ""
  const unitPart = m ? m[2] : ""
  const opaque = value !== "" && m === null // calc()/var()/lone-sign — show raw

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
        value={value}
        spellCheck={false}
        autoComplete="off"
        inputMode={allowNegative ? "text" : "decimal"}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-[56px] rounded-r-none border-r-0 font-mono text-xs"
      />
      <select
        aria-label={`${label} unit`}
        value={unitPart || LENGTH_UNITS[0]}
        onChange={(e) => onChange(`${numPart || "0"}${e.target.value}`)}
        className="h-8 rounded-r-md rounded-l-none border border-input bg-background px-1 font-mono text-xs"
      >
        {LENGTH_UNITS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </span>
  )
}
