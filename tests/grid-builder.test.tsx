import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  AreasEditor,
  AreasPainter,
  GridBuilder,
  GridBuilderPanel,
  GridPreview,
  TrackListEditor,
  TrackTokenRow,
} from "@/components/ui/grid-builder/grid-builder"
import {
  parseAreas,
  parseTracks,
} from "@/components/ui/grid-builder/grid-builder.helpers"
import {
  cssGridAreas,
  cssTracks,
} from "@/components/ui/grid-builder/grid-builder.types"

test("call-site helpers return their argument unchanged at runtime", () => {
  expect(cssTracks("repeat(3, 1fr)")).toBe("repeat(3, 1fr)")
  expect(cssGridAreas('"a a" "b b"')).toBe('"a a" "b b"')
})

describe("GridBuilderPanel", () => {
  test("renders the mode tab strip and starts on the given mode", () => {
    render(<GridBuilderPanel value="1fr 1fr" onChange={() => {}} mode="rows" />)
    const tablist = screen.getByRole("tablist", { name: "Grid template mode" })
    expect(tablist).toBeInTheDocument()
    const rowsTab = screen.getByRole("tab", { name: "rows" })
    expect(rowsTab).toHaveAttribute("aria-selected", "true")
  })

  test("switching to the areas tab shows the painter", () => {
    render(
      <GridBuilderPanel value='"a a" "b b"' onChange={() => {}} mode="areas" />,
    )
    // areas painter cell buttons exist
    expect(screen.getByLabelText("Cell row 1 column 1: a")).toBeInTheDocument()
  })

  test("renders a track row per top-level track in columns mode", () => {
    render(<GridBuilderPanel value="1fr 2fr auto" onChange={() => {}} />)
    const sizeInputs = screen.getAllByLabelText("track size")
    expect(sizeInputs.length).toBe(3)
  })

  test("a value resync from props is reflected without an onChange", () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <GridBuilderPanel value="1fr" onChange={onChange} />,
    )
    expect(screen.getAllByLabelText("track size").length).toBe(1)
    rerender(<GridBuilderPanel value="1fr 2fr 3fr" onChange={onChange} />)
    expect(screen.getAllByLabelText("track size").length).toBe(3)
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe("TrackListEditor", () => {
  test("adding a size track emits an extended track list", () => {
    const onChange = vi.fn()
    render(
      <TrackListEditor tokens={parseTracks("1fr") ?? []} onChange={onChange} />,
    )
    fireEvent.click(screen.getByText("+ size"))
    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0][0]
    expect(next).toHaveLength(2)
    expect(next[1]).toEqual({ kind: "size", value: "1fr" })
  })

  test("removing a track emits the shortened list", () => {
    const onChange = vi.fn()
    render(
      <TrackListEditor
        tokens={parseTracks("1fr 2fr") ?? []}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getAllByLabelText(/Remove .* track/)[0])
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0]).toHaveLength(1)
  })

  test("changing a size unit reformats the value", () => {
    const onChange = vi.fn()
    render(
      <TrackListEditor
        tokens={parseTracks("100px") ?? []}
        onChange={onChange}
      />,
    )
    const unit = screen.getByLabelText("track size unit")
    fireEvent.change(unit, { target: { value: "fr" } })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0][0]).toEqual({
      kind: "size",
      value: "100fr",
    })
  })
})

describe("AreasPainter", () => {
  test("clicking a cell cycles its area name and emits the new matrix", () => {
    const onChange = vi.fn()
    render(
      <AreasPainter
        matrix={[
          ["a", "a"],
          ["b", "b"],
        ]}
        onChange={onChange}
      />,
    )
    // palette is ["a","b","."]; clicking an "a" cell → "b"
    fireEvent.click(screen.getByLabelText("Cell row 1 column 1: a"))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0][0][0]).toBe("b")
  })
})

describe("GridPreview", () => {
  test("renders an inline display:grid node in columns mode", () => {
    const { container } = render(
      <GridPreview
        mode="columns"
        columns="1fr 1fr 1fr"
        rows="none"
        areas="none"
      />,
    )
    const node = container.querySelector<HTMLElement>("[data-grid-preview]")
    expect(node).not.toBeNull()
    expect(node?.style.display).toBe("grid")
    expect(node?.style.gridTemplateColumns).toBe("1fr 1fr 1fr")
  })

  test("renders area cells placed by gridArea in areas mode", () => {
    const { container } = render(
      <GridPreview
        mode="areas"
        columns="none"
        rows="none"
        areas='"head head" "nav main"'
      />,
    )
    const node = container.querySelector<HTMLElement>("[data-grid-preview]")
    expect(node?.style.display).toBe("grid")
    // head + nav + main = 3 placed cells
    expect(node?.children.length).toBe(3)
  })
})

describe("GridBuilder (popover trigger)", () => {
  test("renders a trigger button showing the current mode + value", () => {
    render(<GridBuilder value="1fr 1fr" onChange={() => {}} mode="columns" />)
    expect(
      screen.getByRole("button", { name: "Edit a CSS grid template" }),
    ).toBeInTheDocument()
    expect(screen.getByText("columns")).toBeInTheDocument()
  })
})

