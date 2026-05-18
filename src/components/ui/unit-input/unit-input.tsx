"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type {
  KnownUnit,
  UnitStringMap,
} from "./unit-input.types"

export interface UnitInputProps<
  TUnit extends KnownUnit | (string & {}) = KnownUnit | (string & {}),
> {
  value: TUnit extends KnownUnit
    ? UnitStringMap[TUnit] | (string & {})
    : string
  onChange: (
    next: TUnit extends KnownUnit ? UnitStringMap[TUnit] : string,
  ) => void
  unit: TUnit
  min?: number
  max?: number
  step?: number
  precision?: number
  dragSensitivity?: number
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  disabled?: boolean
  "aria-label"?: string
  className?: string
}

function parseNumeric(value: string, unit: string): number {
  const stripped = value.endsWith(unit) ? value.slice(0, -unit.length) : value
  const n = Number.parseFloat(stripped)
  return Number.isNaN(n) ? 0 : n
}

export function UnitInput<TUnit extends KnownUnit | (string & {})>({
  value,
  unit,
  precision = 0,
  prefix,
  suffix,
  disabled,
  className,
  "aria-label": ariaLabel,
}: UnitInputProps<TUnit>) {
  const unitStr = String(unit)
  const parsed = parseNumeric(String(value), unitStr)
  const displayed = parsed.toFixed(precision)
  const suffixNode = suffix ?? (
    <span
      data-slot="unit-input-suffix"
      className="select-none cursor-ew-resize bg-muted/50 px-2 flex items-center text-xs font-mono text-muted-foreground"
      aria-hidden="true"
    >
      {unitStr}
    </span>
  )
  return (
    <div
      data-slot="unit-input"
      className={cn(
        "inline-flex items-stretch h-7 rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
        disabled && "opacity-50",
        className,
      )}
    >
      {prefix ? (
        <div
          data-slot="unit-input-prefix"
          className="flex items-center px-2 bg-muted/50 border-r border-input"
        >
          {prefix}
        </div>
      ) : null}
      <Input
        value={displayed}
        readOnly
        disabled={disabled}
        aria-label={ariaLabel}
        className="border-0 rounded-none bg-transparent px-2 font-mono text-xs h-full focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
      />
      <div className="w-px bg-input" aria-hidden="true" />
      {suffix === undefined ? (
        suffixNode
      ) : (
        <div data-slot="unit-input-suffix">{suffix}</div>
      )}
    </div>
  )
}
