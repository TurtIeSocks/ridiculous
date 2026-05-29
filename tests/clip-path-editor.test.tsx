import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import {
  CircleControls,
  ClipPathEditor,
  ClipPathEditorPanel,
  ClipPathPreview,
  EllipseControls,
  GeometryBoxSelect,
  InsetControls,
  LengthPctEditor,
  PolygonControls,
  ShapeSelect,
} from "@/components/ui/clip-path-editor/clip-path-editor"
import { cssClipPath } from "@/components/ui/clip-path-editor/clip-path-editor.types"

/** Stub a 200x200 origin rect onto an element for drag-math tests. */
function stubRect(el: HTMLElement) {
  el.getBoundingClientRect = vi.fn(
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
}

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

  test("clearing the geometry box emits undefined", () => {
    const onChange = vi.fn()
    render(<GeometryBoxSelect value="border-box" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Geometry box"), {
      target: { value: "" },
    })
    expect(onChange).toHaveBeenCalledWith(undefined)
  })
})

describe("ClipPathEditorPanel — box position + bare box", () => {
  test("a trailing box exposes a position toggle that flips to leading", () => {
    const onChange = vi.fn()
    render(
      <ClipPathEditorPanel
        value="circle(50%) border-box"
        onChange={onChange}
      />,
    )
    const pos = screen.getByLabelText("Box position") as HTMLSelectElement
    expect(pos.value).toBe("trailing")
    fireEvent.change(pos, { target: { value: "leading" } })
    expect(onChange).toHaveBeenCalledWith("border-box circle(50%)")
  })

  test("clearing the shape back to none renders the placeholder", () => {
    const onChange = vi.fn()
    render(<ClipPathEditorPanel value="circle(50%)" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Basic shape"), {
      target: { value: "none" },
    })
    expect(onChange).toHaveBeenCalledWith("none")
  })

  test("a bare geometry box shows the box-only hint", () => {
    render(<ClipPathEditorPanel value="border-box" onChange={() => {}} />)
    expect(screen.getByText(/bare geometry box/i)).toBeInTheDocument()
  })

  test("adding a box to a shape then selecting it", () => {
    const onChange = vi.fn()
    render(<ClipPathEditorPanel value="border-box" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("Basic shape"), {
      target: { value: "ellipse" },
    })
    // box is preserved, shape seeded
    expect(onChange).toHaveBeenCalledWith(
      expect.stringMatching(/ellipse\(.*\) border-box|border-box ellipse/),
    )
  })
})

describe("InsetControls", () => {
  const base = { shape: "inset" as const, top: "10%" }

  test("editing the top value emits an updated state", () => {
    const onChange = vi.fn()
    render(<InsetControls state={base} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("inset top"), {
      target: { value: "25" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ shape: "inset", top: "25%" }),
    )
  })

  test("editing right/bottom/left fills the optional sides", () => {
    const onChange = vi.fn()
    render(<InsetControls state={base} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("inset right"), {
      target: { value: "5" },
    })
    expect(onChange.mock.calls[0][0].right).toBe("5%")
  })

  test("adding then removing the round radius", () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <InsetControls state={base} onChange={onChange} />,
    )
    fireEvent.click(screen.getByRole("button", { name: /add round/i }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ round: "8px" }),
    )
    rerender(
      <InsetControls state={{ ...base, round: "8px" }} onChange={onChange} />,
    )
    fireEvent.change(screen.getByLabelText("inset round radius"), {
      target: { value: "12px" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ round: "12px" }),
    )
    fireEvent.click(screen.getByRole("button", { name: /remove round/i }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ round: undefined }),
    )
  })
})

describe("CircleControls / EllipseControls", () => {
  test("toggling the circle radius to a keyword and back", () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <CircleControls
        state={{ shape: "circle", radius: "50%" }}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText("circle radius toggle keyword"))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ radius: "closest-side" }),
    )
    rerender(
      <CircleControls
        state={{ shape: "circle", radius: "closest-side" }}
        onChange={onChange}
      />,
    )
    // the keyword select is now shown
    expect(screen.getByLabelText("circle radius")).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("circle radius"), {
      target: { value: "farthest-side" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ radius: "farthest-side" }),
    )
  })

  test("adding then removing a circle position", () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <CircleControls
        state={{ shape: "circle", radius: "50%" }}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: /add position/i }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ atX: "50%", atY: "50%" }),
    )
    rerender(
      <CircleControls
        state={{ shape: "circle", radius: "50%", atX: "50%", atY: "50%" }}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText("position x"), {
      target: { value: "20" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ atX: "20%" }),
    )
    fireEvent.click(screen.getByRole("button", { name: /remove position/i }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ atX: undefined, atY: undefined }),
    )
  })

  test("editing both ellipse radii", () => {
    const onChange = vi.fn()
    render(
      <EllipseControls
        state={{ shape: "ellipse", rx: "50%", ry: "35%" }}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText("ellipse radius x"), {
      target: { value: "60" },
    })
    expect(onChange.mock.calls[0][0].rx).toBe("60%")
    fireEvent.change(screen.getByLabelText("ellipse radius y"), {
      target: { value: "40" },
    })
    expect(onChange.mock.calls[1][0].ry).toBe("40%")
  })
})