describe("TrackTokenRow — per-kind controls", () => {
  test("a keyword size uses the raw input + keyword select", () => {
    const onChange = vi.fn()
    render(
      <TrackTokenRow
        token={{ kind: "size", value: "auto" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    const kw = screen.getByLabelText("track keyword")
    expect((kw as HTMLSelectElement).value).toBe("auto")
    fireEvent.change(kw, { target: { value: "min-content" } })
    expect(onChange).toHaveBeenCalledWith({
      kind: "size",
      value: "min-content",
    })
  })

  test("an opaque calc() size edits as raw text", () => {
    const onChange = vi.fn()
    render(
      <TrackTokenRow
        token={{ kind: "size", value: "calc(100px + 2rem)" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    const input = screen.getByLabelText("track size")
    fireEvent.change(input, { target: { value: "calc(50% - 8px)" } })
    expect(onChange).toHaveBeenCalledWith({
      kind: "size",
      value: "calc(50% - 8px)",
    })
  })

  test("a function track edits its raw text and re-derives the name", () => {
    const onChange = vi.fn()
    render(
      <TrackTokenRow
        token={{ kind: "fn", name: "minmax", value: "minmax(100px, 1fr)" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    const input = screen.getByLabelText("function track")
    fireEvent.change(input, { target: { value: "fit-content(200px)" } })
    expect(onChange).toHaveBeenCalledWith({
      kind: "fn",
      name: "fit-content",
      value: "fit-content(200px)",
    })
  })

  test("a [named-line] token edits its idents", () => {
    const onChange = vi.fn()
    render(
      <TrackTokenRow
        token={{ kind: "line", names: ["start"], value: "[start]" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    const input = screen.getByLabelText("line names")
    fireEvent.change(input, { target: { value: "start main" } })
    expect(onChange).toHaveBeenCalledWith({
      kind: "line",
      names: ["start", "main"],
      value: "[start main]",
    })
  })

  test("adding a function / line track seeds defaults", () => {
    const onChange = vi.fn()
    render(<TrackListEditor tokens={[]} onChange={onChange} />)
    fireEvent.click(screen.getByText("+ function"))
    expect(onChange).toHaveBeenLastCalledWith([
      { kind: "fn", name: "minmax", value: "minmax(100px, 1fr)" },
    ])
    fireEvent.click(screen.getByText("+ [line]"))
    expect(onChange).toHaveBeenLastCalledWith([
      { kind: "line", names: ["line"], value: "[line]" },
    ])
  })
})

describe("AreasEditor — empty state + steppers", () => {
  test("empty matrix offers a start button that seeds a 2×2 grid", () => {
    const onChange = vi.fn()
    render(<AreasEditor matrix={[]} onChange={onChange} />)
    fireEvent.click(screen.getByText(/start a 2×2 grid/))
    expect(onChange).toHaveBeenCalledWith([
      ["a", "a"],
      ["b", "b"],
    ])
  })

  test("adding a row extends the matrix with dot cells", () => {
    const onChange = vi.fn()
    render(
      <AreasEditor
        matrix={[
          ["a", "a"],
          ["b", "b"],
        ]}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText("Add row"))
    const next = onChange.mock.calls[0][0]
    expect(next).toHaveLength(3)
    expect(next[2]).toEqual([".", "."])
  })

  test("adding a column extends every row; removing shrinks", () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <AreasEditor matrix={[["a", "a"]]} onChange={onChange} />,
    )
    fireEvent.click(screen.getByLabelText("Add column"))
    expect(onChange.mock.calls[0][0][0]).toEqual(["a", "a", "."])

    onChange.mockClear()
    rerender(<AreasEditor matrix={[["a", "a", "a"]]} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText("Remove column"))
    expect(onChange.mock.calls[0][0][0]).toEqual(["a", "a"])
  })
})

describe("GridBuilderPanel — areas painting commits onChange", () => {
  test("painting a cell in areas mode emits a formatted areas string", () => {
    const onChange = vi.fn()
    render(
      <GridBuilderPanel value='"a a" "b b"' onChange={onChange} mode="areas" />,
    )
    fireEvent.click(screen.getByLabelText("Cell row 1 column 1: a"))
    expect(onChange).toHaveBeenCalledTimes(1)
    // a → b cycle in row 1; matrix re-serialized
    expect(onChange.mock.calls[0][0]).toBe('"b a" "b b"')
  })
})

describe("GridPreview — rows mode", () => {
  test("renders an inline display:grid node driven by gridTemplateRows", () => {
    const { container } = render(
      <GridPreview
        mode="rows"
        columns="none"
        rows="auto 1fr 2fr"
        areas="none"
      />,
    )
    const node = container.querySelector<HTMLElement>("[data-grid-preview]")
    expect(node?.style.display).toBe("grid")
    expect(node?.style.gridTemplateRows).toBe("auto 1fr 2fr")
    // one numbered cell per non-line track
    expect(node?.children.length).toBe(3)
  })

  test("areas preview round-trips through parseAreas for placement", () => {
    const matrix = parseAreas('"head head" "nav main"')
    expect(matrix).not.toBeNull()
    const { container } = render(
      <GridPreview
        mode="areas"
        columns="none"
        rows="none"
        areas='"head head" "nav main"'
      />,
    )
    const node = container.querySelector<HTMLElement>("[data-grid-preview]")
    expect(node?.children.length).toBe(3)
  })
})
