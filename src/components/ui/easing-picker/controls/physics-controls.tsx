import { type SliderField, SliderGroup } from "./slider-group"

// Public physics-control panels. Each is a thin wrapper over the
// data-driven <SliderGroup>: they differ only in their field lists.

// ---------------------------------------------------------------------------
// SpringControls
// ---------------------------------------------------------------------------

export interface SpringControlsProps {
  value: { stiffness: number; damping: number; mass: number }
  onChange: (v: SpringControlsProps["value"]) => void
  className?: string
}

const SPRING_FIELDS: ReadonlyArray<
  SliderField<keyof SpringControlsProps["value"]>
> = [
  { key: "stiffness", label: "Stiffness", min: 1, max: 500, step: 1 },
  { key: "damping", label: "Damping", min: 1, max: 100, step: 1 },
  { key: "mass", label: "Mass", min: 0.5, max: 5, step: 0.1 },
]

export function SpringControls({
  value,
  onChange,
  className,
}: SpringControlsProps) {
  return (
    <SliderGroup
      value={value}
      fields={SPRING_FIELDS}
      onChange={onChange}
      className={className}
    />
  )
}

// ---------------------------------------------------------------------------
// BounceControls
// ---------------------------------------------------------------------------

export interface BounceControlsProps {
  value: { bounces: number; stiffness: number }
  onChange: (v: BounceControlsProps["value"]) => void
  className?: string
}

const BOUNCE_FIELDS: ReadonlyArray<
  SliderField<keyof BounceControlsProps["value"]>
> = [
  { key: "bounces", label: "Bounces", min: 1, max: 6, step: 1 },
  { key: "stiffness", label: "Stiffness", min: 0, max: 1, step: 0.01 },
]

export function BounceControls({
  value,
  onChange,
  className,
}: BounceControlsProps) {
  return (
    <SliderGroup
      value={value}
      fields={BOUNCE_FIELDS}
      onChange={onChange}
      className={className}
    />
  )
}

// ---------------------------------------------------------------------------
// WiggleControls
// ---------------------------------------------------------------------------

export interface WiggleControlsProps {
  value: { wiggles: number; damping: number }
  onChange: (v: WiggleControlsProps["value"]) => void
  className?: string
}

const WIGGLE_FIELDS: ReadonlyArray<
  SliderField<keyof WiggleControlsProps["value"]>
> = [
  { key: "wiggles", label: "Wiggles", min: 1, max: 10, step: 1 },
  { key: "damping", label: "Damping", min: 1, max: 30, step: 0.5 },
]

export function WiggleControls({
  value,
  onChange,
  className,
}: WiggleControlsProps) {
  return (
    <SliderGroup
      value={value}
      fields={WIGGLE_FIELDS}
      onChange={onChange}
      className={className}
    />
  )
}
