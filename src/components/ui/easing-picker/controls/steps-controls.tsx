import { cn } from "@/lib/utils"
import { STEP_POSITIONS } from "../easing-picker.constants"
import type { StepPosition } from "../easing-picker.types"

export interface StepsControlsProps {
  value: { n: number; position: StepPosition }
  onChange: (v: { n: number; position: StepPosition }) => void
  minSteps?: number
  maxSteps?: number
  className?: string
}

export function StepsControls({
  value,
  onChange,
  minSteps = 1,
  maxSteps = 100,
  className,
}: StepsControlsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2 text-xs", className)}>
      <label className="flex flex-col gap-0.5">
        <span className="text-muted-foreground">Steps</span>
        <input
          type="number"
          aria-label="Steps"
          min={minSteps}
          max={maxSteps}
          step={1}
          value={value.n}
          onChange={(e) => {
            const n = Math.max(
              minSteps,
              Math.min(maxSteps, Math.floor(Number(e.target.value))),
            )
            if (Number.isFinite(n)) onChange({ ...value, n })
          }}
          className="rounded bg-muted px-2 py-1 text-foreground"
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-muted-foreground">Position</span>
        <select
          aria-label="Position"
          value={value.position}
          onChange={(e) =>
            onChange({ ...value, position: e.target.value as StepPosition })
          }
          className="rounded bg-muted px-2 py-1 text-foreground"
        >
          {STEP_POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
