"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { KnownUnit, UnitStringMap } from "./unit-input.types"

export interface UnitInputProps<
  TUnit extends KnownUnit | (string & {}) = KnownUnit | (string & {}),
> {
  value: TUnit extends KnownUnit ? UnitStringMap[TUnit] | (string & {}) : string
  onChange: (
    next: TUnit extends KnownUnit ? UnitStringMap[TUnit] : string,
  ) => void
  unit: TUnit
  min?: number
  max?: number
  step?: number
  precision?: number
  dragSensitivity?: number
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  disabled?: boolean
  "aria-label"?: string
  className?: string
}

function parseNumericResult(
  value: string,
  unit: string,
): { value: number; ok: boolean } {
  // Reject when the value isn't an empty-string AND doesn't end with the
  // declared unit suffix. parseFloat would otherwise silently accept e.g.
  // "45px" for unit="deg" (parses leading digits, drops trailing chars).
  if (value !== "" && unit !== "" && !value.endsWith(unit)) {
    return { value: 0, ok: false }
  }
  const stripped = value.endsWith(unit) ? value.slice(0, -unit.length) : value
  const n = Number.parseFloat(stripped)
  if (Number.isNaN(n)) return { value: 0, ok: false }
  // Final guard: the stripped portion must be entirely numeric. parseFloat
  // accepts trailing garbage; we don't.
  if (!/^-?\d+(\.\d+)?$/.test(stripped)) return { value: 0, ok: false }
  return { value: n, ok: true }
}

function clamp(n: number, min: number | undefined, max: number | undefined) {
  if (min !== undefined && n < min) return min
  if (max !== undefined && n > max) return max
  return n
}

