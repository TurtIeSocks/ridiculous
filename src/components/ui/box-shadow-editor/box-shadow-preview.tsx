"use client"

import { useEffect, useId, useRef, useState } from "react"
import { UnitInput } from "@/components/ui/unit-input"
import { cn } from "@/lib/utils"
import {
  DEFAULT_SHADOW_COLOR,
  formatBoxShadow,
  parseBoxShadow,
} from "./box-shadow-editor.helpers"
import type { ShadowLayer } from "./box-shadow-editor.types"

// ---------------------------------------------------------------------------
// BoxShadowPreview (public) — the showcase, with a draggable light source
// ---------------------------------------------------------------------------

export interface BoxShadowPreviewProps {
  value: string
  onChange?: (value: string) => void
  className?: string
}

// The "light" is a point in the stage; the shadow is cast OPPOSITE to it.
// We map the light's offset from center to a per-layer offset, scaled so a
// stack reads as one coherent light. Magnitude scales gently with each
// layer's blur (deeper/softer layers cast a longer shadow).
const LIGHT_GAIN = 24 // px of shadow offset at the stage edge

/** Pull the dominant blur (px) from the first layer, defaulting to 8. */
function dominantBlur(layers: ShadowLayer[]): number {
  for (const layer of layers) {
    if (layer.blur) {
      const n = Number.parseFloat(layer.blur)
      if (!Number.isNaN(n)) return n
    }
  }
  return 8
}

/**
 * Re-cast every layer's offset from a light vector in [-1, 1] (x,y from the
 * stage center). Shadow is opposite the light. Blur / spread / color / inset
 * are preserved.
 */
function castFromLight(
  layers: ShadowLayer[],
  lx: number,
  ly: number,
): ShadowLayer[] {
  return layers.map((layer, i) => {
    const depth = 1 + i * 0.6 // stacked layers fan out a touch
    const ox = Math.round(-lx * LIGHT_GAIN * depth)
    const oy = Math.round(-ly * LIGHT_GAIN * depth)
    return { ...layer, offsetX: `${ox}px`, offsetY: `${oy}px` }
  })
}

/** Scale blur (and a touch of y-offset) across all layers — "elevation". */
function applyElevation(layers: ShadowLayer[], blurPx: number): ShadowLayer[] {
  if (layers.length === 0) {
    return [
      {
        inset: false,
        offsetX: "0px",
        offsetY: `${Math.round(blurPx / 2)}px`,
        blur: `${blurPx}px`,
        color: DEFAULT_SHADOW_COLOR,
      },
    ]
  }
  return layers.map((layer, i) => ({
    ...layer,
    blur: `${Math.round(blurPx * (1 + i * 0.5))}px`,
  }))
}

