import * as React from "react"
import type {
  GeoJSON,
  GeojsonError,
  GeojsonPath,
  Geometry,
  Json,
} from "./geojson-editor.types"

export interface GeojsonEditorStore {
  value: GeoJSON
  rawText: string
  selection: GeojsonPath | null
  errors: GeojsonError[]
  isValid: boolean
  setValue(next: GeoJSON): void
  setRawText(next: string): void
  select(path: GeojsonPath | null): void
  updateGeometry(path: GeojsonPath, geometry: Geometry): void
  addFeature(feature?: GeoJSON): void
  removeFeature(index: number): void
  setProperty(featurePath: GeojsonPath, key: string, value: Json): void
  undo(): void
  redo(): void
  canUndo: boolean
  canRedo: boolean
}

export const GeojsonEditorContext =
  React.createContext<GeojsonEditorStore | null>(null)

export function useGeojsonEditorContext(): GeojsonEditorStore {
  const ctx = React.useContext(GeojsonEditorContext)
  if (!ctx)
    throw new Error(
      "useGeojsonEditorContext must be used inside <GeojsonEditorProvider>.",
    )
  return ctx
}
