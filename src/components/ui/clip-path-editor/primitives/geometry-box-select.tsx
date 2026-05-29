import { cn } from "@/lib/utils"
import { GEOMETRY_BOXES } from "../clip-path-editor.constants"
import type { GeometryBox } from "../clip-path-editor.types"

export interface GeometryBoxSelectProps {
  value: GeometryBox | undefined
  onChange: (value: GeometryBox | undefined) => void
  className?: string
}

export function GeometryBoxSelect({
  value,
  onChange,
  className,
}: GeometryBoxSelectProps) {
  return (
    <select
      aria-label="Geometry box"
      value={value ?? ""}
      onChange={(e) =>
        onChange(
          e.target.value === "" ? undefined : (e.target.value as GeometryBox),
        )
      }
      className={cn(
        "h-8 rounded border bg-background px-1.5 font-mono text-xs",
        className,
      )}
    >
      <option value="">no box</option>
      {GEOMETRY_BOXES.map((box) => (
        <option key={box} value={box}>
          {box}
        </option>
      ))}
    </select>
  )
}
