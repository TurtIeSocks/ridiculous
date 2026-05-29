"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  ANGLE_UNITS,
  FUNCTION_GROUPS,
  LENGTH_UNITS,
  NUMBER_UNIT_RE,
  UNITLESS,
} from "./transform-builder.constants"
import type { ArgKind } from "./transform-builder.helpers"
import type { TransformFunctionName } from "./transform-builder.types"

// ---------------------------------------------------------------------------
// ArgEditor (public) — a single argument slot: number + unit, or raw text
// ---------------------------------------------------------------------------

export interface ArgEditorProps {
  fn: TransformFunctionName
  label: string
  kind: ArgKind
  value: string
  onChange: (value: string) => void
  className?: string
}

export function ArgEditor({
  label,
  kind,
  value,
  onChange,
  className,
}: ArgEditorProps) {
  const unitless = UNITLESS.has(kind)
  const units = kind === "angle" ? ANGLE_UNITS : LENGTH_UNITS

  // Split a value like "10px" into number + unit for the dual control.
  // Requires at least one digit (so "", "-", and a bare unit like "px" stay
  // opaque rather than emitting "-px"/"0px"); accepts an exponent ("1e3px").
  const m = value.match(NUMBER_UNIT_RE)
  const numPart = m ? m[1] : value
  const unitPart = m ? m[2] : ""
  const opaque = m === null // "", lone sign, calc()/var() etc — show raw

  if (opaque || unitless) {
    return (
      <Input
        aria-label={label}
        value={value}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-8 w-[88px] font-mono text-xs", className)}
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
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-[72px] rounded-r-none border-r-0 font-mono text-xs"
      />
      <select
        aria-label={`${label} unit`}
        value={unitPart || units[0]}
        onChange={(e) => onChange(`${numPart || "0"}${e.target.value}`)}
        className="h-8 rounded-r-md rounded-l-none border border-input bg-background px-1 font-mono text-xs"
      >
        {units.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </span>
  )
}

// ---------------------------------------------------------------------------
// FunctionSelect (internal) — pick the function for an existing row
// ---------------------------------------------------------------------------

export function FunctionSelect({
  value,
  onChange,
}: {
  value: TransformFunctionName
  onChange: (fn: TransformFunctionName) => void
}) {
  return (
    <select
      aria-label="Transform function"
      value={value}
      onChange={(e) => onChange(e.target.value as TransformFunctionName)}
      className="h-8 rounded border bg-background px-1.5 font-mono text-xs"
    >
      {FUNCTION_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.fns.map((fn) => (
            <option key={fn} value={fn}>
              {fn}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// AddFunctionMenu (public) — append a new function row
// ---------------------------------------------------------------------------

export interface AddFunctionMenuProps {
  onAdd: (fn: TransformFunctionName) => void
  className?: string
}

export function AddFunctionMenu({ onAdd, className }: AddFunctionMenuProps) {
  return (
    <select
      aria-label="Add a transform function"
      value=""
      onChange={(e) => {
        const fn = e.target.value
        if (fn) onAdd(fn as TransformFunctionName)
        e.target.value = ""
      }}
      className={cn(
        "h-9 w-full rounded-md border border-dashed bg-background px-2 font-mono text-muted-foreground text-xs",
        className,
      )}
    >
      <option value="">+ add function…</option>
      {FUNCTION_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.fns.map((fn) => (
            <option key={fn} value={fn}>
              {fn}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
