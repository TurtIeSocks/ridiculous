"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { clampLat, clampLon } from "./coordinate-input.helpers"
import type { Position } from "./coordinate-input.types"

type AxisKind = "lon" | "lat" | "alt"

const AXIS_LABEL: Record<AxisKind, string> = {
  lon: "lon",
  lat: "lat",
  alt: "alt",
}

const AXIS_CLAMP: Record<AxisKind, (n: number) => number> = {
  lon: clampLon,
  lat: clampLat,
  alt: (n) => n,
}

const AXIS_RANGE: Record<AxisKind, [number, number] | null> = {
  lon: [-180, 180],
  lat: [-90, 90],
  alt: null,
}

export interface CoordinateInputProps {
  value: Position
  onChange: (next: Position) => void
  axes?: "2d" | "3d"
  precision?: number
  disabled?: boolean
  className?: string
  "aria-label"?: string
}

interface AxisFieldProps {
  kind: AxisKind
  value: number
  precision: number
  disabled?: boolean
  onCommit: (next: number) => void
}

function AxisField({
  kind,
  value,
  precision,
  disabled,
  onCommit,
}: AxisFieldProps) {
  const [draft, setDraft] = React.useState<string | null>(null)
  const displayed =
    draft ??
    (Number.isInteger(value)
      ? String(value)
      : Number(value.toFixed(precision)).toString())
  const range = AXIS_RANGE[kind]
  const rawNumber = Number.parseFloat(displayed)
  const outOfRange =
    range !== null &&
    !Number.isNaN(rawNumber) &&
    (rawNumber < range[0] || rawNumber > range[1])

  const commit = (raw: string) => {
    const parsed = Number.parseFloat(raw)
    setDraft(null)
    if (Number.isNaN(parsed)) return
    const clamped = AXIS_CLAMP[kind](parsed)
    if (clamped !== value) onCommit(clamped)
  }

  const scrubRef = React.useRef({ active: false, anchor: 0, deltaPx: 0 })

  React.useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!scrubRef.current.active) return
      scrubRef.current.deltaPx += event.movementX
      const multiplier = event.shiftKey ? 10 : event.altKey ? 0.1 : 1
      const next =
        scrubRef.current.anchor + scrubRef.current.deltaPx * multiplier
      const clamped = AXIS_CLAMP[kind](next)
      onCommit(clamped)
    }
    const onUp = () => {
      if (!scrubRef.current.active) return
      scrubRef.current.active = false
      document.exitPointerLock()
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [kind, onCommit])

  const onLabelPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (disabled) return
    event.preventDefault()
    scrubRef.current = { active: true, anchor: value, deltaPx: 0 }
    event.currentTarget.requestPointerLock()
  }

  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: Input is a child of this label element
    <label className="inline-flex h-7 items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
      <span
        data-slot="coordinate-axis-label"
        onPointerDown={onLabelPointerDown}
        className={cn(
          "flex cursor-ew-resize select-none items-center border-input border-r bg-muted/50 px-2 font-mono text-xs",
          outOfRange ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {AXIS_LABEL[kind]}
      </span>
      <Input
        value={displayed}
        disabled={disabled}
        aria-label={AXIS_LABEL[kind]}
        aria-invalid={outOfRange || undefined}
        inputMode="decimal"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commit(e.currentTarget.value)
          } else if (e.key === "Escape") {
            e.preventDefault()
            setDraft(null)
          }
        }}
        className="h-full w-20 rounded-none border-0 bg-transparent px-2 font-mono text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </label>
  )
}

export function CoordinateInput({
  value,
  onChange,
  axes = "2d",
  precision = 6,
  disabled,
  className,
  "aria-label": ariaLabel,
}: CoordinateInputProps) {
  const show3d = axes === "3d" || value.length === 3
  const kinds: AxisKind[] = show3d ? ["lon", "lat", "alt"] : ["lon", "lat"]

  const commitAxis = (index: number, next: number) => {
    const base: number[] = [value[0], value[1], value[2] ?? 0]
    base[index] = next
    const out: Position = show3d
      ? [base[0], base[1], base[2]]
      : [base[0], base[1]]
    onChange(out)
  }

  return (
    <fieldset
      data-slot="coordinate-input"
      aria-label={ariaLabel}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      {kinds.map((kind, i) => (
        <AxisField
          key={kind}
          kind={kind}
          value={value[i] ?? 0}
          precision={precision}
          disabled={disabled}
          onCommit={(next) => commitAxis(i, next)}
        />
      ))}
    </fieldset>
  )
}
