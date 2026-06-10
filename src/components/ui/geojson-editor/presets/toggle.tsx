"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ErrorRail } from "../views/error-rail"
import { FeatureTree } from "../views/feature-tree"
import { GeometryFields } from "../views/geometry-fields"
import { PropertiesGrid } from "../views/properties-grid"
import { RawJsonPane } from "../views/raw-json-pane"

export function Toggle({
  className,
  lockGeometryType,
}: {
  className?: string
  lockGeometryType?: boolean
}) {
  const [mode, setMode] = React.useState<"guided" | "raw">("guided")
  return (
    <div
      data-slot="preset-toggle"
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-input p-2",
        className,
      )}
    >
      <div className="inline-flex self-start overflow-hidden rounded-md border border-input text-xs">
        {(["guided", "raw"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "px-3 py-1 capitalize",
              mode === m ? "bg-muted" : "text-muted-foreground",
            )}
          >
            {m === "guided" ? "Guided" : "Raw"}
          </button>
        ))}
      </div>
      {mode === "guided" ? (
        <>
          <FeatureTree />
          <GeometryFields lockGeometryType={lockGeometryType} />
          <PropertiesGrid />
        </>
      ) : (
        <RawJsonPane />
      )}
      <ErrorRail />
    </div>
  )
}
