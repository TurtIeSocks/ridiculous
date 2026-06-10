import * as React from "react"
import type { GeojsonEditorStore } from "./context"
import {
  blankFeature,
  formatGeojson,
  parseGeojson,
  setAtPath,
  validateGeojson,
} from "./geojson-editor.helpers"
import type {
  GeoJSON,
  GeojsonPath,
  Geometry,
  Json,
} from "./geojson-editor.types"

interface UseGeojsonEditorOptions<V extends GeoJSON = GeoJSON> {
  value?: V
  defaultValue?: V
  onChange?: (value: V) => void
  selection?: GeojsonPath
  onSelectionChange?: (path: GeojsonPath | null) => void
}

const HISTORY_CAP = 100

export function useGeojsonEditor<V extends GeoJSON = GeoJSON>(
  options: UseGeojsonEditorOptions<V>,
): GeojsonEditorStore {
  const isControlled = options.value !== undefined
  const [internal, setInternal] = React.useState<GeoJSON>(
    options.value ?? options.defaultValue ?? blankFeature(),
  )
  const value = (options.value ?? internal) as GeoJSON

  // Raw buffer: owns its own string while the user edits it.
  const [rawDraft, setRawDraft] = React.useState<string | null>(null)
  const rawText = rawDraft ?? formatGeojson(value)
  const errors = React.useMemo(
    () =>
      rawDraft !== null
        ? parseGeojson(rawDraft).errors
        : validateGeojson(value),
    [rawDraft, value],
  )
  const isValid = !errors.some((e) => e.severity === "error")

  // Selection (controlled or internal).
  const [selInternal, setSelInternal] = React.useState<GeojsonPath | null>(
    options.selection ?? null,
  )
  const selection = options.selection ?? selInternal

  // Undo/redo stacks of committed values.
  const past = React.useRef<GeoJSON[]>([])
  const future = React.useRef<GeoJSON[]>([])
  const [, forceRender] = React.useReducer((n: number) => n + 1, 0)

  const commitValue = React.useCallback(
    (next: GeoJSON, pushHistory = true) => {
      if (pushHistory) {
        past.current = [...past.current, value].slice(-HISTORY_CAP)
        future.current = []
      }
      setRawDraft(null)
      if (!isControlled) setInternal(next)
      options.onChange?.(next as V)
    },
    [isControlled, options, value],
  )

  const setValue = React.useCallback(
    (next: GeoJSON) => commitValue(next),
    [commitValue],
  )

  const setRawText = React.useCallback(
    (next: string) => {
      setRawDraft(next)
      const parsed = parseGeojson(next)
      if (parsed.value !== null) {
        past.current = [...past.current, value].slice(-HISTORY_CAP)
        future.current = []
        if (!isControlled) setInternal(parsed.value)
        options.onChange?.(parsed.value as V)
        setRawDraft(null) // commit clears the draft; projection re-derives
      }
    },
    [isControlled, options, value],
  )

  const select = React.useCallback(
    (path: GeojsonPath | null) => {
      setSelInternal(path)
      options.onSelectionChange?.(path)
    },
    [options],
  )

  const updateGeometry = React.useCallback(
    (path: GeojsonPath, geometry: Geometry) =>
      commitValue(setAtPath(value, path, geometry)),
    [commitValue, value],
  )

  const addFeature = React.useCallback(
    (feature?: GeoJSON) => {
      if (value.type !== "FeatureCollection") return
      const next = setAtPath(
        value,
        ["features"],
        [...value.features, feature ?? blankFeature()],
      )
      commitValue(next as GeoJSON)
    },
    [commitValue, value],
  )

  const removeFeature = React.useCallback(
    (index: number) => {
      if (value.type !== "FeatureCollection") return
      const next = setAtPath(
        value,
        ["features"],
        value.features.filter((_, i) => i !== index),
      )
      commitValue(next as GeoJSON)
    },
    [commitValue, value],
  )

  const setProperty = React.useCallback(
    (featurePath: GeojsonPath, key: string, propValue: Json) =>
      commitValue(
        setAtPath(value, [...featurePath, "properties", key], propValue),
      ),
    [commitValue, value],
  )

  const undo = React.useCallback(() => {
    const prev = past.current[past.current.length - 1]
    if (prev === undefined) return
    past.current = past.current.slice(0, -1)
    future.current = [value, ...future.current]
    setRawDraft(null)
    if (!isControlled) setInternal(prev)
    options.onChange?.(prev as V)
    forceRender()
  }, [isControlled, options, value])

  const redo = React.useCallback(() => {
    const next = future.current[0]
    if (next === undefined) return
    future.current = future.current.slice(1)
    past.current = [...past.current, value]
    setRawDraft(null)
    if (!isControlled) setInternal(next)
    options.onChange?.(next as V)
    forceRender()
  }, [isControlled, options, value])

  return {
    value,
    rawText,
    selection,
    errors,
    isValid,
    setValue,
    setRawText,
    select,
    updateGeometry,
    addFeature,
    removeFeature,
    setProperty,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  }
}
