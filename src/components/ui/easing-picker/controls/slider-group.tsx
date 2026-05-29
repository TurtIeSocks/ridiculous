import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Slider — single labelled range input
// ---------------------------------------------------------------------------

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-0.5 text-xs">
      <span className="flex justify-between text-muted-foreground">
        <span>{label}</span>
        <span>{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

// ---------------------------------------------------------------------------
// SliderGroup — data-driven stack of sliders bound to a record value.
//
// Collapses the three near-identical physics control panels
// (spring / bounce / wiggle): each differs only in its field list.
// ---------------------------------------------------------------------------

export interface SliderField<TKey extends string> {
  key: TKey
  label: string
  min: number
  max: number
  step: number
}

export interface SliderGroupProps<TKey extends string> {
  value: Record<TKey, number>
  fields: ReadonlyArray<SliderField<TKey>>
  onChange: (value: Record<TKey, number>) => void
  className?: string
}

export function SliderGroup<TKey extends string>({
  value,
  fields,
  onChange,
  className,
}: SliderGroupProps<TKey>) {
  return (
    <div className={cn("space-y-2", className)}>
      {fields.map((f) => (
        <Slider
          key={f.key}
          label={f.label}
          value={value[f.key]}
          min={f.min}
          max={f.max}
          step={f.step}
          onChange={(v) => onChange({ ...value, [f.key]: v })}
        />
      ))}
    </div>
  )
}
