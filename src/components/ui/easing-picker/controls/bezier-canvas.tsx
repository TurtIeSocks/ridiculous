import type React from "react"
import { useRef } from "react"
import { cn } from "@/lib/utils"
import { clamp } from "../easing-picker.helpers"

export interface BezierCanvasProps {
  value: { x1: number; y1: number; x2: number; y2: number }
  onChange: (v: { x1: number; y1: number; x2: number; y2: number }) => void
  extraTop?: number
  extraBottom?: number
  showLinearReference?: boolean
  className?: string
}

const CANVAS_SIZE = 240
const CANVAS_PAD = 8

export function BezierCanvas({
  value,
  onChange,
  extraTop = 0.25,
  extraBottom = 0.25,
  showLinearReference = true,
  className,
}: BezierCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const draggingRef = useRef<"p1" | "p2" | null>(null)

  const yMin = -extraBottom
  const yMax = 1 + extraTop
  const yRange = yMax - yMin
  const innerSize = CANVAS_SIZE - 2 * CANVAS_PAD

  const toScreen = (x: number, y: number) => ({
    sx: CANVAS_PAD + x * innerSize,
    sy: CANVAS_PAD + (yMax - y) * (innerSize / yRange),
  })

  const fromScreen = (sx: number, sy: number) => ({
    x: clamp((sx - CANVAS_PAD) / innerSize, 0, 1),
    y: yMax - ((sy - CANVAS_PAD) / innerSize) * yRange,
  })

  const p0 = toScreen(0, 0)
  const p3 = toScreen(1, 1)
  const p1 = toScreen(value.x1, value.y1)
  const p2 = toScreen(value.x2, value.y2)

  const pathD = `M ${p0.sx} ${p0.sy} C ${p1.sx} ${p1.sy}, ${p2.sx} ${p2.sy}, ${p3.sx} ${p3.sy}`

  const handlePointerDown = (which: "p1" | "p2") => (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    draggingRef.current = which
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const active = draggingRef.current
    if (!active || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scale = rect.width > 0 ? CANVAS_SIZE / rect.width : 1
    const sx = (e.clientX - rect.left) * scale
    const sy = (e.clientY - rect.top) * scale
    const { x, y } = fromScreen(sx, sy)
    if (active === "p1") onChange({ ...value, x1: x, y1: y })
    else onChange({ ...value, x2: x, y2: y })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    draggingRef.current = null
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      className={cn("size-full rounded bg-muted/30", className)}
      role="img"
      aria-label="Cubic bezier curve editor — drag the two handles to shape the curve"
    >
      <title>Cubic bezier curve editor</title>
      {showLinearReference && (
        <line
          x1={p0.sx}
          y1={p0.sy}
          x2={p3.sx}
          y2={p3.sy}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeDasharray="2 2"
        />
      )}
      <line
        x1={p0.sx}
        y1={p0.sy}
        x2={p1.sx}
        y2={p1.sy}
        stroke="currentColor"
        strokeOpacity={0.4}
      />
      <line
        x1={p3.sx}
        y1={p3.sy}
        x2={p2.sx}
        y2={p2.sy}
        stroke="currentColor"
        strokeOpacity={0.4}
      />
      <path
        data-curve
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        data-handle="p1"
        cx={p1.sx}
        cy={p1.sy}
        r="6"
        fill="currentColor"
        className="cursor-grab"
        onPointerDown={handlePointerDown("p1")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <circle
        data-handle="p2"
        cx={p2.sx}
        cy={p2.sy}
        r="6"
        fill="currentColor"
        className="cursor-grab"
        onPointerDown={handlePointerDown("p2")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </svg>
  )
}
