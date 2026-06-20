"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// MiniSelect — the compact `<select>` chrome shared by every background-editor
// dropdown (repeat / attachment / origin / clip / size keyword). Owns the one
// class-string so the controls never drift. A LOCAL copy: registry
// self-containment means this component carries its own MiniSelect rather than
// importing query-builder's (`shadcn add` must pull a self-contained tree).
// `onValueChange` hands back the raw `e.target.value`.
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
