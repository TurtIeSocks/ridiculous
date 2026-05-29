import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  ClipPathEditor,
  ClipPathEditorPanel,
  GeometryBoxSelect,
  PolygonControls,
  ShapeSelect,
} from "@/components/ui/clip-path-editor/clip-path-editor"
import { cssClipPath } from "@/components/ui/clip-path-editor/clip-path-editor.types"

test("cssClipPath returns its argument unchanged at runtime", () => {
  expect(cssClipPath("circle(50%)")).toBe("circle(50%)")
})

describe("ClipPathEditorPanel — shape dispatch", () => {
  test("renders the circle controls for a circle value", () => {
    render(
      <ClipPathEditorPanel value="circle(50% at center)" onChange={() => {}} />,
    )
    const select = screen.getByLabelText("Basic shape") as HTMLSelectElement
    expect(select.value).toBe("circle")
    expect(screen.getByLabelText("circle radius")).toBeInTheDocument()
  })

  test("switching the shape reseeds and emits the new shape", () => {
    const onChange = vi.fn()
    render(<ClipPathEditorPanel value="circle(50%)" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Basic shape"), {
      target: { value: "polygon" },
    })
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^polygon\(/))
  })

  test("switching to inset emits an inset string", () => {
    const onChange = vi.fn()
    render(<ClipPathEditorPanel value="circle(50%)" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Basic shape"), {
      target: { value: "inset" },
    })
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^inset\(/))
  })

  test("editing the circle radius emits onChange with the updated value", () => {
    const onChange = vi.fn()
    render(<ClipPathEditorPanel value="circle(50%)" onChange={onChange} />)
    const input = screen.getByLabelText("circle radius")
    fireEvent.change(input, { target: { value: "30%" } })
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/circle\(30%/))
  })

  test("value='none' renders a placeholder with a shape picker", () => {
    const onChange = vi.fn()
    render(<ClipPathEditorPanel value="none" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Basic shape"), {
      target: { value: "circle" },
    })
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^circle\(/))
  })
})

describe("ClipPathEditorPanel — geometry box", () => {
  test("selecting a geometry box appends it to the value", () => {
    const onChange = vi.fn()
    render(<ClipPathEditorPanel value="circle(50%)" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Geometry box"), {
      target: { value: "border-box" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.stringMatching(/circle\(50%\) border-box/),
    )
  })
})

describe("PolygonControls — vertices", () => {
  function polyState() {
    return {
      shape: "polygon" as const,
      vertices: [
        { x: "0%", y: "0%" },
        { x: "100%", y: "0%" },
        { x: "50%", y: "100%" },
      ],
    }
  }

  test("adding a vertex grows the list", () => {
    const onChange = vi.fn()
    render(<PolygonControls state={polyState()} onChange={onChange} />)
    fireEvent.click(screen.getByRole("button", { name: /add vertex/i }))
    expect(onChange).toHaveBeenCalled()
    const next = onChange.mock.calls[0][0]
    expect(next.vertices.length).toBe(4)
  })

  test("removing a vertex shrinks the list (min 3 enforced)", () => {
    const onChange = vi.fn()
    render(
      <PolygonControls
        state={{
          shape: "polygon",
          vertices: [
            { x: "0%", y: "0%" },
            { x: "100%", y: "0%" },
            { x: "100%", y: "100%" },
            { x: "0%", y: "100%" },
          ],
        }}
        onChange={onChange}
      />,
    )
    const removes = screen.getAllByRole("button", { name: /remove vertex/i })
    fireEvent.click(removes[0])
    expect(onChange.mock.calls[0][0].vertices.length).toBe(3)
  })

  test("a 3-vertex polygon does not expose enabled remove buttons", () => {
    const onChange = vi.fn()
    render(<PolygonControls state={polyState()} onChange={onChange} />)
    const removes = screen.getAllByRole("button", { name: /remove vertex/i })
    for (const btn of removes) {
      expect(btn).toBeDisabled()
    }
  })
})

describe("ClipPathPreview — draggable vertex", () => {
  test("dragging a vertex handle writes a percentage-updated polygon", () => {
    const onChange = vi.fn()
    render(
      <ClipPathEditorPanel
        value="polygon(0% 0%, 100% 0%, 50% 100%)"
        onChange={onChange}
      />,
    )

    // Stub layout: the preview stage is a 200x200 box at the origin.
    const stage = screen.getByTestId("clip-preview-stage")
    stage.getBoundingClientRect = vi.fn(
      () =>
        ({
          left: 0,
          top: 0,
          width: 200,
          height: 200,
          right: 200,
          bottom: 200,
          x: 0,
          y: 0,
          toJSON: () => {},
        }) as DOMRect,
    )

    const handle = screen.getByLabelText(/vertex 1 at/i)
    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: 1 })
    // Move to (100px, 50px) over a 200px box → (50%, 25%).
    fireEvent.pointerMove(window, { clientX: 100, clientY: 50, pointerId: 1 })

    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last).toMatch(/^polygon\(50% 25%,/)
  })
})

describe("ClipPathEditor — popover wrapper", () => {
  test("renders a trigger button showing the value", () => {
    render(<ClipPathEditor value="circle(50%)" onChange={() => {}} />)
    expect(
      screen.getByRole("button", { name: /edit a clip-path/i }),
    ).toBeInTheDocument()
  })
})

describe("ShapeSelect / GeometryBoxSelect", () => {
  test("ShapeSelect lists every basic shape", () => {
    render(<ShapeSelect value="circle" onChange={() => {}} />)
    const select = screen.getByLabelText("Basic shape")
    for (const shape of ["inset", "circle", "ellipse", "polygon"]) {
      expect(
        (select as HTMLSelectElement).querySelector(`option[value="${shape}"]`),
      ).not.toBeNull()
    }
  })

  test("GeometryBoxSelect emits the chosen box", () => {
    const onChange = vi.fn()
    render(<GeometryBoxSelect value={undefined} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Geometry box"), {
      target: { value: "padding-box" },
    })
    expect(onChange).toHaveBeenCalledWith("padding-box")
  })
})
