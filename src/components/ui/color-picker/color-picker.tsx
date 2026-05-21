"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  clamp01,
  formatColor,
  formatHex,
  oklchToSrgb,
  parseColor,
  parseHex,
  srgbToOklch,
} from "./color-picker.helpers"
import type {
  ColorMode,
  ColorString,
  ColorStringMap,
} from "./color-picker.types"

const COLOR_MODES = [
  "oklch",
  "oklab",
  "hex",
  "rgb",
  "hsl",
  "hwb",
] as const satisfies readonly ColorMode[]

export interface ColorPickerProps<
  TMode extends ColorMode | undefined = undefined,
> {
  value: ColorString | (string & {})
  onChange: (
    value: TMode extends ColorMode ? ColorStringMap[TMode] : ColorString,
  ) => void
  mode?: TMode
  native?: boolean
  className?: string
  "aria-label"?: string
}

export function ColorPicker<TMode extends ColorMode | undefined>({
  value,
  onChange,
  mode: modeProp,
  native = false,
  className,
  "aria-label": ariaLabel = "Pick a color",
}: ColorPickerProps<TMode>) {
  const parsedFromValue = parseColor(value)

  // Internal canonical oklch is the source of truth for the L×C pad / sliders.
  // We do NOT derive marker position from each re-parse of `value`, because
  // round-tripping through sRGB-bound modes (hex/rgb/hsl/hwb) gamut-clamps the
  // oklch — the marker would refuse to follow the cursor into out-of-sRGB area.
  // Instead: track internal oklch + the user's mode selection, and only resync
  // from `value` when it changes from outside (not from our own emit).
  const [internal, setInternal] = useState(
    () => parsedFromValue?.oklch ?? { l: 0, c: 0, h: 0, a: 1 },
  )
  const [internalMode, setInternalMode] = useState<ColorMode>(
    () => modeProp ?? parsedFromValue?.mode ?? "oklch",
  )
  const lastEmittedRef = useRef<string | null>(null)
  const [hasEyeDropper, setHasEyeDropper] = useState(false)

  useEffect(() => {
    if (value === lastEmittedRef.current) return
    const parsed = parseColor(value)
    if (parsed) {
      setInternal(parsed.oklch)
      if (modeProp == null) setInternalMode(parsed.mode)
    }
  }, [value, modeProp])

  useEffect(() => {
    setHasEyeDropper(typeof window !== "undefined" && "EyeDropper" in window)
  }, [])

  if (native) {
    const hex = parsedFromValue
      ? formatHex(parsedFromValue.oklch, false)
      : "#000000"
    return (
      <span
        className={cn(
          "relative inline-block h-5 w-5 shrink-0 rounded border cursor-pointer outline-hidden focus-within:ring-2 focus-within:ring-ring",
          className,
        )}
        style={{ backgroundColor: value }}
      >
        <input
          type="color"
          value={hex}
          onChange={(event) => {
            const next = parseHex(event.target.value)
            if (!next) return
            const oklch = srgbToOklch(next.r, next.g, next.b, next.a)
            const formatted = formatColor(oklch, modeProp ?? "hex")
            lastEmittedRef.current = formatted
            onChange(formatted as Parameters<typeof onChange>[0])
          }}
          aria-label={ariaLabel}
          data-slot="color-picker-native"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </span>
    )
  }

  if (!parsedFromValue) {
    return (
      <span
        aria-hidden="true"
        className={cn("inline-block h-5 w-5 rounded border", className)}
        style={{ backgroundColor: value }}
        data-slot="color-picker-fallback"
      />
    )
  }

  const activeMode: ColorMode = modeProp ?? internalMode
  const showModeGroup = modeProp == null

  const emit = (
    next: { l: number; c: number; h: number; a: number },
    mode: ColorMode = activeMode,
  ) => {
    setInternal(next)
    if (modeProp == null && mode !== internalMode) setInternalMode(mode)
    const formatted = formatColor(next, mode)
    lastEmittedRef.current = formatted
    onChange(formatted as Parameters<typeof onChange>[0])
  }

  const handleEyeDropper = async () => {
    if (typeof window === "undefined") return
    const EyeDropper = (
      window as unknown as {
        EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> }
      }
    ).EyeDropper
    if (!EyeDropper) return
    try {
      const result = await new EyeDropper().open()
      const parsed = parseHex(result.sRGBHex)
      if (parsed) {
        emit(srgbToOklch(parsed.r, parsed.g, parsed.b, 1))
      }
    } catch {
      // user cancelled — ignore
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "shrink-0 cursor-pointer rounded outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          data-slot="color-picker-trigger"
        >
          <span
            aria-hidden="true"
            className="block h-5 w-5 rounded border"
            style={{ backgroundColor: value }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-fit min-w-65 p-3"
        align="start"
        data-slot="color-picker"
      >
        <div className="flex flex-col gap-3">
          {showModeGroup && (
            <ModeButtonGroup
              mode={activeMode}
              onChange={(next) => emit(internal, next)}
            />
          )}
          <div className="flex items-center gap-1.5">
            {hasEyeDropper && (
              <button
                type="button"
                onClick={handleEyeDropper}
                aria-label="Pick color from screen"
                data-slot="color-picker-eyedropper"
                className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border bg-muted/40 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3"
                  aria-hidden="true"
                >
                  <path d="m11.5 1.5 3 3-2 2-3-3z" />
                  <path d="m9.5 3.5-7 7v3h3l7-7" />
                </svg>
              </button>
            )}
            <PresetPalette onPick={emit} />
          </div>
          <LcPad
            l={internal.l}
            c={internal.c}
            h={internal.h}
            onChange={(l, c) => emit({ ...internal, l, c })}
          />
          <HueStrip h={internal.h} onChange={(h) => emit({ ...internal, h })} />
          <AlphaStrip
            a={internal.a}
            l={internal.l}
            c={internal.c}
            h={internal.h}
            onChange={(a) => emit({ ...internal, a })}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const PAD_WIDTH = 240
const PAD_HEIGHT = 160
const CHROMA_MAX = 0.4

function LcPad({
  l,
  c,
  h,
  onChange,
}: {
  l: number
  c: number
  h: number
  onChange: (l: number, c: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const image = ctx.createImageData(PAD_WIDTH, PAD_HEIGHT)
    for (let y = 0; y < PAD_HEIGHT; y++) {
      const lAtRow = 1 - y / (PAD_HEIGHT - 1)
      for (let x = 0; x < PAD_WIDTH; x++) {
        const cAtCol = (x / (PAD_WIDTH - 1)) * CHROMA_MAX
        const [r, g, b] = oklchToSrgb(lAtRow, cAtCol, h)
        const i = (y * PAD_WIDTH + x) * 4
        image.data[i] = r * 255
        image.data[i + 1] = g * 255
        image.data[i + 2] = b * 255
        image.data[i + 3] = 255
      }
    }
    ctx.putImageData(image, 0, 0)
  }, [h])

  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const nx = clamp01((event.clientX - rect.left) / rect.width)
    const ny = clamp01((event.clientY - rect.top) / rect.height)
    onChange(1 - ny, nx * CHROMA_MAX)
  }

  const markerX = (c / CHROMA_MAX) * 100
  const markerY = (1 - l) * 100

  return (
    <div
      data-slot="color-picker-pad"
      role="application"
      aria-label="Lightness and chroma"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: 2D pad needs to be keyboard-focusable for arrow-key nudge
      tabIndex={0}
      className="relative w-full touch-none cursor-crosshair rounded border overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ height: PAD_HEIGHT }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        handlePointer(event)
      }}
      onPointerMove={(event) => {
        if (event.buttons) handlePointer(event)
      }}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 0.05 : 0.01
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          onChange(l, Math.max(0, c - step * CHROMA_MAX))
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          onChange(l, Math.min(CHROMA_MAX, c + step * CHROMA_MAX))
        } else if (event.key === "ArrowUp") {
          event.preventDefault()
          onChange(Math.min(1, l + step), c)
        } else if (event.key === "ArrowDown") {
          event.preventDefault()
          onChange(Math.max(0, l - step), c)
        }
      }}
    >
      <canvas
        ref={canvasRef}
        width={PAD_WIDTH}
        height={PAD_HEIGHT}
        className="block h-full w-full"
      />
      <div
        aria-hidden="true"
        className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/40 pointer-events-none"
        style={{ left: `${markerX}%`, top: `${markerY}%` }}
      />
    </div>
  )
}