describe("PolygonControls — fill-rule + vertex edit", () => {
  const tri = {
    shape: "polygon" as const,
    vertices: [
      { x: "0%", y: "0%" },
      { x: "100%", y: "0%" },
      { x: "50%", y: "100%" },
    ],
  }

  test("selecting a fill-rule sets it; clearing removes it", () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <PolygonControls state={tri} onChange={onChange} />,
    )
    fireEvent.change(screen.getByLabelText("Fill rule"), {
      target: { value: "evenodd" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ fillRule: "evenodd" }),
    )
    rerender(
      <PolygonControls
        state={{ ...tri, fillRule: "evenodd" }}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText("Fill rule"), {
      target: { value: "" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ fillRule: undefined }),
    )
  })

  test("editing a vertex coordinate", () => {
    const onChange = vi.fn()
    render(<PolygonControls state={tri} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("vertex 1 x"), {
      target: { value: "10" },
    })
    expect(onChange.mock.calls[0][0].vertices[0].x).toBe("10%")
  })
})

describe("LengthPctEditor", () => {
  test("opaque calc()/var() renders raw text", () => {
    const onChange = vi.fn()
    render(
      <LengthPctEditor
        label="opaque"
        value="calc(50% + 10px)"
        onChange={onChange}
      />,
    )
    const input = screen.getByLabelText("opaque")
    expect((input as HTMLInputElement).value).toBe("calc(50% + 10px)")
    fireEvent.change(input, { target: { value: "var(--x)" } })
    expect(onChange).toHaveBeenCalledWith("var(--x)")
  })

  test("changing the unit re-emits with the new suffix", () => {
    const onChange = vi.fn()
    render(<LengthPctEditor label="lp" value="10%" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("lp unit"), {
      target: { value: "px" },
    })
    expect(onChange).toHaveBeenCalledWith("10px")
  })
})

describe("ClipPathPreview", () => {
  test("toggling to shape-outside flips the preview mode", () => {
    render(<ClipPathPreview value="circle(40%)" onChange={() => {}} />)
    const btn = screen.getByRole("button", { name: "shape-outside" })
    fireEvent.click(btn)
    expect(btn).toHaveAttribute("aria-pressed", "true")
  })

  test("circle % radius exposes a scrub that emits onChange", () => {
    const onChange = vi.fn()
    render(<ClipPathPreview value="circle(50%)" onChange={onChange} />)
    const scrub = screen.getByLabelText("circle radius scrub")
    fireEvent.change(scrub, { target: { value: "30" } })
    fireEvent.blur(scrub, { target: { value: "30" } })
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/circle\(30%/))
  })

  test("ellipse % radii expose two scrubs", () => {
    const onChange = vi.fn()
    render(<ClipPathPreview value="ellipse(50% 35%)" onChange={onChange} />)
    expect(screen.getByLabelText("ellipse radius x scrub")).toBeInTheDocument()
    expect(screen.getByLabelText("ellipse radius y scrub")).toBeInTheDocument()
  })

  test("a vertex handle nudges with arrow keys", () => {
    const onChange = vi.fn()
    render(
      <ClipPathPreview
        value="polygon(0% 0%, 100% 0%, 50% 100%)"
        onChange={onChange}
      />,
    )
    const handle = screen.getByLabelText(/vertex 2 at/i)
    fireEvent.keyDown(handle, { key: "ArrowRight" })
    // vertex 2 starts at 100% x → clamps at 100; nudge right stays 100, but
    // ArrowLeft moves it down. Use ArrowDown on the y axis to see a change.
    fireEvent.keyDown(handle, { key: "ArrowDown" })
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last).toMatch(/^polygon\(/)
  })

  test("shift+arrow nudges by 10", () => {
    const onChange = vi.fn()
    render(
      <ClipPathPreview
        value="polygon(50% 50%, 100% 0%, 50% 100%)"
        onChange={onChange}
      />,
    )
    const handle = screen.getByLabelText(/vertex 1 at/i)
    fireEvent.keyDown(handle, { key: "ArrowLeft", shiftKey: true })
    expect(onChange).toHaveBeenCalledWith(
      expect.stringMatching(/^polygon\(40% 50%,/),
    )
    fireEvent.keyDown(handle, { key: "ArrowUp", shiftKey: true })
  })

  test("pointer drag uses the stage rect to compute a percentage", () => {
    const onChange = vi.fn()
    render(
      <ClipPathPreview
        value="polygon(0% 0%, 100% 0%, 50% 100%)"
        onChange={onChange}
      />,
    )
    const stage = screen.getByTestId("clip-preview-stage")
    stubRect(stage)
    const handle = screen.getByLabelText(/vertex 3 at/i)
    fireEvent.pointerDown(handle, { clientX: 100, clientY: 200, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 50, clientY: 100, pointerId: 1 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last).toMatch(/25% 50%\)$/)
  })

  test("renders without onChange (read-only, no handles)", () => {
    render(<ClipPathPreview value="polygon(0% 0%, 100% 0%, 50% 100%)" />)
    expect(screen.getByTestId("clip-preview-stage")).toBeInTheDocument()
    expect(screen.queryByLabelText(/vertex 1 at/i)).toBeNull()
  })
})

describe("ClipPathEditor — popover trigger label", () => {
  test("shows the box label for a bare box value", () => {
    render(<ClipPathEditor value="border-box" onChange={() => {}} />)
    expect(
      screen.getByRole("button", { name: /edit a clip-path/i }),
    ).toHaveTextContent("border-box")
  })

  test("shows 'none' for a none value", () => {
    render(<ClipPathEditor value="none" onChange={() => {}} />)
    expect(
      screen.getByRole("button", { name: /edit a clip-path/i }),
    ).toHaveTextContent("none")
  })
})
