import { act, fireEvent, render, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { GeoJSON } from "@/components/ui/geojson-editor"
import {
  ErrorRail,
  GeojsonEditorProvider,
  RawJsonPane,
  useGeojsonEditor,
} from "@/components/ui/geojson-editor"

const point: GeoJSON = { type: "Point", coordinates: [0, 0] }

describe("useGeojsonEditor", () => {
  it("exposes the value and a formatted rawText", () => {
    const { result } = renderHook(() =>
      useGeojsonEditor({ value: point, onChange: () => {} }),
    )
    expect(result.current.value).toEqual(point)
    expect(JSON.parse(result.current.rawText)).toEqual(point)
    expect(result.current.isValid).toBe(true)
  })

  it("commits valid rawText to value via onChange", () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useGeojsonEditor({ value: point, onChange }),
    )
    act(() => result.current.setRawText('{"type":"Point","coordinates":[3,4]}'))
    expect(onChange).toHaveBeenCalledWith({
      type: "Point",
      coordinates: [3, 4],
    })
  })

  it("keeps invalid rawText, surfaces errors, leaves value last-valid", () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useGeojsonEditor({ value: point, onChange }),
    )
    act(() => result.current.setRawText("{ broken "))
    expect(onChange).not.toHaveBeenCalled()
    expect(result.current.rawText).toBe("{ broken ")
    expect(result.current.isValid).toBe(false)
    expect(result.current.value).toEqual(point) // last-valid
  })

  it("undo/redo step the value history", () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useGeojsonEditor({ defaultValue: point, onChange }),
    )
    act(() => result.current.setValue({ type: "Point", coordinates: [9, 9] }))
    expect(result.current.canUndo).toBe(true)
    act(() => result.current.undo())
    expect(result.current.value).toEqual(point)
  })
})

describe("ErrorRail", () => {
  it("lists errors and selects the node on click", () => {
    const onSelectionChange = vi.fn()
    const bad: GeoJSON = { type: "Point", coordinates: [200, 0] }
    const { getByText } = render(
      <GeojsonEditorProvider
        value={bad}
        onChange={() => {}}
        onSelectionChange={onSelectionChange}
      >
        <ErrorRail />
      </GeojsonEditorProvider>,
    )
    const item = getByText(/between -180 and 180/i)
    item.click()
    expect(onSelectionChange).toHaveBeenCalled()
  })
})

describe("RawJsonPane", () => {
  it("shows the formatted value and commits valid edits", () => {
    const onChange = vi.fn()
    const { container } = render(
      <GeojsonEditorProvider value={point} onChange={onChange}>
        <RawJsonPane />
      </GeojsonEditorProvider>,
    )
    const ta = container.querySelector("textarea") as HTMLTextAreaElement
    expect(JSON.parse(ta.value)).toEqual(point)
    fireEvent.change(ta, {
      target: { value: '{"type":"Point","coordinates":[5,6]}' },
    })
    expect(onChange).toHaveBeenCalledWith({
      type: "Point",
      coordinates: [5, 6],
    })
  })

  it("keeps invalid text in the textarea without emitting", () => {
    const onChange = vi.fn()
    const { container } = render(
      <GeojsonEditorProvider value={point} onChange={onChange}>
        <RawJsonPane />
      </GeojsonEditorProvider>,
    )
    const ta = container.querySelector("textarea") as HTMLTextAreaElement
    fireEvent.change(ta, { target: { value: "{ oops" } })
    expect(ta.value).toBe("{ oops")
    expect(onChange).not.toHaveBeenCalled()
  })
})
