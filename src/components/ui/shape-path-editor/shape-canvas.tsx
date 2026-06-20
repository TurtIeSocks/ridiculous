"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { CanvasPoint } from "./shape-path-editor.helpers"
import {
  formatShape,
  parseShape,
  shapeToPoints,
  updatePoint,
} from "./shape-path-editor.helpers"
import type { ShapeValue } from "./shape-path-editor.types"

// ---------------------------------------------------------------------------
// ShapeCanvas (public) — the draggable SVG path canvas. Mirrors
// clip-path-editor's draggable-vertex preview, leveled up with Bézier control
// handles (each with a connector line to its owning endpoint) and an arc
// radius gizmo. Endpoints + control handles come from `shapeToPoints`; dragging
// or arrow-nudging one calls `updatePoint` → re-serializes → `onChange`.
//
// Coordinates live in a normalized 0..CANVAS px space (the `from` seed plus
// every command coordinate). The stage maps client px → canvas px via its
// bounding rect, so a 200px-wide stage and a 200px canvas are 1:1.
// ---------------------------------------------------------------------------

const CANVAS = 200

export interface ShapeCanvasProps {
  /** The current `shape()` value. */
  value: string
  /** Omit for a read-only canvas (no drag handles). */
  onChange?: (value: string) => void
  className?: string
}

interface DragTarget {
  id: string
}

/** Clamp a number into the canvas range. */
function clampCanvas(n: number): number {
  return Math.max(0, Math.min(CANVAS, n))
}

/** Round to 1 decimal place, dropping a trailing ".0". */
function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Human-readable role label for a handle's aria-label. */
function roleLabel(p: CanvasPoint, kind: string): string {
  if (p.cmdIndex === -1) return "from point"
  if (p.role === "control")
    return `command ${p.cmdIndex + 1} ${kind} control handle`
  if (p.role === "control2")
    return `command ${p.cmdIndex + 1} ${kind} second control handle`
  return `command ${p.cmdIndex + 1} ${kind} endpoint`
}

export function ShapeCanvas({ value, onChange, className }: ShapeCanvasProps) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<DragTarget | null>(null)
  const [dragging, setDragging] = useState(false)

  const parsed = parseShape(value)
  const shape: ShapeValue = {
    fillRule: parsed.fillRule,
    from: parsed.from,
    commands: parsed.commands,
  }
  const points = shapeToPoints(shape)

  // Index endpoints by command so control handles can draw a connector line.
  const endpointByCmd = new Map<number, CanvasPoint>()
  for (const p of points) {
    if (p.role === "endpoint") endpointByCmd.set(p.cmdIndex, p)
  }

  // --- drag math: client coords → canvas px point ------------------------
  const movePoint = (clientX: number, clientY: number) => {
    const drag = dragRef.current
    const stage = stageRef.current
    if (drag === null || stage === null || !onChange) return
    const rect = stage.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const x = round1(clampCanvas(((clientX - rect.left) / rect.width) * CANVAS))
    const y = round1(clampCanvas(((clientY - rect.top) / rect.height) * CANVAS))
    onChange(formatShape(updatePoint(shape, drag.id, x, y)))
  }

  // Stash the latest closure so the window listeners (attached once per drag)
  // always call the freshest `movePoint` without re-subscribing each render.
  const movePointRef = useRef(movePoint)
  movePointRef.current = movePoint

  useEffect(() => {
    if (!dragging) return
    const onPointerMove = (e: PointerEvent) =>
      movePointRef.current(e.clientX, e.clientY)
    const onPointerUp = () => {
      dragRef.current = null
      setDragging(false)
    }
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
  }, [dragging])

  const nudge = (p: CanvasPoint, dx: number, dy: number) => {
    if (!onChange) return
    const nx = round1(clampCanvas(p.x + dx))
    const ny = round1(clampCanvas(p.y + dy))
    onChange(formatShape(updatePoint(shape, p.id, nx, ny)))
  }

  // The outline path: connect endpoints in order (rough preview of the form).
  const outline = points
    .filter((p) => p.role === "endpoint")
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ")

  return (
    <div
      ref={stageRef}
      data-testid="shape-canvas-stage"
      className={cn(
        "relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-md border bg-muted/20",
        className,
      )}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        viewBox={`0 0 ${CANVAS} ${CANVAS}`}
        preserveAspectRatio="none"
      >
        <title>shape path outline</title>
        {/* endpoint outline */}
        {outline ? (
          <path
            d={outline}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {/* control-handle connector lines */}
        {points
          .filter((p) => p.role === "control" || p.role === "control2")
          .map((p) => {
            const anchor = endpointByCmd.get(p.cmdIndex)
            if (anchor === undefined) return null
            return (
              <line
                key={`conn-${p.id}`}
                x1={anchor.x}
                y1={anchor.y}
                x2={p.x}
                y2={p.y}
                stroke="currentColor"
                strokeOpacity="0.3"
                strokeWidth="1"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
      </svg>

      {onChange
        ? points.map((p) => {
            const isControl = p.role === "control" || p.role === "control2"
            const kind =
              p.cmdIndex >= 0 ? (shape.commands[p.cmdIndex]?.kind ?? "") : ""
            return (
              <button
                key={p.id}
                type="button"
                aria-label={`${roleLabel(p, kind)} at ${p.x}px ${p.y}px`}
                onPointerDown={(e) => {
                  dragRef.current = { id: p.id }
                  setDragging(true)
                  if (e.currentTarget.setPointerCapture) {
                    e.currentTarget.setPointerCapture(e.pointerId)
                  }
                }}
                onKeyDown={(e) => {
                  const big = e.shiftKey ? 10 : 1
                  if (e.key === "ArrowLeft") {
                    e.preventDefault()
                    nudge(p, -big, 0)
                  } else if (e.key === "ArrowRight") {
                    e.preventDefault()
                    nudge(p, big, 0)
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault()
                    nudge(p, 0, -big)
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault()
                    nudge(p, 0, big)
                  }
                }}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 cursor-grab border-2 shadow focus:outline-none focus:ring-2 focus:ring-ring active:cursor-grabbing",
                  isControl
                    ? "h-3 w-3 rotate-45 border-amber-400 bg-amber-200"
                    : "h-3.5 w-3.5 rounded-full border-white bg-primary",
                )}
                style={{
                  left: `${(p.x / CANVAS) * 100}%`,
                  top: `${(p.y / CANVAS) * 100}%`,
                }}
              />
            )
          })
        : null}
    </div>
  )
}
