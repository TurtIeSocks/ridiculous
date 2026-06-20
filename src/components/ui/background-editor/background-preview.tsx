"use client"

import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// BackgroundPreview (public) — the live composite tile. Renders the produced
// `background` shorthand directly as the tile's `background` style so every
// layer (gradients, url() images, position / size / repeat, and the final
// color) composites in real time, back-to-front, exactly as the browser paints
// it. The value is a vetted shorthand string from `formatBackground`, so there
// is no injection surface beyond the CSS the user is already authoring. A
// checkerboard underlay makes transparency visible.
// ---------------------------------------------------------------------------

const CHECKER =
  "repeating-conic-gradient(rgb(0 0 0 / 0.06) 0% 25%, transparent 0% 50%) 50% / 16px 16px"

export interface BackgroundPreviewProps {
  /** The produced `background` shorthand to paint. */
  value: string
  className?: string
}

export function BackgroundPreview({
  value,
  className,
}: BackgroundPreviewProps) {
  return (
    <div className={cn("space-y-2 rounded-lg border p-3", className)}>
      <span className="text-muted-foreground text-xs">preview</span>
      <div
        data-testid="background-preview-tile"
        role="img"
        aria-label={`A tile painted with the background ${value}`}
        className="h-28 w-full overflow-hidden rounded-md border"
        style={{ background: value || CHECKER }}
      />
    </div>
  )
}
