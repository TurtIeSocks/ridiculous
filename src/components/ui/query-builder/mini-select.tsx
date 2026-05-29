"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// MiniSelect — the compact `<select>` chrome shared by every query-builder
// dropdown (media type/modifier, joiner, shape, operator, feature, enum value).
// Owns the one class-string so the controls never drift (they previously hand-
// rolled `h-8 … text-xs` ~6× plus one stray `text-[11px]`). `onValueChange`
// hands back the raw `e.target.value`; callers that model an optional value map
// `"" ⇄ undefined` themselves (the placeholder text differs per control).
// ---------------------------------------------------------------------------

export const selectClass =
  "h-8 rounded-md border border-input bg-background px-1 font-mono text-xs"

export interface MiniSelectProps {
  "aria-label": string
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
  className?: string
}

export function MiniSelect({
  "aria-label": ariaLabel,
  value,
  onValueChange,
  children,
  className,
}: MiniSelectProps) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={cn(selectClass, className)}
    >
      {children}
    </select>
  )
}