export function UnitInput<TUnit extends KnownUnit | (string & {})>({
  value,
  onChange,
  unit,
  min,
  max,
  step: props_step = 1,
  precision = 0,
  dragSensitivity = 1,
  prefix,
  suffix,
  disabled,
  className,
  "aria-label": ariaLabel,
}: UnitInputProps<TUnit>) {
  const unitStr = String(unit)
  const warnedRef = React.useRef(false)
  const { value: parsedFromValue, ok: parseOk } = parseNumericResult(
    String(value),
    unitStr,
  )
  React.useEffect(() => {
    if (!parseOk && !warnedRef.current) {
      warnedRef.current = true
      console.warn(
        `[UnitInput] could not parse value "${String(value)}" for unit "${unitStr}". Falling back to 0.`,
      )
    }
  }, [parseOk, value, unitStr])
  const [rawDraft, setRawDraft] = React.useState<string | null>(null)
  const displayed = rawDraft ?? parsedFromValue.toFixed(precision)

  const commit = (raw: string) => {
    const parsed = Number.parseFloat(raw)
    const next = Number.isNaN(parsed)
      ? parsedFromValue
      : clamp(parsed, min, max)
    const rounded = Number(next.toFixed(precision))
    const formatted = `${rounded}${unitStr}`
    setRawDraft(null)
    if (formatted !== String(value)) {
      onChange(formatted as Parameters<typeof onChange>[0])
    }
  }

  const stepValue = (
    direction: 1 | -1,
    modifier: { shift: boolean; alt: boolean },
  ) => {
    const stepProp = props_step
    const multiplier = modifier.shift ? 10 : modifier.alt ? 0.1 : 1
    const delta = stepProp * multiplier * direction
    const base =
      rawDraft !== null
        ? Number.parseFloat(rawDraft) || parsedFromValue
        : parsedFromValue
    commit(String(base + delta))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    if (e.key === "Enter") {
      e.preventDefault()
      commit(e.currentTarget.value)
    } else if (e.key === "Escape") {
      e.preventDefault()
      setRawDraft(null)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      stepValue(1, { shift: e.shiftKey, alt: e.altKey })
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      stepValue(-1, { shift: e.shiftKey, alt: e.altKey })
    }
  }

  const scrubRef = React.useRef<{
    active: boolean
    anchor: number
    deltaPx: number
    lastShift: boolean
    lastAlt: boolean
    appliedShift: boolean
    appliedAlt: boolean
    hasCommitted: boolean
  }>({
    active: false,
    anchor: 0,
    deltaPx: 0,
    lastShift: false,
    lastAlt: false,
    appliedShift: false,
    appliedAlt: false,
    hasCommitted: false,
  })

  const rafPendingRef = React.useRef(false)

  // `commit` and the scrub-arithmetic closures over props are rebuilt every
  // render. Stash the latest scrub-step calculator in a ref so the window-
  // level listeners can stay registered with an empty dep array — otherwise
  // we'd thrash the addEventListener/removeEventListener pair on every render.
  const scrubMoveRef = React.useRef<(event: PointerEvent) => void>(() => {})
  scrubMoveRef.current = (event: PointerEvent) => {
    if (!scrubRef.current.active) return
    scrubRef.current.deltaPx += event.movementX
    scrubRef.current.lastShift = event.shiftKey
    scrubRef.current.lastAlt = event.altKey
    if (rafPendingRef.current) return
    rafPendingRef.current = true
    requestAnimationFrame(() => {
      rafPendingRef.current = false
      if (!scrubRef.current.active) return
      const prevShift = scrubRef.current.appliedShift
      const prevAlt = scrubRef.current.appliedAlt
      const newShift = scrubRef.current.lastShift
      const newAlt = scrubRef.current.lastAlt
      if (
        scrubRef.current.hasCommitted &&
        (prevShift !== newShift || prevAlt !== newAlt)
      ) {
        // Snap the anchor forward by the already-applied delta under the prior
        // modifier, then zero deltaPx so the new modifier applies only to motion
        // from this frame onwards. Prevents the retroactive-multiplier jump.
        const prevMul = prevShift ? 10 : prevAlt ? 0.1 : 1
        scrubRef.current.anchor =
          scrubRef.current.anchor +
          scrubRef.current.deltaPx * props_step * dragSensitivity * prevMul
        scrubRef.current.deltaPx = 0
      }
      scrubRef.current.appliedShift = newShift
      scrubRef.current.appliedAlt = newAlt
      scrubRef.current.hasCommitted = true
      const multiplier = newShift ? 10 : newAlt ? 0.1 : 1
      const next =
        scrubRef.current.anchor +
        scrubRef.current.deltaPx * props_step * dragSensitivity * multiplier
      commit(String(next))
    })
  }

  React.useEffect(() => {
    const onPointerMove = (event: PointerEvent) => scrubMoveRef.current(event)
    const onPointerUp = () => {
      if (!scrubRef.current.active) return
      scrubRef.current.active = false
      document.exitPointerLock()
    }
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
  }, [])

  const onSuffixPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (disabled) return
    event.preventDefault()
    scrubRef.current = {
      active: true,
      anchor: parsedFromValue,
      deltaPx: 0,
      lastShift: false,
      lastAlt: false,
      appliedShift: false,
      appliedAlt: false,
      hasCommitted: false,
    }
    event.currentTarget.requestPointerLock()
  }

  const suffixNode =
    suffix === undefined ? (
      <span
        data-slot="unit-input-suffix"
        className={cn(
          "select-none bg-muted/50 px-2 flex items-center text-xs font-mono text-muted-foreground",
          disabled ? "cursor-not-allowed" : "cursor-ew-resize",
        )}
        aria-hidden="true"
        onPointerDown={onSuffixPointerDown}
      >
        {unitStr}
      </span>
    ) : (
      <div data-slot="unit-input-suffix" onPointerDown={onSuffixPointerDown}>
        {suffix}
      </div>
    )

  return (
    <div
      data-slot="unit-input"
      className={cn(
        "inline-flex items-stretch h-7 rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
        disabled && "opacity-50",
        className,
      )}
    >
      {prefix ? (
        <div
          data-slot="unit-input-prefix"
          className="flex items-center px-2 bg-muted/50 border-r border-input"
        >
          {prefix}
        </div>
      ) : null}
      <Input
        value={displayed}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => setRawDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={onKeyDown}
        className="border-0 rounded-none bg-transparent px-2 font-mono text-xs h-full focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
      />
      <div className="w-px bg-input" aria-hidden="true" />
      {suffixNode}
    </div>
  )
}