const HUE_GRADIENT = `linear-gradient(to right, oklch(0.7 0.18 0), oklch(0.7 0.18 60), oklch(0.7 0.18 120), oklch(0.7 0.18 180), oklch(0.7 0.18 240), oklch(0.7 0.18 300), oklch(0.7 0.18 360))`

function HueStrip({
  h,
  onChange,
}: {
  h: number
  onChange: (h: number) => void
}) {
  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    onChange(clamp01((event.clientX - rect.left) / rect.width) * 360)
  }

  return (
    <div
      data-slot="color-picker-hue"
      role="slider"
      aria-label="Hue"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(h)}
      tabIndex={0}
      className="relative h-4 w-full touch-none cursor-pointer rounded-[3px]"
      style={{ background: HUE_GRADIENT }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        handlePointer(event)
      }}
      onPointerMove={(event) => {
        if (event.buttons) handlePointer(event)
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") onChange(Math.max(0, h - 1))
        if (event.key === "ArrowRight") onChange(Math.min(360, h + 1))
      }}
    >
      <div
        aria-hidden="true"
        className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border border-black/40 shadow pointer-events-none"
        style={{ left: `${(h / 360) * 100}%` }}
      />
    </div>
  )
}

const CHECKER_BG = `conic-gradient(#bbb 25%, #fff 0 50%, #bbb 0 75%, #fff 0) 0 0 / 10px 10px`

