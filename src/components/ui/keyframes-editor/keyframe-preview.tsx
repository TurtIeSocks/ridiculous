"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { selectorToPercent } from "./keyframes-editor.helpers"
import type { KeyframeBlock } from "./keyframes-editor.types"

// ---------------------------------------------------------------------------
// KeyframePreview (public) — a LIGHTWEIGHT JS interpolation of the keyframe body
// at the current play-head position (spec §4.1, A6). It is NOT a CSS animation
// or timing engine: it linearly interpolates the surrounding stops' numeric /
// length / opacity declarations and applies the result as the preview box's
// inline style. Non-numeric declarations (transform, color, …) snap to the
// nearest stop rather than interpolate — the demo affordance is "scrub to see
// the box move", not a full renderer. A play/pause toggle auto-advances the
// position via the parent's `onPosition`.
//
// `position` is a controlled 0–100 percent. When `onPosition` is omitted the
// preview is static (the play toggle is hidden) so the component degrades to a
// pure render in environments without a parent scrubber.
// ---------------------------------------------------------------------------

/** A handful of inline-style-safe properties we interpolate or snap. */
const NUMERIC_PROPS = new Set<string>(["opacity"])

/** camelCase a kebab CSS property for React's inline-style object. */
function toCamel(prop: string): string {
  return prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

/** Strip the unit off a `<length-percentage>`; returns null if non-numeric. */
function splitUnit(value: string): { n: number; unit: string } | null {
  const m = value.trim().match(/^(-?\d*\.?\d+)([a-z%]*)$/i)
  if (!m) return null
  const n = Number.parseFloat(m[1])
  if (!Number.isFinite(n)) return null
  return { n, unit: m[2] }
}

/** Linear interpolate two declaration values; snap to `b` when non-numeric. */
function lerpValue(a: string, b: string, t: number): string {
  const av = splitUnit(a)
  const bv = splitUnit(b)
  if (av && bv && av.unit === bv.unit) {
    const n = av.n + (bv.n - av.n) * t
    return `${Number.parseFloat(n.toFixed(3))}${av.unit}`
  }
  // Non-numeric or mismatched units → snap at the midpoint.
  return t < 0.5 ? a : b
}

/** Sort blocks by track percent so neighbour lookup is monotonic. */
function sortByPercent(blocks: KeyframeBlock[]): KeyframeBlock[] {
  return [...blocks].sort(
    (x, y) =>
      selectorToPercent(x.selectors[0] ?? "from") -
      selectorToPercent(y.selectors[0] ?? "from"),
  )
}

/**
 * Build the interpolated inline style at `position` (0–100). For each property
 * present anywhere, find the surrounding stops and lerp; opacity defaults to 1.
 */
function interpolatedStyle(
  blocks: KeyframeBlock[],
  position: number,
): React.CSSProperties {
  const sorted = sortByPercent(blocks)
  if (sorted.length === 0) return {}

  // Collect every property declared in any stop.
  const props = new Set<string>()
  for (const block of sorted) {
    for (const d of block.declarations) props.add(d.property)
  }

  const style: Record<string, string> = {}
  for (const prop of props) {
    // The stops (with their percent) that declare this property.
    const points = sorted
      .map((b) => ({
        pct: selectorToPercent(b.selectors[0] ?? "from"),
        decl: b.declarations.find((d) => d.property === prop),
      }))
      .filter(
        (p): p is { pct: number; decl: { property: string; value: string } } =>
          Boolean(p.decl),
      )
    if (points.length === 0) continue

    // Clamp before the first / after the last declared stop.
    if (position <= points[0].pct) {
      style[toCamel(prop)] = points[0].decl.value
      continue
    }
    if (position >= points[points.length - 1].pct) {
      style[toCamel(prop)] = points[points.length - 1].decl.value
      continue
    }
    // Find the bracketing pair and lerp.
    for (let i = 0; i < points.length - 1; i++) {
      const lo = points[i]
      const hi = points[i + 1]
      if (position >= lo.pct && position <= hi.pct) {
        const span = hi.pct - lo.pct || 1
        const t = (position - lo.pct) / span
        const interp =
          NUMERIC_PROPS.has(prop) || splitUnit(lo.decl.value)
            ? lerpValue(lo.decl.value, hi.decl.value, t)
            : t < 0.5
              ? lo.decl.value
              : hi.decl.value
        style[toCamel(prop)] = interp
        break
      }
    }
  }
  return style as React.CSSProperties
}

export interface KeyframePreviewProps {
  blocks: KeyframeBlock[]
  /** The play-head position, 0–100. */
  position: number
  /** Controls play/pause auto-advance; omit for a static preview. */
  onPosition?: (percent: number) => void
  className?: string
}

export function KeyframePreview({
  blocks,
  position,
  onPosition,
  className,
}: KeyframePreviewProps) {
  const [playing, setPlaying] = useState(false)
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number>(0)
  // Track the live position in a ref so the rAF loop advances from the latest
  // value without restarting every frame (depending on `position` would).
  const posRef = useRef(position)
  posRef.current = position

  // Auto-advance the play head while playing (≈ a 2s loop). Pure JS, no CSS
  // animation engine (A6). Disabled when no `onPosition` is wired.
  useEffect(() => {
    if (!playing || !onPosition) return
    lastRef.current = performance.now()
    const tick = (now: number) => {
      const dt = now - lastRef.current
      lastRef.current = now
      const next = (posRef.current + (dt / 2000) * 100) % 100.0001
      onPosition(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [playing, onPosition])

  const style = interpolatedStyle(blocks, position)

  return (
    <div className={cn("space-y-2 rounded-lg border p-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          preview · {Math.round(position)}%
        </span>
        {/* Play/pause is always present (spec §5); it only auto-advances the
            play head when a parent wires `onPosition`. */}
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          disabled={!onPosition}
          onClick={() => setPlaying((p) => !p)}
          className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary hover:bg-primary/20 disabled:opacity-40"
        >
          {playing ? "❚❚ pause" : "▶ play"}
        </button>
      </div>

      <div className="grid h-28 place-items-center rounded-md bg-[conic-gradient(at_30%_30%,theme(colors.muted.DEFAULT),transparent)] bg-muted/20">
        <div
          data-testid="keyframe-preview-box"
          role="img"
          aria-label={`Preview at ${Math.round(position)}%`}
          className="size-12 rounded-md bg-primary"
          style={style}
        />
      </div>

      <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
        Lightweight JS interpolation between adjacent stops (numbers / lengths /
        opacity). Non-numeric values snap to the nearest stop — this is a scrub
        demo, not a full CSS animation engine.
      </p>
    </div>
  )
}
