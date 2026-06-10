"use client"

import type * as React from "react"
import { GeojsonEditorContext } from "./context"
import type { GeoJSON, GeojsonPath } from "./geojson-editor.types"
import { DrillDown } from "./presets/drill-down"
import { DualPane } from "./presets/dual-pane"
import { Toggle } from "./presets/toggle"
import { useGeojsonEditor } from "./use-geojson-editor"

export interface GeojsonEditorProviderProps<V extends GeoJSON = GeoJSON> {
  value?: V
  defaultValue?: V
  onChange?: (value: V) => void
  selection?: GeojsonPath
  onSelectionChange?: (path: GeojsonPath | null) => void
  children: React.ReactNode
}

export function GeojsonEditorProvider<V extends GeoJSON = GeoJSON>({
  children,
  ...options
}: GeojsonEditorProviderProps<V>) {
  const store = useGeojsonEditor<V>(options)
  return (
    <GeojsonEditorContext.Provider value={store}>
      {children}
    </GeojsonEditorContext.Provider>
  )
}

export type GeojsonEditorVariant = "drill-down" | "dual-pane" | "toggle"

export interface GeojsonEditorProps<V extends GeoJSON = GeoJSON> {
  value: V
  onChange: (value: V) => void
  variant?: GeojsonEditorVariant
  selection?: GeojsonPath
  onSelectionChange?: (path: GeojsonPath | null) => void
  lockGeometryType?: boolean
  className?: string
}

export function GeojsonEditor<V extends GeoJSON = GeoJSON>({
  value,
  onChange,
  variant = "drill-down",
  selection,
  onSelectionChange,
  lockGeometryType,
  className,
}: GeojsonEditorProps<V>) {
  const Preset =
    variant === "dual-pane"
      ? DualPane
      : variant === "toggle"
        ? Toggle
        : DrillDown
  return (
    <GeojsonEditorProvider
      value={value}
      onChange={onChange}
      selection={selection}
      onSelectionChange={onSelectionChange}
    >
      <Preset className={className} lockGeometryType={lockGeometryType} />
    </GeojsonEditorProvider>
  )
}
