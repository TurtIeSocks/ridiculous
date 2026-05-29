"use client"

import { useId, useRef, useState } from "react"
import {
  ClipPathEditorPanel,
  type ClipPathString,
  parseClipPath,
} from "@/components/ui/clip-path-editor"
import { ExampleCard } from "@/examples/_shared/example-card"

const PRESETS: ReadonlyArray<{ label: string; value: ClipPathString }> = [
  { label: "triangle", value: "polygon(50% 0%, 0% 100%, 100% 100%)" },
  {
    label: "diamond",
    value: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  },
  {
    label: "chevron",
    value: "polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%, 0% 0%)",
  },
  {
    label: "star",
    value:
      "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
  },
]

/** Round to one decimal, clamped to 0–100. */
function pct(n: number): string {
  const c = Math.max(0, Math.min(100, n))
  return `${Math.round(c * 10) / 10}%`
}

export function PolygonPlayground() {
  const id = useId()
  const [value, setValue] = useState<ClipPathString>(
    "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
  )
  const stageRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<number | null>(null)

  const state = parseClipPath(value)
  const polygon =
    state !== null && state.shape !== null && state.shape.shape === "polygon"
      ? state.shape
      : null

  const move = (clientX: number, clientY: number) => {
    const stage = stageRef.current
    const idx = dragRef.current
    if (stage === null || idx === null || polygon === null) return
    const rect = stage.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const x = pct(((clientX - rect.left) / rect.width) * 100)
    const y = pct(((clientY - rect.top) / rect.height) * 100)
    const next = polygon.vertices
      .map((v, i) => (i === idx ? `${x} ${y}` : `${v.x} ${v.y}`))
      .join(", ")
    setValue(`polygon(${next})` as ClipPathString)
  }

  return (
    <ExampleCard
      className="md:p-8"
      eyebrow="polygon-playground"
      title="Drag the vertices"
      description={
        <>
          The handles convert pointer position to{" "}
          <strong>percentage vertices</strong> and write the{" "}
          <code className="font-mono text-foreground">polygon()</code> string
          live — the namesake demo. The same value drives both the masked image
          and the editor panel below.
        </>
      }
    >
      <div className="mt-6 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setValue(p.value)}
            className="rounded-md border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-muted-foreground text-xs hover:bg-black/50"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div
          ref={stageRef}
          className="relative mx-auto aspect-square w-full max-w-[360px] select-none overflow-hidden rounded-xl"
        >
          <div
            className="absolute inset-0 bg-[conic-gradient(from_45deg,#0ea5e9,#8b5cf6,#ec4899,#f59e0b,#10b981,#0ea5e9)]"
            style={{ clipPath: value }}
            aria-hidden="true"
          />
          {polygon !== null ? (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <title>polygon outline</title>
              <polygon
                points={polygon.vertices
                  .map(
                    (v) =>
                      `${Number.parseFloat(v.x)},${Number.parseFloat(v.y)}`,
                  )
                  .join(" ")}
                fill="none"
                stroke="white"
                strokeOpacity="0.8"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="2 2"
              />
            </svg>
          ) : null}
          {polygon?.vertices.map((v, i) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: handles are positional
              key={i}
              type="button"
              aria-label={`Vertex ${i + 1} at ${v.x} ${v.y}`}
              onPointerDown={(e) => {
                dragRef.current = i
                if (e.currentTarget.setPointerCapture) {
                  e.currentTarget.setPointerCapture(e.pointerId)
                }
              }}
              onPointerMove={(e) => {
                if (dragRef.current === i) move(e.clientX, e.clientY)
              }}
              onPointerUp={() => {
                dragRef.current = null
              }}
              className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white bg-fuchsia-500 shadow-lg transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-white active:cursor-grabbing"
              style={{
                left: `${Number.parseFloat(v.x)}%`,
                top: `${Number.parseFloat(v.y)}%`,
              }}
            />
          ))}
        </div>

        <div className="space-y-3">
          <ClipPathEditorPanel
            value={value}
            onChange={setValue}
            className="w-full"
          />
        </div>
      </div>

      <code
        id={`${id}-out`}
        className="mt-4 block overflow-x-auto rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-xs"
      >
        {value}
      </code>
    </ExampleCard>
  )
}
