"use client"

import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// PositionPad (public) — the local 2D crosshair background-position picker. A
// labelled `role="slider"` pad: a pointer press / drag picks the x/y as a
// percent of the pad, and ArrowKeys nudge by 1% (Shift = 10%). Re-implemented
// IN SPIRIT from gradient-editor's PositionPicker, NOT imported — registry
// self-containment means each component carries its own crosshair so a
// `shadcn add` pulls a self-contained tree. The crosshair marker reflects the
// current x/y; the parent owns the value (controlled).
// ---------------------------------------------------------------------------

const NUDGE_STEP = 1
const NUDGE_SHIFT_STEP = 10

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n))
}

export interface PositionPadProps {
  /** Horizontal position, 0..100 (percent). */
  x: number
  /** Vertical position, 0..100 (percent). */
  y: number
  onChange: (next: { x: number; y: number }) => void
  className?: string
  "aria-label"?: string
}

export function PositionPad({
  x,
  y,
  onChange,
  className,
  "aria-label": ariaLabel = "Background position",
}: PositionPadProps) {
  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const nx = clamp(((event.clientX - rect.left) / rect.width) * 100)
    const ny = clamp(((event.clientY - rect.top) / rect.height) * 100)
    onChange({ x: Math.round(nx), y: Math.round(ny) })
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? NUDGE_SHIFT_STEP : NUDGE_STEP
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault()
        onChange({ x: clamp(x - step), y })
        break
      case "ArrowRight":
        event.preventDefault()
        onChange({ x: clamp(x + step), y })
        break
      case "ArrowUp":
        event.preventDefault()
        onChange({ x, y: clamp(y - step) })
        break
      case "ArrowDown":
        event.preventDefault()
        onChange({ x, y: clamp(y + step) })
        break
      default:
        break
    }
  }

  return (
    <div
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      // The pad is a 2D control; aria-valuenow carries x (the primary axis) and
      // aria-valuetext spells out both x% y% for assistive tech.
      aria-valuenow={Math.round(x)}
      aria-valuetext={`${Math.round(x)}% ${Math.round(y)}%`}
      tabIndex={0}
      className={cn(
        "relative size-16 shrink-0 cursor-crosshair touch-none rounded border bg-muted/40 outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      onPointerDown={(event) => {
        // jsdom lacks setPointerCapture; guard so the pad works under test.
        event.currentTarget.setPointerCapture?.(event.pointerId)
        handlePointer(event)
      }}
      onPointerMove={(event) => {
        if (event.buttons) handlePointer(event)
      }}
      onKeyDown={onKeyDown}
      data-slot="background-position-pad"
    >
      <div
        aria-hidden="true"
        className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/40"
        style={{ left: `${clamp(x)}%`, top: `${clamp(y)}%` }}
      />
    </div>
  )
}
