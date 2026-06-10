"use client"

import { cn } from "@/lib/utils"
import { useGeojsonEditorContext } from "../context"

// MVP: textarea (NOT monaco — per the spec's premise). Line numbers +
// bracket-match are a follow-up seam; the resilient buffer is in the core.
export function RawJsonPane({ className }: { className?: string }) {
  const { rawText, setRawText, isValid } = useGeojsonEditorContext()
  return (
    <textarea
      data-slot="raw-json-pane"
      aria-label="Raw GeoJSON"
      spellCheck={false}
      value={rawText}
      onChange={(e) => setRawText(e.target.value)}
      aria-invalid={!isValid || undefined}
      className={cn(
        "h-full min-h-48 w-full resize-none rounded-md border border-input bg-background p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !isValid && "border-destructive",
        className,
      )}
    />
  )
}
