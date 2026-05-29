import { cn } from "@/lib/utils"
import { SHAPES } from "../clip-path-editor.constants"
import type { BasicShapeName } from "../clip-path-editor.types"

export interface ShapeSelectProps {
  value: BasicShapeName | undefined
  onChange: (value: BasicShapeName | "none") => void
  className?: string
}

export function ShapeSelect({ value, onChange, className }: ShapeSelectProps) {
  return (
    <select
      aria-label="Basic shape"
      value={value ?? "none"}
      onChange={(e) => onChange(e.target.value as BasicShapeName | "none")}
      className={cn(
        "h-8 rounded border bg-background px-1.5 font-mono text-xs",
        className,
      )}
    >
      <option value="none">none / box only</option>
      {SHAPES.map((shape) => (
        <option key={shape} value={shape}>
          {shape}()
        </option>
      ))}
    </select>
  )
}
