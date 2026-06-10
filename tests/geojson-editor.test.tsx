import { act, fireEvent, render, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { GeoJSON } from "@/components/ui/geojson-editor"
import {
  ErrorRail,
  FeatureTree,
  GeojsonEditor,
  GeojsonEditorProvider,
  GeometryFields,
  PropertiesGrid,
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

const fc: GeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { name: "A" },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 0],
          ],
        ],
      },
      properties: null,
    },
  ],
}

describe("FeatureTree", () => {
  it("renders a row per feature and selects on click", () => {
    const onSelectionChange = vi.fn()
    const { getAllByRole } = render(
      <GeojsonEditorProvider
        value={fc}
        onChange={() => {}}
        onSelectionChange={onSelectionChange}
      >
        <FeatureTree />
      </GeojsonEditorProvider>,
    )
    const rows = getAllByRole("button").filter((b) =>
      b.textContent?.includes("Feature"),
    )
    expect(rows.length).toBeGreaterThanOrEqual(2)
    rows[0].click()
    expect(onSelectionChange).toHaveBeenCalledWith(["features", 0])
  })

  it("matches selection segment-wise, not by string prefix (10 vs 1)", () => {
    const bigFc: GeoJSON = {
      type: "FeatureCollection",
      features: Array.from({ length: 11 }, () => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [0, 0] as [number, number],
        },
        properties: null,
      })),
    }
    const rowsFor = (selection: [string, number]) => {
      // Scope queries to this render's own container — two renders share the
      // jsdom document, so a global getAllByRole would see both trees.
      const { container } = render(
        <GeojsonEditorProvider
          value={bigFc}
          selection={selection}
          onChange={() => {}}
        >
          <FeatureTree />
        </GeojsonEditorProvider>,
      )
      return Array.from(container.querySelectorAll("button")).filter((b) =>
        b.textContent?.includes("Feature"),
      )
    }
    // Old string startsWith: selecting "features.10" makes "features.1" match.
    // classList membership is exact (hover:bg-muted/50 is a different token).
    const sel10 = rowsFor(["features", 10])
    expect(sel10[10].classList.contains("bg-muted")).toBe(true)
    expect(sel10[1].classList.contains("bg-muted")).toBe(false)
    // And the reverse: selecting feature 1 must not light up feature 10.
    const sel1 = rowsFor(["features", 1])
    expect(sel1[1].classList.contains("bg-muted")).toBe(true)
    expect(sel1[10].classList.contains("bg-muted")).toBe(false)
  })

  it("adds a feature via the add button", () => {
    const onChange = vi.fn()
    const { getByText } = render(
      <GeojsonEditorProvider value={fc} onChange={onChange}>
        <FeatureTree />
      </GeojsonEditorProvider>,
    )
    getByText(/add feature/i).click()
    expect(onChange).toHaveBeenCalled()
    const next = onChange.mock.calls[0][0] as typeof fc
    expect(next.type === "FeatureCollection" && next.features).toHaveLength(3)
  })
})

describe("GeometryFields", () => {
  it("edits a selected Point's coordinate", () => {
    const onChange = vi.fn()
    const sel: GeoJSON = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: null,
    }
    const { container } = render(
      <GeojsonEditorProvider
        value={sel}
        selection={["geometry"]}
        onChange={onChange}
      >
        <GeometryFields />
      </GeojsonEditorProvider>,
    )
    const lon = container.querySelectorAll("input")[0] as HTMLInputElement
    fireEvent.change(lon, { target: { value: "12" } })
    fireEvent.blur(lon)
    expect(onChange).toHaveBeenCalled()
    const next = onChange.mock.calls[0][0] as typeof sel
    expect(
      next.type === "Feature" &&
        next.geometry?.type === "Point" &&
        next.geometry.coordinates[0],
    ).toBe(12)
  })

  it("disables the geometry-type select when lockGeometryType is set", () => {
    const sel: GeoJSON = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: null,
    }
    const { container } = render(
      <GeojsonEditorProvider
        value={sel}
        selection={["geometry"]}
        onChange={() => {}}
      >
        <GeometryFields lockGeometryType />
      </GeojsonEditorProvider>,
    )
    expect(
      (container.querySelector("select") as HTMLSelectElement)?.disabled,
    ).toBe(true)
  })

  it("treats a bare Feature with no selection as the geometry itself", () => {
    const bare: GeoJSON = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: null,
    }
    const { container } = render(
      <GeojsonEditorProvider value={bare} onChange={() => {}}>
        <GeometryFields />
      </GeojsonEditorProvider>,
    )
    // The Point's CoordinateInput renders (lon/lat inputs), not a feature hint.
    expect(container.querySelectorAll("input").length).toBeGreaterThan(0)
    expect(container.textContent).not.toContain("Select a feature.")
    // The geometry-type select reflects "Point", not "Feature".
    expect((container.querySelector("select") as HTMLSelectElement).value).toBe(
      "Point",
    )
  })

  it("shows the 'Select a feature.' hint for a FeatureCollection with no selection", () => {
    const { container } = render(
      <GeojsonEditorProvider value={fc} onChange={() => {}}>
        <GeometryFields />
      </GeojsonEditorProvider>,
    )
    expect(container.textContent).toContain("Select a feature.")
    expect(container.querySelector("select")).toBeNull()
  })
})

describe("PropertiesGrid", () => {
  it("renders existing properties and edits a value", () => {
    const onChange = vi.fn()
    const sel: GeoJSON = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { name: "Park" },
    }
    const { container } = render(
      <GeojsonEditorProvider value={sel} selection={[]} onChange={onChange}>
        <PropertiesGrid />
      </GeojsonEditorProvider>,
    )
    const valueInput = container.querySelectorAll(
      "input",
    )[1] as HTMLInputElement
    fireEvent.change(valueInput, { target: { value: "Plaza" } })
    fireEvent.blur(valueInput)
    expect(onChange).toHaveBeenCalled()
  })
})

describe("GeojsonEditor presets", () => {
  it("renders the drill-down preset with the raw pane summoned on demand", () => {
    const { container, getByText } = render(
      <GeojsonEditor value={fc} onChange={() => {}} />,
    )
    expect(container.querySelector('[data-slot="feature-tree"]')).toBeTruthy()
    // §6.3: raw pane is hidden by default, summoned on demand.
    expect(container.querySelector('[data-slot="raw-json-pane"]')).toBeNull()
    fireEvent.click(getByText(/raw/i))
    expect(container.querySelector('[data-slot="raw-json-pane"]')).toBeTruthy()
  })

  it("renders the dual-pane preset", () => {
    const { container } = render(
      <GeojsonEditor value={fc} variant="dual-pane" onChange={() => {}} />,
    )
    expect(container.querySelector('[data-slot="raw-json-pane"]')).toBeTruthy()
  })

  it("toggle preset switches between guided and raw", () => {
    const { getByText, container } = render(
      <GeojsonEditor value={fc} variant="toggle" onChange={() => {}} />,
    )
    fireEvent.click(getByText("Raw"))
    expect(container.querySelector('[data-slot="raw-json-pane"]')).toBeTruthy()
  })
})
