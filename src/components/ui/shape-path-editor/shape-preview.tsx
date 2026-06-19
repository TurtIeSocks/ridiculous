"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { parseShape } from "./shape-path-editor.helpers"
import type { ShapeCommand, ShapeValue } from "./shape-path-editor.types"

// ---------------------------------------------------------------------------
// ShapePreview (public) — the live `shape()` preview. In `clip-path` mode the
// produced value clips a gradient box; in `offset-path` mode it animates a dot
// along the path. Guarded by `CSS.supports("clip-path: shape(from 0px 0px)")`:
// in a supporting browser (Chrome 137 / Safari 18.4) the live property renders;
// elsewhere (jsdom, older browsers) it degrades to a raw SVG `<path>` render of
// the same geometry plus a support note (mirrors `anchor-preview` / `if-function`).
// ---------------------------------------------------------------------------

const SUPPORT_FEATURE = "clip-path: shape(from 0px 0px)"

function detectSupport(): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") {
    return false
  }
  try {
    return CSS.supports(SUPPORT_FEATURE)
  } catch {
    return false
  }
}

/** Strip the unit off a `<length-percentage>`, returning its numeric part. */
function num(value: string): number {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

/**
 * Build an SVG path `d` from a parsed shape, in the same 0..100 viewBox the
 * fallback draws in. `by` commands accumulate relative to the cursor; `to`
 * commands are absolute. A best-effort sketch — arc flags / smooth reflection
 * are not reconstructed (the degraded path is a hint, not a renderer).
 */
function shapeToPathD(shape: ShapeValue): string {
  let cx = num(shape.from.x)
  let cy = num(shape.from.y)
  const parts: string[] = [`M ${cx} ${cy}`]
  for (const cmd of shape.commands) {
    parts.push(...emit(cmd))
  }
  function abs(value: string, base: number, rel: boolean): number {
    return rel ? base + num(value) : num(value)
  }
  function emit(cmd: ShapeCommand): string[] {
    switch (cmd.kind) {
      case "move": {
        cx = abs(cmd.to.x, cx, cmd.by)
        cy = abs(cmd.to.y, cy, cmd.by)
        return [`M ${cx} ${cy}`]
      }
      case "line": {
        cx = abs(cmd.to.x, cx, cmd.by)
        cy = abs(cmd.to.y, cy, cmd.by)
        return [`L ${cx} ${cy}`]
      }
      case "hline": {
        cx = abs(cmd.value, cx, cmd.by)
        return [`L ${cx} ${cy}`]
      }
      case "vline": {
        cy = abs(cmd.value, cy, cmd.by)
        return [`L ${cx} ${cy}`]
      }
      case "curve": {
        const ex = abs(cmd.to.x, cx, cmd.by)
        const ey = abs(cmd.to.y, cy, cmd.by)
        const c1x = abs(cmd.control.x, cx, cmd.by)
        const c1y = abs(cmd.control.y, cy, cmd.by)
        let out: string
        if (cmd.control2 !== undefined) {
          const c2x = abs(cmd.control2.x, cx, cmd.by)
          const c2y = abs(cmd.control2.y, cy, cmd.by)
          out = `C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`
        } else {
          out = `Q ${c1x} ${c1y} ${ex} ${ey}`
        }
        cx = ex
        cy = ey
        return [out]
      }
      case "smooth": {
        const ex = abs(cmd.to.x, cx, cmd.by)
        const ey = abs(cmd.to.y, cy, cmd.by)
        cx = ex
        cy = ey
        return [`L ${ex} ${ey}`]
      }
      case "arc": {
        const ex = abs(cmd.to.x, cx, cmd.by)
        const ey = abs(cmd.to.y, cy, cmd.by)
        const rx = num(cmd.radius.x)
        const ry = num(cmd.radius.y)
        cx = ex
        cy = ey
        return [`A ${rx} ${ry} 0 0 1 ${ex} ${ey}`]
      }
      case "close":
        return ["Z"]
    }
  }
  return parts.join(" ")
}

export type ShapePreviewMode = "clip-path" | "offset-path"

export interface ShapePreviewProps {
  /** The `shape()` value to visualize. */
  value: string
  /** `"clip-path"` (default) clips a box; `"offset-path"` animates a dot. */
  mode?: ShapePreviewMode
  className?: string
}

export function ShapePreview({
  value,
  mode = "clip-path",
  className,
}: ShapePreviewProps) {
  // Detect once on mount (post-hydration) so SSR + jsdom take the static path.
  const [supported, setSupported] = useState(false)
  useEffect(() => {
    setSupported(detectSupport())
  }, [])

  const parsed = parseShape(value)
  const shape: ShapeValue = {
    fillRule: parsed.fillRule,
    from: parsed.from,
    commands: parsed.commands,
  }
  const pathD = shapeToPathD(shape)
  const applied = parsed.error === null ? value : undefined

  return (
    <div className={cn("space-y-2 rounded-lg border p-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">preview · {mode}</span>
        {supported ? (
          <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
            shape() ✓
          </span>
        ) : (
          <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            not supported
          </span>
        )}
      </div>

      {supported && mode === "clip-path" ? (
        <div className="relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-md bg-[conic-gradient(at_30%_30%,#6366f1,#ec4899,#f59e0b,#10b981,#6366f1)]">
          <div
            data-shape-target
            className="absolute inset-0 bg-[linear-gradient(135deg,#0ea5e9,#8b5cf6,#ec4899)]"
            style={{ clipPath: applied }}
            aria-hidden="true"
          />
        </div>
      ) : supported && mode === "offset-path" ? (
        <div className="relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-md bg-muted/30">
          <div
            data-shape-target
            className="absolute size-4 rounded-full bg-primary"
            style={
              {
                offsetPath: applied,
                offsetDistance: "50%",
              } as React.CSSProperties
            }
            aria-hidden="true"
          />
        </div>
      ) : (
        <FallbackPath pathD={pathD} />
      )}

      <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
        {supported ? (
          <>
            Live render via <code className="font-mono">{mode}: shape(…)</code>.
          </>
        ) : (
          <>
            CSS <code className="font-mono">shape()</code> is unavailable here —
            showing a degraded SVG path of the same geometry. The produced value
            still copies and works in a supporting browser (Chrome 137 / Safari
            18.4).
          </>
        )}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FallbackPath — the degraded, support-free SVG path render.
// ---------------------------------------------------------------------------

function FallbackPath({ pathD }: { pathD: string }) {
  return (
    <div
      data-testid="shape-preview-fallback"
      role="img"
      aria-label="Static SVG path render of the shape"
      className="relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-md bg-muted/30"
    >
      <svg
        className="absolute inset-0 h-full w-full text-primary"
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <title>shape path</title>
        <path
          d={pathD}
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
