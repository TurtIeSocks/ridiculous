"use client"

import { useEffect, useRef, useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { AlphaStrip } from "./alpha-strip"
import {
  formatColor,
  formatHex,
  parseColor,
  parseHex,
  srgbToOklch,
} from "./color-picker.helpers"
import type {
  ColorMode,
  ColorString,
  ColorStringMap,
  Oklch,
} from "./color-picker.types"
import { HueStrip } from "./hue-strip"
import { LcPad } from "./lc-pad"
import { ModeButtonGroup } from "./mode-button-group"
import { PresetPalette } from "./preset-palette"

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
  const [internal, setInternal] = useState<Oklch>(
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
          "relative inline-block h-5 w-5 shrink-0 cursor-pointer rounded border outline-hidden focus-within:ring-2 focus-within:ring-ring",
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

  const emit = (next: Oklch, mode: ColorMode = activeMode) => {
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
