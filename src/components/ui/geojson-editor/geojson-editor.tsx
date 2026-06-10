"use client"

import type * as React from "react"
import { GeojsonEditorContext } from "./context"
import type { GeoJSON, GeojsonPath } from "./geojson-editor.types"
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