function AlphaStrip({
  a,
  l,
  c,
  h,
  onChange,
}: {
  a: number
  l: number
  c: number
  h: number
  onChange: (next: number) => void
}) {
  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    onChange(clamp01((event.clientX - rect.left) / rect.width))
  }

  const color = `oklch(${l} ${c} ${h})`
  const background = `linear-gradient(to right, transparent, ${color}), ${CHECKER_BG}`

  return (
    <div
      data-slot="color-picker-alpha"
      role="slider"
      aria-label="Alpha"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(a * 100)}
      tabIndex={0}
      className="relative h-4 w-full touch-none cursor-pointer rounded-[3px]"
      style={{ background }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        handlePointer(event)
      }}
      onPointerMove={(event) => {
        if (event.buttons) handlePointer(event)
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") onChange(clamp01(a - 0.01))
        if (event.key === "ArrowRight") onChange(clamp01(a + 0.01))
      }}
    >
      <div
        aria-hidden="true"
        className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border border-black/40 shadow pointer-events-none"
        style={{ left: `${a * 100}%` }}
      />
    </div>
  )
}

function ModeButtonGroup({
  mode,
  onChange,
}: {
  mode: ColorMode
  onChange: (next: ColorMode) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Color format"
      className="flex gap-1 w-full justify-evenly items-center"
      data-slot="color-picker-modes"
    >
      {COLOR_MODES.map((m) => (
        <Button
          key={m}
          type="button"
          role="tab"
          aria-selected={m === mode}
          size="sm"
          variant={m === mode ? "secondary" : "ghost"}
          onClick={() => onChange(m)}
          className="h-7 px-2 font-mono text-xs"
        >
          {m}
        </Button>
      ))}
    </div>
  )
}

const PRESETS: ReadonlyArray<{
  l: number
  c: number
  h: number
  name: string
}> = [
  { l: 0.637, c: 0.237, h: 25.331, name: "red" },
  { l: 0.705, c: 0.213, h: 47.604, name: "orange" },
  { l: 0.769, c: 0.188, h: 70.08, name: "amber" },
  { l: 0.768, c: 0.233, h: 130.85, name: "lime" },
  { l: 0.696, c: 0.17, h: 162.48, name: "emerald" },
  { l: 0.715, c: 0.143, h: 215.221, name: "cyan" },
  { l: 0.623, c: 0.214, h: 259.815, name: "blue" },
  { l: 0.606, c: 0.25, h: 292.717, name: "violet" },
  { l: 0.667, c: 0.295, h: 322.15, name: "fuchsia" },
  { l: 0.656, c: 0.241, h: 354.308, name: "pink" },
]

function PresetPalette({
  onPick,
}: {
  onPick: (next: { l: number; c: number; h: number; a: number }) => void
}) {
  return (
    <div
      data-slot="color-picker-presets"
      className="flex flex-1 items-center w-full justify-evenly gap-1.5"
    >
      {PRESETS.map((p) => (
        <button
          key={p.name}
          type="button"
          aria-label={`preset ${p.name}`}
          onClick={() => onPick({ l: p.l, c: p.c, h: p.h, a: 1 })}
          className="h-5 w-5 shrink-0 cursor-pointer rounded border transition hover:scale-110"
          style={{ backgroundColor: `oklch(${p.l} ${p.c} ${p.h})` }}
        />
      ))}
    </div>
  )
}
