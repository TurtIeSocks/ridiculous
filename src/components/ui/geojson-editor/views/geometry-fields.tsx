"use client"

import type { Position } from "@/components/ui/coordinate-input"
import { CoordinateInput } from "@/components/ui/coordinate-input"
import { cn } from "@/lib/utils"
import { useGeojsonEditorContext } from "../context"
import { GEOMETRY_TYPES } from "../geojson-editor.constants"
import { blankGeometry, getAtPath } from "../geojson-editor.helpers"
import type { GeojsonPath, Geometry, Point } from "../geojson-editor.types"

// Resolve the selected geometry path: selection may point at a feature
// (append "geometry") or directly at a geometry.
function geometryPath(
  selection: GeojsonPath | null,
  value: unknown,
): GeojsonPath | null {
  if (selection === null) {
    if (
      (value as Geometry)?.type &&
      (value as Geometry).type !== "GeometryCollection"
    )
      return []
    return null
  }
  const at = getAtPath(value, selection) as { type?: string } | undefined
  if (at?.type === "Feature") return [...selection, "geometry"]
  return selection
}

export interface GeometryFieldsProps {
  className?: string
  // When the editor's value type is narrowed (e.g. Feature<Polygon>), the
  // host passes this so the user can't switch geometry type (soundness).
  lockGeometryType?: boolean
}

export function GeometryFields({
  className,
  lockGeometryType,
}: GeometryFieldsProps) {
  const { value, selection, updateGeometry } = useGeojsonEditorContext()
  const gPath = geometryPath(selection, value)
  if (gPath === null)
    return (
      <p className="p-2 text-muted-foreground text-sm">Select a feature.</p>
    )
  const geometry = getAtPath(value, gPath) as Geometry | null
  if (!geometry)
    return <p className="p-2 text-muted-foreground text-sm">No geometry.</p>

  const onTypeChange = (next: string) =>
    updateGeometry(gPath, blankGeometry(next as Geometry["type"]))

  return (
    <div
      data-slot="geometry-fields"
      className={cn("flex flex-col gap-2 p-2", className)}
    >
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">geometry</span>
        <select
          value={geometry.type}
          disabled={lockGeometryType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="h-7 rounded-md border border-input bg-background px-2 text-xs"
        >
          {GEOMETRY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      {geometry.type === "Point" ? (
        <CoordinateInput
          value={(geometry as Point).coordinates}
          onChange={(next: Position) =>
            updateGeometry(gPath, { type: "Point", coordinates: next })
          }
          aria-label="Point coordinates"
        />
      ) : (
        // MVP: ring/part vertex grids land as a follow-up; non-Point
        // geometries fall back to the RawJsonPane in the presets.
        <p className="text-muted-foreground text-xs">
          Edit {geometry.type} coordinates in the raw pane (vertex grid is a
          follow-up).
        </p>
      )}
    </div>
  )
}
