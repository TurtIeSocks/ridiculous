"use client"

import { cn } from "@/lib/utils"
import { ErrorRail } from "../views/error-rail"
import { FeatureTree } from "../views/feature-tree"
import { GeometryFields } from "../views/geometry-fields"
import { PropertiesGrid } from "../views/properties-grid"
import { RawJsonPane } from "../views/raw-json-pane"

export function DualPane({
  className,
  lockGeometryType,
}: {
  className?: string
  lockGeometryType?: boolean
}) {
  return (
    <div
      data-slot="preset-dual-pane"
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-input p-2",
        className,
      )}
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          <FeatureTree />
          <GeometryFields lockGeometryType={lockGeometryType} />
          <PropertiesGrid />
        </div>
        <RawJsonPane />
      </div>
      <ErrorRail />
    </div>
  )
}