export function BoxShadowPreview({
  value,
  onChange,
  className,
}: BoxShadowPreviewProps) {
  const id = useId()
  const stageRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const layers = parseBoxShadow(value) ?? []
  const applied = value === "none" ? undefined : value
  const blurPx = dominantBlur(layers)

  // Light position in [0,1] across the stage, derived from the cast offset of
  // the first layer so the dot tracks the shadow. Default: top-left.
  const first = layers[0]
  const lightFromState = (() => {
    if (!first) return { x: 0.3, y: 0.3 }
    const ox = Number.parseFloat(first.offsetX) || 0
    const oy = Number.parseFloat(first.offsetY) || 0
    // invert the cast: light = -offset / gain, mapped back to [0,1]
    const lx = clamp01(0.5 - ox / (LIGHT_GAIN * 2))
    const ly = clamp01(0.5 - oy / (LIGHT_GAIN * 2))
    return { x: lx, y: ly }
  })()

  const moveLight = (clientX: number, clientY: number) => {
    const stage = stageRef.current
    if (stage === null || !onChange) return
    const rect = stage.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const px = clamp01((clientX - rect.left) / rect.width)
    const py = clamp01((clientY - rect.top) / rect.height)
    // light vector from center in [-1, 1]
    const lx = (px - 0.5) * 2
    const ly = (py - 0.5) * 2
    onChange(formatBoxShadow(castFromLight(layers, lx, ly)))
  }

  // Keep the latest moveLight in a ref so the window listeners — attached ONCE
  // per drag (not per render / per drag tick) — always read current state.
  const moveLightRef = useRef(moveLight)
  moveLightRef.current = moveLight

  // Subscribe to window pointer events only WHILE dragging. Gating on the
  // `dragging` state means we attach on drag-start and detach on drag-end,
  // instead of re-subscribing on every render (incl. each drag tick).
  useEffect(() => {
    if (!dragging) return
    const onPointerMove = (e: PointerEvent) => {
      moveLightRef.current(e.clientX, e.clientY)
    }
    const onPointerUp = () => setDragging(false)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
  }, [dragging])

  const nudgeLight = (dx: number, dy: number) => {
    if (!onChange) return
    const lx = clamp(lightFromState.x * 2 - 1 + dx, -1, 1)
    const ly = clamp(lightFromState.y * 2 - 1 + dy, -1, 1)
    onChange(formatBoxShadow(castFromLight(layers, lx, ly)))
  }

  const xPct = Math.round(lightFromState.x * 100)
  const yPct = Math.round(lightFromState.y * 100)

  return (
    <div className={cn("space-y-3 rounded-lg border p-3", className)}>
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">preview</div>
        <div className="text-[10px] text-muted-foreground">drag the light</div>
      </div>

      <div
        ref={stageRef}
        data-testid="box-shadow-stage"
        className="relative flex h-44 items-center justify-center overflow-hidden rounded-md bg-[radial-gradient(circle_at_50%_40%,#1e293b,#0f172a)]"
      >
        <div
          data-shadow-target
          className="h-20 w-28 rounded-xl bg-white"
          style={{ boxShadow: applied }}
          aria-hidden="true"
        />
        {onChange ? (
          // A 2-D positional control: a single-axis `slider` can only carry
          // ONE `aria-valuenow`, so it can't honestly describe both x and y.
          // Instead this is an `application` region the user drives with the
          // pointer or arrow keys, with BOTH dimensions folded into its
          // accessible name; `aria-roledescription` names the widget pattern.
          // It stays a <button> so it is natively focusable + operable (no
          // manual tabIndex, no keyboard a11y gaps). `aria-valuetext` /
          // `aria-valuenow` are deliberately omitted: they are range-widget
          // props the `application` role does not support — the live 2-axis
          // readout lives in the accessible name instead.
          // biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: a draggable 2-D handle has no native role; `application` is the documented pattern, and a <button> keeps it focusable/operable
          <button
            type="button"
            role="application"
            aria-roledescription="2D light position"
            aria-label={`Light source position: x ${xPct}%, y ${yPct}%`}
            onPointerDown={(e) => {
              setDragging(true)
              if (e.currentTarget.setPointerCapture) {
                e.currentTarget.setPointerCapture(e.pointerId)
              }
              moveLight(e.clientX, e.clientY)
            }}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 0.2 : 0.06
              if (e.key === "ArrowLeft") {
                e.preventDefault()
                nudgeLight(-step, 0)
              } else if (e.key === "ArrowRight") {
                e.preventDefault()
                nudgeLight(step, 0)
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                nudgeLight(0, -step)
              } else if (e.key === "ArrowDown") {
                e.preventDefault()
                nudgeLight(0, step)
              }
            }}
            className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-yellow-300 bg-yellow-200 shadow-[0_0_12px_4px_rgba(253,224,71,0.7)] active:cursor-grabbing"
            style={{
              left: `${lightFromState.x * 100}%`,
              top: `${lightFromState.y * 100}%`,
            }}
          >
            <span className="sr-only">light source</span>
          </button>
        ) : null}
      </div>

      {onChange ? (
        <label
          htmlFor={`${id}-elevation`}
          className="flex items-center gap-2 text-xs"
        >
          <span className="w-20 font-mono text-muted-foreground">
            elevation
          </span>
          <UnitInput
            unit="px"
            value={`${blurPx}px`}
            min={0}
            max={80}
            aria-label="Elevation (blur) in px"
            className="h-7 w-20"
            onChange={(next) => {
              const n = Number.parseFloat(next)
              onChange(
                formatBoxShadow(
                  applyElevation(layers, Number.isNaN(n) ? 0 : n),
                ),
              )
            }}
          />
        </label>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// small numeric helpers
// ---------------------------------------------------------------------------

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function clamp01(n: number): number {
  return clamp(n, 0, 1)
}
