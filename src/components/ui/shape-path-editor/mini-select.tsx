"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// MiniSelect — the compact `<select>` chrome shared by the shape-path-editor
// command rows (command kind, by/to direction, fill-rule). A LOCAL copy, per
// registry self-containment: every component owns its own mini-select so a
// `shadcn add shape-path-editor` never reaches into a sibling component's
// internals. `onValueChange` hands back the raw `e.target.value`.
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
