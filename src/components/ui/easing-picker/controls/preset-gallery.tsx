import { cn } from "@/lib/utils"
import {
  bezierFromPreset,
  PRESETS,
  type PresetEntry,
} from "../easing-picker.helpers"
import type { CubicBezierString, PresetName } from "../easing-picker.types"

export interface PresetGalleryProps {
  value?: PresetName
  onChange: (preset: PresetName, bezier: CubicBezierString) => void
  className?: string
}

export function PresetGallery({
  value,
  onChange,
  className,
}: PresetGalleryProps) {
  const keywords = PRESETS.filter(
    (p) => !p.family && p.name !== "anticipate" && p.name !== "smoothStep",
  )
  const polynomials = PRESETS.filter((p) => p.family)
  const specials = PRESETS.filter(
    (p) => p.name === "anticipate" || p.name === "smoothStep",
  )

  return (
    <div className={cn("space-y-3", className)}>
      <PresetRow
        label="Keywords"
        presets={keywords}
        value={value}
        onChange={onChange}
      />
      <PresetGrid presets={polynomials} value={value} onChange={onChange} />
      <PresetRow
        label="Special"
        presets={specials}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

function PresetThumb({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
}) {
  const path = `M 0 32 C ${x1 * 48} ${(1 - y1) * 32}, ${x2 * 48} ${(1 - y2) * 32}, 48 0`
  return (
    <svg viewBox="0 0 48 32" className="size-full" aria-hidden="true">
      <title>Preset curve thumbnail</title>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function PresetRow({
  label,
  presets,
  value,
  onChange,
}: {
  label: string
  presets: readonly PresetEntry[]
  value?: PresetName
  onChange: (preset: PresetName, bezier: CubicBezierString) => void
}) {
  return (
    <div>
      <div className="mb-1 text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <PresetCard
            key={p.name}
            preset={p}
            active={value === p.name}
            onClick={() => onChange(p.name, bezierFromPreset(p.name))}
            iconOnly
          />
        ))}
      </div>
    </div>
  )
}

function PresetGrid({
  presets,
  value,
  onChange,
}: {
  presets: readonly PresetEntry[]
  value?: PresetName
  onChange: (preset: PresetName, bezier: CubicBezierString) => void
}) {
  return (
    <div className="grid grid-cols-10 gap-1">
      {presets.map((p) => (
        <PresetCard
          key={p.name}
          preset={p}
          active={value === p.name}
          onClick={() => onChange(p.name, bezierFromPreset(p.name))}
          iconOnly
        />
      ))}
    </div>
  )
}

function PresetCard({
  preset,
  active,
  onClick,
  iconOnly = false,
}: {
  preset: PresetEntry
  active: boolean
  onClick: () => void
  iconOnly?: boolean
}) {
  const [x1, y1, x2, y2] = preset.bezier
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded border transition-colors",
        iconOnly ? "p-0.5" : "p-1.5 text-xs",
        active
          ? "border-accent-foreground/20 bg-accent"
          : "border-transparent bg-transparent hover:bg-accent/50",
      )}
      title={preset.name}
      aria-label={preset.name}
    >
      <div
        className={cn("text-muted-foreground", iconOnly ? "size-6" : "size-10")}
      >
        <PresetThumb x1={x1} y1={y1} x2={x2} y2={y2} />
      </div>
      {!iconOnly && (
        <span className="w-full truncate text-center text-[10px]">
          {preset.name}
        </span>
      )}
    </button>
  )
}
