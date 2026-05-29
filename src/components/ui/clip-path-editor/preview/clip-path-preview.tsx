import { useEffect, useId, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { ClipMode } from "../clip-path-editor.constants"
import { formatClipPath, parseClipPath } from "../clip-path-editor.helpers"
import { useListIds } from "../clip-path-editor.hooks"
import { CircleScrubs } from "./circle-scrubs"

export interface ClipPathPreviewProps {
  value: string
  mode?: ClipMode
  onChange?: (value: string) => void
  className?: string
}

/** Round to 1 decimal place, dropping a trailing ".0". */
function pct(n: number): string {
  const clamped = Math.max(0, Math.min(100, n))
  const rounded = Math.round(clamped * 10) / 10
  return `${rounded}%`
}

export function ClipPathPreview({
  value,
  mode: modeProp = "clip-path",
  onChange,
  className,
}: ClipPathPreviewProps) {
  const id = useId()
  const [mode, setMode] = useState<ClipMode>(modeProp)
  useEffect(() => setMode(modeProp), [modeProp])

  const stageRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ index: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const state = parseClipPath(value)
  const polygon =
    state !== null && state.shape !== null && state.shape.shape === "polygon"
      ? state.shape
      : null
  // Stable keys for the drag handles. Vertex count only changes via the
  // controls (not drag/nudge), so reconciling by length is item-stable here.
  const { ids: vertexIds } = useListIds(polygon?.vertices.length ?? 0)

  const applied = value === "none" || state === null ? undefined : value
  const styleProp =
    mode === "clip-path"
      ? { clipPath: applied }
      : { shapeOutside: applied, float: "left" as const }

  // --- drag math: client coords → percentage vertex ----------------------
  const moveVertex = (clientX: number, clientY: number) => {
    const drag = dragRef.current
    const stage = stageRef.current
    if (drag === null || stage === null || polygon === null || !onChange) return
    const rect = stage.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const x = pct(((clientX - rect.left) / rect.width) * 100)
    const y = pct(((clientY - rect.top) / rect.height) * 100)
    const next = {
      ...polygon,
      vertices: polygon.vertices.map((v, i) =>
        i === drag.index ? { x, y } : v,
      ),
    }
    onChange(formatClipPath({ ...state, shape: next }))
  }

  // `moveVertex` closes over the latest value/state/polygon every render. We
  // stash it in a ref so the window listeners (attached ONCE per drag) always
  // call the freshest closure without re-subscribing on every render tick.
  const moveVertexRef = useRef(moveVertex)
  moveVertexRef.current = moveVertex

  // Subscribe to window pointer events only WHILE dragging. Gating on the
  // `dragging` state means we attach the listeners on pointer-down and tear
  // them down on pointer-up, instead of re-binding on every render.
  useEffect(() => {
    if (!dragging) return
    const onPointerMove = (e: PointerEvent) =>
      moveVertexRef.current(e.clientX, e.clientY)
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

  const nudge = (index: number, dx: number, dy: number) => {
    if (polygon === null || !onChange) return
    const v = polygon.vertices[index]
    const nx = pct(Number.parseFloat(v.x) + dx)
    const ny = pct(Number.parseFloat(v.y) + dy)
    const next = {
      ...polygon,
      vertices: polygon.vertices.map((vv, i) =>
        i === index ? { x: nx, y: ny } : vv,
      ),
    }
    onChange(formatClipPath({ ...state, shape: next }))
  }

  return (
    <div className={cn("space-y-2 rounded-lg border p-3", className)}>
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">preview</div>
        <div className="inline-flex overflow-hidden rounded-md border text-[10px]">
          {(["clip-path", "shape-outside"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "px-2 py-1 font-mono",
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={stageRef}
        data-testid="clip-preview-stage"
        className="relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-md bg-[conic-gradient(at_30%_30%,#6366f1,#ec4899,#f59e0b,#10b981,#6366f1)]"
      >
        <div
          data-clip-target
          className="absolute inset-0 bg-[linear-gradient(135deg,#0ea5e9,#8b5cf6,#ec4899)]"
          style={styleProp}
          aria-hidden="true"
        />
        {polygon !== null && onChange ? (
          <svg
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <title>polygon outline</title>
            <polygon
              points={polygon.vertices
                .map(
                  (v) => `${Number.parseFloat(v.x)},${Number.parseFloat(v.y)}`,
                )
                .join(" ")}
              fill="none"
              stroke="white"
              strokeOpacity="0.7"
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : null}
        {polygon !== null && onChange
          ? polygon.vertices.map((v, i) => (
              <button
                key={vertexIds[i]}
                type="button"
                aria-label={`Vertex ${i + 1} at ${v.x} ${v.y}`}
                onPointerDown={(e) => {
                  dragRef.current = { index: i }
                  setDragging(true)
                  if (e.currentTarget.setPointerCapture) {
                    e.currentTarget.setPointerCapture(e.pointerId)
                  }
                }}
                onKeyDown={(e) => {
                  const big = e.shiftKey ? 10 : 1
                  if (e.key === "ArrowLeft") {
                    e.preventDefault()
                    nudge(i, -big, 0)
                  } else if (e.key === "ArrowRight") {
                    e.preventDefault()
                    nudge(i, big, 0)
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault()
                    nudge(i, 0, -big)
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault()
                    nudge(i, 0, big)
                  }
                }}
                className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white bg-primary shadow focus:outline-none focus:ring-2 focus:ring-white active:cursor-grabbing"
                style={{
                  left: `${Number.parseFloat(v.x)}%`,
                  top: `${Number.parseFloat(v.y)}%`,
                }}
              />
            ))
          : null}
      </div>

      {polygon !== null && onChange ? (
        <p className="text-center text-[10px] text-muted-foreground">
          drag a handle to move a vertex · arrow keys nudge (⇧ = 10%)
        </p>
      ) : null}

      <CircleScrubs state={state} onChange={onChange} id={id} />
    </div>
  )
}
