"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ErrorRail } from "../views/error-rail"
import { FeatureTree } from "../views/feature-tree"
import { GeometryFields } from "../views/geometry-fields"
import { PropertiesGrid } from "../views/properties-grid"
import { RawJsonPane } from "../views/raw-json-pane"

export function DrillDown({
  className,
  lockGeometryType,
}: {
  className?: string
  lockGeometryType?: boolean
}) {
  const [rawOpen, setRawOpen] = React.useState(true)
  return (
    <div
      data-slot="preset-drill-down"
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-input p-2",
        className,
      )}
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setRawOpen((o) => !o)}
          className="rounded-md border border-input px-2 py-1 text-muted-foreground text-xs hover:bg-muted/50"
        >
          {rawOpen ? "Hide raw" : "Raw"}
        </button>
      </div>
      <FeatureTree />
      <GeometryFields lockGeometryType={lockGeometryType} />
      <PropertiesGrid />
      {rawOpen && <RawJsonPane />}
      <ErrorRail />
    </div>
  )
}
